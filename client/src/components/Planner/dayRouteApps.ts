import {
  generateCoMapsUrl,
  generateGoogleMapsUrl,
  type NamedWaypoint,
  type RouteProfileKey,
} from '../Map/RouteCalculator';
import { showsAppleMaps, showsGeoUri, type NavigationAppId } from './placeNavigation';

/**
 * The map apps a day's route can be handed to, behind the plan's one Maps
 * button. Same stops as every other export (dayExportStops), so the app shows
 * the day the plan shows.
 *
 * Not every app takes a whole route. Google Maps, Apple Maps and CoMaps do (each
 * in its own way, see the builders); Waze and the generic geo: link navigate to
 * one place only, so they lead to the first stop and say so rather than quietly
 * dropping the rest of the day.
 */
export interface DayRouteTarget {
  id: NavigationAppId;
  /** Product name, never translated; the generic entry carries labelKey instead. */
  label: string;
  labelKey?: string;
  url: string;
  /** True when the app only gets the first stop, not the whole route. */
  firstStopOnly?: boolean;
}

/** Apple Maps' directions modes. Cycling exists there; anything else drives. */
function appleMode(profile: RouteProfileKey): string {
  if (profile === 'walking') return 'walking';
  if (profile === 'cycling') return 'cycling';
  return 'driving';
}

const point = (p: NamedWaypoint) => `${p.lat},${p.lng}`;
const label = (p: NamedWaypoint) => encodeURIComponent(p.name?.trim() || point(p));

/**
 * Apple Maps for a day: one stop opens as a pin with its name, more go as
 * directions with the stops between as waypoints (Apple's unified Maps URLs,
 * which iOS, macOS and the web version all read).
 */
export function generateAppleMapsUrl(places: NamedWaypoint[], profile: RouteProfileKey = 'driving'): string | null {
  const valid = places.filter((p) => p.lat != null && p.lng != null);
  if (valid.length === 0) return null;
  if (valid.length === 1) return `https://maps.apple.com/?ll=${point(valid[0])}&q=${label(valid[0])}`;
  const [first, ...rest] = valid;
  const last = rest[rest.length - 1];
  const between = rest
    .slice(0, -1)
    .map((p) => `&waypoint=${point(p)}`)
    .join('');
  return `https://maps.apple.com/directions?source=${point(first)}&destination=${point(last)}${between}&mode=${appleMode(profile)}`;
}

/** Waze navigates to one place; the day's first stop is where the drive starts. */
export function generateWazeUrl(places: NamedWaypoint[]): string | null {
  const first = places.find((p) => p.lat != null && p.lng != null);
  return first ? `https://waze.com/ul?ll=${point(first)}&navigate=yes` : null;
}

/** The generic Android link, handed to whichever map app is installed; one place too. */
export function generateGeoUrl(places: NamedWaypoint[]): string | null {
  const first = places.find((p) => p.lat != null && p.lng != null);
  return first ? `geo:${point(first)}?q=${point(first)}(${label(first)})` : null;
}

/** Every app the day can be opened in on this device, in the order they are offered. */
export function dayRouteTargets(stops: NamedWaypoint[], profile: RouteProfileKey): DayRouteTarget[] {
  const out: DayRouteTarget[] = [];
  const push = (target: Omit<DayRouteTarget, 'url'>, url: string | null) => {
    if (url) out.push({ ...target, url });
  };
  push({ id: 'google', label: 'Google Maps' }, generateGoogleMapsUrl(stops, profile));
  if (showsAppleMaps()) push({ id: 'apple', label: 'Apple Maps' }, generateAppleMapsUrl(stops, profile));
  push({ id: 'comaps', label: 'CoMaps' }, generateCoMapsUrl(stops, profile));
  const located = stops.filter((p) => p.lat != null && p.lng != null).length;
  push({ id: 'waze', label: 'Waze', firstStopOnly: located > 1 }, generateWazeUrl(stops));
  if (showsGeoUri()) {
    push(
      { id: 'geo', label: 'geo:', labelKey: 'inspector.otherMapApp', firstStopOnly: located > 1 },
      generateGeoUrl(stops)
    );
  }
  return out;
}
