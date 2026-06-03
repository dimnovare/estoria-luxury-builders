import { defineConfig, devices } from '@playwright/test';

/**
 * Standalone config for the live public smoke suite (e2e/smoke-live.spec.ts).
 * Hits estoria.estate directly — no local dev server, no webServer hook — so it
 * can run in CI or locally as a post-deploy sanity check:
 *
 *   npx playwright test --config=playwright.live.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'line',
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
});
