import { spreadFindings } from './book-findings';
import { designFindings } from './book-findings-design';
import { bookTextHasOwnGround, textEffectFindings } from './book-text-findings';
import { bookPageSetupSchema, bookTextElementSchema, type BookSpread, type BookTextElement } from './book.schema';

import { describe, expect, it } from 'vitest';

/** What the checks say about text effects, and what they leave to them. */

const page = bookPageSetupSchema.parse({});

const text = (over: Record<string, unknown> = {}): BookTextElement =>
  bookTextElementSchema.parse({
    id: 't1',
    kind: 'text',
    frame: { x: 230, y: 40, w: 120, h: 40 },
    text: 'Lisbon',
    size: 30,
    ...over,
  });

const spreadOf = (...elements: BookTextElement[]): BookSpread => ({
  id: 'sp',
  role: 'inner',
  background: null,
  elements,
  parked: [],
  entryId: null,
});

const codes = (list: { code: string }[]) => list.map((f) => f.code);

describe('the checks of a text effect', () => {
  it('BKFXF-001: says when the words run past the end of their curve, and nothing when they fit', () => {
    const long = text({
      text: 'A postmark from the far end of the coast road',
      curve: { type: 'arc', bend: 30, start: 0 },
    });
    expect(codes(textEffectFindings(spreadOf(long)))).toEqual(['curve_overflow']);
    const fits = text({ curve: { type: 'arc', bend: 30, start: 0 } });
    expect(textEffectFindings(spreadOf(fits))).toEqual([]);
  });

  it('BKFXF-002: measures photo-filled word art as written, and the general overflow check leaves it alone', () => {
    const wide = text({ text: 'LISBON AND PORTO', size: 90, fillPaint: { type: 'photo', photoId: 2 } });
    expect(codes(textEffectFindings(spreadOf(wide)))).toEqual(['text_overflow']);
    const overflows = spreadFindings(spreadOf(wide), page).filter((f) => f.code === 'text_overflow');
    expect(overflows).toHaveLength(1);
    expect(overflows[0]?.message).toContain('without wrapping');
  });

  it('BKFXF-003: warns about an outline heavy enough to close the letters', () => {
    const heavy = text({ outline: { color: '#111111', width: 2 } });
    expect(codes(textEffectFindings(spreadOf(heavy)))).toEqual(['effect_heavy']);
    expect(textEffectFindings(spreadOf(text({ outline: { color: '#111111', width: 0.4 } })))).toEqual([]);
  });

  it('BKFXF-004: checks the words against their own band rather than against the page', () => {
    const poor = text({ color: '#777777', highlight: { color: '#666666' } });
    expect(codes(textEffectFindings(spreadOf(poor)))).toEqual(['contrast_low']);
    const good = text({ color: '#ffffff', highlight: { color: '#111111' } });
    expect(textEffectFindings(spreadOf(good))).toEqual([]);
  });

  it('BKFXF-005: checks a photo fill as a photo frame is checked: in the gallery, shown, sharp enough', () => {
    const filled = text({ fillPaint: { type: 'photo', photoId: 7 } });
    expect(codes(textEffectFindings(spreadOf(filled), [{ photoId: 8 }]))).toEqual(['not_in_gallery']);
    expect(codes(textEffectFindings(spreadOf(filled), [{ photoId: 7, hidden: true }]))).toEqual(['hidden_photo']);
    expect(codes(textEffectFindings(spreadOf(filled), [{ photoId: 7, width: 400, height: 300 }]))).toEqual(['low_dpi']);
    expect(textEffectFindings(spreadOf(filled), [{ photoId: 7, width: 4000, height: 3000 }])).toEqual([]);
    expect(textEffectFindings(spreadOf(filled))).toEqual([]);
  });

  it('BKFXF-006: skips an empty text', () => {
    expect(textEffectFindings(spreadOf(text({ text: '  ', outline: { color: '#111111', width: 5 } })))).toEqual([]);
  });
});

describe('a text that brings its own ground', () => {
  it('BKFXF-007: is a text on a band, filled with a photo, hollow, or with a real outline', () => {
    expect(bookTextHasOwnGround(text())).toBe(false);
    expect(bookTextHasOwnGround(text({ highlight: { color: '#111111' } }))).toBe(true);
    expect(bookTextHasOwnGround(text({ fillPaint: { type: 'photo', photoId: 1 } }))).toBe(true);
    expect(bookTextHasOwnGround(text({ fillPaint: { type: 'solid', color: '#111111', alpha: 0 } }))).toBe(true);
    expect(bookTextHasOwnGround(text({ fillPaint: { type: 'solid', color: '#111111', alpha: 1 } }))).toBe(false);
    expect(bookTextHasOwnGround(text({ outline: { color: '#111111', width: 0.5 } }))).toBe(true);
    expect(bookTextHasOwnGround(text({ outline: { color: '#111111', width: 0.1 } }))).toBe(false);
  });

  it('BKFXF-008: is left out of the page contrast check, which reads it against the page otherwise', () => {
    const pale = text({ color: '#f4f4f4' });
    expect(codes(designFindings(spreadOf(pale), page))).toContain('contrast_low');
    const outlined = text({ color: '#f4f4f4', outline: { color: '#111111', width: 0.6 } });
    expect(codes(designFindings(spreadOf(outlined), page))).not.toContain('contrast_low');
  });

  it('BKFXF-009: a curved text is not compared for overlap by its frame', () => {
    const ring = text({
      id: 'ring',
      frame: { x: 230, y: 20, w: 100, h: 100 },
      curve: { type: 'circle', bend: 0, start: 0 },
    });
    const middle = text({ id: 'mid', frame: { x: 250, y: 50, w: 60, h: 40 }, size: 12 });
    expect(codes(spreadFindings(spreadOf(ring, middle), page))).not.toContain('overlap');
  });
});
