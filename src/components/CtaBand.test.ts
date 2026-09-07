import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CtaBand from './CtaBand.astro';
import { BUSINESS } from '../config';

let html: string;
let custom: string;

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(CtaBand);
  custom = await container.renderToString(CtaBand, {
    props: { heading: 'Custom heading', body: 'Custom body copy.' },
  });
});

describe('CtaBand', () => {
  it('links to the contact page with a trailing slash', () => {
    expect(html).toContain('href="/contact/"');
  });

  it('takes the email from BUSINESS rather than hardcoding it', () => {
    expect(html).toContain(`href="mailto:${BUSINESS.email}"`);
    expect(html).toContain(BUSINESS.email);
  });

  it('labels its section by the heading, for landmark navigation', () => {
    expect(html).toMatch(/<section[^>]*aria-labelledby="cta-heading"/);
    expect(html).toMatch(/<h2[^>]*id="cta-heading"/);
  });

  it('accepts a custom heading and body', () => {
    expect(custom).toContain('Custom heading');
    expect(custom).toContain('Custom body copy.');
  });
});
