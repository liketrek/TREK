/**
 * The two-pass extraction of PAD-05A over extracts written in the test: the
 * objects kept with their own geometry (a weir across a river stays a line),
 * their tag hash, and the parts of one lock grouped while separate locks
 * stay apart; and the water sink the same passes feed (PAD-11).
 */
import {
  extractPaddleFeatures,
  groupLockParts,
  type ExtractedFeature,
  type ExtractSink,
} from '../../../../src/nest/paddle-obstacles/paddle-extract';
import { importExtract } from '../../../../src/nest/paddle-obstacles/paddle-import';
import { decodeWaterGraph } from '../../../../src/nest/paddle-routing/water-graph';
import { pbfFile, type FixtureNode } from '../../../helpers/osm-pbf-fixture';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let dir: string;
let n = 0;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-paddle-extract-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function extract(blocks: Parameters<typeof pbfFile>[0], timestamp?: number) {
  const path = join(dir, `region-${n++}.osm.pbf`);
  await writeFile(path, pbfFile(blocks, { timestamp }));
  const progress: number[] = [];
  const result = await extractPaddleFeatures(path, (fraction) => progress.push(fraction));
  return { ...result, progress };
}

const byRef = (features: ExtractedFeature[], ref: string) => features.find((feature) => feature.osm_ref === ref);

/** The Regen at Lindenmühle, Regenstauf: the weir way 29256405 drawn across the river. */
const weirNodes: FixtureNode[] = [
  { id: 1, lat: 49.1231, lon: 12.1301 },
  { id: 2, lat: 49.1236, lon: 12.1309 },
  { id: 3, lat: 49.124, lon: 12.1315 },
];

describe('extractPaddleFeatures', () => {
  it('PEXT-001: keeps a weir way as a line with its own geometry, box and kept tags', async () => {
    const { features, timestamp, progress } = await extract(
      [
        { dense: weirNodes },
        {
          ways: [
            {
              id: 29256405,
              refs: [1, 2, 3],
              tags: { waterway: 'weir', name: 'Wehr Lindenmühle', whitewater: 'hazard', source: 'bing' },
            },
          ],
        },
      ],
      1_760_000_000,
    );

    expect(timestamp).toBe(1_760_000_000);
    const weir = byRef(features, 'way/29256405');
    expect(weir).toMatchObject({
      kind: 'weir',
      name: 'Wehr Lindenmühle',
      tags: { waterway: 'weir', name: 'Wehr Lindenmühle', whitewater: 'hazard' },
      group_key: null,
    });
    expect(weir?.geometry.type).toBe('LineString');
    expect(weir?.geometry.coordinates).toHaveLength(3);
    expect(weir?.min_lat).toBeCloseTo(49.1231, 6);
    expect(weir?.max_lat).toBeCloseTo(49.124, 6);
    expect(weir?.min_lng).toBeCloseTo(12.1301, 6);
    expect(weir?.max_lng).toBeCloseTo(12.1315, 6);
    expect(weir?.tag_hash).toMatch(/^[0-9a-f]{16}$/);
    expect(progress.at(-1)).toBe(1);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });

  it('PEXT-002: keeps tagged nodes that are paddle objects as points, and leaves the rest', async () => {
    const { features, progress } = await extract([
      {
        dense: [
          { id: 10, lat: 53.27, lon: 12.81, tags: { canoe: 'put_in', name: 'Einsetzstelle Mirow' } },
          { id: 11, lat: 53.28, lon: 12.82, tags: { amenity: 'bench' } },
          { id: 12, lat: 53.29, lon: 12.83 },
        ],
      },
    ]);
    expect(features.map((feature) => feature.osm_ref)).toEqual(['node/10']);
    expect(features[0]).toMatchObject({ kind: 'put_in', geometry: { type: 'Point' } });
    expect(features[0]?.min_lat).toBe(features[0]?.max_lat);
    // No way to look up: the second pass is skipped and the progress jumps to the end.
    expect(progress.at(-1)).toBe(1);
  });

  it('PEXT-003: a closed way is an area, a way with fewer than two known nodes is dropped', async () => {
    const { features } = await extract([
      {
        dense: [
          { id: 1, lat: 0, lon: 0 },
          { id: 2, lat: 0, lon: 0.001 },
          { id: 3, lat: 0.001, lon: 0.001 },
        ],
      },
      {
        ways: [
          { id: 100, refs: [1, 2, 3, 1], tags: { lock: 'yes', waterway: 'canal' } },
          { id: 101, refs: [1, 99], tags: { waterway: 'dam' } },
        ],
      },
    ]);
    expect(byRef(features, 'way/100')?.geometry.type).toBe('Polygon');
    expect(byRef(features, 'way/101')).toBeUndefined();
  });

  it('PEXT-004: thins a very long way to every n-th node and keeps both of its ends', async () => {
    const nodes = Array.from({ length: 4501 }, (_, i) => ({ id: i + 1, lat: 50 + i * 1e-5, lon: 8 }));
    const { features } = await extract([
      { dense: nodes },
      { ways: [{ id: 7, refs: nodes.map((node) => node.id), tags: { waterway: 'river', canoe: 'yes' } }] },
    ]);
    const line = byRef(features, 'way/7');
    expect(line?.kind).toBe('access');
    const coordinates = line?.geometry.type === 'LineString' ? line.geometry.coordinates : [];
    expect(coordinates.length).toBeLessThanOrEqual(2001);
    expect(coordinates[0]?.[1]).toBeCloseTo(50, 6);
    expect(coordinates.at(-1)?.[1]).toBeCloseTo(50 + 4500 * 1e-5, 6);
  });

  it('PEXT-005: the hash changes with a kept tag and with the geometry, not with a dropped tag', async () => {
    const weir = (tags: Record<string, string>, lat = 49.1) =>
      extract([{ dense: [{ id: 5, lat, lon: 12, tags: { waterway: 'weir', ...tags } }] }]).then(
        (result) => result.features[0]?.tag_hash,
      );
    const base = await weir({ name: 'A' });
    expect(await weir({ name: 'A' })).toBe(base);
    expect(await weir({ name: 'A', source: 'survey' })).toBe(base);
    expect(await weir({ name: 'B' })).not.toBe(base);
    expect(await weir({ name: 'A', canoe: 'no' })).not.toBe(base);
    expect(await weir({ name: 'A' }, 49.2)).not.toBe(base);
  });
});

