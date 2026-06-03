import { test, expect } from '@playwright/test';

/**
 * Live public smoke suite for estoria.estate.
 *
 * Read-only — visits public pages only, never logs in or mutates data, so it is
 * safe to run against production. Verifies the launch-hardening changes:
 * sitemap routing, per-page SEO meta, the Leaflet property map, and that
 * sanitized CMS content still renders. Admin flows (create/edit) are verified
 * manually or against a local stack, not against prod.
 */

const BASE = 'https://estoria.estate';

/** Pull a real slug for a section out of the live sitemap. */
async function firstSlug(request: import('@playwright/test').APIRequestContext, section: string) {
  const xml = await (await request.get(`${BASE}/sitemap.xml`)).text();
  const matches = xml.match(new RegExp(`${BASE}/${section}/([a-z0-9-]+)`));
  return matches ? matches[1] : null;
}

test('sitemap is served as XML with content', async ({ request }) => {
  const res = await request.get(`${BASE}/sitemap.xml`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('xml');
  const body = await res.text();
  expect(body).toContain('<urlset');
  expect(body).toContain(`${BASE}/properties/`);
});

test('home page loads with a title', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Estoria/i);
});

test('careers page has its own SEO title', async ({ page }) => {
  await page.goto(`${BASE}/careers`, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Careers/i);
});

test('privacy page has SEO title + canonical', async ({ page }) => {
  await page.goto(`${BASE}/privacy`, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Privacy/i);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', `${BASE}/privacy`);
});

test('team member detail has canonical + renders content', async ({ page, request }) => {
  const slug = await firstSlug(request, 'team');
  test.skip(!slug, 'no team members in sitemap');
  await page.goto(`${BASE}/team/${slug}`, { waitUntil: 'networkidle' });
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', new RegExp(`/team/${slug}$`));
  await expect(page.locator('h1')).toBeVisible();
});

test('property detail renders SEO canonical and (when geocoded) a real map', async ({ page, request }) => {
  const slug = await firstSlug(request, 'properties');
  test.skip(!slug, 'no properties in sitemap');
  await page.goto(`${BASE}/properties/${slug}`, { waitUntil: 'networkidle' });

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', new RegExp(`/properties/${slug}$`),
  );

  // If the property has coordinates, the Leaflet map mounts. Tiles load from
  // OpenStreetMap; assert the container and at least one loaded tile appear.
  const map = page.locator('.leaflet-container');
  if (await map.count()) {
    await expect(map.first()).toBeVisible();
    await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible({ timeout: 10_000 });
  }
});

test('contact page exposes the inquiry form fields', async ({ page }) => {
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  await expect(page.locator('textarea').first()).toBeVisible();
});

test('admin login page renders (bundle loads, no white screen)', async ({ page }) => {
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  // Unauthenticated → login form. Asserting the password field renders confirms
  // the admin chunk loaded and didn't crash on mount.
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});
