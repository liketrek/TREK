import { projectOnSegment } from '../engine/geo';
import { Access, EdgeKind, PortageSource } from '../water-graph';
import { type BarrierSite, type BuildEdge, type BuildState, PointGrid } from './build-state';
import type { CollectedWater } from './collect';
import type { CoordOf } from './lines';

/** A mapped portage way counts for a barrier when it starts and ends this close to the water on two of its sides. */
const PORTAGE_REACH_M = 80;
/** How far around a barrier its mapped portage ways are looked for. */
const PORTAGE_SEARCH_M = 250;
/** Without a mapped way the carry starts and ends this far up and down the water from the barrier... */
const INFERRED_OFFSET_M = 25;
/** ...and is not drawn when it would come out longer than this. */
const INFERRED_MAX_M = 150;
/** A lock longer than this gets no straight carry beside it. */
const LOCK_CARRY_MAX_M = 400;

interface PortageWay {
  points: Array<[number, number]>;
  name: string | null;
}

/** The single live edge at a barrier side, or null when the lake builder took it. */
function sideEdge(state: BuildState, side: number): number | null {
  const at = state.edgesAt(side);
  return at.length === 1 ? (at[0] as number) : null;
}

/** How far an edge passes from a spot, in metres. */
function distanceTo(edge: BuildEdge, lat: number, lng: number): number {
  let best = Infinity;
  for (let seg = 0; seg + 1 < edge.line.length; seg++) {
    const a = edge.line[seg] as [number, number];
    const b = edge.line[seg + 1] as [number, number];
    best = Math.min(best, projectOnSegment(lat, lng, a[0], a[1], b[0], b[1]).distance);
  }
  return best;
}

/**
 * Joins the sides of every barrier by a carry: along a portage way mapped in
 * OSM where one reaches the water on two sides, else straight between points
 * a little way up and down the water, marked as inferred. A lock open to boats
 * also gets a straight carry beside it, for a paddler who would rather carry
 * than wait; a lock closed to them (a ship lock with canoe=no) gets only a
 * mapped portage way, never a guessed carry across its grounds.
 */
export function buildPortages(state: BuildState, water: CollectedWater, coordOf: CoordOf): void {
  const ways: PortageWay[] = water.portageWays.flatMap((way) => {
    if (way.tags.access === 'private' || way.tags.access === 'no') return [];
    const points = way.refs.flatMap((ref) => {
      const at = coordOf(ref);
      return at ? [at] : [];
    });
    return points.length >= 2 ? [{ points, name: way.tags.name || null }] : [];
  });
  const wayGrid = new PointGrid<PortageWay>();
  for (const way of ways) for (const [lat, lng] of way.points) wayGrid.add(lat, lng, way);

  for (const site of state.barriers) {
    const sides = site.sides.flatMap((side) => {
      const edge = sideEdge(state, side);
      return edge === null ? [] : [{ side, edge }];
    });
    if (sides.length < 2) continue;
    const candidates = [...new Set(wayGrid.near(site.lat, site.lng, PORTAGE_SEARCH_M).map(({ item }) => item))];
    let carried = false;
    for (const way of candidates) carried = carryAlong(state, site, sides, way) || carried;
    if (!carried) inferCarries(state, site, sides);
  }

  for (const { edge, index } of state.live()) {
    if (edge.kind !== EdgeKind.lock) continue;
    if (edge.access === Access.closed) {
      const sides = [edge.a, edge.b].flatMap((node) => {
        const other = state.edgesAt(node).find((at) => at !== index && state.edges[at]?.kind !== EdgeKind.portage);
        return other === undefined ? [] : [{ side: node, edge: other }];
      });
      if (sides.length < 2) continue;
      const middle = edge.line[Math.floor(edge.line.length / 2)] as [number, number];
      const site: BarrierSite = {
        lat: middle[0],
        lng: middle[1],
        name: edge.name,
        ref: edge.ref ?? '',
        sides: [edge.a, edge.b],
      };
      for (const way of new Set(wayGrid.near(site.lat, site.lng, PORTAGE_SEARCH_M).map(({ item }) => item)))
        carryAlong(state, site, sides, way);
      continue;
    }
    if (state.distance(edge.a, edge.b) > LOCK_CARRY_MAX_M) continue;
    const from = state.nodes[edge.a];
    const to = state.nodes[edge.b];
    if (!from || !to) continue;
    state.addPortage(
      edge.a,
      edge.b,
      [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      PortageSource.inferred,
      edge.name,
      edge.ref,
    );
  }
}

/**
 * A mapped portage way as the carry round a barrier: its two ends paired with
 * two different sides, the pairing whose farther end lies nearest the water,
 * both within PORTAGE_REACH_M.
 */
function carryAlong(
  state: BuildState,
  site: BarrierSite,
  sides: Array<{ side: number; edge: number }>,
  way: PortageWay,
): boolean {
  const first = way.points[0] as [number, number];
  const last = way.points[way.points.length - 1] as [number, number];
  const reach = sides.map(({ edge }) => ({
    edge,
    first: distanceTo(state.edges[edge] as BuildEdge, first[0], first[1]),
    last: distanceTo(state.edges[edge] as BuildEdge, last[0], last[1]),
  }));
  let best: { start: (typeof reach)[number]; end: (typeof reach)[number]; worst: number } | null = null;
  for (const start of reach) {
    for (const end of reach) {
      if (start.edge === end.edge) continue;
      const worst = Math.max(start.first, end.last);
      if (worst <= PORTAGE_REACH_M && (!best || worst < best.worst)) best = { start, end, worst };
    }
  }
  if (!best) return false;
  // Out and back in where the portage way reaches the water, not at the barrier itself.
  const a = state.nodeNearest(best.start.edge, first[0], first[1]);
  const b = state.nodeNearest(best.end.edge, last[0], last[1]);
  const nodeA = state.nodes[a];
  const nodeB = state.nodes[b];
  if (!nodeA || !nodeB) return false;
  state.addPortage(
    a,
    b,
    [[nodeA.lat, nodeA.lng], ...way.points, [nodeB.lat, nodeB.lng]],
    PortageSource.tagged,
    way.name ?? site.name,
    site.ref,
  );
  return true;
}

function inferCarries(state: BuildState, site: BarrierSite, sides: Array<{ side: number; edge: number }>): void {
  const ends = sides.map(({ side, edge }) => state.nodeAlong(edge, side, INFERRED_OFFSET_M));
  for (let i = 0; i < ends.length; i++) {
    for (let j = i + 1; j < ends.length; j++) {
      const a = ends[i] as number;
      const b = ends[j] as number;
      if (state.distance(a, b) > INFERRED_MAX_M) continue;
      const from = state.nodes[a];
      const to = state.nodes[b];
      if (!from || !to) continue;
      state.addPortage(
        a,
        b,
        [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
        PortageSource.inferred,
        site.name,
        site.ref,
      );
    }
  }
}
