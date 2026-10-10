/**
 * Unit test for the instance API-key backfill migration (#1939).
 *
 * The Places/Unsplash credential moved from "whichever admin row the resolver
 * happened to find" to an instance-wide app_settings row. An install that
 * upgrades must keep searching with the key it already had, so the migration
 * copies the value the old resolver would have handed out — the lowest-id admin
 * who has one — and leaves the users columns alone. It only does so where that
 * value was the whole install's key: as soon as a second row holds one, the
 * promotion is skipped, because the instance row outranks everybody's own
 * column and nobody may be moved onto a stranger's key by an upgrade.
 *
 * Ported off the legacy runner (Task 0 triage: PORT) onto the real
 * `Migration20200101031100_1939`: migrate to the step immediately before it,
 * seed rows with raw SQL, apply just that one migration, assert.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, it, expect } from 'vitest';

const TARGET = 'Migration20200101031100_1939';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function seedUser(
  orm: MikroORM,
  id: number,
  role: 'admin' | 'user',
  keys: { maps?: string; unsplash?: string } = {},
): Promise<void> {
  await rawExec(
    orm,
    `INSERT INTO users (id, username, email, password_hash, role, maps_api_key, unsplash_api_key)
     VALUES (?, ?, ?, 'x', ?, ?, ?)`,
    [id, `u${id}`, `u${id}@test.local`, role, keys.maps ?? null, keys.unsplash ?? null],
  );
}

async function setting(orm: MikroORM, key: string): Promise<string | undefined> {
  const rows = await rawQuery<{ value: string }>(orm, 'SELECT value FROM app_settings WHERE key = ?', [key]);
  return rows[0]?.value;
}

describe('instance API-key backfill migration', () => {
  it('KEYFILL-001: copies the one key the install was searching with and keeps the column', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'admin', { maps: 'the-admin-google', unsplash: 'the-admin-unsplash' });
      await seedUser(orm, 2, 'user');

      await migrateTo(orm, TARGET);

      expect(await setting(orm, 'maps_api_key')).toBe('the-admin-google');
      expect(await setting(orm, 'unsplash_api_key')).toBe('the-admin-unsplash');
      // Nothing is taken away: the columns are still the per-user fallback.
      const rows = await rawQuery<{ maps_api_key: string }>(orm, 'SELECT maps_api_key FROM users WHERE id = 1');
      expect(rows[0].maps_api_key).toBe('the-admin-google');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('KEYFILL-002: skips an admin whose column is empty and takes the next one', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'admin', { maps: '' });
      await seedUser(orm, 2, 'admin', { maps: 'the-only-real-key' });

      await migrateTo(orm, TARGET);

      expect(await setting(orm, 'maps_api_key')).toBe('the-only-real-key');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('KEYFILL-003: never overwrites a value the admin has already saved instance-wide', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'admin', { maps: 'old-column-key' });
      await rawExec(orm, "INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'already-instance-wide')");

      await migrateTo(orm, TARGET);

      expect(await setting(orm, 'maps_api_key')).toBe('already-instance-wide');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('KEYFILL-004: ignores a non-admin key and writes no row at all', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'user', { maps: 'members-own-key' });

      await migrateTo(orm, TARGET);

      // A member's key stays theirs — the resolver still finds it for them, and
      // promoting it would hand their billing to the whole instance.
      expect(await setting(orm, 'maps_api_key')).toBeUndefined();
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('KEYFILL-005: writes nothing on an install that never had a key', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'admin');

      await migrateTo(orm, TARGET);

      expect(await setting(orm, 'maps_api_key')).toBeUndefined();
      expect(await setting(orm, 'unsplash_api_key')).toBeUndefined();
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('KEYFILL-006: leaves a column alone once a member holds a key of their own', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'admin', { maps: 'admins-own-google', unsplash: 'admins-own-unsplash' });
      await seedUser(orm, 7, 'user', { maps: 'members-own-google' });

      await migrateTo(orm, TARGET);

      // Member 7 pays for their own Google key. Promoting the admin's would put
      // every one of their searches on his key and his bill, because the instance
      // row is resolved before their own column.
      expect(await setting(orm, 'maps_api_key')).toBeUndefined();
      // Decided per column: nobody else has an Unsplash key, so that one really
      // was the whole install's and stays it.
      expect(await setting(orm, 'unsplash_api_key')).toBe('admins-own-unsplash');
      const rows = await rawQuery<{ maps_api_key: string }>(orm, 'SELECT maps_api_key FROM users WHERE id = 7');
      expect(rows[0].maps_api_key).toBe('members-own-google');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('KEYFILL-007: two admins with their own keys both keep them', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedUser(orm, 1, 'admin', { maps: 'first-admin-google' });
      await seedUser(orm, 2, 'admin', { maps: 'second-admin-google' });

      await migrateTo(orm, TARGET);

      expect(await setting(orm, 'maps_api_key')).toBeUndefined();
      const rows = await rawQuery<{ maps_api_key: string }>(orm, 'SELECT maps_api_key FROM users ORDER BY id');
      expect(rows.map((r) => r.maps_api_key)).toEqual(['first-admin-google', 'second-admin-google']);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
