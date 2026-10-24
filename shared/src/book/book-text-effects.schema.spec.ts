import { bookTextEffectWords } from './book-text-describe';
import { bookTextIsDrawn, bookTextPaintFill } from './book-text-effects.schema';
import { bookTextHasOwnGround } from './book-text-findings';
import { bookTextElementSchema } from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * The text effects as the document stores them: absent on every text written
 * before they existed, each one a value or null, and the bounds the print
 * renderer depends on.
 */

const frame = { x: 10, y: 10, w: 80, h: 30 };
const parse = (over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({ id: 't1', kind: 'text', frame, text: 'Lisbon', ...over });

describe('the effect fields of a text', () => {
  it('BKFX-001: leave a text from before them exactly as it was, with no new key', () => {
    const el = parse();
    for (const key of [
      'transform',
      'vAlign',
      'outline',
      'shadow',
      'highlight',
      'curve',
      'fillPaint',
      'fit',
      'fitMax',
    ]) {
      expect(key in el, key).toBe(false);
    }
  });

  it('BKFX-002: read every effect, fill their defaults in, and take null for an effect taken off', () => {
    const el = parse({
      transform: 'upper',
      vAlign: 'middle',
      outline: { color: '#ffffff', width: 0.4 },
      shadow: { dx: 1, dy: 1, color: '#111111' },
      highlight: { color: '#c2410c' },
      curve: { type: 'arc' },
      fillPaint: { type: 'photo', photoId: 12 },
      fit: 'shrink',
      fitMax: 120,
    });
    expect(el.shadow?.alpha).toBe(1);
    expect(el.highlight).toEqual({ color: '#c2410c', alpha: 1, padX: 1.2, padY: 0.3, radius: 0 });
    expect(el.curve).toEqual({ type: 'arc', bend: 40, start: 0 });
    expect(el.fillPaint).toEqual({ type: 'photo', photoId: 12, focalX: 0.5, focalY: 0.5, zoom: 1 });
    expect(parse({ outline: null, curve: null }).outline).toBeNull();
  });

  it('BKFX-003: set a word across a cover and capitals spaced to one and a half em, and no further', () => {
    expect(parse({ size: 400, tracking: 1.5 }).size).toBe(400);
    expect(bookTextElementSchema.safeParse({ id: 't', kind: 'text', frame, size: 401 }).success).toBe(false);
    expect(bookTextElementSchema.safeParse({ id: 't', kind: 'text', frame, tracking: 1.6 }).success).toBe(false);
    expect(
      bookTextElementSchema.safeParse({ id: 't', kind: 'text', frame, shadow: { dx: 1, dy: 1, color: 'red' } }).success,
    ).toBe(false);
    expect(
      bookTextElementSchema.safeParse({
        id: 't',
        kind: 'text',
        frame,
        fillPaint: { type: 'pattern', color: '#111111' },
      }).success,
    ).toBe(false);
  });

  it('BKFX-004: draws a curved or a photo-filled text as SVG, and every other one as type', () => {
    expect(bookTextIsDrawn(parse())).toBe(false);
    expect(bookTextIsDrawn(parse({ outline: { color: '#111111', width: 1 } }))).toBe(false);
    expect(bookTextIsDrawn(parse({ fillPaint: { type: 'solid', color: '#111111', alpha: 0 } }))).toBe(false);
    expect(bookTextIsDrawn(parse({ curve: { type: 'circle' } }))).toBe(true);
    expect(bookTextIsDrawn(parse({ fillPaint: { type: 'photo', photoId: 3 } }))).toBe(true);
  });
});

describe('letters filled with a gradient or a pattern', () => {
  const gradient = {
    type: 'linear',
    angle: 90,
    stops: [
      { at: 0, color: '#ff6600' },
      { at: 1, color: '#ffcc00' },
    ],
  };
  const gingham = { type: 'pattern', pattern: 'gingham', fg: '#d62828', bg: '#ffffff', scale: 1, angle: 0 };

  it('BKFX-005: reads a gradient and a pattern in the shape a shape takes them, and draws them as SVG', () => {
    const lin = parse({ fillPaint: gradient });
    const pat = parse({ fillPaint: gingham });
    expect(bookTextPaintFill(lin)).toEqual(gradient);
    expect(bookTextPaintFill(pat)).toEqual(gingham);
    expect(bookTextIsDrawn(lin)).toBe(true);
    expect(bookTextIsDrawn(pat)).toBe(true);
    expect(bookTextPaintFill(parse({ fillPaint: { type: 'photo', photoId: 3 } }))).toBeNull();
    expect(() => parse({ fillPaint: { ...gingham, pattern: 'plaid' } })).toThrow();
  });

  it('BKFX-006: names the paint for a model that cannot see the page, and judges no contrast against it', () => {
    expect(bookTextEffectWords({ ...parse({ fillPaint: gradient }), size: 40 })).toContain(
      'linear gradient at 90 deg, from #ff6600 to #ffcc00',
    );
    expect(bookTextEffectWords({ ...parse({ fillPaint: gingham }), size: 40 })).toContain(
      'patterned gingham in #d62828 on #ffffff',
    );
    expect(bookTextHasOwnGround(parse({ fillPaint: gingham }))).toBe(true);
  });
});
