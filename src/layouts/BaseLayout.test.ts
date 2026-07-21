import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from './BaseLayout.astro';

// The Container API renders a single .astro component to an HTML string
// in-memory — no browser needed — so we can assert on the structural
// contract of the shared layout independently of any page's content.
let html: string;

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(BaseLayout, {
    props: { title: 'Test Page', description: 'A test description.' },
    slots: { default: '<p data-testid="slotted">Page body</p>' },
  });
});

describe('BaseLayout', () => {
  it('renders the page title and meta description into <head>', () => {
    expect(html).toContain('<title>Test Page');
    expect(html).toContain('A test description.');
  });

  it('links to all four primary routes in the nav', () => {
    for (const href of ['/', '/portfolio', '/about', '/contact']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('renders the slotted page content inside <main>', () => {
    expect(html).toMatch(/<main[^>]*>[\s\S]*data-testid="slotted"[\s\S]*<\/main>/);
  });

  it('renders a footer', () => {
    expect(html).toContain('<footer');
  });
});
