import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('output/review', { recursive: true });
async function navigate(label) {
  console.log(`Checking ${label}`);
  await page.locator('.sidebar nav').getByRole('button', { name: label, exact: false }).click();
}
async function snapshot(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `output/review/${name}.png`, fullPage: true });
}
try {
  await page.goto(`${base}/app`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'A good day to make an impact.' })).toBeVisible();
  await expect(page.locator('.stat-value').first()).toHaveText('48');
  await snapshot('workspace-desktop');
  await page.screenshot({
    path: 'public/demo/workspace.jpg',
    type: 'jpeg',
    quality: 93,
    fullPage: true,
  });
  await navigate('People directory');
  await page.getByRole('textbox', { name: 'Search people' }).fill('Wanjiku');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: /Wanjiku Mwangi/ }).click();
  await expect(page.getByRole('dialog', { name: 'Employee profile' })).toBeVisible();
  await page.keyboard.press('Escape');
  await navigate('Migration hub');
  await page.getByRole('button', { name: 'CSV lab', exact: true }).click();
  await page.getByRole('button', { name: 'Validate preview', exact: true }).click();
  await expect(page.locator('.import-result')).toBeVisible();
  await expect(page.locator('.import-result-stats')).toContainText('2rows parsed');
  await expect(page.locator('.import-result-stats')).toContainText('0employee writes');
  await expect(page.locator('.import-result table')).toContainText('startDate');
  await snapshot('csv-preview');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Run validation', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Good systems work together.' })).toBeVisible();
  await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeVisible();
  await expect(page.locator('.run-result')).toContainText('16 reviewed data corrections');
  await page.locator('.canvas-node').nth(3).click();
  await expect(page.getByRole('dialog')).toContainText('240 checks executed');
  await expect(page.locator('.tool-output')).toContainText('employeeId');
  await page.keyboard.press('Escape');
  await page.evaluate(() => scrollTo(0, 0));
  await snapshot('workflow-executed');
  await page.screenshot({ path: 'public/demo/poster.jpg', type: 'jpeg', quality: 93 });
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click();
  await expect(page.locator('.decision-complete')).toContainText('Demo changes applied');
  await navigate('Overview');
  await expect(page.locator('.stats-grid')).toContainText('100%');
  await navigate('Service desk');
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  await page
    .getByLabel('Subject', { exact: true })
    .fill('Please review my synthetic starter profile');
  await page.getByLabel('Category', { exact: true }).selectOption('Onboarding');
  await page.getByLabel('Country', { exact: true }).selectOption('Kenya');
  await page
    .getByLabel('Description', { exact: true })
    .fill('A fictional onboarding checklist needs a People Operations review.');
  await page.getByRole('button', { name: 'Create request', exact: true }).click();
  await expect(page.locator('.ticket-list')).toContainText(
    'Please review my synthetic starter profile',
  );
  await page.getByRole('button', { name: 'Triage with agents', exact: true }).click();
  await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
  await expect(page.locator('.run-result')).toContainText('Route 6 sample support requests');
  await page.getByRole('button', { name: 'Approve changes', exact: true }).click();
  await expect(page.locator('.decision-complete')).toBeVisible();
  for (const workflow of ['New joiner journey', 'Payroll readiness']) {
    await page.getByRole('button', { name: new RegExp(workflow) }).click();
    await page.getByRole('button', { name: 'Run workflow', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Approve changes', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Reject proposal', exact: true }).click();
    await expect(page.locator('.decision-complete')).toContainText('No changes');
  }
  await navigate('People insights');
  await expect(page.locator('.quality-number')).toHaveText('100%');
  await snapshot('insights-desktop');
  await navigate('Audit trail');
  await expect(page.locator('.audit-list')).toContainText('Workflow approved');
  await page.getByRole('button', { name: /Meet your people copilot/ }).click();
  await page.getByRole('button', { name: 'What is the leave policy?', exact: true }).click();
  await expect(page.locator('.chat-message.assistant')).toContainText('sample handbook');
  await page.getByLabel('Language', { exact: true }).selectOption('fr');
  await page
    .getByRole('textbox', { name: 'Your question' })
    .fill('Quelle est la politique de congé?');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  await expect(page.locator('.chat-message.assistant')).toHaveCount(2);
  await snapshot('copilot-desktop');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: 'Search workspace' }).fill('migration');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Migration hub', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'A better move starts here.' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download source CSV', exact: false }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /\.csv$/);
  await download.saveAs('output/review/export.csv');
  const second = await browser.newContext();
  const other = await second.newPage();
  await other.goto(`${base}/app`, { waitUntil: 'networkidle' });
  await expect(other.locator('.stat-value').nth(2)).toHaveText('67%');
  await second.close();
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/app`, { waitUntil: 'networkidle' });
    await expect(page.locator('.stats-grid')).toBeVisible();
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `Overview overflow at ${width}`,
    );
    await snapshot(`workspace-${width}`);
    for (const [route, title] of [
      ['people', 'Every person. One place.'],
      ['migration', 'A better move starts here.'],
      ['workflows', 'Good systems work together.'],
      ['service-desk', 'Support that feels human.'],
      ['insights', 'A clearer picture of your people.'],
      ['audit', 'Every action has a story.'],
    ]) {
      await page.goto(`${base}/app/${route}`, { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${route} overflow at ${width}`,
      );
    }
    if (width < 760) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await expect(page.locator('.sidebar')).toHaveClass(/is-open/);
      await navigate('Overview');
      await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/);
    }
  }
  assert.deepEqual(errors, [], 'No uncaught page errors');
  console.log(
    'Passed: all 7 sections, CSV dry run, all 4 workflows, approvals/rejections, support creation, EN/FR chat, search/export, isolated sessions, 5 viewport sizes.',
  );
} finally {
  await context.close();
  await browser.close();
}
