import {
  bookElementId,
  bookStickerElement,
  bookStickerSize,
  bookStickerSlotColor,
  type BookPageSetup,
  type BookStickerElement,
  type BookStickerSlot,
  type BookStickerTheme,
} from '@trek/shared';
import { BOOK_STICKERS, bookSticker, searchBookStickers, type BookStickerDef } from '@trek/shared/stickers';

/**
 * The Studio's side of the sticker library: the words each sticker is shown
 * and found by in the reader's language, the shelf of recently used ones, and
 * a new sticker element where it was clicked or dropped.
 *
 * The drawings themselves come from `@trek/shared/stickers`, which only the
 * Studio's chunk imports (this file, StickerView, the panel), so the library
 * arrives with the editor and never with the app shell.
 */

/** Translates a key; the panel and the inspector pass the Studio's `t`. */
type Translate = (key: string) => string;

/** The drag the panel starts and the canvas takes: the sticker id as plain text under its own type. */
export const STICKER_DRAG_TYPE = 'application/x-trek-sticker';

/**
 * A sticker's name in the reader's language (studioStickers.ts in every
 * locale): every id of the library has one, which stickerLibrary.test.ts holds.
 */
export const stickerLabel = (t: Translate, id: string) => t(`journey.studio.sticker.${id}`);

/** A theme's name in the reader's language. */
export const stickerThemeLabel = (t: Translate, theme: BookStickerTheme) => t(`journey.studio.stickerTheme.${theme}`);

const fold = (s: string) => s.toLocaleLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/**
 * Stickers matching what was typed, in one theme or all: the reader's own word
 * for a sticker first (its label), then the library's English search over ids,
 * tags and descriptions, so "Zitrone" finds the lemon in German and "lemon"
 * finds it everywhere.
 */
export function matchStickers(query: string, theme: BookStickerTheme | null, t: Translate): BookStickerDef[] {
  const words = fold(query.trim());
  const pool = theme ? BOOK_STICKERS.filter((s) => s.theme === theme) : BOOK_STICKERS;
  if (!words) return [...pool];
  const byLabel = pool.filter((s) => fold(stickerLabel(t, s.id)).includes(words));
  const byTags = searchBookStickers({ query: words, theme: theme ?? undefined });
  const seen = new Set(byLabel.map((s) => s.id));
  return [...byLabel, ...byTags.filter((s) => !seen.has(s.id))];
}

const RECENT_STORAGE = 'trek.studio.recentStickers';
/** How many recently used stickers the shelf holds: one row of the panel's grid, three times over. */
export const MAX_RECENT_STICKERS = 9;

/** The stickers this viewer placed last, newest first; empty where storage is refused or holds nonsense. */
export function readRecentStickers(): BookStickerDef[] {
  let ids: unknown;
  try {
    ids = JSON.parse(window.localStorage.getItem(RECENT_STORAGE) ?? '[]');
  } catch {
    // Storage refused (a private window) or a value it did not write: the shelf starts empty.
    return [];
  }
  if (!Array.isArray(ids)) return [];
  return ids.flatMap((id) => {
    const def = typeof id === 'string' ? bookSticker(id) : undefined;
    return def ? [def] : [];
  });
}

/** Puts a sticker at the front of the recent shelf and answers the shelf as it is now. */
export function rememberSticker(id: string): BookStickerDef[] {
  const next = [
    id,
    ...readRecentStickers()
      .map((s) => s.id)
      .filter((other) => other !== id),
  ].slice(0, MAX_RECENT_STICKERS);
  try {
    window.localStorage.setItem(RECENT_STORAGE, JSON.stringify(next));
  } catch {
    // Storage refused: the shelf is this visit's only, which is all it promises.
  }
  return next.flatMap((x) => bookSticker(x) ?? []);
}

/**
 * A new sticker element at the panel's size: centred on `at` (where it was
 * dropped), else on the page, the right-hand one of a double spread so it
 * never lands in the fold.
 */
export function newStickerElement(
  def: BookStickerDef,
  page: Pick<BookPageSetup, 'pageWidth' | 'pageHeight'>,
  single: boolean,
  at?: { x: number; y: number }
): BookStickerElement {
  const { w, h } = bookStickerSize(def.box, page);
  const cx = at?.x ?? (single ? page.pageWidth / 2 : page.pageWidth * 1.5);
  const cy = at?.y ?? page.pageHeight / 2;
  const round = (v: number) => Math.round(v * 100) / 100;
  return bookStickerElement(def, { x: round(cx - w / 2), y: round(cy - h / 2), w, h }, bookElementId('k'));
}

/**
 * The sticker a drop onto the page carries, centred where it was let go and
 * put on the recent shelf; null for a drop that carries none (a photo, a file)
 * or an id the library does not hold.
 */
export function stickerDropped(
  id: string,
  page: Pick<BookPageSetup, 'pageWidth' | 'pageHeight'>,
  single: boolean,
  at: { x: number; y: number }
): BookStickerElement | null {
  const def = id ? bookSticker(id) : undefined;
  if (!def) return null;
  rememberSticker(def.id);
  return newStickerElement(def, page, single, at);
}

/** Turned by `by` degrees, kept between -180 and 180 the way the canvas keeps it. */
export function turned(rotation: number, by: number): number {
  let next = (rotation + by) % 360;
  if (next > 180) next -= 360;
  if (next < -180) next += 360;
  return Math.round(next * 10) / 10;
}

/** The colours with slot `slot` set to `color`, the slots before it filled with what they show now. */
export function withSlotColor(
  el: BookStickerElement,
  slots: readonly BookStickerSlot[],
  slot: number,
  color: string
): string[] {
  const named = slots.map((_, i) => bookStickerSlotColor(slots, el.colors, i));
  named[slot] = color;
  return named.slice(0, Math.max(el.colors.length, slot + 1));
}
