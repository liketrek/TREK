/**
 * `PaddleWaterGraphsRepository` (PAD-11): the water network each paddle
 * region built for routing, recorded, found by the point it covers, and
 * forgotten when its file is gone.
 */
import { PaddleRegions } from '../../../../src/db/entities/PaddleRegions.entity';
import { PaddleWaterGraphs } from '../../../../src/db/entities/PaddleWaterGraphs.entity';
import type { PaddleRegionsRepository } from '../../../../src/db/repositories/PaddleRegions.repository';
import type { PaddleWaterGraphsRepository } from '../../../../src/db/repositories/PaddleWaterGraphs.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let graphs: PaddleWaterGraphsRepository;
let regions: PaddleRegionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  graphs = t.repo(PaddleWaterGraphs);
  regions = t.repo(PaddleRegions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const box = (min: number, max: number) => ({ min_lat: min, min_lng: min, max_lat: max, max_lng: max });

async function region(id: string, min: number, max: number, file = `${id}.bin`) {
  await regions.insertRegion({ id, name: id, boundary: null, ...box(min, max) });
  await graphs.saveGraph({
    region_id: id,
    file,
    rev: 'r1',
    bytes: 10,
    built_at: dbNow(),
    stats: '{}',
    ...box(min, max),
  });
}

describe('PaddleWaterGraphsRepository (PAD-11)', () => {
  it('PWG-001: records a network, replaces it when built again, and lists them by region', async () => {
    await region('b', 10, 20);
    await region('a', 0, 5);
    await graphs.saveGraph({
      region_id: 'a',
      file: 'a2.bin',
      rev: 'r2',
      bytes: 20,
      built_at: dbNow(),
      stats: '{"n":1}',
      ...box(0, 6),
    });
    expect((await graphs.list()).map((row) => [row.region_id, row.file, row.rev])).toEqual([
      ['a', 'a2.bin', 'r2'],
      ['b', 'b.bin', 'r1'],
    ]);
    expect(await graphs.findByRegion('a')).toMatchObject({ file: 'a2.bin', max_lat: 6 });
    expect(await graphs.findByRegion('none')).toBeUndefined();
  });

  it('PWG-002: finds the networks whose box holds a point, the smallest box first', async () => {
    await region('wide', 0, 20);
    await region('local', 4, 6);
    await region('far', 30, 40);
    expect((await graphs.coveringPoint(5, 5)).map((row) => row.region_id)).toEqual(['local', 'wide']);
    expect(await graphs.coveringPoint(25, 25)).toEqual([]);
  });

  it('PWG-003: forgets a network whose file is gone, but not one built again under another name', async () => {
    await region('lake', 0, 5, 'lake-1.bin');
    expect(await graphs.forgetMissing('lake', 'lake-0.bin')).toBe(false);
    expect(await graphs.findByRegion('lake')).toBeDefined();
    expect(await graphs.forgetMissing('lake', 'lake-1.bin')).toBe(true);
    expect(await graphs.findByRegion('lake')).toBeUndefined();
    expect(await graphs.forgetMissing('lake', 'lake-1.bin')).toBe(false);
  });
});
