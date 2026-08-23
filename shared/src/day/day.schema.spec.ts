import { dayCreateRequestSchema, dayNoteCreateRequestSchema, dayNoteUpdateRequestSchema } from './day.schema';

import { describe, it, expect } from 'vitest';

describe('dayCreateRequestSchema', () => {
  it('accepts an optional date + notes', () => {
    expect(dayCreateRequestSchema.safeParse({}).success).toBe(true);
    expect(dayCreateRequestSchema.safeParse({ date: '2026-07-01', notes: 'n' }).success).toBe(true);
  });
});

describe('dayNoteCreateRequestSchema', () => {
  it('requires non-empty text capped at 500, body capped at 2000', () => {
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'Lunch' }).success).toBe(true);
    expect(dayNoteCreateRequestSchema.safeParse({ text: '' }).success).toBe(false);
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'x'.repeat(501) }).success).toBe(false);
    // Raised from 250 with #1629: the field carries formatted Markdown now.
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', time: 'y'.repeat(2000) }).success).toBe(true);
    expect(
      dayNoteCreateRequestSchema.safeParse({
        text: 'ok',
        time: 'y'.repeat(2001),
      }).success,
    ).toBe(false);
  });

  it('takes a note colour, and only as a short string', () => {
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', color: '#dc2626' }).success).toBe(true);
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', color: null }).success).toBe(true);
    // The palette itself is enforced in the service — the contract only keeps
    // the column from taking arbitrary length.
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', color: 'x'.repeat(10) }).success).toBe(false);
  });

  it('accepts null time/icon (moveDayNote re-sends the nullable entity fields)', () => {
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', time: null, icon: null }).success).toBe(true);
  });

  it('takes an icon as a label and not as a payload', () => {
    // Both shapes the field is written in: a lucide export name from NOTE_ICONS
    // and a plain emoji, plus the longest ZWJ sequence anyone types.
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', icon: 'ParkingSquare' }).success).toBe(true);
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', icon: '👩‍👩‍👧‍👦' }).success).toBe(true);
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', icon: 'x'.repeat(64) }).success).toBe(true);
    expect(dayNoteCreateRequestSchema.safeParse({ text: 'ok', icon: 'x'.repeat(65) }).success).toBe(false);
  });
});

describe('dayNoteUpdateRequestSchema', () => {
  it('allows omitting text and caps the lengths', () => {
    expect(dayNoteUpdateRequestSchema.safeParse({}).success).toBe(true);
    expect(dayNoteUpdateRequestSchema.safeParse({ icon: '🍽️' }).success).toBe(true);
    expect(dayNoteUpdateRequestSchema.safeParse({ text: 'x'.repeat(501) }).success).toBe(false);
    expect(dayNoteUpdateRequestSchema.safeParse({ icon: 'x'.repeat(65) }).success).toBe(false);
  });

  it('accepts an explicit null time (clears the label)', () => {
    expect(dayNoteUpdateRequestSchema.safeParse({ time: null }).success).toBe(true);
  });
});
