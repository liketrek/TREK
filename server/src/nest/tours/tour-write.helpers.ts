/**
 * The write half of ToursService that needs no database: the fields a create
 * or an update stores, the checks a write passes before its transaction, and
 * the keys its points keep.
 */
import { TOUR_HIKING_PREFERENCES, TOUR_SKI_ROUTE } from '../../db/json-columns';
import type { TourUpdate } from '../../db/repositories/Tours.repository';
import { encodeJson } from '../../utils/json-column';
import { badRequest } from '../common/domain-error';
import { computeTourMetrics } from './tours.helpers';
import type { TourCreateCommand } from './tours.service';
import {
  hikingPreferencesOf,
  maxTourMinutesFor,
  plannedTimeLimitMessage,
  plannedTourDurationMinutesSchema,
  skiOptionsForDiscipline,
  tourStageCountOf,
  tourStageIssues,
  tourWebsiteSchema,
  type TourWaypoint,
} from '@trek/shared';

import { randomUUID } from 'node:crypto';

/** MF-08: a save's hiking preferences as stored: a hike's switched-on ones as JSON, else NULL. */
function hikingFields(input: TourCreateCommand): string | null {
  const preferences = input.tour_type === 'hike' ? hikingPreferencesOf(input.hiking_preferences) : null;
  return preferences ? encodeJson(TOUR_HIKING_PREFERENCES, preferences) : null;
}

/**
 * SKI-02: a save's ski discipline and technique as stored. Only a ski tour
 * keeps them, the technique only for cross-country; another type takes them off.
 */
function skiFields(input: TourCreateCommand): Pick<TourUpdate, 'ski_discipline' | 'ski_technique'> {
  if (input.tour_type !== 'ski') return { ski_discipline: null, ski_technique: null };
  const discipline = input.ski_discipline ?? null;
  return {
    ski_discipline: discipline,
    ski_technique: discipline === 'cross_country' ? (input.ski_technique ?? null) : null,
  };
}

/**
 * A save's piste router options as stored, with the build its legs ran on:
 * only a ski tour keeps them, and only the options its discipline reads.
 * Without options (an older client, a type without them) none are kept.
 */
function skiRouteField(input: TourCreateCommand): string | null {
  if (input.tour_type !== 'ski' || !input.ski_discipline || !input.ski_options) return null;
  const options = skiOptionsForDiscipline(input.ski_discipline, input.ski_options);
  const planned = input.ski_planned_legs ? { planned_legs: [...input.ski_planned_legs] } : {};
  return encodeJson(TOUR_SKI_ROUTE, { options, build: input.ski_route_build ?? null, ...planned });
}

/**
 * RUN-01: a save's run profile and pace as stored. Only a run keeps them;
 * another type takes them off. A run without a pace keeps none: its time stays
 * unknown rather than reckoned at a pace nobody chose.
 */
function runFields(input: TourCreateCommand): Pick<TourUpdate, 'run_profile' | 'run_pace_seconds_per_km'> {
  if (input.tour_type !== 'run') return { run_profile: null, run_pace_seconds_per_km: null };
  return { run_profile: input.run_profile ?? null, run_pace_seconds_per_km: input.run_pace_seconds_per_km ?? null };
}

/**
 * CW-03: every point with its key, kept from the write where it came with one,
 * so the visits of a city walk's stations outlast a reorder or a new point. A
 * key sent twice stays with its first point; a later one gets a fresh key, so
 * checking one station off never marks another.
 */
export function keyedWaypoints(waypoints: TourWaypoint[]): Array<TourWaypoint & { key: string }> {
  const taken = new Set<string>();
  return waypoints.map((point) => {
    const key = point.key && !taken.has(point.key) ? point.key : randomUUID();
    taken.add(key);
    return { ...point, key };
  });
}

/**
 * The route a create or an update writes: metrics derived from the geometry, duration stored in minutes.
 * Without a line (CW-11) distance, heights and walking time stay unknown until the planner plans the way.
 */
