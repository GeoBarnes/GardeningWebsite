import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The hamburger only exists below the `sm` breakpoint, so these assertions are
// meaningless on the desktop project — skip rather than write width-agnostic
// tests that assert nothing useful at either size.
test.describe('mobile nav', () => {
  test.skip(({ isMobile }) => !isMobile, 'hamburger nav only renders on small viewports');

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('starts closed, with the toggle reporting collapsed state', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /menu/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // `hidden` keeps the panel out of the accessibility tree, not just off-screen.
    await expect(page.locator('#nav-menu')).toBeHidden();
  });

  test('opens and closes on click, keeping aria-expanded in sync', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /menu/i });
    const menu = page.locator('#nav-menu');

    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes on Escape and returns focus to the toggle', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /menu/i });
    const menu = page.locator('#nav-menu');

    await toggle.click();
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    // Without this, keyboard users are stranded with focus on a hidden element.
    await expect(toggle).toBeFocused();
  });

  test('every primary route is reachable from the open menu', async ({ page }) => {
    await page.getByRole('button', { name: /menu/i }).click();
    const menu = page.locator('#nav-menu');

    for (const [label, expectedPath] of [
      ['Home', '/'],
      ['Portfolio', '/portfolio/'],
      ['About', '/about/'],
      ['Contact', '/contact/'],
    ] as const) {
      await expect(menu.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'href',
        expectedPath
      );
    }
  });

  // The route-driven a11y sweep only ever sees the menu closed, so the open
  // panel — the state a phone user actually navigates in — would otherwise go
  // unchecked entirely.
  test('has no accessibility violations while open', async ({ page }) => {
    // Reduced motion for the same reason as tests/a11y/accessibility.spec.ts:
    // it pins the scroll-reveal elements to their settled state so axe cannot
    // sample one mid-fade and report a contrast failure that lasts 600ms.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();

    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.locator('#nav-menu')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('a menu link navigates', async ({ page }) => {
    await page.getByRole('button', { name: /menu/i }).click();
    await page.locator('#nav-menu').getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(/\/contact\/$/);
  });
});
