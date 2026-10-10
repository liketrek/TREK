import { columnRef, currentTimestamp } from '../dialect/sql-functions';
import { OauthTokens } from '../entities/OauthTokens.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * The Kysely-side table shape `em.getKysely()` needs for `collectChainIds`'s
 * recursive CTE (D4's T6 tier — the QueryBuilder has no recursive-CTE
 * support at all, so this one escape hatch stays regardless of the `client`
 * relation's referenced column). `oauth_clients`/`users` are no longer part
 * of this interface: `listActiveByUser`/`listAllActiveWithClientAndUser`
 * (OA26/OA31) moved to the QueryBuilder once the generator learned to emit
 * `.referencedColumnNames('client_id')` for `OauthTokens.client` (Plan 3b
 * interlude A) — see those methods' docstrings.
 */
type OauthTokensKyselyDB = Pick<DB, 'oauth_tokens'>;

/** `OauthService.issueTokens`/`issueClientCredentialsToken`'s write (OA13/OA14) — same column set, one method. */
export interface NewOauthTokenRow {
  client_id: string;
  user_id: number;
  access_token_hash: string;
  refresh_token_hash: string;
  scopes: string;
  audience: string | null;
  access_token_expires_at: DbTimestamp;
  refresh_token_expires_at: DbTimestamp;
  parent_token_id: number | null;
}

/** OA16 (`getUserByAccessToken`) — every MCP request's bearer check, **security-sensitive**. */
export interface OauthTokenWithUserRow {
  scopes: string;
  audience: string | null;
  revoked_at: string | null;
  access_token_expires_at: string;
  user_id: number;
  client_id: string;
  username: string;
  email: string;
  role: string;
}

/** OA17 (`findChainRoot`'s upward-walk read). */
export interface OauthTokenParentRow {
  id: number;
  parent_token_id: number | null;
}

/** OA22 (`refreshTokens`'s refresh-token-hash read). */
export interface OauthTokenRefreshRow {
  id: number;
  client_id: string;
  user_id: number;
  scopes: string;
  audience: string | null;
  refresh_token_expires_at: string;
  revoked_at: string | null;
  parent_token_id: number | null;
}

/** OA24 (`revokeToken`'s user-id-for-session-revoke lookup). */
export interface OauthTokenUserIdRow {
  user_id: number;
}

/** OA27 (`revokeSession`'s ownership+404 check). */
export interface OauthTokenOwnedRow {
  id: number;
  client_id: string;
}

/** OA32 (`adminRevokeOAuthSession`'s 404 check — unscoped, needs `user_id` for the session-revoke call). */
export interface OauthTokenAdminRow {
  id: number;
  user_id: number;
  client_id: string;
}

/** OA26 (`listOAuthSessions`, the user's own "active sessions" panel). */
export interface OauthSessionRow {
  id: number;
  client_id: string;
  client_name: string;
  scopes: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  created_at: string | null;
}

/** OA31 (`listAllOAuthSessions`, the admin panel) — OA26's row plus the token owner. */
export interface OauthSessionWithUserRow extends OauthSessionRow {
  user_id: number;
  username: string;
}

/**
 * No site in this domain does `SELECT * FROM oauth_tokens` (unlike
 * `oauth_clients`'s OA29/OA30) — every method below mirrors a narrower
 * legacy projection. `OauthTokenScalarColumns` is not a return type of any
 * method here; it exists only so `AssertRowKeys` still pins that every
 * scalar column of the entity is accounted for SOMEWHERE across this file's
 * narrower row interfaces, the same compile-time guarantee the other two
 * repositories in this domain get from a genuine full-row type.
 */
interface OauthTokenScalarColumns {
  id: number;
  client_id: string;
  user_id: number;
  access_token_hash: string;
  refresh_token_hash: string;
  scopes: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  revoked_at: string | null;
  created_at: string | null;
  parent_token_id: number | null;
  audience: string | null;
}

const _oauthTokenScalarProbe: AssertRowKeys<OauthTokenScalarColumns, OauthTokens> = true;

/**
 * OAuth 2.1 bearer/refresh tokens, Plan 3b Task 4, inventory §3
 * OA8/OA13/OA14/OA16-OA20/OA22-OA28/OA31-OA33 — the busiest table in this
 * domain. Every row-out read passes `disableIdentityMap: true` (program
 * RULING, Task 1 review B1 — see `Users.repository.ts`'s class-level
 * docstring; applied by the base class's default since Plan 3b interlude B,
 * `_shared/trek-repository.ts`). No method here hashes, compares or generates a token —
 * `OauthService` does (`hashToken`/`generateAccessToken`/…), this
 * repository only ever sees an already-computed hash string.
 *
 * **The `client` relation now correctly targets `oauth_clients.client_id`.**
 * The schema (`Migration20200101012500_oauth_2.ts`) has `oauth_tokens.
 * client_id REFERENCES oauth_clients(client_id)`, the UNIQUE natural key —
 * NOT `oauth_clients.id`, its primary key; the two are independently
 * generated UUIDs (`OauthService.createOAuthClient`'s `id`/`clientId`
 * locals). Task 4 found the generated entity's `client` relation had no
 * `referencedColumnNames` override and so silently joined on `oc.id`
 * instead — a pre-existing `@mikro-orm/entity-generator` 7.2.1 defect (a
 * single-column FK's renderer never emits `.referencedColumnNames(...)`
 * unless the target's own PK has a DIFFERENT column count, never a
 * different column identity) — and worked around it with `em.getKysely()`
 * for the two legacy statements that actually join `oauth_clients`
 * (OA26/OA31). Plan 3b interlude A (`RULE11_referencedColumns` in
 * `scripts/generate-entities.ts`) closed that gap at the generator level:
 * `OauthTokens.entity.ts`'s `client` relation now carries an explicit
 * `.referencedColumnNames('client_id')`, so `.innerJoin('ot.client', 'oc')`
 * joins on the real column — verified empirically (`qb.getFormattedQuery()`,
 * OAUTHTOKREPO-030) — and `listActiveByUser`/`listAllActiveWithClientAndUser`
 * below use the QueryBuilder like every other join in this file.
 */
export class OauthTokensRepository extends TrekRepository<OauthTokens> {
  // ---------------------------------------------------------------------
  // OA13 / OA14 — token issuance
  // ---------------------------------------------------------------------

  /**
   * `INSERT INTO oauth_tokens (client_id, user_id, access_token_hash,
   *  refresh_token_hash, scopes, audience, access_token_expires_at,
   *  refresh_token_expires_at, parent_token_id) VALUES (...)` — OA13
   * (`issueTokens`) and OA14 (`issueClientCredentialsToken`, whose
   * `refresh_token_hash` is an unusable random placeholder and whose
   * `refresh_token_expires_at` is already-expired — both decided by the
   * caller, not this repository), same column list — ONE method.
   * **Security-sensitive** (token mint). Neither legacy call site
   * re-selects after the INSERT (the response is built from the already-
   * computed raw values), so this returns nothing, matching exactly.
   *
   * Named `insertToken`, not `create` — `EntityRepository#create` already
   * exists with an incompatible signature (a SYNCHRONOUS, non-persisting
   * factory); shadowing it would fail to compile, the same collision
   * `Users.repository.ts::insertUser` and `McpTokens.repository.ts
   * ::insertToken` avoid.
   */
  async insertToken(row: NewOauthTokenRow): Promise<void> {
    await this.insert({
      client: row.client_id,
      user: row.user_id,
      access_token_hash: row.access_token_hash,
      refresh_token_hash: row.refresh_token_hash,
      scopes: row.scopes,
      audience: row.audience,
      access_token_expires_at: row.access_token_expires_at,
      refresh_token_expires_at: row.refresh_token_expires_at,
      parentToken: row.parent_token_id,
    });
  }

  // ---------------------------------------------------------------------
  // AU18 / AU46 (AuthService, cross-domain — Task 4 brief ruling: not one of
  // the 33 numbered OA sites, but built NOW so it exists for Task 5)
  // ---------------------------------------------------------------------

  /**
   * `UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id =
   *  ? AND revoked_at IS NULL` — `AuthService.changePassword` (AU18) and
   * `resetPassword` (AU46), both inside the same transaction as the
   * password write itself (**security-sensitive**: every OAuth session the
   * user held stops working the moment their password changes). Built here
   * because this table belongs to `nest/oauth`, per the inventory's §6
   * cross-domain ruling (mirrors `McpTokensRepository.deleteAllForUser`'s
   * precedent for the same AuthService sites on `mcp_tokens`) — Task 5 is
   * the only caller. The legacy call sites wrap this statement in a
   * `try/catch` ("oauth_tokens table may not exist in very old installs")
   * — that tolerance is `AuthService`'s own concern, not reproduced here;
   * this repository always assumes the table exists, the same as every
   * other method in this file.
   */
  async revokeAllForUser(userId: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ user: userId, revoked_at: null }, { revoked_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // OA8 — mass revoke on secret rotation
  // ---------------------------------------------------------------------

  /**
   * `UPDATE oauth_tokens SET revoked_at = datetime('now') WHERE client_id =
   *  ? AND revoked_at IS NULL` — **security-sensitive** (mass revoke on
   * secret rotation). The legacy statement spells `datetime('now')` rather
   * than `CURRENT_TIMESTAMP` (every other revoke in this file uses the
   * latter) — both route through `currentTimestamp(platform)` (Task 0's
   * `SQLF-008` proves the two spellings are byte-identical on SQLite), one
   * dialect path, not two.
   */
  async revokeAllForClient(clientId: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ client: clientId, revoked_at: null }, { revoked_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // OA16 — MCP bearer-token verification
  // ---------------------------------------------------------------------

  /**
   * `SELECT ot.scopes, ot.audience, ot.revoked_at, ot.access_token_expires_at,
   *  ot.user_id, ot.client_id, u.username, u.email, u.role FROM oauth_tokens
   *  ot JOIN users u ON ot.user_id = u.id WHERE ot.access_token_hash = ?` —
   * **security-sensitive**, every MCP request's bearer check. `ot.user`
   * (unlike `ot.client`) is a NORMAL relation — its column
   * (`user_id`, default naming, no override) genuinely references
   * `users.id`, verified empirically — so `.innerJoin('ot.user', 'u')` joins
   * correctly and this stays on the QueryBuilder (D4's T5 tier) — as do
   * OA26/OA31 below, since Plan 3b interlude A. `columnRef` for both FK
   * scalars in the select list:
   * `ot.user_id` because the same relation is also joined (the
   * `McpTokensRepository.listAllWithUsername` finding — selecting a
   * relation property while also joining it collapses into the join rather
   * than emitting the FK column); `ot.client_id` for symmetry and because
   * it is itself a `persist(false)` mirror with no column of its own to
   * `.select()` by property name.
   */
  async findByAccessTokenHashWithUser(hash: string): Promise<OauthTokenWithUserRow | null> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.qb('ot')
      .innerJoin('ot.user', 'u')
      .select([
        'ot.scopes',
        'ot.audience',
        'ot.revoked_at',
        'ot.access_token_expires_at',
        columnRef(platform, 'ot.user_id'),
        columnRef(platform, 'ot.client_id'),
        'u.username',
        'u.email',
        'u.role',
      ])
      .where({ 'ot.access_token_hash': hash })
      .execute<OauthTokenWithUserRow | undefined>('get', false);
    return row ?? null;
  }

  // ---------------------------------------------------------------------
  // OA17 — rotation-chain upward walk (findChainRoot, looped in the service)
  // ---------------------------------------------------------------------

  /**
   * `SELECT id, parent_token_id FROM oauth_tokens WHERE id = ?` —
   * **security-sensitive** (replay-detection chain walk). `findChainRoot`'s
   * upward loop (≤ 100 iterations) stays in `OauthService`, calling this
   * once per hop — NOT a second recursive CTE (Task 4 brief ruling): the
   * loop already terminates on `parent_token_id === null`, and a CTE would
   * need to walk UP the parent chain from an arbitrary starting id, which
   * requires knowing the root in advance (the opposite direction from
   * `collectChainIds`'s downward walk from a known root).
   *
   * `fields` names the RELATION property `'parentToken'`, not the
   * `persist(false)` mirror `'parent_token_id'` (same rule as
   * `McpTokensRepository.findBasic`'s `'user'`/`user_id'` finding): naming
   * the mirror directly leaves it `undefined`.
   */
  async findParent(id: number): Promise<OauthTokenParentRow | null> {
    const row = await this.findOne({ id }, { fields: ['id', 'parentToken'] });
    return row ? { id: row.id, parent_token_id: row.parentToken?.id ?? null } : null;
  }

  // ---------------------------------------------------------------------
  // OA18 — recursive CTE (revokeChain)
  // ---------------------------------------------------------------------

  /**
   * ```sql
   * WITH RECURSIVE chain(id) AS (
   *   SELECT id FROM oauth_tokens WHERE id = ?
   *   UNION ALL
   *   SELECT t.id FROM oauth_tokens t JOIN chain c ON t.parent_token_id = c.id
   * )
   * SELECT id FROM chain
   * ```
   *
   * **Security-sensitive** — finds every token in a rotation chain to mass-
   * revoke. The MikroORM QueryBuilder has no recursive-CTE support (D4's T6
   * tier, the program's canonical `em.getKysely()` case, per the task
   * brief); `getKysely()` reuses the ambient transaction connection inside
   * `em.transactional()`/`uow.transactional()` (confirmed by its own doc
   * comment and proven directly — see the repository test that revokes
   * inside a transaction which then rolls back and asserts nothing was
   * revoked), so D6's single-connection serialisation still holds.
   *
   * Proven equal to the legacy statement, run raw on the same seeded rows,
   * on a 4-level chain plus a sibling branch that must NOT be collected
   * (`OAUTHTOKREPO` CTE test) — see the task report for the exact generated
   * SQL and both result sets side by side.
   *
   * `this.kysely()` (`_shared/trek-repository.ts`, Plan 3b interlude B), not
   * `this.getEntityManager().getKysely()` directly — see
   * `WebauthnChallengesRepository.claimChallenge`'s docstring for why.
   */
  async collectChainIds(rootId: number): Promise<number[]> {
    const rows = await this.kysely<OauthTokensKyselyDB>()
      .withRecursive('chain', (db) =>
        db
          .selectFrom('oauth_tokens')
          .select('id')
          .where('id', '=', rootId)
          .unionAll((eb) =>
            eb
              .selectFrom('oauth_tokens as ot2')
              .innerJoin('chain as c', 'c.id', 'ot2.parent_token_id')
              .select('ot2.id'),
          ),
      )
      .selectFrom('chain')
      .select('id')
      .execute();
    return rows.map((r) => r.id);
  }

  // ---------------------------------------------------------------------
  // Retention
  // ---------------------------------------------------------------------

  /**
   * Delete tokens whose refresh token expired before `cutoffIso`, oldest
   * generation first. A row is only deleted once no other token names it as
   * parent: `parent_token_id` has no ON DELETE action, and a token still in a
   * live chain is what replay detection walks. Each pass removes the current
   * leaves, so a whole expired chain goes over a few passes; `maxPasses`
   * bounds a chain that is still growing. Returns the number deleted.
   *
   * @txIndependent a retention sweep: every pass leaves a consistent table, and the
   * next sweep picks up what a failed one left.
   */
  async deleteExpiredBefore(cutoff: DbTimestamp, maxPasses = 50): Promise<number> {
    let total = 0;
    for (let pass = 0; pass < maxPasses; pass++) {
      const result = await this.kysely<OauthTokensKyselyDB>()
        .deleteFrom('oauth_tokens')
        .where('refresh_token_expires_at', '<', cutoff)
        .where('id', 'not in', (eb) =>
          eb
            .selectFrom('oauth_tokens as child')
            .select('child.parent_token_id')
            .where('child.parent_token_id', 'is not', null),
        )
        .executeTakeFirst();
      const deleted = Number(result.numDeletedRows ?? 0);
      total += deleted;
      if (deleted === 0) break;
    }
    return total;
  }

  // ---------------------------------------------------------------------
  // OA19 — chain-wide revoke
  // ---------------------------------------------------------------------

  /**
   * `` UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id IN
   *  (${ids.map(() => '?').join(',')}) AND revoked_at IS NULL `` —
   * **security-sensitive**. The legacy hand-built a dynamic-length
   * placeholder list; `nativeUpdate({ id: { $in: ids } })` replaces it
   * outright (D4/D10's base case for exactly this shape — the task brief's
   * "one statement, assert the count"). The legacy also guards `ids.length
   * > 0` before running the statement at all (an empty `IN ()` is either a
   * syntax error or a vacuous no-op depending on driver, never attempted) —
   * reproduced here rather than trusting `nativeUpdate` to no-op safely on
   * an empty `$in` array.
   */
  async revokeByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id: { $in: ids }, revoked_at: null }, { revoked_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // OA20 — concurrent-rotation detection
  // ---------------------------------------------------------------------

  /**
   * `SELECT id FROM oauth_tokens WHERE parent_token_id = ? AND revoked_at
   *  IS NULL LIMIT 1` — **security-sensitive**, distinguishes concurrent-
   * refresh from theft (`isConcurrentRotation`). `parentToken` is a NORMAL
   * self-referential relation (references `oauth_tokens.id`, its own
   * table's primary key — no `.name()` override, unlike `client`), so a
   * plain equality filter is unaffected by this file's class-level finding.
   */
  async findSuccessorAlive(parentId: number): Promise<{ id: number } | null> {
    const row = await this.findOne({ parentToken: parentId, revoked_at: null }, { fields: ['id'] });
    return row ? { id: row.id } : null;
  }

  // ---------------------------------------------------------------------
  // OA22 — refresh-token-hash lookup
  // ---------------------------------------------------------------------

  /**
   * `SELECT id, client_id, user_id, scopes, audience,
   *  refresh_token_expires_at, revoked_at, parent_token_id FROM oauth_tokens
   *  WHERE refresh_token_hash = ?` — **security-sensitive**. `fields` names
   * every FK's RELATION property (`'client'`, `'user'`, `'parentToken'`),
   * never the `persist(false)` mirrors — verified empirically that
   * `row.client.id` reads back the RAW `client_id` COLUMN VALUE (not a
   * dereference through the relation's — wrong — declared target): a `Ref`'s
   * `.id` is simply the value stored in this entity's own FK column,
   * synchronous, no second query, unaffected by what column the relation
   * nominally references. Confirmed with a throwaway probe before writing
   * this method (see the task report).
   */
  async findByRefreshTokenHash(hash: string): Promise<OauthTokenRefreshRow | null> {
    const row = await this.findOne(
      { refresh_token_hash: hash },
      {
        fields: ['id', 'client', 'user', 'scopes', 'audience', 'refresh_token_expires_at', 'revoked_at', 'parentToken'],
      },
    );
    return row
      ? {
          id: row.id,
          client_id: row.client.id,
          user_id: row.user.id,
          scopes: row.scopes,
          audience: row.audience ?? null,
          refresh_token_expires_at: row.refresh_token_expires_at,
          revoked_at: row.revoked_at ?? null,
          parent_token_id: row.parentToken?.id ?? null,
        }
      : null;
  }

  // ---------------------------------------------------------------------
  // OA23 / OA28 / OA33 — revoke by id
  // ---------------------------------------------------------------------

  /**
   * `UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?` —
   * **security-sensitive**. THREE call sites share this exact statement:
   * OA23 (`refreshTokens`'s rotation revoke-old-pair — stays NON-
   * transactional with `issueTokens`, parity, see the deferred list in the
   * task report), OA28 (`revokeSession`), OA33
   * (`adminRevokeOAuthSession`). **Not** OA25 (`revokeToken`'s UPDATE half)
   * — that statement has a genuinely different WHERE
   * (`(access_token_hash = ? OR refresh_token_hash = ?) AND client_id = ?`,
   * not `id = ?`); the inventory's summary prose conflated the two, the
   * detailed per-site table (verified against `oauth.service.ts:536-540`)
   * does not — see `revokeByAccessOrRefreshHashAndClient` below, and the
   * task report's inventory-correction note.
   */
  async revokeById(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { revoked_at: currentTimestamp(platform) });
  }

  // ---------------------------------------------------------------------
  // OA24 / OA25 — revoke by presented token
  // ---------------------------------------------------------------------

  /**
   * `SELECT user_id FROM oauth_tokens WHERE (access_token_hash = ? OR
   *  refresh_token_hash = ?) AND client_id = ?` (`revokeToken`'s user-id
   * lookup, so the caller can also revoke the user's live MCP sessions) —
   * **security-sensitive**.
   */
  async findByAccessOrRefreshHashAndClient(hash: string, clientId: string): Promise<OauthTokenUserIdRow | null> {
    const row = await this.findOne(
      { $or: [{ access_token_hash: hash }, { refresh_token_hash: hash }], client: clientId },
      { fields: ['user'] },
    );
    return row ? { user_id: row.user.id } : null;
  }

  /**
   * `UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE
   *  (access_token_hash = ? OR refresh_token_hash = ?) AND client_id = ?` —
   * **security-sensitive**, the UPDATE half of `revokeToken`. Stays NON-
   * transactional with `findByAccessOrRefreshHashAndClient` above (parity —
   * see the task report's deferred list); a concurrent revoke/lookup race
   * on the same token is the same legacy window this repository preserves,
   * not widens or narrows.
   */
  async revokeByAccessOrRefreshHashAndClient(hash: string, clientId: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { $or: [{ access_token_hash: hash }, { refresh_token_hash: hash }], client: clientId },
      { revoked_at: currentTimestamp(platform) },
    );
  }

  // ---------------------------------------------------------------------
  // OA26 — the user's own "active sessions" panel
  // ---------------------------------------------------------------------

  /**
   * ```sql
   * SELECT ot.id, ot.client_id, oc.name AS client_name, ot.scopes,
   *        ot.access_token_expires_at, ot.refresh_token_expires_at, ot.created_at
   * FROM oauth_tokens ot
   * JOIN oauth_clients oc ON ot.client_id = oc.client_id
   * WHERE ot.user_id = ? AND ot.revoked_at IS NULL
   *   AND ot.refresh_token_expires_at > CURRENT_TIMESTAMP
   * ORDER BY ot.created_at DESC
   * ```
   *
   * The QueryBuilder (Plan 3b interlude A — this class's docstring):
   * `.innerJoin('ot.client', 'oc')` now joins on the real `oc.client_id`
   * column, the generated entity's `client` relation carrying an explicit
   * `.referencedColumnNames('client_id')`. `columnRef(platform,
   * 'ot.client_id')` in the select list for the same reason OA16's
   * `findByAccessTokenHashWithUser` needs it: selecting a relation property
   * while ALSO joining that same relation collapses into the join rather
   * than emitting the FK scalar column (the `McpTokensRepository
   * .listAllWithUsername` finding). `{ $gt: currentTimestamp(platform) }`
   * for the `refresh_token_expires_at > CURRENT_TIMESTAMP` predicate — a
   * `RawQueryFragment` is a normal filter value here, no Kysely-specific
   * spelling needed once the query itself is a QueryBuilder query.
   */
  async listActiveByUser(userId: number): Promise<OauthSessionRow[]> {
    const platform = this.getEntityManager().getPlatform();
    const rows = await this.qb('ot')
      .innerJoin('ot.client', 'oc')
      .select([
        'ot.id',
        columnRef(platform, 'ot.client_id'),
        'oc.name as client_name',
        'ot.scopes',
        'ot.access_token_expires_at',
        'ot.refresh_token_expires_at',
        'ot.created_at',
      ])
      .where({
        'ot.user_id': userId,
        'ot.revoked_at': null,
        'ot.refresh_token_expires_at': { $gt: currentTimestamp(platform) },
      })
      .orderBy({ 'ot.created_at': 'desc' })
      .execute<OauthSessionRow[]>('all', false);
    return rows.map((row) => ({
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name,
      scopes: row.scopes,
      access_token_expires_at: row.access_token_expires_at,
      refresh_token_expires_at: row.refresh_token_expires_at,
      created_at: row.created_at ?? null,
    }));
  }

  // ---------------------------------------------------------------------
  // OA27 — session-revoke ownership + 404 check
  // ---------------------------------------------------------------------

  /** `SELECT id, client_id FROM oauth_tokens WHERE id = ? AND user_id = ?` — 404-never-403, ownership scoped in the WHERE. */
  async findOwnedById(id: number, userId: number): Promise<OauthTokenOwnedRow | null> {
    const row = await this.findOne({ id, user: userId }, { fields: ['id', 'client'] });
    return row ? { id: row.id, client_id: row.client.id } : null;
  }

  // ---------------------------------------------------------------------
  // OA31 — admin "live sessions" panel
  // ---------------------------------------------------------------------

  /**
   * ```sql
   * SELECT ot.id, ot.client_id, oc.name AS client_name, ot.user_id, u.username,
   *        ot.scopes, ot.access_token_expires_at, ot.refresh_token_expires_at, ot.created_at
   * FROM oauth_tokens ot
   * JOIN oauth_clients oc ON ot.client_id = oc.client_id
   * JOIN users u ON u.id = ot.user_id
   * WHERE ot.revoked_at IS NULL AND ot.refresh_token_expires_at > CURRENT_TIMESTAMP
   * ORDER BY ot.created_at DESC
   * ```
   *
   * The QueryBuilder, same reason as `listActiveByUser` (OA26) — the
   * `client` relation now carries the real referenced column (see this
   * class's docstring). `users` joins correctly either way (`ot.user` is a
   * normal relation), joined here through the QueryBuilder too for one
   * consistent query shape rather than a Kysely query. `columnRef` for both
   * `client_id`/`user_id`: both relations are also joined in this same
   * query, so a plain `'ot.client_id'`/`'ot.user_id'` select would collapse
   * into their respective joins (same finding as `listActiveByUser`/OA16).
   * Malformed `scopes` JSON degrading to `null` per-row (not a 500) stays
   * in the SERVICE, unchanged — this repository returns the raw column
   * text.
   */
  async listAllActiveWithClientAndUser(): Promise<OauthSessionWithUserRow[]> {
    const platform = this.getEntityManager().getPlatform();
    const rows = await this.qb('ot')
      .innerJoin('ot.client', 'oc')
      .innerJoin('ot.user', 'u')
      .select([
        'ot.id',
        columnRef(platform, 'ot.client_id'),
        'oc.name as client_name',
        columnRef(platform, 'ot.user_id'),
        'u.username',
        'ot.scopes',
        'ot.access_token_expires_at',
        'ot.refresh_token_expires_at',
        'ot.created_at',
      ])
      .where({ 'ot.revoked_at': null, 'ot.refresh_token_expires_at': { $gt: currentTimestamp(platform) } })
      .orderBy({ 'ot.created_at': 'desc' })
      .execute<OauthSessionWithUserRow[]>('all', false);
    return rows.map((row) => ({
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name,
      user_id: row.user_id,
      username: row.username,
      scopes: row.scopes,
      access_token_expires_at: row.access_token_expires_at,
      refresh_token_expires_at: row.refresh_token_expires_at,
      created_at: row.created_at ?? null,
    }));
  }

  // ---------------------------------------------------------------------
  // OA32 — admin revoke's 404 check
  // ---------------------------------------------------------------------

  /** `SELECT id, user_id, client_id FROM oauth_tokens WHERE id = ?` — unscoped (admin), distinct from `findOwnedById` (OA27). */
  async findById(id: number): Promise<OauthTokenAdminRow | null> {
    const row = await this.findOne({ id }, { fields: ['id', 'user', 'client'] });
    return row ? { id: row.id, user_id: row.user.id, client_id: row.client.id } : null;
  }
}
