/**
 * FerrataTilesRepository: the cells of the via ferrata grid that
 * FerratasService keeps between restarts, read by key and written as a batch.
 */
import { FerrataTiles } from '../../../../src/db/entities/FerrataTiles.entity';
import type { FerrataTilesRepository } from '../../../../src/db/repositories/FerrataTiles.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow, findRows, insertRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tiles: FerrataTilesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tiles = t.repo(FerrataTiles);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const empty = '{"ferratas":[],"truncated":false}';

describe('FerrataTilesRepository.findByKeys', () => {
  it('FERTILEREPO-001: answers the stored cells among the keys and leaves the others out', async () => {
    await insertRows(t, FerrataTiles, [
      { tile_key: '942,224', payload: empty, fetched_at: 100 },
      { tile_key: '942,225', payload: '{"ferratas":[],"truncated":true}', fetched_at: 200 },
      { tile_key: '950,230', payload: empty, fetched_at: 300 },
    ]);

    const rows = await tiles.findByKeys(['942,224', '942,225', '943,224']);

    expect(rows.sort((a, b) => a.tile_key.localeCompare(b.tile_key))).toEqual([
      { tile_key: '942,224', payload: empty, fetched_at: 100 },
      { tile_key: '942,225', payload: '{"ferratas":[],"truncated":true}', fetched_at: 200 },
    ]);
  });

  it('FERTILEREPO-002: no keys asks for nothing', async () => {
    await insertRows(t, FerrataTiles, [{ tile_key: '942,224', payload: empty, fetched_at: 100 }]);
    expect(await tiles.findByKeys([])).toEqual([]);
  });

  it('FERTILEREPO-003: a cell on the other side of the globe keeps its negative key', async () => {
    await insertRows(t, FerrataTiles, [{ tile_key: '-1800,-3600', payload: empty, fetched_at: 5 }]);
    expect(await tiles.findByKeys(['-1800,-3600'])).toEqual([
      { tile_key: '-1800,-3600', payload: empty, fetched_at: 5 },
    ]);
  });
});

describe('FerrataTilesRepository.upsertTiles', () => {
  it('FERTILEREPO-004: writes a row per new cell', async () => {
    await tiles.upsertTiles([
      { tile_key: '942,224', payload: empty, fetched_at: 100 },
      { tile_key: '942,225', payload: empty, fetched_at: 100 },
    ]);

    const rows = await findRows(t, FerrataTiles, {}, { tile_key: 'asc' });
    expect(rows).toEqual([
      { tile_key: '942,224', payload: empty, fetched_at: 100 },
      { tile_key: '942,225', payload: empty, fetched_at: 100 },
    ]);
  });

  it('FERTILEREPO-005: a cell stored before gets the new payload and fetch time, still as one row', async () => {
    await insertRows(t, FerrataTiles, [{ tile_key: '942,224', payload: empty, fetched_at: 100 }]);
    const refreshed = '{"ferratas":[],"truncated":true}';

    await tiles.upsertTiles([
      { tile_key: '942,224', payload: refreshed, fetched_at: 900 },
      { tile_key: '942,225', payload: empty, fetched_at: 900 },
    ]);

    expect(await findRows(t, FerrataTiles, { tile_key: '942,224' })).toHaveLength(1);
    expect(await findRow(t, FerrataTiles, { tile_key: '942,224' })).toEqual({
      tile_key: '942,224',
      payload: refreshed,
      fetched_at: 900,
    });
    expect(await findRow(t, FerrataTiles, { tile_key: '942,225' })).toMatchObject({ fetched_at: 900 });
  });

  it('FERTILEREPO-006: an empty batch writes nothing', async () => {
    await tiles.upsertTiles([]);
    expect(await findRows(t, FerrataTiles)).toEqual([]);
  });
});
