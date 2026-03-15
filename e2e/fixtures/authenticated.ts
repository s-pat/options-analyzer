import { test as base } from '@playwright/test';

/**
 * Extends the base `test` with an authenticated `page` fixture.
 *
 * Uses Clerk's testing token to bypass SSO for E2E tests.
 * Requires CLERK_SECRET_KEY env var — clerkSetup() in globalSetup fetches the token automatically.
 *
 * When Clerk is not configured, authenticated tests are skipped.
 */
export const test = base.extend<{ page: ReturnType<typeof base['extend']> }>({
  page: async ({ page }, use) => {
    // Set up Clerk testing token when available.
    // clerkSetup() in globalSetup fetches the token via CLERK_SECRET_KEY;
    // setupClerkTestingToken() injects it into the page.
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const { setupClerkTestingToken } = await import('@clerk/testing/playwright');
        await setupClerkTestingToken({ page });
      } catch {
        // Clerk setup not available — will skip below
      }
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // If we ended up on /landing, /sign-in, or /waitlist, auth isn't working — skip
    const url = page.url();
    if (url.includes('/landing') || url.includes('/sign-in') || url.includes('/waitlist')) {
      base.skip(true, 'Clerk authentication required — set CLERK_TESTING_TOKEN to run authenticated tests');
    }

    await use(page as any);
  },
});

export { expect } from '@playwright/test';
