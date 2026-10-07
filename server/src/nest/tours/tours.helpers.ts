/**
 * Pure geometry-metrics helpers for the Tours domain, separate from GPX parsing.
 * PlacesService prepares and persists imported places; these helpers derive
 * metrics from the resulting [[lat,lng,ele?]] geometry.
 */

/** One decoded `route_geometry` point: `[lat, lng]` or `[lat, lng, ele]`. */
export type GeometryPoint = [number, number] | [number, number, number];

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in km. */
function haversineKm(a: GeometryPoint, b: GeometryPoint): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

export interface TourMetrics {
  /** Sum of segment haversine distances, in km. */
  distanceKm: number;
  /** Sum of positive elevation deltas, in metres. Null when the track carries no elevation. */
  elevationGainM: number | null;
  /** Sum of negative elevation deltas (as a positive number), in metres. Null when no elevation. */
  elevationLossM: number | null;
  /** Whether every point in the geometry carried a 3rd (elevation) value. */
  hasElevation: boolean;
}

/**
 * Derives distance/elevation from a parsed `route_geometry` array. Never throws —
 * A track with fewer than 2 points, or with missing/mixed
 * elevation, still yields a usable (if partial) result rather than blocking import.
 */
export function computeTourMetrics(points: GeometryPoint[]): TourMetrics {
  if (points.length < 2) {
    return { distanceKm: 0, elevationGainM: null, elevationLossM: null, hasElevation: false };
  }
  const hasElevation = points.every((p) => p.length === 3 && Number.isFinite(p[2]));

  let distanceKm = 0;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    distanceKm += haversineKm(points[i - 1], points[i]);
    if (hasElevation) {
      const delta = (points[i][2] as number) - (points[i - 1][2] as number);
      if (delta > 0) gain += delta;
      else loss += -delta;
    }
  }

  return {
    distanceKm,
    elevationGainM: hasElevation ? gain : null,
    elevationLossM: hasElevation ? loss : null,
    hasElevation,
  };
}

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
