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

export const routes: RouteFixture[] = [
  { path: '/', title: 'Home' },
  { path: '/portfolio', title: 'Portfolio' },
  { path: '/portfolio/oak-lane-border', title: 'Oak Lane Border' },
  { path: '/about', title: 'About' },
  { path: '/contact', title: 'Contact' },
];
