import { test, expect } from '@playwright/test';

/**
 * Waitlist + gate tests.
 * These require feature/beta-gate to be merged — they are automatically
 * skipped on branches where the /api/waitlist and /gate routes don't exist.
 */

const GATE_URL = '/gate';
const WAITLIST_URL = '/api/waitlist';

async function routeExists(request: Parameters<typeof test>[1] extends { request: infer R } ? R : never, url: string): Promise<boolean> {
  const probe = await request.post(url, { data: {} });
  return probe.status() !== 404;
}

test.describe('Gate & auth (requires feature/beta-gate)', () => {
  test('gate page exists and requires password', async ({ page, request }) => {
    const hasGate = (await page.goto(GATE_URL))?.status() !== 404;
    test.skip(!hasGate, 'Gate page not available on this branch');

    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('wrong password shows error', async ({ page }) => {
    const res = await page.goto(GATE_URL);
    test.skip(res?.status() === 404, 'Gate page not available on this branch');

    await page.locator('input[type="password"]').fill('wrong-password-123');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 5_000 });
  });

  test('correct password grants access and sets session', async ({ page }) => {
    const res = await page.goto(GATE_URL);
    test.skip(res?.status() === 404, 'Gate page not available on this branch');

    const password = process.env.E2E_PREVIEW_PASSWORD ?? 'e2e-test-password';
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('/');
    await expect(page.getByText('OptionsLab').first()).toBeVisible();
  });

  test('unauthenticated request is redirected to gate', async ({ page }) => {
    // Clear cookies to simulate a fresh unauthenticated visit
    await page.context().clearCookies();
    await page.goto('/');

    // If gate is active, should redirect
    const gateRes = await page.goto(GATE_URL);
    test.skip(gateRes?.status() === 404, 'Gate not available on this branch');

    await page.context().clearCookies();
    await page.goto('/');
    await expect(page).toHaveURL(/landing/);
  });
});

test.describe('Waitlist (requires feature/beta-gate)', () => {
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
