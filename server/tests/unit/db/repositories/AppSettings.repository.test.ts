import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let appSettings: AppSettingsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  appSettings = t.repo(AppSettings);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawRow(key: string): unknown {
  // test-sql-allow: the row as SELECT * returns it is the oracle the repository writes are held to.
  return testDb.prepare('SELECT * FROM app_settings WHERE key = ?').get(key);
}

async function insertRaw(key: string, value: string | null): Promise<void> {
  await insertRow(t, AppSettings, { key, value });
}

/**
 * Runs `fn` while counting queries MikroORM actually issues over the shared
 * connection, so a regression test can assert "one query, with this value"
 * rather than only the value — a regression in the `disableIdentityMap: true`
 * ruling (Plan 3b Task 1 fix round, `task-1-review.md` B1) would return the
 * *right* value from a stale identity-map hit with *zero* queries, which a
 * value-only assertion would never catch.
 */
async function withQueryCount<T>(fn: () => Promise<T>): Promise<{ value: T; queries: number }> {
  const connection = t.orm.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  try {
    const value = await fn();
    return { value, queries: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
}

describe('AppSettingsRepository', () => {
  it('APPSETREPO-001: getValue reads the stored value', async () => {
    await insertRaw('bag_tracking_enabled', 'true');
    expect(await appSettings.getValue('bag_tracking_enabled')).toBe('true');
  });

  it('APPSETREPO-002: getValue returns null for an unset key', async () => {
    expect(await appSettings.getValue('does_not_exist')).toBeNull();
  });

  it('APPSETREPO-003: getValues reads several keys into a Map, silently dropping keys with no row', async () => {
    await insertRaw('collab_chat_enabled', 'false');
    await insertRaw('collab_notes_enabled', 'true');
    const values = await appSettings.getValues(['collab_chat_enabled', 'collab_notes_enabled', 'collab_links_enabled']);
    expect(values).toEqual(
      new Map([
        ['collab_chat_enabled', 'false'],
        ['collab_notes_enabled', 'true'],
      ]),
    );
  });

  it('APPSETREPO-012 (M1): getValues also drops a key whose row exists but whose value is NULL, matching the "row present with a NULL value" case as absent, same as a missing row', async () => {
    await insertRaw('collab_chat_enabled', 'false');
    await insertRaw('collab_links_enabled', null); // present row, NULL value — legacy treated this as absent too
    const values = await appSettings.getValues(['collab_chat_enabled', 'collab_links_enabled', 'collab_notes_enabled']);
    expect(values).toEqual(new Map([['collab_chat_enabled', 'false']]));
    expect(values.has('collab_links_enabled')).toBe(false);
  });

  // Plan 3b Task 1 fix round (task-1-review.md B1): getValue is a
  // primary-key findOne, which MikroORM would answer from the identity map
  // on a repeat call absent `disableIdentityMap: true` — invisible to a raw
  // write or delete on the same key inside the same request. These pin the
  // fix at one query each.
  describe('getValue sees a raw write/delete on the same key in the same request (disableIdentityMap regression)', () => {
    it('APPSETREPO-013: deleteValue then getValue reads null, not the deleted row, in one query', async () => {
      await insertRaw('bag_tracking_enabled', 'v');
      expect(await appSettings.getValue('bag_tracking_enabled')).toBe('v'); // populate the identity map
      await appSettings.deleteValue('bag_tracking_enabled');
      const { value, queries } = await withQueryCount(() => appSettings.getValue('bag_tracking_enabled'));
      expect(value).toBeNull();
      expect(queries).toBe(1);
    });

    it('APPSETREPO-014: an UPDATE from another context on the same key then getValue reads the new value, in one query', async () => {
      await insertRaw('bag_tracking_enabled', 'old');
      expect(await appSettings.getValue('bag_tracking_enabled')).toBe('old'); // populate the identity map
      await updateRows(t, AppSettings, { key: 'bag_tracking_enabled' }, { value: 'new' });
      const { value, queries } = await withQueryCount(() => appSettings.getValue('bag_tracking_enabled'));
      expect(value).toBe('new');
      expect(queries).toBe(1);
    });
  });

  it('APPSETREPO-004: setValue inserts a new row exactly as INSERT OR REPLACE would', async () => {
    await appSettings.setValue('bag_tracking_enabled', 'true');
    expect(rawRow('bag_tracking_enabled')).toStrictEqual({ key: 'bag_tracking_enabled', value: 'true' });
  });

  it('APPSETREPO-005: setValue on an existing key replaces the value only — the row (key, value) is byte-identical to INSERT OR REPLACE/ON CONFLICT DO UPDATE, because app_settings has no third column for either to reset', async () => {
    await insertRaw('bag_tracking_enabled', 'false');
    await appSettings.setValue('bag_tracking_enabled', 'true');
    expect(rawRow('bag_tracking_enabled')).toStrictEqual({ key: 'bag_tracking_enabled', value: 'true' });
    // Only the one row exists for that key — no duplicate/ghost row from upsert.
    expect(await countRows(t, AppSettings, { key: 'bag_tracking_enabled' })).toBe(1);
  });

  it('APPSETREPO-006: deleteValue removes the row and returns the legacy DELETE-affected-row count', async () => {
    await insertRaw('whitespace_migration_collision', 'true');
    expect(await appSettings.deleteValue('whitespace_migration_collision')).toBe(1);
    expect(rawRow('whitespace_migration_collision')).toBeUndefined();
  });

  it('APPSETREPO-007: deleteValue on a missing key is a no-op that reports 0 rows', async () => {
    expect(await appSettings.deleteValue('does_not_exist')).toBe(0);
  });

  it('APPSETREPO-008: findByKeyPrefix matches every key sharing the prefix, in whatever order the table returns them', async () => {
    await insertRaw('perm_view_days', '1');
    await insertRaw('perm_edit_budget', '2');
    await insertRaw('unrelated_key', '3');
    const rows = await appSettings.findByKeyPrefix('perm_');
    expect(rows.map((r) => r.key).sort()).toEqual(['perm_edit_budget', 'perm_view_days']);
    expect(rows).toEqual(
      expect.arrayContaining([
        { key: 'perm_view_days', value: '1' },
        { key: 'perm_edit_budget', value: '2' },
      ]),
    );
  });

  it('APPSETREPO-009: findByKeyPrefix with no matches returns an empty array', async () => {
    await insertRaw('unrelated_key', 'x');
    expect(await appSettings.findByKeyPrefix('perm_')).toEqual([]);
  });

  // Plan 3i (storage task) additions: countKeysPresent (SR1's
  // `SELECT COUNT(*) ... WHERE key IN (?, ?)`) and upsertOrReplace (SS1's
  // `INSERT OR REPLACE`), kept as distinct methods from setValue's
  // `ON CONFLICT DO UPDATE` upsert per R4/R5's ruling even though their
  // observable behavior on this table is identical (setValue's own
  // docstring explains why).
  it('APPSETREPO-015: countKeysPresent counts every matching ROW, including one whose value is NULL — unlike getValues, which drops it', async () => {
    await insertRaw('storage.backends', '[]');
    await insertRaw('storage.categories', null); // present row, NULL value
    expect(await appSettings.countKeysPresent(['storage.backends', 'storage.categories'])).toBe(2);
    expect(await appSettings.countKeysPresent(['storage.backends', 'storage.does_not_exist'])).toBe(1);
    expect(await appSettings.countKeysPresent(['storage.nope_a', 'storage.nope_b'])).toBe(0);
  });

  it('APPSETREPO-016: upsertOrReplace inserts a new row exactly as INSERT OR REPLACE would', async () => {
    await appSettings.upsertOrReplace('storage.usage', '{"computedAt":1}');
    expect(rawRow('storage.usage')).toStrictEqual({ key: 'storage.usage', value: '{"computedAt":1}' });
  });

  it('APPSETREPO-017: upsertOrReplace on an existing key replaces the value only, with no duplicate/ghost row', async () => {
    await insertRaw('storage.usage', '{"computedAt":1}');
    await appSettings.upsertOrReplace('storage.usage', '{"computedAt":2}');
    expect(rawRow('storage.usage')).toStrictEqual({ key: 'storage.usage', value: '{"computedAt":2}' });
    expect(await countRows(t, AppSettings, { key: 'storage.usage' })).toBe(1);
  });

  // LIKE-escaping finding: neither the legacy `LIKE 'prefix%'` literal nor
  // `$like`'s bound parameter here escapes `%`/`_` in the prefix — a bound
  // LIKE parameter's wildcards are interpreted by SQLite exactly like a
  // literal's are, so `findByKeyPrefix` reproduces the legacy statement's
  // matches (and its same non-escaping quirk) for a prefix containing either
  // character. These tests compare the repository's result against the
  // legacy raw-SQL statement directly, not against a hand-picked expectation.
  describe('LIKE escaping — % and _ in the prefix are wildcards, not escaped, exactly as the legacy statement behaved', () => {
    function legacyPrefixMatch(prefix: string): { key: string; value: string }[] {
      // test-sql-allow: the legacy LIKE statement is the oracle the repository read is held to.
      return testDb.prepare('SELECT key, value FROM app_settings WHERE key LIKE ?').all(`${prefix}%`) as {
        key: string;
        value: string;
      }[];
    }

    it('APPSETREPO-010: an underscore in the prefix matches any single character there, like a raw LIKE pattern would', async () => {
      // 'ab_c%' as a LIKE pattern: '_' matches any one character, so both
      // 'ab_cd' (literal underscore) and 'abXcd' (any other character) match.
      await insertRaw('ab_cd', '1');
      await insertRaw('abXcd', '2');
      await insertRaw('abcd', '3'); // one character short at that position — no match
      const rows = await appSettings.findByKeyPrefix('ab_c');
      expect(rows.map((r) => r.key).sort()).toEqual(
        legacyPrefixMatch('ab_c')
          .map((r) => r.key)
          .sort(),
      );
      expect(rows.map((r) => r.key).sort()).toEqual(['abXcd', 'ab_cd']);
    });

    it('APPSETREPO-011: a percent sign in the prefix matches zero or more characters there, like a raw LIKE pattern would', async () => {
      // 'ab%c%' as a LIKE pattern: '%' matches zero-or-more, so both
      // 'abc' (zero characters at the % position) and 'abZZc' match.
      await insertRaw('abc', '1');
      await insertRaw('abZZc', '2');
      await insertRaw('abd', '3'); // no 'c' after the gap — no match
      const rows = await appSettings.findByKeyPrefix('ab%c');
      expect(rows.map((r) => r.key).sort()).toEqual(
        legacyPrefixMatch('ab%c')
          .map((r) => r.key)
          .sort(),
      );
      expect(rows.map((r) => r.key).sort()).toEqual(['abZZc', 'abc']);
    });
  });
});
