import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const screenshotDirectory = process.env.PORTFOLIO_SCREENSHOTS || '/tmp/peopleos-portfolio-review';
await mkdir(screenshotDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const page = await browser.newPage();
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));

try {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await expect(page.locator('.portfolio-hero h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      body: document.body.scrollWidth,
      portfolio: document.querySelector('.portfolio').scrollWidth,
    }));
    assert.ok(
      dimensions.body <= width + 1 && dimensions.portfolio <= width + 1,
      `Horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`,
    );

    const textOverflow = await page
      .locator('.portfolio')
      .evaluate((element) =>
        [...element.querySelectorAll('h1,h2,h3,p,button')]
          .filter((node) => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2)
          .map((node) => ({
            text: node.textContent.slice(0, 65),
            width: node.clientWidth,
            scroll: node.scrollWidth,
          })),
      );
    assert.deepEqual(textOverflow, [], `Text clipped at ${width}px`);
    try {
      await page.screenshot({ path: `${screenshotDirectory}/portfolio-viewport-${width}.png` });
      await page.screenshot({
        path: `${screenshotDirectory}/portfolio-${width}.png`,
        fullPage: true,
      });
    } catch (error) {
      console.log(`Screenshot unavailable at ${width}px: ${error.message.split('\n')[0]}`);
    }

    await expect(page.locator('.portfolio video')).toHaveCount(0);
    const data = page.getByRole('button', { name: 'Explore Data & migration', exact: true });
    const people = page.getByRole('button', { name: 'Explore People operations', exact: true });
    await data.click();
    await expect(data).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.portfolio-system-detail')).toContainText('move with confidence');
    await people.click();
    await expect(people).toHaveAttribute('aria-pressed', 'true');
    await expect(data).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.portfolio-system-detail')).toContainText('better first day');

    const opener = page.getByRole('button', { name: 'Watch the walkthrough', exact: true });
    await opener.click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await expect(page.locator('.portfolio video')).toHaveCount(1);
    await expect(page.locator('.portfolio video track')).toHaveAttribute('kind', 'captions');
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator('.portfolio video')).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await page.getByRole('button', { name: 'Close recorded walkthrough', exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(opener).toBeFocused();

    if (width <= 600) {
      await page.locator('.portfolio-menu-toggle').click();
      await expect(page.locator('.portfolio-menu-toggle')).toHaveAttribute('aria-expanded', 'true');
      await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'About', exact: true })
        .click();
      await expect(page.locator('.portfolio-menu-toggle')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await expect(page).toHaveURL(/#about$/);
    }
    console.log(
      `PASS ${width}px: layout, controls, video dialog, keyboard focus${width <= 600 ? ', mobile navigation' : ''}`,
    );
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const animationName = await page
    .locator('.portfolio-connector.is-active')
    .evaluate((element) => getComputedStyle(element).animationName);
  assert.equal(animationName, 'none', 'Reduced-motion preference disables flow animation');
  assert.deepEqual(runtimeErrors, [], 'Portfolio has no uncaught runtime errors');
  console.log(`PASS reduced motion and runtime checks. Screenshots: ${screenshotDirectory}`);
} finally {
  await browser.close();
}
