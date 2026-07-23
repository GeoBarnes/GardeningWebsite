/**
 * Site-wide switches that are not content and not styling.
 */

/**
 * Whether search engines may index the site.
 *
 * `false` while the site is a placeholder prototype: the copy is lorem ipsum,
 * the photos are grey boxes and the contact details are fake. Being found in
 * this state is worse than not being found at all — and a page Google indexes
 * now can linger in results long after it changes.
 *
 * **Flip to `true` at launch** (Phase 10), once the real photos and copy are in.
 * `tests/e2e/noindex.spec.ts` fails loudly until you do, and again the moment
 * you do — that failure is the reminder to delete the spec.
 */
export const SITE_INDEXABLE = false;

/**
 * The business's details, in one place.
 *
 * These feed the visible footer/contact page *and* the machine-readable
 * `LocalBusiness` JSON-LD, so a single edit here keeps them in step — search
 * engines penalise name/address/phone that disagree between the two.
 *
 * **Everything here is a placeholder** (Phase 7): the name, the fake phone and
 * email, and the bracketed service area all get swapped for the real thing
 * before launch. `telephone` is E.164 for the schema; `telephoneDisplay` is the
 * human-readable form shown on the page.
 */
export const BUSINESS = {
  name: 'Placeholder Gardening Co.',
  description: 'Friendly, experienced garden design and maintenance.',
  email: 'hello@example.com',
  telephone: '+447000000000',
  telephoneDisplay: '07000 000000',
  areaServed: '[service area]',
} as const;

/**
 * Default social-share image (Open Graph / Twitter), 1200×630.
 *
 * A `placehold.co` box like the rest of the prototype, so previews are valid
 * now and there's an obvious thing to replace with a real photo in Phase 7. A
 * page can override it by passing an `image` to BaseLayout.
 */
export const DEFAULT_OG_IMAGE =
  'https://placehold.co/1200x630/2f4a3d/ffffff?text=Placeholder+Gardening+Co.';
