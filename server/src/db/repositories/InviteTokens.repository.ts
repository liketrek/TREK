import { columnIncrementedBy, columnRef } from '../dialect/sql-functions';
import type { InviteTokens } from '../entities/InviteTokens.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** An `invite_tokens` row as the API emits it. */
export interface InviteTokenRow {
  id: number;
  token: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_by: number;
  created_at: string | null;
  trip_id: number | null;
}

const _inviteTokenRowKeys: AssertRowKeys<InviteTokenRow, InviteTokens> = true;

/**
 * RI1/RI5's joined projection: `invite_tokens` plus the creator's username
 * and the bound trip's title (if any). `created_by_name` mirrors an admin
 * invite always having a creator (INNER `JOIN users`); `trip_title` is
 * `null` when the invite isn't bound to a trip (`LEFT JOIN trips`).
 */
export interface InviteWithCreatorAndTripRow extends InviteTokenRow {
  created_by_name: string;
  trip_title: string | null;
}

/** The column set `RegistrationInvitesService.createInvite` (Task 3) writes. */
export interface NewInviteTokenRow {
  token: string;
  max_uses: number;
  expires_at: string | null;
  created_by: number;
  trip_id?: number | null;
}

/**
 * Shared by `AuthService` (registration), `RegistrationInvitesService` (admin
 * invite management, Task 3) and `OidcService` (SSO-bound registration,
 * Task 6) — one table, one repository, per the inventory's §6 cross-domain
 * ruling. Task 0 builds the three methods every later task needs in common;
 * Task 3 extends this with the admin list/create/delete surface (RI1/RI5-RI7).
 */
export class InviteTokensRepository extends TrekRepository<InviteTokens> {
  /**
   * `SELECT * FROM invite_tokens WHERE token = ?`
   *
   * Named `findByToken`, not `findValid` (Task 0 review addendum, LOW item
   * 1): the statement has no validity filter of its own — no `expires_at`,
   * no `used_count < max_uses` in the WHERE — it is a plain lookup by the
   * unique `token` column, and validity (expiry, capacity) is checked in the
   * caller's JS afterward, identically for `AuthService.registerUser` (AU8)
   * and `OidcService.findOrCreateUser` (O11). A name promising "valid" would
   * describe a filter this statement doesn't have.
   *
   * Not a primary-key filter — `token` is a unique column, not `id`.
   * `disableIdentityMap: true`, not `{ refresh: true }`: a plain `refresh`
   * re-snapshots only the selected fields on an already identity-mapped
   * entity, which risks a stale-write-back on the request's closing
   * `flush()` if this same row is (or later becomes) managed under a
   * different projection in the same transaction — reproduced live on
   * `users` (see `WebauthnCredentialsRepository.hasAny`'s docstring). An
   * isolated, unmanaged read can never be part of that flush.
   */
  async findByToken(token: string): Promise<InviteTokenRow | null> {
    const invite = await this.findOne({ token });
    return invite ? (toRow(invite) as InviteTokenRow) : null;
  }

  /**
   * `INSERT INTO invite_tokens (token, max_uses, expires_at, created_by, trip_id)
   *  VALUES (?, ?, ?, ?, ?)`, re-selected (RI4/RI5's column set — Task 3 is
   * the first real caller). `created_by`/`trip_id` are FK columns backed by
   * `persist(false)` scalar mirrors on the entity (same pattern as
   * `Categories.user`/`user_id`); the repository writes them through the
   * `Ref`-typed relation properties, which MikroORM accepts a raw primary
   * key for.
   *
   * `EntityRepository.insert()`, not `create()` + `persist().flush()` +
   * `refresh()`: a native insert with no identity-map/UnitOfWork side
   * effects — `persist().flush()` flushes the ENTIRE request's UnitOfWork,
   * which can write back a stale identity-mapped entity from an unrelated
   * earlier read in the same request (see `WebauthnCredentialsRepository
   * .hasAny`'s docstring). The re-select after `insert()` uses
   * `disableIdentityMap: true` for the same reason `findByToken` does.
   */
  async insertInvite(row: NewInviteTokenRow): Promise<InviteTokenRow> {
    const id = await this.insert({
      token: row.token,
      max_uses: row.max_uses,
      expires_at: row.expires_at,
      createdByRef: row.created_by,
      trip: row.trip_id ?? null,
    });
    const invite = await this.findOne({ id });
    return toRow(invite!) as InviteTokenRow;
  }

