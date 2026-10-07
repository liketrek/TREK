import { WebauthnChallenges } from '../../../../src/db/entities/WebauthnChallenges.entity';
import type { WebauthnChallengesRepository } from '../../../../src/db/repositories/WebauthnChallenges.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let challenges: WebauthnChallengesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  challenges = t.repo(WebauthnChallenges);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function seedChallenge(challenge: string, userId: number | null, type: string, expiresAt: number): void {
  testDb
    .prepare('INSERT INTO webauthn_challenges (challenge, user_id, type, expires_at) VALUES (?, ?, ?, ?)')
    .run(challenge, userId, type, expiresAt);
}

function challengeCount(): number {
  return (testDb.prepare('SELECT COUNT(*) AS n FROM webauthn_challenges').get() as { n: number }).n;
}

describe('WebauthnChallengesRepository', () => {
  describe('purgeExpired', () => {
    it('WEBAUTHN-CHAL-REPO-001: deletes only rows past their expiry, live rows survive', async () => {
      const { user } = createUser(testDb);
      const now = Date.now();
      seedChallenge('expired-1', user.id, 'registration', now - 1000);
      seedChallenge('expired-2', null, 'authentication', now - 1);
      seedChallenge('live', user.id, 'registration', now + 60_000);

      await challenges.purgeExpired(now);

      expect(challengeCount()).toBe(1);
      const remaining = testDb.prepare('SELECT challenge FROM webauthn_challenges').all() as Array<{
        challenge: string;
      }>;
      expect(remaining).toEqual([{ challenge: 'live' }]);
    });

    it('WEBAUTHN-CHAL-REPO-002: an empty table is a no-op', async () => {
      await challenges.purgeExpired(Date.now());
      expect(challengeCount()).toBe(0);
    });
  });

  describe('insertChallenge', () => {
    it('WEBAUTHN-CHAL-REPO-003: writes the exact column set, user-bound (registration)', async () => {
      const { user } = createUser(testDb);
      const expiresAt = Date.now() + 300_000;
      await challenges.insertChallenge({
        challenge: 'reg-chal',
        user_id: user.id,
        type: 'registration',
        expires_at: expiresAt,
      });

      const row = testDb
        .prepare('SELECT challenge, user_id, type, expires_at FROM webauthn_challenges WHERE challenge = ?')
        .get('reg-chal');
      expect(row).toEqual({ challenge: 'reg-chal', user_id: user.id, type: 'registration', expires_at: expiresAt });
    });

    it('WEBAUTHN-CHAL-REPO-004: writes a NULL user_id (anonymous authentication challenge)', async () => {
      const expiresAt = Date.now() + 300_000;
      await challenges.insertChallenge({
        challenge: 'auth-chal',
        user_id: null,
        type: 'authentication',
        expires_at: expiresAt,
      });

      const row = testDb.prepare('SELECT user_id, type FROM webauthn_challenges WHERE challenge = ?').get('auth-chal');
      expect(row).toEqual({ user_id: null, type: 'authentication' });
    });
  });

  describe('claimChallenge', () => {
    it('WEBAUTHN-CHAL-REPO-005: claims a live, matching row and returns its user_id', async () => {
      const { user } = createUser(testDb);
      const now = Date.now();
      seedChallenge('claim-me', user.id, 'registration', now + 60_000);

      const result = await challenges.claimChallenge('claim-me', 'registration', now);

      expect(result).toEqual({ user_id: user.id });
      expect(challengeCount()).toBe(0); // spent
    });

    it('WEBAUTHN-CHAL-REPO-006: claims an anonymous (null user_id) row', async () => {
      const now = Date.now();
      seedChallenge('anon-claim', null, 'authentication', now + 60_000);

      expect(await challenges.claimChallenge('anon-claim', 'authentication', now)).toEqual({ user_id: null });
    });

    it('WEBAUTHN-CHAL-REPO-007: an unknown challenge is null, nothing is deleted', async () => {
      expect(await challenges.claimChallenge('never-stored', 'registration', Date.now())).toBeNull();
    });

    it("WEBAUTHN-CHAL-REPO-008: an expired row is null and stays in the table (purgeExpired's job, not claimChallenge's)", async () => {
      const now = Date.now();
      seedChallenge('stale', null, 'registration', now - 1);

      expect(await challenges.claimChallenge('stale', 'registration', now)).toBeNull();
      expect(challengeCount()).toBe(1); // still there — claimChallenge only deletes a MATCHING row
    });

    it('WEBAUTHN-CHAL-REPO-009: a type mismatch is null, the row survives for its real type', async () => {
      const { user } = createUser(testDb);
      const now = Date.now();
      seedChallenge('wrong-type', user.id, 'registration', now + 60_000);

      expect(await challenges.claimChallenge('wrong-type', 'authentication', now)).toBeNull();
      expect(challengeCount()).toBe(1);
      expect(await challenges.claimChallenge('wrong-type', 'registration', now)).toEqual({ user_id: user.id });
    });

    it('WEBAUTHN-CHAL-REPO-010: single-use — a second claim of the same challenge is null', async () => {
      const { user } = createUser(testDb);
      const now = Date.now();
      seedChallenge('once-only', user.id, 'registration', now + 60_000);

      expect(await challenges.claimChallenge('once-only', 'registration', now)).toEqual({ user_id: user.id });
      expect(await challenges.claimChallenge('once-only', 'registration', now)).toBeNull();
    });

    it('WEBAUTHN-CHAL-REPO-011: two concurrent claims of the same challenge — exactly one winner', async () => {
      const { user } = createUser(testDb);
      const now = Date.now();
      seedChallenge('race-me', user.id, 'registration', now + 60_000);

      const [a, b] = await Promise.all([
        challenges.claimChallenge('race-me', 'registration', now),
        challenges.claimChallenge('race-me', 'registration', now),
      ]);

      const winners = [a, b].filter((r) => r !== null);
      expect(winners).toHaveLength(1);
      expect(winners[0]).toEqual({ user_id: user.id });
      expect(challengeCount()).toBe(0);
    });
  });
});
