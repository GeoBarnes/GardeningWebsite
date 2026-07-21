import { test, expect } from '@playwright/test';
import { routes } from '../fixtures/routes';

// Data-driven: every route in the fixture list is smoke-tested. New pages get
// this coverage for free just by being added to routes.ts.
for (const route of routes) {
  test(`${route.path} loads with a 200, correct title, and no console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    const response = await page.goto(route.path);
    expect(response?.status(), `HTTP status for ${route.path}`).toBe(200);
    await expect(page).toHaveTitle(new RegExp(route.title));
    expect(consoleErrors, `console errors on ${route.path}`).toEqual([]);
  });
}
