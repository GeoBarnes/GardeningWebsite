import { describe, it, expect } from 'vitest';
import { projectSchema } from './schema';

const validProject = {
  title: 'Oak Lane Border Renovation',
  summary: 'A tired border brought back to life.',
  images: ['https://example.com/a.jpg'],
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

  it('rejects images that are not an array of strings', () => {
    expect(projectSchema.safeParse({ ...validProject, images: 'not-an-array' }).success).toBe(
      false
    );
    expect(projectSchema.safeParse({ ...validProject, images: [123] }).success).toBe(false);
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
