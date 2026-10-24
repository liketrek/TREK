import { artFindings, briefFindings, pageArtFindings, themeFindings } from './book-findings-art';
import { designFindings } from './book-findings-design';
import { BOOK_FINDING_CODES, type BookFinding } from './book-ops.schema';
import { blankBook, bookPageSetupForPreset } from './book-pages';
import {
  bookLineElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from './book.schema';
import { describeSpread } from './describe-spread';
import { bookThemeOf } from './theme/book-theme';

import { describe, expect, it } from 'vitest';

/**
 * The art checks (book-findings-art.ts) on small fixture pages of the default
 * square book: a flat cover, a page without a lead, colours and faces
 * outside the theme, and a designed book judged against its brief.
 */

type Frame = { x: number; y: number; w: number; h: number };

const text = (id: string, words: string, size: number, over = {}) =>
  bookTextElementSchema.parse({
    id,
    kind: 'text',
    frame: { x: 20, y: 20, w: 170, h: 40 },
    text: words,
    size,
    ...over,
  }) as BookElement;
const photo = (id: string, frame: Frame, over = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId: 7, ...over }) as BookElement;
const shape = (id: string, frame: Frame, over = {}) =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame, ...over }) as BookElement;
const line = (id: string, over = {}) =>
  bookLineElementSchema.parse({ id, kind: 'line', frame: { x: 20, y: 70, w: 120, h: 4 }, ...over }) as BookElement;
const sticker = (id: string, over = {}) =>
  bookStickerElementSchema.parse({
    id,
    kind: 'sticker',
    frame: { x: 30, y: 30, w: 30, h: 30 },
    stickerId: 'lemon',
    ...over,
  }) as BookElement;

const spread = (elements: BookElement[], over: Partial<BookSpread> = {}): BookSpread => ({
  id: 'sp-1',
  role: 'cover',
  background: null,
  elements,
  parked: [],
  entryId: null,
  ...over,
});

const page = blankBook({ title: 'T' }).page;
const codes = (list: readonly BookFinding[]) => list.map((f) => `${f.severity}:${f.code}`);
const art = (elements: BookElement[], over: Partial<BookSpread> = {}) =>
  codes(artFindings(spread(elements, over), page));

describe('a flat cover', () => {
  it('BKART-001: is a cover with a small title and nothing else to carry it', () => {
    expect(art([text('t', 'Atlantic coast', 28)])).toEqual(['warn:flat_cover']);
    expect(art([photo('p', { x: 40, y: 40, w: 120, h: 80 }), text('t', 'Atlantic coast', 28)])).toContain(
      'warn:flat_cover',
    );
    // A scrim fading over a photo and a hairline rule carry nothing.
    const scrim = shape('s', { x: 0, y: 120, w: 210, h: 90 }, { gradient: 'up', fill: '#111111', opacity: 0.6 });
    expect(art([scrim, text('t', 'Coast', 28), shape('r', { x: 20, y: 70, w: 30, h: 0.5 })])).toEqual([
      'warn:flat_cover',
    ]);
    // A plain hairline is a rule whatever its kind, and a near white paint is the paper.
    expect(art([text('t', 'Coast', 28), line('l', { strokeWidth: 0.4 })])).toEqual(['warn:flat_cover']);
    expect(art([text('t', 'Coast', 28)], { backgroundPaint: { type: 'solid', color: '#fafafa' } })).toEqual([
      'warn:flat_cover',
    ]);
  });

  it('BKART-002: is not a cover with big type, a picture over most of it, a colour block, a drawing or a coloured page', () => {
    expect(art([text('t', 'Coast', 48)])).toEqual([]);
    expect(art([photo('p', { x: -3, y: -3, w: 216, h: 216 }), text('t', 'Coast', 28)])).toEqual([]);
    const grid = [0, 1, 2, 3].map((i) =>
      photo(`p${i}`, { x: (i % 2) * 106, y: Math.floor(i / 2) * 106, w: 104, h: 104 }),
    );
    expect(art([...grid, text('t', 'Coast', 28)])).toEqual([]);
    expect(art([shape('b', { x: 0, y: 0, w: 210, h: 90 }, { fill: '#ef4e45' }), text('t', 'Coast', 28)])).toEqual([]);
    expect(art([sticker('k'), text('t', 'Coast', 28)])).toEqual([]);
    expect(art([text('t', 'Coast', 28)], { background: '#1d3557' })).toEqual([]);
    expect(art([text('t', 'Coast', 28)], { backgroundPaint: { type: 'solid', color: '#1d3557' } })).toEqual([]);
    const checker = { type: 'pattern', pattern: 'checker', fg: '#ef4e45', bg: '#ffffff', scale: 1, angle: 0 } as const;
    expect(art([text('t', 'Coast', 28)], { backgroundPaint: checker })).toEqual([]);
    // A rule with an ornament or a bar's weight is a drawing; a gradient in a colour is a colour block.
    expect(art([text('t', 'Coast', 28), line('l', { ornament: 'sun' })])).toEqual([]);
    expect(art([text('t', 'Coast', 28), line('l', { strokeWidth: 3 })])).toEqual([]);
    const fade = shape('g', { x: 0, y: 0, w: 210, h: 90 }, { gradient: 'down', fill: '#ef4e45' });
    expect(art([fade, text('t', 'Coast', 28)])).toEqual([]);
  });

  it('BKART-012: weighs its sizes against a page 210 mm wide, larger on a larger page', () => {
    const large = bookPageSetupForPreset('square-300');
    expect(codes(artFindings(spread([text('t', 'Coast', 60)]), large))).toEqual(['warn:flat_cover']);
    expect(art([text('t', 'Coast', 60)])).toEqual([]);
    const inner = { role: 'inner' as const };
    expect(codes(artFindings(spread([text('a', 'Stops', 24), text('b', 'Day one', 14)], inner), large))).toEqual([]);
    expect(art([text('a', 'Stops', 24), text('b', 'Day one', 14)], inner)).toEqual(['info:weak_hierarchy']);
  });

  it('BKART-003: is a cover only, never an empty one, and is said with the design findings', () => {
    expect(art([])).toEqual([]);
    expect(art([text('t', 'Coast', 28)], { role: 'inner' })).toEqual([]);
    expect(art([text('t', 'Coast', 28)], { role: 'back' })).toEqual([]);
    const said = designFindings(spread([text('t', 'Atlantic coast', 28)]), page);
    expect(said.find((f) => f.code === 'flat_cover')?.elementIds).toEqual(['t']);
  });
});

