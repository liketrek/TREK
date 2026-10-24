import { badRequest } from '../common/domain-error';
import { hikeWaypointsOf, type KeptWay } from './hike-plan.helpers';
import type { PlannedActivity, PlannedHike } from './hike-routing.service';
import type { TourCreateCommand } from './tours.service';
import {
  HIKE_ALONG_CATEGORIES,
  runMinutesAtPace,
  TOUR_MAX_SNAP_M,
  type HikeCreateRequest,
  type HikeProposal,
  type HikeProposeRequest,
  type HikeRouteOutcome,
  type HikeStop,
  type TourPlanActivity,
  type TourPlanCreateRequest,
  type TourPoiCategory,
  type TourProposal,
  type TourProposeRequest,
  type UnroutedHikePlan,
} from '@trek/shared';

import type { z } from 'zod';

/**
 * The pure halves of a bike tour or a run an assistant plans over MCP
 * (propose_tour, create_tour), on top of a hike's (hike-plan.helpers): the
 * profile it is planned for, the places looked for along it, its time on the
 * move, the proposal it answers and the write it makes. One plan and one save
 * for every activity; only these differ.
 */

/** The activity and profile a request plans for, the planner's own profile where none is named. */
export function plannedActivityOf(request: {
  activity: TourPlanActivity;
  bike_profile?: PlannedActivity['profile'];
  run_profile?: PlannedActivity['profile'];
}): PlannedActivity {
  if (request.activity === 'bike') {
    const profile = request.bike_profile;
    return {
      activity: 'bike',
      profile: profile === 'road' || profile === 'gravel' || profile === 'mtb' ? profile : 'touring',
    };
  }
  return { activity: 'run', profile: request.run_profile === 'trail' ? 'trail' : 'running' };
}

/** What a proposal looks for along the way, by activity: a hike its summits and huts, a ride and a run what they stop for. */
export const ALONG_CATEGORIES: Readonly<Record<'hike' | TourPlanActivity, readonly TourPoiCategory[]>> = {
  hike: HIKE_ALONG_CATEGORIES,
  bike: ['drinking_water', 'bike_repair', 'food', 'viewpoint'],
  run: ['drinking_water', 'toilets', 'viewpoint', 'park'],
};

/** A request of propose_tour as a hike's proposal reads it: the same points, day and words, no hiking limit. */
export function asHikeProposal({
  activity: _activity,
  bike_profile: _bike,
  run_profile: _run,
  run_pace_seconds_per_km: _pace,
  ...request
}: TourProposeRequest): HikeProposeRequest {
  return request;
}

/** A request of create_tour as a hike's create reads it: the same points, day, words and planned time. */
export function asHikeCreate({
  activity: _activity,
  bike_profile: _bike,
  run_profile: _run,
  run_pace_seconds_per_km: _pace,
  ...request
}: TourPlanCreateRequest): HikeCreateRequest {
  return request;
}

/**
 * A bike tour's or a run's time on the move, in whole minutes: a ride the
 * router's for its profile, a run its distance at the runner's pace and
 * nothing else (null without a pace, never the router's walking time). Null
 * where no way was planned.
 */
export function movingMinutesOf(
  activity: PlannedActivity,
  pace: number | null | undefined,
  { plan }: PlannedHike,
): number | null {
  if (plan.kind !== 'routed') return null;
  if (activity.activity === 'bike') return plan.duration_minutes;
  return pace == null ? null : runMinutesAtPace(plan.distance_m / 1000, pace);
}

/**
 * The proposal of a bike tour or a run, from a hike's proposal of the same
 * points timed by its own time: its activity, profile and pace, how its time
 * was reckoned, and nothing of a hike's limit, preferences or grades.
 */
export function tourProposalOf(
  base: HikeProposal,
  request: TourProposeRequest,
  activity: PlannedActivity,
): TourProposal {
  const bike = activity.activity === 'bike';
  const pace = bike ? null : (request.run_pace_seconds_per_km ?? null);
  let basis: TourProposal['duration_basis'] = null;
  if (base.duration_minutes !== null) basis = bike ? 'router' : 'pace';
  return {
    ...base,
    activity: activity.activity,
    bike_profile: bike ? activity.profile : null,
    run_profile: bike ? null : activity.profile,
    run_pace_seconds_per_km: pace,
    duration_basis: basis,
    max_hiking_difficulty: null,
    hiking_preferences: null,
    sac: null,
  } as TourProposal;
}

/**
 * The write of a bike tour or a run created from its points, as the
 * planner's save writes one: the way it keeps with its heights, its time on
 * the move, its profile (and a run's pace), and nothing of a hike's.
 */
export function tourCreateCommandOf(
  request: TourPlanCreateRequest,
  points: readonly HikeStop[],
  way: KeptWay,
  activity: PlannedActivity,
  minutes: number | null,
): TourCreateCommand {
  const bike = activity.activity === 'bike';
  return {
    name: request.name,
    description: request.description,
    tour_type: activity.activity,
    route_geometry: way.line,
    duration_seconds: way.line && minutes !== null ? minutes * 60 : null,
    max_hiking_difficulty: null,
    hiking_preferences: null,
    bike_profile: bike ? activity.profile : null,
    run_profile: bike ? null : activity.profile,
    run_pace_seconds_per_km: bike ? null : (request.run_pace_seconds_per_km ?? null),
    ...(request.planned_duration_minutes !== undefined
      ? { planned_duration_minutes: request.planned_duration_minutes }
      : {}),
    waypoints: hikeWaypointsOf(points),
  };
}

/** Why no way was planned for a ride or a run, in words that say what to do about it. */
const UNPLANNED: Readonly<Record<UnroutedHikePlan['why'], (named: string, position: number | null) => string>> = {
  no_valhalla: (named) => `TREK has no Valhalla router here to plan ${named} with its profile.`,
  router_unavailable: () => 'The router did not answer, for the way or for its heights; try again in a moment.',
  no_way: (named) => `No way for ${named} of this profile joins these points: try another profile or move the points.`,
  point_off_the_way: (_named, position) =>
    `Point ${position ?? ''} is further than ${TOUR_MAX_SNAP_M} m from any way: move it onto a way.`,
  too_long: (named) => `The way is too long to plan as ${named}: split it into shorter tours.`,
};

/** The refusal of a bike tour or a run whose way could not be planned: nothing is saved. */
export function unplannedTourMessage(
  { why, position }: Pick<UnroutedHikePlan, 'why' | 'position'>,
  activity: TourPlanActivity,
): string {
  const named = activity === 'bike' ? 'a bike tour' : 'a run';
  return `${UNPLANNED[why](named, position)} Nothing was saved.`;
}

/** Whether a way that was not planned refuses the save: every reason but a router that did not answer. */
export function refusesSave(route: HikeRouteOutcome): route is Extract<HikeRouteOutcome, { planned: false }> {
  return 'why' in route && route.why !== 'router_unavailable';
}

/** A request checked whole, its refinements included: an MCP tool reads only its schema's shape. */
export function checkedRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.error) throw badRequest(result.error.issues.map((issue) => issue.message).join('; '));
  return result.data as T;
}
