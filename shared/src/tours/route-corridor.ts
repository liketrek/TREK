/**
 * Where a point lies against a route: how far it is from the line and how far
 * along the line its nearest spot is, both in metres. A tour spans a few tens
 * of kilometres at most, so the line is laid flat around its own latitude,
 * which is exact to well under a metre at that span.
 *
 * Shared by the planner's place picker (PR1-10) and the search for places
 * along a route (PR1-11A), so both measure the corridor the same way.
 */

const EARTH_M = 6_371_000;
const RAD = Math.PI / 180;

type Coordinate = readonly [number, number, ...number[]] | readonly number[];

export interface RouteNearness {
  /** Metres from the point to the nearest spot of the line. */
  distanceM: number;
  /** Metres along the line to that spot. */
  alongM: number;
}

function flatten(line: readonly Coordinate[]) {
  const meanLat = line.reduce((sum, p) => sum + Number(p[0]), 0) / Math.max(line.length, 1);
  const kx = Math.cos(meanLat * RAD) * EARTH_M * RAD;
  const ky = EARTH_M * RAD;
  return (lat: number, lng: number): [number, number] => [lng * kx, lat * ky];
}

/** The line laid flat once, so many points can be measured against it without laying it again. */
function flatLine(line: readonly Coordinate[]) {
  const flat = flatten(line);
  return { flat, points: line.map((p) => flat(Number(p[0]), Number(p[1]))) };
}

function nearestOnFlat(points: readonly [number, number][], px: number, py: number): RouteNearness {
  let best: RouteNearness = { distanceM: Number.POSITIVE_INFINITY, alongM: 0 };
  let walked = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1] as [number, number];
    const [bx, by] = points[i] as [number, number];
    const dx = bx - ax;
    const dy = by - ay;
    const length2 = dx * dx + dy * dy;
    const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2));
    const distanceM = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (distanceM < best.distanceM) best = { distanceM, alongM: walked + t * Math.sqrt(length2) };
    walked += Math.sqrt(length2);
  }
  return best;
}

/** How near the point is to a line of `[lat, lng]` points; null for a line of fewer than two. */
export function nearnessToLine(point: { lat: number; lng: number }, line: readonly Coordinate[]): RouteNearness | null {
  if (line.length < 2) return null;
  const { flat, points } = flatLine(line);
  const [px, py] = flat(point.lat, point.lng);
  return nearestOnFlat(points, px, py);
}

/**
 * How far each of `points` lies from the line, in metres and in their order;
 * null for a line of fewer than two. The line is laid flat once for all of
 * them, so a recorded track of thousands of points is measured against a plan
 * of thousands (ACT-02) without laying the plan again for every point.
 */
export function distancesToLine(points: readonly Coordinate[], line: readonly Coordinate[]): number[] | null {
  if (line.length < 2) return null;
  const { flat, points: flatPoints } = flatLine(line);
  return points.map((p) => {
    const [px, py] = flat(Number(p[0]), Number(p[1]));
    return nearestOnFlat(flatPoints, px, py).distanceM;
  });
}
