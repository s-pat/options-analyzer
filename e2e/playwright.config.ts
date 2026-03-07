import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),

  // Run tests sequentially — Yahoo Finance has rate limits
  fullyParallel: false,
  workers: 1,

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
      // Beta-gate credentials — used once feature/beta-gate is merged
      PREVIEW_PASSWORD: process.env.E2E_PREVIEW_PASSWORD ?? 'e2e-test-password',
      JWT_SECRET: process.env.E2E_JWT_SECRET ?? 'e2e-jwt-secret-for-testing-only!!',
    },
  },
});
