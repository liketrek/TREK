/** A coordinate pair that is a place on Earth: finite, and within latitude and longitude. */
export function isValidGeoPoint(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * A place's stored route geometry as `[lat, lng]` points, the way the GPX
 * importer wrote it; elevation, where kept, is dropped. Points that are not
 * numbers are skipped, and a text that is not JSON, or that leaves fewer than
 * two points, is no line: null, so one broken geometry never fails a map.
 */
export function parseRouteGeometry(text: string): [number, number][] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const points: [number, number][] = [];
  for (const entry of parsed) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const lat = Number(entry[0]);
    const lng = Number(entry[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push([lat, lng]);
  }
  return points.length < 2 ? null : points;
}
