import { coalesceParam, currentTimestamp, nowPlusSeconds } from '../dialect/sql-functions';
import type { TripDocumentLinks } from '../entities/TripDocumentLinks.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `trip_document_links` row (every scalar column). */
export interface TripDocumentLinkRow {
  id: number;
  trip_id: number;
  connection_id: number;
  provider_id: string;
  remote_scope_key: string;
  remote_root_id: string | null;
  remote_root_path: string | null;
  remote_label: string;
  direction: string;
  delete_policy: string;
  conflict_policy: string;
  sync_enabled: number;
  webhook_token: string | null;
  webhook_secret: string | null;
  webhook_subscription_id: string | null;
  remote_cursor: string | null;
  last_sync_at: string | null;
  last_sync_state: string;
  last_sync_error: string | null;
  failure_count: number;
  next_attempt_at: string | null;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
}

const _linkRowKeys: AssertRowKeys<TripDocumentLinkRow, TripDocumentLinks> = true;

/** DSC17's dynamic SET list (`updateLink`) — only the fields present get written; `updated_at` is always stamped by {@link TripDocumentLinksRepository.updateFields} itself. */
export interface TripDocumentLinkPatch {
  direction?: string;
  delete_policy?: string;
  conflict_policy?: string;
  sync_enabled?: number;
  remote_label?: string;
  /** The un-orphan reset (`sets.push("last_sync_state = 'never'")`) — set by the service, never inferred here. */
  last_sync_state?: string;
}

/**
 * `trip_document_links` — one trip's binding of a scope (folder/tag/space) at
 * a `document_connections` row, both directions.
 */
export class TripDocumentLinksRepository extends TrekRepository<TripDocumentLinks> {
  /**
   * DS1 (`DocSyncService.dueLinks`) — `SELECT * FROM trip_document_links
   * WHERE sync_enabled=1 AND last_sync_state!='orphaned' AND
   * failure_count<? AND (next_attempt_at IS NULL OR next_attempt_at
   * <=CURRENT_TIMESTAMP) AND provider_id IN (SELECT id FROM
   * document_providers WHERE enabled=1) ORDER BY COALESCE(next_attempt_at,
   * '1970-01-01') ASC, COALESCE(last_sync_at, '1970-01-01') ASC, id ASC
   * LIMIT ?`. The provider-enabled subquery is resolved by the CALLER
   * (`DocSyncService.dueLinks`, via `DocumentProvidersRepository
   * .listEnabledIds`) rather than nested here as a raw SQL string (program
   * rule 23 bans an inline SQL string in a repository; a real Kysely
   * subquery was the other option, but this table's own `provider_id` set is
   * bounded and small, and two plain reads keep this whole method on the
   * QueryBuilder — rule 4's preferred query API — rather than dropping to
   * Kysely for a subquery this cheap to resolve up front). The theoretical
   * non-atomicity (a provider toggled between the two reads) affects at most
   * one link's inclusion on one tick of a self-hosted, single-operator
   * instance — flagged in the task report, not a parity break.
   *
   * **DS1's own doc comment describes a REAL production starvation bug this
   * 3-key ORDER BY fixed** (a stalled binding sorting first on every tick and
   * starving every link created after it) — preserved byte-for-byte, own
   * named test (`doc-sync-svc: dueLinks orders by next_attempt_at then
   * last_sync_at then id, not insertion order`).
   */
  async dueLinks(
    circuitOpenAfter: number,
    enabledProviderIds: readonly string[],
    limit: number,
  ): Promise<TripDocumentLinkRow[]> {
    if (enabledProviderIds.length === 0) return [];
    const platform = this.getEntityManager().getPlatform();
    const rows = await this.qb('l')
      .select(['l.*'])
      .where({
        sync_enabled: 1,
        last_sync_state: { $ne: 'orphaned' },
        failure_count: { $lt: circuitOpenAfter },
        $or: [{ next_attempt_at: null }, { next_attempt_at: { $lte: currentTimestamp(platform) } }],
        provider_id: { $in: [...enabledProviderIds] },
      })
      .orderBy([
        { [coalesceParam(platform, 'next_attempt_at', '1970-01-01')]: 'asc' },
        { [coalesceParam(platform, 'last_sync_at', '1970-01-01')]: 'asc' },
        { id: 'asc' },
      ])
      .limit(limit)
      .execute<TripDocumentLinkRow[]>('all', false);
    return rows;
  }

