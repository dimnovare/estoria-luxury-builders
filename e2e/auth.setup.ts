import { test as setup, expect } from '@playwright/test';

/**
 * Authenticate ONCE and persist storage state, so the admin specs reuse the token
 * instead of logging in per test (which floods the login rate-limiter). Produces
 * e2e/.auth/admin.json, referenced by the desktop/mobile projects.
 */
const AUTH_FILE = 'e2e/.auth/admin.json';
const ADMIN_EMAIL = 'dim.novare@gmail.com';
const ADMIN_PASSWORD = 'demo1234';

setup('authenticate', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' });

  // Decline cookie consent first — it can overlay the login button on mobile.
  const decline = page.getByRole('button', { name: /decline|keeldu|отклон/i }).first();
  if (await decline.count()) await decline.click().catch(() => {});

  await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_EMAIL);
  const pw = page.locator('input[type="password"]').first();
  await pw.fill(ADMIN_PASSWORD);
  const submit = page.getByRole('button', { name: /log ?in|logi sisse|sign in|войти/i }).first();
  if (await submit.count()) await submit.click();
  else await pw.press('Enter');

  // Login succeeded once the login form is gone.
  await expect(page.locator('input[type="password"]')).toHaveCount(0, { timeout: 20_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
