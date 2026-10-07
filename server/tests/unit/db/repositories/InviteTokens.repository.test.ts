import { InviteTokens } from '../../../../src/db/entities/InviteTokens.entity';
import type { InviteTokensRepository } from '../../../../src/db/repositories/InviteTokens.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createInviteToken, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let invites: InviteTokensRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  invites = t.repo(InviteTokens);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawInvite(id: number): unknown {
  return testDb.prepare('SELECT * FROM invite_tokens WHERE id = ?').get(id);
}

/**
 * Spies on the ORM connection to capture the raw generated SQL of the one
 * query `fn` runs, the same idiom `Categories.repository.test.ts`'s
 * `withQueryCount` uses for a call-count assertion — here for the query
 * text itself, since `listWithCreatorAndTrip`/`findWithCreatorAndTrip` run
 * with `mapResults: false` and return driver rows, not a QueryBuilder a
 * test could inspect directly (Plan 3b Task 3 review, F4).
 */
async function captureSql<T>(fn: () => Promise<T>): Promise<{ value: T; sql: string }> {
  const connection = t.orm.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  try {
    const value = await fn();
    const call = spy.mock.calls.find((c) => typeof c[0] === 'string' && c[0].includes('invite_tokens'));
    return { value, sql: (call?.[0] as string | undefined) ?? '' };
  } finally {
    spy.mockRestore();
  }
}

