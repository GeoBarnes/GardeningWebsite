import { test, expect } from '@playwright/test';

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
  });

  // These field names are the contract with Formspree. If someone renames them
  // the integration silently breaks, so we pin them here.
  for (const name of ['name', 'email', 'message']) {
    test(`has a required "${name}" field`, async ({ page }) => {
      const field = page.locator(`[name="${name}"]`);
      await expect(field).toBeVisible();
      await expect(field).toHaveAttribute('required', '');
    });
  }

  test('posts to the Formspree endpoint', async ({ page }) => {
    const form = page.locator('form');
    // A GET would put the message in the URL and deliver nothing.
    await expect(form).toHaveAttribute('method', /post/i);
    await expect(form).toHaveAttribute('action', /^https:\/\/formspree\.io\/f\/\w+$/);
  });

  test('submits with no JavaScript, as a plain HTML POST', async ({ page }) => {
    // The reason we chose the Basic HTML integration: no bundle to fail. If a
    // future change reintroduces an AJAX handler this catches it.
    await expect(page.locator('form script')).toHaveCount(0);
    await expect(page.locator('form [type="submit"]')).toBeVisible();
  });

  test('redirects back to our own thank-you page after submitting', async ({ page }) => {
    // Formspree requires an absolute URL here; a relative one is ignored and
    // the user silently lands on Formspree's branded confirmation instead.
    await expect(page.locator('[name="_next"]')).toHaveAttribute(
      'value',
      /^https:\/\/.+\/contact\/thanks\/$/
    );
  });

  test('gives enquiries a recognisable subject line', async ({ page }) => {
    await expect(page.locator('[name="_subject"]')).toHaveValue(/\S/);
  });

  test('includes a honeypot field that is present but not visible', async ({ page }) => {
    // `_gotcha` specifically: Formspree discards submissions where it is filled,
    // so the name is what makes the field do anything at all.
    const honeypot = page.locator('[name="_gotcha"]');
    await expect(honeypot).toBeAttached();
    await expect(honeypot).not.toBeInViewport();
    // Inside an aria-hidden wrapper, so it must not be reachable by keyboard —
    // otherwise it is a focusable element hidden from screen readers.
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
  });

  test('shows a plain-text phone and email fallback', async ({ page }) => {
    await expect(page.locator('a[href^="tel:"]')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
  });
});

test.describe('thank-you page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/thanks/');
  });

  test('is kept out of search results', async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('offers a way back into the site', async ({ page }) => {
    // A dead end after submitting is a bad exit; give people somewhere to go.
    await expect(page.locator('main a[href="/"]')).toBeVisible();
  });
});
