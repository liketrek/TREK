import { Access, EdgeKind } from '../water-graph';
import { BuildState, PointGrid } from './build-state';
import type { CollectedBarrier, CollectedWater, CollectedWay } from './collect';

export type CoordOf = (nodeId: number) => [number, number] | null;

/** How fast the water runs, km/h, by the kind of line; still water has none. */
const CURRENT_KMH: Record<string, number> = {
  river: 1.5,
  stream: 2,
  canoe_pass: 1.5,
  flowline: 0.5,
};

/** A dangling end this close to other water is joined to it as water, farther up to GAP_M as a marked gap. */
const CONNECT_M = 30;
const GAP_M = 150;

interface LinePoint {
  ref: number;
  lat: number;
  lng: number;
  barrier: CollectedBarrier | null;
}

function closedTo(value: string | undefined): boolean {
  return value === 'no' || value === 'private';
}

/** A stretch of this whitewater grade or harder is no touring water; the router leaves it out. */
const CLOSED_GRADE = 3;

/** The whitewater grade a line gives (`whitewater:section_grade`, 0 to 6), 0 when none. */
function gradeOf(tags: Readonly<Record<string, string>>): number {
  const grade = Number.parseInt(tags['whitewater:section_grade'] ?? '', 10);
  return Number.isFinite(grade) && grade > 0 ? Math.min(6, grade) : 0;
}

/** Who may paddle a line: the most specific boat tag decides (canoe, kayak, then boat, then access). */
function accessOf(tags: Readonly<Record<string, string>>): number {
  const rule = tags.canoe ?? tags.kayak ?? tags.boat ?? tags.access;
  if (closedTo(rule)) return Access.closed;
  if (gradeOf(tags) >= CLOSED_GRADE) return Access.closed;
  const tunnel = tags.tunnel === 'yes' || tags.tunnel === 'culvert';
  if (tunnel && !['yes', 'designated', 'permissive'].includes(tags.canoe ?? tags.boat ?? '')) return Access.closed;
  if (rule === 'discouraged' || tags.intermittent === 'yes') return Access.discouraged;
  return Access.open;
}

interface Segment {
  aLat: number;
  aLng: number;
  bLat: number;
  bLng: number;
  barrier: CollectedBarrier;
  refs: Set<number>;
}

