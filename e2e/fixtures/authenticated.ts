import { test as base } from '@playwright/test';

/**
 * Extends the base `test` with an authenticated `page` fixture.
 *
 * - If the app has no gate (current main branch): navigates straight through.
 * - If feature/beta-gate is active: detects the /gate redirect and submits
 *   the E2E password automatically, so all downstream tests get a real session.
 */
export const test = base.extend<{ page: ReturnType<typeof base['extend']> }>({
  page: async ({ page }, use) => {
    await page.goto('/');

    if (page.url().includes('/gate')) {
      const password = process.env.E2E_PREVIEW_PASSWORD ?? 'e2e-test-password';
      await page.locator('input[type="password"]').fill(password);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('/');
    }

    await use(page as any);
  },
});

export { expect } from '@playwright/test';
