import { NO_STRING, SGR_FORMAT, SGR_MAGIC, type SkiGraphData, type SkiGraphHeader } from './ski-graph.contract';

import { crc32, gunzipSync } from 'node:zlib';

/**
 * The reader of SGR1 (`ski-graph.contract.ts`). Little-endian throughout: the
 * magic, the length of a JSON head, the head, zero bytes up to the next
 * multiple of 8 from the start of the file, then every section in a fixed
 * order, each padded to 8 bytes, and last the string pool. The head's `crc32`
 * covers every byte after the head's padding, so a damaged or cut file is
 * refused before any of it is used.
 */

type SectionArray = keyof Omit<SkiGraphData, 'header' | 'strings'>;
type Count = 'n' | 'e' | 'e1' | 'g';

const VIEWS = {
  i32: Int32Array,
  i16: Int16Array,
  u16: Uint16Array,
  u32: Uint32Array,
  u8: Uint8Array,
  f32: Float32Array,
  f64: Float64Array,
} as const;

/** The sections in the writer's order (`SECTIONS` in `winter/sgr.py`), with their element type and length. */
const SECTIONS: ReadonlyArray<readonly [SectionArray, keyof typeof VIEWS, Count]> = [
  ['nodeLatE7', 'i32', 'n'],
  ['nodeLngE7', 'i32', 'n'],
  ['nodeEle', 'i16', 'n'],
  ['nodeFlags', 'u16', 'n'],
  ['nodeOsm', 'f64', 'n'],
  ['edgeA', 'u32', 'e'],
  ['edgeB', 'u32', 'e'],
  ['edgeLen', 'f32', 'e'],
  ['edgeUp', 'u16', 'e'],
  ['edgeDown', 'u16', 'e'],
  ['edgeKind', 'u8', 'e'],
  ['edgeFwdUses', 'u16', 'e'],
  ['edgeBackUses', 'u16', 'e'],
  ['edgeDiff', 'u8', 'e'],
  ['edgeGroom', 'u8', 'e'],
  ['edgeLift', 'u8', 'e'],
  ['edgeLiftSec', 'u16', 'e'],
  ['edgeLiftCap', 'u16', 'e'],
  ['edgeFlags', 'u32', 'e'],
  ['edgeName', 'u32', 'e'],
  ['edgeRef', 'u32', 'e'],
  ['edgeWay', 'f64', 'e'],
  ['edgeGeomOff', 'u32', 'e1'],
  ['geomLatE7', 'i32', 'g'],
  ['geomLngE7', 'i32', 'g'],
  ['geomEle', 'i16', 'g'],
];

/** Why a file was refused; `format` marks a file of a format this build does not read, which keeps the old one. */
export class SkiGraphFormatError extends Error {
  constructor(
    message: string,
    readonly unknownFormat = false,
  ) {
    super(message);
    this.name = 'SkiGraphFormatError';
  }
}

const padTo8 = (offset: number): number => (offset + 7) & ~7;

function count(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new SkiGraphFormatError(`SGR1 head has no valid ${what}`);
  }
  return value;
}

function readHeader(bytes: Buffer): { header: SkiGraphHeader; bodyStart: number } {
  if (bytes.length < 8 || bytes.toString('latin1', 0, 4) !== SGR_MAGIC) {
    throw new SkiGraphFormatError('Not an SGR1 file');
  }
  const headLength = bytes.readUInt32LE(4);
  if (8 + headLength > bytes.length) throw new SkiGraphFormatError('SGR1 head runs past the end of the file');
  let head: unknown;
  try {
    head = JSON.parse(bytes.toString('utf8', 8, 8 + headLength));
  } catch {
    throw new SkiGraphFormatError('SGR1 head is not JSON');
  }
  if (typeof head !== 'object' || head === null) throw new SkiGraphFormatError('SGR1 head is not an object');
  const header = head as SkiGraphHeader;
  if (header.format !== SGR_FORMAT) {
    throw new SkiGraphFormatError(`SGR1 format ${String(header.format)} is not ${SGR_FORMAT}`, true);
  }
  count(header.nodeCount, 'node count');
  count(header.edgeCount, 'edge count');
  count(header.geomCount, 'point count');
  count(header.stringBytes, 'string pool size');
  count(header.crc32, 'checksum');
  return { header, bodyStart: padTo8(8 + headLength) };
}

