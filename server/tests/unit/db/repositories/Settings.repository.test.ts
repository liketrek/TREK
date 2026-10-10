import { Settings } from '../../../../src/db/entities/Settings.entity';
import type { SettingsRepository } from '../../../../src/db/repositories/Settings.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, type TestUser } from '../../../helpers/factories';
import { countRows, findRow, insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let settings: SettingsRepository;
let user: TestUser;
let otherUser: TestUser;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  settings = t.repo(Settings);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  user = createUser(testDb).user;
  otherUser = createUser(testDb).user;
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function storedRow(userId: number, key: string) {
  return findRow(t, Settings, { user: userId, key });
}

async function insertSetting(userId: number, key: string, value: string | null): Promise<void> {
  await insertRow(t, Settings, { user: userId, key, value });
}

describe('settings table — the (user_id, key) unique index the ON CONFLICT target relies on', () => {
  it("UNIQUE-SCHEMA-001: PRAGMA index_list('settings') reports a unique index over exactly (user_id, key), the migrated schema's inline UNIQUE(user_id, key)", () => {
    // test-sql-allow: the index list comes from PRAGMA index_list, which no entity or repository maps.
    const indexes = testDb.prepare("PRAGMA index_list('settings')").all() as { name: string; unique: number }[];
    const uniqueIndexes = indexes.filter((idx) => idx.unique);
    expect(uniqueIndexes.length).toBeGreaterThan(0);
    const columnSets = uniqueIndexes.map((idx) => {
      // test-sql-allow: the index columns come from PRAGMA index_info, which no entity or repository maps.
      const cols = testDb.prepare(`PRAGMA index_info('${idx.name}')`).all() as { seqno: number; name: string }[];
      return [...cols].sort((a, b) => a.seqno - b.seqno).map((c) => c.name);
    });
    expect(columnSets).toContainEqual(['user_id', 'key']);
  });

  it('UNIQUE-SCHEMA-002: the Settings entity metadata declares the same (user, key) unique constraint, naming the RELATION property, not its persist(false) twin (fix(db): generator maps an FK twin column to its relation property name)', () => {
    const meta = t.orm.getMetadata(Settings);
    expect(meta.uniques).toContainEqual({ properties: ['user', 'key'] });
  });
});

describe('SettingsRepository', () => {
  it('SETTINGSREPO-001: getForUser reads every row for that user', async () => {
    await insertSetting(user.id, 'dark_mode', 'true');
    await insertSetting(user.id, 'temperature_unit', 'celsius');
    await insertSetting(otherUser.id, 'dark_mode', 'false'); // a different user's row — must not leak in
    const rows = await settings.getForUser(user.id);
    expect(rows.map((r) => r.key).sort()).toEqual(['dark_mode', 'temperature_unit']);
    expect(rows.every((r) => r.user_id === user.id)).toBe(true);
  });

  it('SETTINGSREPO-002: getForUser for a user with no rows returns an empty array', async () => {
    expect(await settings.getForUser(user.id)).toEqual([]);
  });

  it('SETTINGSREPO-003: getOne reads a single (user, key) row', async () => {
    await insertSetting(user.id, 'dark_mode', 'true');
    const row = await settings.getOne(user.id, 'dark_mode');
    expect(row).not.toBeNull();
    expect(row?.value).toBe('true');
    expect(row?.user_id).toBe(user.id);
  });

  it('SETTINGSREPO-004: getOne returns null when unset', async () => {
    expect(await settings.getOne(user.id, 'does_not_exist')).toBeNull();
  });

  it("SETTINGSREPO-005: getOne scopes strictly by user — another user's row for the same key never leaks", async () => {
    await insertSetting(otherUser.id, 'dark_mode', 'true');
    expect(await settings.getOne(user.id, 'dark_mode')).toBeNull();
  });

  it('SETTINGSREPO-006: upsertForUser inserts a new row exactly as the legacy INSERT would', async () => {
    await settings.upsertForUser(user.id, 'dark_mode', 'true');
    expect(await storedRow(user.id, 'dark_mode')).toStrictEqual({
      id: expect.any(Number),
      user_id: user.id,
      key: 'dark_mode',
      value: 'true',
    });
  });

  it('SETTINGSREPO-007: upsertForUser on an existing (user, key) replaces the value only — no duplicate row, matching ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value', async () => {
    await insertSetting(user.id, 'dark_mode', 'false');
    await settings.upsertForUser(user.id, 'dark_mode', 'true');
    expect(await storedRow(user.id, 'dark_mode')).toStrictEqual({
      id: expect.any(Number),
      user_id: user.id,
      key: 'dark_mode',
      value: 'true',
    });
    expect(await countRows(t, Settings, { user: user.id, key: 'dark_mode' })).toBe(1);
  });

  it('SETTINGSREPO-008: upsertForUser scopes by user — the same key for two different users stores two separate rows, not a collision (the conflict target is (user, key), not key alone)', async () => {
    await settings.upsertForUser(user.id, 'dark_mode', 'true');
    await settings.upsertForUser(otherUser.id, 'dark_mode', 'false');
    expect(await storedRow(user.id, 'dark_mode')).toMatchObject({ value: 'true' });
    expect(await storedRow(otherUser.id, 'dark_mode')).toMatchObject({ value: 'false' });
  });

  it("SETTINGSREPO-014: em.upsert infers the (user, key) conflict target from the metadata's relation-named uniques entry with NO explicit onConflictFields — the entry the generator's fix(db) commit made consumable (task-5-review.md Important 1). SettingsRepository.upsertForUser still passes onConflictFields explicitly, for clarity, not because it is required.", async () => {
    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      // Insert branch: no existing row, onConflictFields omitted entirely.
      await t.em.upsert(Settings, { user: user.id, key: 'dark_mode', value: 'true' }, { onConflictAction: 'merge' });
      expect(await storedRow(user.id, 'dark_mode')).toStrictEqual({
        id: expect.any(Number),
        user_id: user.id,
        key: 'dark_mode',
        value: 'true',
      });

      // Merge branch: an existing row, same call shape — proves the SAME
      // inferred target both creates and merges, not just happens to insert once.
      const insertSql = spy.mock.calls
        .map(([sql]) => sql)
        .find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(insertSql).toContain('on conflict (`user_id`, `key`)');
      spy.mockClear();

      await t.em.upsert(Settings, { user: user.id, key: 'dark_mode', value: 'false' }, { onConflictAction: 'merge' });
      expect(await storedRow(user.id, 'dark_mode')).toStrictEqual({
        id: expect.any(Number),
        user_id: user.id,
        key: 'dark_mode',
        value: 'false',
      });
      expect(await countRows(t, Settings, { user: user.id, key: 'dark_mode' })).toBe(1);
      const mergeSql = spy.mock.calls
        .map(([sql]) => sql)
        .find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(mergeSql).toContain('on conflict (`user_id`, `key`)');
    } finally {
      spy.mockRestore();
    }
  });

  // Identity-map regression: the short-circuit (Task 0 review, I1; corrected
  // by the Task 3 review) only fires for a PRIMARY-KEY-ONLY findOne
  // (`findOne({ id })`/`findOne(pk)`) — `getOne`'s filter is `(user, key)`,
  // never the surrogate `id` PK, so it is not PK-only and always re-queries,
  // needing no `refresh: true`. These pin that directly rather than assume it.
  it('SETTINGSREPO-012: getOne sees a raw UPDATE on the same (user, key) in the same request', async () => {
    await insertSetting(user.id, 'dark_mode', 'old');
    expect((await settings.getOne(user.id, 'dark_mode'))?.value).toBe('old'); // populate the identity map
    // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
    testDb.prepare('UPDATE settings SET value = ? WHERE user_id = ? AND key = ?').run('new', user.id, 'dark_mode');
    expect((await settings.getOne(user.id, 'dark_mode'))?.value).toBe('new');
  });

  it('SETTINGSREPO-013: getOne sees a raw DELETE on the same (user, key) in the same request', async () => {
    await insertSetting(user.id, 'dark_mode', 'old');
    expect((await settings.getOne(user.id, 'dark_mode'))?.value).toBe('old'); // populate the identity map
    // test-sql-allow: the out-of-band delete this case is about has to bypass every EntityManager, the one under test included.
    testDb.prepare('DELETE FROM settings WHERE user_id = ? AND key = ?').run(user.id, 'dark_mode');
    expect(await settings.getOne(user.id, 'dark_mode')).toBeNull();
  });
});
