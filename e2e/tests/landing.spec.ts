import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing');
  });

  test('loads with correct title and headline', async ({ page }) => {
    await expect(page).toHaveTitle(/OptionsLab/i);
    await expect(page.getByText(/options trading/i).first()).toBeVisible();
  });

  test('ticker marquee shows stock symbols', async ({ page }) => {
    await expect(page.getByText('SPY').first()).toBeVisible();
    await expect(page.getByText('NVDA').first()).toBeVisible();
  });

  test('navbar "Get Access" links to /gate', async ({ page }) => {
    const link = page.getByRole('link', { name: /get access/i }).first();
    await expect(link).toHaveAttribute('href', '/gate');
  });

  test('features section is visible', async ({ page }) => {
    await expect(page.getByText(/smart screener/i)).toBeVisible();
    await expect(page.getByText(/options chain/i).first()).toBeVisible();
    await expect(page.getByText(/backtesting/i).first()).toBeVisible();
  });

  test('stats bar renders key metrics', async ({ page }) => {
    await expect(page.getByText('503')).toBeVisible();
    await expect(page.getByText(/S&P 500 Stocks Covered/i)).toBeVisible();
  });

  test('how it works section renders all 3 steps', async ({ page }) => {
    await expect(page.getByText('01')).toBeVisible();
    await expect(page.getByText('02')).toBeVisible();
    await expect(page.getByText('03')).toBeVisible();
  });

  test('waitlist form accepts input', async ({ page }) => {
    await page.getByPlaceholder(/your name/i).fill('Test User');
    await page.getByPlaceholder(/you@example\.com/i).fill('test@example.com');
    await expect(page.getByPlaceholder(/your name/i)).toHaveValue('Test User');
  });

  test('unauthenticated visit to protected route redirects to /landing', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await expect(page).toHaveURL(/\/landing/);
  });

  test('gate page link in footer works', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInLink).toHaveAttribute('href', '/gate');
  });
});

test.describe('Gate page (redesign)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gate');
  });

  test('renders password tab by default', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /enter dashboard/i })).toBeVisible();
  });

  test('switches to request access tab', async ({ page }) => {
    // Use exact match — the tab label is "Request access"; the inline link is "Request access →"
    await page.getByRole('button', { name: 'Request access', exact: true }).click();
    await expect(page.getByPlaceholder(/your name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example\.com/i)).toBeVisible();
  });

  test('back to home link points to /landing', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toHaveAttribute('href', '/landing');
  });

  test('password show/hide toggle works', async ({ page }) => {
    const input = page.locator('input[type="password"]');
    await expect(input).toBeVisible();
    await page.getByRole('button', { name: /show password/i }).click();
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});
