import { metresBetween, projectOnSegment } from '../../../lib/geo/geo';
import { MinHeap } from '../../../lib/geo/min-heap';
import { LakeIndex } from '../build/lakes';
import { Access, EdgeKind, PortageSource, type WaterGraphData } from '../water-graph';
import { LakeField, type LakeProfile } from './lake-field';
import type {
  PaddleBoatType,
  PaddleLakeStyle,
  PaddleLockPolicy,
  PaddleRouteLeg,
  PaddleRoutePoint,
  PaddleRouteSegment,
} from '@trek/shared';

/**
 * PAD-11: plans one leg at a time on a region's water network. The ends are
 * moved onto the water (a lake cell, or the nearest river within SNAP_M);
 * an A* search then weighs every way by the time it takes: paddling with or
 * against the current, carrying a portage, waiting at a lock, crossing a lake
 * on its grid. Edges a boat may not use are not taken at all.
 */

export interface RouteProfile {
  boat: PaddleBoatType;
  lakeStyle: PaddleLakeStyle;
  lockPolicy: PaddleLockPolicy;
}

/**
 * A point farther than this from any water the network knows is not on the
 * water. Generous on purpose: a click on the bank or a slipway of a wide river
 * lies 100 m and more from its centre line.
 */
export const SNAP_M = 200;
/** Planning speeds by boat, km/h: they choose between ways; the paddler's own speed times the tour. */
const BOAT_KMH: Record<PaddleBoatType, number> = { kayak: 7, canoe: 6, sup: 5, other: 6 };
/** The widest open water each boat should cross, in metres. */
const OPEN_WATER_M: Record<PaddleBoatType, number> = { kayak: 1500, canoe: 750, sup: 400, other: 1500 };
const CARRY_KMH = 2.5;
/** Getting out, unloading and back in at a portage, and waiting plus going through at a lock, seconds. */
const CARRY_EXTRA_S = 8 * 60;
const LOCK_S = 15 * 60;
const DISCOURAGED = 3;
/** Whitewater from this grade is taken only when it saves a lot; a SUP never takes it. */
const RAPIDS_GRADE = 2;
const RAPIDS_WEIGHT = 2;
const GAP_WEIGHT = 20;
/** Never slower than this against a current, km/h; the river is still paddled, just slowly. */
const MIN_UPSTREAM_KMH = 1;
const MAX_CURRENT_KMH = 2;
const MAX_SETTLED = 400_000;
/** How many portals' cost lists stay cached between searches. */
const PORTAL_COST_CACHE = 2000;
const BUDGET_MS = 3000;

type SnapEdge = { type: 'edge'; edge: number; seg: number; t: number; lat: number; lng: number; distance: number };
type SnapLake = { type: 'lake'; lake: number; cell: number; lat: number; lng: number; distance: number };
type Snap = SnapEdge | SnapLake;

/** How the search came to a node: along an edge (forward or back), across a lake, or from the start. */
interface Step {
  from: number;
  kind: 'edge' | 'lake' | 'partial';
  edge: number;
  forward: boolean;
  lake: number;
}

interface Piece {
  points: Array<[number, number]>;
  kind: PaddleRouteSegment['kind'];
  name: string | null;
  source: PaddleRouteSegment['source'];
  osmRef: string | null;
  grade: number | null;
}

export class WaterRouter {
  private readonly offsets: Uint32Array;
  private readonly arcs: Uint32Array;
  private readonly lakeIndex: LakeIndex;
  private readonly fields = new Map<number, LakeField>();
  private readonly portalCells = new Map<number, Array<{ node: number; cell: number }>>();
  private readonly portalCostCache = new Map<string, number[]>();
  private readonly lockRefs: Set<number>;
  private readonly segmentCells: Float64Array;
  private readonly segmentEdge: Int32Array;
  private readonly segmentIndex: Int32Array;
  private static readonly CELL = 0.004;

