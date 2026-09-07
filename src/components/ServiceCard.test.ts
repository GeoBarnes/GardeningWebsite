import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServiceCard from './ServiceCard.astro';

let html: string;

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(ServiceCard, {
    props: {
      title: 'Garden design',
      blurb: 'A layout that suits the space.',
      includes: 'a visit and a sketched plan.',
    },
    slots: { default: '<svg data-testid="icon"></svg>' },
  });
});

describe('ServiceCard', () => {
  it('renders the title as a heading below the page h2', () => {
    expect(html).toMatch(/<h3[^>]*>\s*Garden design\s*<\/h3>/);
  });

  it('renders the blurb and the "includes" line', () => {
    expect(html).toContain('A layout that suits the space.');
    expect(html).toContain('a visit and a sketched plan.');
  });

  it('places the slotted icon inside the card', () => {
    expect(html).toContain('data-testid="icon"');
  });

  it('opts in to the scroll reveal', () => {
    expect(html).toMatch(/<article[^>]*data-reveal/);
  });
});
