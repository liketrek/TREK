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

/**
 * Two decimals of a millimetre. Anything finer is below print resolution.
 *
 * Bounded at ten metres in either direction, which is four orders of magnitude
 * past the largest book anyone binds and still leaves room for an element
 * parked well off the spread. Without a bound a stored `1e9` is a legal
 * millimetre, and the editor and the PDF renderer both try to draw a sheet a
 * thousand kilometres wide.
 */
const mm = z
  .number()
  .finite()
  .min(-10000)
  .max(10000)
  .transform((v) => Math.round(v * 100) / 100);

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
  'rect',
  'ellipse',
  'line',
  'triangle',

  'triangle-down',
  'diamond',
  'parallelogram',
  'trapezoid',
  'pentagon',
  'hexagon',
  'hexagon-flat',
  'heptagon',
  'octagon',
  'arch',
  'half-circle',
  'quarter-circle',
  'capsule',
  'squircle',

  'star-4',
  'star-5',
  'star-6',
  'star-8',
  'star-12',
  'burst',
  'seal',
  'sparkle',

  'arrow-right',
  'arrow-left',
  'arrow-up',
  'arrow-down',
  'arrow-both',
  'chevron-right',
  'chevron-left',
  'arrow-bent',

  'bubble-round',
  'bubble-square',
  'bubble-oval',
  'bubble-think',

  'heart',
  'cloud',
  'cloud-puffy',
  'drop',
  'moon',
  'sun',
  'flower-5',
  'flower-6',
  'leaf',
  'cross',
  'plus',
  'shield',
  'gear',
  'ticket',
  'wave',
  'mountain',
  'compass',
  'pin',

  'blob-1',
  'blob-2',
  'blob-3',
  'blob-4',

  'banner-ribbon',
  'banner-pennant',
  'banner-bookmark',
  'banner-flag',
] as const;
export type BookShapeId = (typeof BOOK_SHAPES)[number];

/**
 * The families a book may be set in.
 *
 * `sans`, `serif` and `display` are the three the format started with and are
 * kept by name, so every document written so far still parses — they now point
 * at bundled faces rather than at whatever the rendering machine happened to
 * have installed. See client/src/components/Studio/bookFonts.ts.
 */
export const BOOK_FONTS_IDS = ['sans', 'inter', 'serif', 'garamond', 'playfair', 'display', 'bebas'] as const;
export type BookFontFamily = (typeof BOOK_FONTS_IDS)[number];

