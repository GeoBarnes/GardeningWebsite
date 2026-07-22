import { z } from 'zod';

/**
 * Schema for a single portfolio project entry.
 *
 * Imports zod directly (rather than the deprecated re-export from
 * `astro:content`) so the `z.infer` type below resolves. Extracted from the
 * collection definition so it can be unit-tested in isolation (see
 * src/content/schema.test.ts) — the same object is passed to `defineCollection`
 * in content.config.ts, so the tests validate exactly what the build enforces.
 */
/**
 * A gallery image. Dimensions are required rather than optional because
 * PhotoSwipe needs the intrinsic size before the full image loads — without
 * them the lightbox opens at the wrong scale and the page shifts. They also
 * let us set width/height on the thumbnail, which prevents layout shift.
 */
const imageSchema = z.object({
  src: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Falls back to the project title when omitted. Prefer writing a real one. */
  alt: z.string().optional(),
});

export const projectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  // At least one: the portfolio grid uses images[0] as each project's card
  // thumbnail, so an entry with none would break the index page. Better to
  // fail at build time than to ship a broken card.
  images: z.array(imageSchema).min(1),
  beforeAfter: z.object({ before: z.string(), after: z.string() }).optional(),
  date: z.coerce.date(),
});

export type ProjectImage = z.infer<typeof imageSchema>;
export type Project = z.infer<typeof projectSchema>;

/**
 * Schema for a client testimonial.
 *
 * The collection is deliberately empty for now — she has no testimonials yet,
 * and they are likely some way off. The Testimonials component renders nothing
 * at all while it stays empty, so dropping in the first Markdown file is the
 * only step needed to make the section appear.
 */
export const testimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  /** Town or area, e.g. 'Bramley'. Adds local credibility where available. */
  location: z.string().optional(),
  date: z.coerce.date(),
});

export type Testimonial = z.infer<typeof testimonialSchema>;