  constructor(readonly graph: WaterGraphData) {
    const nodes = graph.nodeLat.length;
    const degree = new Uint32Array(nodes + 1);
    for (let e = 0; e < graph.edgeA.length; e++) {
      degree[graph.edgeA[e] as number]++;
      degree[graph.edgeB[e] as number]++;
    }
    this.offsets = new Uint32Array(nodes + 1);
    for (let n = 0; n < nodes; n++) this.offsets[n + 1] = (this.offsets[n] as number) + (degree[n] as number);
    this.arcs = new Uint32Array(this.offsets[nodes] as number);
    const fill = this.offsets.slice(0, nodes);
    for (let e = 0; e < graph.edgeA.length; e++) {
      this.arcs[fill[graph.edgeA[e] as number]++ as number] = e * 2;
      this.arcs[fill[graph.edgeB[e] as number]++ as number] = e * 2 + 1;
    }
    this.lakeIndex = new LakeIndex(graph.lakes);
    this.lockRefs = new Set<number>();
    for (let e = 0; e < graph.edgeKind.length; e++) {
      if (graph.edgeKind[e] === EdgeKind.lock && (graph.edgeRef[e] as number) >= 0)
        this.lockRefs.add(graph.edgeRef[e] as number);
    }
    ({ cells: this.segmentCells, edges: this.segmentEdge, segs: this.segmentIndex } = this.indexSegments());
  }

  /** Every segment of every edge filed under the grid cells its box touches, sorted by cell for lookup. */
  private indexSegments(): { cells: Float64Array; edges: Int32Array; segs: Int32Array } {
    const g = this.graph;
    const cells: number[] = [];
    const edges: number[] = [];
    const segs: number[] = [];
    for (let e = 0; e < g.edgeA.length; e++) {
      const start = g.edgeGeomStart[e] as number;
      const count = g.edgeGeomCount[e] as number;
      for (let s = 0; s + 1 < count; s++) {
        const aLat = g.pool[(start + s) * 2] as number;
        const aLng = g.pool[(start + s) * 2 + 1] as number;
        const bLat = g.pool[(start + s + 1) * 2] as number;
        const bLng = g.pool[(start + s + 1) * 2 + 1] as number;
        for (
          let r = Math.floor(Math.min(aLat, bLat) / WaterRouter.CELL);
          r <= Math.floor(Math.max(aLat, bLat) / WaterRouter.CELL);
          r++
        ) {
          for (
            let c = Math.floor(Math.min(aLng, bLng) / WaterRouter.CELL);
            c <= Math.floor(Math.max(aLng, bLng) / WaterRouter.CELL);
            c++
          ) {
            cells.push(WaterRouter.key(r, c));
            edges.push(e);
            segs.push(s);
          }
        }
      }
    }
    const order = Array.from(cells.keys()).sort((x, y) => (cells[x] as number) - (cells[y] as number) || x - y);
    return {
      cells: Float64Array.from(order, (i) => cells[i] as number),
      edges: Int32Array.from(order, (i) => edges[i] as number),
      segs: Int32Array.from(order, (i) => segs[i] as number),
    };
  }

  private static key(row: number, col: number): number {
    return (row + 50_000) * 100_000 + (col + 50_000);
  }

  private field(lake: number): LakeField {
    let field = this.fields.get(lake);
    if (!field) {
      field = new LakeField(this.graph.lakes[lake] as NonNullable<WaterGraphData['lakes'][number]>);
      this.fields.set(lake, field);
    }
    return field;
  }

  private point(edge: number, index: number): [number, number] {
    const at = ((this.graph.edgeGeomStart[edge] as number) + index) * 2;
    return [this.graph.pool[at] as number, this.graph.pool[at + 1] as number];
  }

  private edgeLine(edge: number): Array<[number, number]> {
    const count = this.graph.edgeGeomCount[edge] as number;
    return Array.from({ length: count }, (_, i) => this.point(edge, i));
  }

