import type { ImageMetadata } from 'astro';

/**
 * Maps a project image `src` string to a local, build-optimisable asset.
 *
 * Project content stores each image's `src` as a plain string (see
 * src/content/schema.ts — kept a string so the schema stays a pure, unit-tested
 * object rather than depending on the content-collection `image()` helper). That
 * covers two cases: local photos living under `src/assets/…`, and remote
 * placeholder URLs. Only the local ones can be optimised by Astro's image
 * pipeline, so components look each `src` up here: a hit means "run it through
 * `<Image>`", a miss means "it's remote, emit a plain <img>".
 *
 * `import.meta.glob` is eager so the lookup is synchronous, and its keys are
 * project-root-absolute paths — exactly the form the Markdown `src` uses.
 */
const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/projects/**/*.{jpg,jpeg,png}',
  { eager: true }
);

export function resolveLocalImage(src: string): ImageMetadata | undefined {
  return localImages[src]?.default;
}
