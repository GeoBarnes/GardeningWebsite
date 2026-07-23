import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const backdropOpacity = (page: Page) =>
  page.evaluate(() => {
    const bg = document.querySelector('.pswp__bg');
    return bg ? parseFloat(getComputedStyle(bg).opacity) : -1;
  });

/**
 * Waits until PhotoSwipe's opening animation has genuinely finished.
 *
 * This needs to be the *end* of the transition, not merely "something is
 * visible", and neither of the obvious signals is good enough: `.pswp` appears
 * immediately and the `pswp--ui-visible` class lands at ~158ms, both while the
 * backdrop is still fading. Asserting that early produces two distinct false
 * results — an axe sweep measures the overlay's white text against the page
 * still showing through and reports a contrast failure that does not exist
 * once open, and PhotoSwipe silently ignores Escape until the opener completes.
 *
 * So poll the backdrop until its opacity stops changing (~575ms), which holds
 * regardless of the library's final opacity value or animation duration.
 */
async function waitForLightboxOpen(page: Page) {
  await expect(page.locator('.pswp')).toBeVisible();

  let previous = -1;
  await expect
    .poll(
      async () => {
        const current = await backdropOpacity(page);
        const settled = current > 0.5 && Math.abs(current - previous) < 0.0001;
        previous = current;
        return settled;
      },
      { intervals: Array(40).fill(50) }
    )
    .toBe(true);
}

test.describe('project gallery lightbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio/oak-lane-border/');
  });

  test('thumbnails link to the full image, so the gallery works without JS', async ({ page }) => {
    // Progressive enhancement: the markup is plain anchors. If PhotoSwipe fails
    // to load, clicking a thumbnail still opens the image rather than nothing.
    const first = page.locator('#project-gallery a').first();
    await expect(first).toHaveAttribute('href', /^https?:\/\//);
    // PhotoSwipe needs intrinsic dimensions up front to size the overlay.
    await expect(first).toHaveAttribute('data-pswp-width', /^\d+$/);
    await expect(first).toHaveAttribute('data-pswp-height', /^\d+$/);
  });

  test('opens an overlay when a thumbnail is clicked', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();
    await waitForLightboxOpen(page);
    await expect(page.locator('.pswp img.pswp__img').first()).toBeVisible();
  });

  test('closes on Escape, removing the overlay entirely', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();
    await waitForLightboxOpen(page);

    await page.keyboard.press('Escape');
    await expect(page.locator('.pswp')).toHaveCount(0);
  });

  test('is fully operable by keyboard, with focus moving in and back out', async ({ page }) => {
    // The path that matters for accessibility. Opened by pointer, PhotoSwipe
    // deliberately leaves focus on the thumbnail (it pulls focus in on Tab
    // instead); opened by keyboard it must move focus into the dialog, or a
    // keyboard user has no idea anything happened.
    const first = page.locator('#project-gallery a').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await waitForLightboxOpen(page);

    await expect
      .poll(() =>
        page.evaluate(() => !!document.querySelector('.pswp')?.contains(document.activeElement))
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('.pswp')).toHaveCount(0);
    // Focus must come back to where it started, not to the top of the document.
    await expect(first).toBeFocused();
  });

  test('carries thumbnail alt text through to the overlay image', async ({ page }) => {
    const thumbAlt = await page.locator('#project-gallery a img').first().getAttribute('alt');
    expect(thumbAlt).toBeTruthy();

    await page.locator('#project-gallery a').first().click();
    await waitForLightboxOpen(page);
    // An unlabelled full-screen image is the classic lightbox a11y failure.
    await expect(page.locator('.pswp img.pswp__img').first()).toHaveAttribute(
      'alt',
      thumbAlt as string
    );
  });

  test('locks the document behind the overlay, and unlocks it on close', async ({ page }) => {
    // PhotoSwipe doesn't stop the page scrolling behind its fixed overlay, so
    // the background used to scroll away underneath the lightbox — it read as
    // the overlay sticking mid-page, worst on Safari and phones. The lock is a
    // class on <html>; it must go on when the lightbox opens and off when it
    // closes, or the whole page is left unscrollable.
    await expect(page.locator('html')).not.toHaveClass(/pswp-open/);

    await page.locator('#project-gallery a').first().click();
    await waitForLightboxOpen(page);
    await expect(page.locator('html')).toHaveClass(/pswp-open/);
    await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator('.pswp')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/pswp-open/);
  });

  test('a double-click opens the lightbox without navigating or opening a tab', async ({
    page,
    context,
  }) => {
    // PhotoSwipe ignores clicks while already open and lets the link's default
    // navigation fire, so the second click of a double-click followed the href
    // to the bare image. Both the removed target="_blank" and the guard that
    // swallows the stray click keep a double-click on-page.
    let openedTab = false;
    context.on('page', () => {
      openedTab = true;
    });
    const startUrl = page.url();

    await page.locator('#project-gallery a').first().dblclick();
    await waitForLightboxOpen(page);

    expect(openedTab).toBe(false);
    expect(page.url()).toBe(startUrl);
  });

  test('has no accessibility violations while open', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();
    await waitForLightboxOpen(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('no gallery markup on pages without one', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('#project-gallery')).toHaveCount(0);
  });
});
