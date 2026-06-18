import { dayCreateRequestSchema, dayNoteCreateRequestSchema, dayNoteUpdateRequestSchema } from './day.schema';

import { describe, it, expect } from 'vitest';

describe('dayCreateRequestSchema', () => {
  it('accepts an optional date + notes', () => {
    expect(dayCreateRequestSchema.safeParse({}).success).toBe(true);
    expect(dayCreateRequestSchema.safeParse({ date: '2026-07-01', notes: 'n' }).success).toBe(true);
  });
});

describe('dayNoteCreateRequestSchema', () => {
  it('requires non-empty text capped at 500, time capped at 250', () => {
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'Lunch' }).success).toBe(true);
    expect(dayNoteCreateRequestSchema.safeParse({ text: '' }).success).toBe(false);
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'x'.repeat(501) }).success).toBe(false);
    expect(
      dayNoteCreateRequestSchema.safeParse({
        text: 'ok',
        time: 'y'.repeat(251),
      }).success,
    ).toBe(false);
  });
});

describe('dayNoteUpdateRequestSchema', () => {
  it('allows omitting text and caps the lengths', () => {
    expect(dayNoteUpdateRequestSchema.safeParse({}).success).toBe(true);
    expect(dayNoteUpdateRequestSchema.safeParse({ icon: '🍽️' }).success).toBe(true);
    expect(dayNoteUpdateRequestSchema.safeParse({ text: 'x'.repeat(501) }).success).toBe(false);
  });
});
