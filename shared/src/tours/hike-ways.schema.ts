import { idSchema } from '../common/primitives.schema';
import { HIKE_UNROUTED_REASONS, hikePlanPointSchema } from './hike-plan.schema';
import { ROUND_MAX_M, ROUND_MIN_M, ROUND_MOST } from './round-hike-search';
import {
  HIKE_MAX_WAYPOINTS,
  hikeProposeRequestSchema,
  hikeStageIssues,
  type HikeProposal,
  type HikeStop,
} from './tour-hike.schema';

import { z } from 'zod';

/**
 * RTE-02 and RTE-03 through the assistant: a round hike of about a wished
 * length out of one point, and the other ways the router knows for one leg of
 * a hike. Both are proposals the way propose_hike's are (they read only and
 * answer a hike proposal, one way per call), so the chat compares them as the
 * ways of one hike and creates the chosen one with create_hike.
 */

/** The letters the ways of one answer go by: the first, second and third found. */
export const HIKE_WAY_KEYS = ['a', 'b', 'c'] as const satisfies readonly string[];
export type HikeWayKey = (typeof HIKE_WAY_KEYS)[number];

const wayKeySchema = z.enum(HIKE_WAY_KEYS);

const {
  name,
  waypoints,
  max_hiking_difficulty,
  hiking_preferences,
  round_trip,
  variant_label,
  day_id,
  date,
  start_time,
  include_geometry,
} = hikeProposeRequestSchema.shape;

export const hikeRoundProposeRequestSchema = z
  .object({
    name: name.describe('What the round is called, such as "Round over the Kesselberg"'),
    start: hikePlanPointSchema.describe('Where the round starts and ends: a car park, a station, a hut'),
    distance_km: z
      .number()
      .min(ROUND_MIN_M / 1000)
      .max(ROUND_MAX_M / 1000)
      .describe(
        `How long the round should be, in kilometres (${ROUND_MIN_M / 1000} to ${ROUND_MAX_M / 1000}); a round within a fifth of it either way is offered`,
      ),
    round: wayKeySchema
      .optional()
      .describe(
        `Which of the rounds found to propose: a, b or c (up to ${ROUND_MOST} different ones); a when left out. One search answers all three, so ask for a, b and c in one step to compare them`,
      ),
    max_hiking_difficulty,
    hiking_preferences,
    variant_label,
    day_id,
    date,
    start_time,
    include_geometry,
  })
  .strict();
export type HikeRoundProposeRequest = z.infer<typeof hikeRoundProposeRequestSchema>;

/** How many legs a hike through `count` points has, its way back included for a round trip. */
export function hikeLegCount(count: number, roundTrip: boolean | undefined): number {
  return Math.max(0, count - 1 + (roundTrip === true ? 1 : 0));
}

export const hikeLegWayRequestSchema = z
  .object({
    name,
    waypoints,
    round_trip,
    leg: z
      .number()
      .int()
      .min(1)
      .max(HIKE_MAX_WAYPOINTS)
      .describe(
        'The leg to find other ways for, counted from 1: leg 1 runs from the first point to the second; on a round trip the last leg is the way back to the start',
      ),
    way: wayKeySchema
      .optional()
      .describe(
        'Which of the other ways to propose: a, b or c, in the order the router offers them; a when left out. Ask for a, b and c in one step to compare them',
      ),
    tour_id: idSchema
      .optional()
      .describe(
        'The saved hike these points are from (its place id, as list_tours gives it): the ways are then changes to that hike, made with update_tour, not new hikes',
      ),
    max_hiking_difficulty,
    hiking_preferences,
    day_id,
    date,
    start_time,
    include_geometry,
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const issue of hikeStageIssues(value.waypoints, value.round_trip)) {
      ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message });
    }
    if (value.leg > hikeLegCount(value.waypoints.length, value.round_trip)) {
      ctx.addIssue({ code: 'custom', path: ['leg'], message: 'The hike has no such leg' });
    }
  });
export type HikeLegWayRequest = z.infer<typeof hikeLegWayRequestSchema>;

/** Why no round or no other way could be proposed: the router's reasons, or a search that found none. */
export const HIKE_WAY_MISSES = [...HIKE_UNROUTED_REASONS, 'none_found'] as const;
export type HikeWayMiss = (typeof HIKE_WAY_MISSES)[number];

/** The points a proposed way is created or changed through. */
export interface HikeWayPoints {
  /** In order, with the stops a day ends at on a hike over several days. */
  waypoints: HikeStop[];
  round_trip: boolean;
}

/** A way asked for that is not there: which, how many there are, and why none or fewer. */
export interface HikeWayMissing {
  found: false;
  way: HikeWayKey;
  ways_found: number;
  why: HikeWayMiss;
}

/** A round found: the hike proposal of it, with how it stands to the wish and the points to create it through. */
export type HikeRoundProposal = HikeProposal & {
  found: true;
  round: { key: HikeWayKey; target_m: number; deviation_pct: number; rounds_found: number };
  create_with: HikeWayPoints;
};

/** Another way for one leg: the whole hike proposed with the leg taken that way, and the points it runs through. */
export type HikeLegWayProposal = HikeProposal & {
  found: true;
  leg_way: { key: HikeWayKey; leg: number; ways_found: number; tour_id: number | null };
  /** The hike as it runs now, for comparison: its length, climb and walking time. */
  current: { distance_m: number | null; ascent_m: number | null; duration_minutes: number | null };
  /** The hike as it runs now, thinned for drawing; only with include_geometry. */
  current_geometry?: HikeProposal['line_geometry'];
  create_with: HikeWayPoints;
};
