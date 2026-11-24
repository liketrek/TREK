import type { TourTypeKey } from '@trek/shared';

import { haversineKm } from '../../utils/geo';
import type { NamedWaypoint, RouteProfileKey } from '../Map/RouteCalculator';
import { dayRouteTargets, type DayRouteTarget } from '../Planner/dayRouteApps';

/**
 * The most stops a tour hands to a map app (#2812). Google Maps opens a
 * directions link with at most ten stops, a start, a destination and eight in
 * between, and drops the rest without a word. The other apps get the same
 * stops, so every app is handed the same route.
 */
export const TOUR_APP_MAX_STOPS = 10;

/**
 * How a map app follows each kind of tour. A ski, paddle or horse tour has no
 * mode in any of them: handed over, it would be routed by road, so it is not
 * offered and the GPX file stays the way to take it along.
 */
const APP_PROFILE: Partial<Record<TourTypeKey, RouteProfileKey>> = {
  hike: 'walking',
  walk: 'walking',
  food: 'walking',
  run: 'walking',
  bike: 'cycling',
};

/** The mode a map app follows this tour in, or null where no map app can. */
export function tourAppProfile(type: TourTypeKey): RouteProfileKey | null {
  return APP_PROFILE[type] ?? null;
}

const at = ([lat, lng]: readonly [number, number]) => ({ lat, lng });

/**
 * Stops along a tour's line, spread evenly over its length, so the app routes
 * the way the tour goes rather than the shortest way between its ends. The
 * line's own first and last points are always among them, which keeps a round
 * tour round. The start carries the tour's name, the one place an app shows it.
 */
export function tourRouteStops(
  line: ReadonlyArray<readonly [number, number]>,
  name: string,
  max = TOUR_APP_MAX_STOPS
): NamedWaypoint[] {
  return spreadIndices(line, max).map((i, n) => ({ ...at(line[i]), ...(n === 0 ? { name } : {}) }));
}

/** The indices of at most `max` points of the line, its ends and the points nearest to even steps along it. */
function spreadIndices(line: ReadonlyArray<readonly [number, number]>, max: number): number[] {
  if (line.length <= max) return line.map((_, i) => i);
  const along = [0];
  for (let i = 1; i < line.length; i++) along.push(along[i - 1] + haversineKm(at(line[i - 1]), at(line[i])));
  const total = along[along.length - 1];
  const last = line.length - 1;
  const picked = [0];
  let index = 0;
  for (let k = 1; k < max - 1; k++) {
    const target = (total * k) / (max - 1);
    while (index < last && along[index] < target) index++;
    const nearest = target - along[index - 1] < along[index] - target ? index - 1 : index;
    if (nearest > picked[picked.length - 1] && nearest < last) picked.push(nearest);
  }
  picked.push(last);
  return picked;
}

/**
 * The map apps a tour's route can be opened in, with the tour's mode. Only the
 * apps that route the whole way: one that only gets the start (Waze, a geo:
 * link) is what the tour's Navigation button already offers, and CoMaps routes
 * a start and an end only, so with stops between it would get unrouted pins.
 */
export function tourRouteTargets(
  type: TourTypeKey,
  line: ReadonlyArray<readonly [number, number]>,
  name: string
): DayRouteTarget[] {
  const profile = tourAppProfile(type);
  if (!profile) return [];
  const stops = tourRouteStops(line, name);
  return dayRouteTargets(stops, profile).filter(
    (target) => !target.firstStopOnly && !(target.id === 'comaps' && stops.length > 2)
  );
}
