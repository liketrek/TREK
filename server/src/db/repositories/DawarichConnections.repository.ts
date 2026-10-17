import { currentTimestamp } from '../dialect/sql-functions';
import type { DawarichConnections } from '../entities/DawarichConnections.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `dawarich_connections` — every scalar column, for {@link AssertRowKeys}'s
 * pin only. No method below returns this exact shape: DWC1's `findRow`
 * covers 9 of the 11 (the legacy `readRow` statement never selected
 * `created_at`/`updated_at`), and nothing else reads a full row.
 */
interface DawarichConnectionsAllColumns {
  user_id: number;
  url: string | null;
  api_key: string | null;
  allow_insecure_tls: number;
  sync_enabled: number;
  last_sync_at: string | null;
  last_sync_state: string;
  last_sync_error: string | null;
  capabilities: string | null;
  created_at: string | null;
  updated_at: string | null;
}
const _dawarichConnectionsAllColumns: AssertRowKeys<DawarichConnectionsAllColumns, DawarichConnections> = true;

/**
 * DWC1's own 9-column read (`readRow`'s legacy statement text). **R7**:
 * `api_key` is the still-encrypted TEXT value, passed through untouched —
 * `maybe_encrypt_api_key`/`decrypt_api_key` are called from `DawarichService`
 * only, never from this repository.
 */
export interface DawarichConnectionRow {
  user_id: number;
  url: string | null;
  api_key: string | null;
  allow_insecure_tls: number;
  sync_enabled: number;
  last_sync_at: string | null;
  last_sync_state: string;
  last_sync_error: string | null;
  capabilities: string | null;
}

/**
 * `dawarich_connections` — one row per user, `user` (mirrored as `user_id`)
 * the entity's own primary key (`[PrimaryKeyProp]?: 'user'`, same shape as
 * `VacayUserSettingsRepository`'s own table). Every dawarich file depends on
 * this repository's `getCredentials`/`listSyncableUserIds`/
 * `recordSyncResult` (via `DawarichService`) — convert this one first.
 */
export class DawarichConnectionsRepository extends TrekRepository<DawarichConnections> {
  /**
   * DWC1 — `readRow`: `SELECT user_id, url, api_key, allow_insecure_tls,
   * sync_enabled, last_sync_at, last_sync_state, last_sync_error,
   * capabilities FROM dawarich_connections WHERE user_id = ?`.
   * `mapResults: false` (matching `TripsRepository.findAccessible`'s own
   * PK-is-FK read) so the raw driver row is returned as-is — `c.user` is the
   * relation property; SQL still names the physical `user_id` column.
   */
  async findRow(userId: number): Promise<DawarichConnectionRow | null> {
    const row = await this.qb('c')
      .select([
        'c.user',
        'c.url',
        'c.api_key',
        'c.allow_insecure_tls',
        'c.sync_enabled',
        'c.last_sync_at',
        'c.last_sync_state',
        'c.last_sync_error',
        'c.capabilities',
      ])
      .where({ user: userId })
      .execute<DawarichConnectionRow | undefined>('get', false);
    return row ?? null;
  }

  /**
   * DWC2 — `listSyncableUserIds`: `SELECT user_id FROM dawarich_connections
   * WHERE sync_enabled = 1 AND url IS NOT NULL AND url <> '' AND api_key IS
   * NOT NULL`. **NON-HTTP ENTRYPOINT SOURCE** — the cron's user list. Three
   * `.andWhere` calls, not one combined filter object: `url`'s two
   * conditions (`IS NOT NULL` and `<> ''`) cannot both live under one
   * `{ url: {...} }` key.
   */
  async listSyncableUserIds(): Promise<number[]> {
    const rows = await this.qb('c')
      .select(['c.user'])
      .where({ sync_enabled: 1 })
      .andWhere({ url: { $ne: null } })
      .andWhere({ url: { $ne: '' } })
      .andWhere({ api_key: { $ne: null } })
      .execute<{ user_id: number }[]>('all', false);
    return rows.map((r) => r.user_id);
  }

  /** DWC3 — `saveSettings`'s previous-host read: `SELECT url FROM dawarich_connections WHERE user_id = ?`. */
  async getUrl(userId: number): Promise<string | null> {
    const row = await this.qb('c')
      .select(['c.url'])
      .where({ user: userId })
      .execute<{ url: string | null } | undefined>('get', false);
    return row?.url ?? null;
  }

