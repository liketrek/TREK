import type { PaddleGeometry } from '@trek/shared';

/**
 * The spot a waypoint goes to: the place itself, the middle of a way (a
 * slipway drawn as a ramp), or the middle of an area's outline.
 */
export function placeOf(geometry: PaddleGeometry): { lat: number; lng: number } | null {
  const line =
    geometry.type === 'Point'
      ? [geometry.coordinates]
      : geometry.type === 'LineString'
        ? geometry.coordinates
        : geometry.coordinates[0];
  if (!line?.length) return null;
  if (geometry.type === 'Polygon') {
    const ring = line.slice(0, -1);
    const lng = ring.reduce((sum, [x]) => sum + x, 0) / ring.length;
    const lat = ring.reduce((sum, [, y]) => sum + y, 0) / ring.length;
    return { lat, lng };
  }
  const [lng, lat] = line[Math.floor((line.length - 1) / 2)] ?? [];
  return lat === undefined || lng === undefined ? null : { lat, lng };
}
