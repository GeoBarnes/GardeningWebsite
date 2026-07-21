import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BeforeAfterSlider from './BeforeAfterSlider.astro';

let html: string;

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(BeforeAfterSlider, {
    props: {
      before: 'https://example.com/before.jpg',
      after: 'https://example.com/after.jpg',
      title: 'Test Garden',
    },
  });
});

describe('BeforeAfterSlider', () => {
  it('renders both images into the named slots the web component expects', () => {
    // `slot="first"`/`slot="second"` are the library's contract — getting these
    // wrong silently renders two stacked images with no slider.
    expect(html).toMatch(/slot="first"[^>]*src="https:\/\/example\.com\/before\.jpg"/);
    expect(html).toMatch(/slot="second"[^>]*src="https:\/\/example\.com\/after\.jpg"/);
  });

  it('gives each image distinct, descriptive alt text', () => {
    expect(html).toContain('alt="Test Garden — before the work"');
    expect(html).toContain('alt="Test Garden — after the work"');
  });

  it('labels the slider for assistive tech, since the library sets no ARIA itself', () => {
    expect(html).toContain('role="group"');
    expect(html).toMatch(/aria-label="[^"]*Test Garden[^"]*"/);
  });

  it('gives both images explicit dimensions to prevent layout shift', () => {
    const dimensioned = html.match(/width="800"\s+height="600"/g) ?? [];
    expect(dimensioned).toHaveLength(2);
  });
});