export const bookFrameSchema = z.object({
  /** Millimetres from the left edge of the spread. Negative means bleed. */
  x: mm,
  /** Millimetres from the top edge of the spread. */
  y: mm,
  w: mm.refine((v) => v > 0, 'width must be positive'),
  h: mm.refine((v) => v > 0, 'height must be positive'),
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
  font: z.enum(BOOK_FONTS_IDS).default('sans'),
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
      source: z.enum([
        'journey.title',
        'journey.subtitle',
        'entry.title',
        'entry.story',
        'entry.location',
        'entry.date',
        'photo.caption',
      ]),
      entryId: z.number().int().optional(),
      photoId: z.number().int().optional(),
      /**
       * How to set the source, where it can be set more than one way.
       *
       * Only `entry.location` uses it, and only because a stop is both a name
       * and a point: absent means the place as it is written in the journal,
       * `dms` and `decimal` mean its coordinates. It is a property of the
       * binding rather than a second `source`, because both read the one field
       * the journal actually records — and because a document written with an
       * unknown *source* would fail the union and normalise to an empty book,
       * while an unknown key inside the binding is dropped and the page
       * survives. A print format is not worth a lost book.
       */
      format: z.enum(['dms', 'decimal']).optional(),
      /**
       * The raw value this element was last set from — an ISO date, a
       * `lat,lng` pair — for the sources whose words are *formatted* rather
       * than copied.
       *
       * Without it, re-reading a date cannot tell a journal that changed from a
       * page that was set in another language, or in small caps, or as part of
       * a longer line: it would rewrite all four alike, in the reader's locale,
       * on open. With it the question is exactly the right one — has the entry
       * moved? — and an element from before this existed carries no value and
       * is therefore left alone, which is the only safe thing to do to a book
       * somebody has already printed.
       */
      value: z.string().max(200).optional(),
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
  font: z.enum(BOOK_FONTS_IDS).default('sans'),
  color: hex.default('#1a1a1a'),
  /**
   * The one colour that carries emphasis — the figure in a stat, the route on
   * a map, the fill of a chip.
   *
   * Black by default, not the app's orange. A book is printed and a printed
   * page is ink on paper; a colour that arrives without being chosen turns
   * every travel element into the same accent whether or not the book wants
   * one. Picking a colour is one click and is what the swatches are for — and
   * the map's dark style overrides it anyway, because black lines on a dark
   * map are lines nobody can see.
   */
  accent: hex.default('#111111'),
  /** Scales every piece of type in the element at once. 1 is the drawn default. */
  textScale: z.number().min(0.4).max(3).default(1),
  /**
   * How heavy the type is set.
   *
   * The travel elements draw at several sizes at once — a figure over its
   * label, a country name over its outline — and this moves all of them
   * together, the way `textScale` moves their size. Without it the only way to
   * lighten a stats block was to not use one.
   */
  weight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).default(700),
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
   * Where the map underneath comes from.
   *
   * `vector` draws country outlines from the bundled boundaries: it carries no
   * licence, fetches nothing at render time, and prints sharp at any size,
   * which is why it is the default and why a book can be exported offline.
   *
   * `tiles` and `static` use the map provider the instance is already
   * configured with, for a book that wants real geography — streets, terrain,
   * coastline detail an outline cannot give. Both fetch at render time and both
   * carry an attribution the element prints, because the licence requires it
   * and a book is a published work. A tiled map is also raster: it is cut for a
   * zoom level, so printing it much larger than it was fetched goes soft.
   */
  source: z.enum(['vector', 'tiles', 'static']).default('vector'),
  /**
   * The tile template, frozen when the element was placed.
   *
   * Kept in the document rather than read from settings at render time for the
   * same reason the figures are: a page that resolves its own contents from an
   * account's current settings is a page that changes when someone else edits
   * a preference.
   */
  tileUrl: z.string().max(500).default(''),
  /** What the licence requires the page to say. Printed small, in a corner. */
  attribution: z.string().max(200).default(''),
  /**
   * Zoom for the tiled sources. Null lets the element choose one that fits the
   * route, which is right almost always and wrong when someone wants the
   * street detail of a single city.
   */
  zoom: z.number().int().min(0).max(19).nullable().default(null),
  style: z.enum(['minimal', 'outline', 'dark', 'paper']).default('minimal'),
  /** Country silhouettes under the route, drawn from the bundled boundaries. */
  showLand: z.boolean().default(true),
  showRoute: z.boolean().default(true),
  showPins: z.boolean().default(true),
  showLabels: z.boolean().default(false),
  /**
   * ── How the line is drawn ────────────────────────────────────────────
   *
   * `plain` is one stroke in the element's ink: what every map in every book
   * made so far already draws, and the default for exactly that reason.
   *
   * `drawn` is the printed-atlas treatment — a light line over a dark casing,
   * or the reverse on pale paper — which is what keeps a single route legible
   * across near-black bathymetry and bright desert in the same picture. It
   * cannot be the default: a stored book would change the day it was opened.
   */
  routeStyle: z.enum(['plain', 'drawn']).default('plain'),
  /**
   * Whether a long leg bows.
   *
   * A straight line between two stops a continent apart is a claim about the
   * journey that is obviously false, and drawing it as a shallow curve is how
   * printed maps have always said "this part was a flight". Only ever applied
   * to the inferred stop-to-stop line: bowing a recorded GPS track would draw
   * a journey that did not happen.
   */
  routeArc: z.enum(['straight', 'bow']).default('straight'),
  /**
   * Whether the bowed legs are dashed.
   *
   * The dash then MEANS something — this leg is inferred, not recorded — which
   * is why it applies to the bowed legs alone rather than to the whole line.
   */
  routeDash: z.enum(['solid', 'arcs']).default('solid'),
  /**
   * What a stop looks like.
   *
   * `photo` draws the stop as a small round picture with a white ring, from the
   * photograph the point carries, and falls back to a dot where there is none.
   * That fallback is the designed state rather than a failure: a printed page
   * with a few plain dots between the pictures reads as a route, and one with
   * empty rings reads as a bug.
   */
  pinStyle: z.enum(['dot', 'photo']).default('dot'),
  /** ISO-3166-1 alpha-2, the countries whose outlines to draw. */
  countries: z.array(z.string().length(2)).max(80).default([]),
  /**
   * The route, in order. Capped where a printed line stops gaining from more
   * points — a book page cannot resolve four hundred stops anyway.
   */
  points: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        label: z.string().max(120).default(''),
        /**
         * One photograph from this stop, for a marker that shows it.
         *
         * `trek_photos.id`, never a resolved URL, for the same reason a photo
         * element stores an id: a book has to survive a provider change. Null is
         * ordinary and means the marker is a dot.
         */
        photoId: z.number().int().positive().nullable().default(null),
      }),
    )
    .max(400)
    .default([]),
  /**
   * The way the trip was actually travelled, where the trip knows it.
   *
   * `points` are the stops, and a line drawn straight between them is a claim
   * about the journey that is almost always false: it crosses mountains,
   * water and borders that the trip went around. TREK already stores routed
   * geometry per place from the planner and from imported GPX, so where that
   * exists the line follows the road instead of the ruler.
   *
   * Segments rather than one list, because two tracks that do not join must
   * not be drawn as though they did: the gap between the end of one day's
   * driving and the start of the next is a gap, not a leg.
   *
   * `[lat, lng]`, matching the order the tracks endpoint answers in, and thinned
   * when it is frozen into the document: a printed line gains nothing from a
   * point every fifteen metres, and a book carrying every GPS fix of a
   * three-week trip is a document nobody can save.
   */
  path: z
    .array(z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])).max(1200))
    .max(40)
    .default([]),
  /**
   * The roads each leg actually took, when somebody asked for them.
   *
   * ── Why this is not `path` ───────────────────────────────────────────
   *
   * `path` is a recorded track: a GPS trace of where somebody went, which has
   * no idea which stop it started at and is drawn instead of the stop chain.
   * This is per leg — entry `i` is the way from stop `i` to stop `i + 1`, and
   * `null` is a leg with no road answer, which is most journeys' flights.
   *
   * Per leg rather than one line, because a partial road route drawn as one
   * would be a lie by omission: the renderer replaces the whole stop chain the
   * moment it has a track, so a journey with roads for three legs out of twelve
   * would print three legs and drop the other nine.
   *
   * Frozen into the document like every other travel figure. A page that asks a
   * routing service for its line at print time is a page that changes when a
   * road is rerouted, and prints empty when the export runs offline.
   */
  roads: z
    .array(
      z
        .array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]))
        .max(200)
        .nullable(),
    )
    .max(400)
    .default([]),
  /**
   * How much room to leave around what is drawn, as a share of its own extent.
   *
   * The view is fitted to the stops, not to the countries: a trip that stayed
   * in Berlin is a map of Berlin, not a map of Germany with two dots on it.
   * Country outlines are still drawn, they simply run off the edge like the
   * geography they are.
   */
  /*
   * Half again the extent of the route, rather than a fifth.
   *
   * A map fitted tightly to its own stops is a diagram; the air around it is
   * what makes it a place. The reference books all leave room for the coast to
   * arrive and the neighbouring country to show, and a route that touches its
   * own frame on two sides reads as cropped rather than as composed.
   */
  fitPadding: z.number().min(0).max(4).default(0.5),
  /**
   * Fit to the countries rather than to the stops.
   *
   * The default, because it is the picture a travel book usually wants: the
   * country, with the route inside it. Fitting to the stops is the other half
   * of the choice and matters as soon as the trip is smaller than the country
   * it happened in — a week in Berlin drawn as the whole of Germany is two
   * dots in a large empty shape.
   */
  fitToCountries: z.boolean().default(true),
  /**
   * The shape the map is cut to.
   *
   * `rect` is a map in a box, which is what a map usually is and what a full
   * page wants. `country` cuts it to the outline of the countries themselves,
   * so the picture *is* the country: no frame, no box, the page showing through
   * around the coastline. That is the version worth putting next to a
   * photograph, and it is the one thing a rectangle can never be.
   *
   * Cutting only makes sense against the whole outline, so it fits to the
   * countries whatever `fitToCountries` says: a city-sized view cut to the
   * shape of a country is an evenly coloured rectangle with a route on it.
   */
  clip: z.enum(['rect', 'country']).default('rect'),
  /**
   * Which trip this map is of, when it is of one.
   *
   * Null is the whole journey, which is what a map has always been. A journey
   * is a collection of trips, though, and printing two of them as one route
   * draws a line from the last stop of the first to the first stop of the
   * second: a leg nobody travelled, usually the longest one on the page.
   *
   * Stored rather than derived because the points are frozen into the element
   * when it is placed. Without it, bringing a map up to date would quietly turn
   * a map of Iceland back into a map of everywhere.
   */
  tripId: z.number().int().positive().nullable().default(null),
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
  /**
   * Metric to value. Distance is metres, everything else a plain count.
   *
   * Anything that is not a metric is dropped rather than rejected: both readers
   * only ever index by a `BOOK_METRICS` member, so a stray key is payload that
   * gets persisted and re-served to every viewer without ever being drawn.
   * Filtered instead of typed as `z.record(z.enum(BOOK_METRICS), …)`, because on
   * zod 4 an enum key makes the record exhaustive — every metric would become
   * required and every stats element written so far would fail, then be thrown
   * away as unreadable.
   */
  values: z
    .record(z.string(), z.number().finite())
    .default({})
    .transform((v) =>
      Object.fromEntries(Object.entries(v).filter(([k]) => (BOOK_METRICS as readonly string[]).includes(k))),
    ),
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
  'flag',
  'date',
  'day',
  'coords',
  'country',
  'distance',
  'weather',
  'altitude',
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
  /**
   * What the mark is *of*, when the drawing needs more than the words.
   *
   * ISO-3166-1 alpha-2 for a flag or a country silhouette, and the journal's
   * own key for a mood or a weather mark — `amazing`, `partly` — which is what
   * lets the icon and the palette come from the journey page rather than being
   * listed a second time here.
   *
   * It was two characters once, back when only flags used it, and a mood mark
   * placed against that contract took the whole book down with it: the save was
   * refused and the document normalised to nothing. A country code is still two
   * characters; the field is simply no longer only that.
   */
  code: z.string().max(24).nullable().default(null),
  style: z.enum(['plain', 'chip', 'outline', 'stacked']).default('plain'),
  /**
   * Let the mark pick its own text colour.
   *
   * The same bargain the page numbers make: automatic until somebody chooses,
   * and choosing is what turns it off. A chip is a filled capsule, so its words
   * have to answer to the fill rather than to the page: white on ink, ink on a
   * pale accent. Doing that by hand means changing two colours every time you
   * change one, and getting it wrong means a black day counter on a black chip,
   * which is what happened before this existed.
   */
  autoColor: z.boolean().default(true),
  /**
   * Whether the mark draws its icon, and whether it draws its words.
   *
   * Two flags rather than one three-valued mode, because that is what the
   * renderer actually asks — and because a document written before they
   * existed reads `undefined` as "draw it", which is what it always did. The
   * panel offers the three combinations that mean something (both, icon only,
   * words only); an empty mark is not one of them.
   */
  showIcon: z.boolean().default(true),
  showLabel: z.boolean().default(true),
  /**
   * The icon's own colour, and whether it picks it.
   *
   * Automatic is a mood's palette from the journal — the pink of "amazing",
   * the amber of "good" — and the element's accent for everything else, which
   * is what these marks have always drawn. It has to stay a flag rather than a
   * nullable colour: every badge already in a book carries `iconColor`'s
   * default once it is parsed, and reading that as a choice would repaint every
   * mood mark in the field to a flat near-black.
   */
  autoIconColor: z.boolean().default(true),
  iconColor: hex.default('#111111'),
});

