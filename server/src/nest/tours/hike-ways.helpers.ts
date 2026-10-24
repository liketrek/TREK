import { hikePointsOf } from './hike-plan.helpers';
import {
  HIKE_MAX_WAYPOINTS,
  HIKE_WAY_KEYS,
  hikingPreferencesOf,
  TOURS_MAX_HIKING_DIFFICULTY,
  type HikeLegWayRequest,
  type HikePlanPoint,
  type HikeRoundProposeRequest,
  type HikeStop,
  type HikeWayKey,
  type HikeWayMiss,
  type HikeWayMissing,
  type HikeWayPoints,
  type HikingPreferences,
  type RoadLine,
  type WayPin,
} from '@trek/shared';

/**
 * The pure halves of the round hikes and the ways of a leg the assistant
 * proposes (HikeWaysService): which way a call asks for, the points a found
 * way is proposed and created through, and the keys a search is kept under.
 */

type Spot = { lat: number; lng: number };

/** Points nearer than this many decimal places of a degree (about a metre) are one point for a search kept. */
const KEY_DECIMALS = 5;

const keySpot = ({ lat, lng }: Spot) => [Number(lat.toFixed(KEY_DECIMALS)), Number(lng.toFixed(KEY_DECIMALS))];

/** The position of a way's letter among the ways found: a is the first. */
export function wayIndexOf(key: HikeWayKey | undefined): number {
  return Math.max(0, HIKE_WAY_KEYS.indexOf(key ?? 'a'));
}

/** The letter of the way at `index`. */
export function wayKeyAt(index: number): HikeWayKey {
  return HIKE_WAY_KEYS[index] ?? 'a';
}

/** The answer for a way asked for that was not found: why none, or that fewer were. */
export function wayMissing(key: HikeWayKey | undefined, found: number, why: HikeWayMiss | null): HikeWayMissing {
  return { found: false, way: key ?? 'a', ways_found: found, why: why ?? 'none_found' };
}

/** The hike's limit and preferences as a search is asked under, the defaults filled in. */
export function rulesOf(request: { max_hiking_difficulty?: number; hiking_preferences?: HikingPreferences | null }): {
  limit: number;
  preferences: HikingPreferences | null;
} {
  return {
    limit: request.max_hiking_difficulty ?? TOURS_MAX_HIKING_DIFFICULTY,
    preferences: hikingPreferencesOf(request.hiking_preferences),
  };
}

/** What one round search depends on: who asked in which trip, the start to about a metre, the length and the rules. */
export function roundSearchKey(userId: number, tripId: number, request: HikeRoundProposeRequest): string {
  const { limit, preferences } = rulesOf(request);
  return JSON.stringify([
    'round',
    userId,
    tripId,
    keySpot(request.start),
    Math.round(request.distance_km * 1000),
    limit,
    preferences,
  ]);
}

/** What the ways of one leg depend on: who asked in which trip, the hike's points, the leg and the rules. */
export function legWaysKey(userId: number, tripId: number, request: HikeLegWayRequest): string {
  const { limit, preferences } = rulesOf(request);
  const points = hikePointsOf(request.waypoints, request.round_trip).map(keySpot);
  return JSON.stringify(['leg', userId, tripId, points, request.leg, limit, preferences]);
}

/** The points a round is proposed and created through: its start, then the spots its loop is steered through. */
export function roundPointsOf(start: HikePlanPoint, via: readonly Spot[]): HikeWayPoints {
  return { waypoints: [start, ...via.map(({ lat, lng }) => ({ lat, lng }))], round_trip: true };
}

/** The two ends of leg `leg` (counted from 1) of a hike through these points, its way back included. */
export function legEndsOf(
  waypoints: readonly HikeStop[],
  roundTrip: boolean | undefined,
  leg: number,
): { from: Spot; to: Spot } | null {
  const points = hikePointsOf(waypoints, roundTrip);
  const from = points[leg - 1];
  const to = points[leg];
  return from && to ? { from: { lat: from.lat, lng: from.lng }, to: { lat: to.lat, lng: to.lng } } : null;
}

/**
 * The hike's points with `pins` set on leg `leg`, right after the point it
 * starts at; on a round trip the pins of the way back go last, before the
 * start the way back returns to. Null where the pins would take the hike past
 * the points one hike is asked through.
 */
export function pinnedPointsOf(
  waypoints: readonly HikeStop[],
  leg: number,
  pins: readonly WayPin[],
): HikeStop[] | null {
  if (waypoints.length + pins.length > HIKE_MAX_WAYPOINTS) return null;
  const at = Math.min(leg, waypoints.length);
  return [...waypoints.slice(0, at), ...pins.map(({ lat, lng }) => ({ lat, lng })), ...waypoints.slice(at)];
}

/** A router's line as a way to compare. */
export function roadOf(coordinates: Array<[number, number]>, distance = 0, duration = 0): RoadLine {
  return { coordinates, distance, duration };
}

/** A signed share as whole percent: 0.084 is 8. */
export function percentOf(share: number): number {
  return Math.round(share * 100);
}
