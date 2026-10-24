import { Users } from '../../../src/db/entities/Users.entity';
import type { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { countRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestUnitOfWork, sharedTestOrm } from '../../helpers/test-uow';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let uow: UnitOfWork;

beforeAll(async () => {
  uow = await createTestUnitOfWork(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

const countUsers = async () => countRows(await sharedTestOrm(testDb), Users);

describe('createTestUnitOfWork', () => {
  it('TUOW-001: raw better-sqlite3 statements inside transactional() commit together', async () => {
    await uow.transactional(async () => {
      createUser(testDb);
      createUser(testDb);
    });
    expect(await countUsers()).toBe(2);
  });

  it('TUOW-002: a throw rolls raw statements back', async () => {
    await expect(
      uow.transactional(async () => {
        createUser(testDb);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await countUsers()).toBe(0);
  });

  it('TUOW-003: the helper is memoised per handle', async () => {
    const again = await createTestUnitOfWork(testDb);
    expect(again).toBe(uow);
  });
});
