import { LocalFrame } from '../../../lib/geo/geo';
import { MinHeap } from '../../../lib/geo/min-heap';
import { maskHas } from '../build/lakes';
import type { LakeGrid } from '../water-graph';
import type { PaddleLakeStyle } from '@trek/shared';

/**
 * Routing across one lake on its grid of water cells. Every cell knows how
 * far it lies from the shore; a crossing costs its length weighed by that.
 * Closer to the shore than a style's clearance gets steadily dearer, so a
 * route keeps off the bank and runs down the middle of anything narrower than
 * twice that: without it the cheapest line hugs every inner bend one grid
 * cell off the water's edge, which on the map reads as paddling over land.
 * With `shore` the open water beyond a band along the bank costs more too, so
 * the route follows the shore at a distance rather than on it. Water farther
 * out than half a boat's open-water limit costs so much that the route takes
 * it only when there is no other way.
 *
 * Two levels keep a large lake quick: the costs between the lake's portals
 * come from a coarse copy of the grid (a few ten thousand cells, however big
 * the lake), and only the line actually taken is searched on the fine grid,
 * by A* towards its end.
 */

/** How far off the shore each style keeps where the water is wide enough, in metres. */
const CLEARANCE_M: Readonly<Record<PaddleLakeStyle, number>> = { direct: 80, shore: 40 };
/** What a metre right at the shore costs on top, falling off squared to nothing at the clearance. */
const CLEARANCE_WEIGHT = 4;
/** With `shore`, open water costs more from here out, up to SHORE_FAR_M. */
const SHORE_NEAR_M = 100;
const SHORE_FAR_M = 350;
const SHORE_WEIGHT = 1.5;
/** Water beyond a boat's open-water reach costs this many times its length. */
const OVER_LIMIT_WEIGHT = 20;
/** How far a point off the grid may be from water cells to count as on the lake, in cells. */
const SNAP_CELLS = 6;
/** The coarse grid holds at most about this many cells. */
const COARSE_CELLS = 60_000;

const NEIGHBOURS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

export interface LakeProfile {
  style: PaddleLakeStyle;
  /** The widest open water the boat should cross, in metres. */
  maxCrossingM: number;
}

/** What a search needs of a grid: its size, which cells are water and what a cell costs per metre. */
interface Grid {
  width: number;
  height: number;
  cell: number;
  water: (cell: number) => boolean;
  weight: (cell: number) => number;
}

/** With `shore`, what open water costs on top: nothing up to SHORE_NEAR_M, rising to SHORE_WEIGHT at SHORE_FAR_M. */
function bandOf(shore: number, profile: LakeProfile): number {
  if (profile.style !== 'shore') return 0;
  return SHORE_WEIGHT * Math.min(1, Math.max(0, (shore - SHORE_NEAR_M) / (SHORE_FAR_M - SHORE_NEAR_M)));
}

function weightOf(shore: number, profile: LakeProfile): number {
  let weight = 1;
  const clearance = CLEARANCE_M[profile.style];
  if (shore < clearance) weight += CLEARANCE_WEIGHT * (1 - shore / clearance) ** 2;
  weight += bandOf(shore, profile);
  if (shore > profile.maxCrossingM / 2) weight *= OVER_LIMIT_WEIGHT;
  return weight;
}

/**
 * {@link weightOf} without the clearance: what the water costs for how far
 * out it lies. A shortcut is priced with this against the stretch of path it
 * replaces, and held to that stretch's distance from the shore (see `pull`),
 * so neither a leg's end at the bank, as every one from a river has, nor one
 * out on the lake lets a route the search kept along the shore, or within a
 * boat's reach, be pulled straight across the open water.
 */
function openWeightOf(shore: number, profile: LakeProfile): number {
  const weight = 1 + bandOf(shore, profile);
  return shore > profile.maxCrossingM / 2 ? weight * OVER_LIMIT_WEIGHT : weight;
}

