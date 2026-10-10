import { Users } from '../../../../src/db/entities/Users.entity';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;

// Global context DISALLOWED here on purpose: this is the production setting.
beforeAll(async () => {
  t = await createTestOrm(testDb, { allowGlobalContext: false });
});
beforeEach(() => resetTestDb(testDb));
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('withRequestContext', () => {
  it('CTX-001: the global EntityManager refuses a query outside a context', async () => {
    createUser(testDb);
    await expect(t.orm.em.find(Users, {})).rejects.toThrow(/global EntityManager|global context/i);
  });

  it('CTX-002: inside the helper the same call succeeds on a request-scoped fork', async () => {
    const { user } = createUser(testDb);
    const found = await withRequestContext(t.orm, () => t.orm.em.findOne(Users, { id: user.id }));
    expect(found?.id).toBe(user.id);
  });

  it('CTX-003: two contexts do not share an identity map', async () => {
    const { user } = createUser(testDb);
    const a = await withRequestContext(t.orm, () => t.orm.em.findOneOrFail(Users, { id: user.id }));
    const b = await withRequestContext(t.orm, () => t.orm.em.findOneOrFail(Users, { id: user.id }));
    // Compared as a boolean, not with `expect(a).not.toBe(b)`: on a failed
    // `Object.is`, vitest's `toBe` still runs a deep `equals()` with
    // `iterableEquality` to offer the "replace toBe with toEqual" hint, and
    // that iterates these entities' uninitialized `Collection` properties,
    // which throw. The assertion below is the same identity check without it.
    expect(a === b).toBe(false);
  });
});
