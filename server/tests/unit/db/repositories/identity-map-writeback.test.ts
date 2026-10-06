/**
 * Regression test for Plan 3b Task 1's B1 finding
 * (`.superpowers/sdd/2026-09-22-orm-phase3b/task-1-review.md`): a `Users`
 * row read with `fields` + `refresh: true` (no `disableIdentityMap`) left a
 * *partially hydrated, managed* entity in the request `EntityManager`'s
 * identity map. A second such read, with a *different* field set, on the
 * *same* row re-snapshotted only its own fields — the first read's fields
 * stayed on the entity object but fell out of the snapshot MikroORM's
 * change-set computer diffs against, so they looked like a pending change.
 * The next `flush()` (including the implicit one at `UnitOfWork.transactional`
 * commit) then emitted an `UPDATE users SET <those columns> …` carrying the
 * STALE pre-request values, landing *after* an intervening `nativeUpdate`
 * inside the same transaction and silently reverting it.
 *
 * No single-method test can catch this by construction (`Users.repository.test.ts`
 * exercises one method per case): this file drives the two-reads-then-a-write
 * interaction that is the actual trigger, inside `withRequestContext` (every
 * authenticated request's shape) and `uow.transactional` (every multi-write
 * request's shape).
 *
 * The fix (this task): every row-out read passes `disableIdentityMap: true`.
 * MikroORM forks the EM with `keepTransactionContext: true`, loads inside the
 * fork, then clears it — nothing is added to the *request's* identity map, so
 * there is nothing for a later `flush()` to find dirty.
 * See https://mikro-orm.io/docs/entity-manager#disableidentitymap and
 * `node_modules/@mikro-orm/core/EntityManager.js:807-824`.
 *
 * Mutation proof (recorded in `task-1-fix-report.md`, not re-run here): reverting
 * ONE of the two reads below to the pre-fix shape (`fields` + `refresh: true`,
 * no `disableIdentityMap`) makes IMWB-001 fail with the stale write-back this
 * test is built to catch.
 */
import { Users } from '../../../../src/db/entities/Users.entity';
import type { UsersRepository } from '../../../../src/db/repositories/Users.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let users: UsersRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  users = t.repo(Users);
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

describe('identity-map write-back (task-1-review.md B1)', () => {
  it('IMWB-001: findByIdWithPasswordVersion then getApiKeyColumns then patchProfile — the profile write survives the request', async () => {
    const { user } = createUser(testDb, { username: 'before', email: 'before@example.test' });
    const originalPasswordVersion = (
      testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(user.id) as { password_version: number }
    ).password_version;

    await withRequestContext(t.orm, async () => {
      // Projection A — the JwtAuthGuard/GlobalAuthGuard shape.
      await users.findByIdWithPasswordVersion(user.id);
      // Projection B — a second UsersRepository read with a different field set,
      // the UserProfileService shape (e.g. the MfaPolicyGuard/getApiKeyColumns
      // reads that run on the same request).
      await users.getApiKeyColumns(user.id);
      // The intended write, inside the request's own transaction.
      await uow.transactional(async () => {
        await users.patchProfile(user.id, { username: 'newname' });
      });
    });

    const row = testDb.prepare('SELECT username, email, password_version FROM users WHERE id = ?').get(user.id) as {
      username: string;
      email: string;
      password_version: number;
    };
    expect(row.username).toBe('newname'); // the nativeUpdate must stick
    expect(row.email).toBe('before@example.test'); // untouched by either read
    expect(row.password_version).toBe(originalPasswordVersion); // untouched by either read
  });

  it('IMWB-002: findByIdWithPasswordVersion then getApiKeyColumns then setPassword — password_version survives (Task 5 session-invalidation case)', async () => {
    const { user } = createUser(testDb, { username: 'someone' });

    await withRequestContext(t.orm, async () => {
      await users.findByIdWithPasswordVersion(user.id);
      await users.getApiKeyColumns(user.id);
      await uow.transactional(async () => {
        await users.setPassword(user.id, 'NEWHASH', 5);
      });
    });

    const row = testDb
      .prepare('SELECT password_hash, password_version, username FROM users WHERE id = ?')
      .get(user.id) as { password_hash: string; password_version: number; username: string };
    expect(row.password_hash).toBe('NEWHASH');
    expect(row.password_version).toBe(5); // the session-invalidation gate — must NOT revert to the pre-change value
    expect(row.username).toBe('someone'); // untouched by either read
  });
});
