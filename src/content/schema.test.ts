import { describe, it, expect } from 'vitest';
import { projectSchema, testimonialSchema } from './schema';

const validImage = { src: 'https://example.com/a.jpg', width: 1200, height: 800 };

const validProject = {
  title: 'Oak Lane Border Renovation',
  summary: 'A tired border brought back to life.',
  images: [validImage],
  beforeAfter: { before: 'https://example.com/before.jpg', after: 'https://example.com/after.jpg' },
  date: '2026-04-12',
};

describe('projectSchema', () => {
  it('accepts a well-formed project and coerces the date to a Date', () => {
    const result = projectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it('treats beforeAfter as optional', () => {
    const { beforeAfter, ...withoutBeforeAfter } = validProject;
    void beforeAfter;
    expect(projectSchema.safeParse(withoutBeforeAfter).success).toBe(true);
  });

  it('rejects a missing required field (title)', () => {
    const { title, ...withoutTitle } = validProject;
    void title;
    expect(projectSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it('rejects images that are not an array of image objects', () => {
    expect(projectSchema.safeParse({ ...validProject, images: 'not-an-array' }).success).toBe(
      false
    );
    expect(projectSchema.safeParse({ ...validProject, images: [123] }).success).toBe(false);
    // The old string-only shape, in case a legacy entry lingers.
    expect(
      projectSchema.safeParse({ ...validProject, images: ['https://example.com/a.jpg'] }).success
    ).toBe(false);
  });

  it('requires image dimensions, which PhotoSwipe cannot work without', () => {
    const { width, ...noWidth } = validImage;
    void width;
    expect(projectSchema.safeParse({ ...validProject, images: [noWidth] }).success).toBe(false);
    expect(
      projectSchema.safeParse({ ...validProject, images: [{ ...validImage, height: 0 }] }).success
    ).toBe(false);
  });

  it('treats image alt text as optional', () => {
    expect(
      projectSchema.safeParse({ ...validProject, images: [{ ...validImage, alt: 'A border' }] })
        .success
    ).toBe(true);
  });

  it('rejects a project with no images, since the grid uses the first as a thumbnail', () => {
    expect(projectSchema.safeParse({ ...validProject, images: [] }).success).toBe(false);
  });

  it('rejects an unparseable date', () => {
    expect(projectSchema.safeParse({ ...validProject, date: 'not-a-date' }).success).toBe(false);
  });

  it('rejects a half-specified beforeAfter pair', () => {
    expect(projectSchema.safeParse({ ...validProject, beforeAfter: { before: 'x' } }).success).toBe(
      false
    );
  });
});

const validTestimonial = {
  quote: 'She turned a patch of nettles into somewhere we actually sit.',
  author: 'Jane Smith',
  location: 'Bramley',
  date: '2026-05-01',
};

describe('testimonialSchema', () => {
  it('accepts a well-formed testimonial and coerces the date', () => {
    const result = testimonialSchema.safeParse(validTestimonial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it('treats location as optional', () => {
    const { location, ...withoutLocation } = validTestimonial;
    void location;
    expect(testimonialSchema.safeParse(withoutLocation).success).toBe(true);
  });

  it('requires a quote and an attribution', () => {
    const { quote, ...withoutQuote } = validTestimonial;
    void quote;
    expect(testimonialSchema.safeParse(withoutQuote).success).toBe(false);

    const { author, ...withoutAuthor } = validTestimonial;
    void author;
    expect(testimonialSchema.safeParse(withoutAuthor).success).toBe(false);
  });
});
