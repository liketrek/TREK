import { idSchema } from '../common/primitives.schema';
import { clockTimeSchema } from '../place/place-hours';
import {
  HIKE_DURATION_BASES,
  HIKE_PLAN_LINE_POINTS,
  HIKE_PLAN_PROFILE_SAMPLES,
  HIKE_UNROUTED_REASONS,
  hikeLinePointSchema,
  hikePlanPointSchema,
  hikeProfileSampleSchema,
  hikeSacSegmentSchema,
  hikeTrailGradesSchema,
} from './hike-plan.schema';
import { hikeScheduleSchema, hikeWarningSchema, HIKE_WARNING_KINDS } from './hike-schedule';
import { includeGeometryFlagSchema } from './tour-display.schema';
import { tourGpxImportFieldsSchema } from './tour-gpx-import.schema';
import { tourPoiCategorySchema, type TourPoiCategory } from './tour-poi-category';
import {
  hikingPreferencesSchema,
  plannedTourDurationMinutesSchema,
  tourDescriptionSchema,
  tourMaxHikingDifficultySchema,
  tourNameSchema,
  tourRevisionSchema,
} from './tours.schema';

import { z } from 'zod';

/**
 * A hike an assistant plans with the traveller over MCP: proposed first, read
 * only, as often as they want to compare ways, then created once they said
 * yes, changed later, or taken in from a GPX file. The server plans the way
 * on foot through the points (HikeRoutingService), with its heights, walking
 * time and SAC grades; nothing here carries a line from the caller.
 */

/** The most points a hike is asked through, its start and end included; a round trip adds its way back. */
export const HIKE_MAX_WAYPOINTS = 25;
/** The longest label a variant is given, short enough for a chip that compares two ways. */
export const HIKE_VARIANT_LABEL_MAX = 40;
/** The most graded stretches a proposal shows; more are joined, the harder grade kept. */
export const HIKE_PROPOSAL_SAC_SEGMENTS = 80;
/** The kinds of places a proposal looks for along its way. */
export const HIKE_ALONG_CATEGORIES = [
  'peak',
  'shelter',
  'drinking_water',
  'viewpoint',
] as const satisfies readonly TourPoiCategory[];
/** How far from the way a place along it may lie, in metres. */
export const HIKE_ALONG_CORRIDOR_M = 250;
/** The most places along the way a proposal names, the nearest to it. */
export const HIKE_ALONG_MAX = 12;
/** The largest GPX text a tool takes in, as the road trip's GPX import does. */
export const TOUR_GPX_TEXT_MAX = 1_000_000;

const hikeWaypointsSchema = z
  .array(hikePlanPointSchema)
  .min(2)
  .max(HIKE_MAX_WAYPOINTS)
  .describe(
    'The points the hike goes through in order: its start, the points on the way (a hut, a summit, a lake) and its end. For a round trip leave the end out and set round_trip',
  );

const hikeLimitSchema = tourMaxHikingDifficultySchema.describe(
  'The hardest SAC grade the way may take, 1 (T1, hiking) to 6 (T6, difficult alpine hiking); 2 (T2, mountain hiking) when left out',
);

const hikePreferencesSchema = hikingPreferencesSchema
  .nullable()
  .describe('Steep climbs, steps or ferries the way avoids where there is a way round');

const roundTripSchema = z.boolean().describe('The hike ends back at its start: the way back is planned too');

const plannedMinutesSchema = plannedTourDurationMinutesSchema.describe(
  'How long the travellers plan to be out, in minutes, breaks included; left out the walking time stands alone',
);

const hikeDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe(
    'The day the hike is planned for, YYYY-MM-DD, where it is on no day of the trip; day_id takes its own date',
  );

const hikeDayIdSchema = idSchema.describe('The day of the trip the hike is planned on, as list_days gives it');

const hikeStartTimeSchema = clockTimeSchema.describe('When the hike starts, HH:MM');

export const hikeProposeRequestSchema = z
  .object({
    name: tourNameSchema.describe('What the hike is called, such as "Over the Herzogstand to the Heimgarten"'),
    waypoints: hikeWaypointsSchema,
    max_hiking_difficulty: hikeLimitSchema.optional(),
    hiking_preferences: hikePreferencesSchema.optional(),
    round_trip: roundTripSchema.optional(),
    variant_label: z
      .string()
      .trim()
      .min(1)
      .max(HIKE_VARIANT_LABEL_MAX)
      .optional()
      .describe(
        'A short name for this way when several are compared, such as "short and steep" or "by the lake"; given back as it is',
      ),
    day_id: hikeDayIdSchema.optional(),
    date: hikeDateSchema.optional(),
    start_time: hikeStartTimeSchema.optional(),
    along: z
      .boolean()
      .optional()
      .describe(
        'Looks for summits, huts, water and viewpoints along the way; true when left out, false when comparing ways',
      ),
    include_geometry: includeGeometryFlagSchema,
  })
  .strict();
