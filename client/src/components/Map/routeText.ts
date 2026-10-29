import { useSettingsStore } from '../../store/settingsStore';
import type { DistanceUnit, RouteSegment, Waypoint } from '../../types';
import { formatDistance } from '../../utils/units';

/** The unit a route's texts are written in, which is why it is part of the route cache key. */
export function getDistanceUnit(): DistanceUnit {
  return useSettingsStore.getState().settings.distance_unit === 'imperial' ? 'imperial' : 'metric';
}

/** A routed distance as the connectors show it: metres below a kilometre, else the user's unit. */
export function formatRouteDistance(meters: number): string {
  const unit = getDistanceUnit();
  if (unit === 'metric' && meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return formatDistance(meters / 1000, unit);
}

/** A routed time in hours and minutes, the minutes rounded down. */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h} h ${m} min`;
  }
  return `${m} min`;
}

/**
 * The connector data for leg i of a routed chain, which runs from waypoint i to waypoint
 * i + 1: both ends, the midpoint the label sits on, and the walking time at 5 km/h next to
 * the time the engine measured. The same for every engine, so a day reads alike whichever
 * of them drew it.
 */
export function legSegment(
  leg: { distance: number; duration: number },
  i: number,
  waypoints: Waypoint[]
): RouteSegment {
  const from: [number, number] = [waypoints[i].lat, waypoints[i].lng];
  const to: [number, number] = [waypoints[i + 1].lat, waypoints[i + 1].lng];
  return {
    mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
    from,
    to,
    distance: leg.distance,
    duration: leg.duration,
    walkingText: formatDuration(leg.distance / (5000 / 3600)),
    drivingText: formatDuration(leg.duration),
    distanceText: formatRouteDistance(leg.distance),
  };
}
