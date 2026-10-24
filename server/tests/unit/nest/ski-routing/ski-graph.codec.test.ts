/**
 * SGR1, the graph format the Places host writes and TREK reads (spec 4). The
 * golden file is the writer's own (trek-places-api tests/fixtures/winter),
 * byte for byte, with every array written out beside it in golden-v1.json:
 * the reader must give exactly those arrays, the writer's two edge flags
 * beyond the first draft (17 area_has_run, 18 type_unknown) among the
 * constants, and refuse a file that is damaged, cut or of another format.
 */
import { stitchGraphs } from '../../../../src/nest/ski-routing/engine/stitch';
import {
  decodeSkiGraph,
  decodeSkiGraphGz,
  poolString,
  SkiGraphFormatError,
} from '../../../../src/nest/ski-routing/ski-graph';
import {
  EdgeFlag,
  Kind,
  Lift,
  NO_STRING,
  SGR_FORMAT,
  Use,
  type SkiGraphData,
} from '../../../../src/nest/ski-routing/ski-graph.contract';
import { SkiWorld } from '../../../helpers/ski-world';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const FIXTURES = join(__dirname, '../../../fixtures/ski');
const GOLDEN = readFileSync(join(FIXTURES, 'golden-v1.sgr'));
const VECTORS = JSON.parse(readFileSync(join(FIXTURES, 'golden-v1.json'), 'utf8')) as Record<string, unknown> & {
  sha256: string;
  bytes: number;
  header: Record<string, unknown>;
  strings: Record<string, string>;
};
/** The checksum the writer's test pins (GOLDEN_SHA256 in tests/test_winter_sgr.py). */
const GOLDEN_SHA256 = '9dd044605b8edf85c7fcc83e9f3bdb857f1e6451d09da7238d7f3071cf6c4b67';

const ARRAYS: ReadonlyArray<keyof Omit<SkiGraphData, 'header' | 'strings'>> = [
  'nodeLatE7',
  'nodeLngE7',
  'nodeEle',
  'nodeFlags',
  'nodeOsm',
  'edgeA',
  'edgeB',
  'edgeLen',
  'edgeUp',
  'edgeDown',
  'edgeKind',
  'edgeFwdUses',
  'edgeBackUses',
  'edgeDiff',
  'edgeGroom',
  'edgeLift',
  'edgeLiftSec',
  'edgeLiftCap',
  'edgeFlags',
  'edgeName',
  'edgeRef',
  'edgeWay',
  'edgeGeomOff',
  'geomLatE7',
  'geomLngE7',
  'geomEle',
];

/** The golden file with its head rewritten, the body as it was. */
function withHead(change: (head: Record<string, unknown>) => void): Buffer {
  const length = GOLDEN.readUInt32LE(4);
  const head = JSON.parse(GOLDEN.toString('utf8', 8, 8 + length)) as Record<string, unknown>;
  change(head);
  const json = Buffer.from(JSON.stringify(head), 'utf8');
  const prefix = Buffer.concat([Buffer.from('SGR1', 'latin1'), Buffer.alloc(4), json]);
  prefix.writeUInt32LE(json.length, 4);
  const body = GOLDEN.subarray((8 + length + 7) & ~7);
  return Buffer.concat([prefix, Buffer.alloc((8 - (prefix.length % 8)) % 8), body]);
}

/** Where the sections of a file start. */
const bodyStart = (bytes: Buffer): number => (8 + bytes.readUInt32LE(4) + 7) & ~7;

/** A file whose body was changed, with its head's checksum made to fit again. */
function reseal(bytes: Buffer): Buffer {
  const length = bytes.readUInt32LE(4);
  const head = JSON.parse(bytes.toString('utf8', 8, 8 + length)) as Record<string, unknown>;
  head.crc32 = crc32(bytes.subarray(bodyStart(bytes))) >>> 0;
  const json = Buffer.from(JSON.stringify(head), 'utf8');
  const prefix = Buffer.concat([Buffer.from('SGR1', 'latin1'), Buffer.alloc(4), json]);
  prefix.writeUInt32LE(json.length, 4);
  return Buffer.concat([prefix, Buffer.alloc((8 - (prefix.length % 8)) % 8), bytes.subarray(bodyStart(bytes))]);
}

