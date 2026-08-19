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

/**
 * Every shape the book can draw — and, because a picture frame *is* a shape with
 * a photograph inside it, every mask a photo can be cut to.
 *
 * One list rather than two. Canva keeps "shapes" and "frames" in separate
 * panels, but underneath they are the same geometry, and duplicating it would
 * mean a heart that exists as a frame but not as a shape, or the two drifting
 * apart the first time one of them is adjusted.
 *
 * The first four entries are the shapes that existed before this list did. They
 * stay at the front and keep their names, so a document saved by the earlier
 * editor still parses.
 */
export const BOOK_SHAPES = [
  'rect', 'ellipse', 'line', 'triangle',

  'triangle-down', 'diamond', 'parallelogram', 'trapezoid',
  'pentagon', 'hexagon', 'hexagon-flat', 'heptagon', 'octagon',
  'arch', 'half-circle', 'quarter-circle', 'capsule', 'squircle',

  'star-4', 'star-5', 'star-6', 'star-8', 'star-12', 'burst', 'seal', 'sparkle',

  'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'arrow-both',
  'chevron-right', 'chevron-left', 'arrow-bent',

  'bubble-round', 'bubble-square', 'bubble-oval', 'bubble-think',

  'heart', 'cloud', 'cloud-puffy', 'drop', 'moon', 'sun',
  'flower-5', 'flower-6', 'leaf', 'cross', 'plus', 'shield', 'gear',
  'ticket', 'wave', 'mountain', 'compass', 'pin',

  'blob-1', 'blob-2', 'blob-3', 'blob-4',

  'banner-ribbon', 'banner-pennant', 'banner-bookmark', 'banner-flag',
] as const;
export type BookShapeId = (typeof BOOK_SHAPES)[number];

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
  filter: z.enum(['none', 'bw', 'warm', 'cool', 'fade', 'contrast']).default('none'),
  /**
   * Cut the picture to a shape. Null is the plain rectangle every photo starts
   * as — and stays, unless someone asks for a heart.
   *
   * The mask is stretched to the frame rather than kept square, which is what
   * makes a frame usable: you place a wide star across a spread and it is wide.
   * A shape you cannot resize freely is an ornament, not a frame.
   */
  mask: z.enum(BOOK_SHAPES).nullable().default(null),
  /**
   * Decoration *around* the picture — a Polaroid's thick chin, a print's white
   * border, the shadow of a photo lying on a page.
   *
   * Not a mask and not a shape: it adds to the frame instead of cutting into it,
   * and it is the one thing you cannot express with either.
   */
  frameStyle: z.enum(['none', 'polaroid', 'white', 'shadow', 'film', 'tape']).default('none'),
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
  shape: z.enum(BOOK_SHAPES).default('rect'),
  fill: hex.nullable().default('#111827'),
  /**
   * Fade the fill out towards one edge. A cover almost always needs this: a
   * flat panel behind the title cuts the photograph in half, while a fade lets
   * the picture keep going and still leaves the words readable.
   */
  gradient: z.enum(['none', 'up', 'down']).default('none'),
  stroke: hex.nullable().default(null),
  strokeWidth: mm.default(0),
  /**
   * A dashed rule is a different thing from a solid one — it reads as a fold, a
   * route or a cut mark rather than as a line under a heading. The dash length
   * follows the stroke width, so it stays proportional at any size.
   */
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  radius: mm.default(0),
});

/**
 * ── The travel elements ────────────────────────────────────────────────────
 *
 * A photo book of a journey is not a photo album: the trip carries facts —
 * which countries, how far, how long, which way round — and those facts make
 * pages that photographs cannot. This is what Polarsteps' printed books do
 * better than a generic book maker, and it is the one thing TREK is in a
 * position to do well, because the data is already in the trips hanging off the
 * journey.
 *
 * **Every one of them carries its own values.** The numbers are resolved when
 * the element is placed and stored in the document, and the renderer reads them
 * from there — it never fetches. Three reasons, and the third is the one that
 * decides it:
 *
 * 1. The print renderer is headless Chromium loading a document. A page that
 *    needs a logged-in API call to know what it says is a page that prints
 *    blank on the day the token expires.
 * 2. A book is a record of a trip as it was. Adding a stop next year should not
 *    silently rewrite the distance printed in last year's book.
 * 3. It makes the elements ordinary. They move, resize, lock, undo and park like
 *    everything else, because they *are* like everything else.
 *
 * `stale` is how the editor offers the other behaviour without giving up any of
 * that: it marks a snapshot that no longer matches the journey, and the
 * inspector shows a refresh button. Updating is a choice, not a surprise.
 */

/** What the travel elements share with text: they are typeset, not drawn. */
const typeset = {
  font: z.enum(['sans', 'serif', 'display']).default('sans'),
  color: hex.default('#1a1a1a'),
  /** The one colour that carries emphasis — the figure in a stat, the route on a map. */
  accent: hex.default('#c2410c'),
  /** Scales every piece of type in the element at once. 1 is the drawn default. */
  textScale: z.number().min(0.4).max(3).default(1),
  /** Set when the journey has moved on since these values were taken. */
  stale: z.boolean().default(false),
};

/** Kilometres or miles. Stored metric; the element converts when it draws. */
export const bookUnitsSchema = z.enum(['metric', 'imperial']);

