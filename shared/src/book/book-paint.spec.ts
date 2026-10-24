import { normalizeBookDocument } from './book-normalize';
import { applyBookOps } from './book-ops';
import { bookPageOpSchema } from './book-ops.schema';
import {
  bookColours,
  legacyShapePaint,
  paintColours,
  paintFallbackHex,
  paintWords,
  shapePaint,
  sortedStops,
  spreadPaint,
  withShapePaint,
  withSpreadPaint,
  withSpreadPaintByHand,
} from './book-paint';
import { BOOK_PATTERNS, bookPaintInSchema, bookPaintSchema, type BookPaint } from './book-paint.schema';
import { applySavedBookLayout, bookLayoutFromSpread, bookLayoutPreview } from './book-saved-layouts';
import {
  bookLayoutSchema,
  bookPageSetupSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  type BookDocument,
  type BookShapeElement,
  type BookSpread,
} from './book.schema';
import { describeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

// BKPAINT-001 to BKPAINT-017

/**
 * Paint: the document's gradients, alpha and patterns, how they stay readable
 * for a reader from before them, and what the page operations and the page
 * description make of them.
 */

const frame = { x: 10, y: 10, w: 60, h: 40 };
const shape = (over: Record<string, unknown> = {}): BookShapeElement =>
  bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame, ...over });

const linear: BookPaint = {
  type: 'linear',
  angle: 45,
  stops: [
    { at: 0, color: '#ff0000' },
    { at: 1, color: '#0000ff' },
  ],
};
const radial: BookPaint = {
  type: 'radial',
  cx: 0.3,
  cy: 0.4,
  r: 0.8,
  stops: [
    { at: 0, color: '#ffffff', alpha: 0.5 },
    { at: 1, color: '#000000' },
  ],
};
const stripes: BookPaint = { type: 'pattern', pattern: 'stripes', fg: '#112233', bg: '#ffeedd', scale: 1, angle: 45 };

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const doc = (spreads: unknown[]): BookDocument => normalizeBookDocument({ version: 1, title: 'T', page, spreads });
const spread = (over: Record<string, unknown> = {}): BookSpread =>
  bookSpreadSchema.parse({ id: 'sp1', role: 'inner', elements: [], ...over });

describe('the paint contract', () => {
  it('BKPAINT-001: reads the four kinds and the twelve patterns', () => {
    for (const p of [{ type: 'solid', color: '#abcdef', alpha: 0.4 }, linear, radial, stripes]) {
      expect(bookPaintSchema.parse(p)).toEqual(p);
    }
    expect(BOOK_PATTERNS).toHaveLength(14);
    for (const pattern of BOOK_PATTERNS) expect(bookPaintSchema.safeParse({ ...stripes, pattern }).success).toBe(true);
  });

  it('BKPAINT-002: refuses a gradient of one stop or of seven, a colour that is not hex and an alpha past 1', () => {
    const stop = { at: 0, color: '#000000' };
    expect(bookPaintSchema.safeParse({ ...linear, stops: [stop] }).success).toBe(false);
    expect(bookPaintSchema.safeParse({ ...linear, stops: Array(7).fill(stop) }).success).toBe(false);
    expect(bookPaintSchema.safeParse({ type: 'solid', color: 'red' }).success).toBe(false);
    expect(bookPaintSchema.safeParse({ type: 'solid', color: '#000000', alpha: 1.5 }).success).toBe(false);
    expect(bookPaintSchema.safeParse({ ...stripes, scale: 9 }).success).toBe(false);
  });

  it('BKPAINT-003: an operation paint is strict, a stored one drops what it does not know', () => {
    expect(bookPaintInSchema.safeParse({ type: 'solid', color: '#000000', glow: 1 }).success).toBe(false);
    expect(bookPaintSchema.parse({ type: 'solid', color: '#000000', glow: 1 })).toEqual({
      type: 'solid',
      color: '#000000',
    });
  });

  it('BKPAINT-004: a paint the reader cannot read falls back to the fill beside it, and the shape still reads', () => {
    const el = bookShapeElementSchema.parse({
      id: 's1',
      kind: 'shape',
      frame,
      fill: '#123456',
      paint: { type: 'plaid' },
    });
    expect(el.paint).toBeUndefined();
    expect(el.fill).toBe('#123456');
    const sp = bookSpreadSchema.parse({
      id: 'sp',
      background: '#eeeeee',
      backgroundPaint: { type: 'linear', stops: [] },
    });
    expect(sp.backgroundPaint).toBeUndefined();
    expect(sp.background).toBe('#eeeeee');
  });
});

