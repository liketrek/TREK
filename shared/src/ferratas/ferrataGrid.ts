import type { FerrataBbox } from './ferratas.schema';

/**
 * The tile grid of the via ferrata layer, shared by both ends.
 *
 * The server caches Overpass answers per box snapped outwards to this grid,
 * and the client loads, keeps and persists the layer per tile of it. One cell
 * size on both sides means a box the client asks for is always a whole
 * number of cells, which is exactly a cache entry on the server.
 *
 * A tile is named by its row and column: row = floor(lat / 0.05), column =
 * floor(lng / 0.05). Pure, no I/O.
 */

/** The cell size, in degrees, on both axes. */
export const FERRATA_TILE_DEG = 0.05;

/**
 * The most tiles one Overpass query covers per side: two, a box of 0.1 degree.
 * A box of that size answers in a second or two, where one of half a degree
 * often ran into the mirrors' timeout. The client asks in blocks of this size
 * and the server queries Overpass in the same blocks, both aligned to the
 * grid (a block starts at a row and a column divisible by it), so one request
 * of the client is exactly one query of the server.
 */
export const FERRATA_TILES_PER_REQUEST_SIDE = 2;

/** Room for float noise when an edge sits exactly on a grid line (46.15 / 0.05 is 922.9999999999999). */
const GRID_EPSILON = 1e-9;

const MIN_ROW = Math.round(-90 / FERRATA_TILE_DEG);
const MAX_ROW = Math.round(90 / FERRATA_TILE_DEG) - 1;
const MIN_COL = Math.round(-180 / FERRATA_TILE_DEG);
const MAX_COL = Math.round(180 / FERRATA_TILE_DEG) - 1;

export interface FerrataTile {
  row: number;
  col: number;
}

