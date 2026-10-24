import { z } from 'zod';

/**
 * A book's theme: its palette, its typefaces by role and the motifs that
 * belong to it, kept on the document so "apply theme" has something to
 * apply and the next one something to replace.
 *
 * ── Concrete values, optional links ──────────────────────────────────────
 *
 * Every element keeps its real `#rrggbb` and its real font, exactly as
 * before. A theme adds a *link* beside them: `token` names the palette entry
 * a colour came from, `fontRole` the typeface slot a text was set in. Applying
 * a theme rewrites what is linked and leaves the rest alone, so a reader from
 * before themes still draws every page, and a colour somebody picked by hand
 * stays theirs.
 *
 * This file imports nothing from book.schema.ts, which imports from it. The
 * fonts a theme names are plain ids here, checked against the catalogue
 * (book-fonts.data.ts) where they are applied, so a theme naming a family a
 * newer build added leaves those texts in their own face rather than failing.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');

/** The five colours a theme is made of. */
export const BOOK_PALETTE_KEYS = ['paper', 'ink', 'accent', 'accent2', 'accent3'] as const;
export type BookPaletteKey = (typeof BOOK_PALETTE_KEYS)[number];

/**
 * What a colour may be linked to: the five palette entries, and `muted`, the
 * softer ink captions and meta lines are set in. Muted is not stored; it is
 * derived from the ink and the paper (book-theme.ts), which is what keeps a
 * caption readable on whatever paper the next theme brings.
 */
export const BOOK_COLOR_TOKENS = ['paper', 'ink', 'muted', 'accent', 'accent2', 'accent3'] as const;
export type BookColorToken = (typeof BOOK_COLOR_TOKENS)[number];

/** The typeface slots of a theme, by what they set. */
export const BOOK_FONT_SLOTS = ['display', 'heading', 'body', 'script'] as const;
export type BookFontSlot = (typeof BOOK_FONT_SLOTS)[number];

/** The built-in themes, in the order the Studio shows them. */
export const BOOK_THEME_IDS = [
  'poster-pop',
  'cutout',
  'postcard',
  'riviera',
  'fabric-classic',
  'minimal-serif',
  'grid-badge',
  'scrapbook-script',
  'tropical',
  'nordic',
  'alpine',
  'india-stamp',
] as const;
export type BookThemeId = (typeof BOOK_THEME_IDS)[number];

/**
 * The motif sets a theme may name. The same twelve groups the sticker library
 * is sorted by, so a theme's motifs are a shelf of that library.
 */
export const BOOK_THEME_MOTIFS = [
  'ephemera',
  'landmarks',
  'tropical',
  'mediterranean',
  'sea',
  'mountains',
  'nordic',
  'asia',
  'food',
  'paper',
  'doodles',
  'ornaments',
] as const;
export type BookThemeMotif = (typeof BOOK_THEME_MOTIFS)[number];

/** How much a theme decorates: no stickers, one or two a spread, or three to six. */
export const BOOK_THEME_DECORATIONS = ['none', 'light', 'rich'] as const;
export type BookThemeDecoration = (typeof BOOK_THEME_DECORATIONS)[number];

/** The photo frame styles a theme may default to (bookPhotoElementSchema's `frameStyle`, pinned by a spec). */
export const BOOK_THEME_FRAMES = ['none', 'polaroid', 'white', 'shadow', 'film', 'tape'] as const;

/** A font id as a theme stores it: any family name, checked against the build's own list when it is used. */
const fontId = z
  .string()
  .regex(/^[a-z][a-z0-9]*$/, 'expected a font id')
  .max(32);

/** One typeface slot: the family, and the weight and slant it is set at when the theme says. */
export const bookThemeFontSchema = z.object({
  font: fontId,
  weight: z.number().int().min(100).max(900).multipleOf(100).optional(),
  italic: z.boolean().optional(),
});
export type BookThemeFont = z.infer<typeof bookThemeFontSchema>;

export const bookPaletteSchema = z.object({
  paper: hex,
  ink: hex,
  accent: hex,
  accent2: hex,
  accent3: hex,
});
export type BookPalette = z.infer<typeof bookPaletteSchema>;

const knownMotifs = (list: readonly string[]): BookThemeMotif[] =>
  [...new Set(list)].filter((m): m is BookThemeMotif => (BOOK_THEME_MOTIFS as readonly string[]).includes(m));

/**
 * The theme as the document keeps it.
 *
 * `id` names the built-in theme it started from, or null for a palette of
 * the book's own (an assistant design in one of the older styles, or a theme
 * somebody edited past recognition). Edited colours stay under the same id:
 * the id says where the look came from, the palette what it is now. Every
 * field falls back rather than failing, so a theme this build cannot read
 * whole costs the theme, never the book.
 */
export const bookThemeSchema = z.object({
  id: z.enum(BOOK_THEME_IDS).nullable().catch(null),
  palette: bookPaletteSchema,
  fonts: z.object({
    display: bookThemeFontSchema,
    heading: bookThemeFontSchema,
    body: bookThemeFontSchema,
    /** Null for a theme that sets no script at all. */
    script: bookThemeFontSchema.nullable(),
  }),
  motifs: z.array(z.string().max(24)).max(BOOK_THEME_MOTIFS.length).catch([]).transform(knownMotifs),
  decoration: z.enum(BOOK_THEME_DECORATIONS).catch('light'),
  /** The frame new photos take, and the turn a scrapbook gives them, in degrees. */
  frameStyle: z.enum(BOOK_THEME_FRAMES).catch('none'),
  tilt: z.number().min(0).max(8).catch(0),
});
export type BookTheme = z.infer<typeof bookThemeSchema>;

