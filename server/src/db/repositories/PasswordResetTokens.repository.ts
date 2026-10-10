import type { PasswordResetTokens } from '../entities/PasswordResetTokens.entity';
import type { AssertRowKeys } from './_shared/rows';
import { currentTimestamp } from '../dialect/sql-functions';
import type { DbTimestamp } from '../types';
import { TrekRepository } from './_shared/trek-repository';

/** A `password_reset_tokens` row as the API emits it. */
export interface PasswordResetTokenRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string | null;
  created_ip: string | null;
}

const _passwordResetTokenRowKeys: AssertRowKeys<PasswordResetTokenRow, PasswordResetTokens> = true;

/** `AuthService.requestPasswordReset`'s write (AU38) — the raw token is never given to or stored by this repository, only its SHA-256 hash. */
export interface NewPasswordResetTokenRow {
  user_id: number;
  token_hash: string;
  expires_at: DbTimestamp;
  created_ip: string | null;
}

/** `AuthService.resetPassword`'s lookup (AU39). */
export interface PasswordResetTokenLookup {
  id: number;
  user_id: number;
  expires_at: string;
  consumed_at: string | null;
}

/**
 * The password-reset token store — `AuthService.requestPasswordReset`/
 * `resetPassword` (Plan 3b Task 5, AU37–AU42). Expiry is always compared in
 * JS by the caller, exactly as before; this repository never filters on
 * `expires_at` itself.
 */
export class PasswordResetTokensRepository extends TrekRepository<PasswordResetTokens> {
  /**
   * `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE
   *  user_id = ? AND consumed_at IS NULL` (AU37, `requestPasswordReset` —
   * invalidates every prior live token for the user, NOT wrapped in a
   * transaction with the INSERT that follows it — legacy behaviour, kept
   * exactly, see the inventory's surprise #6) and, with `exceptId` supplied,
   * `... AND id != ?` (AU42, `resetPassword` — burns every OTHER live token,
   * inside the same `uow.transactional` block as the password write). ONE
   * method with an optional exclusion (Task 5 brief ruling) rather than two,
   * since the WHERE differs only by that one extra clause.
   */
  async consumeAllLiveForUser(userId: number, exceptId?: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      exceptId === undefined
        ? { user: userId, consumed_at: null }
        : { user: userId, consumed_at: null, id: { $ne: exceptId } },
      { consumed_at: currentTimestamp(platform) },
    );
  }

  /**
   * `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at,
   *  created_ip) VALUES (?, ?, ?, ?)` (AU38). Hash-only storage: the caller
   * (`AuthService`) hashes the raw token with SHA-256 before calling this —
   * the raw value is never given to or returned by this repository.
   * `EntityRepository.insert()`, not `create()` + `persist().flush()` —
   * same rationale as every other repository's insert method in this
   * program (`WebauthnChallengesRepository.insertChallenge`'s docstring):
   * a native insert has no identity-map/UnitOfWork side effects, while
   * `persist().flush()` commits the entire request's UnitOfWork.
   */
  async insertToken(row: NewPasswordResetTokenRow): Promise<void> {
    await this.insert({
      user: row.user_id,
      token_hash: row.token_hash,
      expires_at: row.expires_at,
      created_ip: row.created_ip,
    });
  }

  /**
   * `SELECT id, user_id, expires_at, consumed_at FROM password_reset_tokens
   *  WHERE token_hash = ?` (AU39, `resetPassword`'s lookup —
   * **security-sensitive**). Not a primary-key filter (`token_hash` is a
   * unique column, not `id`) — `disableIdentityMap: true` applies all the
   * same, by the base class's default (`_shared/trek-repository.ts`): the
   * same row is touched again moments later in the same request by
   * `markConsumed`/`consumeAllLiveForUser`'s `nativeUpdate`s, inside
   * `uow.transactional` — an identity-mapped read here is exactly the
   * stale-write-back shape `Users.repository.ts`'s class docstring
   * describes (proven for this table by `PWDRESETREPO-012` below).
   *
   * `fields` names the relation property `'user'`, not the `persist(false)`
   * mirror `'user_id'` (same reasoning as `McpTokensRepository.findBasic`'s
   * docstring): a `fields` list naming the mirror directly leaves
   * `row.user_id` `undefined`, while naming the relation loads its
   * (unpopulated) `Ref`, whose `.id` reads synchronously with no second
   * query.
   */
  async findByTokenHash(hash: string): Promise<PasswordResetTokenLookup | null> {
    const row = await this.findOne({ token_hash: hash }, { fields: ['id', 'user', 'expires_at', 'consumed_at'] });
    return row ? { id: row.id, user_id: row.user.id, expires_at: row.expires_at, consumed_at: row.consumed_at ?? null } : null;
  }

  /**
   * `UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE
   *  id = ?` (AU41, `resetPassword` — burns the token being used, first
   * statement inside the password-change transaction).
   */
  async markConsumed(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { consumed_at: currentTimestamp(platform) });
  }
}
