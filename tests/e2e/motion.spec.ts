import { test, expect } from '@playwright/test';

/** Marks the current document, so we can tell a client-side navigation from a
 *  full page load: the flag survives the first and is wiped by the second. */
const markDocument = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    (window as unknown as Record<string, boolean>).__sameDocument = true;
  });

const documentSurvived = (page: import('@playwright/test').Page) =>
  page.evaluate(() => Boolean((window as unknown as Record<string, boolean>).__sameDocument));

test.describe('scroll reveal', () => {
  test('reveals elements once they are scrolled into view', async ({ page }) => {
    await page.goto('/');

    const target = page.locator('[data-reveal]').last();
    await expect(target).not.toHaveAttribute('data-revealed', '');

    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveAttribute('data-revealed', '');
    await expect(target).toHaveCSS('opacity', '1');
  });

  test('reveals only once, and does not re-hide on scrolling away', async ({ page }) => {
    await page.goto('/');
    const target = page.locator('[data-reveal]').last();

    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveAttribute('data-revealed', '');

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(target).toHaveAttribute('data-revealed', '');
  });

  test('shows everything immediately under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Without scrolling at all: motion sensitivity means no movement, not
    // gentler movement.
    for (const target of await page.locator('[data-reveal]').all()) {
      await expect(target).toHaveCSS('opacity', '1');
    }
  });

  test('leaves content visible when JavaScript never runs', async ({ browser }) => {
    // The failure mode this guards against is the worst one available: the
    // reveal CSS hides content, the script does not arrive, and the page is
    // silently blank. The `.js` gate is what prevents it.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');

    for (const target of await page.locator('[data-reveal]').all()) {
      await expect(target).toBeVisible();
      await expect(target).toHaveCSS('opacity', '1');
    }

    await context.close();
  });
});

test.describe('view transitions', () => {
  test('navigates without reloading the document', async ({ page }) => {
    await page.goto('/');
    await markDocument(page);

    await page.getByRole('link', { name: 'View the portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolio\/$/);
    expect(await documentSurvived(page)).toBe(true);
  });

  test('the mobile nav still works after a client-side navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The hamburger only exists below the sm breakpoint');

    // The regression this exists for: view transitions replace the <body>, so
    // listeners bound directly to the toggle on first load would be discarded
    // with the old DOM and the menu would silently stop opening on page two.
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });

    await toggle.click();
    await page.locator('#nav-menu').getByRole('link', { name: 'Portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolio\/$/);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nav-menu')).toBeVisible();
  });

  test('the lightbox still opens after a client-side navigation', async ({ page }) => {
    // Same class of bug on the other side: the lightbox is delegated to
    // `document`, which survives the swap, so it must still open a fresh overlay
    // on a page reached by a client-side navigation.
    await page.goto('/portfolio/');
    await markDocument(page);

    await page.getByRole('link', { name: /Oak Lane Border/ }).click();
    await expect(page).toHaveURL(/oak-lane-border/);
    expect(await documentSurvived(page)).toBe(true);

    await page.locator('#project-gallery a').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();
  });

  test('the lightbox still opens after leaving a project and returning', async ({ page }) => {
    // The exact flow that broke with PhotoSwipe: open a gallery, go back, come
    // back to it, and open again. The overlay must appear centred, not below
    // the fold, on the second visit too.
    await page.goto('/portfolio/willow-cottage-patio/');

    await page.locator('#project-gallery a').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toHaveCount(0);

    await page.getByRole('link', { name: /Back to portfolio/ }).click();
    await expect(page).toHaveURL(/\/portfolio\/$/);
    await page.getByRole('link', { name: /Willow Cottage/ }).click();
    await expect(page).toHaveURL(/willow-cottage-patio/);

    await page.locator('#project-gallery a').first().click();
    const overlay = page.locator('#lightbox');
    await expect(overlay).toBeVisible();
    const box = await overlay.boundingBox();
    expect(box).toMatchObject({ x: 0, y: 0 });
  });

  test('scroll reveal re-arms on the page navigated to', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'View the portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolio\/$/);

    const target = page.locator('[data-reveal]').first();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveAttribute('data-revealed', '');
  });
});
