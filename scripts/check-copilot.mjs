import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', (e) => console.error('PAGE', e));
page.on('console', (msg) => {
  if (msg.type() === 'error') console.error('CONSOLE', msg.text());
});
try {
  await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:3001'}/app`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: /Meet your people copilot/ }).click();
  await page.getByRole('button', { name: 'What is the leave policy?', exact: true }).click();
  await expect(page.locator('.chat-message.assistant')).toBeVisible();
  await page.getByLabel('Language', { exact: true }).selectOption('fr');
  await page
    .getByRole('textbox', { name: 'Your question' })
    .fill('Quelle est la politique de congé?');
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  await expect(page.locator('.chat-message.assistant')).toHaveCount(2);
  console.log('English and French copilot rendering passed.');
} finally {
  await page.screenshot({ path: 'output/review/copilot-debug.png' });
  await browser.close();
}
