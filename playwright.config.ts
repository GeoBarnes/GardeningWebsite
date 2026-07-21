import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

// E2E and a11y run against the *built* site via `astro preview`, because the
// production output is what actually deploys. In CI the build is a separate
// step (so the dist artifact exists), so preview alone is enough there;
// locally we build-then-preview for a one-command run.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Two viewports, because layout-dependent behaviour (the nav collapsing to a
  // hamburger, touch targets, reflow) is invisible to a desktop-only run.
  // Specs that only make sense at one width guard themselves with the project
  // name — see tests/e2e/mobile-nav.spec.ts.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run build && npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
