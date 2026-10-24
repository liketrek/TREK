import { listBookAssetsRequestSchema } from './book-assets';
import { normalizeBookDocument } from './book-normalize';
import {
  STICKER_INK,
  bookStickerColors,
  bookStickerElement,
  bookStickerLayerPaint,
  bookStickerSize,
  bookStickerSlotColor,
  bookStickerWords,
  isBookSticker,
} from './book-sticker';
import { bookElementSchema, bookStickerElementSchema } from './book.schema';

import { describe, expect, it } from 'vitest';

// STK-001 to STK-006

const slots = [
  { name: 'petals', color: '#e63946' },
  { name: 'leaves', color: '#2d936c' },
];

describe('painting a sticker', () => {
  it('STK-001: a slot takes the colour chosen for it, else its own, and an unknown slot the ink', () => {
    expect(bookStickerSlotColor(slots, [], 0)).toBe('#e63946');
    expect(bookStickerSlotColor(slots, ['#000000'], 0)).toBe('#000000');
    expect(bookStickerSlotColor(slots, ['#000000'], 1)).toBe('#2d936c');
    expect(bookStickerSlotColor(slots, [], 3)).toBe(STICKER_INK);
  });

  it('STK-002: shade and light are translucent black and white, ink and paper fixed, a hex itself', () => {
    expect(bookStickerLayerPaint({ p: 1, d: 'M0 0Z' }, slots, ['#111111', '#222222'])).toEqual({
      color: '#222222',
      opacity: 1,
    });
    expect(bookStickerLayerPaint({ p: 'shade', d: 'M0 0Z' }, slots, [])).toEqual({ color: '#000000', opacity: 0.18 });
    expect(bookStickerLayerPaint({ p: 'light', d: 'M0 0Z', o: 0.6 }, slots, [])).toEqual({
      color: '#ffffff',
      opacity: 0.6,
    });
    expect(bookStickerLayerPaint({ p: 'ink', d: 'M0 0Z' }, slots, [])).toEqual({ color: STICKER_INK, opacity: 1 });
    expect(bookStickerLayerPaint({ p: 'paper', d: 'M0 0Z', o: 0.5 }, slots, [])).toEqual({
      color: '#ffffff',
      opacity: 0.5,
    });
    expect(bookStickerLayerPaint({ p: '#abcdef', d: 'M0 0Z' }, slots, [])).toEqual({ color: '#abcdef', opacity: 1 });
  });
});

describe('placing a sticker', () => {
  it('STK-003: arrives with its longer side three tenths of the shorter page side, in its own proportions', () => {
    expect(bookStickerSize([100, 50], { pageWidth: 210, pageHeight: 210 })).toEqual({ w: 63, h: 31.5 });
    expect(bookStickerSize([50, 100], { pageWidth: 297, pageHeight: 210 })).toEqual({ w: 31.5, h: 63 });
    const frame = { x: 1, y: 2, w: 3, h: 4 };
    const el = bookStickerElement({ id: 'lemon' }, frame, 'k1');
    expect(el).toEqual({
      id: 'k1',
      kind: 'sticker',
      frame,
      rotation: 0,
      opacity: 1,
      locked: false,
      stickerId: 'lemon',
      colors: [],
      flipX: false,
    });
    expect(isBookSticker(el)).toBe(true);
    expect(bookStickerColors({ slots }, ['#000001', '#000002', '#000003'])).toEqual(['#000001', '#000002']);
    expect(bookStickerColors({ slots }, undefined)).toEqual([]);
  });

  it('STK-004: says what it is, what colours it wears and whether it is flipped', () => {
    const el = bookStickerElement({ id: 'sun' }, { x: 0, y: 0, w: 10, h: 10 }, 'k1');
    expect(bookStickerWords(el)).toBe('sticker sun');
    expect(bookStickerWords({ ...el, colors: ['#111111', '#222222'], flipX: true })).toBe(
      'sticker sun, colours #111111 #222222, flipped',
    );
  });
});

describe('the sticker element and the asset search in the contract', () => {
  it('STK-005: reads with its defaults, and drops a sticker with an id or colours it cannot read, not the book', () => {
    const frame = { x: 0, y: 0, w: 10, h: 10 };
    expect(bookStickerElementSchema.parse({ id: 'k', kind: 'sticker', frame, stickerId: 'lemon' })).toMatchObject({
      colors: [],
      flipX: false,
      rotation: 0,
    });
    expect(bookElementSchema.safeParse({ id: 'k', kind: 'sticker', frame, stickerId: 'Lemon!' }).success).toBe(false);
    const five = ['#000000', '#000000', '#000000', '#000000', '#000000'];
    expect(
      bookElementSchema.safeParse({ id: 'k', kind: 'sticker', frame, stickerId: 'lemon', colors: five }).success,
    ).toBe(false);
    const elements = [
      { id: 'good', kind: 'sticker', frame, stickerId: 'lemon' },
      { id: 'bad', kind: 'sticker', frame, stickerId: '' },
    ];
    const doc = normalizeBookDocument({ spreads: [{ id: 's1', role: 'inner', elements }] });
    expect(doc.spreads[0]?.elements.map((e) => e.id)).toEqual(['good']);
  });

  it('STK-006: list_book_assets takes a kind of the catalogues, a query, tags, a theme and a limit, nothing else', () => {
    expect(
      listBookAssetsRequestSchema.parse({ kind: 'sticker', query: ' lemon ', theme: 'mediterranean', limit: 5 }),
    ).toEqual({
      kind: 'sticker',
      query: 'lemon',
      theme: 'mediterranean',
      limit: 5,
    });
    // Templates are list_book_layouts': not a kind of this tool.
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'template' }).success).toBe(false);
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'font' }).success).toBe(true);
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'sticker', limit: 41 }).success).toBe(false);
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'sticker', theme: 'moon' }).success).toBe(false);
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'sticker', extra: 1 }).success).toBe(false);
  });
});