/**
 * A drawing from the icon set the app is already built out of.
 *
 * Not a member of BOOK_SHAPES, and deliberately: a shape is a filled outline
 * the editor scales by moving its points, while an icon is a stroked drawing of
 * several parts that has to keep its proportions to stay legible — a compass
 * stretched to twice its width stops reading as a compass. They also come from
 * opposite places. A shape is drawn here and lives in this file; an icon is one
 * of about fourteen hundred names in lucide, and listing them in the contract
 * would mean a document that stops parsing the day the library renames one.
 *
 * So the name travels as a bounded string and the renderer resolves it, falling
 * back the way the rest of TREK already does for a plugin's icon. A book that
 * outlives an icon loses that drawing, not the page it was on.
 */
export const bookIconElementSchema = z.object({
  ...elementBase,
  kind: z.literal('icon'),
  /** A lucide export name, PascalCase — "Compass", "Plane", "MountainSnow". */
  name: z
    .string()
    .regex(/^[A-Z][A-Za-z0-9]*$/, 'expected a lucide icon name')
    .max(60),
  color: hex.default('#111827'),
  /**
   * How heavy the drawing is, against lucide's own 24-unit grid — not
   * millimetres, which is why it is not called `strokeWidth`: three separate
   * places in the client rescale a field of that name by the page width when a
   * spread moves between books, and an icon's weight is not a length.
   */
  lineWidth: z.number().min(0.25).max(4).default(2),
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
    .array(
      z.object({
        text: z.string().max(400),
        /** Which column the line belongs to, and which mark it gets. */
        tone: z.enum(['pro', 'con', 'plain']).default('plain'),
      }),
    )
    .max(60)
    .default([]),
  /** Pros beside cons, or one column with the marks inline. */
  layout: z.enum(['columns', 'stacked']).default('columns'),
  showMarks: z.boolean().default(true),
  /** A heading over each column — empty for none. */
  proLabel: z.string().max(80).default(''),
  conLabel: z.string().max(80).default(''),
});

