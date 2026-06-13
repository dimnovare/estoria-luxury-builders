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
  // This is the only smoke check that truly depends on react-helmet having
  // flushed the title (the home/privacy defaults already contain their match).
  // On a cold Vercel load, hydration + helmet can take longer than the default
  // 5s assertion timeout, so give it a generous window to absorb cold starts.
  await expect(page).toHaveTitle(/Careers/i, { timeout: 20_000 });
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

  // Some canonical link ends with this property's slug. Poll over ALL canonical
  // links (tolerates a static index.html canonical co-existing with the helmet
  // one, and cold-start hydration timing) rather than a single strict locator.
  await expect
    .poll(
      () =>
        page
          .locator('link[rel="canonical"]')
          .evaluateAll(
            (els, s) => els.some(e => (e.getAttribute('href') ?? '').endsWith(`/properties/${s}`)),
            slug,
          ),
      { timeout: 20_000 },
    )
    .toBe(true);

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

test('Kinnisvara24 feed is served as valid XML', async ({ request }) => {
  const res = await request.get(`${BASE}/kinnisvara24.xml`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('xml');
  const body = await res.text();
  // Valid whether empty (<objects />) or populated (<objects>…</objects>).
  expect(body).toMatch(/<objects(\s*\/>|[\s>])/);
});

// ── Mobile (runs under the 'mobile' project at a 393px phone viewport) ─────────

test('no horizontal overflow on key pages', async ({ page }) => {
  for (const path of ['/', '/properties', '/contact']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(2);
  }
});

test('mobile menu opens the navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile viewport only');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Hamburger aria-label comes from nav.openMenu (et/en/ru); match any.
  const burger = page
    .getByRole('button', { name: /open menu|ava menüü|открыть меню/i })
    .first();
  await expect(burger).toBeVisible();
  await burger.click();
  // A primary nav link should now be reachable.
  await expect(
    page.getByRole('link', { name: /properties|kinnisvara|недвижимост/i }).first(),
  ).toBeVisible();
});
