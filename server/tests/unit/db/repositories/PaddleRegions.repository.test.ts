/**
 * The two repositories of PAD-05A: `paddle_regions` (the regions an admin
 * chose, their queue and their state) and `paddle_features` (a region's
 * objects, found by box and replaced whole).
 */
import { PaddleFeatures } from '../../../../src/db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../../../src/db/entities/PaddleRegions.entity';
import type {
  PaddleFeatureRow,
  PaddleFeaturesRepository,
} from '../../../../src/db/repositories/PaddleFeatures.repository';
import type { PaddleRegionsRepository } from '../../../../src/db/repositories/PaddleRegions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, findRow, findRows, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let regions: PaddleRegionsRepository;
let features: PaddleFeaturesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  regions = t.repo(PaddleRegions);
  features = t.repo(PaddleFeatures);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const box = { min_lat: 49, min_lng: 12, max_lat: 50, max_lng: 13 };
const add = (id: string, name = id) => regions.insertRegion({ id, name, boundary: null, ...box });

const feature = (ref: string, lat: number, lng: number): PaddleFeatureRow => ({
  region_id: 'ignored',
  osm_ref: ref,
  kind: 'weir',
  group_key: null,
  name: null,
  geometry: JSON.stringify({ type: 'Point', coordinates: [lng, lat] }),
  tags: '{}',
  tag_hash: ref,
  min_lat: lat,
  min_lng: lng,
  max_lat: lat,
  max_lng: lng,
});

describe('PaddleRegionsRepository', () => {
  it('PADREGREPO-001: a region is added queued and empty; adding it again changes nothing', async () => {
    await add('oberpfalz', 'Oberpfalz');
    await regions.updateRegion('oberpfalz', { status: 'ready', feature_count: 3 });
    await add('oberpfalz', 'Renamed');

    expect(await regions.findById('oberpfalz')).toMatchObject({
      id: 'oberpfalz',
      name: 'Oberpfalz',
      status: 'ready',
      feature_count: 3,
      ...box,
    });
    expect(await regions.findById('nowhere')).toBeUndefined();
  });

  it('PADREGREPO-002: lists by name; the queue answers the oldest waiting region first', async () => {
    await add('b', 'Bayern');
    await add('a', 'Allgäu');
    await updateRows(t, PaddleRegions, { id: 'b' }, { created_at: '2026-01-01 00:00:00' });
    await updateRows(t, PaddleRegions, { id: 'a' }, { created_at: '2026-02-01 00:00:00' });

    expect((await regions.list()).map((row) => row.name)).toEqual(['Allgäu', 'Bayern']);
    expect((await regions.nextQueued())?.id).toBe('b');
    await regions.updateRegion('b', { status: 'importing' });
    expect((await regions.nextQueued())?.id).toBe('a');
    await regions.updateRegion('a', { status: 'ready' });
    expect(await regions.nextQueued()).toBeUndefined();
  });

  it('PADREGREPO-003: only regions holding data whose box reaches in count for a box', async () => {
    await add('read');
    await add('waiting');
    await add('elsewhere');
    await regions.updateRegion('read', { status: 'importing', imported_at: '2026-10-02 04:20:00' });
    await regions.updateRegion('elsewhere', {
      imported_at: '2026-10-02 04:20:00',
      min_lat: 53,
      max_lat: 54,
      min_lng: 12,
      max_lng: 13,
    });

    const inBox = await regions.withDataInBox({ south: 49.5, west: 12.5, north: 49.6, east: 12.6 });
    expect(inBox.map((row) => row.id)).toEqual(['read']);
  });

  it('PADREGREPO-004: the monthly refresh queues ready and failed regions and clears their error', async () => {
    await add('ready');
    await add('failed');
    await add('queued');
    await regions.updateRegion('ready', { status: 'ready' });
    await regions.updateRegion('failed', { status: 'failed', error: 'Geofabrik download 500' });

    expect(await regions.queueReady()).toBe(2);
    expect(await findRows(t, PaddleRegions, {}, { id: 'asc' })).toMatchObject([
      { id: 'failed', status: 'queued', error: null },
      { id: 'queued', status: 'queued' },
      { id: 'ready', status: 'queued' },
    ]);
  });

  it('PADREGREPO-005: a cut read goes back to the queue; removing a region takes its objects', async () => {
    await add('oberpfalz');
    await regions.updateRegion('oberpfalz', { status: 'importing' });
    await regions.requeueInterrupted();
    expect((await regions.findById('oberpfalz'))?.status).toBe('queued');

    await features.replaceRegion('oberpfalz', [feature('node/1', 49.5, 12.5)]);
    expect(await regions.deleteRegion('oberpfalz')).toBe(true);
    expect(await regions.deleteRegion('oberpfalz')).toBe(false);
    expect(await countRows(t, PaddleFeatures)).toBe(0);
  });
});

