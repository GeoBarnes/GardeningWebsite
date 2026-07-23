import { test, expect } from '@playwright/test';
import { routes } from '../fixtures/routes';

test.describe('SEO metadata', () => {
  // Driven by the route fixture, so a new page is covered by adding one line
  // there — same contract as the smoke and a11y sweeps.
  for (const { path } of routes) {
    test(`${path} has a canonical URL plus Open Graph and Twitter tags`, async ({ page }) => {
      await page.goto(path);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBeTruthy();
      // Absolute, and pointing at this very path — a relative or wrong canonical
      // is worse than none, since it actively misdirects crawlers.
      expect(new URL(canonical!).pathname).toBe(path);

      // og:url mirrors the canonical; the rest just have to be present and
      // non-empty (asserting exact copy would break on every content edit).
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical!);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
      for (const prop of ['og:title', 'og:description', 'og:image', 'og:site_name']) {
        await expect(page.locator(`meta[property="${prop}"]`)).toHaveAttribute('content', /\S/);
      }

      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image'
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /\S/);
    });
  }
});

test.describe('LocalBusiness structured data', () => {
  // Only on the pages that are about the business itself.
  for (const path of ['/about/', '/contact/']) {
    test(`${path} carries valid LocalBusiness JSON-LD`, async ({ page }) => {
      await page.goto(path);

      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      expect(raw, 'a JSON-LD block should be present').toBeTruthy();

      const data = JSON.parse(raw!);
      expect(data['@type']).toBe('LocalBusiness');
      // The fields that make the block useful for local search.
      for (const key of ['name', 'telephone', 'email', 'areaServed', 'url']) {
        expect(data[key], `missing "${key}"`).toBeTruthy();
      }
      expect(data.url).toMatch(/^https?:\/\//);
    });
  }

  test('is not emitted on pages that are not about the business', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});

test.describe('sitemap', () => {
  test('is generated and excludes the noindex thank-you page', async ({ page }) => {
    const index = await page.goto('/sitemap-index.xml');
    expect(index?.status()).toBe(200);

    const res = await page.request.get('/sitemap-0.xml');
    const xml = await res.text();
    expect(xml).toContain('/about/');
    expect(xml).toContain('/portfolio/');
    // The thank-you page is noindex — it must not be advertised for crawling.
    expect(xml).not.toContain('/contact/thanks/');
  });
});
