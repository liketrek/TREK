/**
 * `TrekRepository` — the base class every repository under
 * `src/db/repositories/*.ts` extends (Plan 3b interlude B,
 * `.superpowers/sdd/2026-09-22-orm-phase3b/task-base-repo-brief.md`).
 *
 * Restores the program's D6 ratchet ("an unwrapped entrypoint fails
 * loudly") for every repository path, closing the gap
 * `task-1-rereview.md` F-R1 found: the `disableIdentityMap: true` ruling
 * (Plan 3b Task 1, B1) resolves its `EntityManager` with MikroORM's
 * non-validating `getContext(false)`, so a converted read stopped failing
 * closed outside a request context, and the write paths
 * (`nativeUpdate`/`nativeDelete`/`count`/`insert`/`upsert`) never validated
 * in the first place (`task-1-review.md` F7 INFO). This file drives every
 * overridden method against a real ORM with `allowGlobalContext: false`
 * (the production setting) — outside any request context each one must
 * reject with MikroORM's own `cannotUseGlobalContext` `ValidationError`;
 * inside `withRequestContext`/`uow.transactional` each must succeed exactly
 * as before.
 *
 * Uses the two concrete repositories the base class actually protects
 * (`UsersRepository` for find/findOne/count/nativeUpdate/nativeDelete/
 * insert/upsert/qb, `WebauthnChallengesRepository.claimChallenge` for the
 * one `kysely()` statement) rather than instantiating the abstract class
 * directly — `TrekRepository` is never instantiated on its own in
 * production either.
 *
 * **D-shape RULE for every regression test in the program written against
 * the `disableIdentityMap` ruling (task-4-review.md F1):** the column the
 * `nativeUpdate` targets must be in the FIRST, WIDER projection and absent
 * from the SECOND, narrower one. A stale write-back can only revert a
 * column whose value the second read's own snapshot does not already carry
 * fresh — if the write's target column is in the narrower, later-read
 * projection instead, that read's own snapshot is already correct for it
 * and no staleness is observable no matter what `disableIdentityMap` does.
 * `OAUTHCLIENTREPO-016` (`OauthClients.repository.test.ts`) had this
 * backwards until this task; `OAUTHTOKREPO-029` (`OauthTokens.repository
 * .test.ts`) already had it right and is the shape to copy.
 */
import { Users } from '../../../../src/db/entities/Users.entity';
import { WebauthnChallenges } from '../../../../src/db/entities/WebauthnChallenges.entity';
import type { UsersRepository } from '../../../../src/db/repositories/Users.repository';
import type { WebauthnChallengesRepository } from '../../../../src/db/repositories/WebauthnChallenges.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { countRows, findRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const GLOBAL_CONTEXT_ERROR = /global EntityManager|global context/i;

const testDb = createSnapshotTestDb();
let t: TestOrm;
let users: UsersRepository;
let challenges: WebauthnChallengesRepository;
let uow: UnitOfWork;