  /**
   * `UPDATE invite_tokens SET used_count = used_count + 1
   *  WHERE token = ? AND (max_uses = 0 OR used_count < max_uses)
   *  RETURNING *`
   *
   * ONE conditional UPDATE … RETURNING statement (the QueryBuilder, D4's T5
   * tier) — race-safe: D6's single SQLite connection serialises writers, so
   * the WHERE clause's capacity check and the increment commit as one
   * statement. Two callers racing the same one-use invite can never both
   * see `used_count < max_uses` true and both write: exactly one UPDATE
   * matches and its RETURNING carries the new row back; the other's WHERE
   * clause fails once the first has committed, and it gets `null` — no
   * second SELECT, no SELECT→await→UPDATE window for either caller to lose.
   *
   * `null` means "no row matched" — a bad/unknown token OR an invite already
   * at capacity are indistinguishable from inside this method by design
   * (this repository never interprets the miss): `AuthService`'s `AU11`
   * only warns and continues on a miss, `OidcService`'s `O13` throws — both
   * keep their own interpretation, calling this one shared method.
   *
   * `used_count < max_uses` compares two columns of the SAME row, and
   * `used_count = used_count + 1` needs a sibling-column reference too — both
   * go through `sql-functions.ts` (`columnRef`/`columnIncrementedBy`), never
   * a hand-spelled `raw()` call here: repositories don't spell dialect SQL
   * inline (ESLint enforces this on `src/db/repositories/**`), even for an
   * expression that happens to be portable across dialects already.
   */
  async incrementUsedCount(token: string): Promise<InviteTokenRow | null> {
    const platform = this.getEntityManager().getPlatform();
    const result = await this.qb()
      .update({ used_count: columnIncrementedBy(platform, 'used_count', 1) })
      .where({
        token,
        $or: [{ max_uses: 0 }, { used_count: { $lt: columnRef(platform, 'max_uses') } }],
      })
      .returning('*')
      .execute('run');
    return result.row ? (result.row as InviteTokenRow) : null;
  }

  // ---------------------------------------------------------------------
  // RI1 — admin invite list (Task 3, RegistrationInvitesService.listInvites)
  // ---------------------------------------------------------------------

  /**
   * ```sql
   * SELECT i.*, u.username as created_by_name, t.title as trip_title
   * FROM invite_tokens i
   * JOIN users u ON i.created_by = u.id
   * LEFT JOIN trips t ON i.trip_id = t.id
   * ORDER BY i.created_at DESC
   * ```
   *
   * A QueryBuilder join (D4's T5 tier), projection root `InviteTokens` —
   * `i.createdByRef`/`i.trip` are the entity's own relation properties for
   * exactly these two joins, so no hand-spelled join condition is needed.
   * `mapResults: false` (the same choice `TripsRepository.findAccessible`
   * makes for its own aliased join) leaves the driver's row alone: the keys
   * are the column names the `AS` aliases spell, which is why the result
   * type is hand-written here rather than inferred from the entity.
   */
  async listWithCreatorAndTrip(): Promise<InviteWithCreatorAndTripRow[]> {
    return this.qb('i')
      .join('i.createdByRef', 'u')
      .leftJoin('i.trip', 't')
      .select(['i.*', 'u.username as created_by_name', 't.title as trip_title'])
      .orderBy({ 'i.created_at': 'desc' })
      .execute<InviteWithCreatorAndTripRow[]>('all', false);
  }

  // ---------------------------------------------------------------------
  // RI5 — createInvite's re-select (same JOIN shape, filtered to one row)
  // ---------------------------------------------------------------------

  /** RI1's exact JOIN shape, `WHERE i.id = ?` — the response of `createInvite`. */
  async findWithCreatorAndTrip(id: number): Promise<InviteWithCreatorAndTripRow | null> {
    const row = await this.qb('i')
      .join('i.createdByRef', 'u')
      .leftJoin('i.trip', 't')
      .select(['i.*', 'u.username as created_by_name', 't.title as trip_title'])
      .where({ 'i.id': id })
      .execute<InviteWithCreatorAndTripRow | undefined>('get', false);
    return row ?? null;
  }

  // ---------------------------------------------------------------------
  // RI6 — deleteInvite's 404 check
  // ---------------------------------------------------------------------

  /**
   * `SELECT id FROM invite_tokens WHERE id = ?`. Named `findIdById`, not
   * `findById` — `findById` would read like it belonged next to
   * `UsersRepository.findById`'s full-row shape; this is a narrow
   * existence probe for one column, and neither name shadows an
   * `EntityRepository` method (there is no base `findById`/`deleteById`
   * to collide with — the distinct names are for a human reading two
   * unrelated repositories side by side, not a compiler conflict).
   */
  async findIdById(id: number): Promise<number | null> {
    const row = await this.findOne({ id }, { fields: ['id'] });
    return row ? row.id : null;
  }

  // ---------------------------------------------------------------------
  // RI7 — deleteInvite's delete
  // ---------------------------------------------------------------------

  /** `DELETE FROM invite_tokens WHERE id = ?` */
  async deleteById(id: number): Promise<number> {
    return this.nativeDelete({ id });
  }
}
