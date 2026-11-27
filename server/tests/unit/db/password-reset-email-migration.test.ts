/**
 * `Migration20200101046520_a_reset_link_belongs_to_the_address_it_was_sent_to`:
 * the nullable `password_reset_tokens.email` column. Migrate to the step
 * before it with a live link already there, apply just this one, and check
 * that the link comes through untouched with no address.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046520_a_reset_link_belongs_to_the_address_it_was_sent_to';

describe('password_reset_tokens.email migration', () => {
  it('PWDRESETMIG-001: adds a nullable text column and leaves existing links as they were', async () => {
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
        "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (7, 1, 'h', '2030-01-01 00:00:00')",
      );

      await migrateTo(orm, TARGET);

      const columns = await rawQuery<{ name: string; type: string; notnull: number }>(
        orm,
        "SELECT name, type, \"notnull\" FROM pragma_table_info('password_reset_tokens') WHERE name = 'email'",
      );
      expect(columns).toEqual([{ name: 'email', type: 'TEXT', notnull: 0 }]);
      expect(
        await rawQuery(
          orm,
          'SELECT id, user_id, token_hash, consumed_at, email FROM password_reset_tokens WHERE id = 7',
        ),
      ).toEqual([{ id: 7, user_id: 1, token_hash: 'h', consumed_at: null, email: null }]);
    } finally {
      await orm.close(true);
    }
  });
});