/** Where two segments cross, as the share along the first, or null. */
function crossing(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
  s: Pick<Segment, 'aLat' | 'aLng' | 'bLat' | 'bLng'>,
): number | null {
  const rLat = bLat - aLat;
  const rLng = bLng - aLng;
  const qLat = s.bLat - s.aLat;
  const qLng = s.bLng - s.aLng;
  const denom = rLat * qLng - rLng * qLat;
  if (denom === 0) return null;
  const t = ((s.aLat - aLat) * qLng - (s.aLng - aLng) * qLat) / denom;
  const u = ((s.aLat - aLat) * rLng - (s.aLng - aLng) * rLat) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/** A crossing this close to an end of a river segment is on that end's node, in shares of the segment. */
const AT_VERTEX = 1e-9;

/** Barrier lines on a coarse grid, for the river segments that might cross them. */
function barrierSegments(water: CollectedWater, coordOf: CoordOf): Map<string, Segment[]> {
  const grid = new Map<string, Segment[]>();
  for (const way of water.barrierWays) {
    const refs = new Set(way.refs);
    for (let i = 1; i < way.refs.length; i++) {
      const a = coordOf(way.refs[i - 1] as number);
      const b = coordOf(way.refs[i] as number);
      if (!a || !b) continue;
      const segment: Segment = { aLat: a[0], aLng: a[1], bLat: b[0], bLng: b[1], barrier: way.barrier, refs };
      for (const key of cellsOf(a[0], a[1], b[0], b[1])) {
        const cell = grid.get(key);
        if (cell) cell.push(segment);
        else grid.set(key, [segment]);
      }
    }
  }
  return grid;
}

const SEG_CELL = 0.005;

function cellsOf(aLat: number, aLng: number, bLat: number, bLng: number): string[] {
  const keys: string[] = [];
  for (let r = Math.floor(Math.min(aLat, bLat) / SEG_CELL); r <= Math.floor(Math.max(aLat, bLat) / SEG_CELL); r++) {
    for (let c = Math.floor(Math.min(aLng, bLng) / SEG_CELL); c <= Math.floor(Math.max(aLng, bLng) / SEG_CELL); c++) {
      keys.push(`${r}:${c}`);
    }
  }
  return keys;
}

/**
 * A centre line's points, with a barrier marked where a weir or dam stands on
 * it: on a shared node, or where a barrier line crosses it without one, which
 * is cut in as a point of its own. Missing nodes (outside the extract) drop out.
 */
function linePoints(
  way: CollectedWay,
  barrierAt: ReadonlyMap<number, CollectedBarrier>,
  coordOf: CoordOf,
  barriers: Map<string, Segment[]>,
  nextSynthetic: () => number,
): LinePoint[] {
  const points: LinePoint[] = [];
  for (const ref of way.refs) {
    const at = coordOf(ref);
    if (!at) continue;
    const previous = points[points.length - 1];
    if (previous && previous.lat === at[0] && previous.lng === at[1]) continue;
    // A barrier line crossing exactly through a node of the river bars that node rather than a point beside it.
    let onVertex: CollectedBarrier | null = null;
    if (previous) {
      const crossings: Array<{ t: number; barrier: CollectedBarrier }> = [];
      for (const key of new Set(cellsOf(previous.lat, previous.lng, at[0], at[1]))) {
        for (const segment of barriers.get(key) ?? []) {
          if (segment.refs.has(previous.ref) || segment.refs.has(ref)) continue;
          const t = crossing(previous.lat, previous.lng, at[0], at[1], segment);
          if (t !== null && !crossings.some((seen) => seen.barrier === segment.barrier))
            crossings.push({ t, barrier: segment.barrier });
        }
      }
      crossings.sort((x, y) => x.t - y.t);
      for (const { t, barrier } of crossings) {
        if (t <= AT_VERTEX) previous.barrier ??= barrier;
        else if (t >= 1 - AT_VERTEX) onVertex ??= barrier;
        else
          points.push({
            ref: nextSynthetic(),
            lat: previous.lat + (at[0] - previous.lat) * t,
            lng: previous.lng + (at[1] - previous.lng) * t,
            barrier,
          });
      }
    }
    points.push({ ref, lat: at[0], lng: at[1], barrier: barrierAt.get(ref) ?? onVertex });
  }
  return points;
}

/**
 * The rivers and canals as edges between the points where they meet, end or
 * are barred. A barrier is no node at all but one node per side, so nothing
 * paddles through it; the portage builder joins the sides later.
 */
export function buildLines(water: CollectedWater, coordOf: CoordOf, state: BuildState): void {
  const barrierGrid = barrierSegments(water, coordOf);
  const barrierAt = new Map<number, CollectedBarrier>();
  for (const barrierWay of water.barrierWays) for (const ref of barrierWay.refs) barrierAt.set(ref, barrierWay.barrier);
  for (const [ref, barrier] of water.barrierNodes) barrierAt.set(ref, barrier);
  let synthetic = 0;
  const nextSynthetic = () => --synthetic;
  const lines = water.centrelines.map((way) => ({
    way,
    points: linePoints(way, barrierAt, coordOf, barrierGrid, nextSynthetic),
  }));
  const uses = new Map<number, number>();
  for (const { points } of lines) for (const point of points) uses.set(point.ref, (uses.get(point.ref) ?? 0) + 1);

  const nodeOfRef = new Map<number, number>();
  const sites = new Map<number, number>();
  const nodeFor = (point: LinePoint): number => {
    if (point.barrier) {
      // Each line meeting a barrier gets its own side node.
      const side = state.addNode(point.lat, point.lng, true);
      let site = sites.get(point.ref);
      if (site === undefined) {
        site = state.barriers.length;
        state.barriers.push({
          lat: point.lat,
          lng: point.lng,
          name: point.barrier.name,
          ref: point.barrier.osmRef,
          sides: [],
        });
        sites.set(point.ref, site);
      }
      state.barriers[site]?.sides.push(side);
      return side;
    }
    const known = nodeOfRef.get(point.ref);
    if (known !== undefined) return known;
    const node = state.addNode(point.lat, point.lng);
    nodeOfRef.set(point.ref, node);
    return node;
  };

  for (const { way, points } of lines) {
    if (points.length < 2) continue;
    const tags = way.tags;
    const current = CURRENT_KMH[tags.waterway ?? ''] ?? 0;
    const attrs = {
      kind: tags.lock === 'yes' ? EdgeKind.lock : tags.waterway === 'canoe_pass' ? EdgeKind.pass : EdgeKind.water,
      flow: current > 0 ? (1 as const) : (0 as const),
      current,
      access: accessOf(tags),
      oneway: tags['oneway:canoe'] === 'yes' || tags['oneway:boat'] === 'yes' ? (1 as const) : (0 as const),
      grade: gradeOf(tags),
      // A lock goes by its own name (Schleuse Diemitz), not the waterway it lies on.
      name: (tags.lock === 'yes' ? tags.lock_name : undefined) ?? tags.name ?? tags.lock_name ?? null,
      ref: `way/${way.id}`,
      source: 0,
    };
    let start = 0;
    let startNode = nodeFor(points[0] as LinePoint);
    for (let i = 1; i < points.length; i++) {
      const point = points[i] as LinePoint;
      const isLast = i === points.length - 1;
      if (!isLast && !point.barrier && (uses.get(point.ref) ?? 0) < 2) continue;
      const endNode = nodeFor(point);
      state.addEdge({
        a: startNode,
        b: endNode,
        line: points.slice(start, i + 1).map((p) => [p.lat, p.lng]),
        ...attrs,
      });
      // Past a barrier the line goes on from a node of its own, the other side.
      startNode = point.barrier && !isLast ? nodeFor(point) : endNode;
      start = i;
    }
  }
}

/**
 * Joins line ends that stop short of other water, as OSM often leaves a side
 * arm a few metres off the river: to the nearest point of another line within
 * CONNECT_M as water, within GAP_M as a gap the route marks. Barrier sides are
 * left alone (a barrier is meant to stop the line), and so are ends that open
 * into a lake, which the lake joins.
 */
export function joinDanglingEnds(state: BuildState): void {
  const incidence = state.incidence();
  const grid = new PointGrid<{ edge: number; point: number }>();
  state.edges.forEach((edge, index) => {
    if (edge.dead) return;
    edge.line.forEach(([lat, lng], point) => grid.add(lat, lng, { edge: index, point }));
  });
  const requests: Array<{ node: number; edge: number; point: number; distance: number }> = [];
  state.nodes.forEach((node, index) => {
    const at = incidence[index] as number[];
    if (node.barrier || node.lake >= 0 || at.length !== 1) return;
    const own = new Set(at);
    const target = grid.near(node.lat, node.lng, GAP_M).find(({ item }) => !own.has(item.edge));
    if (target)
      requests.push({ node: index, edge: target.item.edge, point: target.item.point, distance: target.distance });
  });
  // Cut every target edge once per point, from its far end back, so earlier point indices still hold.
  const byEdge = new Map<number, number[]>();
  for (const request of requests) byEdge.set(request.edge, [...(byEdge.get(request.edge) ?? []), request.point]);
  const nodeAt = new Map<string, number>();
  for (const [edge, points] of byEdge) {
    for (const point of [...new Set(points)].sort((x, y) => y - x))
      nodeAt.set(`${edge}:${point}`, state.splitAt(edge, point));
  }
  const joined = new Set<string>();
  for (const request of requests) {
    const target = nodeAt.get(`${request.edge}:${request.point}`) as number;
    if (target === request.node) continue;
    const key = request.node < target ? `${request.node}-${target}` : `${target}-${request.node}`;
    if (joined.has(key)) continue;
    joined.add(key);
    state.addLink(request.node, target, request.distance <= CONNECT_M ? EdgeKind.connector : EdgeKind.gap);
  }
}
