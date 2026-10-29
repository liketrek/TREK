import { useSettingsStore } from '../../store/settingsStore';
import type { DistanceUnit } from '../../types';
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
