import { bookFontIndex } from './book-fonts';
import { BOOK_ICON_NAMES } from './book-icons';
import {
  BOOK_BADGES,
  BOOK_FONTS_IDS,
  BOOK_METRICS,
  BOOK_SHAPES,
  bookBadgeElementSchema,
  bookCatalogueIdSchema,
  bookCountriesElementSchema,
  bookListElementSchema,
  bookMapElementSchema,
  bookPageSetupSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookStatsElementSchema,
  bookTextElementSchema,
  type BookShapeId,
} from './book.schema';

import { z } from 'zod';

/**
 * The enums a model reads in the book tools, each with one line on what its
 * values mean.
 *
 * A JSON schema that lists bare ids leaves the model to guess what `bebas`
 * sets or what a `seal` draws, and a guess at a typeface is a page set in the
 * wrong one. The values stay those of the document's own schema; only the
 * description is added, which changes nothing a parse accepts.
 *
 * Short on purpose. The tool schemas carry no `$ref`, so a description is
 * repeated wherever its field appears, and the page edit's schema is held
 * under a size ceiling (MCP-SCHEMA-004 on the server). Where a field repeats
 * on every travel element, a shorter line points back at the full one.
 */

const photo = bookPhotoElementSchema.shape;
const text = bookTextElementSchema.shape;
const shape = bookShapeElementSchema.shape;
const map = bookMapElementSchema.shape;

/**
 * The book's typefaces by what they are for, each with its face, the weights
 * it has and an i where it has a real italic. A weight a family lacks is set
 * at its nearest one, as in the Studio.
 */
export const bookFontIdSchema = z
  .enum(BOOK_FONTS_IDS)
  .describe(`Typeface by role; weights a family lacks snap to its nearest. ${bookFontIndex()}`);
/** The typeface of a travel element, where the full line above would repeat ten times. */
export const bookTypesetFontSchema = bookCatalogueIdSchema(BOOK_FONTS_IDS).describe('Typeface id, as for text.');
/** How heavy type is set, 100 thin to 900 black. */
export const bookWeightSchema = bookTextElementSchema.shape.weight
  .unwrap()
  .describe('Weight 100 thin to 900 black, 400 regular, 700 bold; snapped to one the family has.');

/** Every shape the Studio draws, and so every mask a photo can be cut to. */
export const bookShapeIdSchema = z
  .enum(BOOK_SHAPES)
  .describe(
    'A filled outline: rect, ellipse, line (a rule), polygons, arches and circle parts, stars, burst, seal, sparkle, arrows, chevrons, speech bubbles, nature and travel motifs, blobs, banners and ribbons, paper cut-outs (leaf, coral, organic), stamps and badges, photo frames, ornaments (flourish, laurel, fleuron).',
  );

export const bookPhotoFitSchema = photo.fit
  .unwrap()
  .describe('cover fills the frame, cropped at the focal point; contain shows all of it.');
const SHAPE_IDS: ReadonlySet<string> = new Set(BOOK_SHAPES);

/**
 * A shape id to cut a photo to. Checked against the set rather than listed:
 * the list is in the schema already under `shape`, and repeating it on every
 * photo field doubled the page edit's schema.
 */
export const bookPhotoMaskSchema = z
  .string()
  .max(40)
  .refine((s) => SHAPE_IDS.has(s), { message: 'not a shape the Studio draws' })
  .transform((s) => s as BookShapeId)
  .nullable()
  .describe('A shape id, as for a shape, to cut the photo to; null is the plain rectangle.');
/** A shape id where `add` already lists them: checked against the same set, not listed a second time. */
export const bookShapeIdRefSchema = z
  .string()
  .max(40)
  .refine((s) => SHAPE_IDS.has(s), { message: 'not a shape the Studio draws' })
  .transform((s) => s as BookShapeId)
  .describe("Another outline, by the ids add's shape lists.");
export const bookFrameStyleSchema = photo.frameStyle
  .unwrap()
  .describe('polaroid (deep bottom border), white border, shadow, film or tape around it; none is a plain print.');