/**
 * How much may stand on one spread.
 *
 * A limit rather than a taste: the document is saved whole on every autosave,
 * and a page nobody could design is a page somebody's browser has to serialise.
 */
export const MAX_SPREAD_ELEMENTS = 60;

export const bookElementSchema = z.discriminatedUnion('kind', [
  bookPhotoElementSchema,
  bookTextElementSchema,
  bookShapeElementSchema,
  bookMapElementSchema,
  bookStatsElementSchema,
  bookCountriesElementSchema,
  bookBadgeElementSchema,
  bookListElementSchema,
  bookIconElementSchema,
]);
export type BookElement = z.infer<typeof bookElementSchema>;
export type BookIconElement = z.infer<typeof bookIconElementSchema>;
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
  elements: z.array(bookElementSchema).max(MAX_SPREAD_ELEMENTS).default([]),
  /**
   * Content that belongs to this spread but is not currently placed.
   *
   * Changing to a layout with fewer frames must not destroy the pictures the old
   * one held — the user is trying an arrangement, not deleting their photographs,
   * and a single wrong click on a text-only layout would otherwise cost them
   * everything on the page. Parked elements come back the moment a layout with
   * room for them is applied.
   */
  parked: z.array(bookElementSchema).max(MAX_SPREAD_ELEMENTS).default([]),
  /** The journey entry this spread was generated from, if any. */
  entryId: z.number().int().nullable().default(null),
});
export type BookSpread = z.infer<typeof bookSpreadSchema>;