  /** The nearest open segment within `radius` metres. */
  private nearestSegment(lat: number, lng: number, radius: number): SnapEdge | null {
    const reach = Math.ceil(radius / 111_195 / WaterRouter.CELL / Math.cos((lat * Math.PI) / 180)) + 1;
    const row = Math.floor(lat / WaterRouter.CELL);
    const col = Math.floor(lng / WaterRouter.CELL);
    let best: SnapEdge | null = null;
    let bestClosed: SnapEdge | null = null;
    for (let r = row - reach; r <= row + reach; r++) {
      for (let c = col - reach; c <= col + reach; c++) {
        const key = WaterRouter.key(r, c);
        for (let i = this.lowerBound(key); i < this.segmentCells.length && this.segmentCells[i] === key; i++) {
          const edge = this.segmentEdge[i] as number;
          const seg = this.segmentIndex[i] as number;
          const kind = this.graph.edgeKind[edge];
          if (kind === EdgeKind.portage || kind === EdgeKind.gap) continue;
          const a = this.point(edge, seg);
          const b = this.point(edge, seg + 1);
          const { t, distance } = projectOnSegment(lat, lng, a[0], a[1], b[0], b[1]);
          if (distance > radius) continue;
          const snap: SnapEdge = {
            type: 'edge',
            edge,
            seg,
            t,
            lat: a[0] + (b[0] - a[0]) * t,
            lng: a[1] + (b[1] - a[1]) * t,
            distance,
          };
          const closed = this.graph.edgeAccess[edge] === Access.closed;
          if (closed) {
            if (!bestClosed || distance < bestClosed.distance) bestClosed = snap;
          } else if (!best || distance < best.distance) best = snap;
        }
      }
    }
    return best ?? bestClosed;
  }

