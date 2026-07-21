import { test, expect } from '@playwright/test';

test.describe('site navigation', () => {
  test('primary nav links reach the right pages', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header nav');

    for (const [label, expectedPath] of [
      ['Portfolio', '/portfolio/'],
      ['About', '/about/'],
      ['Contact', '/contact/'],
    ] as const) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
      await page.goto('/');
    }
  });

  test('portfolio grid links through to a project detail page', async ({ page }) => {
    await page.goto('/portfolio/');
    // Click the first project card's link, whatever it happens to be.
    await page.locator('main article a').first().click();
    await expect(page).toHaveURL(/\/portfolio\/.+/);
    await expect(page.locator('h1')).toBeVisible();
    // The detail page offers a way back to the portfolio index.
    await expect(page.getByRole('link', { name: /back to portfolio/i })).toBeVisible();
  });
});
