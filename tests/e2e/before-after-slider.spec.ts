import { test, expect } from '@playwright/test';

test.describe('before/after slider', () => {
  test('upgrades into a working web component on a project that has one', async ({ page }) => {
    await page.goto('/portfolio/oak-lane-border/');

    const slider = page.locator('img-comparison-slider');
    await expect(slider).toBeVisible();

    // The element only becomes interactive once its script has registered it.
    // Asserting on the registry catches a broken/omitted import, which would
    // otherwise degrade silently to two stacked images.
    await expect
      .poll(() => page.evaluate(() => Boolean(customElements.get('img-comparison-slider'))))
      .toBe(true);

    await expect(slider.locator('img[slot="first"]')).toHaveAttribute('src', /.+/);
    await expect(slider.locator('img[slot="second"]')).toHaveAttribute('src', /.+/);
  });

  test('is absent on a project with no before/after images', async ({ page }) => {
    await page.goto('/portfolio/willow-cottage-patio/');
    await expect(page.locator('img-comparison-slider')).toHaveCount(0);
  });

  test('ships its JS only to pages that use it', async ({ page }) => {
    // The zero-JS-by-default promise: the slider bundle must not leak onto the
    // home page just because it exists in the project.
    await page.goto('/');
    const registered = await page.evaluate(() =>
      Boolean(customElements.get('img-comparison-slider'))
    );
    expect(registered).toBe(false);
  });
});