describe('groupLockParts', () => {
  const part = (ref: string, kind: ExtractedFeature['kind'], lat: number, lng: number): ExtractedFeature => ({
    osm_ref: ref,
    kind,
    name: null,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    tags: {},
    tag_hash: ref,
    group_key: null,
    min_lat: lat,
    max_lat: lat,
    min_lng: lng,
    max_lng: lng,
  });

  it('PEXT-006: the chamber and the gates of one lock share a key; a lock 2 km on stays apart', () => {
    const chamber = part('way/30', 'lock', 53.3, 13.0);
    const upper = part('node/31', 'lock_gate', 53.3, 13.0012);
    const lower = part('node/32', 'lock_gate', 53.3, 12.9988);
    const other = part('way/40', 'lock', 53.3, 13.03);
    const weir = part('way/50', 'weir', 53.3, 13.0001);
    const features = [chamber, upper, lower, other, weir];

    groupLockParts(features);

    expect(chamber.group_key).toBe('lock:node/31');
    expect(upper.group_key).toBe('lock:node/31');
    expect(lower.group_key).toBe('lock:node/31');
    expect(other.group_key).toBeNull();
    expect(weir.group_key).toBeNull();
  });

  it('PEXT-007: parts chained within reach of each other form one lock', () => {
    const a = part('node/1', 'lock_gate', 0, 0);
    const b = part('node/2', 'lock_gate', 0, 0.002);
    const c = part('node/3', 'lock_gate', 0, 0.004);
    groupLockParts([c, a, b]);
    expect(new Set([a.group_key, b.group_key, c.group_key])).toEqual(new Set(['lock:node/1']));
  });
});

describe('the water sink (PAD-11)', () => {
  /** A sink that records what it hears and asks for the member ways of one relation. */
  function recorder(neededWays: number[]) {
    const heard: string[] = [];
    let want: (id: number) => void = () => undefined;
    const sink: ExtractSink = {
      neededWays: new Set(neededWays),
      node: (id) => heard.push(`node/${id}`),
      way: (id, refs) => {
        heard.push(`way/${id}`);
        for (const ref of refs) want(ref);
      },
      relation: (id) => heard.push(`relation/${id}`),
      memberWay: (id) => heard.push(`member/${id}`),
    };
    return {
      heard,
      sinkFor: (asked: (id: number) => void) => {
        want = asked;
        return sink;
      },
    };
  }

  it('PEXT-008: hears every tagged node, way and relation, reads the member ways in a pass of their own, and knows their positions', async () => {
    const path = join(dir, `region-${n++}.osm.pbf`);
    await writeFile(
      path,
      pbfFile([
        { dense: [...weirNodes, { id: 4, lat: 49.2, lon: 12.2, tags: { natural: 'water' } }] },
        {
          ways: [
            { id: 10, refs: [1, 2, 3], tags: { waterway: 'river' } },
            { id: 11, refs: [1, 3] },
          ],
        },
        { relations: [{ id: 5, members: [{ type: 'way', ref: 11, role: 'outer' }], tags: { type: 'multipolygon' } }] },
      ]),
    );
    const { heard, sinkFor } = recorder([11]);
    const progress: number[] = [];
    const { coordOf } = await extractPaddleFeatures(path, (fraction) => progress.push(fraction), sinkFor);
    expect(heard).toEqual(['node/4', 'way/10', 'way/11', 'relation/5', 'member/10', 'member/11']);
    expect(coordOf(2)).toEqual([49.1236, 12.1309]);
    // Three passes: the elements, the member ways, the positions.
    expect(progress.some((fraction) => Math.abs(fraction - 2 / 3) < 1e-9)).toBe(true);
    expect(progress.at(-1)).toBe(1);
  });

  it('PEXT-009: without member ways to read the pass is left out; an extract without a date builds a network without one', async () => {
    const path = join(dir, `region-${n++}.osm.pbf`);
    await writeFile(
      path,
      pbfFile([{ dense: weirNodes }, { ways: [{ id: 10, refs: [1, 2, 3], tags: { waterway: 'river' } }] }]),
    );
    const { heard, sinkFor } = recorder([]);
    const read = vi.fn();
    await extractPaddleFeatures(path, read, sinkFor);
    expect(heard).toEqual(['way/10']);

    const { graph, timestamp } = await importExtract(path, 'undated', () => undefined);
    expect(timestamp).toBeNull();
    expect(decodeWaterGraph(Buffer.from(graph?.bytes ?? [])).sourceTimestamp).toBeNull();
  });
});
