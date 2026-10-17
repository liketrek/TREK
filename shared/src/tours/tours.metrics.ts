import { haversineMetres } from '../geo/haversine';

/** One decoded `route_geometry` point: `[lat, lng]` or `[lat, lng, ele]`. */
export type GeometryPoint = [number, number] | [number, number, number];

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
 * Derives distance/elevation from a parsed `route_geometry` array. Never throws:
 * a track with fewer than 2 points, or with missing/mixed elevation, still
 * yields a usable (if partial) result rather than blocking import.
 *
 * The server stores these numbers on every tour; the client computes the same
 * ones for a tour saved offline, so both read them from here.
 */
export function computeTourMetrics(points: readonly GeometryPoint[]): TourMetrics {
  const [first, ...rest] = points;
  if (!first || rest.length === 0) {
    return { distanceKm: 0, elevationGainM: null, elevationLossM: null, hasElevation: false };
  }
  const hasElevation = points.every((p) => p.length === 3 && Number.isFinite(p[2]));

  let distanceKm = 0;
  let gain = 0;
  let loss = 0;
  let prev = first;
  for (const point of rest) {
    distanceKm += haversineMetres(prev[0], prev[1], point[0], point[1]) / 1000;
    if (hasElevation) {
      const delta = (point[2] as number) - (prev[2] as number);
      if (delta > 0) gain += delta;
      else loss += -delta;
    }
    prev = point;
  }

  return {
    distanceKm,
    elevationGainM: hasElevation ? gain : null,
    elevationLossM: hasElevation ? loss : null,
    hasElevation,
  };
}
