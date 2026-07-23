import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from '../fixtures/routes';

// Runs an axe accessibility sweep on every route. Catches missing alt text,
// unlabelled form controls, insufficient colour contrast, and heading-order
// problems — the failures most likely to hurt real clients on phones and
// screen readers. Data-driven from the same route list as the smoke tests.
for (const route of routes) {
  test(`${route.path} has no detectable accessibility violations`, async ({ page }) => {
    // Sweep with reduced motion on. Not to dodge a failure: mid-fade, a
    // `[data-reveal]` element's text is genuinely blended toward the background
    // and axe reports a contrast violation that exists for 600ms and describes
    // no state a user ever reads. Reduced motion produces exactly the settled
    // state — opacity 1, no transform — with no transition to race, so this
    // measures the real rendering deterministically rather than sampling an
    // animation and hoping. tests/e2e/motion.spec.ts covers the animated path.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}