describe('the colour that stands for a paint', () => {
  it('BKPAINT-005: is the colour of a solid, a see-through solid as it looks on the paper', () => {
    expect(paintFallbackHex({ type: 'solid', color: '#FF0000' })).toBe('#ff0000');
    expect(paintFallbackHex({ type: 'solid', color: '#000000', alpha: 0.5 })).toBe('#808080');
  });

  it('BKPAINT-006: mixes a gradient by the stretch each stop holds, and takes a pattern by its ground', () => {
    expect(paintFallbackHex(linear)).toBe('#800080');
    const weighted: BookPaint = {
      type: 'linear',
      angle: 0,
      stops: [
        { at: 0.5, color: '#000000' },
        { at: 0, color: '#ffffff' },
      ],
    };
    expect(sortedStops(weighted.type === 'linear' ? weighted.stops : []).map((s) => s.at)).toEqual([0, 0.5]);
    // White holds a quarter of the line, black the other three.
    expect(paintFallbackHex(weighted)).toBe('#404040');
    expect(paintFallbackHex(stripes)).toBe('#ffeedd');
    expect(paintFallbackHex({ ...stripes, bg: null } as BookPaint)).toBe('#112233');
  });
});

describe('a shape and its paint', () => {
  it('BKPAINT-007: reads its old fill and fade as the paint they draw', () => {
    expect(legacyShapePaint(shape({ fill: null }))).toBeNull();
    expect(shapePaint(shape({ fill: '#ABCDEF' }))).toEqual({ type: 'solid', color: '#abcdef' });
    const up = shapePaint(shape({ fill: '#102030', gradient: 'up' }));
    expect(up).toMatchObject({ type: 'linear', angle: 0 });
    expect(up?.type === 'linear' && up.stops.map((s) => s.alpha)).toEqual([0, 0.55, 1]);
    expect(shapePaint(shape({ gradient: 'down' }))).toMatchObject({ angle: 180 });
    expect(shapePaint(shape({ paint: stripes }))).toEqual(stripes);
  });

  it('BKPAINT-008: stores one opaque colour and the cover fade in the old fields alone, anything else beside them', () => {
    const plain = withShapePaint(shape({ paint: stripes }), { type: 'solid', color: '#C2410C' });
    expect(plain).toMatchObject({ fill: '#c2410c', gradient: 'none' });
    expect('paint' in plain).toBe(false);

    const fade = withShapePaint(shape(), legacyShapePaint(shape({ fill: '#102030', gradient: 'down' })));
    expect(fade).toMatchObject({ fill: '#102030', gradient: 'down' });
    expect('paint' in fade).toBe(false);

    const painted = withShapePaint(shape({ gradient: 'up' }), linear);
    expect(painted).toMatchObject({ paint: linear, fill: '#800080', gradient: 'none' });

    expect(withShapePaint(shape({ paint: linear }), null)).toMatchObject({ fill: null, gradient: 'none' });
  });
});

