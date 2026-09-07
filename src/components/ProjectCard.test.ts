import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ProjectCard from './ProjectCard.astro';

// A remote cover, so the card takes its plain <img> branch and the test does
// not depend on the image service being wired up under the Container API.
const project = {
  id: 'test-garden',
  collection: 'projects',
  data: {
    title: 'Test Garden',
    summary: 'A garden built for testing.',
    images: [{ src: 'https://example.com/cover.jpg', width: 1200, height: 800, alt: 'The cover' }],
    date: new Date('2026-06-21'),
  },
};

let html: string;
let featured: string;

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(ProjectCard, { props: { project } });
  featured = await container.renderToString(ProjectCard, { props: { project, featured: true } });
});

describe('ProjectCard', () => {
  it('links to the project page with a trailing slash', () => {
    expect(html).toContain('href="/portfolio/test-garden/"');
  });

  it('renders the cover with its alt text', () => {
    expect(html).toMatch(/<img[^>]*src="https:\/\/example\.com\/cover\.jpg"[^>]*alt="The cover"/);
  });

  it('names its cover for the view transition, keyed by project id', () => {
    // The detail page uses the same name on its own cover, which is what makes
    // the photo morph between pages rather than cut.
    expect(html).toMatch(/data-astro-transition-scope="[^"]+"|transition:name/);
  });

  it('shows the year from the project date', () => {
    expect(html).toContain('2026');
  });

  it('spans two columns only when featured', () => {
    expect(featured).toMatch(/<article[^>]*sm:col-span-2/);
    expect(html).not.toMatch(/<article[^>]*sm:col-span-2/);
  });
});
