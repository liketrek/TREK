import { currentTimestampKysely } from '../dialect/sql-functions';
import type { PluginOauthTokens } from '../entities/PluginOauthTokens.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * Plan 3j Task 2 note: this repository's ONLY method today is the uninstall
 * cascade's own delete (`plugin-runtime.service.ts`'s `uninstall()`, PR42) — the
 * statement lives in Task 2's file even though the rest of this table's surface
 * (`storeToken`'s COALESCE-preserving composite upsert, R-oauth-upsert) belongs to
 * Task 4's `oauth/plugin-oauth.service.ts`. Task 4 adds its own methods to this
 * same repository; this one is additive and does not collide with them.
 */

/** PO8 (`getAccessToken`)'s own projection. Ciphertext columns pass through
 *  untouched — `access_token`/`refresh_token` are encrypted/decrypted in
 *  `plugin-oauth.service.ts` only (3e's R6 boundary), never in this repository. */
export interface PluginOauthTokenRow {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}

/**
 * PO11's insert-only shape (`storeToken`'s VALUES list — `updated_at` is always
 * `datetime('now')`/`CURRENT_TIMESTAMP`, never caller-supplied, same reasoning
 * `DocumentSyncItemsRepository`'s own write-only Kysely interface docstring gives
 * for a SEPARATE interface rather than widening the read-shaped row above).
 */
interface PluginOauthTokensWriteKyselyDB {
  plugin_oauth_tokens: {
    plugin_id: string;
    user_id: number;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: number | null;
    scope: string | null;
    updated_at: string;
  };
}

export class PluginOauthTokensRepository extends TrekRepository<PluginOauthTokens> {
  /** PR42 (uninstall cascade, `deleteData` branch) — `DELETE FROM plugin_oauth_tokens WHERE plugin_id = ?`. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  /** `exportUserData`'s GDPR fold — `SELECT DISTINCT plugin_id FROM plugin_oauth_tokens WHERE user_id = ?` (which plugins a user OAuth-linked; raw tokens are never exported). */
  async listDistinctPluginIdsForUser(userId: number): Promise<string[]> {
    const rows = await this.find({ user_id: userId }, { fields: ['plugin_id'] });
    return [...new Set(rows.map((r) => r.plugin_id))];
  }

  /** PO2 (`status`) — `SELECT 1 FROM plugin_oauth_tokens WHERE plugin_id = ? AND user_id = ? AND access_token IS NOT NULL`, as a boolean existence check. */
  async hasAccessToken(pluginId: string, userId: number): Promise<boolean> {
    const row = await this.findOne(
      { plugin_id: pluginId, user_id: userId, access_token: { $ne: null } },
      { fields: ['plugin_id'] },
    );
    return row !== null;
  }

  /** PO8 (`getAccessToken`) — `SELECT access_token, refresh_token, expires_at FROM plugin_oauth_tokens WHERE plugin_id = ? AND user_id = ?`. */
  async findTokenRow(pluginId: string, userId: number): Promise<PluginOauthTokenRow | null> {
    const row = await this.findOne(
      { plugin_id: pluginId, user_id: userId },
      { fields: ['access_token', 'refresh_token', 'expires_at'] },
    );
    return row
      ? {
          access_token: row.access_token ?? null,
          refresh_token: row.refresh_token ?? null,
          expires_at: row.expires_at ?? null,
        }
      : null;
  }

  /** PO9 (`disconnect`) — `DELETE FROM plugin_oauth_tokens WHERE plugin_id = ? AND user_id = ?`. */
  async deleteForUser(pluginId: string, userId: number): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId, user_id: userId });
  }

  /**
   * PO11 (`storeToken`, R-oauth-upsert) — the composite-key upsert on `(plugin_id,
   * user_id)`. Legacy text:
   * `` INSERT INTO plugin_oauth_tokens (plugin_id, user_id, access_token,
   * refresh_token, expires_at, scope, updated_at) VALUES (?, ?, ?, ?, ?, ?,
   * datetime('now')) ON CONFLICT(plugin_id, user_id) DO UPDATE SET
   * access_token = excluded.access_token, refresh_token = COALESCE(excluded.refresh_token,
   * plugin_oauth_tokens.refresh_token), expires_at = excluded.expires_at,
   * scope = excluded.scope, updated_at = excluded.updated_at ``.
   *
   * The `COALESCE` operand order is load-bearing (R-oauth-upsert's own warning,
   * read twice): NEW value (`excluded.refresh_token`) FIRST, EXISTING
   * (`plugin_oauth_tokens.refresh_token`) SECOND — a refresh response that DOES
   * supply a new refresh token uses it; one that omits it (many providers do on a
   * plain refresh grant) keeps the row's existing token. Reversing the two operands
   * would silently erase stored offline access on every refresh that omits the
   * field, with nothing in the request/response cycle ever surfacing it.
   *
   * `em.upsert` cannot express a column-level COALESCE merge (`onConflictMergeFields`
   * only ever re-assigns `excluded.<col>` verbatim or omits the column, never "merge
   * with the row's own current value") — hand-typed Kysely, the same
   * `insertInto(...).onConflict(oc => oc.columns([...]).doUpdateSet({...}))` shape
   * `DocumentSyncItemsRepository.insertOrUpsertOnConflict` established as this
   * program's precedent for a COALESCE-preserving composite upsert. Ciphertext
   * passes through untouched: `access_token`/`refresh_token` are already encrypted
   * by the caller (`plugin-oauth.service.ts#storeToken`, 3e's R6 boundary) — this
   * repository never calls `encrypt_api_key`/`decrypt_api_key`.
   */
  async storeToken(data: {
    plugin_id: string;
    user_id: number;
    access_token: string;
    refresh_token: string | null;
    expires_at: number | null;
    scope: string | null;
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.kysely<PluginOauthTokensWriteKyselyDB>()
      .insertInto('plugin_oauth_tokens')
      .values({
        plugin_id: data.plugin_id,
        user_id: data.user_id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        scope: data.scope,
        updated_at: currentTimestampKysely(platform),
      })
      .onConflict((oc) =>
        oc.columns(['plugin_id', 'user_id']).doUpdateSet({
          access_token: (eb) => eb.ref('excluded.access_token'),
          refresh_token: (eb) =>
            eb.fn.coalesce(eb.ref('excluded.refresh_token'), eb.ref('plugin_oauth_tokens.refresh_token')),
          expires_at: (eb) => eb.ref('excluded.expires_at'),
          scope: (eb) => eb.ref('excluded.scope'),
          updated_at: () => currentTimestampKysely(platform),
        }),
      )
      .execute();
  }
}
