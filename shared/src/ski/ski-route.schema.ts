import { SKI_DIFFICULTIES, skiDisciplineSchema, skiRouteOptionsSchema, skiTechniqueSchema } from '../tours/ski.schema';

import { z } from 'zod';

/**
 * The piste router: legs of a ski and winter tour planned on the runs, lifts,
 * cross-country trails, ski touring and winter paths of OpenStreetMap. The
 * Places host builds a graph per ski area once and serves it by area id; TREK
 * downloads the areas a tour needs and searches them itself, so the points a
 * traveller clicks never leave the server. Every leg is planned on its own
 * and answered as planned or failed with the reason and, where one helps, the
 * one change that would plan it. A failed leg is never drawn by the server:
 * the planner draws it straight and says so.
 */

export const skiRoutePointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type SkiRoutePoint = z.infer<typeof skiRoutePointSchema>;

/** The most legs one request plans; a tour with more asks again. */
export const MAX_SKI_ROUTE_LEGS = 40;

/** At most this many other ways per leg, besides the best one. */
export const MAX_SKI_ALTERNATIVES = 2;

export const skiRouteRequestSchema = z.object({
  legs: z
    .array(
      z.object({
        from: skiRoutePointSchema,
        to: skiRoutePointSchema,
        /** The leg ends at a shaping point: it bends the way, the summary does not split there. */
        shaping_to: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(MAX_SKI_ROUTE_LEGS),
  discipline: skiDisciplineSchema,
  /** Cross-country only; any other discipline ignores it. Left out on cross-country, either technique will do. */
  technique: skiTechniqueSchema.nullable().default(null),
  options: skiRouteOptionsSchema.prefault({}),
  alternatives: z.number().int().min(0).max(MAX_SKI_ALTERNATIVES).default(0),
});
export type SkiRouteRequest = z.infer<typeof skiRouteRequestSchema>;
export type SkiRouteInput = z.input<typeof skiRouteRequestSchema>;

/**
 * The stretches of a planned leg: a run, a lift ridden up, a funicular or rack
 * railway, a gondola ridden down, a cross-country trail, a ski touring or
 * winter path, a mapped connection between runs, an open slope, a short link
 * the map data does not hold, a crossing, or a stretch on foot.
 */
export const skiSegmentKindSchema = z.enum([
  'run',
  'lift',
  'rail',
  'lift_down',
  'nordic',
  'skitour',
  'hike',
  'connection',
  'area',
  'link',
  'crossing',
  'walk',
]);
export type SkiSegmentKind = z.infer<typeof skiSegmentKindSchema>;

/** What a stretch rests on that the traveller should know: guessed links, directions, techniques and the like. */
export const skiFlagSchema = z.enum([
  'inferred_link',
  'inferred_crossing',
  'dir_from_dem',
  'dir_conflict',
  'technique_assumed',
  'relation_inherited',
  'area_derived',
  'ride_down',
  'uphill_on_piste',
  'dismount',
  'difficulty_unknown',
  'tunnel',
]);
export type SkiFlag = z.infer<typeof skiFlagSchema>;

/** A run's difficulty as mapped, freeride and extreme included. */
export const skiRunDifficultySchema = z.enum([...SKI_DIFFICULTIES, 'freeride', 'extreme']);
export type SkiRunDifficulty = z.infer<typeof skiRunDifficultySchema>;

/** A point of a planned leg: [lat, lng, height in metres], the height null where the terrain data has none. */
export const skiGeometryPointSchema = z.tuple([z.number(), z.number(), z.number().nullable()]);
export type SkiGeometryPoint = z.infer<typeof skiGeometryPointSchema>;

export const skiRouteSegmentSchema = z.object({
  kind: skiSegmentKindSchema,
  /** First and last index into the leg's geometry, both included. */
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative(),
  name: z.string().nullable(),
  ref: z.string().nullable(),
  difficulty: skiRunDifficultySchema.nullable(),
  /** The lift's type as OpenStreetMap names it (gondola, chair_detachable, t-bar...); null off a lift. */
  lift_type: z.string().nullable(),
  /** How the trail is groomed, as mapped (classic, skating, scooter, backcountry, mogul). */
  grooming: z.array(z.string()),
  /** Time on the move, without waiting. */
  seconds: z.number().nonnegative(),
  /** Waiting at the lift's bottom station, a guess from the lift's type and capacity. */
  wait_seconds: z.number().nonnegative(),
  length_m: z.number().nonnegative(),
  flags: z.array(skiFlagSchema),
  osm_way: z.number().nullable(),
});
export type SkiRouteSegment = z.infer<typeof skiRouteSegmentSchema>;

/** Why the way is as it is: a harder run it kept clear of, or how often it rests on a flagged stretch. */
export const skiWhySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('avoided_difficulty'),
    level: skiRunDifficultySchema,
    name: z.string().nullable(),
    saved_seconds: z.number().nonnegative(),
  }),
  z.object({ kind: z.literal('flag'), flag: skiFlagSchema, count: z.number().int().positive() }),
]);
export type SkiWhy = z.infer<typeof skiWhySchema>;

export const skiLegSecondsSchema = z.object({
  ski: z.number().nonnegative(),
  lift: z.number().nonnegative(),
  wait: z.number().nonnegative(),
  walk: z.number().nonnegative(),
});
export type SkiLegSeconds = z.infer<typeof skiLegSecondsSchema>;

export const skiRouteAlternativeSchema = z.object({
  geometry: z.array(skiGeometryPointSchema).min(2),
  segments: z.array(skiRouteSegmentSchema).min(1),
  seconds_total: z.number().nonnegative(),
});
export type SkiRouteAlternative = z.infer<typeof skiRouteAlternativeSchema>;