export function tourRouteFields(input: TourCreateCommand): TourUpdate {
  const metrics = input.route_geometry ? computeTourMetrics(input.route_geometry) : null;
  // A paddle tour drawn here has its heights read off the banks at the points set, not
  // off the water: its ascent and descent stay unknown rather than wrong.
  const heightsKnown = input.tour_type !== 'kayak';
  return {
    tour_type: input.tour_type,
    distance: metrics?.distanceKm ?? null,
    elevation_gain: heightsKnown ? (metrics?.elevationGainM ?? null) : null,
    elevation_loss: heightsKnown ? (metrics?.elevationLossM ?? null) : null,
    duration: input.duration_seconds == null ? null : Math.round(input.duration_seconds / 60),
    ...(input.planned_duration_minutes !== undefined
      ? { planned_duration_minutes: input.planned_duration_minutes }
      : {}),
    ...(input.break_additional_minutes !== undefined
      ? { break_additional_minutes: input.break_additional_minutes }
      : {}),
    match_confidence: 1,
    max_hiking_difficulty: input.max_hiking_difficulty,
    bike_profile: input.tour_type === 'bike' ? (input.bike_profile ?? null) : null,
    ...runFields(input),
    ...skiFields(input),
    ski_options: skiRouteField(input),
    boat_type: input.boat_type ?? null,
    water_context: input.water_context ?? null,
    paddle_speed_kmh: input.paddle_speed_kmh ?? null,
    portage_speed_kmh: input.portage_speed_kmh ?? null,
    paddle_lake_style: input.paddle_lake_style ?? null,
    // MF-08: only a hike keeps preferences, and only those switched on; none is NULL.
    hiking_preferences: hikingFields(input),
  };
}

function validateInformationalMetadata(input: TourCreateCommand): void {
  if (input.description != null && input.description.length > 2000) {
    throw badRequest('description must be 2000 characters or less');
  }
  if (input.website != null && !tourWebsiteSchema.safeParse(input.website).success) {
    throw badRequest('website must be a valid HTTPS URL without credentials');
  }
}

function validatePlannedTimes(input: TourCreateCommand): void {
  for (const value of [input.planned_duration_minutes, input.break_additional_minutes]) {
    if (value !== undefined && !plannedTourDurationMinutesSchema.safeParse(value).success) {
      throw badRequest('planned Tour times must be whole minutes from 0 to 1440');
    }
  }
  // MDT-01: a multi-day tour is held to a day a stage, a day tour to one day.
  const stages = tourStageCountOf(input.waypoints);
  if (
    input.planned_duration_minutes == null &&
    input.duration_seconds != null &&
    Math.round(input.duration_seconds / 60) + (input.break_additional_minutes ?? 0) > maxTourMinutesFor(stages)
  ) {
    throw badRequest(plannedTimeLimitMessage(stages));
  }
}

/**
 * MDT-01: the stage ends sit at stops between start and end, as the contract
 * holds a request to; checked here too for a write that did not come through
 * it (an assistant's city walk), so no surface can store one out of place.
 */
function validateStageEnds(input: TourCreateCommand): void {
  const [issue] = tourStageIssues(input.waypoints);
  if (issue) throw badRequest(issue.message);
}

/** Every check a write passes before its transaction: its texts, its stage ends and its planned times. */
export function checkTourCommand(input: TourCreateCommand): void {
  validateInformationalMetadata(input);
  validateStageEnds(input);
  validatePlannedTimes(input);
}

/** Where a tour without a line starts (CW-11): at its first point. */
export function firstPointOf(points: readonly { lat: number; lng: number }[]): [number, number] | undefined {
  const point = points[0];
  return point ? [point.lat, point.lng] : undefined;
}

/** The file name a file import keeps: the name as uploaded, without a path, cut to what the column shows. */
export function importFileName(name: string | undefined): string | null {
  const base = name?.split('/').pop()?.trim();
  return base ? base.slice(0, 255) : null;
}
