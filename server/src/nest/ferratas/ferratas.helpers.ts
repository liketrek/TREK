import {
  FERRATAS_RESULT_CAP,
  ferrataTileBlockKey,
  type Ferrata,
  type FerrataBbox,
  type FerrataGrade,
} from '@trek/shared';

import { z } from 'zod';

/**
 * Pure pieces of the via ferrata lookup: the Overpass query, the tile grid, the
 * grade parser and the mapping from Overpass elements to the wire rows. Kept
 * free of I/O so the service and its tests share them.
 */

/** How long Overpass itself may work on one query, in seconds (`[timeout:N]`). */
export const FERRATA_QUERY_TIMEOUT_S = 15;

/** The grid the box is snapped outwards to; one cell of it is the unit the answers are stored by. */
const GRID_DEG = 0.05;

const GRADE_RE = /^([0-6])([+-])?$/;
const RAW_GRADE_MAX = 64;
const NAME_MAX = 500;

/**
 * `via_ferrata_scale` as tagged. Only the OSM 0 to 6 scale, with an optional
 * `+` or `-`, gets a level; a letter scale ("C/D") or free text keeps its raw
 * value and reads as unknown. Letters are deliberately not converted.
 */
export function parseFerrataGrade(raw: string | undefined): FerrataGrade {
  const value = raw?.trim() ?? '';
  if (value === '') return { raw: null, level: null, plus: null };
  const match = GRADE_RE.exec(value);
  if (!match) return { raw: value.slice(0, RAW_GRADE_MAX), level: null, plus: null };
  const sign = match[2];
  return { raw: value, level: Number(match[1]), plus: sign === '+' || sign === '-' ? sign : null };
}

const snapDown = (v: number) => Math.floor(v / GRID_DEG + 1e-9) * GRID_DEG;
const snapUp = (v: number) => Math.ceil(v / GRID_DEG - 1e-9) * GRID_DEG;
const fixed = (v: number) => Number(v.toFixed(2));

/**
 * The box grown outwards to the 0.05 degree grid and clamped to the globe,
 * so it is made of whole cells.
 */
export function snapFerrataBbox(bbox: FerrataBbox): FerrataBbox {
  return {
    south: fixed(Math.max(-90, snapDown(bbox.south))),
    west: fixed(Math.max(-180, snapDown(bbox.west))),
    north: fixed(Math.min(90, snapUp(bbox.north))),
    east: fixed(Math.min(180, snapUp(bbox.east))),
  };
}

/**
 * The grid cells a box covers, as tile keys (`"<lat index>,<lng index>"`, the
 * cell's south-west corner divided by the grid), south to north and west to
 * east. The box is snapped outwards first, so every cell is whole. `null` when
 * the box covers more than `max` cells: the caller refuses it rather than
 * walking a grid it never meant to ask for.
 */
export function ferrataTileKeysFor(bbox: FerrataBbox, max: number): string[] | null {
  const snapped = snapFerrataBbox(bbox);
  const lat0 = Math.round(snapped.south / GRID_DEG);
  const lat1 = Math.round(snapped.north / GRID_DEG);
  const lng0 = Math.round(snapped.west / GRID_DEG);
  const lng1 = Math.round(snapped.east / GRID_DEG);
  if ((lat1 - lat0) * (lng1 - lng0) > max) return null;
  const keys: string[] = [];
  for (let lat = lat0; lat < lat1; lat += 1) {
    for (let lng = lng0; lng < lng1; lng += 1) keys.push(tileKey(lat, lng));
  }
  return keys;
}

const tileKey = (lat: number, lng: number) => `${lat},${lng}`;

function tileIndices(key: string): [number, number] {
  const parts = key.split(',').map(Number);
  const lat = parts[0] ?? Number.NaN;
  const lng = parts[1] ?? Number.NaN;
  if (parts.length !== 2 || !Number.isInteger(lat) || !Number.isInteger(lng)) {
    throw new Error(`Not a ferrata tile key: ${key}`);
  }
  return [lat, lng];
}

/** The one box around every given cell, which is what a batch asks Overpass for. */
export function ferrataTilesBbox(keys: readonly string[]): FerrataBbox {
  if (keys.length === 0) throw new Error('No ferrata tiles to bound');
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const key of keys) {
    const [lat, lng] = tileIndices(key);
    south = Math.min(south, lat);
    west = Math.min(west, lng);
    north = Math.max(north, lat + 1);
    east = Math.max(east, lng + 1);
  }
  return {
    south: fixed(Math.max(-90, south * GRID_DEG)),
    west: fixed(Math.max(-180, west * GRID_DEG)),
    north: fixed(Math.min(90, north * GRID_DEG)),
    east: fixed(Math.min(180, east * GRID_DEG)),
  };
}

/**
 * The cells grouped into the grid-aligned blocks of FERRATA_TILES_PER_REQUEST_SIDE
 * cells a side that one Overpass query covers (the blocks the client asks in),
 * each block's cells in the order given.
 */
export function ferrataTileBlocks(keys: readonly string[]): string[][] {
  const blocks = new Map<string, string[]>();
  for (const key of keys) {
    const [lat, lng] = tileIndices(key);
    const block = ferrataTileBlockKey(lat, lng);
    const cells = blocks.get(block);
    if (cells) cells.push(key);
    else blocks.set(block, [key]);
  }
  return [...blocks.values()];
}

