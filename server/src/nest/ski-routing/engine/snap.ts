import { metresBetween, projectOnSegment } from '../../../lib/geo/geo';
import { Kind, NodeFlag } from '../ski-graph.contract';
import type { EdgeCosts } from './profile';
import type { SkiNet } from './stitch';
import type { SkiDiscipline } from '@trek/shared';

/**
 * Where a clicked point joins the network (spec 7.4). Up to five places on
 * the runs and trails the profile may use, the best one per edge, each a
 * virtual point at a share of its edge's length; the search may start from
 * any of them, so a click between two parallel runs finds the one that goes
 * somewhere. A click right beside a lift means the lift: its bottom station
 * for the start of a leg, its top station for the end.
 */

/** How far a click may lie off the network and still join it, metres. */
export const SNAP_RADIUS_M: Record<SkiDiscipline, number> = {
  alpine: 150,
  snowboard: 150,
  cross_country: 100,
  touring: 300,
  snowshoe: 300,
  winter_hike: 300,
};

/** A click this close to a lift's line is taken for the lift. */
export const LIFT_SNAP_M = 40;
/** The most places a click joins the network at. */
export const MAX_SNAPS = 5;
/** Walking pace from the click to where it joins the network, m/s: what each place costs to reach. */
const SNAP_WALK_SPEED = 1;

export interface Snap {
  /** The edge the point lies on, or -1 where the click took a lift station (`node`). */
  edge: number;
  node: number;
  /** The share of the edge's length from its first node to the point. */
  t: number;
  lat: number;
  lng: number;
  ele: number;
  /** Metres from the click. */
  distance: number;
  /** Seconds the search starts (or ends) the point with. */
  startCost: number;
}

/** A coarse grid of the network's line pieces, for finding what lies near a click. */
interface SegmentGrid {
  cells: Map<number, number[]>;
}

const CELL_DEG = 0.002;
const cellKey = (y: number, x: number): number => (y + 50_000) * 200_000 + (x + 100_000);

const grids = new WeakMap<SkiNet, SegmentGrid>();

/** Each line piece of the network under every grid cell its box touches, stored as `point index`. */
function gridOf(net: SkiNet): SegmentGrid {
  const known = grids.get(net);
  if (known) return known;
  const cells = new Map<number, number[]>();
  for (let e = 0; e < net.edgeCount; e++) {
    for (let i = net.geomStart[e] as number; i < (net.geomStart[e + 1] as number) - 1; i++) {
      const y0 = Math.floor(Math.min(net.geomLat[i] as number, net.geomLat[i + 1] as number) / CELL_DEG);
      const y1 = Math.floor(Math.max(net.geomLat[i] as number, net.geomLat[i + 1] as number) / CELL_DEG);
      const x0 = Math.floor(Math.min(net.geomLng[i] as number, net.geomLng[i + 1] as number) / CELL_DEG);
      const x1 = Math.floor(Math.max(net.geomLng[i] as number, net.geomLng[i + 1] as number) / CELL_DEG);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const key = cellKey(y, x);
          const list = cells.get(key);
          if (list) list.push(i);
          else cells.set(key, [i]);
        }
      }
    }
  }
  const grid = { cells };
  grids.set(net, grid);
  return grid;
}

