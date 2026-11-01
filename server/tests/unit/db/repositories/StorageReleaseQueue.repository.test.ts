/**
 * StorageReleaseQueueRepository: the objects a delete or a replace left
 * unnamed, each with the time it may go. RELQ-001 to RELQ-005.
 */
import { StorageReleaseQueue } from '../../../../src/db/entities/StorageReleaseQueue.entity';
import type { StorageReleaseQueueRepository } from '../../../../src/db/repositories/StorageReleaseQueue.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows } from '../../../helpers/factories/rows';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let queue: StorageReleaseQueueRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  queue = t.repo(StorageReleaseQueue);
});
beforeEach(async () => {
  await deleteRows(t, StorageReleaseQueue);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('StorageReleaseQueueRepository', () => {
  it('RELQ-001: queues keys per category and answers the due ones of one category, the longest waiting first, up to a limit', async () => {
    await queue.enqueue([{ category: 'covers', key: 'b.jpg' }], '2026-01-02 00:00:00');
    await queue.enqueue([{ category: 'covers', key: 'a.jpg' }], '2026-01-01 00:00:00');
    await queue.enqueue([{ category: 'places', key: 'a.jpg' }], '2026-01-01 00:00:00');
    await queue.enqueue([{ category: 'covers', key: 'later.jpg' }], '2026-02-01 00:00:00');
    expect(await queue.size()).toBe(4);
    expect(await queue.dueIn('covers', '2026-01-15 00:00:00', 10)).toEqual([
      { category: 'covers', key: 'a.jpg', due_at: '2026-01-01 00:00:00' },
      { category: 'covers', key: 'b.jpg', due_at: '2026-01-02 00:00:00' },
    ]);
    expect(await queue.dueIn('covers', '2026-01-15 00:00:00', 1)).toEqual([
      { category: 'covers', key: 'a.jpg', due_at: '2026-01-01 00:00:00' },
    ]);
    expect(await queue.dueIn('places', '2026-01-15 00:00:00', 10)).toEqual([
      { category: 'places', key: 'a.jpg', due_at: '2026-01-01 00:00:00' },
    ]);
    expect(await queue.dueIn('files', '2026-01-15 00:00:00', 10)).toEqual([]);
    expect(await queue.dueIn('covers', '2026-01-15 00:00:00', 0)).toEqual([]);
  });

  it('RELQ-002: a key queued again waits from the later time, and an empty batch writes nothing', async () => {
    await queue.enqueue([{ category: 'covers', key: 'a.jpg' }], '2026-01-01 00:00:00');
    await queue.enqueue([{ category: 'covers', key: 'a.jpg' }], '2026-03-01 00:00:00');
    await queue.enqueue([], '2026-04-01 00:00:00');
    expect(await queue.size()).toBe(1);
    expect(await queue.dueIn('covers', '2026-02-01 00:00:00', 10)).toEqual([]);
    expect(await queue.dueIn('covers', '2026-03-01 00:00:00', 10)).toHaveLength(1);
  });

  it('RELQ-003: answers the categories holding a due row, each once', async () => {
    await queue.enqueue(
      [
        { category: 'covers', key: 'a.jpg' },
        { category: 'covers', key: 'b.jpg' },
      ],
      '2026-01-01 00:00:00',
    );
    await queue.enqueue([{ category: 'places', key: 'a.jpg' }], '2026-05-01 00:00:00');
    expect(await queue.dueCategories('2026-02-01 00:00:00')).toEqual(['covers']);
    expect((await queue.dueCategories('2026-06-01 00:00:00')).sort()).toEqual(['covers', 'places']);
  });

  it('RELQ-004: drops the rows of the keys named, in their category only, and the rows due before a time', async () => {
    await queue.enqueue(
      [
        { category: 'covers', key: 'a.jpg' },
        { category: 'covers', key: 'b.jpg' },
      ],
      '2026-01-01 00:00:00',
    );
    await queue.enqueue([{ category: 'places', key: 'a.jpg' }], '2026-03-01 00:00:00');
    expect(await queue.deleteKeys('covers', ['a.jpg', 'nope.jpg'])).toBe(1);
    expect(await queue.deleteKeys('covers', [])).toBe(0);
    expect(await queue.deleteDueBefore('2026-02-01 00:00:00')).toBe(1);
    expect(await queue.dueIn('places', '2026-03-01 00:00:00', 10)).toEqual([
      { category: 'places', key: 'a.jpg', due_at: '2026-03-01 00:00:00' },
    ]);
  });

  it('RELQ-005: drops every row, for a database another installation brought', async () => {
    await queue.enqueue([{ category: 'covers', key: 'a.jpg' }], '2026-01-01 00:00:00');
    await queue.enqueue([{ category: 'places', key: 'a.jpg' }], '2026-01-01 00:00:00');
    expect(await queue.deleteAll()).toBe(2);
    expect(await queue.size()).toBe(0);
  });
});