  private lowerBound(key: number): number {
    let low = 0;
    let high = this.segmentCells.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if ((this.segmentCells[mid] as number) < key) low = mid + 1;
      else high = mid;
    }
    return low;
  }

  /** The point put on the water: inside a lake as it is, else on the nearest river or canal, else at a lake's edge. */
  snap(point: PaddleRoutePoint): Snap | null {
    const lake = this.lakeIndex.at(point.lat, point.lng);
    if (lake >= 0) {
      const cell = this.field(lake).waterCellNear(point.lat, point.lng);
      if (cell >= 0) return { type: 'lake', lake, cell, lat: point.lat, lng: point.lng, distance: 0 };
    }
    const edge = this.nearestSegment(point.lat, point.lng, SNAP_M);
    if (edge) return edge;
    for (let i = 0; i < this.graph.lakes.length; i++) {
      const field = this.field(i);
      const cell = field.waterCellNear(point.lat, point.lng);
      if (cell < 0) continue;
      const [lat, lng] = field.centre(cell);
      const distance = metresBetween(point.lat, point.lng, lat, lng);
      if (distance <= SNAP_M) return { type: 'lake', lake: i, cell, lat, lng, distance };
    }
    return null;
  }

  /** Seconds to travel an edge in a direction, or Infinity where the boat may not. */
  private edgeSeconds(edge: number, forward: boolean, length: number, profile: RouteProfile): number {
    const g = this.graph;
    const kind = g.edgeKind[edge];
    const speed = BOAT_KMH[profile.boat];
    if (kind === EdgeKind.portage) {
      const lockCarry = this.lockRefs.has(g.edgeRef[edge] as number);
      if (lockCarry && profile.lockPolicy === 'use') return Infinity;
      // A straight carry round an open lock is a guess over its walls: taken only when the paddler wants to carry.
      if (lockCarry && g.edgeSource[edge] === PortageSource.inferred && profile.lockPolicy !== 'portage')
        return Infinity;
      return (length / 1000 / CARRY_KMH) * 3600 + CARRY_EXTRA_S;
    }
    if (g.edgeAccess[edge] === Access.closed) return Infinity;
    if (g.edgeOneway[edge] === 1 && !forward) return Infinity;
    if (kind === EdgeKind.lock && profile.lockPolicy === 'portage') return Infinity;
    const grade = g.edgeGrade[edge] as number;
    if (grade >= RAPIDS_GRADE && profile.boat === 'sup') return Infinity;
    let kmh = speed;
    const current = g.edgeCurrent[edge] as number;
    if (g.edgeFlow[edge] === 1 && current > 0)
      kmh = forward ? speed + 0.8 * current : Math.max(MIN_UPSTREAM_KMH, speed - current);
    let seconds = (length / 1000 / kmh) * 3600;
    if (g.edgeAccess[edge] === Access.discouraged) seconds *= DISCOURAGED;
    if (grade >= RAPIDS_GRADE) seconds *= RAPIDS_WEIGHT;
    if (kind === EdgeKind.gap) seconds *= GAP_WEIGHT;
    if (kind === EdgeKind.lock) seconds += LOCK_S;
    return seconds;
  }

  private lakeProfile(profile: RouteProfile): LakeProfile {
    return { style: profile.lakeStyle, maxCrossingM: OPEN_WATER_M[profile.boat] };
  }

  /** Seconds across a lake for weighted metres. */
  private lakeSeconds(weighted: number, profile: RouteProfile): number {
    return (weighted / 1000 / BOAT_KMH[profile.boat]) * 3600;
  }

  private portalCell(field: LakeField, node: number): number {
    return field.waterCellNear(this.graph.nodeLat[node] as number, this.graph.nodeLng[node] as number);
  }

  /** A lake's portal nodes with the water cell each opens onto (-1 when none is near). */
  private lakePortals(lake: number): Array<{ node: number; cell: number }> {
    let portals = this.portalCells.get(lake);
    if (!portals) {
      const field = this.field(lake);
      portals = Array.from(this.graph.lakes[lake]?.portals ?? [], (node) => ({
        node,
        cell: this.portalCell(field, node),
      }));
      this.portalCells.set(lake, portals);
    }
    return portals;
  }

  /** Weighted metres from a cell to each of a lake's portals, kept for the next search through the same lake. */
  private portalCosts(lake: number, sourceCell: number, profile: LakeProfile): number[] {
    const key = `${lake}:${sourceCell}:${profile.style}:${profile.maxCrossingM}`;
    let costs = this.portalCostCache.get(key);
    if (costs) {
      this.portalCostCache.delete(key);
    } else {
      const portals = this.lakePortals(lake);
      const reachable = portals.filter(({ cell }) => cell >= 0);
      const reached = this.field(lake).costsTo(
        sourceCell,
        reachable.map(({ cell }) => cell),
        profile,
      );
      const byCell = new Map(reachable.map(({ cell }, index) => [cell, reached[index] as number]));
      costs = portals.map(({ cell }) => byCell.get(cell) ?? Infinity);
    }
    this.portalCostCache.set(key, costs);
    if (this.portalCostCache.size > PORTAL_COST_CACHE)
      this.portalCostCache.delete(this.portalCostCache.keys().next().value as string);
    return costs;
  }

  route(
    from: PaddleRoutePoint,
    to: PaddleRoutePoint,
    profile: RouteProfile,
    deadline = Date.now() + BUDGET_MS,
  ): PaddleRouteLeg {
    const start = this.snap(from);
    if (!start) return { status: 'failed', code: 'not_on_water', at: from };
    const end = this.snap(to);
    if (!end) return { status: 'failed', code: 'not_on_water', at: to };
    const found = this.search(start, end, profile, deadline);
    if (found === 'timeout') return { status: 'failed', code: 'timeout', at: null };
    if (!found) return { status: 'failed', code: 'no_water_path', at: null };
    return this.assemble(found, start, end, profile);
  }

  private search(
    start: Snap,
    end: Snap,
    profile: RouteProfile,
    deadline: number,
  ): Map<number, Step> | 'timeout' | null {
    const g = this.graph;
    const nodes = g.nodeLat.length;
    const S = nodes;
    const T = nodes + 1;
    const cost = new Map<number, number>();
    const came = new Map<number, Step>();
    const heap = new MinHeap();
    const vmax = BOAT_KMH[profile.boat] + 0.8 * MAX_CURRENT_KMH;
    const h = (node: number) => {
      const lat = node === S ? start.lat : node === T ? end.lat : (g.nodeLat[node] as number);
      const lng = node === S ? start.lng : node === T ? end.lng : (g.nodeLng[node] as number);
      return (metresBetween(lat, lng, end.lat, end.lng) / 1000 / vmax) * 3600;
    };
    const relax = (node: number, via: number, step: Step) => {
      if (via < (cost.get(node) ?? Infinity)) {
        cost.set(node, via);
        came.set(node, step);
        heap.push(node, via + h(node));
      }
    };
    const lakeProfile = this.lakeProfile(profile);
    const lakeHops = (lake: number, sourceCell: number, base: number, fromNode: number) => {
      const field = this.field(lake);
      const portals = this.lakePortals(lake);
      const costs = this.portalCosts(lake, sourceCell, lakeProfile);
      portals.forEach(({ node, cell }, index) => {
        const weighted = costs[index] as number;
        if (node === fromNode || cell < 0 || !Number.isFinite(weighted)) return;
        relax(node, base + this.lakeSeconds(weighted, profile), {
          from: fromNode,
          kind: 'lake',
          edge: -1,
          forward: true,
          lake,
        });
      });
      if (end.type === 'lake' && end.lake === lake) {
        const [toEnd] = field.costsTo(sourceCell, [end.cell], lakeProfile);
        if (Number.isFinite(toEnd as number)) {
          relax(T, base + this.lakeSeconds(toEnd as number, profile), {
            from: fromNode,
            kind: 'lake',
            edge: -1,
            forward: true,
            lake,
          });
        }
      }
    };

    cost.set(S, 0);
    // From the start: along its edge both ways, or across its lake.
    if (start.type === 'edge') {
      const length = this.partialLength(start.edge, start, 'toB');
      relax(g.edgeB[start.edge] as number, this.edgeSeconds(start.edge, true, length, profile), {
        from: S,
        kind: 'partial',
        edge: start.edge,
        forward: true,
        lake: -1,
      });
      const back = this.partialLength(start.edge, start, 'toA');
      relax(g.edgeA[start.edge] as number, this.edgeSeconds(start.edge, false, back, profile), {
        from: S,
        kind: 'partial',
        edge: start.edge,
        forward: false,
        lake: -1,
      });
      if (end.type === 'edge' && end.edge === start.edge) {
        const forward = start.seg + start.t <= end.seg + end.t;
        const between = this.betweenLength(start.edge, start, end);
        relax(T, this.edgeSeconds(start.edge, forward, between, profile), {
          from: S,
          kind: 'partial',
          edge: start.edge,
          forward,
          lake: -1,
        });
      }
    } else {
      lakeHops(start.lake, start.cell, 0, S);
    }

    let settled = 0;
    while (heap.size > 0) {
      const node = heap.pop();
      if (node === T) return came;
      if (++settled > MAX_SETTLED) return null;
      // Checked on the first node already: a job that waited past its time in the queue gives up at once.
      if ((settled & 1023) === 1 && Date.now() > deadline) return 'timeout';
      const base = cost.get(node) as number;
      if (node === S) continue;
      for (let i = this.offsets[node] as number; i < (this.offsets[node + 1] as number); i++) {
        const arc = this.arcs[i] as number;
        const edge = arc >> 1;
        const forward = (arc & 1) === 0;
        const other = forward ? (g.edgeB[edge] as number) : (g.edgeA[edge] as number);
        const seconds = this.edgeSeconds(edge, forward, g.edgeLength[edge] as number, profile);
        if (Number.isFinite(seconds))
          relax(other, base + seconds, { from: node, kind: 'edge', edge, forward, lake: -1 });
      }
      if (end.type === 'edge') {
        if (node === g.edgeA[end.edge]) {
          const length = this.partialLength(end.edge, end, 'toA');
          relax(T, base + this.edgeSeconds(end.edge, true, length, profile), {
            from: node,
            kind: 'partial',
            edge: end.edge,
            forward: true,
            lake: -1,
          });
        }
        if (node === g.edgeB[end.edge]) {
          const length = this.partialLength(end.edge, end, 'toB');
          relax(T, base + this.edgeSeconds(end.edge, false, length, profile), {
            from: node,
            kind: 'partial',
            edge: end.edge,
            forward: false,
            lake: -1,
          });
        }
      }
      const lake = g.nodeLake[node] as number;
      if (lake >= 0) {
        const cell = this.portalCell(this.field(lake), node);
        if (cell >= 0) lakeHops(lake, cell, base, node);
      }
    }
    return null;
  }

  /** Metres from a snapped point along its edge to the edge's a or b end. */
  private partialLength(edge: number, snap: SnapEdge, toward: 'toA' | 'toB'): number {
    const count = this.graph.edgeGeomCount[edge] as number;
    const a = this.point(edge, snap.seg);
    const b = this.point(edge, snap.seg + 1);
    let length = 0;
    if (toward === 'toA') {
      length += metresBetween(snap.lat, snap.lng, a[0], a[1]);
      for (let i = snap.seg; i > 0; i--) length += this.segmentLength(edge, i - 1);
    } else {
      length += metresBetween(snap.lat, snap.lng, b[0], b[1]);
      for (let i = snap.seg + 1; i < count - 1; i++) length += this.segmentLength(edge, i);
    }
    return length;
  }

  private segmentLength(edge: number, seg: number): number {
    const a = this.point(edge, seg);
    const b = this.point(edge, seg + 1);
    return metresBetween(a[0], a[1], b[0], b[1]);
  }

  private betweenLength(edge: number, x: SnapEdge, y: SnapEdge): number {
    return Math.abs(this.partialLength(edge, x, 'toA') - this.partialLength(edge, y, 'toA'));
  }

  /** The points of an edge between two snapped spots on it (or a snap and an end), in travel order. */
  private partialLine(edge: number, from: SnapEdge | 'a' | 'b', to: SnapEdge | 'a' | 'b'): Array<[number, number]> {
    const count = this.graph.edgeGeomCount[edge] as number;
    const position = (spot: SnapEdge | 'a' | 'b') => (spot === 'a' ? 0 : spot === 'b' ? count - 1 : spot.seg + spot.t);
    const p = position(from);
    const q = position(to);
    const points: Array<[number, number]> = [];
    const at = (spot: SnapEdge | 'a' | 'b'): [number, number] =>
      spot === 'a' ? this.point(edge, 0) : spot === 'b' ? this.point(edge, count - 1) : [spot.lat, spot.lng];
    points.push(at(from));
    if (p <= q) for (let i = Math.floor(p) + 1; i < q; i++) points.push(this.point(edge, i));
    else for (let i = Math.ceil(p) - 1; i > q; i--) points.push(this.point(edge, i));
    points.push(at(to));
    return points;
  }

  private assemble(came: Map<number, Step>, start: Snap, end: Snap, profile: RouteProfile): PaddleRouteLeg {
    const g = this.graph;
    const nodes = g.nodeLat.length;
    const S = nodes;
    const T = nodes + 1;
    const chain: Array<{ node: number; step: Step }> = [];
    for (let node = T; node !== S;) {
      const step = came.get(node) as Step;
      chain.unshift({ node, step });
      node = step.from;
    }
    const lakeProfile = this.lakeProfile(profile);
    const pieces: Piece[] = [];
    const nodePoint = (node: number): [number, number] =>
      node === S
        ? [start.lat, start.lng]
        : node === T
          ? [end.lat, end.lng]
          : [g.nodeLat[node] as number, g.nodeLng[node] as number];
    for (const { node, step } of chain) {
      if (step.kind === 'lake') {
        const field = this.field(step.lake);
        const fromPoint = nodePoint(step.from);
        const toPoint = nodePoint(node);
        const fromCell =
          step.from === S && start.type === 'lake' ? start.cell : field.waterCellNear(fromPoint[0], fromPoint[1]);
        const toCell = node === T && end.type === 'lake' ? end.cell : field.waterCellNear(toPoint[0], toPoint[1]);
        const middle = field.path(fromCell, toCell, lakeProfile) ?? [];
        pieces.push({
          points: [fromPoint, ...middle.slice(1, -1), toPoint],
          kind: 'lake',
          name: g.lakes[step.lake]?.name ?? null,
          source: null,
          osmRef: null,
          grade: null,
        });
        continue;
      }
      const edge = step.edge;
      let points: Array<[number, number]>;
      if (step.kind === 'partial') {
        const fromSpot = step.from === S && start.type === 'edge' ? start : step.forward ? 'a' : 'b';
        const toSpot = node === T && end.type === 'edge' ? end : step.forward ? 'b' : 'a';
        points = this.partialLine(edge, fromSpot, toSpot);
      } else {
        const line = this.edgeLine(edge);
        points = step.forward ? line : line.reverse();
      }
      pieces.push({ points, ...this.describe(edge) });
    }
    return this.finish(pieces, start, end);
  }

  private describe(edge: number): Omit<Piece, 'points'> {
    const g = this.graph;
    const kind = g.edgeKind[edge];
    const name = (g.edgeName[edge] as number) >= 0 ? (g.strings[g.edgeName[edge] as number] ?? null) : null;
    const osmRef = (g.edgeRef[edge] as number) >= 0 ? (g.strings[g.edgeRef[edge] as number] ?? null) : null;
    if (kind === EdgeKind.portage) {
      const source =
        g.edgeSource[edge] === PortageSource.tagged
          ? 'tagged'
          : g.edgeSource[edge] === PortageSource.footway
            ? 'footway'
            : 'inferred';
      return { kind: 'portage', name, source, osmRef, grade: null };
    }
    if (kind === EdgeKind.lock) return { kind: 'lock', name, source: null, osmRef, grade: null };
    if (kind === EdgeKind.gap) return { kind: 'gap', name: null, source: null, osmRef: null, grade: null };
    if (kind === EdgeKind.pass) return { kind: 'pass', name, source: null, osmRef, grade: null };
    const grade = g.edgeGrade[edge] as number;
    if (grade >= RAPIDS_GRADE) return { kind: 'rapids', name, source: null, osmRef, grade };
    return { kind: 'water', name, source: null, osmRef: null, grade: null };
  }

  /** One line from the pieces, with neighbouring pieces of a kind merged into one segment (portages and locks stay apart). */
  private finish(pieces: Piece[], start: Snap, end: Snap): PaddleRouteLeg {
    const geometry: Array<[number, number]> = [];
    const segments: PaddleRouteSegment[] = [];
    for (const piece of pieces) {
      const points = piece.points.filter(
        (point, i) => i === 0 || point[0] !== piece.points[i - 1]?.[0] || point[1] !== piece.points[i - 1]?.[1],
      );
      if (points.length < 2) continue;
      const offset = geometry.length === 0 ? 0 : geometry.length - 1;
      geometry.push(...(geometry.length === 0 ? points : points.slice(1)));
      const to = geometry.length - 1;
      const previous = segments[segments.length - 1];
      const mergeable = piece.kind !== 'portage' && piece.kind !== 'lock';
      // One water keeps one segment; where the name changes (Naab into Donau) a new one starts.
      const sameWater = !previous?.name || !piece.name || previous.name === piece.name;
      if (previous && mergeable && previous.kind === piece.kind && previous.grade === piece.grade && sameWater) {
        previous.to = to;
        previous.name ??= piece.name;
      } else {
        segments.push({
          kind: piece.kind,
          from: offset,
          to,
          name: piece.name,
          source: piece.source,
          osm_ref: piece.osmRef,
          grade: piece.grade,
        });
      }
    }
    if (geometry.length < 2 || segments.length === 0) return { status: 'failed', code: 'no_water_path', at: null };
    let distance = 0;
    for (let i = 1; i < geometry.length; i++) {
      const a = geometry[i - 1] as [number, number];
      const b = geometry[i] as [number, number];
      distance += metresBetween(a[0], a[1], b[0], b[1]);
    }
    return {
      status: 'ok',
      geometry,
      segments,
      distance_m: Math.round(distance),
      snapped_m: { from: Math.round(start.distance), to: Math.round(end.distance) },
    };
  }
}
