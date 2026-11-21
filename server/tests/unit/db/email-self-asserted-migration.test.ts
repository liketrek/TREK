/**
 * `Migration20200101042800_an_email_the_account_typed_in_itself`: every
 * existing account starts out trusted (0), except one whose address provably
 * moved away from the one it registered with while no admin ever edited its
 * email. A broken audit row is skipped, and a second run changes nothing.
 *
 * `Migration20200101046480_an_address_changed_after_an_admin_made_the_account`
 * applies the same rule to an account an admin created, whose baseline is the
 * address in the `admin.user_create` row instead of a `user.register` one.
 */
import { Migration20200101042800_an_email_the_account_typed_in_itself } from '../../../src/db/migrations/Migration20200101042800_an_email_the_account_typed_in_itself';
import { Migration20200101046480_an_address_changed_after_an_admin_made_the_account } from '../../../src/db/migrations/Migration20200101046480_an_address_changed_after_an_admin_made_the_account';
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
const ADMIN_MADE = 'Migration20200101046480_an_address_changed_after_an_admin_made_the_account';

async function ormBeforeTarget(target = TARGET): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(target);
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

async function seedAdminMade(orm: MikroORM): Promise<void> {
  // 9 is the admin. 1 was made by the admin and kept the address; 2 was made
  // and changed it itself (the colleague's address); 3 was made, changed, and
  // the admin set an email later; 4 was made and changed only the case; 5 has a
  // broken creation row; 6 registered and is already marked; 7 registered, kept
  // its address and reuses the id of an account the admin once made; 8 has no
  // audit row at all; 10 is a guest.
  await rawExec(
    orm,
    `INSERT INTO users (id, username, email, password_hash, email_self_asserted, is_guest) VALUES
       (1, 'kept', 'kept@test', 'x', 0, 0),
       (2, 'moved', 'colleague@test', 'x', 0, 0),
       (3, 'fixed', 'fixed-by-admin@test', 'x', 0, 0),
       (4, 'cased', 'Cased@Test', 'x', 0, 0),
       (5, 'broken', 'broken-now@test', 'x', 0, 0),
       (6, 'marked', 'marked-now@test', 'x', 1, 0),
       (7, 'reused', 'reused@test', 'x', 0, 0),
       (8, 'seeded', 'seeded-now@test', 'x', 0, 0),
       (9, 'admin', 'admin@test', 'x', 0, 0),
       (10, 'guest', 'guest-now@test', '', 0, 1)`,
  );
  await rawExec(
    orm,
    `INSERT INTO audit_log (user_id, action, resource, details) VALUES
       (9, 'admin.user_create', '1', '{"username":"kept","email":"kept@test","role":"user"}'),
       (9, 'admin.user_create', '2', '{"username":"moved","email":"moved@test","role":"user"}'),
       (9, 'admin.user_create', '3', '{"username":"fixed","email":"fixed@test","role":"user"}'),
       (9, 'admin.user_update', '3', '{"targetUser":"fixed-self@test","fields":["email"]}'),
       (9, 'admin.user_update', '2', '{"targetUser":"colleague@test","fields":["role"]}'),
       (9, 'admin.user_create', '4', '{"username":"cased","email":"cased@test","role":"user"}'),
       (9, 'admin.user_create', '5', 'not json'),
       (6, 'user.register', NULL, '{"username":"marked","email":"marked@test","role":"user"}'),
       (9, 'admin.user_create', '7', '{"username":"gone","email":"gone@test","role":"user"}'),
       (7, 'user.register', NULL, '{"username":"reused","email":"reused@test","role":"user"}'),
       (9, 'admin.user_create', '10', '{"username":"guest","email":"guest@test","role":"user"}')`,
  );
}

const ADMIN_MADE_EXPECTED = [
  { id: 1, email_self_asserted: 0 },
  { id: 2, email_self_asserted: 1 },
  { id: 3, email_self_asserted: 0 },
  { id: 4, email_self_asserted: 0 },
  { id: 5, email_self_asserted: 0 },
  { id: 6, email_self_asserted: 1 },
  { id: 7, email_self_asserted: 0 },
  { id: 8, email_self_asserted: 0 },
  { id: 9, email_self_asserted: 0 },
  { id: 10, email_self_asserted: 0 },
];

describe('admin-made account email migration', () => {
  it('EMAILSELF-MIG-003: an address an admin-made account changed itself is marked', async () => {
    const orm = await ormBeforeTarget(ADMIN_MADE);
    try {
      await seedAdminMade(orm);
      await migrateTo(orm, ADMIN_MADE);
      expect(await flags(orm)).toEqual(ADMIN_MADE_EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('EMAILSELF-MIG-004: running it again changes nothing', async () => {
    const orm = await ormBeforeTarget(ADMIN_MADE);
    try {
      await seedAdminMade(orm);
      await migrateTo(orm, ADMIN_MADE);
      await runMigrationDirect(orm, Migration20200101046480_an_address_changed_after_an_admin_made_the_account);
      expect(await flags(orm)).toEqual(ADMIN_MADE_EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('EMAILSELF-MIG-005: without an admin-made account nothing is read past the audit log', async () => {
    const orm = await ormBeforeTarget(ADMIN_MADE);
    try {
      await rawExec(
        orm,
        `INSERT INTO users (id, username, email, password_hash) VALUES (1, 'solo', 'solo-now@test', 'x')`,
      );
      await rawExec(
        orm,
        `INSERT INTO audit_log (user_id, action, resource, details) VALUES
           (1, 'user.register', NULL, '{"username":"solo","email":"solo@test","role":"user"}')`,
      );
      await migrateTo(orm, ADMIN_MADE);
      expect(await flags(orm)).toEqual([{ id: 1, email_self_asserted: 0 }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