describe('a weak hierarchy', () => {
  const inner = { role: 'inner' as const };

  it('BKART-004: is a page whose largest words are under twice the next', () => {
    expect(art([text('a', 'Porto', 30), text('b', 'Day three', 20)], inner)).toEqual(['info:weak_hierarchy']);
    expect(art([text('a', 'Porto', 30), text('b', 'Day three', 15)], inner)).toEqual([]);
    expect(
      artFindings(spread([text('a', 'Porto', 30), text('b', 'Day three', 20)], inner), page)[0]?.elementIds,
    ).toEqual(['a', 'b']);
  });

  it('BKART-005: weighs no script, no echo of the same words, no hidden text and no page without a title', () => {
    const script = text('s', 'travel', 40, { font: 'caveat' });
    expect(art([script, text('a', 'Porto', 30), text('b', 'May', 9)], inner)).toEqual([]);
    expect(art([text('a', 'Porto', 30), text('a2', 'Porto', 30), text('b', 'May', 9)], inner)).toEqual([]);
    expect(art([text('a', 'Porto', 30), text('b', 'Day three', 20, { hidden: true })], inner)).toEqual([]);
    expect(art([text('a', 'Porto', 16), text('b', 'Day three', 14)], inner)).toEqual([]);
  });
});

describe('colours and faces outside the theme', () => {
  const theme = bookThemeOf('riviera');
  const doc = (elements: BookElement[]): BookDocument => {
    const book = blankBook({ title: 'T' });
    const spreads = book.spreads.map((s) => (s.role === 'inner' ? { ...s, elements } : s));
    return { ...book, spreads, theme };
  };
  const off = (elements: BookElement[]) => themeFindings(spread(elements, { role: 'inner' }), theme);

  it('BKART-006: are said once a page, naming the elements and what strays', () => {
    const found = off([text('a', 'Porto', 12, { color: '#ff00ff' }), text('b', 'May', 9, { font: 'bebas' })]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ code: 'off_theme', severity: 'info', elementIds: ['a', 'b'] });
    expect(found[0]?.message).toContain('#ff00ff');
    expect(found[0]?.message).toContain('bebas');
  });

  it('BKART-007: leave alone what follows the theme, neutral greys, mono lines, photos, stickers and a book without one', () => {
    const accent = theme.palette.accent;
    expect(off([text('a', 'Porto', 12, { color: '#ff00ff', token: 'accent', fontRole: 'body' })])).toEqual([]);
    expect(off([text('a', 'Porto', 12, { color: accent, font: theme.fonts.heading.font })])).toEqual([]);
    expect(off([text('a', 'Porto', 12, { color: '#111111', font: 'bebas', fontRole: 'heading' })])).toEqual([]);
    expect(
      off([text('a', '41.15 N', 9, { font: 'mono' }), photo('p', { x: 0, y: 0, w: 50, h: 50 }), sticker('k')]),
    ).toEqual([]);
    expect(themeFindings(spread([text('a', 'Porto', 12, { color: '#ff00ff' })]), undefined)).toEqual([]);
  });

  it('BKART-008: reach the model with the page it describes', () => {
    const book = doc([text('a', 'Porto', 12, { color: '#ff00ff' })]);
    const inner = book.spreads.find((s) => s.role === 'inner') as BookSpread;
    const described = describeSpread(book, inner.id);
    expect(described?.findings.map((f) => f.code)).toContain('off_theme');
    expect(described?.text).toContain('off_theme');
  });
});

