import { FERRATAS_ATTRIBUTION, ferratasQuerySchema } from '../ferratas/ferratas.schema';

import { z } from 'zod';

/**
 * HOR-01: the signposted horse routes around a trip, read from OpenStreetMap
 * (relations tagged `route=horse`) through Overpass
 * (GET /api/trips/:tripId/tours/horse-routes?bbox=south,west,north,east), and
 * what a horse tour keeps of a stretch it takes from one.
 *
 * A route comes in sections: the stretches of its ways that run on without a
 * fork, a gap or a crossing of the route with itself. A section is taken whole
 * and in the direction the rider picks; nothing here joins two sections or
 * fills a gap between them. Being part of a route says nothing about whether a
 * way may be ridden: the `horse=*` tags of its ways are given apart, and a way
 * without one stays unknown.
 */

/** The same box the via ferrata layer asks with: one map view, at most half a degree a side. */
export const horseRoutesQuerySchema = ferratasQuerySchema;
export type HorseRoutesQuery = z.output<typeof horseRoutesQuerySchema>;

/** The most routes one answer carries; past it the answer says `truncated`. */
export const HORSE_ROUTES_RESULT_CAP = 60;
/** The most sections one route carries; a route cut there says `truncated` too. */
export const HORSE_ROUTE_SECTIONS_CAP = 200;
/**
 * The most points a section carries: the most a fixed leg of a tour takes, so
 * a section always goes onto the tour as it came. A longer stretch is cut
 * into sections of this length that meet end to end.
 */
export const HORSE_ROUTE_SECTION_MAX_POINTS = 5000;

/** ODbL asks for this next to anything drawn from the data. */
export const HORSE_ROUTES_ATTRIBUTION = FERRATAS_ATTRIBUTION;

/** The `code` beside `error` when no Overpass mirror answered, so the client can say "try again later". */
export const HORSE_ROUTES_UNAVAILABLE_CODE = 'horse_routes_unavailable';

/**
 * `horse=*` as OpenStreetMap tags a way. The common values are kept as they
 * are; any other tagged value is `other`, and a way without the tag `unknown`.
 */
export const HORSE_ACCESS_VALUES = [
  'designated',
  'yes',
  'permissive',
  'destination',
  'discouraged',
  'private',
  'no',
  'other',
  'unknown',
] as const;
export const horseAccessSchema = z.enum(HORSE_ACCESS_VALUES);
export type HorseAccess = z.infer<typeof horseAccessSchema>;

/**
 * What a value says for a rider, in four steps: open (designated, yes,
 * permissive), limited (destination, discouraged, any other value), closed
 * (private, no) and unknown (not tagged). A step sorts what is tagged; it is
 * no permission, and the ground may say otherwise.
 */
export type HorseAccessTone = 'open' | 'limited' | 'closed' | 'unknown';
const ACCESS_TONES: Readonly<Record<HorseAccess, HorseAccessTone>> = {
  designated: 'open',
  yes: 'open',
  permissive: 'open',
  destination: 'limited',
  discouraged: 'limited',
  other: 'limited',
  private: 'closed',
  no: 'closed',
  unknown: 'unknown',
};
export function horseAccessTone(value: HorseAccess): HorseAccessTone {
  return ACCESS_TONES[value];
}

/** How much of a line carries one `horse=*` value, in metres. */
export const horseAccessShareSchema = z.object({
  value: horseAccessSchema,
  length_m: z.number().finite().nonnegative(),
});
export type HorseAccessShare = z.infer<typeof horseAccessShareSchema>;

/** The values along a line, each once, with the metres it covers. */
export const horseAccessSharesSchema = z.array(horseAccessShareSchema).max(HORSE_ACCESS_VALUES.length);

/**
 * Whether a line runs the way its route is signposted (`with`) or the other
 * way (`against`), where the route is signposted one way only along all of
 * it. Null where it is signposted both ways, or the data does not say.
 */
export const horseSignpostedSchema = z.enum(['with', 'against']);
export type HorseSignposted = z.infer<typeof horseSignpostedSchema>;

/** The other direction: a section or a leg turned round. */
export function turnedSignposted(value: HorseSignposted | null | undefined): HorseSignposted | null {
  if (value == null) return null;
  return value === 'with' ? 'against' : 'with';
}

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const horseRouteSectionSchema = z.object({
  /** Its place among the route's sections, from 1, in the order the route lists its ways. */
  number: z.number().int().positive(),
  /** The line as [lat, lng] pairs, in the order the route's ways run. */
  geometry: z
    .array(z.tuple([latitude, longitude]))
    .min(2)
    .max(HORSE_ROUTE_SECTION_MAX_POINTS),
  length_m: z.number().finite().nonnegative(),
  access: horseAccessSharesSchema,
  /** Along `geometry`, as the route's member roles say. */
  signposted: horseSignpostedSchema.nullable(),
});
export type HorseRouteSection = z.infer<typeof horseRouteSectionSchema>;

export const horseRouteSchema = z.object({
  /** The OSM relation, as `relation/<id>`. */
  id: z.string().regex(/^relation\/\d+$/),
  name: z.string().max(255).nullable(),
  ref: z.string().max(64).nullable(),
  osmUrl: z.string().url(),
  /** The route has ways beyond the box asked for: it goes on past what the sections show. */
  continues: z.boolean(),
  sections: z.array(horseRouteSectionSchema).min(1).max(HORSE_ROUTE_SECTIONS_CAP),
});
export type HorseRoute = z.infer<typeof horseRouteSchema>;

export const horseRoutesResponseSchema = z.object({
  routes: z.array(horseRouteSchema).max(HORSE_ROUTES_RESULT_CAP),
  /** True when the box held more than the caps allow and the rest was left out. */
  truncated: z.boolean(),
  source: z.literal('openstreetmap'),
  attribution: z.literal(HORSE_ROUTES_ATTRIBUTION),
});
export type HorseRoutesResponse = z.infer<typeof horseRoutesResponseSchema>;
