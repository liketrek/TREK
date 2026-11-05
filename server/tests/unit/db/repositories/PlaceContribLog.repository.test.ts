/**
 * PlaceContribLogRepository: the transmission log of the community enrichment,
 * paged and filtered for the admin, counted for the panel's figures and swept
 * by the retention job.
 */
import { PlaceContribLog } from '../../../../src/db/entities/PlaceContribLog.entity';
import type {
  PlaceContribLogRepository,
  PlaceContribLogWrite,
} from '../../../../src/db/repositories/PlaceContribLog.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let log: PlaceContribLogRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  log = t.repo(PlaceContribLog);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const line = (over: Partial<PlaceContribLogWrite> = {}): PlaceContribLogWrite => ({
  day: '2026-10-29',
  contrib_key: 'osm:node/1',
  place_name: 'Café Luna',
  field: 'website',
  value_summary: 'cafe-luna.de',
  result: 'accepted',
  reason: 'published',
  ...over,
});

describe('PlaceContribLogRepository', () => {
  it('PCLOGREPO-001: no lines writes nothing', async () => {
    await log.insertLines([]);
    expect(await countRows(t, PlaceContribLog)).toBe(0);
  });

  it('PCLOGREPO-002: pages newest first, filtered by result and field, with the matching total', async () => {
    await log.insertLines([
      line({ field: 'website' }),
      line({ field: 'phone', result: 'rejected', reason: 'format' }),
      line({ field: 'phone' }),
    ]);
    const all = await log.page({}, 10, 0);
    expect(all.map((row) => row.field)).toEqual(['phone', 'phone', 'website']);
    expect(await log.total({})).toBe(3);

    const accepted = await log.page({ result: 'accepted' }, 10, 0);
    expect(accepted).toHaveLength(2);
    expect(await log.total({ result: 'accepted' })).toBe(2);

    const phones = await log.page({ field: 'phone', result: 'rejected' }, 10, 0);
    expect(phones).toEqual([expect.objectContaining({ field: 'phone', result: 'rejected', reason: 'format' })]);
    expect(await log.total({ field: 'phone' })).toBe(2);

    expect(await log.page({}, 1, 1)).toEqual([expect.objectContaining({ field: 'phone', result: 'rejected' })]);
  });

  it('PCLOGREPO-003: counts per result from a day on, and the last accepted day', async () => {
    expect(await log.lastAcceptedDay()).toBeNull();
    await log.insertLines([
      line({ day: '2026-09-01' }),
      line({ day: '2026-10-20' }),
      line({ day: '2026-10-28', result: 'withheld', reason: 'unchanged' }),
    ]);
    expect(await log.countsSince('2026-10-01')).toEqual(
      expect.arrayContaining([
        { result: 'accepted', count: 1 },
        { result: 'withheld', count: 1 },
      ]),
    );
    expect(await log.lastAcceptedDay()).toBe('2026-10-20');
  });

  it('PCLOGREPO-004: the sweep drops the lines before a day and says how many', async () => {
    await log.insertLines([line({ day: '2026-01-01' }), line({ day: '2026-10-01' })]);
    expect(await log.purgeBefore('2026-06-01')).toBe(1);
    expect(await log.total({})).toBe(1);
  });
});
