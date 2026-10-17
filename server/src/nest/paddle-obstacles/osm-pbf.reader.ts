import { createReadStream } from 'node:fs';
import { inflateSync } from 'node:zlib';

/**
 * A reader for OpenStreetMap's PBF format, as Geofabrik's regional extracts
 * come: the file is a run of blobs, each a length-prefixed header and a
 * (usually zlib-compressed) block. A block holds its own string table and
 * groups of nodes (packed as "dense" nodes), ways and relations. A visitor
 * names what it wants, and only that is decoded: a pass that needs nothing
 * but positions takes them without the nodes' tags.
 *
 * Only what the paddle data needs is decoded, and nothing is kept between
 * blocks, so a region of any size is read in the memory of one block (a few
 * megabytes). The format: https://wiki.openstreetmap.org/wiki/PBF_Format
 */

/** A varint is at most ten bytes; more means the data is not protobuf. */
const MAX_VARINT_BYTES = 10;
const TWO_POW_63 = 2 ** 63;
const TWO_POW_64 = 2 ** 64;
/** A blob's size may not exceed this, by the format's own rule. */
const MAX_BLOB_BYTES = 32 * 1024 * 1024;
const MAX_HEADER_BYTES = 64 * 1024;
/** Read a quarter megabyte at a time: a block or two, so no chunk holds the event loop for long. */
const READ_CHUNK_BYTES = 256 * 1024;

export interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface OsmWay {
  id: number;
  refs: number[];
  tags: Record<string, string>;
}

type OsmMemberType = 'node' | 'way' | 'relation';

export interface OsmRelation {
  id: number;
  members: Array<{ type: OsmMemberType; ref: number; role: string }>;
  tags: Record<string, string>;
}

export interface OsmBlockVisitor {
  /** Every node of the block, tagged or not; `tags` is empty for most. */
  node?: (node: OsmNode) => void;
  /** Every node's position alone, its tags left undecoded; ignored when `node` is given. */
  coord?: (id: number, lat: number, lon: number) => void;
  way?: (way: OsmWay) => void;
  relation?: (relation: OsmRelation) => void;
}

const MEMBER_TYPES: readonly OsmMemberType[] = ['node', 'way', 'relation'];

/** A protobuf field walker over one buffer, enough for the OSM schema. */
class Proto {
  pos: number;

  constructor(
    private readonly buf: Buffer,
    start = 0,
    private readonly end = buf.length,
  ) {
    this.pos = start;
  }

  get done(): boolean {
    return this.pos >= this.end;
  }

  /** An unsigned varint as a number: exact up to 2^53, which every OSM id and offset stays under. */
  varint(): number {
    let result = 0;
    let scale = 1;
    for (let read = 0; read < MAX_VARINT_BYTES; read++) {
      if (this.pos >= this.end) throw new Error('Truncated varint');
      const byte = this.buf[this.pos++] as number;
      result += (byte & 0x7f) * scale;
      if (byte < 0x80) return result;
      scale *= 128;
    }
    throw new Error('Malformed varint');
  }

  /** A plain (not zigzag) signed 64-bit varint: a negative value is written as its two's complement. */
  int64(): number {
    const raw = this.varint();
    return raw >= TWO_POW_63 ? raw - TWO_POW_64 : raw;
  }

  /** A zigzag-encoded signed varint. */
  svarint(): number {
    const raw = this.varint();
    return raw % 2 === 0 ? raw / 2 : -(raw + 1) / 2;
  }

  /** The next field's number and wire type, or null at the end. */
  key(): { field: number; wire: number } | null {
    if (this.done) return null;
    const key = this.varint();
    return { field: Math.floor(key / 8), wire: key % 8 };
  }

  /** The bounds of a length-delimited field, consumed. */
  span(): [number, number] {
    const length = this.varint();
    const start = this.pos;
    this.pos += length;
    if (this.pos > this.end) throw new Error('Truncated field');
    return [start, this.pos];
  }

  bytes(): Buffer {
    const [start, stop] = this.span();
    return this.buf.subarray(start, stop);
  }

