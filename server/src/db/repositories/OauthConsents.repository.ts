import { currentTimestampKysely } from '../dialect/kysely-functions';
import { OauthConsents } from '../entities/OauthConsents.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * No method in this repository returns a full `oauth_consents` row (unlike
 * `OauthClients`/`OauthTokens` in the same domain) — this interface exists
 * only so `AssertRowKeys` below still pins that every scalar column of the
 * entity is accounted for SOMEWHERE, the same `OauthTokenScalarColumns`
 * shape `OauthTokens.repository.ts` uses (Plan 3b interlude B, task-4-review
 * F4: this repository had no such pin at all — a column added to or removed
 * from `oauth_consents` by a future migration+regeneration would not fail
 * `tsc`).
 */
interface OauthConsentRow {
  id: number;
  client_id: string;
  user_id: number;
  scopes: string;
  updated_at: string | null;
}

const _oauthConsentRowKeys: AssertRowKeys<OauthConsentRow, OauthConsents> = true;

/**
 * Per-(client, user) OAuth consent grants, Plan 3b Task 4, inventory §3
 * OA11/OA12. `oauth_consents` has a genuine composite unique index on
 * `(client_id, user_id)` (`Migration20200101012500_oauth_2.ts`:
 * `UNIQUE(client_id, user_id)`, mirrored on the entity as `uniques: [{
 * properties: ['client', 'user'] }]`), so OA12's upsert decision (task
 * brief ruling) is `em.upsert`, not a `nativeDelete` + `insert` pair — the
 * natural key IS unique, no fallback needed. Scope union-not-narrow (M5:
 * never narrow stored consent) stays in the SERVICE — this repository
 * writes exactly the scopes JSON it is given.
 */
export class OauthConsentsRepository extends TrekRepository<OauthConsents> {
  // ---------------------------------------------------------------------
  // OA11 — consent-sufficiency read
  // ---------------------------------------------------------------------

  /**
   * `SELECT scopes FROM oauth_consents WHERE client_id = ? AND user_id = ?`
   * `null` when no consent has been granted yet — the JSON parse of a
   * present-but-empty `scopes` value ("consent granted, zero scopes",
   * structurally distinct from "never consented") stays in the service,
   * unchanged.
   *
   * Named `findScopes`, not `find` — `EntityRepository#find` already exists
   * with an incompatible signature (`(where, options) => Promise<Entity[]>`);
   * shadowing it would either fail to compile or silently hide the base
   * method (same rule `upsertGrant` below follows for `#upsert`).
   */
  async findScopes(clientId: string, userId: number): Promise<{ scopes: string } | null> {
    const row = await this.findOne({ client: clientId, user: userId }, { fields: ['scopes'] });
    return row ? { scopes: row.scopes } : null;
  }

  // ---------------------------------------------------------------------
  // OA12 — consent grant (upsert)
  // ---------------------------------------------------------------------

  /**
   * `INSERT OR REPLACE INTO oauth_consents (client_id, user_id, scopes,
   *  updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)` —
   * **security-sensitive** (authorization grant). Written with Kysely's
   * `onConflict` on the migration's `UNIQUE(client_id, user_id)`, so the
   * client goes in as the `client_id` column value it is. `em.upsert` would
   * read it through the `client` relation, which points at
   * `oauth_clients.client_id` rather than the primary key: MikroORM takes a
   * bare value there for the target's primary key, and the referenced value
   * as a plain object for the data of a new `OauthClients` entity.
   *
   * `updated_at` is stamped on every call, on the insert and on the update
   * half alike: the legacy `INSERT OR REPLACE` always rewrote it, and a
   * column default would only cover the insert.
   *
   * Named `upsertGrant`, not `upsert` — `EntityRepository#upsert` already
   * exists with an incompatible signature (`(entityOrData, options) =>
   * Promise<Entity>`); shadowing it would either fail to compile or silently
   * hide the base method, the same collision `Users.repository.ts::insertUser`
   * avoided with `create`.
   *
   * One divergence from the legacy statement (Task 7 review, B-I1),
   * unobservable and strictly better: the legacy `INSERT OR REPLACE`
   * deletes-then-inserts, so a re-consent always assigned a NEW surrogate
   * `id`; the update on conflict keeps the existing one. `oauth_consents` has
   * only `id`/`client_id`/`user_id`/`scopes`/`updated_at` and nothing reads
   * `id`, so this is unobservable, and it avoids the FK churn a
   * delete+insert would cause if anything ever referenced this row's
   * surrogate key.
   */
  async upsertGrant(clientId: string, userId: number, scopes: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    const now = currentTimestampKysely(platform);
    await this.kysely<Pick<DB, 'oauth_consents'>>()
      .insertInto('oauth_consents')
      .values({ client_id: clientId, user_id: userId, scopes, updated_at: now })
      .onConflict((oc) => oc.columns(['client_id', 'user_id']).doUpdateSet({ scopes, updated_at: now }))
      .execute();
  }
}
