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
export const projectSchema = z.object({
  title: z.string(),
  summary: z.string(),
  images: z.array(z.string()),
  beforeAfter: z.object({ before: z.string(), after: z.string() }).optional(),
  date: z.coerce.date(),
});

export type Project = z.infer<typeof projectSchema>;
