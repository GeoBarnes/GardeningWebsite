import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('project gallery lightbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio/oak-lane-border/');
  });

  test('thumbnails link to the full image, so the gallery works without JS', async ({ page }) => {
    // Progressive enhancement: the markup is plain anchors. If the script fails
    // to load, clicking a thumbnail still opens the image rather than nothing.
    const first = page.locator('#project-gallery a').first();
    await expect(first).toHaveAttribute('href', /^https?:\/\//);
  });

  test('opens a centred overlay when a thumbnail is clicked', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();

    const overlay = page.locator('#lightbox');
    await expect(overlay).toBeVisible();
    // The bug this guards against: the overlay opening below the fold, so only a
    // slice showed at the top. It must be a fixed layer covering the viewport.
    await expect(overlay).toHaveCSS('position', 'fixed');
    const box = await overlay.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).toMatchObject({ x: 0, y: 0 });
    expect(box!.width).toBeCloseTo(viewport.width, 0);
    expect(box!.height).toBeCloseTo(viewport.height, 0);

    await expect(page.locator('#lightbox .lightbox__img')).toBeVisible();
  });

  test('shows the image that was actually clicked', async ({ page }) => {
    // Oak Lane has two images; clicking the second must show the second.
    const second = page.locator('#project-gallery a').nth(1);
    const href = await second.getAttribute('href');
    await second.click();
    await expect(page.locator('#lightbox .lightbox__img')).toHaveAttribute('src', href!);
  });

  test('closes on Escape, removing the overlay entirely', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toHaveCount(0);
  });

  test('closes when the backdrop is clicked', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();

    // Click the top-left corner, which is backdrop rather than the centred image.
    await page.locator('#lightbox').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#lightbox')).toHaveCount(0);
  });

  test('moves between images with the arrow keys', async ({ page }) => {
    const hrefs = await page
      .locator('#project-gallery a')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    test.skip(hrefs.length < 2, 'needs at least two images to page between');

    await page.locator('#project-gallery a').first().click();
    const img = page.locator('#lightbox .lightbox__img');
    await expect(img).toHaveAttribute('src', hrefs[0]!);

    await page.keyboard.press('ArrowRight');
    await expect(img).toHaveAttribute('src', hrefs[1]!);

    await page.keyboard.press('ArrowLeft');
    await expect(img).toHaveAttribute('src', hrefs[0]!);
  });

  test('is fully operable by keyboard, with focus moving in and back out', async ({ page }) => {
    // Opened from the keyboard, focus must move into the dialog, and on close
    // return to the thumbnail — not the top of the document.
    const first = page.locator('#project-gallery a').first();
    await first.focus();
    await page.keyboard.press('Enter');

    await expect
      .poll(() =>
        page.evaluate(() => !!document.getElementById('lightbox')?.contains(document.activeElement))
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toHaveCount(0);
    await expect(first).toBeFocused();
  });

  test('carries thumbnail alt text through to the overlay image', async ({ page }) => {
    const thumbAlt = await page.locator('#project-gallery a img').first().getAttribute('alt');
    expect(thumbAlt).toBeTruthy();

    await page.locator('#project-gallery a').first().click();
    // An unlabelled full-screen image is the classic lightbox a11y failure.
    await expect(page.locator('#lightbox .lightbox__img')).toHaveAttribute(
      'alt',
      thumbAlt as string
    );
  });

  test('locks the document behind the overlay, and unlocks it on close', async ({ page }) => {
    // The page must not scroll behind the fixed overlay. The lock is a class on
    // <html>; it goes on when the lightbox opens and off when it closes.
    await expect(page.locator('html')).not.toHaveClass(/lightbox-open/);

    await page.locator('#project-gallery a').first().click();
    await expect(page.locator('html')).toHaveClass(/lightbox-open/);
    await expect(page.locator('html')).toHaveCSS('overflow-y', 'hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/lightbox-open/);
  });

  test('a double-click never navigates away or opens a tab', async ({ page, context }) => {
    // The original complaint: a double-click's second click followed the link to
    // the bare image in a new tab. The delegated handler always prevents the
    // link's default, so the visitor stays on the page whatever the click count.
    let openedTab = false;
    context.on('page', () => {
      openedTab = true;
    });
    const startUrl = page.url();

    await page.locator('#project-gallery a').first().dblclick();
    // Give any stray navigation or popup a moment to happen.
    await page.waitForTimeout(300);

    expect(openedTab).toBe(false);
    expect(page.url()).toBe(startUrl);
  });

  test('has no accessibility violations while open', async ({ page }) => {
    await page.locator('#project-gallery a').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('no gallery markup on pages without one', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('#project-gallery')).toHaveCount(0);
  });
});
