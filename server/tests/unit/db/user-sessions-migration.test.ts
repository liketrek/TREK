/**
 * `Migration20200101042600_a_session_row_per_sign_in`: the `user_sessions`
 * table behind revocable session tokens. Migrate to the step before it, apply
 * just this one, assert the shape, and that an install with users and no
 * sessions comes through untouched (tokens from before carry no session id
 * and are not looked up, so nothing has to be backfilled).
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101042600_a_session_row_per_sign_in';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

describe('user_sessions migration', () => {
  it('USERSESSMIG-001: creates the table with a non-null text id, the owner foreign key and both indexes', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await migrateTo(orm, TARGET);

      const columns = await rawQuery<{ name: string; type: string; notnull: number; pk: number }>(
        orm,
        'SELECT name, type, "notnull", pk FROM pragma_table_info(\'user_sessions\') ORDER BY cid',
      );
      expect(columns).toEqual([
        { name: 'id', type: 'TEXT', notnull: 1, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, pk: 0 },
        { name: 'created_at', type: 'DATETIME', notnull: 1, pk: 0 },
        { name: 'last_seen_at', type: 'DATETIME', notnull: 1, pk: 0 },
        { name: 'expires_at', type: 'DATETIME', notnull: 1, pk: 0 },
        { name: 'revoked_at', type: 'DATETIME', notnull: 0, pk: 0 },
        { name: 'user_agent', type: 'TEXT', notnull: 0, pk: 0 },
      ]);

      const fks = await rawQuery<{ table: string; from: string; on_delete: string }>(
        orm,
        'SELECT "table", "from", on_delete FROM pragma_foreign_key_list(\'user_sessions\')',
      );
      expect(fks).toEqual([{ table: 'users', from: 'user_id', on_delete: 'CASCADE' }]);

      const indexes = await rawQuery<{ name: string }>(
        orm,
        "SELECT name FROM pragma_index_list('user_sessions') ORDER BY name",
      );
      expect(indexes.map((i) => i.name)).toEqual(
        expect.arrayContaining(['idx_user_sessions_expires', 'idx_user_sessions_user']),
      );

      // The existing account is untouched and has no session rows to begin with.
      expect(await rawQuery(orm, 'SELECT id, username FROM users')).toEqual([{ id: 1, username: 'owner' }]);
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM user_sessions')).toEqual([{ n: 0 }]);
    } finally {
      await orm.close(true);
    }
  });

  it('USERSESSMIG-002: a session row defaults its timestamps and goes with its user', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);
      await rawExec(orm, 'PRAGMA foreign_keys = ON');
      await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (2, 'sam', 'sam@test', 'x')");
      await rawExec(orm, "INSERT INTO user_sessions (id, user_id, expires_at) VALUES ('s1', 2, '2030-01-01 00:00:00')");

      const [row] = await rawQuery<{ created_at: string; last_seen_at: string; revoked_at: null }>(
        orm,
        "SELECT created_at, last_seen_at, revoked_at FROM user_sessions WHERE id = 's1'",
      );
      expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(row.last_seen_at).toBe(row.created_at);
      expect(row.revoked_at).toBeNull();

      await rawExec(orm, 'DELETE FROM users WHERE id = 2');
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM user_sessions')).toEqual([{ n: 0 }]);
    } finally {
      await orm.close(true);
    }
  });

  it('USERSESSMIG-003: refuses a session row without an id', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);
      await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (3, 'kim', 'kim@test', 'x')");
      await expect(
        rawExec(orm, "INSERT INTO user_sessions (id, user_id, expires_at) VALUES (NULL, 3, '2030-01-01 00:00:00')"),
      ).rejects.toThrow(/NOT NULL/);
    } finally {
      await orm.close(true);
    }
  });
});
