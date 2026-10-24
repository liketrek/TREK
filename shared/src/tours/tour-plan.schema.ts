import { runPaceSecondsPerKmSchema } from './run-pace';
import { includeGeometryFlagSchema } from './tour-display.schema';
import {
  hikeDateSchema,
  hikeDayIdSchema,
  hikeProposalSchema,
  hikeStartTimeSchema,
  hikeWaypointsSchema,
  plannedMinutesSchema,
  refineStages,
  roundTripSchema,
  variantLabelSchema,
} from './tour-hike.schema';
import { bikeProfileSchema, runProfileSchema, tourDescriptionSchema, tourNameSchema } from './tours.schema';

import { z } from 'zod';

/**
 * A bike tour or a run an assistant plans with the traveller over MCP, the
 * way a hike is planned (propose_hike, create_hike): proposed first, read
 * only, as often as ways are compared, and created once the traveller said
 * yes. The server plans the way through the points with the costing of the
 * tour's profile (`bikeCosting`, `runCosting`), its heights and its time: a
 * bike tour the router's riding time for its profile, a run its distance at
 * the runner's pace. Nothing here carries a line from the caller.
 */

/** The tour types planned this way besides a hike, which keeps its own tools. */
export const TOUR_PLAN_ACTIVITIES = ['bike', 'run'] as const;
export const tourPlanActivitySchema = z.enum(TOUR_PLAN_ACTIVITIES);
export type TourPlanActivity = z.infer<typeof tourPlanActivitySchema>;

const activitySchema = tourPlanActivitySchema.describe(
  'bike for a bike tour, run for a run; a hike is planned with propose_hike, a city walk with propose_city_walk',
);

const bikeProfileField = bikeProfileSchema.describe(
  'A bike tour only, what it is ridden on: touring (paved ways, cycle paths and quiet roads, the default), road (asphalt only, a road bike), gravel (gravel and farm tracks) or mtb (rough tracks and trails, a mountain bike)',
);

const runProfileField = runProfileSchema.describe(
  'A run only: running (runnable, mostly paved ways in towns, parks and along rivers, the default) or trail (forest tracks and natural paths up to T2 mountain paths)',
);

const runPaceField = runPaceSecondsPerKmSchema.describe(
  "A run only: the runner's own pace in seconds per kilometre, 360 for 6:00 min/km; the run's time is its distance at this pace",
);

/** What belongs to which activity: a profile of its own kind, and a pace on a run only. */
function refineActivity(
  value: {
    activity: TourPlanActivity;
    bike_profile?: unknown;
    run_profile?: unknown;
    run_pace_seconds_per_km?: unknown;
  },
  ctx: z.RefinementCtx,
): void {
  const add = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
  if (value.activity === 'bike') {
    if (value.run_profile !== undefined) add('run_profile', 'run_profile belongs to a run');
    if (value.run_pace_seconds_per_km !== undefined) add('run_pace_seconds_per_km', 'a pace belongs to a run');
  } else if (value.bike_profile !== undefined) {
    add('bike_profile', 'bike_profile belongs to a bike tour');
  }
}

const tourPlanShape = {
  activity: activitySchema,
  bike_profile: bikeProfileField.optional(),
  run_profile: runProfileField.optional(),
  run_pace_seconds_per_km: runPaceField.optional(),
  waypoints: hikeWaypointsSchema.describe(
    'The points the tour goes through in order: its start, the points on the way and its end. For a round trip leave the end out and set round_trip. A tour over several days marks the stop of each night with stage_end',
  ),
  round_trip: roundTripSchema.optional(),
};

export const tourProposeRequestSchema = z
  .object({
    name: tourNameSchema.describe('What the tour is called, such as "Round the Ammersee"'),
    ...tourPlanShape,
    variant_label: variantLabelSchema.optional(),
    day_id: hikeDayIdSchema.optional(),
    date: hikeDateSchema.optional(),
    start_time: hikeStartTimeSchema.optional(),
    along: z
      .boolean()
      .optional()
      .describe(
        'Looks for water, food, toilets and viewpoints along the way; true when left out, false when comparing ways',
      ),
    include_geometry: includeGeometryFlagSchema,
  })
  .strict()
  .superRefine(refineStages)
  .superRefine(refineActivity);
export type TourProposeRequest = z.infer<typeof tourProposeRequestSchema>;

export const tourPlanCreateRequestSchema = z
  .object({
    name: tourNameSchema.describe('What the tour is called'),
    description: tourDescriptionSchema.describe('A few words about the tour for the travellers, up to 2000 characters'),
    ...tourPlanShape,
    planned_duration_minutes: plannedMinutesSchema.optional(),
    day_id: hikeDayIdSchema.optional().describe('The day of the trip the tour is put on, as list_days gives it'),
    start_time: hikeStartTimeSchema
      .optional()
      .describe('When the tour starts on that day, HH:MM, kept as the start of its visit; only with day_id'),
  })
  .strict()
  .superRefine(refineStages)
  .superRefine(refineActivity)
  .superRefine((value, ctx) => {
    // The planner saves a run only with a pace: without one it has no time at all.
    if (value.activity === 'run' && value.run_pace_seconds_per_km === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['run_pace_seconds_per_km'],
        message: "a run is saved with the runner's pace: ask for it",
      });
    }
  });
export type TourPlanCreateRequest = z.infer<typeof tourPlanCreateRequestSchema>;

/** How a bike tour's or a run's time was reckoned: the router's riding time, or the distance at the runner's pace. */
export const TOUR_PLAN_DURATION_BASES = ['router', 'pace'] as const;

/**
 * What propose_tour answers: a hike's proposal (the way, its measures, its
 * points with where and when each is reached, the places along it, the day)
 * for a bike tour or a run, with its activity and profile. A hike's limit,
 * preferences and SAC grades are a hike's alone and stay null. A run without
 * a pace has no time.
 */
export const tourProposalSchema = hikeProposalSchema.extend({
  activity: tourPlanActivitySchema,
  bike_profile: bikeProfileSchema.nullable(),
  run_profile: runProfileSchema.nullable(),
  run_pace_seconds_per_km: runPaceSecondsPerKmSchema.nullable(),
  duration_basis: z.enum(TOUR_PLAN_DURATION_BASES).nullable(),
  max_hiking_difficulty: z.null(),
  hiking_preferences: z.null(),
  sac: z.null(),
});
export type TourProposal = z.infer<typeof tourProposalSchema>;