describe('InviteTokensRepository', () => {
  describe('findByToken', () => {
    it('INVREPO-001: a row read through findByToken is the SELECT * row, key for key', async () => {
      const created = createInviteToken(testDb, { token: 'find-me' });
      const row = await invites.findByToken('find-me');
      expect(row).toStrictEqual(rawInvite(created.id));
    });

    it('INVREPO-002: an unknown token is null', async () => {
      expect(await invites.findByToken('does-not-exist')).toBeNull();
    });
  });

  describe('insertInvite', () => {
    it('INVREPO-003: inserts and returns exactly the row the legacy re-select would return', async () => {
      const { user } = createUser(testDb);
      const row = await invites.insertInvite({
        token: 'insert-me',
        max_uses: 3,
        expires_at: null,
        created_by: user.id,
      });
      expect(row).toStrictEqual(rawInvite(row.id));
      expect(row.token).toBe('insert-me');
      expect(row.max_uses).toBe(3);
      expect(row.used_count).toBe(0);
      expect(row.created_by).toBe(user.id);
      expect(row.trip_id).toBeNull();
      expect(typeof row.created_at).toBe('string');
    });

    it('INVREPO-004: trip_id is written when given (per-trip invite)', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const row = await invites.insertInvite({
        token: 'trip-bound',
        max_uses: 1,
        expires_at: null,
        created_by: user.id,
        trip_id: trip.id,
      });
      expect(row.trip_id).toBe(trip.id);
    });
  });

  describe('incrementUsedCount', () => {
    it('INVREPO-005: under capacity — increments and returns the updated row', async () => {
      const created = createInviteToken(testDb, { token: 'under-cap', max_uses: 3 });
      const row = await invites.incrementUsedCount('under-cap');
      expect(row).not.toBeNull();
      expect(row?.used_count).toBe(1);
      expect(row).toStrictEqual(rawInvite(created.id));
    });

    it('INVREPO-006: at capacity — no row matches, returns null, used_count unchanged', async () => {
      const created = createInviteToken(testDb, { token: 'at-cap', max_uses: 1 });
      testDb.prepare('UPDATE invite_tokens SET used_count = 1 WHERE id = ?').run(created.id);
      const row = await invites.incrementUsedCount('at-cap');
      expect(row).toBeNull();
      expect((rawInvite(created.id) as { used_count: number }).used_count).toBe(1);
    });

    it('INVREPO-007: max_uses = 0 means unlimited — always increments', async () => {
      createInviteToken(testDb, { token: 'unlimited', max_uses: 0 });
      testDb.prepare("UPDATE invite_tokens SET used_count = 500 WHERE token = 'unlimited'").run();
      const row = await invites.incrementUsedCount('unlimited');
      expect(row?.used_count).toBe(501);
    });

    it('INVREPO-008: an unknown token returns null', async () => {
      expect(await invites.incrementUsedCount('nonexistent-token')).toBeNull();
    });

    it('INVREPO-009: two concurrent increments on a one-use invite — exactly one wins (D6 single-connection race safety)', async () => {
      const created = createInviteToken(testDb, { token: 'race-me', max_uses: 1 });
      const [a, b] = await Promise.all([invites.incrementUsedCount('race-me'), invites.incrementUsedCount('race-me')]);
      const results = [a, b];
      const winners = results.filter((r) => r !== null);
      const losers = results.filter((r) => r === null);
      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(1);
      expect(winners[0]?.used_count).toBe(1);
      expect((rawInvite(created.id) as { used_count: number }).used_count).toBe(1);
    });
  });

  // RI1/RI5 — the admin invite list's joined projection.
  describe('listWithCreatorAndTrip / findWithCreatorAndTrip', () => {
    it("INVREPO-010: projects the creator's username and a bound trip's title, newest first", async () => {
      const { user: admin } = createUser(testDb, { username: 'inviter-1' });
      const trip = createTrip(testDb, admin.id, { title: 'Bound Trip' });
      const older = createInviteToken(testDb, { token: 'older', created_by: admin.id });
      testDb.prepare('UPDATE invite_tokens SET created_at = ? WHERE id = ?').run('2026-01-01 00:00:00', older.id);
      const newer = createInviteToken(testDb, { token: 'newer', created_by: admin.id });
      testDb
        .prepare('UPDATE invite_tokens SET created_at = ?, trip_id = ? WHERE id = ?')
        .run('2026-02-01 00:00:00', trip.id, newer.id);

      const rows = await invites.listWithCreatorAndTrip();

      expect(rows.map((r) => r.token)).toEqual(['newer', 'older']); // ORDER BY created_at DESC
      expect(rows[0]).toMatchObject({
        token: 'newer',
        created_by_name: 'inviter-1',
        trip_title: 'Bound Trip',
        trip_id: trip.id,
      });
      expect(rows[1]).toMatchObject({ token: 'older', created_by_name: 'inviter-1', trip_title: null, trip_id: null });
    });

    it('INVREPO-011: findWithCreatorAndTrip filters the same projection to one id', async () => {
      const { user: admin } = createUser(testDb, { username: 'inviter-2' });
      const invite = createInviteToken(testDb, { token: 'single', created_by: admin.id });

      const row = await invites.findWithCreatorAndTrip(invite.id);
      expect(row).toMatchObject({ id: invite.id, token: 'single', created_by_name: 'inviter-2', trip_title: null });
    });

    it('INVREPO-012: findWithCreatorAndTrip is null for an unknown id', async () => {
      expect(await invites.findWithCreatorAndTrip(999_999)).toBeNull();
    });

    it("INVREPO-015: the generated SQL joins users with an INNER JOIN and trips with a LEFT JOIN — pins RI1's join TYPE (Plan 3b Task 3 review, F4; a `leftJoin` rewrite of the users join must fail this)", async () => {
      const { user: admin } = createUser(testDb, { username: 'join-type-check' });
      createInviteToken(testDb, { token: 'join-type-check', created_by: admin.id });

      const { sql } = await captureSql(() => invites.listWithCreatorAndTrip());

      expect(sql).toMatch(/inner join `?users`?/i);
      expect(sql).toMatch(/left join `?trips`?/i);
      expect(sql).not.toMatch(/left join `?users`?/i);
    });

    it("INVREPO-016: findWithCreatorAndTrip's generated SQL joins users with an INNER JOIN and trips with a LEFT JOIN — pins RI5's join TYPE (task-3-rereview.md R2; a `leftJoin` rewrite of the users join must fail this)", async () => {
      const { user: admin } = createUser(testDb, { username: 'join-type-check-single' });
      const invite = createInviteToken(testDb, { token: 'join-type-check-single', created_by: admin.id });

      const { sql } = await captureSql(() => invites.findWithCreatorAndTrip(invite.id));

      expect(sql).toMatch(/inner join `?users`?/i);
      expect(sql).toMatch(/left join `?trips`?/i);
      expect(sql).not.toMatch(/left join `?users`?/i);
    });
  });

  // RI6/RI7 — deleteInvite's 404 check and the delete itself.
  describe('findIdById / deleteById', () => {
    it('INVREPO-013: findIdById returns the id for a known row, null otherwise', async () => {
      const invite = createInviteToken(testDb, { token: 'exists' });
      expect(await invites.findIdById(invite.id)).toBe(invite.id);
      expect(await invites.findIdById(999_999)).toBeNull();
    });

    it('INVREPO-014: deleteById removes exactly that row', async () => {
      const keep = createInviteToken(testDb, { token: 'keep' });
      const gone = createInviteToken(testDb, { token: 'gone' });

      await invites.deleteById(gone.id);

      expect(rawInvite(gone.id)).toBeUndefined();
      expect(rawInvite(keep.id)).toBeDefined();
    });
  });

  // Task 7 review, M2: InviteTokensRepository had no D-shape identity-map
  // test at all, although `findByToken`/`insertInvite`'s own docstrings
  // both cite the disableIdentityMap-not-refresh ruling. The shape: wide
  // findByToken (carries used_count) first, narrow findIdById (`fields:
  // ['id']`, no used_count) second, then a nativeUpdate-equivalent write
  // (incrementUsedCount, via the QueryBuilder) inside uow.transactional —
  // this repository is a Plan-3b-created one on a public, unauthenticated
  // route (GET /api/auth/invite/:token) that also runs inside
  // registerUser's transaction.
  describe('identity-map isolation (D-shape, program RULING)', () => {
    it('INVREPO-017: incrementUsedCount inside uow.transactional is not discarded by a stale entity read earlier under a different projection', async () => {
      const { user: admin } = createUser(testDb, { username: 'invrepo-017-admin' });
      const invite = createInviteToken(testDb, { token: 'invrepo-017', max_uses: 5, created_by: admin.id });
      const uow = new UnitOfWork(t.em);

      await withRequestContext(t.orm, async () => {
        // Projection A — wide, full row, carries used_count.
        const before = await invites.findByToken('invrepo-017');
        expect(before!.used_count).toBe(0);
        // Projection B — narrow, `fields: ['id']`, no used_count.
        await invites.findIdById(invite.id);

        await uow.transactional(async () => {
          await invites.incrementUsedCount('invrepo-017');
        });
      });

      // A column only the wide read carried (`max_uses`) must be unchanged,
      // and the write itself must have stuck.
      const after = await invites.findByToken('invrepo-017');
      expect(after!.used_count).toBe(1);
      expect(after!.max_uses).toBe(5);
      expect((rawInvite(invite.id) as { used_count: number }).used_count).toBe(1);
    });
  });
});
