import { create } from 'zustand';

/** A stretch of the tour on screen that runs along a via ferrata, as the rails show it. */
export interface TourFerrataCrossing {
  /** The ferrata's group id, so its stretches can be told apart and counted once. */
  id: string;
  name: string;
  /** The grade as the card says it ("K2", "K2 bis K4"), or null when none is tagged. */
  grade: string | null;
  /** Metres along the route, as the elevation profile counts them. */
  fromM: number;
  toM: number;
  /** The waypoint whose leg the stretch lies on, or null before the first one. */
  afterWaypoint: string | null;
}

/**
 * Where the tour on the planner map climbs a via ferrata. The map stage owns
 * the ferrata data and finds the stretches; the two rails beside it show the
 * warning and the band on the profile.
 */
/** The via ferrata a waypoint stands at the foot or the top of, for the mark on its number. */
export interface TourWaypointFerrata {
  name: string;
  grade: string | null;
}

export const useTourFerrataCrossingStore = create<{
  crossings: readonly TourFerrataCrossing[];
  /** By waypoint id, the ferratas whose ends the waypoints stand at. */
  waypoints: Readonly<Record<string, TourWaypointFerrata>>;
}>(() => ({ crossings: [], waypoints: {} }));

const NONE: readonly TourFerrataCrossing[] = [];
const NO_WAYPOINTS: Readonly<Record<string, TourWaypointFerrata>> = {};

function sameCrossings(a: readonly TourFerrataCrossing[], b: readonly TourFerrataCrossing[]): boolean {
  return (
    a.length === b.length &&
    a.every((crossing, i) => {
      const other = b[i];
      return (
        crossing.id === other.id &&
        crossing.afterWaypoint === other.afterWaypoint &&
        crossing.fromM === other.fromM &&
        crossing.toM === other.toM &&
        crossing.grade === other.grade
      );
    })
  );
}

function sameWaypoints(
  a: Readonly<Record<string, TourWaypointFerrata>>,
  b: Readonly<Record<string, TourWaypointFerrata>>
): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => b[key]?.name === a[key].name && b[key]?.grade === a[key].grade)
  );
}

export function publishTourFerrataCrossings(
  crossings: readonly TourFerrataCrossing[],
  waypoints: Readonly<Record<string, TourWaypointFerrata>> = NO_WAYPOINTS
): void {
  const state = useTourFerrataCrossingStore.getState();
  const next = crossings.length === 0 ? NONE : crossings;
  const nextWaypoints = Object.keys(waypoints).length === 0 ? NO_WAYPOINTS : waypoints;
  const crossingsSame = sameCrossings(state.crossings, next);
  const waypointsSame = sameWaypoints(state.waypoints, nextWaypoints);
  if (crossingsSame && waypointsSame) return;
  useTourFerrataCrossingStore.setState({
    crossings: crossingsSame ? state.crossings : next,
    waypoints: waypointsSame ? state.waypoints : nextWaypoints,
  });
}
