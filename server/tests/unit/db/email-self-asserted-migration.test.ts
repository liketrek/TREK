/**
 * `Migration20200101042800_an_email_the_account_typed_in_itself`: every
 * existing account starts out trusted (0), except one whose address provably
 * moved away from the one it registered with while no admin ever edited its
 * email. A broken audit row is skipped, and a second run changes nothing.
 */
import { Migration20200101042800_an_email_the_account_typed_in_itself } from '../../../src/db/migrations/Migration20200101042800_an_email_the_account_typed_in_itself';
import {
  createMigrationOrm,
  migrateTo,
  pendingNames,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101042800_an_email_the_account_typed_in_itself';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function seed(orm: MikroORM): Promise<void> {
  // 1 registered and kept the address; 2 registered and changed it itself;
  // 3 registered, changed it, and an admin set an email later; 4 was made by
  // an admin (no register row); 5 registered in another case only; 6 has a
  // broken register row.
  await rawExec(
    orm,
    `INSERT INTO users (id, username, email, password_hash) VALUES
       (1, 'kept', 'kept@test', 'x'),
       (2, 'moved', 'colleague@test', 'x'),
       (3, 'fixed', 'fixed-by-admin@test', 'x'),
       (4, 'made', 'made@test', 'x'),
       (5, 'cased', 'Cased@Test', 'x'),
       (6, 'broken', 'broken-now@test', 'x')`,
  );
  await rawExec(
    orm,
    `INSERT INTO audit_log (user_id, action, resource, details) VALUES
       (1, 'user.register', NULL, '{"username":"kept","email":"kept@test","role":"user"}'),
       (2, 'user.register', NULL, '{"username":"moved","email":"moved@test","role":"user"}'),
       (3, 'user.register', NULL, '{"username":"fixed","email":"fixed@test","role":"user"}'),
       (4, 'admin.user_update', '3', '{"targetUser":"fixed-self@test","fields":["username","email","role"]}'),
       (4, 'admin.user_update', '2', '{"targetUser":"colleague@test","fields":["role"]}'),
       (5, 'user.register', NULL, '{"username":"cased","email":"cased@test","role":"user"}'),
       (6, 'user.register', NULL, 'not json')`,
  );
}

const flags = (orm: MikroORM) =>
  rawQuery<{ id: number; email_self_asserted: number }>(orm, 'SELECT id, email_self_asserted FROM users ORDER BY id');

const EXPECTED = [
  { id: 1, email_self_asserted: 0 },
  { id: 2, email_self_asserted: 1 },
  { id: 3, email_self_asserted: 0 },
  { id: 4, email_self_asserted: 0 },
  { id: 5, email_self_asserted: 0 },
  { id: 6, email_self_asserted: 0 },
];

describe('email self-asserted migration', () => {
  it('EMAILSELF-MIG-001: only an address the account provably changed itself is marked', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      expect(await flags(orm)).toEqual(EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('EMAILSELF-MIG-002: running it again changes nothing', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      await runMigrationDirect(orm, Migration20200101042800_an_email_the_account_typed_in_itself);
      expect(await flags(orm)).toEqual(EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
