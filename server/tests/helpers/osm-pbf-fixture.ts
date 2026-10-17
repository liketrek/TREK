/**
 * A small OpenStreetMap PBF writer for the paddle tests: just enough of the
 * format (blob framing, raw and zlib blobs, a header block, string tables,
 * plain and dense nodes, ways, relations) to build an extract in the test itself, so
 * no binary fixture is checked in. The field numbers are the ones of
 * https://wiki.openstreetmap.org/wiki/PBF_Format.
 */
import { deflateSync } from 'node:zlib';

export interface FixtureNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface FixtureWay {
  id: number;
  refs: number[];
  tags?: Record<string, string>;
}

export interface FixtureRelation {
  id: number;
  members: Array<{ type: 'node' | 'way' | 'relation'; ref: number; role?: string }>;
  tags?: Record<string, string>;
}

type BlockContent = {
  dense?: FixtureNode[];
  nodes?: FixtureNode[];
  ways?: FixtureWay[];
  relations?: FixtureRelation[];
};

export function varint(value: number): Buffer {
  const bytes: number[] = [];
  let rest = value;
  while (rest >= 0x80) {
    bytes.push((rest % 128) | 0x80);
    rest = Math.floor(rest / 128);
  }
  bytes.push(rest);
  return Buffer.from(bytes);
}

const zigzag = (value: number): number => (value >= 0 ? value * 2 : -value * 2 - 1);

export function key(field: number, wire: number): Buffer {
  return varint(field * 8 + wire);
}

export function bytesField(field: number, payload: Buffer): Buffer {
  return Buffer.concat([key(field, 2), varint(payload.length), payload]);
}

export function varintField(field: number, value: number): Buffer {
  return Buffer.concat([key(field, 0), varint(value)]);
}

function packed(field: number, values: number[], signed: boolean): Buffer {
  return bytesField(field, Buffer.concat(values.map((value) => varint(signed ? zigzag(value) : value))));
}

/** Deltas of a run of numbers, as the dense and way encodings store them. */
function deltas(values: number[]): number[] {
  return values.map((value, index) => value - (values[index - 1] ?? 0));
}

/** One data block: a string table and one group of dense nodes, plain nodes, ways and relations. */
export function dataBlock(content: BlockContent): Buffer {
  const strings = [''];
  const index = (text: string): number => {
    const at = strings.indexOf(text);
    if (at >= 0) return at;
    strings.push(text);
    return strings.length - 1;
  };
  const toUnits = (deg: number) => Math.round(deg * 1e7);
  const groups: Buffer[] = [];

  if (content.dense?.length) {
    const nodes = content.dense;
    const keysVals = nodes.flatMap((node) => [
      ...Object.entries(node.tags ?? {}).flatMap(([k, v]) => [index(k), index(v)]),
      0,
    ]);
    const dense = Buffer.concat([
      packed(1, deltas(nodes.map((node) => node.id)), true),
      packed(8, deltas(nodes.map((node) => toUnits(node.lat))), true),
      packed(9, deltas(nodes.map((node) => toUnits(node.lon))), true),
      packed(10, keysVals, false),
    ]);
    groups.push(bytesField(2, dense));
  }
  for (const node of content.nodes ?? []) {
    const tags = Object.entries(node.tags ?? {});
    const body = Buffer.concat([
      Buffer.concat([key(1, 0), varint(zigzag(node.id))]),
      packed(
        2,
        tags.map(([k]) => index(k)),
        false,
      ),
      packed(
        3,
        tags.map(([, v]) => index(v)),
        false,
      ),
      Buffer.concat([key(8, 0), varint(zigzag(toUnits(node.lat)))]),
      Buffer.concat([key(9, 0), varint(zigzag(toUnits(node.lon)))]),
    ]);
    groups.push(bytesField(1, body));
  }
  for (const way of content.ways ?? []) {
    const tags = Object.entries(way.tags ?? {});
    const body = Buffer.concat([
      varintField(1, way.id),
      packed(
        2,
        tags.map(([k]) => index(k)),
        false,
      ),
      packed(
        3,
        tags.map(([, v]) => index(v)),
        false,
      ),
      packed(8, deltas(way.refs), true),
    ]);
    groups.push(bytesField(3, body));
  }

  for (const relation of content.relations ?? []) {
    const tags = Object.entries(relation.tags ?? {});
    const body = Buffer.concat([
      varintField(1, relation.id),
      packed(
        2,
        tags.map(([k]) => index(k)),
        false,
      ),
      packed(
        3,
        tags.map(([, v]) => index(v)),
        false,
      ),
      packed(
        8,
        relation.members.map((member) => index(member.role ?? '')),
        false,
      ),
      packed(9, deltas(relation.members.map((member) => member.ref)), true),
      packed(
        10,
        relation.members.map((member) => ['node', 'way', 'relation'].indexOf(member.type)),
        false,
      ),
    ]);
    groups.push(bytesField(4, body));
  }

  const table = Buffer.concat(strings.map((text) => bytesField(1, Buffer.from(text, 'utf8'))));
  return Buffer.concat([bytesField(1, table), ...groups.map((group) => bytesField(2, group))]);
}

/** A header block, with the replication timestamp when one is given. */
export function headerBlock(timestamp?: number): Buffer {
  const required = bytesField(4, Buffer.from('OsmSchema-V0.6'));
  return timestamp === undefined ? required : Buffer.concat([required, varintField(32, timestamp)]);
}

/** A blob of `type` around `block`, framed as the file holds it: length, header, blob. */
export function framedBlob(
  type: 'OSMHeader' | 'OSMData' | string,
  block: Buffer,
  compression: 'zlib' | 'raw' = 'zlib',
): Buffer {
  const blob =
    compression === 'zlib'
      ? Buffer.concat([varintField(2, block.length), bytesField(3, deflateSync(block))])
      : bytesField(1, block);
  const header = Buffer.concat([bytesField(1, Buffer.from(type, 'utf8')), varintField(3, blob.length)]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(header.length, 0);
  return Buffer.concat([length, header, blob]);
}

/** A whole extract: the header block, then one data block per entry. */
export function pbfFile(
  blocks: BlockContent[],
  options: { timestamp?: number; compression?: 'zlib' | 'raw' } = {},
): Buffer {
  return Buffer.concat([
    framedBlob('OSMHeader', headerBlock(options.timestamp), options.compression),
    ...blocks.map((block) => framedBlob('OSMData', dataBlock(block), options.compression)),
  ]);
}
