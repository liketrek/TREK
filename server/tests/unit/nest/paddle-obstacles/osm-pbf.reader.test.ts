/**
 * The PBF reader over extracts the test writes itself (tests/helpers/osm-pbf-fixture.ts):
 * blob framing across read chunks, raw and zlib blobs, the header timestamp,
 * plain and dense nodes, ways, and the ways a broken file is refused.
 */
import {
  readDataBlock,
  readHeaderTimestamp,
  readPbfFile,
  type OsmNode,
  type OsmWay,
} from '../../../../src/nest/paddle-obstacles/osm-pbf.reader';
import {
  bytesField,
  dataBlock,
  framedBlob,
  headerBlock,
  key,
  pbfFile,
  varint,
  varintField,
} from '../../../helpers/osm-pbf-fixture';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let dir: string;
let n = 0;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-pbf-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function fileOf(bytes: Buffer): Promise<string> {
  const path = join(dir, `extract-${n++}.osm.pbf`);
  await writeFile(path, bytes);
  return path;
}

async function readAll(path: string, onProgress?: (bytes: number) => void) {
  const nodes: OsmNode[] = [];
  const ways: OsmWay[] = [];
  const result = await readPbfFile(
    path,
    { node: (node) => nodes.push(node), way: (way) => ways.push(way) },
    onProgress,
  );
  return { ...result, nodes, ways };
}

