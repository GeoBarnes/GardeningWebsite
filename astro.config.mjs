// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Cloudflare Pages serves directory-style output and 308-redirects `/about`
  // to `/about/`. Emitting the canonical form ourselves avoids that extra
  // round-trip on every internal navigation.
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
});
