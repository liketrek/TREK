import { z } from 'zod';

/**
 * Via ferratas around a trip, read from OpenStreetMap through Overpass
 * (GET /api/trips/:tripId/ferratas?bbox=south,west,north,east).
 *
 * Read-only and keyless: the server asks the Overpass mirrors the operator
 * configured (OVERPASS_URL) and answers with the ways it found, each with its
 * grade as OpenStreetMap tags it. Nothing is stored.
 */

/** The widest box one request may ask for, per side, in degrees (about 55 km north to south). */
export const FERRATA_BBOX_MAX_SPAN_DEG = 0.5;

/** The most ferratas one answer carries; past it the answer says `truncated`. */
export const FERRATAS_RESULT_CAP = 400;

/** ODbL asks for this next to anything drawn from the data. */
export const FERRATAS_ATTRIBUTION = '© OpenStreetMap contributors';

/** The `code` beside `error` when no Overpass mirror answered, so the client can say "try again later". */
export const FERRATAS_UNAVAILABLE_CODE = 'ferratas_unavailable';

export const FERRATA_BBOX_INVALID_MESSAGE = 'A valid bbox (south,west,north,east) is required';
export const FERRATA_BBOX_TOO_LARGE_MESSAGE = `The bbox may span at most ${FERRATA_BBOX_MAX_SPAN_DEG} degrees per side`;

/**
 * Room for float noise at the span limit: edges rounded to three decimals can
 * put a 0.500 span at 0.5000000000000071 (63.501 to 64.001).
 */
const SPAN_EPSILON = 1e-9;

/**
 * Whether neither side of the box is wider than FERRATA_BBOX_MAX_SPAN_DEG. The
 * one rule for both ends: the server refuses past it and the client asks the
 * user to zoom in instead of sending the box.
 */
export function ferrataBboxSpanOk(b: { south: number; west: number; north: number; east: number }): boolean {
  const max = FERRATA_BBOX_MAX_SPAN_DEG + SPAN_EPSILON;
  return b.north - b.south <= max && b.east - b.west <= max;
}

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

const ferrataBboxSchema = z
  .object({ south: latitude, west: longitude, north: latitude, east: longitude })
  .refine((b) => b.south < b.north && b.west < b.east, { message: FERRATA_BBOX_INVALID_MESSAGE })
  .refine(ferrataBboxSpanOk, { message: FERRATA_BBOX_TOO_LARGE_MESSAGE });
export type FerrataBbox = z.infer<typeof ferrataBboxSchema>;

/**
 * The query: one `bbox` of four comma-separated numbers in south, west, north,
 * east order (the order Overpass takes them in). A box that crosses the
 * antimeridian is refused rather than split; no via ferrata sits on it.
 */
export const ferratasQuerySchema = z.object({
  bbox: z
    .string()
    .max(200)
    .transform((raw, ctx) => {
      // Number('') is 0, so an empty edge would quietly become the equator; refuse it first.
      const edges = raw.split(',').map((part) => (part.trim() === '' ? Number.NaN : Number(part)));
      if (edges.length !== 4 || !edges.every(Number.isFinite)) {
        ctx.addIssue({ code: 'custom', message: FERRATA_BBOX_INVALID_MESSAGE });
        return z.NEVER;
      }
      const [south, west, north, east] = edges as [number, number, number, number];
      return { south, west, north, east };
    })
    .pipe(ferrataBboxSchema),
});
export type FerratasQuery = z.output<typeof ferratasQuerySchema>;

/**
 * The difficulty as tagged. `via_ferrata_scale` is 0 to 6, sometimes with a
 * `+` or `-`; `level` and `plus` are filled only for that form. Anything else
 * (a letter scale such as "C/D", free text) keeps its `raw` value and reads as
 * unknown: letter scales are not converted, because the mapping between the
 * Hüsler, Schall and OSM scales is not one to one.
 */
export const ferrataGradeSchema = z.object({
  raw: z.string().max(64).nullable(),
  level: z.number().int().min(0).max(6).nullable(),
  plus: z.enum(['+', '-']).nullable(),
});
export type FerrataGrade = z.infer<typeof ferrataGradeSchema>;

export const ferrataSchema = z.object({
  /** The OSM way, as `way/<id>`. */
  id: z.string().regex(/^way\/\d+$/),
  name: z.string().max(500).nullable(),
  grade: ferrataGradeSchema,
  /** The name of a `route=via_ferrata` relation the way belongs to, when it has one. */
  routeName: z.string().max(500).nullable(),
  /** The line as [lat, lng] pairs, in way order. */
  geometry: z
    .array(z.tuple([latitude, longitude]))
    .min(2)
    .max(20000),
  osmUrl: z.string().url(),
});
export type Ferrata = z.infer<typeof ferrataSchema>;

export const ferratasResponseSchema = z.object({
  ferratas: z.array(ferrataSchema).max(FERRATAS_RESULT_CAP),
  /** True when the box held more than FERRATAS_RESULT_CAP ways and the rest were left out. */
  truncated: z.boolean(),
  source: z.literal('openstreetmap'),
  attribution: z.literal(FERRATAS_ATTRIBUTION),
});
export type FerratasResponse = z.infer<typeof ferratasResponseSchema>;
