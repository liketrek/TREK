import type { PaddleRegionGraphStats } from '@trek/shared';

import { createHash } from 'node:crypto';

/**
 * The water network of one region, as the router holds it: nodes where waters
 * meet, end or are barred, edges along the rivers and canals between them
 * (each with its line in a shared pool of points), the portages and gaps the
 * builder added, and every lake as a grid of water cells. Plain typed arrays,
 * so a region loads from its file in one read and costs a few bytes a point.
 */

const GRAPH_FORMAT = 2;

/** `pass` is a boat pass beside a weir (waterway=canoe_pass): paddled, and worth telling the paddler about. */
export const EdgeKind = { water: 0, portage: 1, gap: 2, lock: 3, connector: 4, pass: 5 } as const;
export type EdgeKindCode = (typeof EdgeKind)[keyof typeof EdgeKind];

/** Who may paddle an edge: anyone, nobody (canoe=no, private), or anyone at a cost (discouraged). */
export const Access = { open: 0, closed: 1, discouraged: 2 } as const;

export const PortageSource = { tagged: 0, footway: 1, inferred: 2 } as const;

export interface LakeGrid {
  name: string | null;
  /** The grid's south-west corner and its cell size in metres. */
  lat0: number;
  lng0: number;
  cell: number;
  width: number;
  height: number;
  /** One bit per cell, row by row from the south: set where the cell is water. */
  mask: Uint8Array;
  /** The nodes through which the network enters and leaves the lake. */
  portals: Int32Array;
  /** Hectares of water, for the stats and for keeping small ponds out. */
  hectares: number;
}

export interface WaterGraphData {
  regionId: string;
  sourceTimestamp: string | null;
  nodeLat: Float64Array;
  nodeLng: Float64Array;
  /** The lake a node is a portal of, or -1. */
  nodeLake: Int32Array;
  edgeA: Uint32Array;
  edgeB: Uint32Array;
  edgeLength: Float32Array;
  edgeKind: Uint8Array;
  /** 1 when the water flows from a to b (a river drawn downstream), 0 on still water. */
  edgeFlow: Uint8Array;
  /** The current, km/h, where the water flows. */
  edgeCurrent: Float32Array;
  edgeAccess: Uint8Array;
  /** 1 when a boat may only go from a to b (oneway:canoe). */
  edgeOneway: Uint8Array;
  /** The whitewater grade, 0 when the data gives none. */
  edgeGrade: Uint8Array;
  edgeGeomStart: Uint32Array;
  edgeGeomCount: Uint32Array;
  edgeName: Int32Array;
  edgeRef: Int32Array;
  edgeSource: Uint8Array;
  /** Every edge's points, [lat, lng] pairs one after another, a to b. */
  pool: Float64Array;
  strings: string[];
  lakes: LakeGrid[];
  stats: PaddleRegionGraphStats;
}

const MAGIC = 'TREKWG';

type ArrayName = Exclude<
  {
    [K in keyof WaterGraphData]: WaterGraphData[K] extends ArrayBufferView ? K : never;
  }[keyof WaterGraphData],
  undefined
>;

const ARRAYS: ReadonlyArray<[ArrayName, string]> = [
  ['nodeLat', 'f64'],
  ['nodeLng', 'f64'],
  ['nodeLake', 'i32'],
  ['edgeA', 'u32'],
  ['edgeB', 'u32'],
  ['edgeLength', 'f32'],
  ['edgeKind', 'u8'],
  ['edgeFlow', 'u8'],
  ['edgeCurrent', 'f32'],
  ['edgeAccess', 'u8'],
  ['edgeOneway', 'u8'],
  ['edgeGrade', 'u8'],
  ['edgeGeomStart', 'u32'],
  ['edgeGeomCount', 'u32'],
  ['edgeName', 'i32'],
  ['edgeRef', 'i32'],
  ['edgeSource', 'u8'],
  ['pool', 'f64'],
];

const VIEWS = {
  f64: Float64Array,
  f32: Float32Array,
  i32: Int32Array,
  u32: Uint32Array,
  u8: Uint8Array,
} as const;

function padTo8(length: number): number {
  return (length + 7) & ~7;
}

