import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from '../fixtures/routes';

// Runs an axe accessibility sweep on every route. Catches missing alt text,
// unlabelled form controls, insufficient colour contrast, and heading-order
// problems — the failures most likely to hurt real clients on phones and
// screen readers. Data-driven from the same route list as the smoke tests.
for (const route of routes) {
  test(`${route.path} has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}
