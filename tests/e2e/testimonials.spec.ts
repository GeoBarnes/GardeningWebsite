import { test, expect } from '@playwright/test';

// The testimonials collection is deliberately empty: there are no real quotes
// yet and they are some way off. The contract is that the section is omitted
// entirely rather than rendered empty — a bare "What clients say" heading with
// nothing under it reads as a gap in the business, not a gap in the content.
//
// When the first testimonial lands, the second test here is the one to flip.
test.describe('testimonials section', () => {
  test('is omitted entirely while the collection is empty', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /what clients say/i })).toHaveCount(0);
    await expect(page.locator('#testimonials-heading')).toHaveCount(0);
    // No empty shell left behind either.
    await expect(page.locator('section[aria-labelledby="testimonials-heading"]')).toHaveCount(0);
  });

  test('leaves no stray blockquote markup on the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('blockquote')).toHaveCount(0);
  });
});
