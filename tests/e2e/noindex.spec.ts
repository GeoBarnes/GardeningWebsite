import { test, expect } from '@playwright/test';
import { routes } from '../fixtures/routes';

/**
 * The site is a placeholder prototype and must stay out of search results until
 * the real photos and copy land. These tests assert that state unconditionally,
 * so they fail the moment `SITE_INDEXABLE` is flipped to `true` at launch.
 *
 * That failure is deliberate, and it is the point: it is the thing that makes
 * someone notice the switch was thrown on purpose. **Delete this whole spec as
 * part of launching** (Phase 10) — do not "fix" it by relaxing the assertions.
 */
test.describe('pre-launch: the site is not indexable', () => {
  for (const { path } of routes) {
    test(`${path} tells crawlers not to index it`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        /noindex, nofollow/
      );
    });
  }

  test('robots.txt disallows everything', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    expect(await response?.text()).toMatch(/^User-agent: \*\nDisallow: \/$/m);
  });
});
