import type { APIRoute } from 'astro';
import { SITE_INDEXABLE } from '../config';

/**
 * Generated rather than a static file in `public/`, so it cannot drift out of
 * sync with `SITE_INDEXABLE` — one switch controls both this and the meta tag.
 *
 * The `Sitemap:` line is only emitted once the site is indexable: pre-launch we
 * disallow everything, and pointing crawlers at a sitemap while telling them to
 * stay out would be contradictory. @astrojs/sitemap generates the file itself.
 */
export const GET: APIRoute = ({ site }) => {
  const body = SITE_INDEXABLE
    ? `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap-index.xml', site)}\n`
    : // Pre-launch. Note the meta robots tag in BaseLayout is the authoritative
      // control: this only asks crawlers not to fetch, and a crawler that never
      // fetches also never sees a noindex. Belt and braces while the site has
      // no inbound links at all.
      'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
