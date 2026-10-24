import type { PaddleFeature, PaddleGeometry } from './paddle-obstacles.schema';

/**
 * PAD-05A/05B: how an obstacle stands to a paddle route. Only a line that
 * crosses it, or passes within ON_ROUTE_M, makes it an obstacle on the route.
 * Within NEAR_M it is near, and stays uncertain: a weir on the next arm of a
 * river is close without being in the way. Farther off it is not related.
 */

/** Closer than this, in metres, the route meets the object. */
export const ON_ROUTE_M = 25;
/** Closer than this the object is near the route, its relation to it uncertain. */
export const NEAR_M = 150;

export type PaddleRelation = 'on_route' | 'near';

export interface RelatedObstacle {
  feature: PaddleFeature;
  relation: PaddleRelation;
  /** The shortest distance between the route and the object, in metres. */
  distanceM: number;
  /** How far along the route the closest point lies, in metres from its start. */
  alongM: number;
}

type LatLng = readonly [number, number];

const METRES_PER_DEG = 111_195;

interface Local {
  x: number;
  y: number;
}

/** A flat view around a latitude, good to a few metres over the length of a day tour. */
function projector(lat0: number): (lat: number, lng: number) => Local {
  const cos = Math.cos((lat0 * Math.PI) / 180);
  return (lat, lng) => ({ x: lng * METRES_PER_DEG * cos, y: lat * METRES_PER_DEG });
}

function closestOnSegment(p: Local, a: Local, b: Local): { distance: number; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return { distance: Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy), t };
}

function crosses(a: Local, b: Local, c: Local, d: Local): number | null {
  const denominator = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (denominator === 0) return null;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denominator;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/**
 * The rings of an object: a point is one ring of one point, a line one open
 * ring, an area its outline and holes. Read as plain numbers, since the client
 * compiles this without strict mode, where the schema's pairs are "maybe two".
 */
function ringsOf(geometry: PaddleGeometry): Array<Array<readonly [number, number]>> {
  const pair = (position: readonly unknown[]): readonly [number, number] => [Number(position[0]), Number(position[1])];
  if (geometry.type === 'Point') return [[pair(geometry.coordinates), pair(geometry.coordinates)]];
  if (geometry.type === 'LineString') return [geometry.coordinates.map(pair)];
  return geometry.coordinates.map((ring) => ring.map(pair));
}

function segmentsOf(rings: ReadonlyArray<readonly Local[]>): Array<[Local, Local]> {
  const segments: Array<[Local, Local]> = [];
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1];
      const b = ring[i];
      if (a && b) segments.push([a, b]);
    }
  }
  return segments;
}

function inRing(p: Local, ring: readonly Local[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i] as Local;
    const b = ring[j] as Local;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Inside an area: within its outline and in none of its holes. */
function inArea(p: Local, rings: readonly (readonly Local[])[]): boolean {
  const [outer, ...holes] = rings;
  return !!outer && inRing(p, outer) && !holes.some((hole) => inRing(p, hole));
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function boundsOf(points: readonly Local[], margin: number): Bounds {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const p of points) {
    bounds.minX = Math.min(bounds.minX, p.x - margin);
    bounds.minY = Math.min(bounds.minY, p.y - margin);
    bounds.maxX = Math.max(bounds.maxX, p.x + margin);
    bounds.maxY = Math.max(bounds.maxY, p.y + margin);
  }
  return bounds;
}

function overlaps(a: Bounds, b: Bounds): boolean {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}

/**
 * The closest the route comes to one object: the distance and how far along
 * the route that is. A route that crosses the outline, or runs inside an
 * area, meets it at distance 0, at the first place it does.
 */
function closestApproach(
  path: readonly Local[],
  along: readonly number[],
  rings: readonly (readonly Local[])[],
  isArea: boolean,
): { distance: number; alongM: number } {
  const outline = segmentsOf(rings);
  const reach = boundsOf(rings.flat(), NEAR_M);
  let best = { distance: Number.POSITIVE_INFINITY, alongM: 0 };
  const consider = (distance: number, alongM: number) => {
    if (distance < best.distance || (distance === best.distance && alongM < best.alongM)) best = { distance, alongM };
  };
  path.forEach((p, i) => {
    if (isArea && inArea(p, rings)) consider(0, along[i] ?? 0);
  });
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Local;
    const b = path[i] as Local;
    if (!overlaps(boundsOf([a, b], 0), reach)) continue;
    const start = along[i - 1] ?? 0;
    const length = (along[i] ?? start) - start;
    for (const [c, d] of outline) {
      const hit = crosses(a, b, c, d);
      if (hit !== null) {
        consider(0, start + hit * length);
        continue;
      }
      for (const p of [c, d]) {
        const near = closestOnSegment(p, a, b);
        consider(near.distance, start + near.t * length);
      }
      consider(closestOnSegment(a, c, d).distance, start);
      consider(closestOnSegment(b, c, d).distance, start + length);
    }
  }
  return best;
}