describe('PaddleFeaturesRepository', () => {
  it('PADFEATREPO-001: replaces a region whole, chunk by chunk, and leaves other regions alone', async () => {
    await add('oberpfalz');
    await add('bayern');
    await features.replaceRegion('bayern', [feature('node/9', 49.5, 12.5)]);
    const many = Array.from({ length: 450 }, (_, i) => feature(`node/${i + 1}`, 49 + i / 1000, 12.5));
    await features.replaceRegion('oberpfalz', many);
    expect(await countRows(t, PaddleFeatures, { region: 'oberpfalz' })).toBe(450);

    await features.replaceRegion('oberpfalz', [feature('node/1', 49.5, 12.5), feature('node/1', 49.5, 12.5)]);
    expect(await countRows(t, PaddleFeatures, { region: 'oberpfalz' })).toBe(1);
    expect(await countRows(t, PaddleFeatures, { region: 'bayern' })).toBe(1);
    expect(await findRow(t, PaddleFeatures, { region: 'oberpfalz' })).toMatchObject({ osm_ref: 'node/1' });

    await features.replaceRegion('oberpfalz', []);
    expect(await countRows(t, PaddleFeatures, { region: 'oberpfalz' })).toBe(0);
  });

  it('PADFEATREPO-002: finds the objects whose box reaches into the box, in a stable order, at most the limit', async () => {
    await add('oberpfalz');
    await features.replaceRegion('oberpfalz', [
      feature('node/1', 49.5, 12.5),
      feature('node/2', 49.55, 12.55),
      feature('node/3', 49.9, 12.9),
      {
        ...feature('way/4', 49.4, 12.4),
        geometry: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [12.4, 49.4],
            [12.6, 49.6],
          ],
        }),
        max_lat: 49.6,
        max_lng: 12.6,
      },
    ]);

    const inside = await features.findInBox({ south: 49.45, west: 12.45, north: 49.6, east: 12.6 }, 10);
    expect(inside.map((row) => row.osm_ref)).toEqual(['node/1', 'node/2', 'way/4']);
    expect(inside[0]).toMatchObject({ region_id: 'oberpfalz', kind: 'weir', tag_hash: 'node/1' });
    const capped = await features.findInBox({ south: 49, west: 12, north: 50, east: 13 }, 2);
    expect(capped.map((row) => row.osm_ref)).toEqual(['node/1', 'node/2']);
  });

  it('PADFEATREPO-003: counts the objects and names the newest row, nothing for an empty table', async () => {
    expect(await features.stats()).toEqual({ count: 0, max_id: null });
    await add('oberpfalz');
    await features.replaceRegion('oberpfalz', [feature('node/1', 49.5, 12.5), feature('node/2', 49.6, 12.6)]);
    const stats = await features.stats();
    expect(stats.count).toBe(2);
    expect(stats.max_id).toEqual(expect.any(Number));
  });

  it('PADFEATREPO-004: reads only the parts of the given locks inside a box', async () => {
    await add('oberpfalz');
    await features.replaceRegion('oberpfalz', [
      { ...feature('node/1', 49.5, 12.5), group_key: 'lock:node/1' },
      { ...feature('node/2', 49.51, 12.5), group_key: 'lock:node/1' },
      { ...feature('node/3', 49.52, 12.5), group_key: 'lock:node/3' },
      { ...feature('node/4', 49.9, 12.5), group_key: 'lock:node/1' },
    ]);
    const parts = await features.findGroupParts(
      ['lock:node/1'],
      { south: 49.4, west: 12.4, north: 49.6, east: 12.6 },
      10,
    );
    expect(parts.map((row) => row.osm_ref)).toEqual(['node/1', 'node/2']);
  });

  it('PADREGREPO-010: names when each region was last read, without its boundary', async () => {
    await add('oberpfalz');
    await add('bayern');
    await regions.updateRegion('oberpfalz', { status: 'ready', imported_at: '2026-10-02 04:20:00' });
    expect(await regions.readTimes()).toEqual([
      { id: 'bayern', imported_at: null },
      { id: 'oberpfalz', imported_at: '2026-10-02 04:20:00' },
    ]);
  });
});
