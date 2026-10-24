import { rankAssets, type AssetKey } from './book-asset-search';
import {
  BOOK_FONT_FACES,
  BOOK_FONTS_IDS,
  type BookFontCategory,
  type BookFontFamily,
  type BookFontRole,
} from './book-fonts.data';
import { BOOK_LOCKUPS } from './book-lockups.data';
import { BOOK_PATTERNS } from './book-paint.schema';
import { BOOK_FRAME_SHAPES, BOOK_SHAPE_GROUPS } from './book-shape-catalogue';
import { bookShapeTakesEdge } from './book-shapes-more';
import { BOOK_SHAPES } from './book.schema';
import { BOOK_PATTERN_LINES, BOOK_SHAPE_LINES } from './data/book-asset-lines.data';
import { BOOK_STICKER_THEMES } from './stickers/sticker-types';
import type { BookPalette } from './theme/book-theme.schema';
import { BOOK_THEME_PRESETS, type BookThemeFontPick } from './theme/book-themes.data';

import { z } from 'zod';

/**
 * `list_book_assets`: the Studio's catalogues as the assistant searches them,
 * the same ones the Studio's panels show. Stickers are listed behind their own
 * entry point (`@trek/shared/stickers`, for the size of the drawings); the
 * shapes, faces, lockups, themes and patterns here, each a row of what a model
 * needs to pick one it cannot see: its id, one line on what it is, the tags it
 * is found by, and what it takes. Templates are `list_book_layouts`'.
 */

/** What list_book_assets lists. */
export const BOOK_ASSET_KINDS = ['sticker', 'shape', 'font', 'lockup', 'theme', 'pattern'] as const;
export type BookAssetKind = (typeof BOOK_ASSET_KINDS)[number];

/** The most rows one answer holds. */
const MAX_ASSET_ROWS = 40;

/** `list_book_assets`: search the Studio's catalogue of things to put on a page. */
export const listBookAssetsArgs = {
  kind: z
    .enum(BOOK_ASSET_KINDS)
    .describe(
      'What to list: sticker (illustrations), shape (outlines and photo frames), font (typefaces by role), lockup (set titles, badges, postmarks, quotes), theme (palette, faces and motifs) or pattern (the repeats of a paint).',
    ),
  query: z
    .string()
    .trim()
    .max(80)
    .optional()
    .describe('Words to search the ids, tags and descriptions by, such as lemon, paris, arch or script.'),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).optional().describe('Tags every result must carry.'),
  theme: z
    .enum(BOOK_STICKER_THEMES)
    .optional()
    .describe(
      'Stickers only, those of this theme: ephemera, landmarks, tropical, mediterranean, sea, mountains, nordic, asia, food, paper, doodles or ornaments.',
    ),
  limit: z.number().int().min(1).max(MAX_ASSET_ROWS).optional().describe('At most this many rows, 40 by default.'),
};
export const listBookAssetsRequestSchema = z.strictObject(listBookAssetsArgs);
export type ListBookAssetsRequest = z.infer<typeof listBookAssetsRequestSchema>;

interface Row {
  id: string;
  descr: string;
  tags: readonly string[];
}

export interface BookShapeAssetRow extends Row {
  /** Offered as a photo frame (a photo's mask) in the Studio. */
  frame: boolean;
  /** Takes a cut edge: zigzag, scallop, perforated, wavy, torn or deckle. */
  edges: boolean;
}

export interface BookFontAssetRow extends Row {
  weights: readonly number[];
  /** Has a real italic. */
  italic: boolean;
  /** Set in capitals whatever is typed. */
  caps: boolean;
}

export interface BookLockupAssetRow extends Row {
  /** The roles add_lockup takes words for, in the order the lockup sets them. */
  words: readonly string[];
}

export interface BookThemeAssetRow extends Row {
  palette: BookPalette;
  /** Each slot's face as a font id with its weight, null for a theme without a script. */
  fonts: { display: string; heading: string; body: string; script: string | null };
  decoration: string;
}

export type BookCatalogueRow = BookShapeAssetRow | BookFontAssetRow | BookLockupAssetRow | BookThemeAssetRow | Row;