/** The flat view of a route and the distance along it at each point, as the relations measure it. */
function measured(route: readonly LatLng[]): { path: Local[]; along: number[] } {
  const project = projector(route[0]?.[0] ?? 0);
  const path = route.map(([lat, lng]) => project(lat, lng));
  const along: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Local;
    const b = path[i] as Local;
    along.push((along[i - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return { path, along };
}

/**
 * The length of a route as the relations measure along it, in metres: what
 * their `alongM` is a part of, so a view that draws the route at another
 * scale places an obstacle by its share of this length.
 */
export function measuredRouteLengthM(route: readonly LatLng[]): number {
  const { along } = measured(route);
  return along[along.length - 1] ?? 0;
}

/**
 * The obstacles on or near a route, in the order the route reaches them. The
 * route is `[lat, lng]` pairs as the planner draws it; an empty or one-point
 * route relates nothing. The distance is measured both ways, from the route
 * to the object's outline and from the object to the route, so a long weir
 * passed in its middle and a route inside an area both count.
 */
export function relateObstaclesToRoute(
  route: readonly LatLng[],
  features: readonly PaddleFeature[],
): RelatedObstacle[] {
  if (route.length < 2) return [];
  const project = projector(route[0]?.[0] ?? 0);
  const { path, along } = measured(route);
  const routeBounds = boundsOf(path, NEAR_M);
  const related: RelatedObstacle[] = [];
  for (const feature of features) {
    const rings = ringsOf(feature.geometry).map((ring) => ring.map(([lng, lat]) => project(lat, lng)));
    if (!overlaps(boundsOf(rings.flat(), 0), routeBounds)) continue;
    const best = closestApproach(path, along, rings, feature.geometry.type === 'Polygon');
    if (best.distance > NEAR_M) continue;
    related.push({
      feature,
      relation: best.distance <= ON_ROUTE_M ? 'on_route' : 'near',
      distanceM: Math.round(best.distance),
      alongM: Math.round(best.alongM),
    });
  }
  return related.sort((a, b) => a.alongM - b.alongM);
}

/** Two visits whose closest points lie closer than this along the route are one passage. */
export const PASSAGE_GAP_M = 50;
/** The most passages one object keeps: an out-and-back tour passes twice, a winding river a few times more. */
export const MAX_PASSAGES = 4;

/** One time the route comes within reach of an object: the segment, the share along it, and how close it comes. */
export interface RoutePassage {
  segment: number;
  t: number;
  distanceM: number;
}

/** The closest one route segment comes to an object's outline, and where along the segment that is. */
function segmentApproach(
  a: Local,
  b: Local,
  outline: ReadonlyArray<[Local, Local]>,
  rings: readonly (readonly Local[])[],
  isArea: boolean,
): { distance: number; t: number } {
  let best = { distance: Number.POSITIVE_INFINITY, t: 0 };
  const consider = (distance: number, t: number) => {
    if (distance < best.distance || (distance === best.distance && t < best.t)) best = { distance, t };
  };
  if (isArea && inArea(a, rings)) consider(0, 0);
  if (isArea && inArea(b, rings)) consider(0, 1);
  for (const [c, d] of outline) {
    const hit = crosses(a, b, c, d);
    if (hit !== null) {
      consider(0, hit);
      continue;
    }
    for (const p of [c, d]) {
      const near = closestOnSegment(p, a, b);
      consider(near.distance, near.t);
    }
    consider(closestOnSegment(a, c, d).distance, 0);
    consider(closestOnSegment(b, c, d).distance, 1);
  }
  return best;
}

/**
 * Every separate time the route comes within `reachM` of an object, in route
 * order: a run of segments in reach is one visit, anchored where it comes
 * closest (the earlier point on a tie), and two visits whose anchors lie
 * closer than PASSAGE_GAP_M along the route are one. Two runs whose anchors
 * lie further apart stay two passages even when the route left the reach
 * only briefly between them; that binds a decision to more of the route, so
 * it errs towards asking for a look again. An out-and-back tour passes an
 * obstacle twice, so a change to its way back is not missed. At most
 * MAX_PASSAGES are kept, the closest ones.
 */
export function routePassages(route: readonly LatLng[], geometry: PaddleGeometry, reachM: number): RoutePassage[] {
  if (route.length < 2) return [];
  const project = projector(route[0]?.[0] ?? 0);
  const { path, along } = measured(route);
  const rings = ringsOf(geometry).map((ring) => ring.map(([lng, lat]) => project(lat, lng)));
  const outline = segmentsOf(rings);
  const reach = boundsOf(rings.flat(), reachM);
  const isArea = geometry.type === 'Polygon';
  const visits: Array<RoutePassage & { atM: number }> = [];
  let current: (RoutePassage & { atM: number }) | null = null;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Local;
    const b = path[i] as Local;
    const approach = overlaps(boundsOf([a, b], 0), reach)
      ? segmentApproach(a, b, outline, rings, isArea)
      : { distance: Number.POSITIVE_INFINITY, t: 0 };
    if (approach.distance > reachM) {
      current = null;
      continue;
    }
    const startM = along[i - 1] ?? 0;
    const atM = startM + approach.t * ((along[i] ?? startM) - startM);
    const visit = { segment: i - 1, t: approach.t, distanceM: approach.distance, atM };
    if (current === null) {
      current = visit;
      visits.push(current);
    } else if (approach.distance < current.distanceM) {
      Object.assign(current, visit);
    }
  }
  // Two visits whose closest points lie within PASSAGE_GAP_M along the route are one passage.
  const merged: typeof visits = [];
  for (const visit of visits) {
    const last = merged[merged.length - 1];
    if (last && visit.atM - last.atM < PASSAGE_GAP_M) {
      if (visit.distanceM < last.distanceM) Object.assign(last, visit);
    } else {
      merged.push({ ...visit });
    }
  }
  return merged
    .sort((x, y) => x.distanceM - y.distanceM || x.segment - y.segment)
    .slice(0, MAX_PASSAGES)
    .sort((x, y) => x.segment - y.segment || x.t - y.t)
    .map(({ segment, t, distanceM }) => ({ segment, t, distanceM }));
}

/** The shortest distance from a point (`[lat, lng]`) to the route, in metres; Infinity for a route of fewer than two points. */
export function distanceToRouteM(route: readonly LatLng[], point: readonly [number, number]): number {
  if (route.length < 2) return Number.POSITIVE_INFINITY;
  const project = projector(route[0]?.[0] ?? 0);
  const { path } = measured(route);
  const p = project(Number(point[0]), Number(point[1]));
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < path.length; i++) {
    best = Math.min(best, closestOnSegment(p, path[i - 1] as Local, path[i] as Local).distance);
  }
  return best;
}
