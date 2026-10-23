import { hikingPreferencesSchema, tourMaxHikingDifficultySchema, tourWaypointSchema } from './tours.schema';

import { z } from 'zod';

/**
 * A hike the server plans through the points it is given: the way on foot
 * under the hike's hiking limit and preferences, its heights, its length,
 * climb, descent and walking time, and the SAC grades OpenStreetMap records
 * for the paths it takes. The plan reads only; a hike created from it keeps
 * the whole line, the plan shows a thinned one.
 */

/** The most points one hike is planned through, its start and end included. */
export const HIKE_PLAN_MAX_WAYPOINTS = 30;
/** The most points of the line a plan shows; the tour created from it keeps every point. */
export const HIKE_PLAN_LINE_POINTS = 300;
/** The most samples of the height profile a plan shows. */
export const HIKE_PLAN_PROFILE_SAMPLES = 200;
/**
 * The most points a hike's routed line may hold before it is planned no
 * further. Its heights are read 499 points a question through the router's
 * one paced queue, about a second each, which every road trip and walk of the
 * instance waits behind: this many points take some twenty questions. A line
 * on paths carries a point every few metres to every few tens of metres, so
 * this is a hike of fifty kilometres and more, and at some fifty bytes a point
 * with its height it stays far below what one tour write carries
 * (TOUR_WRITE_MAX_BYTES).
 */
export const HIKE_MAX_LINE_POINTS = 10_000;

const { lat, lng, name, poi_category } = tourWaypointSchema.shape;

export const hikePlanPointSchema = z
  .object({
    lat,
    lng,
    name: name.describe('What the point is, such as a car park, a hut or a summit, where it has a name'),
    poi_category: poi_category.describe(
      'What kind of place the point is, where it is one: peak for a summit, shelter for a hut, drinking_water, viewpoint',
    ),
  })
  .strict();
export type HikePlanPoint = z.infer<typeof hikePlanPointSchema>;

export const hikePlanRequestSchema = z
  .object({
    waypoints: z
      .array(hikePlanPointSchema)
      .min(2)
      .max(HIKE_PLAN_MAX_WAYPOINTS)
      .describe('The points the hike goes through in order: its start, the points on the way and its end'),
    max_hiking_difficulty: tourMaxHikingDifficultySchema
      .optional()
      .describe('The hardest SAC grade the way may take, 1 (T1, hiking) to 6 (T6); 2 when left out'),
    hiking_preferences: hikingPreferencesSchema
      .nullable()
      .optional()
      .describe('Steep climbs, steps or ferries the way avoids where there is a way round'),
  })
  .strict();
export type HikePlanRequest = z.infer<typeof hikePlanRequestSchema>;

/** A step of the SAC hiking scale, T1 to T6 as 1 to 6. */
const sacStepSchema = z.number().int().min(1).max(6);

/** A stretch of the line whose paths OpenStreetMap grades with one SAC step, in metres along the line. */
export const hikeSacSegmentSchema = z.object({
  from_m: z.number().nonnegative(),
  to_m: z.number().nonnegative(),
  sac: sacStepSchema,
});
export type HikeSacSegment = z.infer<typeof hikeSacSegmentSchema>;

/**
 * The SAC grades along the line: the graded stretches in order, the hardest
 * step among them, and how much of the line has no grade at all. A path
 * without a grade is unknown, never easy.
 */
export const hikeTrailGradesSchema = z.object({
  segments: z.array(hikeSacSegmentSchema),
  highest: sacStepSchema.nullable(),
  /** Of the whole line, 0 to 1. */
  unknown_share: z.number().min(0).max(1),
});
export type HikeTrailGrades = z.infer<typeof hikeTrailGradesSchema>;

/** A point of a hike's line, `[lat, lng]`, or `[lat, lng, ele]` where its height is known. */
export const hikeLinePointSchema = z.union([z.tuple([lat, lng]), z.tuple([lat, lng, z.number().finite()])]);

/** A sample of a height profile, `[metres along the line, height in metres]`. */
export const hikeProfileSampleSchema = z.tuple([z.number().nonnegative(), z.number().finite()]);

/** Where the walking time comes from: the signposts' rule over the heights, or the router's own time without them. */
export const HIKE_DURATION_BASES = ['din33466', 'router'] as const;

export const routedHikePlanSchema = z.object({
  kind: z.literal('routed'),
  max_hiking_difficulty: tourMaxHikingDifficultySchema,
  hiking_preferences: hikingPreferencesSchema.nullable(),
  distance_m: z.number().int().nonnegative(),
  /** Null where the heights are unknown. */
  ascent_m: z.number().int().nonnegative().nullable(),
  descent_m: z.number().int().nonnegative().nullable(),
  duration_minutes: z.number().int().nonnegative(),
  duration_basis: z.enum(HIKE_DURATION_BASES),
  /** Whether every point of the line has its height; without them the line is flat and the profile empty. */
  has_heights: z.boolean(),
  /** The line thinned for display, `[lat, lng, ele]` where the heights are known. */
  line: z.array(hikeLinePointSchema).min(2).max(HIKE_PLAN_LINE_POINTS),
  /** The height profile thinned for display, `[metres along the line, height in metres]`. */
  profile: z.array(hikeProfileSampleSchema).max(HIKE_PLAN_PROFILE_SAMPLES),
  /** Null where the grades could not be read this time, or were not asked for. */
  grades: hikeTrailGradesSchema.nullable(),
});
export type RoutedHikePlan = z.infer<typeof routedHikePlanSchema>;

/**
 * Why no way was planned: no Valhalla to ask (an own OSRM without one, which
 * knows no hiking limit), a router that did not answer, the router's word
 * that no way within the limit joins the points, a point further from any
 * way than a tour allows, or a way longer than one hike is planned for (the
 * router's own distance limit, or more than HIKE_MAX_LINE_POINTS points).
 */
export const HIKE_UNROUTED_REASONS = [
  'no_valhalla',
  'router_unavailable',
  'no_way',
  'point_off_the_way',
  'too_long',
] as const;

export const unroutedHikePlanSchema = z.object({
  kind: z.literal('unrouted'),
  max_hiking_difficulty: tourMaxHikingDifficultySchema,
  why: z.enum(HIKE_UNROUTED_REASONS),
  /** The point no way reaches, counted from 1; null for every other reason. */
  position: z.number().int().positive().nullable(),
  /** How far the router had to move that point to reach a way, in metres; null for every other reason. */
  snapped_m: z.number().int().nonnegative().nullable(),
});
export type UnroutedHikePlan = z.infer<typeof unroutedHikePlanSchema>;

export const hikePlanSchema = z.discriminatedUnion('kind', [routedHikePlanSchema, unroutedHikePlanSchema]);
export type HikePlan = z.infer<typeof hikePlanSchema>;