// Global context DISALLOWED here on purpose — the production setting, like
// tests/unit/nest/database/request-context.test.ts and
// tests/unit/nest/cron-registrar.service.test.ts's D6 describe block — so a
// repository call with no wrapper around it genuinely throws.
beforeAll(async () => {
  t = await createTestOrm(testDb, { allowGlobalContext: false });
  users = t.repo(Users);
  challenges = t.repo(WebauthnChallenges);
  uow = new UnitOfWork(t.em);
});
// `t.clear()` is deliberately NOT called here (unlike most repository test
// files): `EntityManager.clear()` itself calls the VALIDATING `getContext()`
// (`node_modules/@mikro-orm/core/EntityManager.js:1785`), so it would throw
// the same `cannotUseGlobalContext` this file exists to test, outside any
// request context. Every read in this file passes through
// `disableIdentityMap: true` (the base class's default), so nothing ever
// populates the identity map for a stale entry to clear between tests.
beforeEach(() => {
  resetTestDb(testDb);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('TrekRepository — every overridden path fails closed outside a request context', () => {
  it('TREKREPO-001: findOne rejects', async () => {
    await expect(users.findOne({ id: 1 })).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-002: find rejects', async () => {
    await expect(users.find({})).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-003: findAll rejects', async () => {
    await expect(users.findAll()).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  // Task 7 review, B-L5: mutating `validateRequestContext()` to a no-op
  // fails 11 of the other 12 fail-closed cases in this describe block — this
  // one still passes, because MikroORM's own `count()` path throws
  // `cannotUseGlobalContext` downstream regardless (it reaches the EM's
  // validating context on its own). The override here is defensive-
  // redundant for `count` specifically: this test proves end-to-end
  // behaviour, not that the override itself is load-bearing for this one
  // method — every other case in this file IS proof the override matters.
  it('TREKREPO-004: count rejects', async () => {
    await expect(users.count({})).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-005: nativeUpdate rejects', async () => {
    await expect(users.nativeUpdate({ id: 1 }, { username: 'outside-context' })).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-006: nativeDelete rejects', async () => {
    await expect(users.nativeDelete({ id: -1 })).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-007: insert rejects', async () => {
    await expect(
      users.insert({
        username: 'outside-context',
        email: 'outside@example.test',
        password_hash: 'h',
        role: 'user',
        first_seen_version: '1.0',
      }),
    ).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-008: upsert rejects', async () => {
    await expect(
      users.upsert({ id: 1, username: 'outside-context' }, { onConflictFields: ['id'], onConflictAction: 'merge' }),
    ).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-009: a QueryBuilder read (qb) rejects', () => {
    expect(() => users.qb('u')).toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-010: createQueryBuilder rejects', () => {
    expect(() => users.createQueryBuilder('u')).toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-011: a Kysely statement (the protected kysely() helper) rejects', async () => {
    await expect(challenges.claimChallenge('outside-context', 'registration', Date.now())).rejects.toThrow(
      GLOBAL_CONTEXT_ERROR,
    );
  });

  it('TREKREPO-012: getEntityManager() itself rejects', () => {
    expect(() => users.getEntityManager()).toThrow(GLOBAL_CONTEXT_ERROR);
  });

  // Task 7 review, M4: the seven previously-unoverridden base-class methods
  // (findOneOrFail/findAndCount/findByCursor/countBy/stream/insertMany/
  // upsertMany) — none used anywhere in this program today, but the first
  // one used would silently lose both guarantees with nothing to notice.
  it('TREKREPO-016: findOneOrFail rejects', async () => {
    await expect(users.findOneOrFail({ id: 1 })).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-017: findAndCount rejects', async () => {
    await expect(users.findAndCount({})).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-018: findByCursor rejects', async () => {
    await expect(users.findByCursor({ first: 1, orderBy: { id: 'asc' } })).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-019: countBy rejects', async () => {
    await expect(users.countBy('role')).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-020: stream rejects', () => {
    expect(() => users.stream()).toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-021: insertMany rejects', async () => {
    await expect(
      users.insertMany([
        {
          username: 'outside-context-many',
          email: 'outside-many@example.test',
          password_hash: 'h',
          role: 'user',
          first_seen_version: '1.0',
        },
      ]),
    ).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });

  it('TREKREPO-022: upsertMany rejects', async () => {
    await expect(
      users.upsertMany([{ id: 1, username: 'outside-context-upsert-many' }], {
        onConflictFields: ['id'],
        onConflictAction: 'merge',
      }),
    ).rejects.toThrow(GLOBAL_CONTEXT_ERROR);
  });
});

describe('TrekRepository — every overridden path succeeds inside withRequestContext', () => {
  it('TREKREPO-013: findOne/find/findAll/count/nativeUpdate/nativeDelete/insert/upsert/qb/kysely all succeed', async () => {
    const { user } = createUser(testDb, { username: 'inside-before', email: 'inside-before@example.test' });

    await withRequestContext(t.orm, async () => {
      await expect(users.findOne({ id: user.id })).resolves.not.toBeNull();
      await expect(users.find({ id: user.id })).resolves.toHaveLength(1);
      await expect(users.findAll({ limit: 1 })).resolves.toHaveLength(1);
      await expect(users.count({})).resolves.toBeGreaterThan(0);
      await expect(users.nativeUpdate({ id: user.id }, { username: 'inside-after' })).resolves.toBe(1);

      const qbRow = await users
        .qb('u')
        .select('u.id')
        .where({ id: user.id })
        .execute<{ id: number } | undefined>('get', false);
      expect(qbRow?.id).toBe(user.id);

      const cbRow = await users
        .createQueryBuilder('u')
        .select('u.id')
        .where({ id: user.id })
        .execute<{ id: number } | undefined>('get', false);
      expect(cbRow?.id).toBe(user.id);

      // Kysely: proving the statement runs at all (no throw), not its result shape.
      await expect(challenges.claimChallenge('inside-context', 'registration', Date.now())).resolves.toBeNull();

      const inserted = await users.insert({
        username: 'inside-new',
        email: 'inside-new@example.test',
        password_hash: 'h',
        role: 'user',
        first_seen_version: '1.0',
      });
      expect(typeof inserted).toBe('number');

      await users.upsert(
        {
          id: user.id,
          username: 'inside-upserted',
          email: user.email,
          password_hash: 'h',
          role: 'user',
          first_seen_version: '1.0',
        },
        { onConflictFields: ['id'], onConflictAction: 'merge' },
      );

      expect(users.getEntityManager()).toBeDefined();

      await users.nativeDelete({ id: inserted as number });
    });

    const row = await findRow(t, Users, { id: user.id });
    expect(row?.username).toBe('inside-upserted'); // the upsert's merge is the last write and must stick
  });

  // Task 7 review, M4 — the same seven methods, inside a request context.
  it('TREKREPO-023: findOneOrFail/findAndCount/findByCursor/countBy/stream/insertMany/upsertMany all succeed', async () => {
    const { user } = createUser(testDb, { username: 'm4-before', email: 'm4-before@example.test' });

    await withRequestContext(t.orm, async () => {
      await expect(users.findOneOrFail({ id: user.id })).resolves.not.toBeNull();

      const [rows, count] = await users.findAndCount({ id: user.id });
      expect(rows).toHaveLength(1);
      expect(count).toBe(1);

      const cursor = await users.findByCursor({ first: 1, orderBy: { id: 'asc' } });
      expect(cursor.items.length).toBeGreaterThan(0);

      const counts = await users.countBy('role');
      expect(counts['user']).toBeGreaterThan(0);

      const streamed: number[] = [];
      for await (const row of users.stream({ where: { id: user.id } })) {
        streamed.push(row.id);
      }
      expect(streamed).toEqual([user.id]);

      // SQLite (via better-sqlite3) does not return one primary key per row
      // for a batch insert — only that it does not throw inside a request
      // context is what this test proves; the row count is verified below
      // from a fresh context of its own, outside this one.
      await users.insertMany([
        {
          username: 'm4-many-1',
          email: 'm4-many-1@example.test',
          password_hash: 'h',
          role: 'user',
          first_seen_version: '1.0',
        },
        {
          username: 'm4-many-2',
          email: 'm4-many-2@example.test',
          password_hash: 'h',
          role: 'user',
          first_seen_version: '1.0',
        },
      ]);

      const upserted = await users.upsertMany(
        [
          {
            id: user.id,
            username: 'm4-upserted',
            email: user.email,
            password_hash: 'h',
            role: 'user',
            first_seen_version: '1.0',
          },
        ],
        { onConflictFields: ['id'], onConflictAction: 'merge' },
      );
      expect(upserted).toHaveLength(1);
    });

    const row = await findRow(t, Users, { id: user.id });
    expect(row?.username).toBe('m4-upserted');
    expect(await countRows(t, Users, { username: { $like: 'm4-many-%' } })).toBe(2);
  });
});

describe('TrekRepository — inside uow.transactional', () => {
  it("TREKREPO-014: a disableIdentityMap read sees the transaction's own uncommitted write", async () => {
    const { user } = createUser(testDb, { username: 'tx-before' });
    let seenInsideTx: string | undefined;

    await withRequestContext(t.orm, async () => {
      await uow.transactional(async () => {
        await users.nativeUpdate({ id: user.id }, { username: 'tx-uncommitted' });
        const row = await users.findOne({ id: user.id }, { fields: ['username'] });
        seenInsideTx = row?.username;
      });
    });

    expect(seenInsideTx).toBe('tx-uncommitted');
  });

  it("TREKREPO-015: disableIdentityMap is in effect by default — a raw UPDATE between two reads is seen, no stale write-back on the closing flush (reuses identity-map-writeback.test.ts's shape)", async () => {
    const { user } = createUser(testDb, { username: 'before', email: 'before@example.test' });

    await withRequestContext(t.orm, async () => {
      // Two differently-projected reads of the same row — the D-shape B1
      // depends on, if the entity were left managed.
      await users.findOne({ id: user.id }, { fields: ['username'] });
      await users.findOne({ id: user.id }, { fields: ['email'] });
      await uow.transactional(async () => {
        await users.nativeUpdate({ id: user.id }, { username: 'after' });
      });
    });

    const row = await findRow(t, Users, { id: user.id });
    expect(row?.username).toBe('after'); // the nativeUpdate must stick
    expect(row?.email).toBe('before@example.test'); // untouched by either read
  });
});
