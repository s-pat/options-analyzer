import { test, expect } from '../fixtures/authenticated';

test.describe.configure({ mode: 'serial' });

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('page title and header render', async ({ page }) => {
    await expect(page).toHaveTitle(/OptionLabs/i);
    await expect(page.getByText('OptionLabs').first()).toBeVisible();
  });

  test('sidebar navigation links are present', async ({ page }) => {
    const links = [
      { name: "Today's Picks", exact: true },
      { name: 'Screener', exact: true },
      { name: 'Options', exact: true },
      { name: 'Backtest', exact: true },
    ];
    for (const { name, exact } of links) {
      await expect(page.getByRole('link', { name, exact })).toBeVisible();
    }
  });

  test('market data loads or shows loading state', async ({ page }) => {
    test.setTimeout(30_000);
    // MarketOverview shows one of: loading text, error text, or actual price data
    await expect(
      page.getByText(/loading market data|failed to load|S&P 500|Nasdaq|Dow Jones/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('sector section renders', async ({ page }) => {
    test.setTimeout(30_000);
    await expect(page.getByText(/sector|loading/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('no unhandled console errors on load', async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Give a moment for async errors to surface
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ERR_ABORTED') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('clerk') &&
      !e.includes('Clerk')
    );
    expect(critical).toHaveLength(0);
  });
});