/** An area's graph from the bytes of its SGR1 file. Throws {@link SkiGraphFormatError} on anything amiss. */
export function decodeSkiGraph(bytes: Buffer): SkiGraphData {
  const { header, bodyStart } = readHeader(bytes);
  if (bodyStart > bytes.length) throw new SkiGraphFormatError('SGR1 file ends inside its head');
  if (crc32(bytes.subarray(bodyStart)) >>> 0 !== header.crc32) {
    throw new SkiGraphFormatError('SGR1 checksum differs');
  }
  const sizes: Record<Count, number> = {
    n: header.nodeCount,
    e: header.edgeCount,
    e1: header.edgeCount + 1,
    g: header.geomCount,
  };
  const arrays = new Map<SectionArray, ArrayBufferView>();
  let offset = bodyStart;
  for (const [name, type, length] of SECTIONS) {
    const View = VIEWS[type];
    const byteLength = sizes[length] * View.BYTES_PER_ELEMENT;
    if (offset + byteLength > bytes.length) {
      throw new SkiGraphFormatError(`SGR1 section ${name} runs past the end`);
    }
    // Copied out of the file's buffer, so every view starts aligned whatever Node's pool did with it.
    const copy = new Uint8Array(byteLength);
    copy.set(bytes.subarray(offset, offset + byteLength));
    arrays.set(name, new View(copy.buffer, 0, sizes[length]));
    offset = padTo8(offset + byteLength);
  }
  if (offset + header.stringBytes > bytes.length) {
    throw new SkiGraphFormatError('SGR1 string pool runs past the end');
  }
  const strings = Uint8Array.from(bytes.subarray(offset, offset + header.stringBytes));
  const take = <T extends ArrayBufferView>(name: SectionArray): T => {
    const view = arrays.get(name);
    if (!view) throw new SkiGraphFormatError(`SGR1 lacks ${name}`);
    return view as T;
  };
  const graph: SkiGraphData = {
    header,
    nodeLatE7: take('nodeLatE7'),
    nodeLngE7: take('nodeLngE7'),
    nodeEle: take('nodeEle'),
    nodeFlags: take('nodeFlags'),
    nodeOsm: take('nodeOsm'),
    edgeA: take('edgeA'),
    edgeB: take('edgeB'),
    edgeLen: take('edgeLen'),
    edgeUp: take('edgeUp'),
    edgeDown: take('edgeDown'),
    edgeKind: take('edgeKind'),
    edgeFwdUses: take('edgeFwdUses'),
    edgeBackUses: take('edgeBackUses'),
    edgeDiff: take('edgeDiff'),
    edgeGroom: take('edgeGroom'),
    edgeLift: take('edgeLift'),
    edgeLiftSec: take('edgeLiftSec'),
    edgeLiftCap: take('edgeLiftCap'),
    edgeFlags: take('edgeFlags'),
    edgeName: take('edgeName'),
    edgeRef: take('edgeRef'),
    edgeWay: take('edgeWay'),
    edgeGeomOff: take('edgeGeomOff'),
    geomLatE7: take('geomLatE7'),
    geomLngE7: take('geomLngE7'),
    geomEle: take('geomEle'),
    strings,
  };
  checkReferences(graph);
  return graph;
}

/** Every edge names nodes that exist and points that exist, so the router never reads past an array. */
function checkReferences(graph: SkiGraphData): void {
  const nodes = graph.header.nodeCount;
  const points = graph.header.geomCount;
  for (let e = 0; e < graph.header.edgeCount; e++) {
    if ((graph.edgeA[e] as number) >= nodes || (graph.edgeB[e] as number) >= nodes) {
      throw new SkiGraphFormatError(`SGR1 edge ${e} names a node that does not exist`);
    }
    const start = graph.edgeGeomOff[e] as number;
    const end = graph.edgeGeomOff[e + 1] as number;
    if (end < start + 2 || end > points) {
      throw new SkiGraphFormatError(`SGR1 edge ${e} has no line of its own`);
    }
  }
  if (graph.header.edgeCount > 0 && graph.edgeGeomOff[graph.header.edgeCount] !== points) {
    throw new SkiGraphFormatError('SGR1 points do not add up');
  }
}

/** An area's graph from its file as the Places host sends it: SGR1, gzip-packed. */
export function decodeSkiGraphGz(packed: Buffer): SkiGraphData {
  let bytes: Buffer;
  try {
    bytes = gunzipSync(packed);
  } catch {
    throw new SkiGraphFormatError('SGR1 file is not gzip');
  }
  return decodeSkiGraph(bytes);
}

const UTF8 = new TextDecoder('utf-8');

/** The string at a pool offset, null for none (or an offset the pool does not hold). */
export function poolString(strings: Uint8Array, offset: number): string | null {
  if (offset === NO_STRING || offset >= strings.length) return null;
  const end = strings.indexOf(0, offset);
  return UTF8.decode(strings.subarray(offset, end < 0 ? strings.length : end));
}
