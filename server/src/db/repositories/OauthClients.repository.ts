import { OauthClients } from '../entities/OauthClients.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A full `oauth_clients` row (`SELECT * FROM oauth_clients WHERE ...`), as
 * the API emits it. `user_id` is the `persist(false)` mirror of the `user`
 * relation (same pattern as `InviteTokens.created_by`/`createdByRef`) — a
 * scalar column for `AssertRowKeys` purposes even though it is never written
 * directly.
 */
export interface OauthClientRow {
  id: string;
  user_id: number | null;
  name: string;
  client_id: string;
  client_secret_hash: string;
  redirect_uris: string; // JSON array
  allowed_scopes: string; // JSON array
  created_at: string | null;
  is_public: number; // 0 | 1
  created_via: string;
  allows_client_credentials: number; // 0 | 1
}

const _oauthClientRowKeys: AssertRowKeys<OauthClientRow, OauthClients> = true;

/**
 * OA1 (`listOAuthClients`) / OA5 (`createOAuthClient`'s re-select) — every
 * column except `client_secret_hash`, which the settings panel and the
 * create-response never carry.
 */
export interface OauthClientPublicRow {
  id: string;
  user_id: number | null;
  name: string;
  client_id: string;
  redirect_uris: string;
  allowed_scopes: string;
  created_at: string | null;
  is_public: number;
  created_via: string;
  allows_client_credentials: number;
}

/** `OauthService.createOAuthClient`'s write (OA4) — every column the legacy INSERT names explicitly. */
export interface NewOauthClientRow {
  id: string;
  user_id: number | null;
  name: string;
  client_id: string;
  client_secret_hash: string;
  redirect_uris: string;
  allowed_scopes: string;
  is_public: number;
  created_via: string;
  allows_client_credentials: number;
}

/**
 * OA6 (`rotateOAuthClientSecret`'s ownership+404 check, 3 columns) / OA9
 * (`deleteOAuthClient`'s ownership+404 check, 2 columns) — one method, the
 * superset projection (same economy as `McpTokensRepository.findBasic`
 * merging TK4/TK9): OA9's caller reads only `id`/`client_id` and ignores
 * `is_public`.
 */
export interface OauthClientOwnedRow {
  id: string;
  client_id: string;
  is_public: number;
}

/**
 * OA15 (`getSdkClient`) — the exact row the MCP SDK's `clientsStore` adapter
 * (`oauth-sdk.provider.ts`'s `rowToInfo`) maps to `OAuthClientInformationFull`.
 * Never carries `client_secret_hash` — a separate method from
 * `findByClientIdFull`, not a service-side projection of it (Task 4 brief
 * ruling: decide from how the result is used and record the decision) —
 * the SDK adapter's scope should never see the hash column pass through it
 * even transiently.
 */
export interface OauthClientSdkRow {
  client_id: string;
  name: string;
  redirect_uris: string;
  allowed_scopes: string;
  is_public: number;
  created_via: string;
}

/** OA21 (`refreshTokens`'s client-auth read) — client auth needs only these three columns. */
export interface OauthClientAuthRow {
  client_id: string;
  client_secret_hash: string;
  is_public: number;
}

/**
 * OAuth 2.1 client registrations (self-service + DCR + machine clients),
 * Plan 3b Task 4, inventory §3 OA1-OA10/OA15/OA21/OA29/OA30. Every row-out
 * read passes `disableIdentityMap: true` (program RULING, Task 1 review B1
 * — see `Users.repository.ts`'s class-level docstring; applied by the base
 * class's default since Plan 3b interlude B, `_shared/trek-repository.ts`):
 * a partial-field
 * `find`/`findOne` merged into the request's identity map can go stale and
 * get flushed back over an unrelated `nativeUpdate` in the same transaction;
 * a `disableIdentityMap: true` read is always isolated and discarded.
 * `client_secret_hash` is never hashed or compared here — that stays in
 * `OauthService` (`hashToken`/`timingSafeEqualHex`).
 */
export class OauthClientsRepository extends TrekRepository<OauthClients> {
  // ---------------------------------------------------------------------
  // OA1 — self-service client list
  // ---------------------------------------------------------------------

