import type { APIRoute } from 'astro';
import { SITE_INDEXABLE } from '../config';

/**
 * Generated rather than a static file in `public/`, so it cannot drift out of
 * sync with `SITE_INDEXABLE` — one switch controls both this and the meta tag.
 *
 * Phase 9 should add a `Sitemap:` line here once @astrojs/sitemap is in.
 */
export const GET: APIRoute = () => {
  const body = SITE_INDEXABLE
    ? 'User-agent: *\nAllow: /\n'
    : // Pre-launch. Note the meta robots tag in BaseLayout is the authoritative
      // control: this only asks crawlers not to fetch, and a crawler that never
      // fetches also never sees a noindex. Belt and braces while the site has
      // no inbound links at all.
      'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
