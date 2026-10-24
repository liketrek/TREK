/**
 * Pure geometry-metrics helpers for the Tours domain, separate from GPX parsing.
 * PlacesService prepares and persists imported places; these helpers derive
 * metrics from the resulting [[lat,lng,ele?]] geometry.
 */
import type { GeometryPoint } from '@trek/shared';

import { createHash } from 'node:crypto';

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

/** A short stable hash of a text, in hex: the paddle checklist's source basis and revisions take it. */
export function shortHash(text: string, length = 16): string {
  return createHash('sha256').update(text).digest('hex').slice(0, length);
}

/** A short stable fingerprint of one part of a trail. */
function fingerprint(value: unknown): string {
  return shortHash(JSON.stringify(value));
}

/** Coordinates to five places (a metre) and heights to the metre, so a re-export with other float noise reads the same. */
function normalizedRoute(points: readonly GeometryPoint[]): number[][] {
  return points.map(([lat, lng, ele]) =>
    ele == null ? [+lat.toFixed(5), +lng.toFixed(5)] : [+lat.toFixed(5), +lng.toFixed(5), Math.round(ele)],
  );
}

/** What the source delivered, part by part: `name.description.route`. */
export function contentHashOf(name: string, description: string | null, route: readonly GeometryPoint[]): string {
  return [fingerprint(name.trim()), fingerprint((description ?? '').trim()), fingerprint(normalizedRoute(route))].join(
    '.',
  );
}

/** The tour as saved here: `name.route`, to tell later whether it was edited. */
export function localHashOf(name: string, route: readonly GeometryPoint[]): string {
  return [fingerprint(name.trim()), fingerprint(normalizedRoute(route))].join('.');
}

const CONTENT_PARTS = ['name', 'description', 'route'] as const;

export function changedParts(before: string, now: string): Array<(typeof CONTENT_PARTS)[number]> {
  const a = before.split('.');
  const b = now.split('.');
  return CONTENT_PARTS.filter((_, i) => a[i] !== b[i]);
}

/**
 * WAN-02: the parts of a content fingerprint a trail's record alone proves
 * changed. The record carries the name and the description, never the line,
 * so a changed route is never claimed here.
 */
export function recordChangedParts(
  contentHash: string,
  name: string,
  description: string | null,
): Array<'name' | 'description'> {
  const [nameHash, descriptionHash] = contentHash.split('.');
  return [
    ...(fingerprint(name.trim()) === nameHash ? [] : (['name'] as const)),
    ...(fingerprint((description ?? '').trim()) === descriptionHash ? [] : (['description'] as const)),
  ];
}

/**
 * At most `most` points of a line, evenly spread along it with its ends kept:
 * a preview or a search gets the whole shape without the thousands of points.
 */
export function thinnedLine<P>(line: readonly P[], most: number): P[] {
  if (line.length <= most) return [...line];
  const step = (line.length - 1) / (most - 1);
  return Array.from({ length: most }, (_, index) => Math.min(line.length - 1, Math.round(index * step))).flatMap(
    (index) => {
      const point = line[index];
      return point === undefined ? [] : [point];
    },
  );
}
