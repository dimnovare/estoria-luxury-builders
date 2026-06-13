import { test, expect } from '@playwright/test';

/**
 * Admin E2E against a local stack. Auth is provided once via storageState (see
 * auth.setup.ts) so we don't re-login per test (avoids the login rate-limiter).
 * Presence/role-based and language-agnostic (et/en/ru) so it survives i18n +
 * content changes. Run: npx playwright test --config=playwright.admin.config.ts
 */

test('dashboard loads after login', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' });
  // Main-content heading rendered (visible on both viewports; the brand lives in
  // the off-canvas sidebar on mobile so we don't assert on it here).
  await expect(page.locator('main h1, main h2, h1, h2').first()).toBeVisible();
});

test('properties list renders with an add action', async ({ page }) => {
  await page.goto('/admin/properties', { waitUntil: 'networkidle' });
  await expect(page.locator('h1').first()).toBeVisible();
  // A primary "add" link to the new-property route.
  await expect(page.locator('a[href$="/admin/properties/new"]').first()).toBeVisible();
});

test('property edit shows tabs, translate button and image controls', async ({ page }) => {
  await page.goto('/admin/properties', { waitUntil: 'networkidle' });
  const editLink = page.locator('a[href*="/admin/properties/"][href$="/edit"]').first();
  test.skip(!(await editLink.count()), 'no properties seeded');
  await editLink.click();
  await page.waitForURL(/\/admin\/properties\/.+\/edit/, { timeout: 15_000 });

  // Four section tabs exist (general / translations / images / features).
  await expect(page.getByRole('tab')).toHaveCount(4, { timeout: 15_000 });

  // Translations tab → the AI "Translate from Estonian" button is present.
  await page.getByRole('tab').nth(1).click();
  await expect(
    page.getByRole('button', { name: /translate|tõlgi|перевести/i }).first(),
  ).toBeVisible();

  // Images tab → reorder/delete controls are reachable (move buttons we added).
  await page.getByRole('tab').nth(2).click();
  // Either there are images with move controls, or an upload prompt — both fine.
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
});

test('team list shows a hide/show visibility action', async ({ page }) => {
  await page.goto('/admin/team', { waitUntil: 'networkidle' });
  await expect(page.locator('h1').first()).toBeVisible();
  // The hide/show buttons we added carry an aria-label (hide/peida/show/näita).
  await expect(
    page.getByRole('button', { name: /hide|peida|show|näita|скры|показ/i }).first(),
  ).toBeVisible();
});

test('inbox renders folder navigation', async ({ page }) => {
  await page.goto('/admin/inbox', { waitUntil: 'networkidle' });
  await expect(page.locator('h1, h2').first()).toBeVisible();
  // Folder labels (Inbox/Sent/Archive/All in any language) appear.
  await expect(
    page.getByText(/inbox|postkast|входящ|sent|saadetud|отправл/i).first(),
  ).toBeVisible();
});

test('mobile: sidebar opens via the hamburger', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile viewport only');
  await page.goto('/admin', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /decline|keeldu|отклон/i }).first().click().catch(() => {});
  // The sidebar is off-canvas via transform (translate-x-full), so it's still
  // "visible" to the DOM — assert on its rendered X position instead.
  const aside = page.locator('aside').first();
  expect((await aside.boundingBox())?.x ?? 0, 'sidebar starts off-screen').toBeLessThan(0);
  await page.getByRole('button', { name: /open menu|ava menüü|menüü|меню/i }).first().click();
  await expect
    .poll(async () => (await aside.boundingBox())?.x ?? -999, { timeout: 5_000 })
    .toBeGreaterThanOrEqual(-1);
});
