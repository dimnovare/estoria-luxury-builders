import { defineConfig, devices } from '@playwright/test';

/**
 * Standalone config for the live public smoke suite (e2e/smoke-live.spec.ts).
 * Hits estoria.estate directly — no local dev server, no webServer hook — so it
 * can run in CI or locally as a post-deploy sanity check, on BOTH desktop and a
 * 393px phone viewport:
 *
 *   npx playwright test --config=playwright.live.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'smoke-live.spec.ts',
  fullyParallel: true,
  retries: 1,
  reporter: 'line',
  use: {
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