  /**
   * DWC4 — `saveSettings`'s upsert: `INSERT INTO dawarich_connections
   * (user_id, url, allow_insecure_tls, sync_enabled, updated_at) VALUES (?,
   * ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET url =
   * excluded.url, allow_insecure_tls = excluded.allow_insecure_tls,
   * sync_enabled = excluded.sync_enabled, updated_at = CURRENT_TIMESTAMP`.
   * Single-column-PK upsert, `onConflictFields: ['user']`.
   * `onConflictMergeFields` narrowed to exactly the four columns the legacy
   * statement's own `SET` list touches (`OauthConsentsRepository.upsertGrant`'s
   * precedent for the unconditional `updated_at` stamp;
   * `VacayUserYearsRepository.upsertCarriedOver`'s precedent for narrowing
   * the merge set) — `api_key`/`capabilities`/`last_sync_*` are untouched on
   * conflict and default to NULL/`'never'` on a genuine INSERT, matching the
   * legacy statement's own column list exactly.
   */
  async upsertConnection(
    userId: number,
    data: { url: string | null; allowInsecureTls: boolean; syncEnabled: boolean },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.upsert(
      {
        user: userId,
        url: data.url,
        allow_insecure_tls: data.allowInsecureTls ? 1 : 0,
        sync_enabled: data.syncEnabled ? 1 : 0,
        updated_at: currentTimestamp(platform),
      },
      {
        onConflictFields: ['user'],
        onConflictAction: 'merge',
        onConflictMergeFields: ['url', 'allow_insecure_tls', 'sync_enabled', 'updated_at'],
      },
    );
  }

  /**
   * DWC5/DWC7 — `saveSettings`'s key write/scrub, one statement text:
   * `UPDATE dawarich_connections SET api_key = ? WHERE user_id = ?`.
   * **SECURITY**: `apiKey` is the already-encrypted TEXT (or `null` to
   * scrub), passed through untouched (R7).
   */
  async setApiKey(userId: number, apiKey: string | null): Promise<void> {
    await this.nativeUpdate({ user: userId }, { api_key: apiKey });
  }

  /**
   * DWC6 — `saveSettings`'s host-moved reset: `UPDATE dawarich_connections
   * SET capabilities = NULL, last_sync_state = 'never', last_sync_error =
   * NULL, last_sync_at = NULL WHERE user_id = ?`.
   */
  async resetSyncState(userId: number): Promise<void> {
    await this.nativeUpdate(
      { user: userId },
      { capabilities: null, last_sync_state: 'never', last_sync_error: null, last_sync_at: null },
    );
  }

  /**
   * DWC8 — `saveSettings`'s address-cleared reset: `UPDATE
   * dawarich_connections SET api_key = NULL, capabilities = NULL,
   * last_sync_state = 'never', last_sync_error = NULL, last_sync_at = NULL
   * WHERE user_id = ?` — {@link resetSyncState}'s four columns plus
   * `api_key`, one statement (never two calls: the legacy text is a single
   * UPDATE with five `SET` clauses).
   */
  async clearForRemovedUrl(userId: number): Promise<void> {
    await this.nativeUpdate(
      { user: userId },
      { api_key: null, capabilities: null, last_sync_state: 'never', last_sync_error: null, last_sync_at: null },
    );
  }

  /**
   * DWC9 — `disconnect`: `DELETE FROM dawarich_connections WHERE user_id =
   * ?`. **PARITY**: does not cascade to `dawarich_visit_suggestions` —
   * deliberate (the entity carries no relation from suggestions back to a
   * connection at all, so there is nothing for a migration-level cascade to
   * even attach to).
   */
  async disconnect(userId: number): Promise<void> {
    await this.nativeDelete({ user: userId });
  }

  /** DWC10 — `storeCapabilities`: `UPDATE dawarich_connections SET capabilities = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`. */
  async storeCapabilities(userId: number, capabilitiesJson: string): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { user: userId },
      { capabilities: capabilitiesJson, updated_at: currentTimestamp(platform) },
    );
  }

  /**
   * DWC11 — `recordSyncResult`: `UPDATE dawarich_connections SET
   * last_sync_at = ?, last_sync_state = ?, last_sync_error = ?, updated_at =
   * CURRENT_TIMESTAMP WHERE user_id = ?`. **NON-HTTP ENTRYPOINT** — called
   * after every cron sync.
   */
  async recordSyncResult(
    userId: number,
    data: { lastSyncAt: string; state: string; error: string | null },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { user: userId },
      {
        last_sync_at: data.lastSyncAt,
        last_sync_state: data.state,
        last_sync_error: data.error,
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /**
   * DSY1 — `dawarich-sync.service.ts#syncUser`'s in-flight-branch read, a
   * narrower dup shape of DWC1: `SELECT last_sync_state FROM
   * dawarich_connections WHERE user_id = ?`. Lives here (not on
   * `DawarichVisitSuggestionsRepository`) because it reads this table.
   */
  async getLastSyncState(userId: number): Promise<string | null> {
    const row = await this.qb('c')
      .select(['c.last_sync_state'])
      .where({ user: userId })
      .execute<{ last_sync_state: string } | undefined>('get', false);
    return row?.last_sync_state ?? null;
  }
}
