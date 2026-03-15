import { test, expect } from '../fixtures/authenticated';

const pages = [
  { label: "Today's Picks", url: '/today', heading: /today/i },
  { label: 'Screener', url: '/screener', heading: /screener/i },
  { label: 'Options', url: '/options', heading: /options/i },
  { label: 'Backtest', url: '/backtest', heading: /backtest/i },
];

test.describe.configure({ mode: 'serial' });

test.describe('Navigation', () => {
  test.setTimeout(60_000);

  for (const { label, url, heading } of pages) {
    test(`clicking "${label}" navigates to ${url}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      // Use exact match to avoid ambiguity (e.g. "Options" vs "Learn Options")
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByText(heading).first()).toBeVisible();
    });
  }

  test('direct navigation to each page returns 200', async ({ page }) => {
    for (const { url } of pages) {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBeLessThan(400);
    }
  });

  test('unknown route shows 404 or redirects gracefully', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });
});
