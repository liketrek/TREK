import { BucketList } from '../../../../src/db/entities/BucketList.entity';
import type { BucketListRepository } from '../../../../src/db/repositories/BucketList.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let bucketList: BucketListRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  bucketList = t.repo(BucketList);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('BucketListRepository.listForPublicApi (Plan 4 Task 1, public-api.service.ts::listBucketList)', () => {
  it('BUCKETREPO-001: name/lat/lng/country_code/notes/target_date only, ordered by created_at DESC then id DESC, scoped to the caller', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    const insert = testDb.prepare(
      'INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    insert.run(user.id, 'Older', 1, 2, 'JP', 'note', null, '2026-01-01T00:00:00.000Z');
    insert.run(user.id, 'Newer', null, null, null, null, '2027-03-01', '2026-02-01T00:00:00.000Z');
    insert.run(other.id, 'Not mine', 9, 9, null, null, null, '2026-03-01T00:00:00.000Z');

    const legacy = testDb
      .prepare(
        'SELECT name, lat, lng, country_code, notes, target_date FROM bucket_list WHERE user_id = ? ORDER BY created_at DESC, id DESC',
      )
      .all(user.id);
    const rows = await bucketList.listForPublicApi(user.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.name)).toEqual(['Newer', 'Older']);
  });

  it('BUCKETREPO-002: same-instant rows tiebreak on id DESC (the second ORDER BY key)', async () => {
    const { user } = createUser(testDb);
    const insert = testDb.prepare('INSERT INTO bucket_list (user_id, name, created_at) VALUES (?, ?, ?)');
    insert.run(user.id, 'First inserted', '2026-01-01T00:00:00.000Z');
    insert.run(user.id, 'Second inserted', '2026-01-01T00:00:00.000Z');

    const rows = await bucketList.listForPublicApi(user.id);
    expect(rows.map((r) => r.name)).toEqual(['Second inserted', 'First inserted']);
  });

  it('BUCKETREPO-003: empty array for a user with nothing on their list', async () => {
    const { user } = createUser(testDb);
    expect(await bucketList.listForPublicApi(user.id)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plan 4 Task 8b-2, item 3 (3f L6 carry): AT30/AT33/AT34 had no
// repository-level toEqual(<legacy raw>) parity test. `SELECT *` — every
// nullable column (target_date, visited_at, visited_source, notes, lat/lng,
// country_code) exercised both NULL and SET.
// ─────────────────────────────────────────────────────────────────────────────

describe('BucketListRepository.listForUser (AT30) — SELECT * ordered by created_at DESC', () => {
  it('BUCKETREPO-004: matches the legacy row exactly, every nullable column both NULL and SET', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    const sparse = testDb
      .prepare('INSERT INTO bucket_list (user_id, name, created_at) VALUES (?, ?, ?)')
      .run(user.id, 'Sparse', '2026-01-01T00:00:00.000Z');
    const full = testDb
      .prepare(
        'INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date, visited_at, visited_source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(user.id, 'Full', 10.5, 20.5, 'JP', 'note', '2027-01-01', '2026-06-01', 'manual', '2026-02-01T00:00:00.000Z');
    testDb.prepare('INSERT INTO bucket_list (user_id, name) VALUES (?, ?)').run(other.id, 'Not mine');

    const legacy = testDb.prepare('SELECT * FROM bucket_list WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    const rows = await bucketList.listForUser(user.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([Number(full.lastInsertRowid), Number(sparse.lastInsertRowid)]);
  });

  it('BUCKETREPO-005: empty array for a user with nothing on their list', async () => {
    const { user } = createUser(testDb);
    expect(await bucketList.listForUser(user.id)).toEqual([]);
  });
});

describe('BucketListRepository.findById (AT33) — SELECT * WHERE id = ?, NOT user-scoped', () => {
  it('BUCKETREPO-006: matches the legacy row, regardless of owner', async () => {
    const { user } = createUser(testDb);
    const inserted = testDb.prepare('INSERT INTO bucket_list (user_id, name) VALUES (?, ?)').run(user.id, 'Item');
    const id = Number(inserted.lastInsertRowid);

    const legacy = testDb.prepare('SELECT * FROM bucket_list WHERE id = ?').get(id);
    expect(await bucketList.findById(id)).toEqual(legacy);
  });

  it('BUCKETREPO-007: undefined for a missing id', async () => {
    expect(await bucketList.findById(999999)).toBeUndefined();
  });
});

describe('BucketListRepository.findForUser (AT34/AT36/AT37) — SELECT * WHERE id = ? AND user_id = ?', () => {
  it('BUCKETREPO-008: matches the legacy row for the owning user', async () => {
    const { user } = createUser(testDb);
    const inserted = testDb.prepare('INSERT INTO bucket_list (user_id, name) VALUES (?, ?)').run(user.id, 'Item');
    const id = Number(inserted.lastInsertRowid);

    const legacy = testDb.prepare('SELECT * FROM bucket_list WHERE id = ? AND user_id = ?').get(id, user.id);
    expect(await bucketList.findForUser(id, user.id)).toEqual(legacy);
  });

  it("BUCKETREPO-009: undefined for a foreign owner — the guard never leaks another user's item", async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    const inserted = testDb.prepare('INSERT INTO bucket_list (user_id, name) VALUES (?, ?)').run(user.id, 'Item');
    const id = Number(inserted.lastInsertRowid);

    expect(await bucketList.findForUser(id, other.id)).toBeUndefined();
  });
});
