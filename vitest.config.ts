/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig reuses Astro's own Vite setup (module resolution, the
// astro:content virtual module, path aliases), so unit tests see exactly the
// same environment as the app. Add new test globs by convention: any
// *.test.ts beside a component or util is picked up automatically.
export default getViteConfig({
  test: {
    // Container API renders components to strings; schema tests are pure —
    // neither needs a DOM, so the fast node environment is enough.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});