/** The grid rows (or columns) a coordinate lies in: two when it sits on the line between them. */
function gridIndices(value: number): number[] {
  const steps = value / GRID_DEG;
  const nearest = Math.round(steps);
  return Math.abs(steps - nearest) < 1e-9 ? [nearest - 1, nearest] : [Math.floor(steps)];
}

/**
 * The ferratas of one Overpass answer, handed to every cell among `keys` that
 * a point of their line lies in (a point on a cell edge counts for both
 * cells). A cell no ferrata touches gets an empty list, which is an answer
 * too: it is stored, so the cell is not asked for again.
 */
export function splitFerratasByTile(ferratas: readonly Ferrata[], keys: ReadonlySet<string>): Map<string, Ferrata[]> {
  const byTile = new Map<string, Ferrata[]>();
  for (const key of keys) byTile.set(key, []);
  for (const ferrata of ferratas) {
    const touched = new Set<string>();
    for (const [lat, lng] of ferrata.geometry) {
      for (const row of gridIndices(lat)) {
        for (const column of gridIndices(lng)) touched.add(tileKey(row, column));
      }
    }
    for (const key of touched) byTile.get(key)?.push(ferrata);
  }
  return byTile;
}

/**
 * Ways tagged as a via ferrata, paths and footways carrying a
 * `via_ferrata_scale`, and the member ways of `route=via_ferrata` relations,
 * all inside the box, with their geometry. The relations go out with their
 * members so a way can be given its route's name. One more way than the cap
 * is asked for, which is how the answer knows it was cut.
 */
export function buildFerrataQuery(bbox: FerrataBbox): string {
  const box = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
  return [
    `[out:json][timeout:${FERRATA_QUERY_TIMEOUT_S}];`,
    `rel["route"="via_ferrata"]${box}->.routes;`,
    '(',
    `  way["highway"="via_ferrata"]${box};`,
    `  way["highway"~"^(path|footway)$"]["via_ferrata_scale"]${box};`,
    `  way(r.routes)${box};`,
    ')->.ways;',
    `.ways out geom qt ${FERRATAS_RESULT_CAP + 1};`,
    '.routes out body qt;',
  ].join('\n');
}

const osmId = z.number().int().positive();
const tags = z.record(z.string(), z.string()).optional();
const point = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });

const wayElementSchema = z.object({
  type: z.literal('way'),
  id: osmId,
  tags,
  // A point Overpass could not place comes back as null; it is dropped below.
  geometry: z.array(point.nullable()).max(20000).optional(),
});
const relationElementSchema = z.object({
  type: z.literal('relation'),
  id: osmId,
  tags,
  members: z
    .array(z.object({ type: z.string(), ref: z.number().int() }))
    .max(10000)
    .optional(),
});
const elementSchema = z.discriminatedUnion('type', [wayElementSchema, relationElementSchema]);
type WayElement = z.infer<typeof wayElementSchema>;
type RelationElement = z.infer<typeof relationElementSchema>;

/** What an Overpass mirror answers with, at the boundary. */
function cleanName(value: string | undefined): string | null {
  const name = value?.trim() ?? '';
  return name === '' ? null : name.slice(0, NAME_MAX);
}

/** way id -> the name of the first named via ferrata route that holds it. */
function routeNamesByWay(relations: RelationElement[]): Map<number, string> {
  const names = new Map<number, string>();
  for (const relation of relations) {
    const name = cleanName(relation.tags?.name);
    if (!name) continue;
    for (const member of relation.members ?? []) {
      if (member.type === 'way' && !names.has(member.ref)) names.set(member.ref, name);
    }
  }
  return names;
}

function toFerrata(way: WayElement, routeName: string | null): Ferrata | null {
  const geometry = (way.geometry ?? [])
    .filter((p): p is z.infer<typeof point> => p !== null)
    .map((p): [number, number] => [p.lat, p.lon]);
  if (geometry.length < 2) return null;
  return {
    id: `way/${way.id}`,
    name: cleanName(way.tags?.name),
    grade: parseFerrataGrade(way.tags?.via_ferrata_scale),
    routeName,
    geometry,
    osmUrl: `https://www.openstreetmap.org/way/${way.id}`,
  };
}

/**
 * The wire rows out of the raw elements. An element that does not have the
 * shape asked for is left out rather than failing the whole answer, and so is
 * a way with fewer than two placed points: neither can be drawn.
 *
 * `truncated` counts the way elements Overpass sent, before any of that
 * filtering: the query asks for one past the cap, so a box that hit Overpass's
 * limit stays marked as cut even when a dropped way brings the rows under it.
 */
export function toFerratas(elements: unknown[]): { ferratas: Ferrata[]; truncated: boolean } {
  const ways: WayElement[] = [];
  const relations: RelationElement[] = [];
  let rawWays = 0;
  for (const raw of elements) {
    if ((raw as { type?: unknown } | null)?.type === 'way') rawWays += 1;
    const parsed = elementSchema.safeParse(raw);
    if (!parsed.success) continue;
    if (parsed.data.type === 'way') ways.push(parsed.data);
    else relations.push(parsed.data);
  }
  const routeNames = routeNamesByWay(relations);
  const seen = new Set<number>();
  const ferratas: Ferrata[] = [];
  for (const way of ways) {
    if (seen.has(way.id)) continue;
    seen.add(way.id);
    const ferrata = toFerrata(way, routeNames.get(way.id) ?? null);
    if (ferrata) ferratas.push(ferrata);
  }
  return { ferratas: ferratas.slice(0, FERRATAS_RESULT_CAP), truncated: rawWays > FERRATAS_RESULT_CAP };
}
