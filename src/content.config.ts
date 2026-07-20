import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    images: z.array(z.string()),
    beforeAfter: z
      .object({ before: z.string(), after: z.string() })
      .optional(),
    date: z.coerce.date(),
  }),
});

export const collections = { projects };
