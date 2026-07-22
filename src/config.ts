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