  /**
   * `SELECT id, user_id, name, client_id, redirect_uris, allowed_scopes,
   *  created_at, is_public, created_via, allows_client_credentials FROM
   *  oauth_clients WHERE user_id = ? ORDER BY created_at DESC`
   *
   * `fields` names the RELATION property `'user'`, not the `persist(false)`
   * mirror `'user_id'` — verified empirically (not from the `.d.ts`, per
   * `McpTokensRepository.findBasic`'s docstring): naming the mirror directly
   * leaves `row.user_id` `undefined` (it has no column of its own to
   * select); the relation's `Ref` loads instead, and its `.id` reads
   * synchronously without a second query.
   */
  async listByUser(userId: number): Promise<OauthClientPublicRow[]> {
    const rows = await this.find(
      { user: userId },
      {
        fields: [
          'id',
          'user',
          'name',
          'client_id',
          'redirect_uris',
          'allowed_scopes',
          'created_at',
          'is_public',
          'created_via',
          'allows_client_credentials',
        ],
        orderBy: { created_at: 'desc' },
      },
    );
    return rows.map((row) => ({
      id: row.id as string,
      // `row.user?.id`'s `?? null` fallback is unreachable THROUGH THIS
      // METHOD specifically: the query already filters `{ user: userId }`
      // on a concrete, non-null `userId`, so every returned row's `user`
      // relation is populated by construction — `findPublicById` below is
      // the id-scoped sibling that genuinely reads an anonymous (NULL
      // `user_id`) client and exercises this same shape's null branch.
      // Kept for type-shape symmetry with that sibling, not dead by
      // mistake (the `countNonGuest`/`COALESCE(is_guest, 0)` precedent
      // above is the same kind of defensive-but-unreachable fallback).
      user_id: row.user?.id ?? null,
      name: row.name,
      client_id: row.client_id,
      redirect_uris: row.redirect_uris,
      allowed_scopes: row.allowed_scopes,
      created_at: row.created_at ?? null,
      is_public: row.is_public,
      created_via: row.created_via,
      allows_client_credentials: row.allows_client_credentials,
    }));
  }

  // ---------------------------------------------------------------------
  // OA2 / OA3 — registration caps
  // ---------------------------------------------------------------------

  /** `SELECT COUNT(*) as count FROM oauth_clients WHERE user_id = ?` (the 10-per-user cap). */
  async countByUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  /** `SELECT COUNT(*) as count FROM oauth_clients WHERE user_id IS NULL` (the 500 anonymous-DCR cap). */
  async countAnonymous(): Promise<number> {
    return this.count({ user: null });
  }

  // ---------------------------------------------------------------------
  // OA4 / OA5 — client registration
  // ---------------------------------------------------------------------

  /**
   * `INSERT INTO oauth_clients (id, user_id, name, client_id,
   *  client_secret_hash, redirect_uris, allowed_scopes, is_public,
   *  created_via, allows_client_credentials) VALUES (...)` (OA4,
   * **security-sensitive**: client registration), followed by `findPublicById`
   * (OA5's re-select — same column list `listByUser` selects, `WHERE id = ?`).
   *
   * `em.insert` (program RULING), never `create()` + `persist().flush()`:
   * `flush()` commits the request EntityManager's WHOLE unit of work, not
   * just this row (`Users.repository.ts::insertUser`'s docstring). `id` is
   * application-generated (`randomUUID()`, the service's job, never this
   * repository's) — the legacy INSERT names it explicitly, so `em.insert`
   * does too, never relying on a DB-generated default.
   */
  async insertClient(row: NewOauthClientRow): Promise<OauthClientPublicRow> {
    await this.insert({
      id: row.id,
      user: row.user_id,
      name: row.name,
      client_id: row.client_id,
      client_secret_hash: row.client_secret_hash,
      redirect_uris: row.redirect_uris,
      allowed_scopes: row.allowed_scopes,
      is_public: row.is_public,
      created_via: row.created_via,
      allows_client_credentials: row.allows_client_credentials,
    });
    const inserted = await this.findPublicById(row.id);
    if (!inserted) {
      throw new Error(`OauthClientsRepository.insertClient: row ${row.id} not found immediately after insert`);
    }
    return inserted;
  }

  /** OA1's exact column set, `WHERE id = ?` — `insertClient`'s re-select (OA5). */
  async findPublicById(id: string): Promise<OauthClientPublicRow | null> {
    const row = await this.findOne(
      { id },
      {
        fields: [
          'id',
          'user',
          'name',
          'client_id',
          'redirect_uris',
          'allowed_scopes',
          'created_at',
          'is_public',
          'created_via',
          'allows_client_credentials',
        ],
      },
    );
    return row
      ? {
          id: row.id as string,
          user_id: row.user?.id ?? null,
          name: row.name,
          client_id: row.client_id,
          redirect_uris: row.redirect_uris,
          allowed_scopes: row.allowed_scopes,
          created_at: row.created_at ?? null,
          is_public: row.is_public,
          created_via: row.created_via,
          allows_client_credentials: row.allows_client_credentials,
        }
      : null;
  }