/** A rectangle of tiles, both ends inclusive. */
export interface FerrataTileRange {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const snapDown = (v: number) => Math.floor(v / FERRATA_TILE_DEG + GRID_EPSILON) * FERRATA_TILE_DEG;
const snapUp = (v: number) => Math.ceil(v / FERRATA_TILE_DEG - GRID_EPSILON) * FERRATA_TILE_DEG;
/** Every grid line is a multiple of 0.05, so two decimals write it exactly. */
const fixed = (v: number) => Number(v.toFixed(2));

/**
 * The box grown outwards to the grid and clamped to the globe. The server
 * queries Overpass for this box and caches the answer under it.
 */
export function snapFerrataBbox(bbox: FerrataBbox): FerrataBbox {
  return {
    south: fixed(Math.max(-90, snapDown(bbox.south))),
    west: fixed(Math.max(-180, snapDown(bbox.west))),
    north: fixed(Math.min(90, snapUp(bbox.north))),
    east: fixed(Math.min(180, snapUp(bbox.east))),
  };
}

/** The tile a point lies in; a point on a grid line belongs to the tile north and east of it. */
export function ferrataTileAt(lat: number, lng: number): FerrataTile {
  return {
    row: clamp(Math.floor(lat / FERRATA_TILE_DEG + GRID_EPSILON), MIN_ROW, MAX_ROW),
    col: clamp(Math.floor(lng / FERRATA_TILE_DEG + GRID_EPSILON), MIN_COL, MAX_COL),
  };
}

/** The tile's stable name, as it is kept in memory and in IndexedDB. */
export function ferrataTileKey(tile: FerrataTile): string {
  return `${tile.row}:${tile.col}`;
}

/** The tile a key names, or null for anything that is not one. */
export function parseFerrataTileKey(key: string): FerrataTile | null {
  const match = /^(-?\d+):(-?\d+)$/.exec(key);
  if (!match) return null;
  const row = Number(match[1]);
  const col = Number(match[2]);
  if (row < MIN_ROW || row > MAX_ROW || col < MIN_COL || col > MAX_COL) return null;
  return { row, col };
}

/** The tiles a box touches, as a range. A box on a grid line does not reach into the next row or column. */
export function ferrataTileRange(bbox: FerrataBbox): FerrataTileRange {
  const sw = ferrataTileAt(bbox.south, bbox.west);
  const lastRow = Math.ceil(bbox.north / FERRATA_TILE_DEG - GRID_EPSILON) - 1;
  const lastCol = Math.ceil(bbox.east / FERRATA_TILE_DEG - GRID_EPSILON) - 1;
  return {
    minRow: sw.row,
    maxRow: clamp(Math.max(sw.row, lastRow), MIN_ROW, MAX_ROW),
    minCol: sw.col,
    maxCol: clamp(Math.max(sw.col, lastCol), MIN_COL, MAX_COL),
  };
}

/** The range grown by `rings` tiles on every side, inside the globe. */
export function growFerrataTileRange(range: FerrataTileRange, rings: number): FerrataTileRange {
  return {
    minRow: clamp(range.minRow - rings, MIN_ROW, MAX_ROW),
    maxRow: clamp(range.maxRow + rings, MIN_ROW, MAX_ROW),
    minCol: clamp(range.minCol - rings, MIN_COL, MAX_COL),
    maxCol: clamp(range.maxCol + rings, MIN_COL, MAX_COL),
  };
}

/** How many tiles a range holds. */
export function ferrataTileCount(range: FerrataTileRange): number {
  return (range.maxRow - range.minRow + 1) * (range.maxCol - range.minCol + 1);
}

/** Every tile of a range, row by row from the south west. */
export function ferrataTilesOf(range: FerrataTileRange): FerrataTile[] {
  const tiles: FerrataTile[] = [];
  for (let row = range.minRow; row <= range.maxRow; row += 1) {
    for (let col = range.minCol; col <= range.maxCol; col += 1) tiles.push({ row, col });
  }
  return tiles;
}

/** The box a range of tiles covers, edges on the grid. */
export function ferrataTileRangeBbox(range: FerrataTileRange): FerrataBbox {
  return {
    south: fixed(Math.max(-90, range.minRow * FERRATA_TILE_DEG)),
    west: fixed(Math.max(-180, range.minCol * FERRATA_TILE_DEG)),
    north: fixed(Math.min(90, (range.maxRow + 1) * FERRATA_TILE_DEG)),
    east: fixed(Math.min(180, (range.maxCol + 1) * FERRATA_TILE_DEG)),
  };
}

/** The smallest range holding every tile, or null for none. */
function enclosing(tiles: readonly FerrataTile[]): FerrataTileRange | null {
  if (tiles.length === 0) return null;
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;
  for (const { row, col } of tiles) {
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }
  return { minRow, maxRow, minCol, maxCol };
}

/** One request: the box to ask for and the range of tiles its answer completes. */
export interface FerrataTileRequest {
  bbox: FerrataBbox;
  range: FerrataTileRange;
}

/** The grid-aligned block of FERRATA_TILES_PER_REQUEST_SIDE tiles a side that a tile falls in. */
export function ferrataTileBlockKey(row: number, col: number): string {
  const side = FERRATA_TILES_PER_REQUEST_SIDE;
  return `${Math.floor(row / side)}:${Math.floor(col / side)}`;
}

/**
 * The requests that load `tiles`: one per grid-aligned block of
 * FERRATA_TILES_PER_REQUEST_SIDE tiles a side that holds any of them, each box
 * shrunk to the tiles it holds. Every box is a whole number of tiles and well
 * within the server's span limit, so none is refused, each answer completes
 * every tile its box covers, and the server answers it with one query.
 */
export function ferrataTileRequests(tiles: readonly FerrataTile[]): FerrataTileRequest[] {
  const blocks = new Map<string, FerrataTile[]>();
  for (const tile of tiles) {
    const key = ferrataTileBlockKey(tile.row, tile.col);
    const block = blocks.get(key);
    if (block) block.push(tile);
    else blocks.set(key, [tile]);
  }
  const requests: FerrataTileRequest[] = [];
  for (const block of blocks.values()) {
    const range = enclosing(block);
    if (range) requests.push({ bbox: ferrataTileRangeBbox(range), range });
  }
  return requests;
}
