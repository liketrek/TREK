/**
 * P2A-03: which leg of a tour a spot on its drawn route belongs to. Every
 * waypoint is placed along the line (searching on from where the one before
 * lay, so a loop or a route that passes a point twice keeps its order), then
 * the spot; the leg is the one whose two points enclose it.
 */

/** Where a spot falls along a line, as the distance from its start in the line's own degrees (flat earth is plenty for ordering). */
function alongLine(
  line: readonly [number, number][],
  lat: number,
  lng: number,
  fromIndex: number
): { at: number; index: number } {
  const cos = Math.cos((lat * Math.PI) / 180);
  let travelled = 0;
  let best = { at: 0, index: fromIndex, distance: Infinity };
  for (let i = 0; i < line.length - 1; i += 1) {
    const [aLat, aLng] = line[i];
    const [bLat, bLng] = line[i + 1];
    const dx = (bLng - aLng) * cos;
    const dy = bLat - aLat;
    const length = Math.hypot(dx, dy);
    if (i >= fromIndex) {
      const t =
        length === 0 ? 0 : Math.max(0, Math.min(1, ((lng - aLng) * cos * dx + (lat - aLat) * dy) / (length * length)));
      const distance = Math.hypot(aLng * cos + dx * t - lng * cos, aLat + dy * t - lat);
      if (distance < best.distance) best = { at: travelled + length * t, index: i, distance };
    }
    travelled += length;
  }
  return { at: best.at, index: best.index };
}

/** The id of the waypoint that starts the leg holding the spot, or null when the route has no such leg. */
export function legStartAt(
  points: ReadonlyArray<{ id: string; lat: number; lng: number }>,
  line: readonly [number, number][] | null,
  lat: number,
  lng: number
): string | null {
  if (!line || line.length < 2 || points.length < 2) return null;
  const positions: number[] = [];
  let from = 0;
  for (const point of points) {
    const placed = alongLine(line, point.lat, point.lng, from);
    positions.push(placed.at);
    from = placed.index;
  }
  const spot = alongLine(line, lat, lng, 0).at;
  for (let i = 0; i < points.length - 1; i += 1) {
    if (spot >= positions[i] && spot <= positions[i + 1]) return points[i].id;
  }
  return null;
}
