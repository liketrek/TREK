import { z } from 'zod';

/**
 * Paint: what fills a shape or a page when one flat colour is not enough.
 *
 * Four kinds, and each is something a printed page can carry as vector:
 *
 * - `solid`: one colour, with an alpha of its own. The colour stays `#rrggbb`
 *   and the alpha is a separate number, so every reader that knows hex keeps
 *   reading the colour, and print gets `fill-opacity` rather than a colour
 *   format some RIP does not know.
 * - `linear`: two to six stops along a line at `angle` degrees. The angle
 *   reads the way CSS reads it: 0 runs towards the top, 90 towards the right.
 * - `radial`: the same stops from a centre (`cx`, `cy` as fractions of the
 *   box) out to `r`, a fraction of half the box's diagonal, so 1 reaches the
 *   corners from the middle whatever the box's proportions.
 * - `pattern`: one of the twelve repeats, `fg` drawn over `bg` (null lets what
 *   is underneath show through), its cell `scale` times the natural 8 mm and
 *   turned by `angle`.
 *
 * Paint is additive. A shape keeps its `fill` and `gradient` and a page its
 * `background`, set to the colour that stands for the paint (book-paint.ts),
 * so a reader from before paint existed still draws something close and a
 * finding that measures contrast still has a colour to measure.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');
const alpha = z.number().min(0).max(1);
const angle = z.number().finite().min(-360).max(360);

/** The repeats a pattern paint draws, each as explicit geometry clipped to the box. */
export const BOOK_PATTERNS = [
  'checker',
  'gingham',
  'stripes',
  'pinstripe',
  'dots',
  'polka',
  'zigzag',
  'waves',
  'grid',
  'scales',
  'sunburst',
  'confetti',
  'linen',
  'grain',
] as const;
export type BookPattern = (typeof BOOK_PATTERNS)[number];

/** A gradient has at least two stops and at most this many. */
export const MAX_PAINT_STOPS = 6;
/** The scale range of a pattern, against its natural 8 mm cell. */
export const PATTERN_SCALE = { min: 0.25, max: 4 } as const;
/** The radius range of a radial gradient, as a fraction of half the box's diagonal. */
export const RADIAL_RADIUS = { min: 0.05, max: 2 } as const;

type ObjectFactory = typeof z.object | typeof z.strictObject;

/**
 * The union, built once for the document (plain objects, which drop a field
 * they do not know, as the rest of the document does) and once for the
 * operations (strict, as every operation is), so the two cannot drift.
 *
 * The document takes the pattern as a string held to BOOK_PATTERNS on parse:
 * a page carries paint on its background and on every shape, twice over in the
 * restore tool's schema (elements and parked), and the ids spelled out each
 * time are what a model handing a page back never needs. The operations,
 * where a model picks a pattern, keep the enum.
 */
function paintSchemas(obj: ObjectFactory, pattern: z.ZodType<BookPattern, string>) {
  const stop = obj({ at: z.number().min(0).max(1), color: hex, alpha: alpha.optional() });
  const stops = z.array(stop).min(2).max(MAX_PAINT_STOPS);
  const linear = obj({ type: z.literal('linear'), angle, stops });
  const radial = obj({
    type: z.literal('radial'),
    cx: z.number().min(0).max(1),
    cy: z.number().min(0).max(1),
    r: z.number().min(RADIAL_RADIUS.min).max(RADIAL_RADIUS.max),
    stops,
  });
  const patterned = obj({
    type: z.literal('pattern'),
    pattern,
    fg: hex,
    bg: hex.nullable(),
    scale: z.number().min(PATTERN_SCALE.min).max(PATTERN_SCALE.max),
    angle,
  });
  const paint = z.discriminatedUnion('type', [
    obj({ type: z.literal('solid'), color: hex, alpha: alpha.optional() }),
    linear,
    radial,
    patterned,
  ]);
  return { stop, paint, linear, radial, patterned };
}

const docSchemas = paintSchemas(z.object, z.string().pipe(z.enum(BOOK_PATTERNS)));

export const bookPaintStopSchema = docSchemas.stop;
export const bookPaintSchema = docSchemas.paint;
/** The paints that are more than one colour, as the letters of a text take them too (book-text-effects.schema.ts). */
export const bookLinearPaintSchema = docSchemas.linear;
export const bookRadialPaintSchema = docSchemas.radial;
export const bookPatternPaintSchema = docSchemas.patterned;
export type BookPaint = z.infer<typeof bookPaintSchema>;
export type BookPaintStop = z.infer<typeof bookPaintStopSchema>;
export type BookGradientPaint = Extract<BookPaint, { type: 'linear' | 'radial' }>;
export type BookPatternPaint = Extract<BookPaint, { type: 'pattern' }>;

/**
 * Paint as the page operations take it. Described once, here, because the
 * tool schema is all a model reads of it and it appears in three places.
 */
export const bookPaintInSchema = paintSchemas(z.strictObject, z.enum(BOOK_PATTERNS)).paint.describe(
  'solid (alpha 0..1), linear (angle: 0 towards the top, 90 towards the right) or radial (cx, cy 0..1 of the box, r of half its diagonal) with 2 to 6 stops at 0..1, or a pattern: fg on bg (null shows through), scale 1 is an 8 mm cell.',
);

/**
 * The optional field a shape and a page carry. A paint the reader cannot read
 * falls back to nothing, which leaves the colour beside it to draw, rather
 * than failing the element or the page it sits on.
 */
export const bookPaintFieldSchema = bookPaintSchema.optional().catch(undefined);