/** The edge a point of the pool belongs to, by binary search over the edges' starts. */
function edgeOfPoint(net: SkiNet, point: number): number {
  let lo = 0;
  let hi = net.edgeCount - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((net.geomStart[mid] as number) <= point) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

interface Near {
  edge: number;
  /** The first point of the nearest line piece, and the share along that piece. */
  point: number;
  share: number;
  distance: number;
}

/** The nearest spot of every edge with a line piece within `radius` of a point. */
function nearEdges(net: SkiNet, lat: number, lng: number, radius: number): Map<number, Near> {
  const grid = gridOf(net);
  const dLat = radius / 111_195;
  const dLng = radius / (111_195 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
  const best = new Map<number, Near>();
  const seen = new Set<number>();
  for (let y = Math.floor((lat - dLat) / CELL_DEG); y <= Math.floor((lat + dLat) / CELL_DEG); y++) {
    for (let x = Math.floor((lng - dLng) / CELL_DEG); x <= Math.floor((lng + dLng) / CELL_DEG); x++) {
      for (const point of grid.cells.get(cellKey(y, x)) ?? []) {
        if (seen.has(point)) continue;
        seen.add(point);
        const { t, distance } = projectOnSegment(
          lat,
          lng,
          net.geomLat[point] as number,
          net.geomLng[point] as number,
          net.geomLat[point + 1] as number,
          net.geomLng[point + 1] as number,
        );
        if (distance > radius) continue;
        const edge = edgeOfPoint(net, point);
        const known = best.get(edge);
        if (!known || distance < known.distance) best.set(edge, { edge, point, share: t, distance });
      }
    }
  }
  return best;
}

/** The share of an edge's length at a spot on one of its line pieces, with the spot's height. */
function spotOn(net: SkiNet, near: Near): { t: number; lat: number; lng: number; ele: number } {
  const first = net.geomStart[near.edge] as number;
  const last = (net.geomStart[near.edge + 1] as number) - 1;
  let total = 0;
  let before = 0;
  for (let i = first; i < last; i++) {
    const piece = metresBetween(
      net.geomLat[i] as number,
      net.geomLng[i] as number,
      net.geomLat[i + 1] as number,
      net.geomLng[i + 1] as number,
    );
    if (i < near.point) before += piece;
    if (i === near.point) before += piece * near.share;
    total += piece;
  }
  const a = near.point;
  const lerp = (values: Float64Array) =>
    (values[a] as number) + ((values[a + 1] as number) - (values[a] as number)) * near.share;
  return { t: total > 0 ? before / total : 0, lat: lerp(net.geomLat), lng: lerp(net.geomLng), ele: lerp(net.geomEle) };
}

const LIFT_KINDS: ReadonlySet<number> = new Set([Kind.LIFT, Kind.RAIL]);
const RIDE_KINDS: ReadonlySet<number> = new Set([Kind.LIFT, Kind.RAIL, Kind.BOARD, Kind.ALIGHT]);

/**
 * The ground nodes of a lift's stations: every one (`grounds`), and those the
 * profile may board at (`boards`) and leave at (`alights`).
 */
function stationsOf(net: SkiNet, costs: EdgeCosts, liftEdge: number) {
  const chain = new Set<number>([net.edgeA[liftEdge] as number, net.edgeB[liftEdge] as number]);
  const queue = [...chain];
  const grounds = new Set<number>();
  const boards: number[] = [];
  const alights: number[] = [];
  while (queue.length > 0) {
    const node = queue.pop() as number;
    for (let i = net.adjStart[node] as number; i < (net.adjStart[node + 1] as number); i++) {
      const e = net.adjEdge[i] as number;
      const kind = net.edgeKind[e] as number;
      const usable = Number.isFinite(costs.costFwd[e]);
      if (kind === Kind.BOARD && net.edgeB[e] === node) {
        grounds.add(net.edgeA[e] as number);
        if (usable) boards.push(net.edgeA[e] as number);
      }
      if (kind === Kind.ALIGHT && net.edgeA[e] === node) {
        grounds.add(net.edgeB[e] as number);
        if (usable) alights.push(net.edgeB[e] as number);
      }
      if (!LIFT_KINDS.has(kind)) continue;
      for (const next of [net.edgeA[e] as number, net.edgeB[e] as number]) {
        if (!chain.has(next) && (net.nodeFlags[next] as number) & NodeFlag.LIFT_INTERNAL) {
          chain.add(next);
          queue.push(next);
        }
      }
    }
  }
  return { grounds: [...grounds], boards, alights };
}

function nodeSnap(net: SkiNet, node: number, lat: number, lng: number): Snap {
  return {
    edge: -1,
    node,
    t: 0,
    lat: net.nodeLat[node] as number,
    lng: net.nodeLng[node] as number,
    ele: net.nodeEle[node] as number,
    distance: metresBetween(lat, lng, net.nodeLat[node] as number, net.nodeLng[node] as number),
    startCost: 0,
  };
}

/**
 * The station a click beside a lift means: the station it lies at, when it
 * lies at one; else the lift's lowest boarding for the start of a leg and its
 * highest exit for the end. Null when the profile may neither board nor leave.
 */
function stationSnap(
  net: SkiNet,
  costs: EdgeCosts,
  liftEdge: number,
  role: 'from' | 'to',
  lat: number,
  lng: number,
): Snap | null {
  const { grounds: all, boards, alights } = stationsOf(net, costs, liftEdge);
  const atStation = all
    .map((ground) => nodeSnap(net, ground, lat, lng))
    .filter((snap) => snap.distance <= LIFT_SNAP_M)
    .sort((a, b) => a.distance - b.distance)[0];
  if (atStation) return atStation;
  const grounds = role === 'from' ? boards : alights;
  if (grounds.length === 0) return null;
  // A station without a height counts as neither the lowest nor the highest.
  const height = (ground: number) => {
    const ele = net.nodeEle[ground] as number;
    if (!Number.isNaN(ele)) return ele;
    return role === 'from' ? Infinity : -Infinity;
  };
  let node = grounds[0] as number;
  for (const ground of grounds) {
    const better = role === 'from' ? height(ground) < height(node) : height(ground) > height(node);
    if (better) node = ground;
  }
  return nodeSnap(net, node, lat, lng);
}

/**
 * Where a clicked point joins the network for a profile: a lift station when
 * the click lies beside a lift and nearer to it than to anything skiable,
 * else up to five places on edges the profile may use, nearest first.
 */
export function snapPoint(
  net: SkiNet,
  costs: EdgeCosts,
  lat: number,
  lng: number,
  radius: number,
  role: 'from' | 'to',
): Snap[] {
  const near = nearEdges(net, lat, lng, Math.max(radius, LIFT_SNAP_M));
  const usable: Near[] = [];
  let lift: Near | null = null;
  for (const spot of near.values()) {
    const kind = net.edgeKind[spot.edge] as number;
    if (LIFT_KINDS.has(kind)) {
      if (spot.distance <= LIFT_SNAP_M && (!lift || spot.distance < lift.distance)) lift = spot;
      continue;
    }
    if (RIDE_KINDS.has(kind) || spot.distance > radius) continue;
    if (Number.isFinite(costs.costFwd[spot.edge]) || Number.isFinite(costs.costBack[spot.edge])) usable.push(spot);
  }
  usable.sort((a, b) => a.distance - b.distance);
  if (lift && (usable.length === 0 || lift.distance < (usable[0] as Near).distance)) {
    const station = stationSnap(net, costs, lift.edge, role, lat, lng);
    if (station) return [station];
  }
  return usable.slice(0, MAX_SNAPS).map((spot) => {
    const at = spotOn(net, spot);
    return { edge: spot.edge, node: -1, ...at, distance: spot.distance, startCost: spot.distance / SNAP_WALK_SPEED };
  });
}

/** The nearest edge a profile may use within `radius`, for telling how far off the network a point lies. */
export function nearestUsable(
  net: SkiNet,
  costs: EdgeCosts,
  lat: number,
  lng: number,
  radius: number,
): { edge: number; distance: number } | null {
  let best: { edge: number; distance: number } | null = null;
  for (const spot of nearEdges(net, lat, lng, radius).values()) {
    if (RIDE_KINDS.has(net.edgeKind[spot.edge] as number)) continue;
    if (!Number.isFinite(costs.costFwd[spot.edge]) && !Number.isFinite(costs.costBack[spot.edge])) continue;
    if (!best || spot.distance < best.distance) best = { edge: spot.edge, distance: spot.distance };
  }
  return best;
}