export const bookPhotoFilterSchema = photo.filter
  .unwrap()
  .describe('bw (black and white), warm, cool, fade (lifted blacks) or contrast; none as shot.');

export const bookTextAlignSchema = text.align.unwrap().describe('How the lines sit in the frame.');

export const bookShapeGradientSchema = shape.gradient
  .unwrap()
  .describe('Fade the fill out: up is solid at the top, down solid at the bottom; none is one flat fill.');
export const bookStrokeStyleSchema = shape.strokeStyle.unwrap().describe('A solid, dashed or dotted outline or rule.');

export const bookMapStyleSchema = map.style
  .unwrap()
  .describe('The map look: minimal, outline, dark (for a dark page) or paper.');
export const bookRouteStyleSchema = map.routeStyle
  .unwrap()
  .describe('plain is one stroke; drawn is a light line over a dark casing, as in an atlas.');
export const bookRouteArcSchema = map.routeArc
  .unwrap()
  .describe('bow draws the long legs as a curve, the way a flight is shown.');
export const bookRouteDashSchema = map.routeDash.unwrap().describe('arcs dashes the bowed legs; solid dashes nothing.');
export const bookPinStyleSchema = map.pinStyle.unwrap().describe('How the stops are marked.');
export const bookMapClipSchema = map.clip
  .unwrap()
  .describe('rect is a map in a box; country cuts it to the outline of its countries.');
/** Where a new map's ground comes from. */
export const bookMapSourceSchema = z
  .enum(['vector', 'relief', 'satellite'])
  .describe('vector outlines print sharp at any size; relief and satellite are imagery from the map provider.');

export const bookStatsLayoutSchema = bookStatsElementSchema.shape.layout
  .unwrap()
  .describe('The figures in a grid, one row or one column.');
export const bookStatsLookSchema = bookStatsElementSchema.shape.look.unwrap().describe('How the figures are drawn.');
export const bookCountriesLayoutSchema = bookCountriesElementSchema.shape.layout
  .unwrap()
  .describe('The countries as a list, a grid or one column.');
export const bookCountryLookSchema = bookCountriesElementSchema.shape.look.unwrap().describe('How a country is drawn.');
export const bookBadgeStyleSchema = bookBadgeElementSchema.shape.style.unwrap().describe('How the mark is set.');
export const bookBadgeVariantSchema = z
  .enum(BOOK_BADGES)
  .describe(
    'What the mark shows: a flag, a date, a day counter, coordinates, a country, a distance, weather, altitude or mood.',
  );
export const bookListLayoutSchema = bookListElementSchema.shape.layout
  .unwrap()
  .describe('columns sets pros beside cons; stacked sets one column with the marks inline.');
export const bookMetricSchema = z
  .enum(BOOK_METRICS)
  .describe(
    'A travel figure: distance, days, steps (journal entries), photos, countries, places or furthest from the start.',
  );

/** The page sizes a book is set up in. */
export const bookPagePresetSchema = bookPageSetupSchema.shape.preset
  .unwrap()
  .describe(
    'The page: square-210 or square-300 (mm), a4-landscape, a4-portrait, a5-landscape; custom keeps its own size.',
  );

/**
 * Any drawing the Studio's icon tab offers, by its lucide name. Checked
 * against the set rather than listed, for the size of the schema; refused
 * exactly as an enum would refuse a name it does not hold.
 */
export const bookIconNameSchema = z
  .string()
  .regex(/^[A-Z][A-Za-z0-9]*$/, 'expected a lucide icon name')
  .max(60)
  .refine((name) => BOOK_ICON_NAMES.has(name), { message: 'not a lucide icon the Studio offers' })
  .describe(
    'A lucide icon name in PascalCase, any the Studio offers: Plane, Compass, MapPin, MountainSnow, Waves, Sun, Camera, Heart, Landmark, Croissant and the rest of lucide.',
  );

/** What a text's binding means: where its words come from, and what each source needs beside it. */
export const BOOK_BINDING_HINT =
  'Words read from the journey and kept in sync: journey.title or journey.subtitle; entry.title, entry.story, entry.location (format dms or decimal for coordinates) or entry.date with entryId; photo.caption with photoId.';