/** The kind of face each picker group is, for a model reading a font's line. */
const CATEGORY_WORDS: Readonly<Record<BookFontCategory, string>> = {
  sans: 'a sans serif',
  serif: 'a book serif',
  elegant: 'an elegant display serif',
  condensed: 'a condensed poster face',
  retro: 'a heavy retro display face',
  script: 'a script',
  mono: 'a monospaced face',
};

function shapeRows(): BookShapeAssetRow[] {
  const groupOf = new Map(BOOK_SHAPE_GROUPS.flatMap((g) => g.shapes.map((s): [string, string] => [s, g.id])));
  const frames = new Set<string>(BOOK_FRAME_SHAPES);
  return BOOK_SHAPES.map((id) => {
    const frame = frames.has(id);
    const edges = bookShapeTakesEdge(id);
    const tags = [groupOf.get(id) ?? 'shape', ...(frame ? ['frame'] : []), ...(edges ? ['edge'] : [])];
    return { id, descr: BOOK_SHAPE_LINES[id], tags, frame, edges };
  });
}

/** What a face set in each role sets, for its line. */
const ROLE_WORDS: Readonly<Record<BookFontRole, string>> = {
  display: 'cover and chapter titles',
  heading: 'headings',
  body: 'running text',
  script: 'words laid over a title or a photo',
  mono: 'figures and coordinates',
};

function fontRows(): BookFontAssetRow[] {
  return BOOK_FONTS_IDS.map((id: BookFontFamily) => {
    const face = BOOK_FONT_FACES[id];
    const caps = 'caps' in face && face.caps === true;
    return {
      id,
      descr: `${face.name}, ${CATEGORY_WORDS[face.category]} for ${face.roles.map((r) => ROLE_WORDS[r]).join(', ')}`,
      tags: [...new Set<string>([face.category, ...face.roles])],
      weights: face.weights,
      italic: face.italics.length > 0,
      caps,
    };
  });
}

function lockupRows(): BookLockupAssetRow[] {
  return BOOK_LOCKUPS.map((l) => {
    const words = [...new Set(l.parts.flatMap((p) => (p.kind === 'text' && !p.literal ? [p.role] : [])))];
    return { id: l.id, descr: l.descr, tags: words, words };
  });
}

const faceOf = (f: BookThemeFontPick) => `${f.font}${f.weight ? ` ${f.weight}` : ''}`;

function themeRows(): BookThemeAssetRow[] {
  return BOOK_THEME_PRESETS.map((t) => ({
    id: t.id,
    descr: t.descr,
    tags: [...t.motifs, t.decoration],
    palette: t.palette,
    fonts: {
      display: faceOf(t.fonts.display),
      heading: faceOf(t.fonts.heading),
      body: faceOf(t.fonts.body),
      script: t.fonts.script ? faceOf(t.fonts.script) : null,
    },
    decoration: t.decoration,
  }));
}

function patternRows(): Row[] {
  return BOOK_PATTERNS.map((id) => ({ id, descr: BOOK_PATTERN_LINES[id], tags: ['pattern'] }));
}

const ROWS: Readonly<Record<Exclude<BookAssetKind, 'sticker'>, () => BookCatalogueRow[]>> = {
  shape: shapeRows,
  font: fontRows,
  lockup: lockupRows,
  theme: themeRows,
  pattern: patternRows,
};

const keyOf = (row: Row): AssetKey => ({
  id: row.id,
  words: [row.id, row.id.replace(/-/g, ' '), ...row.tags, row.descr],
  tags: row.tags,
});

/**
 * `list_book_assets` for every kind but stickers: the rows matching the
 * query and tags, best first, at most `limit` (40), with the total found.
 */
export function listBookCatalogue(
  kind: Exclude<BookAssetKind, 'sticker'>,
  search: { query?: string; tags?: readonly string[]; limit?: number },
): { total: number; rows: BookCatalogueRow[] } {
  const found = rankAssets(ROWS[kind](), keyOf, search.query, search.tags);
  return { total: found.length, rows: found.slice(0, search.limit ?? MAX_ASSET_ROWS) };
}