export const skiRouteOkLegSchema = z.object({
  status: z.literal('ok'),
  geometry: z.array(skiGeometryPointSchema).min(2),
  segments: z.array(skiRouteSegmentSchema).min(1),
  distance_m: z.number().nonnegative(),
  climb_m: z.number().nonnegative(),
  descent_m: z.number().nonnegative(),
  seconds: skiLegSecondsSchema,
  /** How far the ends were moved onto the network, in metres. */
  snapped_m: z.object({ from: z.number().nonnegative(), to: z.number().nonnegative() }),
  area_ids: z.array(z.string()),
  why: z.array(skiWhySchema),
  alternatives: z.array(skiRouteAlternativeSchema).max(MAX_SKI_ALTERNATIVES),
});
export type SkiRouteOkLeg = z.infer<typeof skiRouteOkLegSchema>;

export const skiFailCodeSchema = z.enum([
  /** A point lies farther from any run, trail or lift the discipline may use than the router reaches. */
  'not_on_piste',
  /** No ski area of the piste data covers the point. */
  'no_area',
  /** The ski area is being downloaded; asked again shortly it answers. */
  'loading',
  /** The piste data cannot be reached and no copy of the area is kept. */
  'places_unavailable',
  /** The admin switched piste routing off. */
  'disabled',
  'blocked_by_difficulty',
  'blocked_by_lift_avoid',
  'blocked_by_technique',
  'needs_ride_down',
  /** Only a way up joins the points, and the discipline has none without a lift. */
  'uphill_only',
  /** Nothing of the network joins the points. */
  'disconnected',
  /** The points lie in two ski areas that do not touch. */
  'cross_area',
  'busy',
  'timeout',
]);
export type SkiFailCode = z.infer<typeof skiFailCodeSchema>;

/** The one change that would plan a failed leg; each field is a separate suggestion. */
export const skiFailHintSchema = z.object({
  raise_difficulty: skiRunDifficultySchema.optional(),
  allow_lift: z.string().optional(),
  technique: skiTechniqueSchema.optional(),
  allow_lift_down: z.boolean().optional(),
  discipline: skiDisciplineSchema.optional(),
  free_draw: z.boolean().optional(),
});
export type SkiFailHint = z.infer<typeof skiFailHintSchema>;

export const skiRouteFailedLegSchema = z.object({
  status: z.literal('failed'),
  code: skiFailCodeSchema,
  /** Where it failed: the point off the network, or the nearest point reached towards the target. */
  at: skiRoutePointSchema.nullable(),
  hint: skiFailHintSchema.nullable(),
  /** The run or lift the reason is about, and how far a point lies off the network. */
  detail: z.object({ name: z.string().nullable(), distance_m: z.number().optional() }).nullable(),
});
export type SkiRouteFailedLeg = z.infer<typeof skiRouteFailedLegSchema>;

export const skiRouteLegSchema = z.discriminatedUnion('status', [skiRouteOkLegSchema, skiRouteFailedLegSchema]);
export type SkiRouteLeg = z.infer<typeof skiRouteLegSchema>;

/** The colours a run's difficulty is drawn in: the European scheme, or North America's. */
export const skiColourSchemeSchema = z.enum(['europe', 'north_america']);
export type SkiColourScheme = z.infer<typeof skiColourSchemeSchema>;

export const skiRouteResponseSchema = z.object({
  legs: z.array(skiRouteLegSchema),
  /** The piste data build the legs were planned on; null when no area was used. */
  build: z.string().nullable(),
  /** The Places host could not be reached and a kept, older copy of an area was used. */
  stale: z.boolean(),
  area_names: z.array(z.string()),
  /** How the areas planned on colour their runs; Europe's where no area was used. */
  colour_scheme: skiColourSchemeSchema,
  attribution: z.string(),
});
export type SkiRouteResponse = z.infer<typeof skiRouteResponseSchema>;

/** GET /ski/area-near: whether the ski area at a point is ready, on its way, or cannot be had. */
export const skiAreaStateSchema = z.enum(['ready', 'loading', 'unavailable']);
export type SkiAreaState = z.infer<typeof skiAreaStateSchema>;

export const skiAreaNearQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});
export type SkiAreaNearQuery = z.infer<typeof skiAreaNearQuerySchema>;

export const skiAreaNearResponseSchema = z.object({
  area: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      kind: z.string(),
      colour_scheme: skiColourSchemeSchema,
      build: z.string().nullable(),
      state: skiAreaStateSchema,
    })
    .nullable(),
});
export type SkiAreaNearResponse = z.infer<typeof skiAreaNearResponseSchema>;

/** An area id as the Places host spells it: `w:<way>` or `r:<relation>`, a piece of a split network with a suffix. */
export const skiAreaIdSchema = z
  .string()
  .max(64)
  .regex(/^[a-z]:[0-9]+(-[0-9a-z]+)?$/);

/** One drawn line of an area's network: a run, a lift or a trail, as a Google-encoded polyline (precision 5). */
export const skiNetworkFeatureSchema = z.object({
  kind: skiSegmentKindSchema,
  difficulty: skiRunDifficultySchema.nullable(),
  name: z.string().nullable(),
  lift_type: z.string().nullable(),
  /** Skied or ridden one way only, in the direction it is drawn. */
  oneway: z.boolean(),
  line: z.string().min(1),
});
export type SkiNetworkFeature = z.infer<typeof skiNetworkFeatureSchema>;

export const skiNetworkResponseSchema = z.object({
  area_id: z.string(),
  build: z.string().nullable(),
  colour_scheme: skiColourSchemeSchema,
  /** How far the lines were simplified, in metres. */
  simplified_m: z.number().nonnegative(),
  features: z.array(skiNetworkFeatureSchema),
});
export type SkiNetworkResponse = z.infer<typeof skiNetworkResponseSchema>;