export type HikeProposeRequest = z.infer<typeof hikeProposeRequestSchema>;

/** Whether the way was planned, and why not: the plan's reasons, with the point no way reaches. */
export const hikeRouteOutcomeSchema = z.union([
  z.object({ planned: z.literal(true) }),
  z.object({
    planned: z.literal(false),
    why: z.enum(HIKE_UNROUTED_REASONS),
    /** The point no way reaches, counted from 1; null for every other reason. */
    position: z.number().int().positive().nullable(),
  }),
]);
export type HikeRouteOutcome = z.infer<typeof hikeRouteOutcomeSchema>;

const { lat, lng } = hikePlanPointSchema.shape;

/**
 * The SAC grades along a proposed way, as the plan reads them (the hardest
 * grade, the graded stretches in metres along the line, the share that is
 * unknown and never easy), with at most HIKE_PROPOSAL_SAC_SEGMENTS stretches.
 */
export const hikeProposalSacSchema = hikeTrailGradesSchema.extend({
  segments: z.array(hikeSacSegmentSchema).max(HIKE_PROPOSAL_SAC_SEGMENTS),
});
export type HikeProposalSac = z.infer<typeof hikeProposalSacSchema>;

/** The highest point of a way with heights, and where along it it lies. */
export const hikeHighPointSchema = z.object({
  lat,
  lng,
  ele_m: z.number().int(),
  at_m: z.number().int().nonnegative(),
});
export type HikeHighPoint = z.infer<typeof hikeHighPointSchema>;

/** A place along a proposed way: what it is, where, how far along the way and how far off it, in metres. */
export const hikeAlongPlaceSchema = z.object({
  name: z.string().nullable(),
  category: tourPoiCategorySchema,
  lat,
  lng,
  at_m: z.number().int().nonnegative(),
  off_m: z.number().int().nonnegative(),
});
export type HikeAlongPlace = z.infer<typeof hikeAlongPlaceSchema>;

/** A point a hike was asked through, as a proposal shows it. */
export const hikeProposalWaypointSchema = z.object({
  lat,
  lng,
  name: z.string().nullable(),
  poi_category: tourPoiCategorySchema.nullable(),
  /** Where it lies along the way; null where no way was planned. */
  at_m: z.number().int().nonnegative().nullable(),
  /** How far the router moved it onto a way, in metres; null where no way was planned. */
  snapped_m: z.number().int().nonnegative().nullable(),
  /** The walking minutes from the start to it; null where no way was planned. */
  minutes: z.number().int().nonnegative().nullable(),
  /** When it is reached, HH:MM; null without a start. */
  arrival: clockTimeSchema.nullable(),
});
export type HikeProposalWaypoint = z.infer<typeof hikeProposalWaypointSchema>;

/**
 * What propose_hike answers, and what a chat card for the hike is drawn
 * from: the way, its measures, its grades and highest point, the points it
 * was asked through with where and when each is reached, the places along it,
 * the day's schedule and what to look out for, and the request's own words
 * given back. The line and the height profile come only when asked for
 * (include_geometry), under keys a model never reads.
 */