describe('a page and its paint', () => {
  it('BKPAINT-009: keeps background as the colour that stands for the paint, and the paper as null', () => {
    expect(spreadPaint(spread())).toBeNull();
    expect(spreadPaint(spread({ background: '#F4EFE6' }))).toEqual({ type: 'solid', color: '#f4efe6' });
    const painted = withSpreadPaint(spread(), radial);
    expect(painted.backgroundPaint).toEqual(radial);
    expect(painted.background).toMatch(/^#[0-9a-f]{6}$/);
    expect(spreadPaint(painted)).toEqual(radial);
    const flat = withSpreadPaint(painted, { type: 'solid', color: '#202020' });
    expect([flat.background, 'backgroundPaint' in flat]).toEqual(['#202020', false]);
    expect(withSpreadPaint(painted, null)).toMatchObject({ background: null });
  });

  it('BKPAINT-010: a saved layout carries the paint of the page it was taken from, and gives it back', () => {
    const painted = withSpreadPaint(spread({ elements: [shape()] }), stripes);
    const layout = bookLayoutSchema.parse(bookLayoutFromSpread(painted, page, 'Stripes'));
    expect(layout.backgroundPaint).toEqual(stripes);
    expect(bookLayoutPreview(layout, page).backgroundPaint).toEqual(stripes);
    const applied = applySavedBookLayout(spread({ backgroundPaint: linear, background: '#800080' }), layout, page);
    expect(applied.backgroundPaint).toEqual(stripes);

    const plainLayout = bookLayoutSchema.parse(bookLayoutFromSpread(spread({ background: '#111111' }), page, 'Ink'));
    const replaced = applySavedBookLayout(spread({ backgroundPaint: linear }), plainLayout, page);
    expect(['backgroundPaint' in replaced, replaced.background]).toEqual([false, '#111111']);
  });

  it('BKPAINT-017: a paint set by hand takes the page off its theme colour, Studio and assistant alike', () => {
    const linked = spread({ background: '#f4efe6', backgroundToken: 'paper' });
    expect(withSpreadPaint(linked, stripes).backgroundToken).toBe('paper');
    const painted = withSpreadPaintByHand(linked, stripes);
    expect(painted).toMatchObject({ backgroundPaint: stripes, background: '#ffeedd' });
    expect('backgroundToken' in painted).toBe(false);
    const result = applyBookOps(doc([linked]), { spreadId: 'sp1', ops: [{ op: 'background', color: '#202020' }] });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.doc.spreads[0]).toMatchObject({ background: '#202020' });
    expect(result.doc.spreads[0]?.backgroundToken).toBeUndefined();
  });
});

describe('what a paint is in words', () => {
  it('BKPAINT-011: names the kind, the colours and the numbers that place them', () => {
    expect(paintWords({ type: 'solid', color: '#ABCDEF' })).toBe('#abcdef');
    expect(paintWords({ type: 'solid', color: '#abcdef', alpha: 0.25 })).toBe('#abcdef at 25%');
    expect(paintWords(linear)).toBe('linear gradient towards 45 deg: #ff0000 at 0%, #0000ff at 100%');
    expect(paintWords(radial)).toBe('radial gradient from 30% 40%, radius 0.8: #ffffff at 50% at 0%, #000000 at 100%');
    expect(paintWords(stripes)).toBe('stripes pattern, #112233 on #ffeedd, scale 1, turned 45 deg');
    expect(paintWords({ ...stripes, bg: null } as BookPaint)).toContain('on nothing (see-through)');
    expect(paintColours(stripes)).toEqual(['#112233', '#ffeedd']);
    expect(paintColours(null)).toEqual([]);
  });

  it('BKPAINT-012: the book palette counts every colour a page is drawn in, most used first', () => {
    const book = doc([
      { id: 'a', background: '#ffeedd', elements: [shape({ fill: '#112233' }), shape({ id: 's2', paint: stripes })] },
      { id: 'b', backgroundPaint: linear, background: '#800080', elements: [] },
    ]);
    const colours = bookColours(book);
    expect(colours.slice(0, 2)).toEqual(['#112233', '#ffeedd']);
    expect(colours).toEqual(expect.arrayContaining(['#ff0000', '#0000ff']));
    expect(bookColours(null)).toEqual([]);
    expect(bookColours(book, 1)).toHaveLength(1);
  });
});

