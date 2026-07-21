import { test, expect } from '@playwright/test';

test('unknown URLs render the custom 404 with a way home', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  // The 404's own "back home" link, scoped to <main> to avoid matching the nav's "Home".
  await expect(page.locator('main').getByRole('link', { name: /home/i })).toBeVisible();
});
