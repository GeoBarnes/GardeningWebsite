import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectSchema, testimonialSchema } from './content/schema';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

// Currently empty by design — see the note in schema.ts. An empty collection is
// valid; the Testimonials component omits its whole section when it finds one.
const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: testimonialSchema,
});

export const collections = { projects, testimonials };
