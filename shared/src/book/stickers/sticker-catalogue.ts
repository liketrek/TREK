import { rankAssets, type AssetKey } from '../book-asset-search';
import type { BookStickerLookup } from '../book-sticker';
import { ASIA_STICKERS } from './data/asia.data';
import { DOODLES_STICKERS } from './data/doodles.data';
import { EPHEMERA_STICKERS } from './data/ephemera.data';
import { FOOD_STICKERS } from './data/food.data';
import { LANDMARKS_STICKERS } from './data/landmarks.data';
import { MEDITERRANEAN_STICKERS } from './data/mediterranean.data';
import { MOUNTAINS_STICKERS } from './data/mountains.data';
import { NORDIC_STICKERS } from './data/nordic.data';
import { ORNAMENTS_STICKERS } from './data/ornaments.data';
import { PAPER_STICKERS } from './data/paper.data';
import { SEA_STICKERS } from './data/sea.data';
import { TROPICAL_STICKERS } from './data/tropical.data';
import { BOOK_STICKER_THEMES, type BookStickerDef, type BookStickerTheme } from './sticker-types';

/**
 * The sticker library: every drawing the Studio offers and the assistant may
 * place, in the order the Studio lists them, with the lookups both use.
 *
 * Behind its own entry point (`@trek/shared/stickers`) because it is data, a
 * lot of it: the client's Studio chunk imports it, and so does the server's
 * book engine context and its `list_book_assets` tool, but nothing that every
 * screen loads. The book contract and the edit engine only ever see the facts
 * of one sticker, through `BookStickerLookup`.
 *
 * The lists are built by pure calls, marked so a bundler can drop the whole
 * library from a chunk that never reads it.
 */

function byTheme(...lists: (readonly BookStickerDef[])[]): readonly BookStickerDef[] {
  const all = lists.flat();
  return BOOK_STICKER_THEMES.flatMap((theme) => all.filter((s) => s.theme === theme));
}

export const BOOK_STICKERS: readonly BookStickerDef[] = /* @__PURE__ */ byTheme(
  EPHEMERA_STICKERS,
  LANDMARKS_STICKERS,
  TROPICAL_STICKERS,
  MEDITERRANEAN_STICKERS,
  SEA_STICKERS,
  MOUNTAINS_STICKERS,
  NORDIC_STICKERS,
  ASIA_STICKERS,
  FOOD_STICKERS,
  PAPER_STICKERS,
  DOODLES_STICKERS,
  ORNAMENTS_STICKERS,
);

const BY_ID: ReadonlyMap<string, BookStickerDef> = /* @__PURE__ */ new Map(BOOK_STICKERS.map((s) => [s.id, s]));

/** One sticker by id, or undefined for an id this library does not hold (a newer book, a typo). */
export function bookSticker(id: string): BookStickerDef | undefined {
  return BY_ID.get(id);
}

/** The lookup the edit engine takes in its context. */
export const bookStickerLookup: BookStickerLookup = (id) => BY_ID.get(id);

/** The stickers of one theme, in library order. */
export function bookStickersOf(theme: BookStickerTheme): BookStickerDef[] {
  return BOOK_STICKERS.filter((s) => s.theme === theme);
}

/** The words a sticker is found by: its id split at the capitals, its theme, its tags and its description. */
function keyOf(s: BookStickerDef): AssetKey {
  const idWords = s.id.replace(/([a-z])([A-Z])/g, '$1 $2');
  return { id: s.id, words: [s.id, idWords, s.theme, ...s.tags, s.descr], tags: s.tags };
}

export interface BookStickerSearch {
  query?: string;
  tags?: readonly string[];
  theme?: BookStickerTheme;
  limit?: number;
}

/**
 * Stickers matching a search, best first, library order between equals:
 * every word of the query has to be found, and a word that is a tag or the id
 * itself counts for more than one buried in the description, so "lemon" lists
 * the lemon before the vase of lemons (book-asset-search.ts).
 */
export function searchBookStickers(search: BookStickerSearch = {}): BookStickerDef[] {
  const pool = BOOK_STICKERS.filter((s) => !search.theme || s.theme === search.theme);
  const ranked = rankAssets(pool, keyOf, search.query, search.tags);
  return ranked.slice(0, search.limit ?? ranked.length);
}

/** One row of `list_book_assets`: what a model needs to choose a sticker it cannot see, and to colour it. */
export interface BookAssetRow {
  id: string;
  theme: BookStickerTheme;
  descr: string;
  tags: readonly string[];
  /** Width over height of the drawing; a frame of another shape leaves air around it. */
  aspect: number;
  /** The colours the `colors` field sets, in order, with their defaults. */
  slots: readonly { name: string; default: string }[];
}

/** `list_book_assets` for stickers: at most `limit` rows (40), the library's own order without a query. */
export function listBookAssets(search: BookStickerSearch): { total: number; rows: BookAssetRow[] } {
  const found = searchBookStickers({ ...search, limit: undefined });
  const rows = found.slice(0, search.limit ?? 40).map((s) => ({
    id: s.id,
    theme: s.theme,
    descr: s.descr,
    tags: s.tags,
    aspect: Math.round((s.box[0] / s.box[1]) * 100) / 100,
    slots: s.slots.map((slot) => ({ name: slot.name, default: slot.color })),
  }));
  return { total: found.length, rows };
}
