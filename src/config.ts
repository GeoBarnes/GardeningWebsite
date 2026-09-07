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
 * Name, service area and email are real. The email is her personal Gmail for
 * now — swap it for a business address later. There's no phone yet:
 * `telephone`/`telephoneDisplay` are intentionally blank, and everything that
 * would show a phone (footer, contact page, JSON-LD) omits it while they are.
 * `telephone` is E.164 for the schema; `telephoneDisplay` is the shown form.
 */
export const BUSINESS = {
  name: 'Sandy Cleary Garden Design',
  description: 'Friendly, experienced garden design and maintenance.',
  email: 'sandycleary777@gmail.com',
  telephone: '',
  telephoneDisplay: '',
  areaServed: 'Northampton and surrounding areas',
} as const;

/**
 * Default social-share image (Open Graph / Twitter), 1200×630.
 *
 * A crop of the Nick's Garden pond photo, committed as a static file so link
 * previews in messaging apps show the garden. Site-relative: BaseLayout
 * resolves it against `site`. A page can override it by passing an `image`.
 */
export const DEFAULT_OG_IMAGE = '/og.jpg';
