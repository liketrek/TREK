import { LocalFrame } from '../../../lib/geo/geo';
import type { LakeGrid } from '../water-graph';
import { type BuildEdge, type BuildState, PointGrid } from './build-state';
import type { CollectedArea, CollectedWater } from './collect';
import type { CoordOf } from './lines';

/** Ponds below this stay out; above FREE_LAKE_HA a lake stays even without water flowing in. */
const MIN_LAKE_HA = 0.5;
const FREE_LAKE_HA = 5;
/** The finest grid and the most cells a lake may take; a large lake gets coarser cells. */
const MIN_CELL_M = 5;
const MAX_CELLS = 800_000;
/** Line points this close to a barrier never count as in a lake, so a dam is never crossed through its reservoir. */
const BARRIER_CLEARANCE_M = 40;
/** A line that ends this close to a lake's water opens onto the lake. */
const SHORE_REACH_M = 30;

type Ring = Array<[number, number]>;

/**
 * The rings of a multipolygon from its member ways, joined end to end by
 * their node ids as OSM splits long shores into many ways. A ring that does
 * not close is broken data and left out; the others are kept.
 */
function assembleRings(
  members: ReadonlyArray<{ refs: number[]; role: string }>,
): Array<{ refs: number[]; inner: boolean }> {
  const rings: Array<{ refs: number[]; inner: boolean }> = [];
  for (const inner of [false, true]) {
    const pieces = members
      .filter((member) => (member.role === 'inner') === inner && member.refs.length >= 2)
      .map((member) => [...member.refs]);
    const byEnd = new Map<number, number[][]>();
    const index = (piece: number[]) => {
      for (const end of [piece[0] as number, piece[piece.length - 1] as number])
        byEnd.set(end, [...(byEnd.get(end) ?? []), piece]);
    };
    const unindex = (piece: number[]) => {
      for (const end of [piece[0] as number, piece[piece.length - 1] as number]) {
        byEnd.set(
          end,
          (byEnd.get(end) ?? []).filter((other) => other !== piece),
        );
      }
    };
    pieces.forEach(index);
    const used = new Set<number[]>();
    for (const start of pieces) {
      if (used.has(start)) continue;
      used.add(start);
      unindex(start);
      const ring = [...start];
      while (ring[0] !== ring[ring.length - 1]) {
        const end = ring[ring.length - 1] as number;
        const next = (byEnd.get(end) ?? []).find((piece) => !used.has(piece));
        if (!next) break;
        used.add(next);
        unindex(next);
        ring.push(...(next[0] === end ? next.slice(1) : [...next].reverse().slice(1)));
      }
      if (ring.length >= 4 && ring[0] === ring[ring.length - 1]) rings.push({ refs: ring, inner });
    }
  }
  return rings;
}

function ringsOf(
  area: CollectedArea,
  water: CollectedWater,
  coordOf: CoordOf,
): Array<{ points: Ring; inner: boolean }> {
  const refRings = area.ring
    ? [{ refs: area.ring, inner: false }]
    : assembleRings(
        (area.members ?? []).map((member) => ({ refs: water.memberWays.get(member.way) ?? [], role: member.role })),
      );
  return refRings.flatMap(({ refs, inner }) => {
    const points = refs.flatMap((ref) => {
      const at = coordOf(ref);
      return at ? [at] : [];
    });
    return points.length >= 4 ? [{ points, inner }] : [];
  });
}

function setBit(mask: Uint8Array, index: number): void {
  mask[index >> 3] = (mask[index >> 3] as number) | (1 << (index & 7));
}

export function maskHas(lake: Pick<LakeGrid, 'mask' | 'width' | 'height'>, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= lake.width || row >= lake.height) return false;
  const index = row * lake.width + col;
  return ((lake.mask[index >> 3] as number) & (1 << (index & 7))) !== 0;
}

/**
 * A lake as a grid of water cells. A cell is water when its centre lies in
 * the lake (outer rings minus islands), and also when a shore line passes
 * through it, so a narrow channel a cell wide stays open; the router keeps
 * its distance from the shore, not the grid.
 */