/**
 * The graph as one file: a magic, the length of a JSON head, the head (sizes,
 * offsets, strings, lake frames) and the arrays, each aligned to 8 bytes.
 * The same graph always gives the same bytes, so its hash names its revision.
 */
export function encodeWaterGraph(graph: WaterGraphData): { bytes: Buffer; rev: string } {
  const chunks: Buffer[] = [];
  let offset = 0;
  const sections: Array<{ name: string; type: string; offset: number; length: number }> = [];
  const add = (name: string, type: string, view: ArrayBufferView) => {
    const raw = Buffer.from(view.buffer, view.byteOffset, view.byteLength);
    const padded = Buffer.alloc(padTo8(raw.length));
    raw.copy(padded);
    sections.push({ name, type, offset, length: view.byteLength });
    chunks.push(padded);
    offset += padded.length;
  };
  for (const [name, type] of ARRAYS) add(name, type, graph[name]);
  graph.lakes.forEach((lake, index) => {
    add(`lake${index}.mask`, 'u8', lake.mask);
    add(`lake${index}.portals`, 'i32', lake.portals);
  });
  const head = Buffer.from(
    JSON.stringify({
      format: GRAPH_FORMAT,
      regionId: graph.regionId,
      sourceTimestamp: graph.sourceTimestamp,
      strings: graph.strings,
      stats: graph.stats,
      lakes: graph.lakes.map(({ name, lat0, lng0, cell, width, height, hectares }) => ({
        name,
        lat0,
        lng0,
        cell,
        width,
        height,
        hectares,
      })),
      sections,
    }),
    'utf8',
  );
  const prefix = Buffer.alloc(padTo8(MAGIC.length + 4 + head.length));
  prefix.write(MAGIC, 0, 'latin1');
  prefix.writeUInt32LE(head.length, MAGIC.length);
  head.copy(prefix, MAGIC.length + 4);
  const bytes = Buffer.concat([prefix, ...chunks]);
  return { bytes, rev: createHash('sha256').update(bytes).digest('hex').slice(0, 16) };
}

interface Head {
  format: number;
  regionId: string;
  sourceTimestamp: string | null;
  strings: string[];
  stats: PaddleRegionGraphStats;
  lakes: Array<Omit<LakeGrid, 'mask' | 'portals'>>;
  sections: Array<{ name: string; type: keyof typeof VIEWS; offset: number; length: number }>;
}

export function decodeWaterGraph(bytes: Buffer): WaterGraphData {
  if (bytes.toString('latin1', 0, MAGIC.length) !== MAGIC) throw new Error('Not a water graph');
  const headLength = bytes.readUInt32LE(MAGIC.length);
  const head = JSON.parse(bytes.toString('utf8', MAGIC.length + 4, MAGIC.length + 4 + headLength)) as Head;
  if (head.format !== GRAPH_FORMAT) throw new Error(`Water graph format ${head.format} is not ${GRAPH_FORMAT}`);
  const base = padTo8(MAGIC.length + 4 + headLength);
  // Copied out of the file buffer, so every view starts aligned whatever Node's pool did with it.
  const arrays = new Map<string, ArrayBufferView>();
  for (const section of head.sections) {
    const View = VIEWS[section.type];
    const copy = new Uint8Array(section.length);
    copy.set(bytes.subarray(base + section.offset, base + section.offset + section.length));
    arrays.set(section.name, new View(copy.buffer, 0, section.length / View.BYTES_PER_ELEMENT));
  }
  const take = <T extends ArrayBufferView>(name: string): T => {
    const view = arrays.get(name);
    if (!view) throw new Error(`Water graph lacks ${name}`);
    return view as T;
  };
  const graph = {
    regionId: head.regionId,
    sourceTimestamp: head.sourceTimestamp,
    strings: head.strings,
    stats: head.stats,
    lakes: head.lakes.map((lake, index) => ({
      ...lake,
      mask: take<Uint8Array>(`lake${index}.mask`),
      portals: take<Int32Array>(`lake${index}.portals`),
    })),
  } as Partial<WaterGraphData>;
  for (const [name] of ARRAYS) (graph as Record<string, unknown>)[name] = take(name);
  return graph as WaterGraphData;
}