/**
 * Page numbers.
 *
 * Set here, on the document, and filled by the renderer — which is the only
 * place that knows what number a given page is. Letting pdf-lib stamp them
 * afterwards would put a different number in the PDF than the one the editor
 * showed, and a book you cannot proofread on screen is not much of an editor.
 *
 * `startAt` exists because the first inner spread is rarely page 1 in the
 * finished object: the cover is a separate sheet, and some binders count it and
 * some do not.
 */
export const bookPageNumbersSchema = z.object({
  show: z.boolean().default(false),
  /** Which number the first inner spread's left page carries. */
  startAt: z.number().int().min(0).max(9999).default(2),
  position: z.enum(['outer', 'inner', 'centre']).default('outer'),
  /** Millimetres from the trim edge. */
  margin: mm.default(12),
  size: z.number().min(4).max(48).default(8),
  /**
   * Pick the folio colour from what it lands on, rather than using `color`.
   *
   * A book has dark pages and light ones, and one fixed colour is wrong on half
   * of them — a grey folio disappears into a full-bleed night photograph and
   * again into a black page. The renderer decides per page; `color` is what it
   * uses when this is off, and choosing a colour turns it off.
   */
  autoColor: z.boolean().default(true),
  color: hex.default('#8a8578'),
  font: z.enum(BOOK_FONTS_IDS).default('sans'),
});
export type BookPageNumbers = z.infer<typeof bookPageNumbersSchema>;

