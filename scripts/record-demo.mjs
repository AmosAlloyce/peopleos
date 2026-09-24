/**
 * Records actual browser interactions and muxes the offline narration/captions.
 * Start the production app, then:
 * BASE_URL=http://127.0.0.1:3001 BROWSER_PATH=/path/to/chromium npm run record:demo
 * Requires ffmpeg/ffprobe, Playwright's ffmpeg (`npx playwright install ffmpeg`),
 * and a Chromium browser. PLAYWRIGHT_BROWSERS_PATH may point to a custom cache.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const schedule = JSON.parse(await readFile('docs/demo-narration.json', 'utf8'));
await mkdir('output/recording', { recursive: true });
await mkdir('public/demo', { recursive: true });
const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
try {
  await access('output/demo-narration.wav');
} catch {
  await runCommand('python3', [
    'scripts/generate-narration.py',
    'docs/demo-narration.json',
    'output/demo-narration.wav',
  ]);
}
const timestamp = (seconds) =>
  `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.000`;
await writeFile(
  'public/demo/peopleos-demo.vtt',
  'WEBVTT\n\nNOTE\nGeneric offline synthetic narration. All employee data is fictional.\n\n' +
    schedule.segments
      .map(
        (s, i) =>
          `${i + 1}\n${timestamp(s.start)} --> ${timestamp(s.start + s.duration)}\n${s.text}\n`,
      )
      .join('\n'),
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
let start;
async function at(seconds, action) {
  const delay = start + seconds * 1000 - Date.now();
  if (delay > 0) await page.waitForTimeout(delay);
  else if (delay < -1500)
    throw new Error(
      `Recording fell behind at ${seconds}s (${Math.round(-delay)}ms). Retry with fewer competing processes.`,
    );
  if (action) await action();
}
async function nav(name) {
  await page.locator('.sidebar nav').getByRole('button', { name, exact: false }).click();
}
async function chapter(index, title) {
  await page.evaluate(
    ({ index, title }) => {
      document.getElementById('recording-chapter')?.remove();
      const badge = document.createElement('div');
      badge.id = 'recording-chapter';
      badge.style.cssText =
        'position:fixed;right:22px;bottom:22px;padding:10px 15px;border:1px solid #cbded0;border-radius:7px;background:#f8fff9f5;box-shadow:0 3px 15px #162e1810;color:#54745b;font:500 12px Arial,sans-serif;letter-spacing:.4px;z-index:2147483647;pointer-events:none';
      badge.textContent = `${String(index).padStart(2, '0')} / 10    ${title}`;
      (document.querySelector('dialog[open]') || document.body).appendChild(badge);
      setTimeout(() => badge.remove(), 8500);
    },
    { index, title },
  );
  console.log(`${index}/10 ${title}`);
}
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Warm the app and its session before recording navigation into it.
  const warm = await context.newPage();
  await warm.goto(`${base}/app`, { waitUntil: 'networkidle' });
  await expect(warm.locator('.stats-grid')).toBeVisible();
  await warm.close();
  await page.screencast.start({
    path: 'output/recording/peopleos-browser.webm',
    size: { width: 1440, height: 1000 },
  });
  start = Date.now();
  await chapter(1, 'PeopleOS · An engineering case study');
  await at(5, async () => {
    await page.getByRole('button', { name: 'Explore People operations', exact: true }).click();
  });
  await at(9, async () => {
    await page.goto(`${base}/app`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.stats-grid')).toBeVisible();
    await chapter(2, 'A connected people workspace');
  });
  await at(14, async () => {
    await page.locator('.select-control select').selectOption('Kenya');
  });
  await at(16, async () => {
    await page.locator('.select-control select').selectOption('all');
  });
  await at(18, async () => {
    await nav('Migration hub');
    await chapter(3, 'From data exceptions to clear next steps');
  });
  await at(22, async () => {
    await page.locator('.table-link').first().click();
  });
  await at(25, async () => {
    await page.keyboard.press('Escape');
  });
  await at(27, async () => {
    await page.getByRole('button', { name: 'CSV lab', exact: true }).click();
    await chapter(4, 'Inspect an import before it moves');
    await page.getByRole('button', { name: 'Validate preview', exact: true }).click();
    await expect(page.locator('.import-result')).toBeVisible();
  });
  await at(31, async () => {
    await page.locator('.import-result').scrollIntoViewIfNeeded();
  });
  await at(35, async () => {
    await page.keyboard.press('Escape');
  });
  await at(36, async () => {
    await page.getByRole('button', { name: 'Run validation', exact: true }).click();
    await chapter(5, 'Coordinated, inspectable execution');
    await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
    await expect(page.locator('.run-result')).toBeVisible();
  });
  await at(45, async () => {
    await page.locator('.canvas-node').nth(3).click();
    await chapter(6, 'Real tool outputs · human review');
  });
  await at(50, async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Execution log', exact: false }).click();
  });
  await at(54, async () => {
    await page.locator('.run-result').scrollIntoViewIfNeeded();
    await chapter(7, 'Review, approve, and reconcile');
  });
  await at(57, async () => {
    await page.getByRole('button', { name: 'Approve changes', exact: true }).click();
    await expect(page.locator('.decision-complete')).toBeVisible();
  });
  await at(60, async () => {
    await nav('Overview');
    await expect(page.locator('.stats-grid')).toContainText('100%');
  });
  await at(63, async () => {
    await nav('Service desk');
    await chapter(8, 'Specialized workflows for each department');
  });
  await at(66, async () => {
    await page.getByRole('button', { name: 'Triage with agents', exact: true }).click();
    await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
    await expect(page.locator('.run-result')).toBeVisible();
  });
  await at(70, async () => {
    await page.getByRole('button', { name: /New joiner journey/ }).click();
  });
  await at(72, async () => {
    await page.getByRole('button', { name: /Meet your people copilot/ }).click();
    await chapter(9, 'An assistant you can talk to');
    await page.getByRole('button', { name: 'What is the leave policy?', exact: true }).click();
    await expect(page.locator('.chat-message.assistant')).toBeVisible();
  });
  await at(76, async () => {
    await page.getByLabel('Language', { exact: true }).selectOption('fr');
    await page
      .getByRole('textbox', { name: 'Your question' })
      .fill('Comment préparer mon arrivée ?');
    await page.getByRole('button', { name: 'Send question', exact: true }).click();
    await expect(page.locator('.chat-message.assistant')).toHaveCount(2);
  });
  await at(81, async () => {
    await page.keyboard.press('Escape');
    await nav('Audit trail');
    await chapter(10, 'A decision you can trace');
  });
  await at(87, async () => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
  });
  await at(90);
  await page.screencast.stop();
} finally {
  await page.screencast.stop().catch(() => {});
  await context.close();
  await browser.close();
}
await runCommand('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'warning',
  '-y',
  '-i',
  'output/recording/peopleos-browser.webm',
  '-i',
  'output/demo-narration.wav',
  '-i',
  'public/demo/peopleos-demo.vtt',
  '-map',
  '0:v:0',
  '-map',
  '1:a:0',
  '-map',
  '2:s:0',
  '-vf',
  'fps=25,format=yuv420p',
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '18',
  '-threads',
  '2',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-c:s',
  'mov_text',
  '-metadata:s:s:0',
  'language=eng',
  '-metadata',
  'title=PeopleOS — A working HR systems demonstration',
  '-t',
  String(schedule.duration),
  '-movflags',
  '+faststart',
  'public/demo/peopleos-demo.mp4',
]);
console.log('Recorded and packaged public/demo/peopleos-demo.mp4 with narration and captions.');
