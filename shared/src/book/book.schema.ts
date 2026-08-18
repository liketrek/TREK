import { z } from 'zod';

/**
 * The TREK Studio book document — what a photo book *is*, independent of how it
 * is edited or rendered.
 *
 * Two decisions carry the rest of the format:
 *
 * 1. **Everything geometric is in millimetres.** Not pixels: a pixel means
 *    nothing to a print shop, and it changes meaning with the device pixel
 *    ratio and the browser zoom. CSS maps 1in onto 96px, 25.4mm and 72pt with a
 *    fixed ratio, so the editor can render the document at `transform: scale()`
 *    and the print renderer at 1:1 and land on the same page. Values are stored
 *    rounded to two decimals — 10µm, far below any imagesetter — so a JSON round
 *    trip cannot accumulate drift.
 *
 * 2. **The paint order is the array order.** `elements[0]` is at the back. No
 *    `zIndex` field that could disagree with itself, "bring to front" is a
 *    splice, and because the DOM paints in the same order the editor and the
 *    renderer agree for free.
 *
 * A text element may be *bound* to a piece of the journey (an entry's title, its
 * story, a photo caption). A bound element re-reads its source when the book is
 * opened, so fixing a typo in the journal fixes it in the book — until someone
 * edits the text in Studio, which sets `overridden` and stops the sync.
 */

/** Two decimals of a millimetre. Anything finer is below print resolution. */
const mm = z.number().finite().transform(v => Math.round(v * 100) / 100);

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');

export const bookFrameSchema = z.object({
  /** Millimetres from the left edge of the spread. Negative means bleed. */
  x: mm,
  /** Millimetres from the top edge of the spread. */
  y: mm,
  w: mm.refine(v => v > 0, 'width must be positive'),
  h: mm.refine(v => v > 0, 'height must be positive'),
});
export type BookFrame = z.infer<typeof bookFrameSchema>;

const elementBase = {
  id: z.string().min(1),
  frame: bookFrameSchema,
  /** Degrees, clockwise. */
  rotation: z.number().finite().default(0),
  opacity: z.number().min(0).max(1).default(1),
  locked: z.boolean().default(false),
};

export const bookPhotoElementSchema = z.object({
  ...elementBase,
  kind: z.literal('photo'),
  /**
   * `trek_photos.id` — never a resolved URL, or the document would not survive a
   * provider change and Studio could not warn about print resolution.
   *
   * Null is an empty frame: a template lays out where the pictures go before it
   * knows which pictures those are, and a placeholder you can drop a photo onto
   * is the whole point of a template.
   */
  photoId: z.number().int().positive().nullable().default(null),
  fit: z.enum(['cover', 'contain']).default('cover'),
  /** Where the interesting part of the picture is, 0..1 of each edge. */
  focalX: z.number().min(0).max(1).default(0.5),
  focalY: z.number().min(0).max(1).default(0.5),
  radius: mm.default(0),
  filter: z.enum(['none', 'bw', 'warm']).default('none'),
});

export const bookTextElementSchema = z.object({
  ...elementBase,
  kind: z.literal('text'),
  text: z.string().max(8000).default(''),
  font: z.enum(['sans', 'serif', 'display']).default('sans'),
  /** Points. */
  size: z.number().min(4).max(200).default(11),
  weight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).default(400),
  italic: z.boolean().default(false),
  align: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  /** Multiple of the font size. */
  leading: z.number().min(0.7).max(3).default(1.45),
  /** Ems, may be negative. */
  tracking: z.number().min(-0.2).max(1).default(0),
  color: hex.default('#1a1a1a'),
  /** Where this text came from, when it came from the journey. */
  binding: z
    .object({
      source: z.enum(['journey.title', 'journey.subtitle', 'entry.title', 'entry.story', 'entry.location', 'entry.date', 'photo.caption']),
      entryId: z.number().int().optional(),
      photoId: z.number().int().optional(),
    })
    .nullable()
    .default(null),
  /** True once a human edited the text; stops it re-reading its source. */
  overridden: z.boolean().default(false),
});

export const bookShapeElementSchema = z.object({
  ...elementBase,
  kind: z.literal('shape'),
  shape: z.enum(['rect', 'ellipse', 'line', 'triangle']).default('rect'),
  fill: hex.nullable().default('#111827'),
  /**
   * Fade the fill out towards one edge. A cover almost always needs this: a
   * flat panel behind the title cuts the photograph in half, while a fade lets
   * the picture keep going and still leaves the words readable.
   */
  gradient: z.enum(['none', 'up', 'down']).default('none'),
  stroke: hex.nullable().default(null),
  strokeWidth: mm.default(0),
  radius: mm.default(0),
});

export const bookElementSchema = z.discriminatedUnion('kind', [
  bookPhotoElementSchema,
  bookTextElementSchema,
  bookShapeElementSchema,
]);
export type BookElement = z.infer<typeof bookElementSchema>;
export type BookPhotoElement = z.infer<typeof bookPhotoElementSchema>;
export type BookTextElement = z.infer<typeof bookTextElementSchema>;
export type BookShapeElement = z.infer<typeof bookShapeElementSchema>;

export const bookSpreadSchema = z.object({
  id: z.string().min(1),
  /** 'cover' and 'back' are single pages; everything else is a double spread. */
  role: z.enum(['cover', 'back', 'inner']).default('inner'),
  background: hex.nullable().default(null),
  /** Back to front. */
  elements: z.array(bookElementSchema).max(60).default([]),
  /**
   * Content that belongs to this spread but is not currently placed.
   *
   * Changing to a layout with fewer frames must not destroy the pictures the old
   * one held — the user is trying an arrangement, not deleting their photographs,
   * and a single wrong click on a text-only layout would otherwise cost them
   * everything on the page. Parked elements come back the moment a layout with
   * room for them is applied.
   */
  parked: z.array(bookElementSchema).max(60).default([]),
  /** The journey entry this spread was generated from, if any. */
  entryId: z.number().int().nullable().default(null),
});
export type BookSpread = z.infer<typeof bookSpreadSchema>;

export const bookPageSetupSchema = z.object({
  preset: z.enum(['square-210', 'square-300', 'a4-landscape', 'a4-portrait', 'a5-landscape', 'custom']).default('square-210'),
  /** A single page. A double spread is drawn twice this wide. */
  pageWidth: mm.default(210),
  pageHeight: mm.default(210),
  bleed: mm.default(3),
  safe: mm.default(5),
});
export type BookPageSetup = z.infer<typeof bookPageSetupSchema>;

export const bookDocumentSchema = z.object({
  /** In the document, not in a column: a format bump must not need a migration. */
  version: z.literal(1).catch(1).default(1),
  title: z.string().max(200).default(''),
  page: bookPageSetupSchema.default(() => bookPageSetupSchema.parse({})),
  spreads: z.array(bookSpreadSchema).max(150).default([]),
});
export type BookDocument = z.infer<typeof bookDocumentSchema>;

/**
 * Read a stored document without ever throwing.
 *
 * Same shape as `normalizeAppearance`: a book that cannot be parsed must still
 * open — an editor that refuses to load someone's work because one field drifted
 * is worse than one that drops the field.
 */
export function normalizeBookDocument(raw: unknown): BookDocument {
  const parsed = bookDocumentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return bookDocumentSchema.parse({});
}