  // ---------------------------------------------------------------------
  // OA6 / OA9 — ownership + 404 checks (secret rotation / delete)
  // ---------------------------------------------------------------------

  /**
   * `SELECT id, client_id, is_public FROM oauth_clients WHERE id = ? AND
   *  user_id = ?` (OA6, `rotateOAuthClientSecret`) and `SELECT id, client_id
   *  FROM oauth_clients WHERE id = ? AND user_id = ?` (OA9,
   * `deleteOAuthClient`) — ONE method, the superset projection (OA9's two
   * columns are a strict subset of OA6's three, same economy as
   * `McpTokensRepository.findBasic`'s TK4/TK9 merge). 404-never-403: scoping
   * by `user` in the WHERE, not a separate ownership check after an
   * unscoped read.
   */
  async findOwned(id: string, userId: number): Promise<OauthClientOwnedRow | null> {
    const row = await this.findOne({ id, user: userId }, { fields: ['id', 'client_id', 'is_public'] });
    return row ? { id: row.id as string, client_id: row.client_id, is_public: row.is_public } : null;
  }

  // ---------------------------------------------------------------------
  // OA7 — secret rotation write
  // ---------------------------------------------------------------------

  /** `UPDATE oauth_clients SET client_secret_hash = ? WHERE id = ?` — **security-sensitive**. */
  async updateSecretHash(id: string, hash: string): Promise<void> {
    await this.nativeUpdate({ id }, { client_secret_hash: hash });
  }

  // ---------------------------------------------------------------------
  // OA10 — delete
  // ---------------------------------------------------------------------

  /** `DELETE FROM oauth_clients WHERE id = ?` */
  async remove(id: string): Promise<void> {
    await this.nativeDelete({ id });
  }

  // ---------------------------------------------------------------------
  // OA15 — MCP SDK clientsStore adapter read
  // ---------------------------------------------------------------------

  /**
   * `SELECT client_id, name, redirect_uris, allowed_scopes, is_public,
   *  created_via FROM oauth_clients WHERE client_id = ?` — see
   * `OauthClientSdkRow`'s docstring for why this stays its own method
   * rather than a service-side projection of `findByClientIdFull`.
   */
  async findSdkProjection(clientId: string): Promise<OauthClientSdkRow | null> {
    const row = await this.findOne(
      { client_id: clientId },
      { fields: ['client_id', 'name', 'redirect_uris', 'allowed_scopes', 'is_public', 'created_via'] },
    );
    return row
      ? {
          client_id: row.client_id,
          name: row.name,
          redirect_uris: row.redirect_uris,
          allowed_scopes: row.allowed_scopes,
          is_public: row.is_public,
          created_via: row.created_via,
        }
      : null;
  }

  // ---------------------------------------------------------------------
  // OA21 — refresh-token-grant client authentication
  // ---------------------------------------------------------------------

  /**
   * `SELECT client_id, client_secret_hash, is_public FROM oauth_clients
   *  WHERE client_id = ?` (`refreshTokens`'s client-auth read —
   * **security-sensitive**). A distinct projection from OA15's — not merged
   * with it (D4: mirror each statement's exact column set; a prior draft of
   * this repository conflated the two, corrected per the Task 4 controller
   * addendum).
   */
  async findAuthRow(clientId: string): Promise<OauthClientAuthRow | null> {
    const row = await this.findOne(
      { client_id: clientId },
      { fields: ['client_id', 'client_secret_hash', 'is_public'] },
    );
    return row
      ? { client_id: row.client_id, client_secret_hash: row.client_secret_hash, is_public: row.is_public }
      : null;
  }

  // ---------------------------------------------------------------------
  // OA29 / OA30 — authorize-flow + token-endpoint client lookups
  // ---------------------------------------------------------------------

  /**
   * `SELECT * FROM oauth_clients WHERE client_id = ?` — OA29
   * (`validateAuthorizeRequest`) and OA30 (`authenticateClient`,
   * **security-sensitive**: token-endpoint client auth), identical
   * statement text, two call sites — ONE method, the full row (D4: both
   * legacy statements are genuinely `SELECT *`, unlike OA15/OA21's narrow
   * projections).
   */
  async findByClientIdFull(clientId: string): Promise<OauthClientRow | null> {
    const row = await this.findOne({ client_id: clientId });
    return row ? (toRow(row) as OauthClientRow) : null;
  }
}