  skip(wire: number): void {
    if (wire === 0) this.varint();
    else if (wire === 1) this.advance(8);
    else if (wire === 2) this.span();
    else if (wire === 5) this.advance(4);
    else throw new Error(`Unsupported wire type ${wire}`);
  }

  private advance(bytes: number): void {
    this.pos += bytes;
    if (this.pos > this.end) throw new Error('Truncated field');
  }

  /** A packed field of varints (or zigzag varints), decoded whole. */
  packed(signed: boolean): number[] {
    const [start, stop] = this.span();
    const inner = new Proto(this.buf, start, stop);
    const values: number[] = [];
    while (!inner.done) values.push(signed ? inner.svarint() : inner.varint());
    return values;
  }
}

/** The fields of a blob header: its type ("OSMHeader" or "OSMData") and the size of the blob after it. */
function readBlobHeader(buf: Buffer): { type: string; size: number } {
  const p = new Proto(buf);
  let type = '';
  let size = 0;
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1 && key.wire === 2) type = p.bytes().toString('utf8');
    else if (key.field === 3 && key.wire === 0) size = p.varint();
    else p.skip(key.wire);
  }
  return { type, size };
}

/** A blob's contents, inflated: the format allows raw or zlib data, and TREK reads those two. */
function readBlob(buf: Buffer): Buffer {
  const p = new Proto(buf);
  let raw: Buffer | null = null;
  let zlib: Buffer | null = null;
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1 && key.wire === 2) raw = p.bytes();
    else if (key.field === 3 && key.wire === 2) zlib = p.bytes();
    else p.skip(key.wire);
  }
  if (raw) return raw;
  if (zlib) return inflateSync(zlib, { maxOutputLength: MAX_BLOB_BYTES });
  throw new Error('Unsupported blob compression');
}

/**
 * The replication timestamp of an extract, from its header block: the moment
 * the data is current to, in seconds. Null when the header carries none.
 */
export function readHeaderTimestamp(block: Buffer): number | null {
  const p = new Proto(block);
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 32 && key.wire === 0) return p.varint();
    p.skip(key.wire);
  }
  return null;
}

interface BlockContext {
  strings: string[];
  granularity: number;
  latOffset: number;
  lonOffset: number;
}

function tagsOf(
  keys: readonly number[],
  values: readonly number[],
  strings: readonly string[],
): Record<string, string> {
  const tags: Record<string, string> = {};
  keys.forEach((key, index) => {
    const value = values[index];
    if (value !== undefined) tags[strings[key] ?? ''] = strings[value] ?? '';
  });
  return tags;
}

function readDenseCoords(buf: Buffer, ctx: BlockContext, visit: NonNullable<OsmBlockVisitor['coord']>): void {
  const p = new Proto(buf);
  let ids: number[] = [];
  let lats: number[] = [];
  let lons: number[] = [];
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1) ids = p.packed(true);
    else if (key.field === 8) lats = p.packed(true);
    else if (key.field === 9) lons = p.packed(true);
    else p.skip(key.wire);
  }
  let id = 0;
  let lat = 0;
  let lon = 0;
  for (let index = 0; index < ids.length; index++) {
    id += ids[index] as number;
    lat += lats[index] ?? 0;
    lon += lons[index] ?? 0;
    visit(id, (ctx.latOffset + ctx.granularity * lat) * 1e-9, (ctx.lonOffset + ctx.granularity * lon) * 1e-9);
  }
}

function readDense(buf: Buffer, ctx: BlockContext, visit: (node: OsmNode) => void): void {
  const p = new Proto(buf);
  let ids: number[] = [];
  let lats: number[] = [];
  let lons: number[] = [];
  let keysVals: number[] = [];
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1) ids = p.packed(true);
    else if (key.field === 8) lats = p.packed(true);
    else if (key.field === 9) lons = p.packed(true);
    else if (key.field === 10) keysVals = p.packed(false);
    else p.skip(key.wire);
  }
  let id = 0;
  let lat = 0;
  let lon = 0;
  let kv = 0;
  ids.forEach((delta, index) => {
    id += delta;
    lat += lats[index] ?? 0;
    lon += lons[index] ?? 0;
    const tags: Record<string, string> = {};
    // keys_vals runs key, value, key, value ... with a 0 closing each node.
    while (kv < keysVals.length && keysVals[kv] !== 0) {
      tags[ctx.strings[keysVals[kv] as number] ?? ''] = ctx.strings[keysVals[kv + 1] as number] ?? '';
      kv += 2;
    }
    kv += 1;
    visit({
      id,
      lat: (ctx.latOffset + ctx.granularity * lat) * 1e-9,
      lon: (ctx.lonOffset + ctx.granularity * lon) * 1e-9,
      tags,
    });
  });
}

