import type { WebauthnChallenges } from '../entities/WebauthnChallenges.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** `PasskeyService.storeChallenge` (PK2). */
export interface NewChallengeRow {
  challenge: string;
  user_id: number | null;
  type: 'registration' | 'authentication';
  expires_at: number;
}

/**
 * The `webauthn_challenges` table as `claimChallenge`'s `em.getKysely()`
 * call needs it: an explicit type argument rather than relying on
 * `getKysely()`'s automatic entity-metadata inference.
 */
type WebauthnChallengesKyselyDB = Pick<DB, 'webauthn_challenges'>;

/** The single-use, TTL'd WebAuthn ceremony challenge store — PK1–PK3. */
export class WebauthnChallengesRepository extends TrekRepository<WebauthnChallenges> {
  /**
   * `DELETE FROM webauthn_challenges WHERE expires_at < ?` — best-effort
   * sweep run before minting a new challenge (no cron for this table; see
   * the inventory's surprise #9).
   */
  async purgeExpired(now: number): Promise<void> {
    await this.nativeDelete({ expires_at: { $lt: now } });
  }

  /**
   * `INSERT INTO webauthn_challenges (challenge, user_id, type, expires_at)
   *  VALUES (?, ?, ?, ?)`. `EntityRepository.insert()`, not `create()` +
   * `persist().flush()` — a native insert with no identity-map/UnitOfWork
   * side effects (see `WebauthnCredentialsRepository.insertCredential`'s
   * docstring for why `persist().flush()` is the hazard here: it flushes
   * the entire request's UnitOfWork, which can write back a stale
   * identity-mapped entity from an unrelated earlier read in the same
   * request).
   */
  async insertChallenge(row: NewChallengeRow): Promise<void> {
    await this.insert({
      challenge: row.challenge,
      user: row.user_id,
      type: row.type,
      expires_at: row.expires_at,
    });
  }

  /**
   * `DELETE FROM webauthn_challenges WHERE challenge = ? AND type = ? AND
   *  expires_at > ? RETURNING user_id` — the anti-replay primitive: it runs
   * BEFORE any async verification, so a concurrent double-submit of the
   * same assertion can spend the row exactly once.
   *
   * Built on `em.getKysely()` (D4's T6 tier), not the QueryBuilder's own
   * `.returning()` (the InviteTokensRepository.incrementUsedCount shape):
   * verified empirically against the installed MikroORM 7.2.1 that the
   * QueryBuilder's `processReturningStatement` (`@mikro-orm/sql`'s
   * `QueryBuilder.js`) only ever honours an explicit `.returning()` hint
   * for `INSERT`/`UPDATE` — a bare `DELETE` has no `data` in its internal
   * state, and the very first branch of that method (`if (!data &&
   * !this.#state.insertSubQuery) return;`) exits before the "always
   * respect explicit returning hint" branch below it is ever reached. A
   * `delete().returning([...]).execute('run')` therefore silently drops
   * the RETURNING clause: it deletes the row (`affectedRows: 1`) but
   * `result.row`/`result.rows` come back empty every time — this is NOT
   * the `update().returning()` shape Task 0 proved; it's a different,
   * narrower gap the docs don't call out. `em.getKysely()` is bound to the
   * ambient transaction the same way the QueryBuilder is (see its own
   * doc comment — inside `em.transactional`/`uow.transactional` it reuses
   * the open transaction's connection), so D6's single-connection-
   * serialises-writers guarantee still holds: no SELECT→await→DELETE
   * window for either caller to lose, proven by `WEBAUTHN-CHAL-REPO`'s
   * concurrent-claim test asserting exactly one non-null winner.
   *
   * `.returning(['user_id'])` only (not `.selectAll()`/`returningAll()`),
   * matching the legacy statement's own narrower `RETURNING user_id`.
   *
   * `this.kysely()` (`_shared/trek-repository.ts`, Plan 3b interlude B), not
   * `this.getEntityManager().getKysely()` directly: `em.getKysely()`
   * resolves its `EntityManager` with `getContext(false)`, the same
   * validation gap the base class closes for every other repository path —
   * the base's `kysely()` helper validates first, then delegates.
   */
  async claimChallenge(
    challenge: string,
    type: 'registration' | 'authentication',
    now: number,
  ): Promise<{ user_id: number | null } | null> {
    const row = await this.kysely<WebauthnChallengesKyselyDB>()
      .deleteFrom('webauthn_challenges')
      .where('challenge', '=', challenge)
      .where('type', '=', type)
      .where('expires_at', '>', now)
      .returning(['user_id'])
      .executeTakeFirst();
    return row ?? null;
  }
}
