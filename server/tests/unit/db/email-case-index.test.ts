/**
 * `Migration20200101042400_one_account_per_email_whatever_its_case` and the
 * boot step that finishes its job (`src/db/email-case-index.ts`): one account
 * per email address whatever its case, without ever failing the boot of an
 * install that already holds such a pair.
 */
import { ensureEmailCaseIndex } from '../../../src/db/email-case-index';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { afterEach, describe, expect, it, vi } from 'vitest';

const TARGET = 'Migration20200101042400_one_account_per_email_whatever_its_case';

let orm: MikroORM | null = null;

async function ormBeforeTarget(): Promise<MikroORM> {
  orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function addUser(db: MikroORM, id: number, email: string): Promise<void> {
  await rawExec(db, 'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', [
    id,
    `user${id}`,
    email,
    'x',
  ]);
}

const hasIndex = async (db: MikroORM) =>
  (await rawQuery(db, `SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_users_email_lower'`))
    .length === 1;
const pendingFlag = async (db: MikroORM) =>
  rawQuery<{ value: string }>(db, `SELECT value FROM app_settings WHERE key = 'email_case_index_pending'`);

afterEach(async () => {
  vi.restoreAllMocks();
  await orm?.close(true);
  orm = null;
});

describe('one account per email address, whatever its case', () => {
  it('EMAILCI-001: without case duplicates the index is created and refuses a second account in other case', async () => {
    const db = await ormBeforeTarget();
    await addUser(db, 1, 'Anna@Example.test');
    await addUser(db, 2, 'bob@example.test');

    await migrateTo(db, TARGET);

    expect(await hasIndex(db)).toBe(true);
    expect(await pendingFlag(db)).toEqual([]);
    await expect(addUser(db, 3, 'anna@example.TEST')).rejects.toThrow(/UNIQUE constraint failed/);
    // Mixed case itself is fine: only a second account for the same address is not.
    expect(await rawQuery(db, 'SELECT email FROM users ORDER BY id')).toEqual([
      { email: 'Anna@Example.test' },
      { email: 'bob@example.test' },
    ]);
  }, 30000);

  it('EMAILCI-002: with case duplicates the boot goes on, names the accounts, and the index waits', async () => {
    const db = await ormBeforeTarget();
    await addUser(db, 1, 'anna@example.test');
    await addUser(db, 2, 'Anna@Example.test');
    await addUser(db, 3, 'carl@example.test');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(migrateTo(db, TARGET)).resolves.toBeUndefined();

    expect(await hasIndex(db)).toBe(false);
    expect(await pendingFlag(db)).toEqual([{ value: 'true' }]);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain('1 email address(es) belong to more than one account');
    expect(message).toContain('user ids 1, 2');
    expect(message).not.toContain('anna@example.test');
  }, 30000);

  it('EMAILCI-003: the boot step repeats the warning while the pair remains, then creates the index once it is gone', async () => {
    const db = await ormBeforeTarget();
    await addUser(db, 1, 'anna@example.test');
    await addUser(db, 2, 'ANNA@example.test');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await migrateTo(db, TARGET);
    warn.mockClear();

    await ensureEmailCaseIndex(db.em.getConnection());
    expect(await hasIndex(db)).toBe(false);
    expect(String(warn.mock.calls[0]?.[0])).toContain('still belong to more than one account');

    await rawExec(db, `UPDATE users SET email = 'anna.work@example.test' WHERE id = 2`);
    await ensureEmailCaseIndex(db.em.getConnection());
    expect(await hasIndex(db)).toBe(true);
    expect(await pendingFlag(db)).toEqual([]);

    // Nothing owed any more: a later boot does nothing.
    warn.mockClear();
    await ensureEmailCaseIndex(db.em.getConnection());
    expect(warn).not.toHaveBeenCalled();
  }, 30000);
});
