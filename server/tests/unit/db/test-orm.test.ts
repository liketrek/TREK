import { Users } from '../../../src/db/entities/Users.entity';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('createTestOrm', () => {
  it('ORM-001: reads through the very handle it was given', async () => {
    const { user } = createUser(testDb, { username: 'alice' });
    const found = await t.repo(Users).findOne({ id: user.id });
    expect(found?.username).toBe('alice');
  });

  it('ORM-002: clear() drops the identity map so a raw update is visible', async () => {
    const { user } = createUser(testDb, { username: 'bob' });
    await t.repo(Users).findOne({ id: user.id });
    testDb.prepare('UPDATE users SET username = ? WHERE id = ?').run('robert', user.id);
    t.clear();
    const again = await t.repo(Users).findOne({ id: user.id });
    expect(again?.username).toBe('robert');
  });

  it('ORM-003: closing the ORM leaves the handle usable', async () => {
    const local = await createTestOrm(testDb);
    // Force a real connection first — MikroORM connects lazily, so closing an
    // untouched ORM would prove nothing about NonClosingSqliteDriver.
    await local.repo(Users).findOne({ id: 1 });
    await local.close();
    expect(testDb.prepare('SELECT 1 AS one').get()).toEqual({ one: 1 });
  });
});