function rasterizeLake(rings: Array<{ points: Ring; inner: boolean }>, name: string | null): LakeGrid | null {
  const outer = rings.filter((ring) => !ring.inner);
  if (outer.length === 0) return null;
  let south = 90;
  let west = 180;
  let north = -90;
  let east = -180;
  for (const ring of outer) {
    for (const [lat, lng] of ring.points) {
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      west = Math.min(west, lng);
      east = Math.max(east, lng);
    }
  }
  const frame = new LocalFrame(south, west);
  const spanX = frame.x(east);
  const spanY = frame.y(north);
  const cell = Math.max(MIN_CELL_M, Math.sqrt((spanX * spanY) / MAX_CELLS));
  const width = Math.ceil(spanX / cell) + 1;
  const height = Math.ceil(spanY / cell) + 1;
  const mask = new Uint8Array(Math.ceil((width * height) / 8));
  const local = rings.map((ring) => ring.points.map(([lat, lng]) => [frame.x(lng), frame.y(lat)] as [number, number]));

  // Scanlines: every ring crossing of a row's centre line, filled pairwise (even-odd, so islands stay land).
  const crossings: number[][] = Array.from({ length: height }, () => []);
  let area = 0;
  local.forEach((points, index) => {
    let ringArea = 0;
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1] as [number, number];
      const [x2, y2] = points[i] as [number, number];
      ringArea += x1 * y2 - x2 * y1;
      if (y1 === y2) continue;
      const low = Math.min(y1, y2);
      const high = Math.max(y1, y2);
      for (let row = Math.max(0, Math.ceil(low / cell - 0.5)); row < height; row++) {
        const y = (row + 0.5) * cell;
        if (y >= high) break;
        if (y < low) continue;
        (crossings[row] as number[]).push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    area += (rings[index]?.inner ? -1 : 1) * Math.abs(ringArea / 2);
  });
  const hectares = area / 10_000;
  if (hectares < MIN_LAKE_HA) return null;
  crossings.forEach((xs, row) => {
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const from = Math.max(0, Math.ceil((xs[i] as number) / cell - 0.5));
      const to = Math.min(width - 1, Math.floor((xs[i + 1] as number) / cell - 0.5));
      for (let col = from; col <= to; col++) setBit(mask, row * width + col);
    }
  });
  // Shore lines mark the cells they pass through.
  for (const points of local) {
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i - 1] as [number, number];
      const [x2, y2] = points[i] as [number, number];
      const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (cell / 2)));
      for (let step = 0; step <= steps; step++) {
        const col = Math.floor((x1 + ((x2 - x1) * step) / steps) / cell);
        const row = Math.floor((y1 + ((y2 - y1) * step) / steps) / cell);
        if (col >= 0 && row >= 0 && col < width && row < height) setBit(mask, row * width + col);
      }
    }
  }
  return { name, lat0: south, lng0: west, cell, width, height, mask, portals: new Int32Array(0), hectares };
}

/** The lakes on a coarse grid of their boxes, for asking which lake a point lies in. */
export class LakeIndex {
  private readonly cells = new Map<string, number[]>();
  private static readonly DEG = 0.02;

  constructor(private readonly lakes: readonly LakeGrid[]) {
    lakes.forEach((lake, index) => {
      const frame = new LocalFrame(lake.lat0, lake.lng0);
      const north = frame.lat(lake.height * lake.cell);
      const east = frame.lng(lake.width * lake.cell);
      for (let r = Math.floor(lake.lat0 / LakeIndex.DEG); r <= Math.floor(north / LakeIndex.DEG); r++) {
        for (let c = Math.floor(lake.lng0 / LakeIndex.DEG); c <= Math.floor(east / LakeIndex.DEG); c++) {
          const key = `${r}:${c}`;
          const cell = this.cells.get(key);
          if (cell) cell.push(index);
          else this.cells.set(key, [index]);
        }
      }
    });
  }

  /** The first lake whose water cell holds the point, or -1. */
  at(lat: number, lng: number): number {
    for (const index of this.cells.get(`${Math.floor(lat / LakeIndex.DEG)}:${Math.floor(lng / LakeIndex.DEG)}`) ?? []) {
      const lake = this.lakes[index] as LakeGrid;
      const frame = new LocalFrame(lake.lat0, lake.lng0);
      if (maskHas(lake, Math.floor(frame.x(lng) / lake.cell), Math.floor(frame.y(lat) / lake.cell))) return index;
    }
    return -1;
  }
}

export function rasterizeLakes(water: CollectedWater, coordOf: CoordOf): LakeGrid[] {
  return water.areas.flatMap((area) => {
    const lake = rasterizeLake(ringsOf(area, water, coordOf), area.name);
    return lake ? [lake] : [];
  });
}

/**
 * Cuts the lines where they enter and leave a lake: what runs on land stays,
 * reaching one point into the lake, where a portal node opens onto it; what
 * runs inside is dropped, since the lake's own grid routes across it. Then
 * lakes nothing opens into and smaller than FREE_LAKE_HA go.
 */
