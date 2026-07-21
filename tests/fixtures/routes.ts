/**
 * Single source of truth for the site's routes.
 *
 * Smoke and accessibility specs iterate over this list, so adding a new page
 * to the site means adding one line here — and it is then automatically
 * smoke-tested (200 + no console errors) and a11y-swept, with no new
 * boilerplate. `title` is a stable substring expected in the <title>, chosen
 * to avoid asserting on volatile placeholder body copy.
 */
export interface RouteFixture {
  path: string;
  title: string;
}

// Paths carry a trailing slash to match `trailingSlash: 'always'` in
// astro.config.mjs — requesting the unslashed form would be served via a 308.
export const routes: RouteFixture[] = [
  { path: '/', title: 'Home' },
  { path: '/portfolio/', title: 'Portfolio' },
  // Two project pages, deliberately: one with a before/after slider and one
  // without, so the a11y sweep covers both branches of the detail template.
  { path: '/portfolio/oak-lane-border/', title: 'Oak Lane Border' },
  { path: '/portfolio/willow-cottage-patio/', title: 'Willow Cottage Patio' },
  { path: '/about/', title: 'About' },
  { path: '/contact/', title: 'Contact' },
];
