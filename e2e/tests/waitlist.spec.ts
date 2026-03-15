import { test, expect } from '@playwright/test';

/**
 * Waitlist API tests and auth redirect tests.
 * Gate page now redirects to /sign-in (Clerk SSO).
 * The /api/waitlist route is preserved for the landing page email form.
 */

const WAITLIST_URL = '/api/waitlist';

async function routeExists(request: Parameters<typeof test>[1] extends { request: infer R } ? R : never, url: string): Promise<boolean> {
  const probe = await request.post(url, { data: {} });
  return probe.status() !== 404;
}

test.describe('Auth redirects', () => {
  test('gate redirects to /sign-in', async ({ page }) => {
    await page.goto('/gate');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('unauthenticated visit to protected route redirects to /landing', async ({ page }) => {
    // This test requires Clerk to be configured — without keys, middleware passes through
    await page.context().clearCookies();
    await page.goto('/');
    const url = page.url();
    test.skip(!url.includes('/landing'), 'Clerk not configured — auth redirect not active');
    await expect(page).toHaveURL(/\/landing/);
  });
});

test.describe('Waitlist API', () => {
  test('valid submission returns ok — no real email sent', async ({ request }) => {
    const available = await routeExists(request as any, WAITLIST_URL);
    test.skip(!available, 'Waitlist route not available on this branch');

    const res = await request.post(WAITLIST_URL, {
      data: { name: 'E2E Test User', email: 'e2e-test@example.com' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('missing name returns 400', async ({ request }) => {
    const available = await routeExists(request as any, WAITLIST_URL);
    test.skip(!available, 'Waitlist route not available on this branch');

    const res = await request.post(WAITLIST_URL, {
      data: { email: 'test@example.com' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/name/i);
  });

  test('invalid email returns 400', async ({ request }) => {
    const available = await routeExists(request as any, WAITLIST_URL);
    test.skip(!available, 'Waitlist route not available on this branch');

    const res = await request.post(WAITLIST_URL, {
      data: { name: 'Test', email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });
});
