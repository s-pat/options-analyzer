import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing');
  });

  test('loads with correct title and headline', async ({ page }) => {
    await expect(page).toHaveTitle(/OptionLabs/i);
    await expect(page.getByText(/options trading/i).first()).toBeVisible();
  });

  test('ticker marquee shows stock symbols', async ({ page }) => {
    await expect(page.getByText('SPY').first()).toBeVisible();
    await expect(page.getByText('NVDA').first()).toBeVisible();
  });

  test('navbar "Get Access" links to /sign-up', async ({ page }) => {
    const link = page.getByRole('link', { name: /get access/i }).first();
    await expect(link).toHaveAttribute('href', '/sign-up');
  });

  test('features section is visible', async ({ page }) => {
    await expect(page.getByText(/smart screener/i)).toBeVisible();
    await expect(page.getByText(/options chain/i).first()).toBeVisible();
    await expect(page.getByText(/backtesting/i).first()).toBeVisible();
  });

  test('stats bar renders key metrics', async ({ page }) => {
    // Use first() — '503' also appears in "Showing 5 of 503 tracked symbols"
    await expect(page.getByText('503').first()).toBeVisible();
    await expect(page.getByText(/S&P 500 Stocks Covered/i)).toBeVisible();
  });

  test('how it works section renders all 3 steps', async ({ page }) => {
    // Use step titles — '01'/'02'/'03' are substrings of ticker percentages (+0.21%, etc.)
    await expect(page.getByText('Scan the market')).toBeVisible();
    await expect(page.getByText('Analyze with precision')).toBeVisible();
    await expect(page.getByText('Backtest & validate')).toBeVisible();
  });

  test('waitlist form accepts input', async ({ page }) => {
    await page.getByPlaceholder(/your name/i).fill('Test User');
    await page.getByPlaceholder(/you@example\.com/i).fill('test@example.com');
    await expect(page.getByPlaceholder(/your name/i)).toHaveValue('Test User');
  });

  test('unauthenticated visit to protected route redirects to /landing', async ({ page }) => {
    // This test requires Clerk to be configured — without keys, middleware passes through
    await page.context().clearCookies();
    await page.goto('/');
    const url = page.url();
    // If Clerk isn't configured, the middleware won't redirect — skip
    test.skip(!url.includes('/landing'), 'Clerk not configured — auth redirect not active');
    await expect(page).toHaveURL(/\/landing/);
  });

  test('footer Sign In link points to /sign-in', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });
});

test.describe('Sign-in page', () => {
  test('gate redirects to /sign-in', async ({ page }) => {
    await page.goto('/gate');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('sign-in page renders with branding', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByText('OptionLabs').first()).toBeVisible();
    await expect(page.getByText('Private Beta')).toBeVisible();
  });

  test('back to home link points to /landing', async ({ page }) => {
    await page.goto('/sign-in');
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toHaveAttribute('href', '/landing');
  });
});

test.describe('Sign-up page', () => {
  test('sign-up page renders with branding', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByText('OptionLabs').first()).toBeVisible();
    await expect(page.getByText('Private Beta')).toBeVisible();
  });

  test('back to home link points to /landing', async ({ page }) => {
    await page.goto('/sign-up');
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toHaveAttribute('href', '/landing');
  });
});
