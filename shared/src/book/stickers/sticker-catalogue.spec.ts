import { BOOK_STICKER_ID_PATTERN, MAX_STICKER_ID } from '../book-sticker';
import { bookStickerElementSchema } from '../book.schema';
import {
  BOOK_STICKERS,
  bookSticker,
  bookStickerLookup,
  bookStickersOf,
  listBookAssets,
  searchBookStickers,
} from './sticker-catalogue';
import { BOOK_STICKER_THEMES, MAX_STICKER_SLOTS } from './sticker-types';

import { describe, expect, it } from 'vitest';

// STKCAT-001 to STKCAT-007

/**
 * The sticker library as data: every motif readable by the renderer and the
 * contract, licensed, searchable, and grouped by the themes the Studio lists.
 */

const HEX = /^#[0-9a-f]{6}$/i;
/** What a layer's path may hold: the absolute move, line and curve commands the drafts are written in. */
const PATH = /^M[\d.\- MLCZ]+$/;

describe('the library', () => {
  it('STKCAT-001: holds well over a hundred stickers, at least eight per theme, in theme order', () => {
    expect(BOOK_STICKERS.length).toBeGreaterThanOrEqual(120);
    for (const theme of BOOK_STICKER_THEMES) expect(bookStickersOf(theme).length, theme).toBeGreaterThanOrEqual(8);
    const order = BOOK_STICKERS.map((s) => BOOK_STICKER_THEMES.indexOf(s.theme));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('STKCAT-002: gives every sticker a unique id the document can store', () => {
    const ids = BOOK_STICKERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, id).toMatch(BOOK_STICKER_ID_PATTERN);
      expect(id.length, id).toBeLessThanOrEqual(MAX_STICKER_ID);
      const frame = { x: 0, y: 0, w: 10, h: 10 };
      expect(bookStickerElementSchema.safeParse({ id: 'k', kind: 'sticker', frame, stickerId: id }).success).toBe(true);
    }
  });

  it('STKCAT-003: draws every sticker from well-formed layers in a real box, painted only with slots it has', () => {
    for (const s of BOOK_STICKERS) {
      const [w, h] = s.box;
      expect(w > 0 && h > 0, s.id).toBe(true);
      expect(s.slots.length, s.id).toBeGreaterThanOrEqual(1);
      expect(s.slots.length, s.id).toBeLessThanOrEqual(MAX_STICKER_SLOTS);
      for (const slot of s.slots) expect(slot.color, `${s.id} ${slot.name}`).toMatch(HEX);
      expect(s.layers.length, s.id).toBeGreaterThan(0);
      for (const layer of s.layers) {
        expect(layer.d, s.id).toMatch(PATH);
        if (typeof layer.p === 'number') expect(layer.p, s.id).toBeLessThan(s.slots.length);
        else if (layer.p.startsWith('#')) expect(layer.p, s.id).toMatch(HEX);
        else expect(['shade', 'light', 'ink', 'paper'], s.id).toContain(layer.p);
        if (layer.o !== undefined) expect(layer.o > 0 && layer.o <= 1, s.id).toBe(true);
        if (layer.w !== undefined) expect(layer.w > 0, s.id).toBe(true);
      }
      // Every slot is used by at least one layer, or recolouring it would do nothing.
      for (let i = 0; i < s.slots.length; i++)
        expect(
          s.layers.some((l) => l.p === i),
          `${s.id} slot ${i}`,
        ).toBe(true);
    }
  });

  it('STKCAT-004: says for every sticker what it is, where it belongs and that it is drawn in-house', () => {
    for (const s of BOOK_STICKERS) {
      expect(s.license, s.id).toBe('in-house');
      expect(s.tags.length, s.id).toBeGreaterThanOrEqual(4);
      expect(s.descr.length, s.id).toBeGreaterThan(20);
      expect(s.descr.length, s.id).toBeLessThanOrEqual(240);
      expect(s.descr, s.id).not.toMatch(/[–—]/);
    }
  });
});

describe('finding a sticker', () => {
  it('STKCAT-005: looks one up by id, and answers nothing for an id it does not hold', () => {
    expect(bookSticker('eiffelTower')?.theme).toBe('landmarks');
    expect(bookStickerLookup('lemon')?.slots.length).toBe(2);
    expect(bookSticker('unicornCastle')).toBeUndefined();
    expect(bookStickerLookup('')).toBeUndefined();
  });

  it('STKCAT-006: searches ids, tags and descriptions, the closest match first, in any case and accent', () => {
    expect(searchBookStickers({ query: 'lemon' })[0]?.id).toBe('lemon');
    expect(searchBookStickers({ query: 'LEMON' }).map((s) => s.id)).toContain('lemonVase');
    expect(searchBookStickers({ query: 'eiffel tower' })[0]?.id).toBe('eiffelTower');
    expect(searchBookStickers({ query: 'Café' }).length).toBeGreaterThan(0);
    expect(searchBookStickers({ query: 'tape', theme: 'paper' }).every((s) => s.theme === 'paper')).toBe(true);
    expect(searchBookStickers({ tags: ['washi tape'] }).length).toBeGreaterThanOrEqual(5);
    expect(searchBookStickers({ query: 'zzzz' })).toEqual([]);
    expect(searchBookStickers({ limit: 3 })).toHaveLength(3);
    expect(searchBookStickers()).toHaveLength(BOOK_STICKERS.length);
  });

  it('STKCAT-007: list_book_assets answers rows a model can pick from, at most forty, with the total', () => {
    const all = listBookAssets({});
    expect(all.total).toBe(BOOK_STICKERS.length);
    expect(all.rows).toHaveLength(40);
    const lemon = listBookAssets({ query: 'lemon', limit: 2 });
    expect(lemon.rows).toHaveLength(2);
    expect(lemon.rows[0]).toEqual({
      id: 'lemon',
      theme: 'mediterranean',
      descr: bookSticker('lemon')?.descr,
      tags: bookSticker('lemon')?.tags,
      aspect: 1.25,
      slots: [
        { name: 'lemon', default: '#ffd23f' },
        { name: 'leaves', default: '#3f8f4f' },
      ],
    });
    expect(lemon.total).toBeGreaterThan(2);
  });
});
