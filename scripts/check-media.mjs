import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
const base = (process.env.BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const mediaFile = process.env.MEDIA_FILE || 'peopleos-demo.mp4';
const opener = process.env.VIDEO_BUTTON || 'Watch the walkthrough';
const narration = process.env.NARRATION_PREFIX || 'output/speech/peopleos-neural';
const schedule = JSON.parse(await readFile(`${narration}.json`, 'utf8'));
const utterances = schedule.chapters.flatMap((chapter) => chapter.passages);
assert.ok(schedule.duration > 0 && utterances.length > 0, 'Narration has a measured schedule');
for (const [index, utterance] of utterances.entries()) {
  assert.ok(utterance.start >= 0 && utterance.end > utterance.start);
  assert.ok(utterance.end <= schedule.duration, 'Captions end within the recording');
  if (index) assert.ok(utterance.start >= utterances[index - 1].end, 'Captions do not overlap');
}
await mkdir('output/review', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: opener, exact: true }).click();
  const video = page.locator('video');
  await expect(video).toBeVisible();
  // Metadata preload need not download a frame until playback is requested.
  // Trigger playback explicitly, including when a browser blocks audible autoplay.
  await video.evaluate(async (v) => {
    v.muted = true;
    let timer;
    try {
      await Promise.race([
        v.play(),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Video did not start within 30 seconds')),
            30000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  });
  await expect
    .poll(() => video.evaluate((v) => v.readyState), { timeout: 20000 })
    .toBeGreaterThanOrEqual(2);
  assert.ok(
    Math.abs((await video.evaluate((v) => v.duration)) - schedule.duration) < 0.2,
    'Video matches the natural narration duration',
  );
  await expect.poll(() => video.evaluate((v) => v.currentTime), { timeout: 20000 }).toBeGreaterThan(1);
  await video.evaluate((v, target) => {
    v.pause();
    v.currentTime = target;
  }, schedule.chapters[6].start + 1);
  await expect.poll(() => video.evaluate((v) => v.seeking), { timeout: 20000 }).toBe(false);
  assert.equal(
    await video.evaluate((v) => v.videoWidth),
    1440,
    'Decoded video has expected resolution',
  );
  await expect
    .poll(() => video.evaluate((v) => v.textTracks[0]?.cues?.length || 0))
    .toBe(utterances.length);
  const cues = await video.evaluate((v) =>
    Array.from(v.textTracks[0].cues, (cue) => ({
      start: cue.startTime,
      end: cue.endTime,
      text: cue.text,
    })),
  );
  for (const [index, cue] of cues.entries()) {
    assert.ok(
      Math.abs(cue.start - utterances[index].start) < 0.002,
      'Caption starts align to speech',
    );
    assert.ok(Math.abs(cue.end - utterances[index].end) < 0.002, 'Caption ends align to speech');
    assert.equal(cue.text, utterances[index].text, 'Caption text matches the narrated script');
  }
  await page.screenshot({ path: `output/review/${mediaFile}-playback.png` });
  const range = await page.request.get(`${base}/demo/${mediaFile}`, {
    headers: { Range: 'bytes=0-1023' },
  });
  assert.equal(range.status(), 206, 'Video supports byte ranges for seeking');
  console.log(
    `Passed: ${schedule.duration.toFixed(2)}s embedded video decodes, plays, seeks, aligns all ${utterances.length} caption cues, and supports HTTP byte ranges.`,
  );
} finally {
  await browser.close();
}
