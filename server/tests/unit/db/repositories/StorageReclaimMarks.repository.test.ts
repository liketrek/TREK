/**
 * StorageReclaimMarksRepository: since when the reclaim pass has seen an
 * object unreferenced. RCLM-001 to RCLM-004.
 */
import { StorageReclaimMarks } from '../../../../src/db/entities/StorageReclaimMarks.entity';
import type { StorageReclaimMarksRepository } from '../../../../src/db/repositories/StorageReclaimMarks.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows } from '../../../helpers/factories/rows';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let marks: StorageReclaimMarksRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  marks = t.repo(StorageReclaimMarks);
});
beforeEach(async () => {
  await deleteRows(t, StorageReclaimMarks);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('StorageReclaimMarksRepository', () => {
  it('RCLM-001: inserts marks per category and reads them back', async () => {
    await marks.insertMissing(
      'covers',
      [
        { key: 'a.jpg', size: 10 },
        { key: 'b.jpg', size: 20 },
      ],
      '2026-01-01 00:00:00',
    );
    await marks.insertMissing('places', [{ key: 'a.jpg', size: 5 }], '2026-01-02 00:00:00');
    const covers = await marks.marksOf('covers');
    expect(covers.sort((x, y) => x.key.localeCompare(y.key))).toEqual([
      { key: 'a.jpg', first_seen_at: '2026-01-01 00:00:00', size: 10 },
      { key: 'b.jpg', first_seen_at: '2026-01-01 00:00:00', size: 20 },
    ]);
    expect(await marks.marksOf('places')).toEqual([{ key: 'a.jpg', first_seen_at: '2026-01-02 00:00:00', size: 5 }]);
  });

  it('RCLM-002: a key marked already keeps its first sighting; an empty batch writes nothing', async () => {
    await marks.insertMissing('covers', [{ key: 'a.jpg', size: 10 }], '2026-01-01 00:00:00');
    await marks.insertMissing('covers', [{ key: 'a.jpg', size: 99 }], '2026-02-01 00:00:00');
    await marks.insertMissing('covers', [], '2026-03-01 00:00:00');
    expect(await marks.marksOf('covers')).toEqual([{ key: 'a.jpg', first_seen_at: '2026-01-01 00:00:00', size: 10 }]);
  });

  it('RCLM-003: drops the marks of the keys named, in their category only', async () => {
    await marks.insertMissing(
      'covers',
      [
        { key: 'a.jpg', size: 1 },
        { key: 'b.jpg', size: 1 },
      ],
      '2026-01-01 00:00:00',
    );
    await marks.insertMissing('places', [{ key: 'a.jpg', size: 1 }], '2026-01-01 00:00:00');
    expect(await marks.deleteKeys('covers', ['a.jpg', 'nope.jpg'])).toBe(1);
    expect(await marks.deleteKeys('covers', [])).toBe(0);
    expect((await marks.marksOf('covers')).map((m) => m.key)).toEqual(['b.jpg']);
    expect((await marks.marksOf('places')).map((m) => m.key)).toEqual(['a.jpg']);
  });

  it('RCLM-004: drops every mark of every category, for a database a restore brought back', async () => {
    await marks.insertMissing('covers', [{ key: 'a.jpg', size: 1 }], '2026-01-01 00:00:00');
    await marks.insertMissing('places', [{ key: 'a.jpg', size: 1 }], '2026-01-01 00:00:00');
    expect(await marks.deleteAll()).toBe(2);
    expect(await marks.marksOf('covers')).toEqual([]);
    expect(await marks.marksOf('places')).toEqual([]);
  });
});