describe('readPbfFile', () => {
  it('PBF-001: reads the header timestamp, dense nodes with their tags, plain nodes and ways', async () => {
    const path = await fileOf(
      pbfFile(
        [
          {
            dense: [
              { id: 10, lat: 49.1, lon: 12.1, tags: { waterway: 'weir', name: 'Wehr' } },
              { id: 11, lat: 49.2, lon: 12.2 },
              { id: 15, lat: 49.15, lon: 12.05, tags: { canoe: 'put_in' } },
            ],
            nodes: [{ id: 20, lat: -33.9, lon: -70.6, tags: { waterway: 'dam' } }],
            ways: [{ id: 29256405, refs: [10, 11, 15], tags: { waterway: 'weir', whitewater: 'hazard' } }],
          },
        ],
        { timestamp: 1_760_000_000 },
      ),
    );

    const { timestamp, nodes, ways } = await readAll(path);

    expect(timestamp).toBe(1_760_000_000);
    expect(nodes.map((node) => node.id)).toEqual([10, 11, 15, 20]);
    expect(nodes[0]).toMatchObject({ tags: { waterway: 'weir', name: 'Wehr' } });
    expect(nodes[0]?.lat).toBeCloseTo(49.1, 7);
    expect(nodes[0]?.lon).toBeCloseTo(12.1, 7);
    expect(nodes[1]?.tags).toEqual({});
    expect(nodes[2]).toMatchObject({ tags: { canoe: 'put_in' } });
    expect(nodes[3]?.lat).toBeCloseTo(-33.9, 7);
    expect(nodes[3]?.lon).toBeCloseTo(-70.6, 7);
    expect(ways).toEqual([{ id: 29256405, refs: [10, 11, 15], tags: { waterway: 'weir', whitewater: 'hazard' } }]);
  });

  it('PBF-002: reads raw blobs as it reads zlib ones', async () => {
    const path = await fileOf(
      pbfFile([{ dense: [{ id: 1, lat: 1, lon: 2, tags: { lock: 'yes' } }] }], { compression: 'raw' }),
    );
    const { nodes, timestamp } = await readAll(path);
    expect(timestamp).toBeNull();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.tags).toEqual({ lock: 'yes' });
  });

  it('PBF-003: reads a blob that reaches across read chunks, and ids past 2^31', async () => {
    // A string over a megabyte makes the block span several of the reader's quarter-megabyte chunks.
    const long = 'x'.repeat(1_200_000);
    const path = await fileOf(
      pbfFile(
        [
          { dense: [{ id: 3_000_000_000, lat: 50, lon: 8, tags: { note: long, waterway: 'weir' } }] },
          { ways: [{ id: 4_000_000_000, refs: [3_000_000_000, 3_000_000_001] }] },
        ],
        { compression: 'raw' },
      ),
    );
    const progress: number[] = [];

    const { nodes, ways } = await readAll(path, (bytes) => progress.push(bytes));

    expect(nodes[0]?.id).toBe(3_000_000_000);
    expect(nodes[0]?.tags.note).toHaveLength(1_200_000);
    expect(ways[0]).toMatchObject({ id: 4_000_000_000, refs: [3_000_000_000, 3_000_000_001] });
    expect(progress.length).toBeGreaterThan(2);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });

  it('PBF-004: skips blocks of a type it does not know', async () => {
    const path = await fileOf(
      Buffer.concat([
        framedBlob('OSMHeader', headerBlock(5)),
        framedBlob('Unknown', Buffer.from('anything')),
        framedBlob('OSMData', dataBlock({ dense: [{ id: 7, lat: 0, lon: 0 }] })),
      ]),
    );
    const { nodes, timestamp } = await readAll(path);
    expect(timestamp).toBe(5);
    expect(nodes.map((node) => node.id)).toEqual([7]);
  });

  it('PBF-005: refuses a file that ends inside a blob', async () => {
    const whole = pbfFile([{ dense: [{ id: 1, lat: 1, lon: 1 }] }]);
    await expect(readAll(await fileOf(whole.subarray(0, whole.length - 3)))).rejects.toThrow('Truncated blob');
    await expect(readAll(await fileOf(whole.subarray(0, 2)))).rejects.toThrow('Truncated blob');
  });

  it('PBF-006: refuses a blob header or a blob larger than the format allows', async () => {
    const huge = Buffer.alloc(4);
    huge.writeUInt32BE(70_000, 0);
    await expect(readAll(await fileOf(huge))).rejects.toThrow('Blob header too large');

    const header = Buffer.concat([bytesField(1, Buffer.from('OSMData')), varintField(3, 40 * 1024 * 1024)]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(header.length, 0);
    await expect(readAll(await fileOf(Buffer.concat([length, header])))).rejects.toThrow('Blob too large');
  });

  it('PBF-007: refuses a blob in a compression it does not read', async () => {
    const lzma = bytesField(4, Buffer.from('not zlib'));
    const header = Buffer.concat([bytesField(1, Buffer.from('OSMData')), varintField(3, lzma.length)]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(header.length, 0);
    await expect(readAll(await fileOf(Buffer.concat([length, header, lzma])))).rejects.toThrow(
      'Unsupported blob compression',
    );
  });

  it('PBF-008: an empty file reads as no blocks', async () => {
    expect(await readAll(await fileOf(Buffer.alloc(0)))).toEqual({ timestamp: null, nodes: [], ways: [] });
  });
});

describe('readDataBlock and readHeaderTimestamp', () => {
  it('PBF-009: applies the block granularity and offsets', () => {
    // granularity 1000 and offsets of one and two degrees (plain int64 in nanodegrees).
    const block = Buffer.concat([
      dataBlock({ nodes: [{ id: 1, lat: 0.0001, lon: 0.0002 }] }),
      varintField(17, 1000),
      varintField(19, 1_000_000_000),
      varintField(20, 2_000_000_000),
    ]);
    const nodes: OsmNode[] = [];
    readDataBlock(block, { node: (node) => nodes.push(node) });
    // lat = (offset 1e9 + granularity 1000 * stored 1000) * 1e-9 = 1.001.
    expect(nodes[0]?.lat).toBeCloseTo(1.001, 9);
    expect(nodes[0]?.lon).toBeCloseTo(2.002, 9);
  });

  it('PBF-010: leaves out what the visitor does not ask for', () => {
    const block = dataBlock({ dense: [{ id: 1, lat: 0, lon: 0 }], ways: [{ id: 2, refs: [1] }] });
    const ways: OsmWay[] = [];
    readDataBlock(block, { way: (way) => ways.push(way) });
    expect(ways.map((way) => way.id)).toEqual([2]);
  });

  it('PBF-011: a header block without a timestamp answers null; fields it does not know are skipped', () => {
    expect(readHeaderTimestamp(headerBlock())).toBeNull();
    const withFixed = Buffer.concat([key(30, 1), Buffer.alloc(8), key(31, 5), Buffer.alloc(4), varintField(32, 99)]);
    expect(readHeaderTimestamp(withFixed)).toBe(99);
  });

  it('PBF-012: refuses a field of a wire type the format never uses, a cut or endless varint and a cut field', () => {
    expect(() => readHeaderTimestamp(key(3, 3))).toThrow('Unsupported wire type 3');
    expect(() => readHeaderTimestamp(Buffer.from([0x80]))).toThrow('Truncated varint');
    expect(() => readHeaderTimestamp(Buffer.alloc(11, 0x80))).toThrow('Malformed varint');
    expect(() => readHeaderTimestamp(Buffer.concat([key(30, 1), Buffer.alloc(3)]))).toThrow('Truncated field');
    expect(() => readHeaderTimestamp(Buffer.concat([key(4, 2), varint(10), Buffer.from('ab')]))).toThrow(
      'Truncated field',
    );
  });
});
