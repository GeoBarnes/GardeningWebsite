// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // The deployed origin. Needed because Formspree's `_next` redirect target
  // must be an absolute URL, so the contact form builds it from `Astro.site`
  // rather than hardcoding the host. Update this when the real domain lands
  // (Phase 10) — Phase 9's sitemap and canonical tags will read it too.
  site: 'https://gardening-website.pages.dev',
  // Cloudflare Pages serves directory-style output and 308-redirects `/about`
  // to `/about/`. Emitting the canonical form ourselves avoids that extra
  // round-trip on every internal navigation.
  trailingSlash: 'always',
  integrations: [
    // Auto-generated sitemap-index.xml / sitemap-0.xml, read by `Sitemap:` in
    // robots.txt once the site is indexable. `/contact/thanks/` is excluded —
    // it's noindex and only makes sense as the end of the form journey.
    sitemap({
      filter: (page) => !page.includes('/contact/thanks/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