export function attachLakes(state: BuildState, lakes: LakeGrid[]): LakeGrid[] {
  const index = new LakeIndex(lakes);
  const barrierGrid = new PointGrid<number>();
  state.barriers.forEach((site, at) => barrierGrid.add(site.lat, site.lng, at));
  const nearBarrier = (lat: number, lng: number) => barrierGrid.near(lat, lng, BARRIER_CLEARANCE_M).length > 0;
  const lakeOfPoint = (lat: number, lng: number) => (nearBarrier(lat, lng) ? -1 : index.at(lat, lng));

  const count = state.edges.length;
  for (let e = 0; e < count; e++) {
    const edge = state.edges[e] as BuildEdge;
    if (edge.dead) continue;
    const inside = edge.line.map(([lat, lng], at) => {
      const endNode = at === 0 ? edge.a : at === edge.line.length - 1 ? edge.b : -1;
      if (endNode >= 0 && state.nodes[endNode]?.barrier) return -1;
      return lakeOfPoint(lat, lng);
    });
    if (inside.every((lake) => lake < 0)) continue;
    edge.dead = true;
    // One node per point, so a point that both ends a run and starts a crossing into the next lake is one portal.
    const portals = new Map<number, number>();
    const portalAt = (point: number): number => {
      const known = portals.get(point);
      if (known !== undefined) return known;
      let node: number;
      if (point === 0) node = markPortal(state, edge.a, inside[0] as number);
      else if (point === edge.line.length - 1) node = markPortal(state, edge.b, inside[point] as number);
      else {
        const [lat, lng] = edge.line[point] as [number, number];
        node = markPortal(state, state.addNode(lat, lng), inside[point] as number);
      }
      portals.set(point, node);
      return node;
    };
    let runStart = -1;
    for (let point = 0; point <= edge.line.length; point++) {
      const outside = point < edge.line.length && (inside[point] as number) < 0;
      if (outside && runStart < 0) runStart = point;
      if (!outside && runStart >= 0) {
        // The run reaches one point into the water on each side it touches a lake.
        const first = runStart > 0 ? runStart - 1 : 0;
        const last = point < edge.line.length ? point : point - 1;
        if (last > first) {
          const a = first === 0 && runStart === 0 ? edge.a : portalAt(first);
          const b = last === edge.line.length - 1 && point === edge.line.length ? edge.b : portalAt(last);
          state.addEdge({ ...edge, a, b, line: edge.line.slice(first, last + 1) });
        }
        runStart = -1;
      }
    }
    // Where the line passes straight from one lake into the next (two waters mapped edge to edge),
    // the step between them joins the two lakes' portals.
    for (let point = 1; point < edge.line.length; point++) {
      const from = inside[point - 1] as number;
      const to = inside[point] as number;
      if (from < 0 || to < 0 || from === to) continue;
      state.addEdge({
        ...edge,
        a: portalAt(point - 1),
        b: portalAt(point),
        line: edge.line.slice(point - 1, point + 1),
      });
    }
    // Ends inside a lake open onto it even when nothing of the edge stays.
    if ((inside[0] as number) >= 0) markPortal(state, edge.a, inside[0] as number);
    const lastPoint = edge.line.length - 1;
    if ((inside[lastPoint] as number) >= 0) markPortal(state, edge.b, inside[lastPoint] as number);
  }

  // Line ends that stop just short of a lake's water open onto it too.
  const incidence = state.incidence();
  state.nodes.forEach((node, at) => {
    if (node.lake >= 0 || node.barrier || (incidence[at] as number[]).length !== 1) return;
    const lake = lakeNear(index, node.lat, node.lng);
    if (lake >= 0) markPortal(state, at, lake);
  });

  const portals = lakes.map(() => [] as number[]);
  state.nodes.forEach((node, at) => {
    if (node.lake >= 0) portals[node.lake]?.push(at);
  });
  const kept: LakeGrid[] = [];
  const remap = new Map<number, number>();
  lakes.forEach((lake, at) => {
    const lakePortals = portals[at] as number[];
    if (lakePortals.length === 0 && lake.hectares < FREE_LAKE_HA) return;
    remap.set(at, kept.length);
    kept.push({ ...lake, portals: Int32Array.from(lakePortals) });
  });
  for (const node of state.nodes) if (node.lake >= 0) node.lake = remap.get(node.lake) ?? -1;
  return kept;
}

/** The lake at a point, or the nearest one within SHORE_REACH_M of it (searched on two rings of eight bearings). */
function lakeNear(index: LakeIndex, lat: number, lng: number): number {
  const here = index.at(lat, lng);
  if (here >= 0) return here;
  const cos = Math.cos((lat * Math.PI) / 180);
  for (const reach of [SHORE_REACH_M / 2, SHORE_REACH_M]) {
    for (let bearing = 0; bearing < 8; bearing++) {
      const angle = (bearing * Math.PI) / 4;
      const lake = index.at(
        lat + (reach * Math.cos(angle)) / 111_195,
        lng + (reach * Math.sin(angle)) / (111_195 * cos),
      );
      if (lake >= 0) return lake;
    }
  }
  return -1;
}

function markPortal(state: BuildState, node: number, lake: number): number {
  const at = state.nodes[node];
  if (at && at.lake < 0 && !at.barrier && lake >= 0) at.lake = lake;
  return node;
}
