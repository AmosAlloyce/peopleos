import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Watch the walkthrough', exact: true }).click();
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
          timer = setTimeout(() => reject(new Error('Video did not start within 30 seconds')), 30000);
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
    Math.abs((await video.evaluate((v) => v.duration)) - 90) < 0.2,
    'Video lasts 90 seconds',
  );
  await expect.poll(() => video.evaluate((v) => v.currentTime)).toBeGreaterThan(1);
  await video.evaluate((v) => {
    v.pause();
    v.currentTime = 61;
  });
  await expect.poll(() => video.evaluate((v) => v.seeking), { timeout: 20000 }).toBe(false);
  assert.equal(
    await video.evaluate((v) => v.videoWidth),
    1440,
    'Decoded video has expected resolution',
  );
  await expect.poll(() => video.evaluate((v) => v.textTracks[0]?.cues?.length || 0)).toBe(10);
  await page.screenshot({ path: 'output/review/video-playback.png' });
  const range = await page.request.get(`${base}/demo/peopleos-demo.mp4`, {
    headers: { Range: 'bytes=0-1023' },
  });
  assert.equal(range.status(), 206, 'Video supports byte ranges for seeking');
  console.log(
    'Passed: embedded video decodes, plays, seeks, loads all 10 caption cues, and supports HTTP byte ranges.',
  );
} finally {
  await browser.close();
}
