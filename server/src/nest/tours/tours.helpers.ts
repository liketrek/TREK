/**
 * Pure geometry-metrics helpers for the Tours domain, separate from GPX parsing.
 * PlacesService prepares and persists imported places; these helpers derive
 * metrics from the resulting [[lat,lng,ele?]] geometry.
 */
import type { GeometryPoint } from '@trek/shared';

// The metrics are shared with the client, which computes them for a tour saved offline.
export { computeTourMetrics, type GeometryPoint, type TourMetrics } from '@trek/shared';

/**
 * Parses a `places.route_geometry` JSON string into typed points. Returns an empty
 * array for null/malformed input rather than throwing — a place created by the
 * GPX importer without geometry (shouldn't happen for routes/tracks, but never
 * trust stored JSON blindly) simply yields a zero-metric tour.
 */
export function parseRouteGeometry(routeGeometry: string | null | undefined): GeometryPoint[] {
  if (!routeGeometry) return [];
  try {
    const parsed = JSON.parse(routeGeometry);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is GeometryPoint =>
        Array.isArray(p) && (p.length === 2 || p.length === 3) && p.every((n: unknown) => typeof n === 'number'),
    );
  } catch {
    return [];
  }
}

/** Confidence threshold: below this, the tour imports with a caution flag. */
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
