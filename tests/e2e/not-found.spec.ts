import { test, expect } from '@playwright/test';

// The trailing slash matters here. Under `trailingSlash: 'always'`, `astro
// preview` treats an unslashed unknown path as non-canonical and answers with
// its *own* built-in 404 rather than falling through to our dist/404.html.
// Cloudflare Pages serves ours either way (verified against the live site), so
// this is a preview-server quirk — but the canonical form is what we can assert
// on consistently in both environments.
test('unknown URLs render the custom 404 with a way home', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  // Match our own heading copy specifically: the preview server's built-in 404
  // also contains "not found", and a looser regex would silently pass on it.
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  // The 404's own "back home" link, scoped to <main> to avoid matching the nav's "Home".
  await expect(page.locator('main').getByRole('link', { name: /home/i })).toBeVisible();
});
