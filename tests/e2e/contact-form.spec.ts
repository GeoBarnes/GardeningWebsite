import { test, expect } from '@playwright/test';

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  // These field names are the contract with Formspree (Phase 6). If someone
  // renames them the integration silently breaks, so we pin them here.
  for (const name of ['name', 'email', 'message']) {
    test(`has a required "${name}" field`, async ({ page }) => {
      const field = page.locator(`[name="${name}"]`);
      await expect(field).toBeVisible();
      await expect(field).toHaveAttribute('required', '');
    });
  }

  test('includes a honeypot field that is present but not visible', async ({ page }) => {
    const honeypot = page.locator('[name="company"]');
    await expect(honeypot).toBeAttached();
    await expect(honeypot).not.toBeInViewport();
  });

  test('shows a plain-text phone and email fallback', async ({ page }) => {
    await expect(page.locator('a[href^="tel:"]')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
  });
});
