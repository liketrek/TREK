import type { RouteWayEdge, RouteWays } from '../bike/routeWays';

/**
 * MAP-03: whether the ways the router matched a line to really lie under it.
 * A planned route runs on its ways exactly; an imported track or a stretch
 * drawn by hand only roughly, and the matcher then picks the way it finds
 * nearest, which may be the wrong one. A grade is only shown for a way the
 * tour's own line keeps to, so an edge that strays from it counts as not
 * clearly matched. The line is laid flat around its own latitude, exact to
 * well under a metre over the span of a tour.
 */

/** How far a matched way may lie from the tour's line and still be its way: GPS noise, not a neighbouring path. */
export const MATCH_TOLERANCE_M = 25;

const EARTH_M = 6_371_000;
const RAD = Math.PI / 180;

type LatLng = readonly [number, number];
type Flat = readonly [number, number];

function flattener(line: readonly LatLng[]): (point: LatLng) => Flat {
  const meanLat = line.reduce((sum, [lat]) => sum + lat, 0) / line.length;
  const kx = Math.cos(meanLat * RAD) * EARTH_M * RAD;
  const ky = EARTH_M * RAD;
  return ([lat, lng]) => [lng * kx, lat * ky];
}

function distanceToSegment([px, py]: Flat, [ax, ay]: Flat, [bx, by]: Flat): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * A test whether a point lies within `toleranceM` of a line, answered from a
 * grid of the line's segments rather than by walking the whole line for each
 * point. Each segment is entered in the cells it passes, sampled at most
 * `toleranceM` apart; a cell is twice the tolerance wide, so a point near a
 * segment always finds it among its own cell and the eight around it.
 */
export function nearLine(line: readonly LatLng[], toleranceM: number): (point: LatLng) => boolean {
  if (line.length === 0) return () => false;
  const flat = flattener(line);
  const points = line.map(flat);
  const cell = toleranceM * 2;
  const keyOf = (x: number, y: number) => `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
  const grid = new Map<string, number[]>();
  // Segment i runs from point i - 1 to point i; a line of one point is a segment of no length.
  const segment = (i: number): [Flat, Flat] => [points[Math.max(0, i - 1)], points[i]];
  for (let i = points.length === 1 ? 0 : 1; i < points.length; i += 1) {
    const [[ax, ay], [bx, by]] = segment(i);
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / toleranceM));
    for (let s = 0; s <= steps; s += 1) {
      const key = keyOf(ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps);
      const entries = grid.get(key) ?? [];
      if (entries[entries.length - 1] !== i) entries.push(i);
      grid.set(key, entries);
    }
  }
  return (point) => {
    const p = flat(point);
    const cx = Math.floor(p[0] / cell);
    const cy = Math.floor(p[1] / cell);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const entries = grid.get(`${cx + dx}:${cy + dy}`) ?? [];
        if (entries.some((i) => distanceToSegment(p, ...segment(i)) <= toleranceM)) return true;
      }
    }
    return false;
  };
}

const midpoint = ([aLat, aLng]: LatLng, [bLat, bLng]: LatLng): LatLng => [(aLat + bLat) / 2, (aLng + bLng) / 2];

/** The matched edges that stray from the tour's own line somewhere along them: their way is not clearly the tour's. */
export function straysFrom(
  ways: RouteWays,
  route: readonly LatLng[],
  toleranceM = MATCH_TOLERANCE_M
): ReadonlySet<RouteWayEdge> {
  const near = nearLine(route, toleranceM);
  const strays = new Set<RouteWayEdge>();
  for (const edge of ways.edges) {
    for (let i = edge.from; i <= edge.to; i += 1) {
      const point = ways.line[i];
      const next = i < edge.to ? ways.line[i + 1] : undefined;
      if (!near(point) || (next && !near(midpoint(point, next)))) {
        strays.add(edge);
        break;
      }
    }
  }
  return strays;
}
