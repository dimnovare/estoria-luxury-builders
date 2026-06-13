import { defineConfig, devices } from '@playwright/test';

/**
 * Admin E2E against a LOCAL stack (not CI — needs Postgres + API + the dev server
 * + the seeded admin). Bring the stack up first, then:
 *
 *   Postgres 5434, API http://localhost:5247, FE http://localhost:8081
 *   npx playwright test --config=playwright.admin.config.ts
 *
 * Logs in with the seeded local admin and exercises the core admin flows on both
 * desktop and a phone viewport.
 */
const AUTH_FILE = 'e2e/.auth/admin.json';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      testMatch: 'admin.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      testMatch: 'admin.spec.ts',
      use: { ...devices['Pixel 5'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
});
