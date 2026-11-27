/**
 * `Migration20200101046510_a_session_knows_its_provider_session`: the nullable
 * `user_sessions.oidc_sid` column and its index. Migrate to the step before
 * it with a session already there, apply just this one, and check that the
 * existing session comes through untouched with no sid.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046510_a_session_knows_its_provider_session';

describe('user_sessions.oidc_sid migration', () => {
  it('USERSESSSID-001: adds a nullable text column with its index and leaves existing sessions as they were', async () => {
    const orm = await createMigrationOrm();
    try {
      const names = await pendingNames(orm);
      const idx = names.indexOf(TARGET);
      expect(idx).toBeGreaterThan(0);
      const previous = names[idx - 1];
      if (!previous) throw new Error('no step before the target');
      await migrateTo(orm, previous);
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(
        orm,
        "INSERT INTO user_sessions (id, user_id, expires_at, user_agent) VALUES ('s1', 1, '2030-01-01 00:00:00', 'Firefox')",
      );

      await migrateTo(orm, TARGET);

      const columns = await rawQuery<{ name: string; type: string; notnull: number }>(
        orm,
        "SELECT name, type, \"notnull\" FROM pragma_table_info('user_sessions') WHERE name = 'oidc_sid'",
      );
      expect(columns).toEqual([{ name: 'oidc_sid', type: 'TEXT', notnull: 0 }]);
      const indexes = await rawQuery<{ name: string }>(orm, "SELECT name FROM pragma_index_list('user_sessions')");
      expect(indexes.map((i) => i.name)).toContain('idx_user_sessions_oidc_sid');
      expect(
        await rawQuery(orm, "SELECT id, user_id, user_agent, revoked_at, oidc_sid FROM user_sessions WHERE id = 's1'"),
      ).toEqual([{ id: 's1', user_id: 1, user_agent: 'Firefox', revoked_at: null, oidc_sid: null }]);
    } finally {
      await orm.close(true);
    }
  });
});