function step(grid: Grid, at: number, each: (next: number, length: number) => void): void {
  const { width, height, cell } = grid;
  const col = at % width;
  const row = (at - col) / width;
  for (const [dc, dr, factor] of NEIGHBOURS) {
    const c = col + dc;
    const r = row + dr;
    if (c < 0 || r < 0 || c >= width || r >= height) continue;
    const next = r * width + c;
    if (!grid.water(next)) continue;
    // A diagonal step may not cut a corner of land.
    if (dc !== 0 && dr !== 0 && (!grid.water(row * width + c) || !grid.water(r * width + col))) continue;
    each(next, factor * cell);
  }
}

/** Weighted metres from one cell to every cell, stopping once all `targets` are settled. */
function dijkstra(grid: Grid, source: number, targets: ReadonlySet<number>): Float64Array {
  const cost = new Float64Array(grid.width * grid.height).fill(Infinity);
  const heap = new MinHeap(4096);
  cost[source] = 0;
  heap.push(source, 0);
  let remaining = targets.size;
  while (heap.size > 0 && remaining > 0) {
    const key = heap.peekKey();
    const at = heap.pop();
    if (key > (cost[at] as number)) continue;
    if (targets.has(at)) remaining--;
    const here = grid.weight(at);
    step(grid, at, (next, length) => {
      const via = (cost[at] as number) + ((here + grid.weight(next)) / 2) * length;
      if (via < (cost[next] as number)) {
        cost[next] = via;
        heap.push(next, via);
      }
    });
  }
  return cost;
}

/** The cheapest cell path between two cells, by A* with the straight distance as its guide; null when none. */
function astar(grid: Grid, from: number, to: number): number[] | null {
  const { width } = grid;
  const toCol = to % width;
  const toRow = (to - toCol) / width;
  const h = (cell: number) => {
    const dc = Math.abs((cell % width) - toCol);
    const dr = Math.abs(Math.floor(cell / width) - toRow);
    return (Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr)) * grid.cell;
  };
  const cost = new Float64Array(grid.width * grid.height).fill(Infinity);
  const parent = new Int32Array(grid.width * grid.height).fill(-1);
  const closed = new Uint8Array(grid.width * grid.height);
  const heap = new MinHeap(4096);
  cost[from] = 0;
  heap.push(from, h(from));
  while (heap.size > 0) {
    const at = heap.pop();
    if (closed[at]) continue;
    closed[at] = 1;
    if (at === to) {
      const cells = [to];
      for (let cell = to; cell !== from;) {
        cell = parent[cell] as number;
        cells.push(cell);
      }
      return cells.reverse();
    }
    const base = cost[at] as number;
    const here = grid.weight(at);
    step(grid, at, (next, length) => {
      const via = base + ((here + grid.weight(next)) / 2) * length;
      if (via < (cost[next] as number)) {
        cost[next] = via;
        parent[next] = at;
        heap.push(next, via + h(next));
      }
    });
  }
  return null;
}

export class LakeField {
  readonly frame: LocalFrame;
  private shore: Float32Array | null = null;
  private coarse: { factor: number; width: number; height: number; water: Uint8Array; shore: Float32Array } | null =
    null;

  constructor(readonly lake: LakeGrid) {
    this.frame = new LocalFrame(lake.lat0, lake.lng0);
  }

  get cells(): number {
    return this.lake.width * this.lake.height;
  }

  isWater(cell: number): boolean {
    return maskHas(this.lake, cell % this.lake.width, Math.floor(cell / this.lake.width));
  }

