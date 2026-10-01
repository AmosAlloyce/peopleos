/**
 * Records actual browser interactions to the neural narration's measured timing.
 * Start the production app, then:
 * BASE_URL=http://127.0.0.1:3001 BROWSER_PATH=/path/to/chromium npm run record:demo
 * Requires ffmpeg/ffprobe, Playwright's ffmpeg (`npx playwright install ffmpeg`),
 * and a Chromium browser. PLAYWRIGHT_BROWSERS_PATH may point to a custom cache.
 */
import { mkdir, readFile, copyFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

const base = process.env.BASE_URL || 'http://127.0.0.1:3001';
const narration = process.env.NARRATION_PREFIX || 'output/speech/peopleos-neural';
const schedule = JSON.parse(await readFile(`${narration}.json`, 'utf8'));
const chapters = schedule.chapters;
if (!Array.isArray(chapters) || chapters.length !== 10 || !Number.isFinite(schedule.duration))
  throw new Error('Generate the ten-chapter neural narration and timing JSON before recording.');
const chapterById = new Map(chapters.map((item) => [item.id, item]));
const sectionTime = (id, progress = 0) => {
  const item = chapterById.get(id);
  if (!item || progress < 0 || progress > 1) throw new Error(`Invalid chapter position: ${id}`);
  return item.start + item.duration * progress;
};
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
await access(`${narration}.wav`);
await access(`${narration}.vtt`);
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
page.setDefaultNavigationTimeout(45000);
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
  const displayDuration = chapters[index - 1].duration * 1000 - 100;
  await page.evaluate(
    ({ index, title, displayDuration }) => {
      document.getElementById('recording-chapter')?.remove();
      const badge = document.createElement('div');
      badge.id = 'recording-chapter';
      badge.style.cssText =
        'position:fixed;right:22px;bottom:22px;padding:10px 15px;border:1px solid #cbded0;border-radius:7px;background:#f8fff9f5;box-shadow:0 3px 15px #162e1810;color:#54745b;font:500 12px "DM Sans",sans-serif;letter-spacing:.4px;z-index:2147483647;pointer-events:none';
      badge.textContent = `${String(index).padStart(2, '0')} / 10    ${title}`;
      (document.querySelector('dialog[open]') || document.body).appendChild(badge);
      setTimeout(() => badge.remove(), displayDuration);
    },
    { index, title, displayDuration },
  );
  console.log(`${index}/10 ${title}`);
}
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.portfolio-hero')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Warm the app and its session before recording navigation into it.
  const warm = await context.newPage();
  await warm.goto(`${base}/app`, { waitUntil: 'domcontentloaded' });
  await expect(warm.locator('.stats-grid')).toBeVisible();
  await warm.close();
  await page.screencast.start({
    path: 'output/recording/peopleos-neural-browser.webm',
    size: { width: 1440, height: 1000 },
  });
  start = Date.now();
  await chapter(1, 'PeopleOS · An engineering case study');
  await at(sectionTime('introduction', 0.44), async () => {
    await page.getByRole('button', { name: 'Explore People operations', exact: true }).click();
  });
  await at(sectionTime('overview'), async () => {
    await page.goto(`${base}/app`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.stats-grid')).toBeVisible();
    await chapter(2, 'A connected people workspace');
    await page.screenshot({
      path: 'public/demo/workspace.jpg',
      type: 'jpeg',
      quality: 90,
      style: '#recording-chapter { visibility: hidden; }',
    });
  });
  await at(sectionTime('overview', 0.48), async () => {
    await page.locator('.select-control select').selectOption('Kenya');
  });
  await at(sectionTime('overview', 0.76), async () => {
    await page.locator('.select-control select').selectOption('all');
  });
  await at(sectionTime('migration'), async () => {
    await nav('Migration hub');
    await chapter(3, 'From data exceptions to clear next steps');
  });
  await at(sectionTime('migration', 0.42), async () => {
    await page.locator('.table-link').first().click();
  });
  await at(sectionTime('migration', 0.88), async () => {
    await page.keyboard.press('Escape');
  });
  await at(sectionTime('csv-preview'), async () => {
    await page.getByRole('button', { name: 'CSV lab', exact: true }).click();
    await chapter(4, 'Inspect an import before it moves');
    await page.getByRole('button', { name: 'Validate preview', exact: true }).click();
    await expect(page.locator('.import-result')).toBeVisible();
  });
  await at(sectionTime('csv-preview', 0.45), async () => {
    await page.locator('.import-result').scrollIntoViewIfNeeded();
  });
  await at(sectionTime('csv-preview', 0.9), async () => {
    await page.keyboard.press('Escape');
  });
  await at(sectionTime('agent-studio'), async () => {
    await page.getByRole('button', { name: 'Run validation', exact: true }).click();
    await chapter(5, 'Coordinated, inspectable execution');
    await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
    await expect(page.locator('.run-result')).toBeVisible();
  });
  await at(sectionTime('agent-studio', 0.65), async () => {
    await page.screenshot({
      path: 'public/demo/poster.jpg',
      type: 'jpeg',
      quality: 90,
      style: '#recording-chapter { visibility: hidden; }',
    });
  });
  await at(sectionTime('inspect-run'), async () => {
    await page.locator('.canvas-node').nth(3).click();
    await chapter(6, 'Real tool outputs · human review');
  });
  await at(sectionTime('inspect-run', 0.54), async () => {
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Execution log', exact: false }).click();
  });
  await at(sectionTime('approve'), async () => {
    await page.locator('.run-result').scrollIntoViewIfNeeded();
    await chapter(7, 'Review, approve, and reconcile');
  });
  await at(sectionTime('approve', 0.32), async () => {
    await page.getByRole('button', { name: 'Approve changes', exact: true }).click();
    await expect(page.locator('.decision-complete')).toBeVisible();
  });
  await at(sectionTime('approve', 0.68), async () => {
    await nav('Overview');
    await expect(page.locator('.stats-grid')).toContainText('100%');
  });
  await at(sectionTime('service-desk'), async () => {
    await nav('Service desk');
    await chapter(8, 'Specialized workflows for each department');
  });
  await at(sectionTime('service-desk', 0.3), async () => {
    await page.getByRole('button', { name: 'Triage with agents', exact: true }).click();
    await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
    await expect(page.locator('.run-result')).toBeVisible();
  });
  await at(sectionTime('service-desk', 0.78), async () => {
    await page.getByRole('button', { name: /New joiner journey/ }).click();
  });
  await at(sectionTime('copilot'), async () => {
    await page.getByRole('button', { name: /Meet your people copilot/ }).click();
    await chapter(9, 'An assistant you can talk to');
    await page.getByRole('button', { name: 'What is the leave policy?', exact: true }).click();
    await expect(page.locator('.chat-message.assistant')).toBeVisible();
  });
  await at(sectionTime('copilot', 0.45), async () => {
    await page.getByLabel('Language', { exact: true }).selectOption('fr');
    await page
      .getByRole('textbox', { name: 'Your question' })
      .fill('Comment préparer mon arrivée ?');
    await page.getByRole('button', { name: 'Send question', exact: true }).click();
    await expect(page.locator('.chat-message.assistant')).toHaveCount(2);
  });
  await at(sectionTime('audit'), async () => {
    await page.keyboard.press('Escape');
    await nav('Audit trail');
    await chapter(10, 'A decision you can trace');
  });
  await at(sectionTime('audit', 0.65), async () => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
  });
  await at(schedule.duration + 0.3);
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
  'output/recording/peopleos-neural-browser.webm',
  '-i',
  `${narration}.wav`,
  '-i',
  `${narration}.vtt`,
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
  'output/recording/peopleos-neural.mp4',
]);
await copyFile('output/recording/peopleos-neural.mp4', 'public/demo/peopleos-demo.mp4');
await copyFile(`${narration}.vtt`, 'public/demo/peopleos-demo.vtt');
console.log('Recorded and packaged public/demo/peopleos-demo.mp4 with narration and captions.');