describe('the assistant on the same paint', () => {
  const book = () =>
    doc([{ id: 'sp1', role: 'inner', elements: [{ id: 's1', kind: 'shape', frame, fill: '#111111' }], parked: [] }]);
  const edit = (ops: unknown[]) => {
    const result = applyBookOps(book(), { spreadId: 'sp1', ops }, { newId: (p) => `${p}-new` });
    if (!result.ok) throw new Error(result.error.message);
    return result.doc.spreads[0] as BookSpread;
  };

  it('BKPAINT-013: the background operation takes a paint or a colour, one of the two', () => {
    expect(bookPageOpSchema.safeParse({ op: 'background', color: '#ffffff' }).success).toBe(true);
    expect(bookPageOpSchema.safeParse({ op: 'background', paint: linear }).success).toBe(true);
    expect(bookPageOpSchema.safeParse({ op: 'background', color: null }).success).toBe(true);
    expect(bookPageOpSchema.safeParse({ op: 'background' }).success).toBe(false);
    expect(bookPageOpSchema.safeParse({ op: 'background', color: '#ffffff', paint: linear }).success).toBe(false);

    expect(edit([{ op: 'background', paint: stripes }])).toMatchObject({
      backgroundPaint: stripes,
      background: '#ffeedd',
    });
    const back = edit([
      { op: 'background', paint: stripes },
      { op: 'background', color: '#202020' },
    ]);
    expect([back.background, 'backgroundPaint' in back]).toEqual(['#202020', false]);
    expect(edit([{ op: 'background', color: null }]).background).toBeNull();
  });

  it('BKPAINT-014: style and add set a shape paint, and a plain fill given later replaces it', () => {
    const painted = edit([{ op: 'style', elementId: 's1', set: { kind: 'shape', paint: radial } }]);
    expect(painted.elements[0]).toMatchObject({ paint: radial, gradient: 'none' });

    const flat = edit([
      { op: 'style', elementId: 's1', set: { kind: 'shape', paint: radial } },
      { op: 'style', elementId: 's1', set: { kind: 'shape', fill: '#00ff00' } },
    ]);
    expect(flat.elements[0]).toMatchObject({ fill: '#00ff00' });
    expect('paint' in (flat.elements[0] ?? {})).toBe(false);

    const added = edit([{ op: 'add', element: { kind: 'shape', shape: 'heart', paint: stripes } }]);
    expect(added.elements[1]).toMatchObject({ kind: 'shape', shape: 'heart', paint: stripes, fill: '#ffeedd' });

    const none = edit([{ op: 'style', elementId: 's1', set: { kind: 'shape', paint: null } }]);
    expect(none.elements[0]).toMatchObject({ fill: null });
  });

  it('BKPAINT-015: describe_book_page reads the paint of a shape and of the page', () => {
    const painted = doc([
      {
        id: 'sp1',
        role: 'inner',
        background: '#ffeedd',
        backgroundPaint: stripes,
        elements: [{ id: 's1', kind: 'shape', frame, fill: '#800080', paint: linear }],
      },
    ]);
    const text = describeSpread(painted, 'sp1')?.text ?? '';
    expect(text).toContain('Background stripes pattern, #112233 on #ffeedd');
    expect(text).toContain('(reads as #ffeedd)');
    expect(text).toContain('rect, paint linear gradient towards 45 deg');
    const plain = describeSpread(doc([{ id: 'sp1', elements: [{ id: 's1', kind: 'shape', frame }] }]), 'sp1')?.text;
    expect(plain).toContain('Background paper (none set)');
    expect(plain).toContain('rect, fill #111827');
  });

  it('BKPAINT-016: a book with paint survives the trip through the document contract whole', () => {
    const painted = doc([
      { id: 'sp1', backgroundPaint: radial, background: '#c0c0c0', elements: [shape({ paint: stripes })] },
    ]);
    const again = normalizeBookDocument(JSON.parse(JSON.stringify(painted)));
    expect(again.spreads[0]?.backgroundPaint).toEqual(radial);
    expect(again.spreads[0]?.elements[0]).toMatchObject({ paint: stripes });
  });
});