describe('the golden SGR1 file', () => {
  it('SKIGRAPH-001: is the writer file byte for byte', () => {
    expect(GOLDEN.length).toBe(VECTORS.bytes);
    expect(createHash('sha256').update(GOLDEN).digest('hex')).toBe(GOLDEN_SHA256);
    expect(VECTORS.sha256).toBe(GOLDEN_SHA256);
  });

  it('SKIGRAPH-002: decodes to exactly the head and every array the writer wrote out', () => {
    const graph = decodeSkiGraph(GOLDEN);
    expect(graph.header).toEqual(VECTORS.header);
    for (const name of ARRAYS) {
      expect(Array.from(graph[name] as ArrayLike<number>), name).toEqual(VECTORS[name]);
    }
    expect(graph.header.format).toBe(SGR_FORMAT);
    expect(graph.header.areaId).toBe('w:100');
  });

  it('SKIGRAPH-003: reads every string of the pool at its offset, and none for the empty offset', () => {
    const graph = decodeSkiGraph(GOLDEN);
    for (const [offset, text] of Object.entries(VECTORS.strings)) {
      expect(poolString(graph.strings, Number(offset))).toBe(text);
    }
    expect(poolString(graph.strings, NO_STRING)).toBeNull();
    expect(poolString(graph.strings, graph.strings.length + 4)).toBeNull();
    const names = new Set(Array.from(graph.edgeName, (offset) => poolString(graph.strings, offset)));
    expect(names).toEqual(new Set(['Rote Eins', 'Blaue Zwei', 'Talloipe', 'Sonnenbahn', null]));
  });

  it('SKIGRAPH-004: holds the lift as board, ride and alight, and the use bits the contract names', () => {
    const graph = decodeSkiGraph(GOLDEN);
    const kinds = Array.from(graph.edgeKind);
    const board = kinds.indexOf(Kind.BOARD);
    const ride = kinds.indexOf(Kind.LIFT);
    const alight = kinds.indexOf(Kind.ALIGHT);
    expect(graph.edgeFwdUses[board]).toBe(Use.WALK | Use.LIFT_UP);
    expect(graph.edgeFwdUses[ride]).toBe(Use.LIFT_UP);
    expect(graph.edgeBackUses[ride]).toBe(0);
    expect(graph.edgeLift[ride]).toBe(Lift.CHAIR_DETACHABLE);
    expect(graph.edgeB[board]).toBe(graph.edgeA[ride]);
    expect(graph.edgeA[alight]).toBe(graph.edgeB[ride]);
    // Every link of the golden area is one the data does not hold.
    kinds.forEach((kind, e) => {
      if (kind === Kind.LINK) expect((graph.edgeFlags[e] as number) & EdgeFlag.INFERRED_LINK).toBeTruthy();
    });
  });

  it('SKIGRAPH-005: names the writer edge flags beyond the first draft', () => {
    expect(EdgeFlag.HALO).toBe(1 << 16);
    expect(EdgeFlag.AREA_HAS_RUN).toBe(1 << 17);
    expect(EdgeFlag.TYPE_UNKNOWN).toBe(1 << 18);
  });

  it('SKIGRAPH-006: reads the file gzip-packed, as the Places host sends it', () => {
    expect(decodeSkiGraphGz(gzipSync(GOLDEN)).header).toEqual(VECTORS.header);
    expect(() => decodeSkiGraphGz(GOLDEN)).toThrow('SGR1 file is not gzip');
  });
});