  /** DSC12 (`listLinks`) — `SELECT * FROM trip_document_links WHERE trip_id = ? ORDER BY id`. */
  async listForTrip(tripId: number): Promise<TripDocumentLinkRow[]> {
    return await this.qb('l')
      .select(['l.*'])
      .where({ trip_id: tripId })
      .orderBy({ id: 'asc' })
      .execute<TripDocumentLinkRow[]>('all', false);
  }

  /** DSC13 (`getLink`) — `SELECT * FROM trip_document_links WHERE id = ?`. */
  async findById(id: number): Promise<TripDocumentLinkRow | undefined> {
    return await this.qb('l').select(['l.*']).where({ id }).execute<TripDocumentLinkRow | undefined>('get', false);
  }

  /** DSC14 (`getLinkByToken`) — `SELECT * FROM trip_document_links WHERE webhook_token = ?`. **PUBLIC/ANONYMOUS ENTRYPOINT** (the webhook controller's sole authentication check). */
  async findByToken(token: string): Promise<TripDocumentLinkRow | undefined> {
    return await this.qb('l')
      .select(['l.*'])
      .where({ webhook_token: token })
      .execute<TripDocumentLinkRow | undefined>('get', false);
  }

  /** DSC15 (`createLink`'s pre-check) — `SELECT * FROM trip_document_links WHERE trip_id = ? AND connection_id = ? AND remote_scope_key = ?`. */
  async findByTripConnectionScope(
    tripId: number,
    connectionId: number,
    scopeKey: string,
  ): Promise<TripDocumentLinkRow | undefined> {
    return await this.qb('l')
      .select(['l.*'])
      .where({ trip_id: tripId, connection_id: connectionId, remote_scope_key: scopeKey })
      .execute<TripDocumentLinkRow | undefined>('get', false);
  }