export const hikeProposalSchema = z.object({
  name: z.string(),
  variant_label: z.string().nullable(),
  route: hikeRouteOutcomeSchema,
  /** Where a point lies further from any way than a tour allows: which one, and how far it was off. */
  unreachable: z
    .object({ position: z.number().int().positive(), snapped_m: z.number().int().nonnegative() })
    .nullable(),
  /** The length of the way in metres; null where none was planned. */
  distance_m: z.number().int().nonnegative().nullable(),
  ascent_m: z.number().int().nonnegative().nullable(),
  descent_m: z.number().int().nonnegative().nullable(),
  /** The walking time in minutes, breaks left out: by DIN 33466 where the heights are known, else the router's. */
  duration_minutes: z.number().int().nonnegative().nullable(),
  duration_basis: z.enum(HIKE_DURATION_BASES).nullable(),
  heights_known: z.boolean(),
  min_ele_m: z.number().int().nullable(),
  max_ele_m: z.number().int().nullable(),
  /** The way thinned for display, `[lat, lng, ele]` where the heights are known; only with include_geometry. */
  line_geometry: z.array(hikeLinePointSchema).max(HIKE_PLAN_LINE_POINTS).optional(),
  /** The height profile thinned for display, `[metres along the way, height]`; only with include_geometry. */
  profile_geometry: z.array(hikeProfileSampleSchema).max(HIKE_PLAN_PROFILE_SAMPLES).optional(),
  sac: hikeProposalSacSchema.nullable(),
  high_point: hikeHighPointSchema.nullable(),
  /** The points in the order walked, a round trip's way back included. */
  waypoints: z.array(hikeProposalWaypointSchema),
  /** Summits, huts, water and viewpoints along the way, in the order passed; null where not looked for or not found. */
  along: z.array(hikeAlongPlaceSchema).max(HIKE_ALONG_MAX).nullable(),
  max_hiking_difficulty: tourMaxHikingDifficultySchema,
  hiking_preferences: hikingPreferencesSchema.nullable(),
  round_trip: z.boolean(),
  day_id: idSchema.nullable(),
  date: z.string().nullable(),
  start_time: z.string().nullable(),
  /** The day's schedule, sun and weather; null without a date. */
  schedule: hikeScheduleSchema.nullable(),
  warnings: z.array(hikeWarningSchema).max(HIKE_WARNING_KINDS.length),
});
export type HikeProposal = z.infer<typeof hikeProposalSchema>;

export const hikeCreateRequestSchema = z
  .object({
    name: tourNameSchema.describe('What the hike is called'),
    description: tourDescriptionSchema.describe('A few words about the hike for the travellers, up to 2000 characters'),
    waypoints: hikeWaypointsSchema,
    max_hiking_difficulty: hikeLimitSchema.optional(),
    hiking_preferences: hikePreferencesSchema.optional(),
    round_trip: roundTripSchema.optional(),
    planned_duration_minutes: plannedMinutesSchema.optional(),
    day_id: hikeDayIdSchema.optional().describe('The day of the trip the hike is put on, as list_days gives it'),
    start_time: hikeStartTimeSchema
      .optional()
      .describe('When the hike starts on that day, HH:MM, kept as the start of its visit; only with day_id'),
  })
  .strict();
export type HikeCreateRequest = z.infer<typeof hikeCreateRequestSchema>;

export const tourUpdateRequestSchema = z
  .object({
    placeId: idSchema.describe('The place id of the hike, as list_tours gives it'),
    expected_revision: tourRevisionSchema.describe(
      'The revision of the hike as last read (get_tour_plan or list_tours); a hike changed since is refused, not overwritten',
    ),
    name: tourNameSchema.optional().describe('A new name for the hike'),
    description: tourDescriptionSchema.describe('A new description; null clears it'),
    waypoints: hikeWaypointsSchema
      .optional()
      .describe(
        'New points for the hike in order, start to end (a round trip ends on its start); the way is planned anew through them. Left out, the points stay',
      ),
    max_hiking_difficulty: hikeLimitSchema.optional(),
    hiking_preferences: hikePreferencesSchema.optional(),
    planned_duration_minutes: plannedMinutesSchema.optional(),
  })
  .strict();
export type TourUpdateRequest = z.infer<typeof tourUpdateRequestSchema>;

/**
 * A GPX file's text taken in as tours, one for each track or route it holds,
 * with the fields the multipart import takes beside the file. The fields keep
 * their own rules (a bike import names its profile, a paddle import its boat
 * and water), checked here as the import checks them.
 */
export const tourGpxImportRequestSchema = z
  .object({
    gpx: z.string().min(1).max(TOUR_GPX_TEXT_MAX).describe('The GPX file as text, its XML as it is'),
    file_name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional()
      .describe('The file name the travellers know it by, such as "herzogstand.gpx"'),
    ...tourGpxImportFieldsSchema.shape,
  })
  .strict()
  .superRefine((value, ctx) => {
    const { gpx: _gpx, file_name: _fileName, ...fields } = value;
    const checked = tourGpxImportFieldsSchema.safeParse(fields);
    for (const issue of checked.error?.issues ?? []) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: issue.path, message: issue.message });
    }
  });
export type TourGpxImportRequest = z.infer<typeof tourGpxImportRequestSchema>;
