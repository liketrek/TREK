import { BOOK_STICKER_THEMES } from '@trek/shared';
import en from '@trek/shared/i18n/en';
import { BOOK_STICKERS, bookSticker } from '@trek/shared/stickers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_RECENT_STICKERS,
  matchStickers,
  newStickerElement,
  readRecentStickers,
  rememberSticker,
  stickerDropped,
  stickerLabel,
  stickerThemeLabel,
} from './stickerLibrary';

/**
 * The Studio's side of the sticker library: every sticker and theme has a name
 * in en (the key the i18n check lets through as a template, see
 * client/scripts/i18n-keys.mjs), the search finds a sticker by its name in the
 * reader's language and by the library's English tags, the recent shelf
 * survives a reload and shrugs off storage it cannot use, and a new sticker
 * lands where it was asked to.
 */

const page = { pageWidth: 210, pageHeight: 210 };
const echo = (k: string) => k;
const strings = en as Record<string, string>;

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('names', () => {
  it('names every sticker of the library and every theme in en', () => {
    for (const s of BOOK_STICKERS) expect(strings[stickerLabel(echo, s.id)], s.id).toEqual(expect.any(String));
    for (const theme of BOOK_STICKER_THEMES) {
      expect(strings[stickerThemeLabel(echo, theme)], theme).toEqual(expect.any(String));
    }
  });
});

describe('matchStickers', () => {
  /** The en names, but the lemon in German: the reader's word for one sticker. */
  const german = (k: string) => (k === 'journey.studio.sticker.lemon' ? 'Zitrone' : (strings[k] ?? k));

  it('lists a theme, or the whole library, when nothing is typed', () => {
    expect(matchStickers('', null, echo)).toHaveLength(BOOK_STICKERS.length);
    expect(matchStickers('  ', 'food', echo).every((s) => s.theme === 'food')).toBe(true);
  });

  it('finds a sticker by its name in the reader language first, then by the English tags', () => {
    expect(matchStickers('zitrone', null, german)[0]?.id).toBe('lemon');
    // The names that say lemon come first, then what the English tags find, the lemon itself among them.
    const english = matchStickers('lemon', null, german).map((s) => s.id);
    expect(english.slice(0, 2)).toEqual(['lemonBranch', 'lemonVase']);
    expect(english).toContain('lemon');
    expect(new Set(english).size).toBe(english.length);
    expect(matchStickers('lemon', 'food', german)).toEqual([]);
  });
});

describe('the recent shelf', () => {
  it('keeps the stickers placed last, newest first, without repeats, up to its size', () => {
    expect(readRecentStickers()).toEqual([]);
    rememberSticker('lemon');
    rememberSticker('sun');
    expect(rememberSticker('lemon').map((s) => s.id)).toEqual(['lemon', 'sun']);
    for (const s of BOOK_STICKERS.slice(0, 12)) rememberSticker(s.id);
    expect(readRecentStickers()).toHaveLength(MAX_RECENT_STICKERS);
    expect(readRecentStickers()[0]?.id).toBe(BOOK_STICKERS[11]?.id);
  });

  it('starts empty from storage it did not write or cannot read, and leaves out ids it does not know', () => {
    window.localStorage.setItem('trek.studio.recentStickers', '{nope');
    expect(readRecentStickers()).toEqual([]);
    window.localStorage.setItem('trek.studio.recentStickers', '{"a":1}');
    expect(readRecentStickers()).toEqual([]);
    window.localStorage.setItem('trek.studio.recentStickers', '["sun","unicornCastle",3]');
    expect(readRecentStickers().map((s) => s.id)).toEqual(['sun']);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readRecentStickers()).toEqual([]);
    expect(rememberSticker('sun').map((s) => s.id)).toEqual(['sun']);
  });
});

describe('a new sticker', () => {
  const lemon = bookSticker('lemon');
  if (!lemon) throw new Error('the library holds a lemon');

  it('arrives centred on the right-hand page of a spread, or on a single page, at the panel size', () => {
    const onSpread = newStickerElement(lemon, page, false);
    expect(onSpread).toMatchObject({ kind: 'sticker', stickerId: 'lemon', colors: [], flipX: false });
    expect(onSpread.frame).toEqual({ x: 283.5, y: 79.8, w: 63, h: 50.4 });
    expect(newStickerElement(lemon, page, true).frame.x).toBe(73.5);
    expect(newStickerElement(lemon, page, false, { x: 50, y: 50 }).frame).toMatchObject({ x: 18.5, y: 24.8 });
  });

  it('comes from a drop that carries a sticker the library holds, and goes on the shelf', () => {
    expect(stickerDropped('', page, false, { x: 0, y: 0 })).toBeNull();
    expect(stickerDropped('unicornCastle', page, false, { x: 0, y: 0 })).toBeNull();
    expect(stickerDropped('sun', page, true, { x: 100, y: 100 })?.frame).toMatchObject({ x: 68.5, y: 68.5 });
    expect(readRecentStickers().map((s) => s.id)).toEqual(['sun']);
  });
});