function readNode(buf: Buffer, ctx: BlockContext): OsmNode {
  const p = new Proto(buf);
  let id = 0;
  let lat = 0;
  let lon = 0;
  let keys: number[] = [];
  let values: number[] = [];
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1) id = p.svarint();
    else if (key.field === 2) keys = p.packed(false);
    else if (key.field === 3) values = p.packed(false);
    else if (key.field === 8) lat = p.svarint();
    else if (key.field === 9) lon = p.svarint();
    else p.skip(key.wire);
  }
  return {
    id,
    lat: (ctx.latOffset + ctx.granularity * lat) * 1e-9,
    lon: (ctx.lonOffset + ctx.granularity * lon) * 1e-9,
    tags: tagsOf(keys, values, ctx.strings),
  };
}

function readWay(buf: Buffer, strings: readonly string[]): OsmWay {
  const p = new Proto(buf);
  let id = 0;
  let keys: number[] = [];
  let values: number[] = [];
  let deltas: number[] = [];
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1) id = p.varint();
    else if (key.field === 2) keys = p.packed(false);
    else if (key.field === 3) values = p.packed(false);
    else if (key.field === 8) deltas = p.packed(true);
    else p.skip(key.wire);
  }
  let ref = 0;
  const refs = deltas.map((delta) => (ref += delta));
  return { id, refs, tags: tagsOf(keys, values, strings) };
}

function readRelation(buf: Buffer, strings: readonly string[]): OsmRelation {
  const p = new Proto(buf);
  let id = 0;
  let keys: number[] = [];
  let values: number[] = [];
  let roles: number[] = [];
  let memberDeltas: number[] = [];
  let types: number[] = [];
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1) id = p.varint();
    else if (key.field === 2) keys = p.packed(false);
    else if (key.field === 3) values = p.packed(false);
    else if (key.field === 8) roles = p.packed(false);
    else if (key.field === 9) memberDeltas = p.packed(true);
    else if (key.field === 10) types = p.packed(false);
    else p.skip(key.wire);
  }
  let ref = 0;
  const members = memberDeltas.map((delta, index) => {
    ref += delta;
    return {
      type: MEMBER_TYPES[types[index] ?? 0] ?? 'node',
      ref,
      role: strings[roles[index] ?? 0] ?? '',
    };
  });
  return { id, members, tags: tagsOf(keys, values, strings) };
}

/** One data block: its string table, then each group's nodes, ways and relations handed to the visitor. */
export function readDataBlock(block: Buffer, visitor: OsmBlockVisitor): void {
  const p = new Proto(block);
  const strings: string[] = [];
  const groups: Buffer[] = [];
  const ctx: BlockContext = { strings, granularity: 100, latOffset: 0, lonOffset: 0 };
  for (let key = p.key(); key; key = p.key()) {
    if (key.field === 1 && key.wire === 2) {
      const table = new Proto(p.bytes());
      for (let entry = table.key(); entry; entry = table.key()) {
        if (entry.field === 1 && entry.wire === 2) strings.push(table.bytes().toString('utf8'));
        else table.skip(entry.wire);
      }
    } else if (key.field === 2 && key.wire === 2) groups.push(p.bytes());
    else if (key.field === 17 && key.wire === 0) ctx.granularity = p.varint();
    else if (key.field === 19 && key.wire === 0) ctx.latOffset = p.int64();
    else if (key.field === 20 && key.wire === 0) ctx.lonOffset = p.int64();
    else p.skip(key.wire);
  }
  const { node, coord, way, relation } = visitor;
  for (const group of groups) {
    const g = new Proto(group);
    for (let key = g.key(); key; key = g.key()) {
      if (key.wire !== 2) g.skip(key.wire);
      else if (key.field === 1 && (node || coord)) visitNode(readNode(g.bytes(), ctx), visitor);
      else if (key.field === 2 && node) readDense(g.bytes(), ctx, node);
      else if (key.field === 2 && coord) readDenseCoords(g.bytes(), ctx, coord);
      else if (key.field === 3 && way) way(readWay(g.bytes(), strings));
      else if (key.field === 4 && relation) relation(readRelation(g.bytes(), strings));
      else g.skip(key.wire);
    }
  }
}

