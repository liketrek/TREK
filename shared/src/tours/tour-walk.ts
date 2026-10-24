import type { TourFixedLeg } from './tours.schema';
import { walkFerryMinutesOf } from './walk-ferry';

/** Closer than this, in degrees, two points of a tour stand on the same spot (about a centimetre). */
const SAME_SPOT_DEG = 1e-7;

interface Spot {
  lat: number;
  lng: number;
}

function sameSpot(a: Spot, b: Spot): boolean {
  return Math.abs(a.lat - b.lat) < SAME_SPOT_DEG && Math.abs(a.lng - b.lng) < SAME_SPOT_DEG;
}

/**
 * PR1-01: whether a tour ends where it starts. Read from the points
 * themselves, so a saved loop opens as a loop again without a flag of its
 * own; a tour of two points on one spot is no loop, there is nothing to
 * return from.
 */
export function isClosedLoop(points: readonly Spot[]): boolean {
  const first = points[0];
  const last = points[points.length - 1];
  return points.length >= 3 && !!first && !!last && sameSpot(first, last);
}

/**
 * CW-02, CW-03: the stations of a city walk in their order. A shaping point
 * only steers the route, and the way back of a loop is its start again, so
 * neither is a station: nothing to stay at, check off or count twice.
 */
export function walkStationsOf<T extends Spot & { shaping?: boolean | null }>(points: readonly T[]): T[] {
  const route = isClosedLoop(points) ? points.slice(0, -1) : points;
  return route.filter((point) => !point.shaping);
}

/**
 * What a list says of a city walk's stations: how many, their stays as far as
 * entered, and how many have none; with the minutes of its ferry legs by boat
 * where it takes any (CW-12).
 */
interface WalkStationFacts {
  station_count: number | null;
  station_stay_minutes: number | null;
  station_stays_unknown: number | null;
  walk_ferry_minutes?: number | null;
}

/**
 * CW-02, CW-03: a city walk's stations as a list counts them, from its points:
 * a shaping point and the way back of a loop are no station, a stay nobody
 * entered is counted apart and never as nothing. Any other type has none. The
 * server answers a list with it, and the client works out the same for a walk
 * saved offline until the write replays.
 */
export function walkStationFacts(
  tourType: string,
  points: readonly (Spot & {
    shaping?: boolean | null;
    stay_minutes?: number | null;
    fixed_leg?: TourFixedLeg | null;
  })[],
): WalkStationFacts {
  if (tourType !== 'walk') return { station_count: null, station_stay_minutes: null, station_stays_unknown: null };
  const stations = walkStationsOf(points);
  const ferryMinutes = walkFerryMinutesOf(points);
  return {
    station_count: stations.length,
    station_stay_minutes: stations.reduce((sum, station) => sum + (station.stay_minutes ?? 0), 0),
    station_stays_unknown: stations.filter((station) => station.stay_minutes == null).length,
    ...(ferryMinutes !== undefined ? { walk_ferry_minutes: ferryMinutes } : {}),
  };
}
