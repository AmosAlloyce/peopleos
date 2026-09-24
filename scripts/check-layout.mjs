import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
});
const page = await browser.newPage();
try {
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      'people',
      'migration',
      'workflows',
      'service-desk',
      'insights',
      'audit',
      '',
    ]) {
      await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:3001'}/app/${route}`, {
        waitUntil: 'networkidle',
      });
      await expect(page.locator('.page-heading')).toBeVisible();
      const result = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        elements: [...document.body.querySelectorAll('*')]
          .filter(
            (e) => !e.closest('.table-scroll') && e.getBoundingClientRect().right > innerWidth + 1,
          )
          .map((e) => ({
            tag: e.tagName,
            class: e.className,
            right: e.getBoundingClientRect().right,
            text: e.textContent?.slice(0, 50),
          }))
          .slice(0, 15),
      }));
      if (result.scroll > width + 1) {
        console.log(JSON.stringify(result, null, 2));
        await page.screenshot({
          path: `output/review/overflow-${width}-${route || 'overview'}.png`,
        });
        throw Error(`Overflow: ${width}px ${route}`);
      }
      console.log(`PASS ${width}px /app/${route}`);
    }
  }
} finally {
  await browser.close();
}