function visitNode(read: OsmNode, visitor: OsmBlockVisitor): void {
  if (visitor.node) visitor.node(read);
  else visitor.coord?.(read.id, read.lat, read.lon);
}

/**
 * The bytes read from a file and not yet taken as a blob, kept as the chunks
 * they arrived in and joined only when a blob reaches across chunks.
 */
class ByteQueue {
  private chunks: Buffer[] = [];
  length = 0;

  push(chunk: Buffer): void {
    this.chunks.push(chunk);
    this.length += chunk.length;
  }

  /** The first `n` bytes, left in the queue; null while fewer have arrived. */
  peek(n: number): Buffer | null {
    if (this.length < n) return null;
    const first = this.chunks[0];
    if (first && first.length >= n) return first.subarray(0, n);
    const joined = Buffer.concat(this.chunks);
    this.chunks = [joined];
    return joined.subarray(0, n);
  }

  /** Takes the first `n` bytes off the queue; the caller has peeked at least that many. */
  drop(n: number): void {
    let left = n;
    while (left > 0) {
      const first = this.chunks[0] as Buffer;
      if (first.length <= left) {
        this.chunks.shift();
        left -= first.length;
      } else {
        this.chunks[0] = first.subarray(left);
        left = 0;
      }
    }
    this.length -= n;
  }
}

/** The next whole blob at the head of the queue, taken off it; null while it has not all arrived. */
function nextBlob(queue: ByteQueue): { type: string; data: Buffer } | null {
  const prefix = queue.peek(4);
  if (!prefix) return null;
  const headerLength = prefix.readUInt32BE(0);
  if (headerLength > MAX_HEADER_BYTES) throw new Error('Blob header too large');
  const head = queue.peek(4 + headerLength);
  if (!head) return null;
  const header = readBlobHeader(head.subarray(4));
  if (header.size > MAX_BLOB_BYTES) throw new Error('Blob too large');
  const whole = queue.peek(4 + headerLength + header.size);
  if (!whole) return null;
  queue.drop(whole.length);
  return { type: header.type, data: whole.subarray(4 + headerLength) };
}

/**
 * Every block of a PBF file in order, streamed from disk. The header block is
 * answered with its timestamp; data blocks go to the visitor. The blocks of
 * one chunk are read at once, and the event loop gets its turn between
 * chunks. `onProgress` is told the bytes read so far.
 */
export async function readPbfFile(
  path: string,
  visitor: OsmBlockVisitor,
  onProgress?: (bytesRead: number) => void,
): Promise<{ timestamp: number | null }> {
  const queue = new ByteQueue();
  let timestamp: number | null = null;
  let bytesRead = 0;
  for await (const chunk of createReadStream(path, { highWaterMark: READ_CHUNK_BYTES })) {
    const bytes = chunk as Buffer;
    queue.push(bytes);
    bytesRead += bytes.length;
    for (let blob = nextBlob(queue); blob; blob = nextBlob(queue)) {
      const block = readBlob(blob.data);
      if (blob.type === 'OSMHeader') timestamp = readHeaderTimestamp(block);
      else if (blob.type === 'OSMData') readDataBlock(block, visitor);
    }
    onProgress?.(bytesRead);
  }
  if (queue.length > 0) throw new Error('Truncated blob');
  return { timestamp };
}
