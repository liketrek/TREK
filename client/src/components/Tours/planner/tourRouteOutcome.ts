import { TOUR_MAX_SNAP_M } from '@trek/shared';
import type { TourRouteResult } from './tourRouting';

/**
 * A point the router found no way for at all: it bound the point to a way
 * this far off (or put the whole run on one spot), which would draw a route
 * that is not where the tour was planned. `unreachable` is the point's place
 * along the tour, counted from 0.
 */
export interface TourRouteUnreachable {
  unreachable: number;
  snappedMeters: number;
}

/**
 * CW-12: two points of a city walk no way joins, on foot or by boat. `gap` is
 * the leg between them, by the place along the tour of the point it starts at.
 */
export interface TourRouteGap {
  gap: number;
}

/** Whether the router's answer is a route, rather than nothing, a point it could not reach or a leg it found no way for. */
export function isTourRoute(
  value: TourRouteResult | TourRouteUnreachable | TourRouteGap | null
): value is TourRouteResult {
  return !!value && !('unreachable' in value) && !('gap' in value);
}

/** How far the router may move a point onto its way before the point counts as unreachable for the tour's type. */
export const MAX_TOUR_SNAP_M = TOUR_MAX_SNAP_M;