  /** The water cell at a point, or the nearest within SNAP_CELLS of it; -1 when none. */
  waterCellNear(lat: number, lng: number): number {
    const col = Math.floor(this.frame.x(lng) / this.lake.cell);
    const row = Math.floor(this.frame.y(lat) / this.lake.cell);
    let best = -1;
    let bestDistance = Infinity;
    for (let dr = -SNAP_CELLS; dr <= SNAP_CELLS; dr++) {
      for (let dc = -SNAP_CELLS; dc <= SNAP_CELLS; dc++) {
        const c = col + dc;
        const r = row + dr;
        if (!maskHas(this.lake, c, r)) continue;
        const distance = dr * dr + dc * dc;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = r * this.lake.width + c;
        }
      }
    }
    return best;
  }

  centre(cell: number): [number, number] {
    const col = cell % this.lake.width;
    const row = Math.floor(cell / this.lake.width);
    return [this.frame.lat((row + 0.5) * this.lake.cell), this.frame.lng((col + 0.5) * this.lake.cell)];
  }

  /** Every cell's distance to the nearest land cell, in metres (a chamfer transform, 3-4 weights). */
  shoreDistance(): Float32Array {
    if (this.shore) return this.shore;
    const { width, height, cell } = this.lake;
    const far = 1e9;
    const d = new Float32Array(width * height);
    for (let i = 0; i < d.length; i++) d[i] = this.isWater(i) ? far : 0;
    const relax = (i: number, j: number, w: number) => {
      const via = (d[j] as number) + w;
      if (via < (d[i] as number)) d[i] = via;
    };
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const i = r * width + c;
        if (d[i] === 0) continue;
        // Outside the grid is land too.
        if (r === 0 || c === 0 || r === height - 1 || c === width - 1) d[i] = Math.min(d[i] as number, 3);
        if (c > 0) relax(i, i - 1, 3);
        if (r > 0) {
          relax(i, i - width, 3);
          if (c > 0) relax(i, i - width - 1, 4);
          if (c < width - 1) relax(i, i - width + 1, 4);
        }
      }
    }
    for (let r = height - 1; r >= 0; r--) {
      for (let c = width - 1; c >= 0; c--) {
        const i = r * width + c;
        if (d[i] === 0) continue;
        if (c < width - 1) relax(i, i + 1, 3);
        if (r < height - 1) {
          relax(i, i + width, 3);
          if (c < width - 1) relax(i, i + width + 1, 4);
          if (c > 0) relax(i, i + width - 1, 4);
        }
      }
    }
    const scale = cell / 3;
    for (let i = 0; i < d.length; i++) d[i] = (d[i] as number) * scale;
    this.shore = d;
    return d;
  }

  private fine(profile: LakeProfile): Grid {
    const shore = this.shoreDistance();
    return {
      width: this.lake.width,
      height: this.lake.height,
      cell: this.lake.cell,
      water: (cell) => this.isWater(cell),
      weight: (cell) => weightOf(shore[cell] as number, profile),
    };
  }

  /**
   * The lake on a grid of blocks of `factor` cells a side: a block is water
   * when any of its cells is, and as far from the shore as its farthest cell.
   */
  private coarseGrid() {
    if (this.coarse) return this.coarse;
    const { width, height } = this.lake;
    const factor = Math.max(1, Math.ceil(Math.sqrt((width * height) / COARSE_CELLS)));
    const cw = Math.ceil(width / factor);
    const ch = Math.ceil(height / factor);
    const water = new Uint8Array(cw * ch);
    const shore = new Float32Array(cw * ch);
    const fine = this.shoreDistance();
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const i = r * width + c;
        if (!this.isWater(i)) continue;
        const block = Math.floor(r / factor) * cw + Math.floor(c / factor);
        water[block] = 1;
        shore[block] = Math.max(shore[block] as number, fine[i] as number);
      }
    }
    this.coarse = { factor, width: cw, height: ch, water, shore };
    return this.coarse;
  }

  private coarseOf(cell: number): number {
    const coarse = this.coarseGrid();
    const col = cell % this.lake.width;
    const row = (cell - col) / this.lake.width;
    return Math.floor(row / coarse.factor) * coarse.width + Math.floor(col / coarse.factor);
  }

  /**
   * Weighted metres from one cell to each of `targets`, read off the coarse
   * grid: close enough to choose between ways, and never less than the
   * straight distance. Infinity where a target cannot be reached.
   */
  costsTo(source: number, targets: readonly number[], profile: LakeProfile): number[] {
    const coarse = this.coarseGrid();
    const grid: Grid = {
      width: coarse.width,
      height: coarse.height,
      cell: this.lake.cell * coarse.factor,
      water: (cell) => coarse.water[cell] === 1,
      weight: (cell) => weightOf(coarse.shore[cell] as number, profile),
    };
    const blocks = targets.map((cell) => this.coarseOf(cell));
    const field = dijkstra(grid, this.coarseOf(source), new Set(blocks));
    const [sLat, sLng] = this.centre(source);
    return targets.map((cell, index) => {
      const reached = field[blocks[index] as number] as number;
      if (!Number.isFinite(reached)) return Infinity;
      const [lat, lng] = this.centre(cell);
      const straight = Math.hypot(this.frame.x(lng) - this.frame.x(sLng), this.frame.y(lat) - this.frame.y(sLat));
      return Math.max(reached, straight);
    });
  }

  /**
   * The line from one cell to another as a paddler would take it: the
   * cheapest cell path, then pulled straight wherever a straight line stays on
   * water, costs no more than the stretch it replaces and comes no nearer the
   * shore than that stretch.
   */
  path(from: number, to: number, profile: LakeProfile): Array<[number, number]> | null {
    const cells = astar(this.fine(profile), from, to);
    if (!cells) return null;
    return this.pull(cells, profile).map((cell) => this.centre(cell));
  }

  /**
   * Straightens a cell path. A shortcut may cost no more on open water than
   * the stretch of path it replaces, and may not run nearer the shore than
   * that stretch (up to the style's clearance): pulling a line taut otherwise
   * draws it onto the bank the path kept off, or straight over the water the
   * search went round.
   */
  private pull(cells: number[], profile: LakeProfile): number[] {
    const shore = this.shoreDistance();
    const clearance = CLEARANCE_M[profile.style];
    const depth = (cell: number) => Math.min(clearance, shore[cell] as number);
    const open = (cell: number) => openWeightOf(shore[cell] as number, profile);
    const { width, cell: size } = this.lake;
    // What the path costs on open water from its first cell up to each cell.
    const along = [0];
    for (let i = 1; i < cells.length; i++) {
      const from = cells[i - 1] as number;
      const to = cells[i] as number;
      const step =
        Math.abs((to % width) - (from % width)) + Math.abs(Math.floor(to / width) - Math.floor(from / width));
      along.push((along[i - 1] as number) + ((open(from) + open(to)) / 2) * size * (step === 2 ? Math.SQRT2 : 1));
    }
    const kept = [cells[0] as number];
    let anchor = 0;
    let floor = depth(cells[0] as number);
    for (let i = 2; i < cells.length; i++) {
      floor = Math.min(floor, depth(cells[i - 1] as number), depth(cells[i] as number));
      const budget = ((along[i] as number) - (along[anchor] as number)) * 1.05;
      if (!this.clear(cells[anchor] as number, cells[i] as number, profile, floor, budget)) {
        kept.push(cells[i - 1] as number);
        anchor = i - 1;
        floor = Math.min(depth(cells[i - 1] as number), depth(cells[i] as number));
      }
    }
    if (cells.length > 1) kept.push(cells[cells.length - 1] as number);
    return kept;
  }

  /**
   * Whether a straight line between two cells runs on water, costs no more
   * than `budget` on open water ({@link openWeightOf}) and comes nowhere
   * nearer the shore than `floor` (less half a cell, for the line's rounding
   * onto cells).
   */
  private clear(a: number, b: number, profile: LakeProfile, floor: number, budget: number): boolean {
    const shore = this.shoreDistance();
    const open = (cell: number) => openWeightOf(shore[cell] as number, profile);
    const least = floor - this.lake.cell / 2;
    const { width } = this.lake;
    const ac = a % width;
    const ar = (a - ac) / width;
    const bc = b % width;
    const br = (b - bc) / width;
    const steps = Math.max(Math.abs(bc - ac), Math.abs(br - ar)) * 2;
    // Each sample stands for its share of the line; the two ends for half a share each.
    const share = (Math.hypot(bc - ac, br - ar) * this.lake.cell) / steps;
    let cost = ((open(a) + open(b)) / 2) * share;
    for (let s = 1; s < steps; s++) {
      const c = Math.round(ac + ((bc - ac) * s) / steps);
      const r = Math.round(ar + ((br - ar) * s) / steps);
      const cell = r * width + c;
      cost += open(cell) * share;
      if (!this.isWater(cell) || cost > budget || (shore[cell] as number) < least) return false;
    }
    return true;
  }
}
