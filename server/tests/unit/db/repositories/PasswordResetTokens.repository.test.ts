import { PasswordResetTokens } from '../../../../src/db/entities/PasswordResetTokens.entity';
import type { PasswordResetTokensRepository } from '../../../../src/db/repositories/PasswordResetTokens.repository';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { createHash } from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tokens: PasswordResetTokensRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tokens = t.repo(PasswordResetTokens);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function hash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function rawRow(id: number): {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_ip: string | null;
} {
  return testDb
    .prepare(
      'SELECT id, user_id, token_hash, expires_at, consumed_at, created_ip FROM password_reset_tokens WHERE id = ?',
    )
    .get(id) as never;
}

function seedToken(
  userId: number,
  tokenHash: string,
  opts: { expires_at?: string; consumed_at?: string | null; created_ip?: string | null } = {},
): number {
  const expiresAt = opts.expires_at ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const result = testDb
    .prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, consumed_at, created_ip) VALUES (?, ?, ?, ?, ?)',
    )
    .run(userId, tokenHash, expiresAt, opts.consumed_at ?? null, opts.created_ip ?? null);
  return Number(result.lastInsertRowid);
}

describe('PasswordResetTokensRepository', () => {
  describe('insertToken', () => {
    it('PWDRESETREPO-001: writes the exact column set, hash-only (the raw token never appears)', async () => {
      const { user } = createUser(testDb);
      const tokenHash = hash('raw-token-value');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await tokens.insertToken({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_ip: '1.2.3.4',
      });

      const row = testDb
        .prepare(
          'SELECT user_id, token_hash, expires_at, consumed_at, created_ip FROM password_reset_tokens WHERE token_hash = ?',
        )
        .get(tokenHash);
      expect(row).toEqual({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        consumed_at: null,
        created_ip: '1.2.3.4',
      });
    });

    it('PWDRESETREPO-002: writes a NULL created_ip', async () => {
      const { user } = createUser(testDb);
      const tokenHash = hash('no-ip-token');
      await tokens.insertToken({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date().toISOString(),
        created_ip: null,
      });

      const row = testDb
        .prepare('SELECT created_ip FROM password_reset_tokens WHERE token_hash = ?')
        .get(tokenHash) as { created_ip: string | null };
      expect(row.created_ip).toBeNull();
    });
  });

  describe('findByTokenHash', () => {
    it('PWDRESETREPO-003: finds a live token by its hash', async () => {
      const { user } = createUser(testDb);
      const tokenHash = hash('lookup-me');
      const id = seedToken(user.id, tokenHash);

      const found = await tokens.findByTokenHash(tokenHash);

      expect(found).toEqual({ id, user_id: user.id, expires_at: expect.any(String), consumed_at: null });
    });

    it('PWDRESETREPO-004: a consumed token is still found (consumed_at is checked by the caller, not filtered here)', async () => {
      const { user } = createUser(testDb);
      const tokenHash = hash('already-used');
      seedToken(user.id, tokenHash, { consumed_at: '2026-01-01T00:00:00.000Z' });

      const found = await tokens.findByTokenHash(tokenHash);

      expect(found?.consumed_at).toBe('2026-01-01T00:00:00.000Z');
    });

    it('PWDRESETREPO-005: an unknown hash is null', async () => {
      expect(await tokens.findByTokenHash(hash('never-issued'))).toBeNull();
    });
  });

  describe('markConsumed', () => {
    it('PWDRESETREPO-006: stamps consumed_at on the target row only', async () => {
      const { user } = createUser(testDb);
      const target = seedToken(user.id, hash('mark-me'));
      const other = seedToken(user.id, hash('leave-me'));

      await tokens.markConsumed(target);

      expect(rawRow(target).consumed_at).not.toBeNull();
      expect(rawRow(other).consumed_at).toBeNull();
    });
  });

  describe('consumeAllLiveForUser', () => {
    it('PWDRESETREPO-007: without an exclusion, burns every live token for the user', async () => {
      const { user } = createUser(testDb);
      const a = seedToken(user.id, hash('a'));
      const b = seedToken(user.id, hash('b'));

      await tokens.consumeAllLiveForUser(user.id);

      expect(rawRow(a).consumed_at).not.toBeNull();
      expect(rawRow(b).consumed_at).not.toBeNull();
    });

    it('PWDRESETREPO-008: with an exclusion, burns every OTHER live token but leaves the excluded id alone', async () => {
      const { user } = createUser(testDb);
      const keep = seedToken(user.id, hash('keep-me'));
      const burn1 = seedToken(user.id, hash('burn-1'));
      const burn2 = seedToken(user.id, hash('burn-2'));

      await tokens.consumeAllLiveForUser(user.id, keep);

      expect(rawRow(keep).consumed_at).toBeNull();
      expect(rawRow(burn1).consumed_at).not.toBeNull();
      expect(rawRow(burn2).consumed_at).not.toBeNull();
    });

    it("PWDRESETREPO-009: never touches another user's tokens or an already-consumed row", async () => {
      const { user: victim } = createUser(testDb);
      const { user: bystander } = createUser(testDb);
      const already = seedToken(victim.id, hash('already-consumed'), { consumed_at: '2026-01-01T00:00:00.000Z' });
      const bystanderToken = seedToken(bystander.id, hash('bystander'));

      await tokens.consumeAllLiveForUser(victim.id);

      // The already-consumed row's consumed_at is untouched (still the original
      // stamp, not overwritten by this call — the WHERE only matches consumed_at
      // IS NULL rows).
      expect(rawRow(already).consumed_at).toBe('2026-01-01T00:00:00.000Z');
      expect(rawRow(bystanderToken).consumed_at).toBeNull();
    });
  });

  // ---------------------------------------------------------------------
  // Identity-map isolation (Plan 3b Task 5 ruling — every row-out read
  // passes `disableIdentityMap: true`, applied by `TrekRepository`'s
  // default). This repository has only ONE entity-hydrating read method
  // (`findByTokenHash`) — unlike `McpTokensRepository`/`Users.repository.ts`,
  // which each have two differently-projected NAMED read methods to
  // combine. PWDRESETREPO-010 is the structural proof (no managed entity
  // left behind); PWDRESETREPO-011 pins the REAL call shape (`findByTokenHash`
  // then `markConsumed` inside the same `uow.transactional`) as safe under
  // the shipped default, but — by construction — it CANNOT fail: a single
  // managed read re-snapshots every field it names, so nothing is dirty at
  // the closing flush regardless of whether the mechanism exists on this
  // table. It is not, on its own, proof the B1 stale-write-back mechanism
  // (`task-1-review.md` B1) is absent here.
  //
  // Task 5's original report tried a THIRD test — two raw `find`/`findOne`
  // calls with disjoint field sets, `disableIdentityMap: false` — and did
  // not reproduce it. `task-5-review-template.md` T2 found that attempt used
  // the ordering `task-4-review.md` F1 already showed is non-load-bearing
  // (narrower projection first). The mechanism DOES reproduce on this table
  // once the WIDER projection — the one carrying the written column,
  // `consumed_at` — runs FIRST: PWDRESETREPO-012 pairs this repository's own
  // read (projection A, wide) with a narrower **managed** `em.findOne`
  // (projection B) and is mutation-proved (green here, red once
  // `findByTokenHash` is forced to `disableIdentityMap: false, refresh:
  // true` — see the fix report). PWDRESETREPO-013 repeats the shape for
  // `consumeAllLiveForUser`, the repository's other write method.
  // ---------------------------------------------------------------------

  describe('identity-map isolation', () => {
    it('PWDRESETREPO-010: findByTokenHash never leaves a managed entity behind', async () => {
      const { user } = createUser(testDb);
      const id = seedToken(user.id, hash('isolated'));

      await tokens.findByTokenHash(hash('isolated'));

      expect(t.em.getUnitOfWork().getById(PasswordResetTokens, id)).toBeUndefined();
    });

    it('PWDRESETREPO-011: findByTokenHash then markConsumed inside uow.transactional survives the closing flush (cannot fail by construction — see PWDRESETREPO-012 for the mutation-proved guard)', async () => {
      const { user } = createUser(testDb);
      const id = seedToken(user.id, hash('survives'));
      const uow = new UnitOfWork(t.em);

      await uow.transactional(async () => {
        const found = await tokens.findByTokenHash(hash('survives'));
        expect(found?.consumed_at).toBeNull();
        await tokens.markConsumed(id);
      });

      expect(rawRow(id).consumed_at).not.toBeNull();
    });

    it('PWDRESETREPO-012: findByTokenHash is the FIRST, wider read (it carries consumed_at); a narrower managed read follows; markConsumed still lands', async () => {
      const { user } = createUser(testDb);
      const id = seedToken(user.id, hash('dshape'));
      const uow = new UnitOfWork(t.em);

      await uow.transactional(async () => {
        await tokens.findByTokenHash(hash('dshape')); // projection A — WIDE (carries consumed_at)
        await t.em.findOne(
          PasswordResetTokens,
          { id },
          { fields: ['id', 'token_hash'], refresh: true, disableIdentityMap: false },
        ); // projection B — NARROW, managed
        await tokens.markConsumed(id);
      });

      expect(rawRow(id).consumed_at).not.toBeNull();
    });

    it('PWDRESETREPO-013: same D-shape guard for consumeAllLiveForUser', async () => {
      const { user } = createUser(testDb);
      const id = seedToken(user.id, hash('dshape-consume-all'));
      const uow = new UnitOfWork(t.em);

      await uow.transactional(async () => {
        await tokens.findByTokenHash(hash('dshape-consume-all')); // projection A — WIDE (carries consumed_at)
        await t.em.findOne(
          PasswordResetTokens,
          { id },
          { fields: ['id', 'token_hash'], refresh: true, disableIdentityMap: false },
        ); // projection B — NARROW, managed
        await tokens.consumeAllLiveForUser(user.id);
      });

      expect(rawRow(id).consumed_at).not.toBeNull();
    });
  });
});
