import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),

  // Parallel across files; API-hitting suites (dashboard, navigation) are
  // marked serial internally to respect Yahoo Finance rate limits.
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['html', { outputFolder: path.join(__dirname, 'report'), open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: path.join(__dirname, 'global-setup.ts'),
  globalTeardown: path.join(__dirname, 'global-teardown.ts'),

  webServer: {
    command: 'npm run dev',
    cwd: path.join(__dirname, '../apps/web'),
    url: 'http://localhost:3000',
    // Reuse a running dev server locally; always start fresh in CI
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      API_BACKEND_URL: 'http://localhost:8080',
      // Empty key → the waitlist route skips Resend entirely (no real emails)
      RESEND_API_KEY: '',
      RESEND_FROM: 'noreply@test.local',
      NOTIFY_EMAIL: '',
      // Clerk env vars — pass through from environment (set in CI secrets or .env.local)
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? '',
    },
  },
});
