import { distanceWindow, isClosedLoop, isRoundTarget, spotToward, type PlannableTourType } from '@trek/shared';
import type { DistanceUnit } from '../../../types';
import { convertDistance } from '../../../utils/units';
import type { CostingOptions } from '../../Map/valhallaRoute';
import { OTHER_WAY_KEYS, type LegVariant } from './legVariants';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import { closeLoop } from './tourRouteActions';

/**
 * RTE-03: round hikes of about a wished length out of a start point, as a
 * pure model: which points a round can start from, what one search asks, when
 * a round fits the wish, and the plan a chosen round becomes. Nothing here
 * asks a router or changes the tour.
 */

type Spot = { lat: number; lng: number };

/** The rounds one search offers at most, lettered and coloured like the other ways of a section. */
export const ROUND_KEYS = OTHER_WAY_KEYS;
export type RoundKey = (typeof ROUND_KEYS)[number];

/** One round found: its line and figures as a way of the planner, and the spots its loop is steered through. */
export type RoundCandidate = LegVariant & {
  key: RoundKey;
  /** Where the line passes the spots it was steered through: the shaping points the round is planned by. */
  via: Spot[];
};

/** One search as it was asked: from which point, how far, and under which of the hike's rules. */
export interface RoundRequest {
  startId: string;
  start: Spot;
  targetM: number;
  costing: CostingOptions;
  /** What the search depends on; another key is another search. */
  key: string;
}

/**
 * A length as typed in the traveller's unit, in metres; a comma reads as a
 * decimal point. Null while the text is no number.
 */
export function metersTyped(text: string, unit: DistanceUnit): number | null {
  const trimmed = text.trim();
  const value = Number(trimmed.replace(',', '.'));
  if (!trimmed || !Number.isFinite(value)) return null;
  return (value / convertDistance(1, unit)) * 1000;
}

/** A length in metres as the field shows it: in the traveller's unit, to one decimal. */
export function typedLength(meters: number, unit: DistanceUnit): string {
  return String(Math.round(convertDistance(meters / 1000, unit) * 10) / 10);
}

/**
 * The points a round can start from: the stops of the tour. A shaping point
 * is no place to start from, and the way back of a loop is its start again.
 */
export function roundStarts(points: readonly TourPlannerWaypoint[]): TourPlannerWaypoint[] {
  const route = isClosedLoop(points) ? points.slice(0, -1) : points;
  return route.filter((point) => !point.shaping);
}

/** Whether a round can be searched from the point `id` of a tour of this type. */
export function canStartRound(
  points: readonly TourPlannerWaypoint[],
  id: string,
  tourType: PlannableTourType
): boolean {
  return tourType === 'hike' && roundStarts(points).some((point) => point.id === id);
}

const spot = (point: Spot) => `${point.lat.toFixed(7)},${point.lng.toFixed(7)}`;

/**
 * The search from the point `startId` as the tour stands now, or null when the
 * point cannot start one. Its key holds the start's spot, the length and the
 * rules, so a moved start or a changed limit makes rounds found before it
 * rounds of another search.
 */
export function roundRequestOf(
  points: readonly TourPlannerWaypoint[],
  startId: string,
  tourType: PlannableTourType,
  costing: CostingOptions,
  targetM: number
): RoundRequest | null {
  if (!canStartRound(points, startId, tourType) || !isRoundTarget(targetM)) return null;
  const start = points.find((point) => point.id === startId);
  if (!start) return null;
  return {
    startId,
    start: { lat: start.lat, lng: start.lng },
    targetM,
    costing,
    key: `${startId}@${spot(start)}#${Math.round(targetM)}#${JSON.stringify(costing)}`,
  };
}

/**
 * The plan a chosen round becomes: the start as it was (its name and its
 * place stay), the spots the loop is steered through as shaping points, and
 * the way back onto the start. Nothing else of the tour before it remains.
 */
export function roundPlanOf(
  start: TourPlannerWaypoint,
  via: readonly Spot[],
  newId: () => string
): TourPlannerWaypoint[] {
  const { fixedLeg: _leg, lock: _lock, carryNext: _carry, auto: _auto, shaping: _shaping, ...own } = start;
  const steering = via.map(({ lat, lng }): TourPlannerWaypoint => ({
    id: newId(),
    lat,
    lng,
    role: 'via',
    shaping: true,
  }));
  return closeLoop([{ ...own, role: 'start' }, ...steering], newId());
}

/**
 * Where the rounds of a search can reach: a square around the start as wide
 * as a round of the longest fitting length strays from it at most. The map
 * frames it while the rounds are looked for, so each shows up in view.
 */
export function searchAreaOf(start: Spot, targetM: number): [number, number][] {
  // A loop strays from its start by half its length at the very most; a round of paths, by about a quarter.
  const reach = distanceWindow(targetM).maxM * 0.3;
  return [0, 90, 180, 270].map((bearing) => {
    const corner = spotToward(start, bearing, reach);
    return [corner.lat, corner.lng];
  });
}