describe('a damaged or foreign file', () => {
  it('SKIGRAPH-010: refuses another magic, a cut file, a flipped byte and a head that is no JSON', () => {
    expect(() => decodeSkiGraph(Buffer.concat([Buffer.from('SGR2'), GOLDEN.subarray(4)]))).toThrow('Not an SGR1 file');
    expect(() => decodeSkiGraph(GOLDEN.subarray(0, 6))).toThrow('Not an SGR1 file');
    const flipped = Buffer.from(GOLDEN);
    flipped[flipped.length - 9] = (flipped[flipped.length - 9] as number) ^ 0xff;
    expect(() => decodeSkiGraph(flipped)).toThrow('SGR1 checksum differs');
    expect(() => decodeSkiGraph(GOLDEN.subarray(0, Math.floor(GOLDEN.length / 2)))).toThrow(SkiGraphFormatError);
    const longHead = Buffer.from(GOLDEN);
    longHead.writeUInt32LE(GOLDEN.length, 4);
    expect(() => decodeSkiGraph(longHead)).toThrow('SGR1 head runs past the end of the file');
    const notJson = Buffer.from(GOLDEN);
    notJson.write('{', 8 + 1, 'latin1');
    expect(() => decodeSkiGraph(notJson)).toThrow('SGR1 head is not JSON');
  });

  it('SKIGRAPH-011: a newer format is refused as such, so the graph kept before stays in use', () => {
    let caught: unknown;
    try {
      decodeSkiGraph(withHead((head) => (head.format = 2)));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SkiGraphFormatError);
    expect((caught as SkiGraphFormatError).unknownFormat).toBe(true);
    expect((caught as Error).message).toBe('SGR1 format 2 is not 1');
  });

  it('SKIGRAPH-012: refuses a head without its counts and a body shorter than the head says', () => {
    const noNodes = withHead((head) => delete head.nodeCount);
    expect(() => decodeSkiGraph(noNodes)).toThrow('SGR1 head has no valid node count');
    expect(() => decodeSkiGraph(withHead((head) => (head.crc32 = -1)))).toThrow('SGR1 head has no valid checksum');
    expect(() => decodeSkiGraph(withHead((head) => (head.geomCount = 9_999)))).toThrow(SkiGraphFormatError);
    expect(() => decodeSkiGraph(withHead((head) => (head.stringBytes = 9_999)))).toThrow(
      'SGR1 string pool runs past the end',
    );
  });

  it('SKIGRAPH-013: refuses an edge that names a node or points that do not exist', () => {
    const world = new SkiWorld();
    const a = world.node(0, 0, 1500);
    const b = world.node(0, -500, 1400);
    world.run(a, b, 2);
    const bytes = world.sgr();
    // Two nodes and one edge: nodeLatE7, nodeLngE7, nodeEle, nodeFlags, nodeOsm and edgeA, each padded to 8.
    const edgeB = bodyStart(bytes) + 8 + 8 + 8 + 8 + 16 + 8;
    expect(bytes.readUInt32LE(edgeB)).toBe(1);
    const foreignNode = Buffer.from(bytes);
    foreignNode.writeUInt32LE(7, edgeB);
    expect(() => decodeSkiGraph(reseal(foreignNode))).toThrow('SGR1 edge 0 names a node that does not exist');
    // edgeGeomOff follows edgeB, edgeLen, edgeUp, edgeDown, edgeKind, the two use sections, edgeDiff, edgeGroom,
    // edgeLift, edgeLiftSec, edgeLiftCap, edgeFlags, edgeName, edgeRef and edgeWay, each of one edge, padded to 8.
    const geomOff = edgeB + 8 * 15 + 8;
    expect(bytes.readUInt32LE(geomOff + 4)).toBe(2);
    const onePoint = Buffer.from(bytes);
    onePoint.writeUInt32LE(1, geomOff + 4);
    expect(() => decodeSkiGraph(reseal(onePoint))).toThrow('SGR1 edge 0 has no line of its own');
  });
});

describe('the test world writer', () => {
  it('SKIGRAPH-020: writes what the reader reads back, names, heights and missing heights included', () => {
    const world = new SkiWorld();
    const top = world.node(0, 0, 2000);
    const valley = world.node(0, -1000, null);
    world.run(top, valley, 1, { name: 'Talabfahrt', ref: '3', via: [[100, -500]] });
    const graph = world.graph();
    expect(graph.header.nodeCount).toBe(2);
    expect(Array.from(graph.edgeGeomOff)).toEqual([0, 3]);
    expect(poolString(graph.strings, graph.edgeName[0] as number)).toBe('Talabfahrt');
    expect(poolString(graph.strings, graph.edgeRef[0] as number)).toBe('3');
    expect(graph.nodeEle[1]).toBe(-32768);
    const net = stitchGraphs([graph]);
    expect(net.nodeEle[0]).toBe(2000);
    expect(Number.isNaN(net.nodeEle[1])).toBe(true);
    expect(net.edgeName[0]).toBe('Talabfahrt');
  });
});