export const bookMapElementSchema = z.object({
  ...elementBase,
  ...typeset,
  kind: z.literal('map'),
  /**
   * Drawn from coordinates as vector, never from map tiles. Tiles carry a
   * licence, need fetching at render time, and go soft the moment they are
   * printed larger than the zoom they were cut for; an outline and a route
   * print sharp at any size and belong to nobody.
   */
  style: z.enum(['minimal', 'outline', 'dark', 'paper']).default('minimal'),
  /** Country silhouettes under the route, drawn from the bundled boundaries. */
  showLand: z.boolean().default(true),
  showRoute: z.boolean().default(true),
  showPins: z.boolean().default(true),
  showLabels: z.boolean().default(false),
  /** ISO-3166-1 alpha-2, the countries whose outlines to draw. */
  countries: z.array(z.string().length(2)).max(80).default([]),
  /**
   * The route, in order. Capped where a printed line stops gaining from more
   * points — a book page cannot resolve four hundred stops anyway.
   */
  points: z
    .array(z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      label: z.string().max(120).default(''),
    }))
    .max(400)
    .default([]),
});

export const BOOK_METRICS = ['distance', 'days', 'steps', 'photos', 'countries', 'places', 'furthest'] as const;
export type BookMetric = (typeof BOOK_METRICS)[number];

export const bookStatsElementSchema = z.object({
  ...elementBase,
  ...typeset,
  kind: z.literal('stats'),
  /** Which figures, in the order they are drawn. */
  metrics: z.array(z.enum(BOOK_METRICS)).max(7).default(['distance', 'days', 'steps', 'photos']),
  layout: z.enum(['grid', 'row', 'column']).default('grid'),
  showIcons: z.boolean().default(true),
  units: bookUnitsSchema.default('metric'),
  /** Metric to value. Distance is metres, everything else a plain count. */
  values: z.record(z.string(), z.number().finite()).default({}),
});

export const bookCountriesElementSchema = z.object({
  ...elementBase,
  ...typeset,
  kind: z.literal('countries'),
  /** ISO-3166-1 alpha-2, in visit order. */
  codes: z.array(z.string().length(2)).max(80).default([]),
  /** Names as resolved when placed, so the page does not depend on a lookup. */
  names: z.array(z.string().max(80)).max(80).default([]),
  layout: z.enum(['list', 'grid', 'column']).default('list'),
  /** The silhouette behind each name — the thing that makes the page read as a map. */
  showOutline: z.boolean().default(true),
  showFlag: z.boolean().default(false),
  showName: z.boolean().default(true),
  align: z.enum(['left', 'center', 'right']).default('center'),
});

export const BOOK_BADGES = [
  'flag', 'date', 'day', 'coords', 'country', 'distance', 'weather', 'altitude',
  'mood',
] as const;
export type BookBadgeVariant = (typeof BOOK_BADGES)[number];

/**
 * The small marks: a flag, a date set as a numeral, a "DAY 5" chip, a line of
 * coordinates. Individually trivial, and collectively most of what makes a
 * printed travel page look composed rather than typed.
 */
export const bookBadgeElementSchema = z.object({
  ...elementBase,
  ...typeset,
  kind: z.literal('badge'),
  variant: z.enum(BOOK_BADGES).default('date'),
  /** The resolved value — "13", "48°51'N 2°21'E", "ICELAND". */
  text: z.string().max(200).default(''),
  /** The line under it — a month, a place, a unit. */
  sub: z.string().max(200).default(''),
  /** ISO-3166-1 alpha-2 for the flag and country variants. */
  code: z.string().length(2).nullable().default(null),
  style: z.enum(['plain', 'chip', 'outline', 'stacked']).default('plain'),
});

/**
 * A journal entry's pros and cons, set as a page.
 *
 * TREK's entries already carry them as two lists, and two lists is exactly what
 * a text element cannot express: run together as a paragraph they lose the
 * pairing, and run as one column they lose which side each line is on. Two
 * marked columns is how a travel diary has always printed this.
 */
export const bookListElementSchema = z.object({
  ...elementBase,
  ...typeset,
  kind: z.literal('list'),
  items: z
    .array(z.object({
      text: z.string().max(400),
      /** Which column the line belongs to, and which mark it gets. */
      tone: z.enum(['pro', 'con', 'plain']).default('plain'),
    }))
    .max(60)
    .default([]),
  /** Pros beside cons, or one column with the marks inline. */
  layout: z.enum(['columns', 'stacked']).default('columns'),
  showMarks: z.boolean().default(true),
  /** A heading over each column — empty for none. */
  proLabel: z.string().max(80).default(''),
  conLabel: z.string().max(80).default(''),
});

export const bookElementSchema = z.discriminatedUnion('kind', [
  bookPhotoElementSchema,
  bookTextElementSchema,
  bookShapeElementSchema,
  bookMapElementSchema,
  bookStatsElementSchema,
  bookCountriesElementSchema,
  bookBadgeElementSchema,
  bookListElementSchema,
]);
export type BookElement = z.infer<typeof bookElementSchema>;
export type BookPhotoElement = z.infer<typeof bookPhotoElementSchema>;
export type BookTextElement = z.infer<typeof bookTextElementSchema>;
export type BookShapeElement = z.infer<typeof bookShapeElementSchema>;
export type BookMapElement = z.infer<typeof bookMapElementSchema>;
export type BookStatsElement = z.infer<typeof bookStatsElementSchema>;
export type BookCountriesElement = z.infer<typeof bookCountriesElementSchema>;
export type BookBadgeElement = z.infer<typeof bookBadgeElementSchema>;
export type BookListElement = z.infer<typeof bookListElementSchema>;
export type BookUnits = z.infer<typeof bookUnitsSchema>;

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