export const bookPageSetupSchema = z.object({
  preset: z
    .enum(['square-210', 'square-300', 'a4-landscape', 'a4-portrait', 'a5-landscape', 'custom'])
    .default('square-210'),
  /**
   * A single page. A double spread is drawn twice this wide.
   *
   * These four fall back rather than fail, like `version` below. The salvage
   * pass only strips unreadable *elements*, so a page block the contract
   * cannot read takes the whole book down to an empty one — and that empty
   * book is what the server writes back. A nonsense dimension degrading to the
   * preset is the smaller loss by a long way.
   */
  pageWidth: mm
    .refine((v) => v > 0, 'page width must be positive')
    .catch(210)
    .default(210),
  pageHeight: mm
    .refine((v) => v > 0, 'page height must be positive')
    .catch(210)
    .default(210),
  bleed: mm
    .refine((v) => v >= 0, 'bleed cannot be negative')
    .catch(3)
    .default(3),
  safe: mm
    .refine((v) => v >= 0, 'safe margin cannot be negative')
    .catch(5)
    .default(5),
  pageNumbers: bookPageNumbersSchema.default(() => bookPageNumbersSchema.parse({})),
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
 *
 * ── Why there are two attempts ───────────────────────────────────────────
 *
 * Dropping *the field* was the intent; dropping the whole book was what the
 * code did. `elements` is an array of a discriminated union, so one element the
 * contract cannot read fails its spread, fails the array, fails the document —
 * and this function then handed back an empty book. It is not hypothetical: a
 * mood mark carried the journal's key in a field capped at two characters, so
 * every book with one on a page refused to save, and would have opened blank.
 * Both the client's load seam and the server's read *and* write path run
 * through here, which means the empty book was also what got written down.
 *
 * So a document that fails whole is tried again with the unreadable elements
 * removed, and only a document that fails even then is given up on. Losing one
 * decoration to a version skew is a shrug; losing the book is not.
 */
export function normalizeBookDocument(raw: unknown): BookDocument {
  const parsed = bookDocumentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const salvaged = bookDocumentSchema.safeParse(withoutUnreadableElements(raw));
  if (salvaged.success) return salvaged.data;

  return bookDocumentSchema.parse({});
}

function withoutUnreadableElements(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const doc = raw as { spreads?: unknown };
  if (!Array.isArray(doc.spreads)) return raw;

  const readable = (list: unknown) =>
    Array.isArray(list)
      ? // Trimmed to the cap as well as filtered: a spread that grew past 60
        // fails the array the same way an unreadable element fails the union, and
        // losing the sixty-first decoration beats losing the book.
        list.filter((el) => bookElementSchema.safeParse(el).success).slice(0, MAX_SPREAD_ELEMENTS)
      : list;

  return {
    ...doc,
    spreads: doc.spreads.map((sp) => {
      if (!sp || typeof sp !== 'object') return sp;
      const spread = sp as { elements?: unknown; parked?: unknown };
      return { ...spread, elements: readable(spread.elements), parked: readable(spread.parked) };
    }),
  };
}