  /**
   * DSC16 (`createLink`) — `INSERT INTO trip_document_links (trip_id,
   * connection_id, provider_id, remote_scope_key, remote_root_id,
   * remote_root_path, remote_label, direction, delete_policy,
   * conflict_policy, sync_enabled, webhook_token, webhook_secret,
   * created_by, next_attempt_at) VALUES (?×14, CURRENT_TIMESTAMP)`.
   * `webhook_secret` arrives already encrypted (R7) — this method never
   * calls `encryptSecrets` itself. `next_attempt_at` is seeded to "now" so a
   * fresh binding sorts first under DS1's due-links ordering.
   */
  async insertLink(data: {
    trip_id: number;
    connection_id: number;
    provider_id: string;
    remote_scope_key: string;
    remote_root_id: string | null;
    remote_root_path: string | null;
    remote_label: string;
    direction: string;
    delete_policy: string;
    conflict_policy: string;
    sync_enabled: number;
    webhook_token: string;
    webhook_secret: string;
    created_by: number;
  }): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return await this.insert({
      trip: data.trip_id,
      connection: data.connection_id,
      provider_id: data.provider_id,
      remote_scope_key: data.remote_scope_key,
      remote_root_id: data.remote_root_id,
      remote_root_path: data.remote_root_path,
      remote_label: data.remote_label,
      direction: data.direction,
      delete_policy: data.delete_policy,
      conflict_policy: data.conflict_policy,
      sync_enabled: data.sync_enabled,
      webhook_token: data.webhook_token,
      webhook_secret: data.webhook_secret,
      createdByRef: data.created_by,
      next_attempt_at: currentTimestamp(platform),
    });
  }

  /**
   * DSC17 (`updateLink`) — the dynamic SET list, as a typed partial (see
   * {@link TripDocumentLinkPatch}'s own docstring). `updated_at` is always
   * stamped; the caller (`DocSyncConfigService.updateLink`) only calls this
   * once it has confirmed at least one field of `patch` is present, matching
   * the legacy `sets.length === 0` early return.
   */
  async updateFields(id: number, patch: TripDocumentLinkPatch): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { ...patch, updated_at: currentTimestamp(platform) });
  }

  /** DSC19 (`deleteLink`, inside `uow.transactional`) — `DELETE FROM trip_document_links WHERE id = ?`. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /**
   * DSC21 (`markOrphanedLinks`) — `UPDATE trip_document_links SET
   * last_sync_state='orphaned', sync_enabled=0, updated_at=CURRENT_TIMESTAMP
   * WHERE sync_enabled=1 AND last_sync_state!='orphaned' AND connection_id
   * IN (<the shared owner-left predicate>)`. The predicate itself is
   * `DocumentConnectionsRepository.listOrphanedIds()` (DSC20/DSC21's shared
   * repository predicate) — this method takes the already-resolved id list,
   * matching {@link dueLinks}'s same "resolve the subquery's rows first,
   * filter here" shape. An empty list short-circuits to zero rows changed,
   * the same outcome `IN (SELECT ... WHERE <nothing matches>)` would produce.
   */
  async markOrphanedByConnectionIds(connectionIds: readonly number[]): Promise<number> {
    if (connectionIds.length === 0) return 0;
    const platform = this.getEntityManager().getPlatform();
    return await this.nativeUpdate(
      { sync_enabled: 1, last_sync_state: { $ne: 'orphaned' }, connection_id: { $in: [...connectionIds] } },
      { last_sync_state: 'orphaned', sync_enabled: 0, updated_at: currentTimestamp(platform) },
    );
  }

  /**
   * DS25 (`DocSyncService.recordLinkSuccess`) — `UPDATE trip_document_links
   * SET remote_cursor=?, last_sync_at=CURRENT_TIMESTAMP, last_sync_state=?,
   * last_sync_error=?, failure_count=0, next_attempt_at=NULL,
   * updated_at=CURRENT_TIMESTAMP WHERE id=?`.
   */
  async recordSuccess(
    id: number,
    data: { remote_cursor: string | null; state: string; error_code: string | null },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        remote_cursor: data.remote_cursor,
        last_sync_at: currentTimestamp(platform),
        last_sync_state: data.state,
        last_sync_error: data.error_code,
        failure_count: 0,
        next_attempt_at: null,
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /**
   * DS26 (`DocSyncService.recordLinkFailure`) — `UPDATE trip_document_links
   * SET last_sync_at=CURRENT_TIMESTAMP, last_sync_state=?, last_sync_error=?,
   * failure_count=?, next_attempt_at=datetime('now','+'||?||' seconds'),
   * updated_at=CURRENT_TIMESTAMP WHERE id=?`. `nextAttemptSeconds` (the
   * caller's own `backoffSeconds(...)` runtime value) is turned into the
   * `datetime('now', ...)` fragment HERE, through Task 0's `nowPlusSeconds`
   * helper — the service passes the plain second count, never a
   * pre-rendered fragment, keeping every dialect-function call inside the
   * repository layer.
   */
  async recordFailure(
    id: number,
    data: { state: string; error_code: string; failure_count: number; next_attempt_seconds: number },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        last_sync_at: currentTimestamp(platform),
        last_sync_state: data.state,
        last_sync_error: data.error_code,
        failure_count: data.failure_count,
        next_attempt_at: nowPlusSeconds(platform, data.next_attempt_seconds),
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /** DSCTRL3 (R2 — moved off the controller) — `UPDATE trip_document_links SET webhook_subscription_id = ? WHERE id = ?`, the webhook-registration follow-up. */
  async setWebhookSubscriptionId(id: number, subscriptionId: string): Promise<void> {
    await this.nativeUpdate({ id }, { webhook_subscription_id: subscriptionId });
  }
}