/** The document's optional `theme`: unreadable is no theme, and the pages keep their colours. */
export const bookThemeFieldSchema = bookThemeSchema.optional().catch(undefined);

/** An element's link to a palette entry. An unknown one reads as no link, never as a broken element. */
export const bookColorTokenFieldSchema = z.enum(BOOK_COLOR_TOKENS).optional().catch(undefined);

/** A text's link to a typeface slot, read the same lenient way. */
export const bookFontSlotFieldSchema = z.enum(BOOK_FONT_SLOTS).optional().catch(undefined);

/*
 * ── As the operations take them ─────────────────────────────────────────
 *
 * Strict, as every operation is. Null on a link takes it away, so the element
 * keeps its colour and stops following the theme.
 */

export const bookColorTokenInSchema = z.enum(BOOK_COLOR_TOKENS).nullable();
export const bookFontSlotInSchema = z.enum(BOOK_FONT_SLOTS).nullable();

/**
 * What the links mean, said once in the page edit's description rather than
 * on each of the fourteen fields that carry one (the tool schema's size).
 */
export const BOOK_THEME_LINK_HINT =
  "token, strokeToken and accentToken link a colour to the book's theme (paper, ink, muted for captions, accent, accent2, accent3): it takes the theme's colour and follows it; fontRole links the typeface to the theme's display, heading, body or script face. null unlinks and keeps the colour or face.";

const paletteIn = z.strictObject({
  paper: hex.optional(),
  ink: hex.optional(),
  accent: hex.optional(),
  accent2: hex.optional(),
  accent3: hex.optional(),
});

const themeFontIn = z.strictObject({
  font: fontId.describe('A font id, as the font enum of the text operations lists them.'),
  weight: z.number().int().min(100).max(900).multipleOf(100).optional(),
  italic: z.boolean().optional(),
});

/**
 * `set_book_theme`: start from a built-in theme or from the book's own, change
 * what is named, and apply it to the whole book or to some pages.
 */
export const setBookThemeArgs = {
  theme: z
    .enum(BOOK_THEME_IDS)
    .describe('A built-in theme to start from; left out, the book keeps its own and only what is named changes.')
    .optional(),
  palette: paletteIn.describe('Colours to change on top of the theme, each #rrggbb.').optional(),
  fonts: z
    .strictObject({
      display: themeFontIn.optional(),
      heading: themeFontIn.optional(),
      body: themeFontIn.optional(),
      script: themeFontIn.nullable().optional(),
    })
    .describe('Typefaces to change on top of the theme, by slot; script null sets no script.')
    .optional(),
  motifs: z.array(z.enum(BOOK_THEME_MOTIFS)).max(BOOK_THEME_MOTIFS.length).optional(),
  decoration: z
    .enum(BOOK_THEME_DECORATIONS)
    .describe('How much the theme decorates: none, light (one or two stickers a spread), rich (three to six).')
    .optional(),
  spreadIds: z
    .array(z.string().min(1).max(40))
    .min(1)
    .max(150)
    .describe('Recolour only these pages; left out, every page of the book.')
    .optional(),
  adopt: z
    .boolean()
    .describe(
      'Also link what is not linked yet: page backgrounds to the paper, dark neutral words and shapes to the ink, coloured ones to the nearest accent, texts to a typeface slot by size. Words in white over photos stay as they are. Default true.',
    )
    .optional(),
};
export const setBookThemeRequestSchema = z.strictObject(setBookThemeArgs);
export type SetBookThemeRequest = z.infer<typeof setBookThemeRequestSchema>;

/*
 * ── The links, as book.schema.ts spreads them into each kind ────────────
 *
 * `token` is the entry the element's main colour follows (a text's or an
 * icon's colour, a shape's fill, a travel element's ink); `strokeToken` and
 * `accentToken` the second colour where there is one; `fontRole` the
 * typeface slot. A page links its background through `backgroundToken`.
 */
export const THEMED_TEXT = { token: bookColorTokenFieldSchema, fontRole: bookFontSlotFieldSchema };
export const THEMED_ICON = { token: bookColorTokenFieldSchema };
export const THEMED_SHAPE = { token: bookColorTokenFieldSchema, strokeToken: bookColorTokenFieldSchema };
export const THEMED_TYPESET = {
  token: bookColorTokenFieldSchema,
  accentToken: bookColorTokenFieldSchema,
  fontRole: bookFontSlotFieldSchema,
};
export const THEMED_SPREAD = { backgroundToken: bookColorTokenFieldSchema };

/** The same links as the `add` and `style` operations take them, null taking one away. */
const tokenIn = bookColorTokenInSchema.optional();
export const THEMED_TEXT_IN = { token: tokenIn, fontRole: bookFontSlotInSchema.optional() };
export const THEMED_ICON_IN = { token: tokenIn };
export const THEMED_SHAPE_IN = { token: tokenIn, strokeToken: tokenIn };
export const THEMED_TYPESET_IN = { token: tokenIn, accentToken: tokenIn, fontRole: bookFontSlotInSchema.optional() };
