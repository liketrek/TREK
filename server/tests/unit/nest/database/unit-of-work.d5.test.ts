import { Users } from '../../../../src/db/entities/Users.entity';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { TransactionContext } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * D5 ratchet (task-6-fix-brief.md item 2; task-1-2-rereview.md's "half that
 * IS testable"): the property `test-uow.ts`'s one-ORM-per-handle wiring
 * exists to protect is not "the split (two-ORM) wiring was broken" — measured
 * and disproven in that re-review, since `TransactionContext.getEntityManager`
 * matches on the EntityManager's CONTEXT NAME, not the ORM instance, so even
 * a repository built from a second `MikroORM.init` over the same handle
 * resolves the open transaction correctly. The property that IS real, and
 * WAS previously unpinned by any test, is global-context-resolving EM vs a
 * manually forked one: a fork defaults to `useContext: false`, so its
 * `getContext()` returns itself and ignores `TransactionContext` — a
 * repository built on a fork used inside `uow.transactional(...)` would
 * write outside the open transaction, on a second connection the
 * transaction is holding.
 */
const testDb = createSnapshotTestDb();
let t: TestOrm;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('UnitOfWork transaction resolution (D5)', () => {
  it('UOW-D5-001: a repository built on the global, context-resolving EM resolves the SAME EntityManager transactional() opens — a manual fork() does not', async () => {
    createUser(testDb);
    let globalMatches: boolean | undefined;
    let forkMatches: boolean | undefined;

    await uow.transactional(async () => {
      const repo = t.repo(Users);
      globalMatches = repo.getEntityManager().getContext() === TransactionContext.getEntityManager();

      const forkedRepo = t.orm.em.fork().getRepository(Users);
      forkMatches = forkedRepo.getEntityManager().getContext() === TransactionContext.getEntityManager();
    });

    expect(globalMatches).toBe(true);
    expect(forkMatches).toBe(false);
  });
});