describe('a book against its brief', () => {
  const book = (stickers: number, turn: number): BookDocument => {
    const base = blankBook({ title: 'T' });
    const elements = [
      photo('p', { x: 20, y: 20, w: 120, h: 90 }, { rotation: turn }),
      ...Array.from({ length: stickers }, (_, i) => sticker(`k${i}`)),
    ];
    return { ...base, spreads: base.spreads.map((s) => (s.role === 'inner' ? { ...s, elements } : s)) };
  };

  it('BKART-009: says the photo pages whose stickers fall outside the decoration asked for', () => {
    const light = { energy: 'lively', decoration: 'light', bare: false } as const;
    expect(briefFindings(book(1, 4), light)).toEqual([]);
    const none = briefFindings(book(0, 4), light);
    expect(none.map((f) => f.code)).toEqual(['energy_mismatch']);
    expect(none[0]?.message).toContain('1 to 2 per spread');
    expect(codes(briefFindings(book(7, 4), { energy: 'loud', decoration: 'rich', bare: false }))).toEqual([
      'info:energy_mismatch',
    ]);
    expect(briefFindings(book(1, 0), { energy: 'calm', decoration: 'none', bare: true })).toHaveLength(1);
  });

  it('BKART-010: says photos turned past what the energy takes, or none turned in a lively book', () => {
    const calm = briefFindings(book(0, 8), { energy: 'calm', decoration: 'none', bare: false });
    expect(calm).toHaveLength(1);
    expect(calm[0]?.elementIds).toEqual(['p']);
    expect(briefFindings(book(0, 1), { energy: 'calm', decoration: 'none', bare: false })).toEqual([]);
    const flat = briefFindings(book(1, 0), { energy: 'lively', decoration: 'light', bare: false });
    expect(flat.map((f) => f.message)).toEqual([expect.stringContaining('the book reads calm')]);
  });

  /** A book of inner photo pages, each with this many stickers and its photo turned so far. */
  const pages = (stickers: readonly number[], turn = 4): BookDocument => {
    const base = blankBook({ title: 'T' });
    const inner = stickers.map((n, i) => ({
      id: `sp-${i}`,
      role: 'inner' as const,
      background: null,
      parked: [],
      entryId: null,
      elements: [
        photo(`p${i}`, { x: 20, y: 20, w: 120, h: 90 }, { rotation: turn }),
        ...Array.from({ length: n }, (_, k) => sticker(`k${i}-${k}`)),
      ],
    }));
    return { ...base, spreads: [base.spreads[0] as BookSpread, ...inner] };
  };
  const light = { energy: 'lively', decoration: 'light', bare: false } as const;

  it('BKART-013: judges only the pages the design made, a third of them under the decoration before it says so', () => {
    expect(briefFindings(pages([0, 1, 1, 2]), light)).toEqual([]);
    expect(codes(briefFindings(pages([0, 0, 1, 2]), light))).toEqual(['info:energy_mismatch']);
    // A page kept as it was is the person's: neither its stickers nor its turns are judged.
    expect(codes(briefFindings(pages([5, 1]), light))).toEqual(['info:energy_mismatch']);
    expect(briefFindings(pages([5, 1]), light, { kept: ['sp-0'] })).toEqual([]);
    expect(codes(briefFindings(pages([1, 1], 12), light))).toEqual(['info:energy_mismatch']);
    expect(briefFindings(pages([1, 1], 12), light, { kept: ['sp-0', 'sp-1'], lively: true })).toEqual([]);
  });

  it('BKART-014: judges a page alone when named, and a book with lively pages as lively whatever its turns', () => {
    // One page named: too many stickers is said, too few and the book reading calm are not.
    expect(briefFindings(pages([0], 0), light, { only: ['sp-0'] })).toEqual([]);
    expect(codes(briefFindings(pages([4], 0), light, { only: ['sp-0'] }))).toEqual(['info:energy_mismatch']);
    expect(briefFindings(pages([1], 0), light, { lively: true })).toEqual([]);
    expect(briefFindings(pages([1], 0), light)[0]?.message).toContain('no page is lively');
    // A calm book turns as far as its theme does.
    const calm = { energy: 'calm', decoration: 'none', bare: false } as const;
    expect(briefFindings(pages([0], 4), { ...calm, tilt: [0, 4] })).toEqual([]);
    expect(codes(briefFindings(pages([0], 4), calm))).toEqual(['info:energy_mismatch']);
  });

  it('BKART-015: a changed page answers the art checks and what strays from the theme together', () => {
    const theme = bookThemeOf('riviera');
    const cover = spread([text('t', 'Atlantic coast', 28, { color: '#ff00ff' })]);
    expect(codes(pageArtFindings(cover, page, theme))).toEqual(['warn:flat_cover', 'info:off_theme']);
    expect(codes(pageArtFindings(cover, page, undefined))).toEqual(['warn:flat_cover']);
  });

  it('BKART-011: every art finding is a code the book tools answer with', () => {
    for (const code of ['flat_cover', 'weak_hierarchy', 'off_theme', 'energy_mismatch', 'raster_effect']) {
      expect(BOOK_FINDING_CODES).toContain(code);
    }
  });
});
