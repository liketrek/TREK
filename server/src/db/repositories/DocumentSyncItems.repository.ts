import { currentTimestampKysely, nowPlusSecondsKysely } from '../dialect/kysely-functions';
import { coalesceOverride, currentTimestamp, foundAgainState, nowPlusSeconds } from '../dialect/sql-functions';
import type { DocumentSyncItems } from '../entities/DocumentSyncItems.entity';
import type { DB } from '../kysely/db';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';
import type { EntityData } from '@mikro-orm/core';

/** A bare `document_sync_items` row (every scalar column). */
export interface DocumentSyncItemRow {
  id: number;
  link_id: number;
  trip_id: number;
  file_id: number | null;
  trek_doc_uid: string;
  remote_id: string | null;
  remote_name: string | null;
  remote_version: string | null;
  remote_size: number | null;
  remote_modified_at: string | null;
  content_sha256: string | null;
  pushed_sha256: string | null;
  state: string;
  error_code: string | null;
  attempts: number;
  next_attempt_at: string | null;
  remote_missing_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  synced_at: string | null;
  remote_trashed_at: string | null;
}

const _itemRowKeys: AssertRowKeys<DocumentSyncItemRow, DocumentSyncItems> = true;

/** DS18's narrow projection (`loadItems`) — 14 named columns, not `*`. */
export interface SyncItemStateRow {
  id: number;
  file_id: number | null;
  trek_doc_uid: string;
  remote_id: string | null;
  remote_version: string | null;
  remote_name: string | null;
  remote_size: number | null;
  remote_modified_at: string | null;
  content_sha256: string | null;
  pushed_sha256: string | null;
  state: string;
  attempts: number;
  next_attempt_at: string | null;
  remote_missing_at: string | null;
  remote_trashed_at: string | null;
}

/** DS34's issues projection. */
export interface DocumentSyncIssueRow {
  id: number;
  state: string;
  error_code: string | null;
  remote_name: string | null;
  remote_missing_at: string | null;
  file_name: string | null;
}

/** DSCTRL4/DSCTRL5's items-listing projection (`i.*` plus `file_name`). */
export interface DocumentSyncItemWithFileRow extends DocumentSyncItemRow {
  file_name: string | null;
}

/** DS37's per-link holdings projection. */
export interface DocumentSyncHoldingsRow {
  link_id: number;
  paired: number;
  atProvider: number;
  missing: number;
}

type DocumentSyncItemsKyselyDB = Pick<DB, 'document_sync_items' | 'trip_files'>;

/**
 * DS24's insert table. It binds the legacy statement's own 16-column list:
 * `id`/`first_seen_at`/`last_seen_at` are autoincrement/`DEFAULT
 * CURRENT_TIMESTAMP` and `remote_missing_at`/`remote_trashed_at` are always
 * NULL on a brand-new row; the columns the statement leaves out (the rowid, defaulted and nullable ones) are `InsertOptional` in the generated type, so `.values()` may omit them.
 */
type DocumentSyncItemsWriteKyselyDB = Pick<DB, 'document_sync_items'>;

const ISSUE_STATES = ['conflict', 'rejected_type', 'too_large', 'remote_missing', 'error'] as const;

/**
 * `document_sync_items` — one pairing row per document a binding has ever
 * seen, either side. DS2-DS12 are eight distinct state-machine UPDATE
 * shapes on this table (`applyAction`'s eight cases) — kept as eight
 * methods, never collapsed into one generic "patch" method (the inventory's
 * own explicit callout).
 */
export class DocumentSyncItemsRepository extends TrekRepository<DocumentSyncItems> {
  // ── applyAction's eight state-machine UPDATEs (DS2-DS12) ──────────────────

  /** DS2 (`applyAction` 'relocate') — `UPDATE ... SET remote_id=?, remote_version=?, remote_size=COALESCE(?,remote_size), remote_modified_at=COALESCE(?,remote_modified_at), ${FOUND_AGAIN}, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async applyRelocate(
    id: number,
    data: { remote_id: string; remote_version: string; remote_size: number | null; remote_modified_at: string | null },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        remote_id: data.remote_id,
        remote_version: data.remote_version,
        remote_size: coalesceOverride(platform, data.remote_size, 'remote_size'),
        remote_modified_at: coalesceOverride(platform, data.remote_modified_at, 'remote_modified_at'),
        remote_missing_at: null,
        state: foundAgainState(platform, 'state', 'file_id'),
        last_seen_at: currentTimestamp(platform),
      },
    );
  }

  /** DS3 (`applyAction` 'rename_remote') — `UPDATE ... SET remote_name=?, remote_version=?, ${FOUND_AGAIN}, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async applyRenameRemote(id: number, data: { remote_name: string; remote_version: string }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        remote_name: data.remote_name,
        remote_version: data.remote_version,
        remote_missing_at: null,
        state: foundAgainState(platform, 'state', 'file_id'),
        last_seen_at: currentTimestamp(platform),
      },
    );
  }

  /** DS5 (`applyAction` 'rename_local', the `document_sync_items` half — DS4's `trip_files` write is TripFilesRepository's) — `UPDATE ... SET remote_name=?, ${FOUND_AGAIN}, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async applyRenameLocal(id: number, data: { remote_name: string }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        remote_name: data.remote_name,
        remote_missing_at: null,
        state: foundAgainState(platform, 'state', 'file_id'),
        last_seen_at: currentTimestamp(platform),
      },
    );
  }

  /** DS6 (`applyAction` 'conflict') — `UPDATE ... SET state='conflict', last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async markConflict(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { state: 'conflict', last_seen_at: currentTimestamp(platform) });
  }

  /** DS7 (`applyAction` 'mark_remote_missing') — `UPDATE ... SET state='remote_missing', remote_missing_at=CURRENT_TIMESTAMP, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async markRemoteMissing(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        state: 'remote_missing',
        remote_missing_at: currentTimestamp(platform),
        last_seen_at: currentTimestamp(platform),
      },
    );
  }

  /**
   * DS8 (`applyAction` 'local_deleted') — `UPDATE ... SET
   * state='local_deleted', remote_missing_at=CASE WHEN ?=1 THEN
   * remote_missing_at ELSE NULL END, remote_trashed_at=CASE WHEN ?=1 THEN
   * CURRENT_TIMESTAMP ELSE NULL END, last_seen_at=CURRENT_TIMESTAMP WHERE
   * id=?`. Both CASEs' WHEN conditions bind a flag already known in JS at
   * the call site (`remoteGone`/`binned`) — resolved here as a plain
   * ternary, not a SQL-level CASE: `remoteGone` true KEEPS the column
   * unchanged (omitted from the SET list) rather than "sets it to itself",
   * a behaviourally identical, simpler shape.
   */
  async markLocalDeleted(id: number, data: { remoteGone: boolean; binned: boolean }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    const set: EntityData<DocumentSyncItems> = {
      state: 'local_deleted',
      remote_trashed_at: data.binned ? currentTimestamp(platform) : null,
      last_seen_at: currentTimestamp(platform),
    };
    if (!data.remoteGone) set.remote_missing_at = null;
    await this.nativeUpdate({ id }, set);
  }

  /**
   * DS9 (`applyAction` 'local_restored') — `UPDATE ... SET state=?,
   * remote_missing_at=CASE WHEN ?=1 THEN CURRENT_TIMESTAMP ELSE NULL END,
   * remote_trashed_at=NULL, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`.
   * Same JS-ternary resolution as {@link markLocalDeleted}.
   */
  async markLocalRestored(id: number, data: { state: string; missing: boolean }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        state: data.state,
        remote_missing_at: data.missing ? currentTimestamp(platform) : null,
        remote_trashed_at: null,
        last_seen_at: currentTimestamp(platform),
      },
    );
  }

  /** DS10 (`applyAction` 'detach') — `UPDATE ... SET state='pending', remote_id=NULL, remote_version=NULL, remote_trashed_at=NULL, error_code=NULL, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async markDetached(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        state: 'pending',
        remote_id: null,
        remote_version: null,
        remote_trashed_at: null,
        error_code: null,
        last_seen_at: currentTimestamp(platform),
      },
    );
  }

  /** DS11 (`applyAction` 'remote_restored') — `UPDATE ... SET remote_trashed_at=NULL, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. */
  async markRemoteRestored(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { remote_trashed_at: null, last_seen_at: currentTimestamp(platform) });
  }

  /** DS12 (`applyAction` 'touch') — the most-used state-machine action: `UPDATE ... SET last_seen_at=CURRENT_TIMESTAMP, remote_version=COALESCE(?,remote_version), remote_name=COALESCE(?,remote_name), remote_id=COALESCE(?,remote_id), remote_size=COALESCE(?,remote_size), remote_modified_at=COALESCE(?,remote_modified_at), ${FOUND_AGAIN} WHERE id=?`. */
  async applyTouch(
    id: number,
    data: {
      remote_version: string | null;
      remote_name: string | null;
      remote_id: string | null;
      remote_size: number | null;
      remote_modified_at: string | null;
    },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      {
        last_seen_at: currentTimestamp(platform),
        remote_version: coalesceOverride(platform, data.remote_version, 'remote_version'),
        remote_name: coalesceOverride(platform, data.remote_name, 'remote_name'),
        remote_id: coalesceOverride(platform, data.remote_id, 'remote_id'),
        remote_size: coalesceOverride(platform, data.remote_size, 'remote_size'),
        remote_modified_at: coalesceOverride(platform, data.remote_modified_at, 'remote_modified_at'),
        remote_missing_at: null,
        state: foundAgainState(platform, 'state', 'file_id'),
      },
    );
  }

  // ── Reads ───────────────────────────────────────────────────────────────

  /** DS13 (`pull`'s pre-image read) — `SELECT file_id, remote_name, content_sha256 FROM document_sync_items WHERE id=?`. */
  async findPairing(
    id: number,
  ): Promise<{ file_id: number | null; remote_name: string | null; content_sha256: string | null } | undefined> {
    const row = await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items')
      .select(['file_id', 'remote_name', 'content_sha256'])
      .where('id', '=', id)
      .executeTakeFirst();
    return row
      ? {
          file_id: row.file_id ?? null,
          remote_name: row.remote_name ?? null,
          content_sha256: row.content_sha256 ?? null,
        }
      : undefined;
  }

  /**
   * DS18 (`loadItems`) — the 14-column projection `SELECT id,file_id,trek_doc_uid,remote_id,remote_version,remote_name,remote_size,remote_modified_at,content_sha256,pushed_sha256,state,attempts,next_attempt_at,remote_missing_at,remote_trashed_at FROM document_sync_items WHERE link_id=?`.
   * Kysely, not the QueryBuilder's `fields:` narrowing — this entity has
   * THREE `persist(false)` mirror columns (`link_id`, `file_id`, `trip_id`),
   * and a narrowed MikroORM `find`/`fields:` read silently drops one of
   * them (the program-wide "select shadows through the relation" trap,
   * `RoadtripDayBoundariesRepository`'s own docstring names it first) —
   * measured directly here: `file_id` came back `undefined` on a row that
   * had one, which fed the reconciler a false "new file", double-inserted
   * the pairing and threw the table's own `(link_id, file_id)` partial
   * unique index. Kysely's typed column list reads real DB columns
   * directly and has no such gap.
   */
  async findByLink(linkId: number): Promise<SyncItemStateRow[]> {
    const rows = await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items')
      .select([
        'id',
        'file_id',
        'trek_doc_uid',
        'remote_id',
        'remote_version',
        'remote_name',
        'remote_size',
        'remote_modified_at',
        'content_sha256',
        'pushed_sha256',
        'state',
        'attempts',
        'next_attempt_at',
        'remote_missing_at',
        'remote_trashed_at',
      ])
      .where('link_id', '=', linkId)
      .execute();
    return rows.map((r) => ({
      id: r.id,
      file_id: r.file_id ?? null,
      trek_doc_uid: r.trek_doc_uid,
      remote_id: r.remote_id ?? null,
      remote_version: r.remote_version ?? null,
      remote_name: r.remote_name ?? null,
      remote_size: r.remote_size ?? null,
      remote_modified_at: r.remote_modified_at ?? null,
      content_sha256: r.content_sha256 ?? null,
      pushed_sha256: r.pushed_sha256 ?? null,
      state: r.state,
      attempts: r.attempts,
      next_attempt_at: r.next_attempt_at ?? null,
      remote_missing_at: r.remote_missing_at ?? null,
      remote_trashed_at: r.remote_trashed_at ?? null,
    }));
  }

  /** DS20 (`pairingOwner`) — `SELECT id FROM document_sync_items WHERE link_id=? AND remote_id=?`. */
  async findPairingOwner(linkId: number, remoteId: string): Promise<number | undefined> {
    const row = await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items')
      .select('id')
      .where('link_id', '=', linkId)
      .where('remote_id', '=', remoteId)
      .executeTakeFirst();
    return row?.id;
  }

  /** DS21 (`existingUid`) — `SELECT trek_doc_uid FROM document_sync_items WHERE id=? AND link_id=?`. */
  async findTrekDocUid(id: number, linkId: number): Promise<string | undefined> {
    const row = await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items')
      .select('trek_doc_uid')
      .where('id', '=', id)
      .where('link_id', '=', linkId)
      .executeTakeFirst();
    return row?.trek_doc_uid;
  }

  /** DS22 (`upsertItem`'s read-before-write attempt counter) — `SELECT attempts FROM document_sync_items WHERE id=?`. */
  async getAttempts(id: number): Promise<number | undefined> {
    const row = await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items')
      .select('attempts')
      .where('id', '=', id)
      .executeTakeFirst();
    return row?.attempts;
  }

  // ── DS23/DS24 — R3's core ──────────────────────────────────────────────

  /**
   * DS23 (`upsertItem`, itemId≠null) — the plan's largest/most complex
   * statement (§11): `UPDATE document_sync_items SET state=?, error_code=?,
   * file_id=COALESCE(?,file_id), remote_id=COALESCE(?,remote_id),
   * remote_version=COALESCE(?,remote_version),
   * remote_name=COALESCE(?,remote_name), remote_size=COALESCE(?,remote_size),
   * remote_modified_at=COALESCE(?,remote_modified_at),
   * content_sha256=COALESCE(?,content_sha256),
   * pushed_sha256=COALESCE(?,pushed_sha256), attempts=?, next_attempt_at=CASE
   * WHEN ?=1 AND ?<? THEN datetime('now','+'||?||' seconds') ELSE NULL END,
   * remote_missing_at=NULL, synced_at=CASE WHEN ?='synced' THEN
   * CURRENT_TIMESTAMP ELSE synced_at END, last_seen_at=CURRENT_TIMESTAMP
   * WHERE id=?`.
   *
   * A PLAIN (non-upsert) typed update, no `onConflict` needed (R3) — ten
   * `COALESCE` columns via `coalesceOverride`, plus two CASEs that both
   * collapse to a JS decision the caller (`DocSyncService.upsertItem`) has
   * already made before calling this: the `?=1 AND ?<?` condition is
   * `failed && attempts < maxAttempts`, both known at the call site, so the
   * caller passes the plain second count (`next_attempt_after_seconds`) or
   * `null`, and this method turns it into the `datetime('now', ...)`
   * fragment itself, through Task 0's `nowPlusSeconds` helper — every
   * dialect-function call stays inside the repository layer, matching
   * {@link insertOrUpsertOnConflict}'s identical shape. `synced_at`'s "ELSE
   * synced_at" (leave the column untouched) is simply OMITTING the field
   * from this UPDATE's SET list when `state !== 'synced'` — a partial
   * `nativeUpdate` never touches a field it is not given.
   */
  async recordAttempt(
    id: number,
    patch: {
      state: string;
      error_code: string | null;
      file_id: number | null;
      remote_id: string | null;
      remote_version: string | null;
      remote_name: string | null;
      remote_size: number | null;
      remote_modified_at: string | null;
      content_sha256: string | null;
      pushed_sha256: string | null;
      attempts: number;
      /** Seconds to add to the DB clock, when `failed && attempts < maxAttempts` (the caller's own decision), else `null`. */
      next_attempt_after_seconds: number | null;
    },
  ): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    const set: EntityData<DocumentSyncItems> = {
      state: patch.state,
      error_code: patch.error_code,
      file_id: coalesceOverride(platform, patch.file_id, 'file_id'),
      remote_id: coalesceOverride(platform, patch.remote_id, 'remote_id'),
      remote_version: coalesceOverride(platform, patch.remote_version, 'remote_version'),
      remote_name: coalesceOverride(platform, patch.remote_name, 'remote_name'),
      remote_size: coalesceOverride(platform, patch.remote_size, 'remote_size'),
      remote_modified_at: coalesceOverride(platform, patch.remote_modified_at, 'remote_modified_at'),
      content_sha256: coalesceOverride(platform, patch.content_sha256, 'content_sha256'),
      pushed_sha256: coalesceOverride(platform, patch.pushed_sha256, 'pushed_sha256'),
      attempts: patch.attempts,
      next_attempt_at:
        patch.next_attempt_after_seconds !== null ? nowPlusSeconds(platform, patch.next_attempt_after_seconds) : null,
      remote_missing_at: null,
      last_seen_at: currentTimestamp(platform),
    };
    if (patch.state === 'synced') set.synced_at = currentTimestamp(platform);
    await this.nativeUpdate({ id }, set);
  }

  /**
   * DS24 (`upsertItem`, itemId=null) — R3's core: the PARTIAL UNIQUE INDEX
   * upsert. `INSERT INTO document_sync_items (16 cols) VALUES (...) ON
   * CONFLICT(link_id, remote_id) WHERE remote_id IS NOT NULL DO UPDATE SET
   * state=excluded.state, error_code=excluded.error_code,
   * file_id=COALESCE(excluded.file_id, document_sync_items.file_id),
   * remote_version=COALESCE(excluded.remote_version,
   * document_sync_items.remote_version),
   * content_sha256=COALESCE(excluded.content_sha256,
   * document_sync_items.content_sha256),
   * pushed_sha256=COALESCE(excluded.pushed_sha256,
   * document_sync_items.pushed_sha256), last_seen_at=CURRENT_TIMESTAMP`.
   *
   * MikroORM's `em.upsert` targets a table's DECLARED unique/PK constraints
   * and has no way to express a PARTIAL index's WHERE predicate as the
   * conflict target — SQLite itself refuses an `ON CONFLICT` that doesn't
   * restate a partial index's predicate exactly. Hand-typed Kysely
   * (`insertInto(...).onConflict(oc => oc.columns([...]).where(...)
   * .doUpdateSet({...}))`), never `em.upsert`. `next_attempt_at`/`synced_at`
   * are pre-resolved by the caller (see {@link recordAttempt}'s docstring —
   * the same JS-ternary resolution, since both CASEs' conditions are known
   * before this method is called).
   */
  async insertOrUpsertOnConflict(data: {
    link_id: number;
    trip_id: number;
    file_id: number | null;
    trek_doc_uid: string;
    remote_id: string | null;
    remote_name: string | null;
    remote_version: string | null;
    remote_size: number | null;
    remote_modified_at: string | null;
    content_sha256: string | null;
    pushed_sha256: string | null;
    state: string;
    error_code: string | null;
    attempts: number;
    /** Seconds to add to the DB clock for `next_attempt_at` (mirrors `?=1` — a new row is always at its first failure, DS24's own comment), or `null` to leave it NULL. */
    next_attempt_after_seconds: number | null;
    /** Whether this insert's `state` is `'synced'` (sets `synced_at = CURRENT_TIMESTAMP`) — resolved by the caller, matching {@link recordAttempt}'s same JS-ternary shape. */
    synced_now: boolean;
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.kysely<DocumentSyncItemsWriteKyselyDB>()
      .insertInto('document_sync_items')
      .values((eb) => ({
        link_id: data.link_id,
        trip_id: data.trip_id,
        file_id: data.file_id,
        trek_doc_uid: data.trek_doc_uid,
        remote_id: data.remote_id,
        remote_name: data.remote_name,
        remote_version: data.remote_version,
        remote_size: data.remote_size,
        remote_modified_at: data.remote_modified_at,
        content_sha256: data.content_sha256,
        pushed_sha256: data.pushed_sha256,
        state: data.state,
        error_code: data.error_code,
        attempts: data.attempts,
        next_attempt_at:
          data.next_attempt_after_seconds !== null
            ? nowPlusSecondsKysely(platform, eb, data.next_attempt_after_seconds)
            : null,
        synced_at: data.synced_now ? currentTimestampKysely(platform) : null,
        last_seen_at: currentTimestampKysely(platform),
      }))
      .onConflict((oc) =>
        oc
          .columns(['link_id', 'remote_id'])
          .where('remote_id', 'is not', null)
          .doUpdateSet({
            state: (eb) => eb.ref('excluded.state'),
            error_code: (eb) => eb.ref('excluded.error_code'),
            file_id: (eb) => eb.fn.coalesce(eb.ref('excluded.file_id'), eb.ref('document_sync_items.file_id')),
            remote_version: (eb) =>
              eb.fn.coalesce(eb.ref('excluded.remote_version'), eb.ref('document_sync_items.remote_version')),
            content_sha256: (eb) =>
              eb.fn.coalesce(eb.ref('excluded.content_sha256'), eb.ref('document_sync_items.content_sha256')),
            pushed_sha256: (eb) =>
              eb.fn.coalesce(eb.ref('excluded.pushed_sha256'), eb.ref('document_sync_items.pushed_sha256')),
            last_seen_at: () => currentTimestampKysely(platform),
          }),
      )
      .execute();
  }

  // ── Rename / conflict resolution (DS27-DS33 minus the trip_files halves) ──

  /** DS27 (`renameRemoteTo`) — `UPDATE ... SET remote_name=?, remote_version=?, last_seen_at=CURRENT_TIMESTAMP WHERE id=?`. No `FOUND_AGAIN` — a distinct, simpler shape from DS3 (both rename the same two columns, but only DS3's caller is inside the reconciler's state machine). */
  async setRemoteName(id: number, data: { remote_name: string; remote_version: string }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate(
      { id },
      { remote_name: data.remote_name, remote_version: data.remote_version, last_seen_at: currentTimestamp(platform) },
    );
  }

  /** DS28 (`resolveConflict`'s pre-image read) — `SELECT * FROM document_sync_items WHERE id=?`. */
  async findRaw(id: number): Promise<DocumentSyncItemRow | undefined> {
    const row = await this.findOne({ id });
    return row ? toRow(row) : undefined;
  }

  /** DS30 (`resolveConflict`, keep='trek') — `UPDATE ... SET state='pending', remote_version=NULL, error_code=NULL WHERE id=?`. */
  async resolveKeepTrek(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { state: 'pending', remote_version: null, error_code: null });
  }

  /** DS31 (`resolveConflict`, keep='provider') — `UPDATE ... SET state='pending', content_sha256=NULL, error_code=NULL WHERE id=?`. */
  async resolveKeepProvider(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { state: 'pending', content_sha256: null, error_code: null });
  }

  /** DS33 (`resolveConflict`, keep='both') — `UPDATE ... SET state='local_deleted', remote_id=NULL, error_code=NULL WHERE id=?`. */
  async resolveKeepBoth(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { state: 'local_deleted', remote_id: null, error_code: null });
  }

  // ── retryShelvedItems / delete / issues / status ───────────────────────

  /** DS17 (`retryShelvedItems`) — `UPDATE document_sync_items SET attempts=0, next_attempt_at=NULL WHERE link_id=? AND state='error'`. Manual "sync now" only, never the scheduler. */
  async resetShelvedForLink(linkId: number): Promise<void> {
    await this.nativeUpdate({ link_id: linkId, state: 'error' }, { attempts: 0, next_attempt_at: null });
  }

  /** DSC18 (`deleteLink`, inside `uow.transactional`) — `DELETE FROM document_sync_items WHERE link_id=?`. */
  async deleteByLink(linkId: number): Promise<void> {
    await this.nativeDelete({ link_id: linkId });
  }

  /** DS34 (`issues`) — `SELECT i.id,i.state,i.error_code,i.remote_name,i.remote_missing_at,f.original_name AS file_name FROM document_sync_items i LEFT JOIN trip_files f ON f.id=i.file_id WHERE i.trip_id=? AND i.state IN (...) ORDER BY i.id DESC LIMIT 200`. */
  async listIssues(tripId: number): Promise<DocumentSyncIssueRow[]> {
    return await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items as i')
      .leftJoin('trip_files as f', 'f.id', 'i.file_id')
      .select([
        'i.id',
        'i.state',
        'i.error_code',
        'i.remote_name',
        'i.remote_missing_at',
        'f.original_name as file_name',
      ])
      .where('i.trip_id', '=', tripId)
      .where('i.state', 'in', [...ISSUE_STATES])
      .orderBy('i.id', 'desc')
      .limit(200)
      .execute();
  }

  /** DS35 (`status`) — `SELECT state, COUNT(*) AS n FROM document_sync_items WHERE trip_id=? GROUP BY state`. */
  async countByState(tripId: number): Promise<Array<{ state: string; n: number }>> {
    return await this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items')
      .select(['state', (eb) => eb.fn.countAll<number>().as('n')])
      .where('trip_id', '=', tripId)
      .groupBy('state')
      .execute();
  }

  /**
   * DS37 (`status`'s per-link holdings) — `SELECT link_id, SUM(CASE WHEN
   * file_id IS NOT NULL AND remote_id IS NOT NULL AND state='synced' THEN 1
   * ELSE 0 END) AS paired, SUM(CASE WHEN remote_id IS NOT NULL AND
   * state!='remote_missing' AND remote_trashed_at IS NULL AND
   * (state!='local_deleted' OR remote_missing_at IS NULL) THEN 1 ELSE 0 END)
   * AS atProvider, SUM(CASE WHEN state='remote_missing' THEN 1 ELSE 0 END)
   * AS missing FROM document_sync_items WHERE trip_id=? GROUP BY link_id`.
   */
  async perLinkHoldings(tripId: number): Promise<DocumentSyncHoldingsRow[]> {
    const db = this.kysely<DocumentSyncItemsKyselyDB>();
    return await db
      .selectFrom('document_sync_items')
      .select((eb) => [
        'link_id',
        eb.fn
          .sum<number>(
            eb
              .case()
              .when(
                eb.and([eb('file_id', 'is not', null), eb('remote_id', 'is not', null), eb('state', '=', 'synced')]),
              )
              .then(1)
              .else(0)
              .end(),
          )
          .as('paired'),
        eb.fn
          .sum<number>(
            eb
              .case()
              .when(
                eb.and([
                  eb('remote_id', 'is not', null),
                  eb('state', '!=', 'remote_missing'),
                  eb('remote_trashed_at', 'is', null),
                  eb.or([eb('state', '!=', 'local_deleted'), eb('remote_missing_at', 'is', null)]),
                ]),
              )
              .then(1)
              .else(0)
              .end(),
          )
          .as('atProvider'),
        eb.fn
          .sum<number>(
            eb
              .case()
              .when(eb('state', '=', 'remote_missing'))
              .then(1)
              .else(0)
              .end(),
          )
          .as('missing'),
      ])
      .where('trip_id', '=', tripId)
      .groupBy('link_id')
      .execute();
  }

  // ── R2 — controller-SQL relocation (DSCTRL4/DSCTRL5) ───────────────────

  /**
   * DSCTRL4 (`DocSyncController.items`, state-filtered) — `SELECT i.*,
   * f.original_name AS file_name FROM document_sync_items i LEFT JOIN
   * trip_files f ON f.id=i.file_id WHERE i.trip_id=? AND i.state=? ORDER BY
   * i.id DESC LIMIT 500`. A distinct `LIMIT 500` / fixed-vs-single-state
   * shape from {@link listIssues}'s `LIMIT 200` fixed-state-list — kept its
   * own method (R2's own instruction: three near-duplicate listing queries
   * stay three methods, the WHERE/LIMIT shapes are not identical).
   */
  async listForTripByState(tripId: number, state: string): Promise<DocumentSyncItemWithFileRow[]> {
    return await this.itemsWithFileQuery()
      .where('i.trip_id', '=', tripId)
      .where('i.state', '=', state)
      .orderBy('i.id', 'desc')
      .limit(500)
      .execute();
  }

  /** DSCTRL5 (`DocSyncController.items`, unfiltered) — same as {@link listForTripByState} minus the state predicate. */
  async listForTrip(tripId: number): Promise<DocumentSyncItemWithFileRow[]> {
    return await this.itemsWithFileQuery().where('i.trip_id', '=', tripId).orderBy('i.id', 'desc').limit(500).execute();
  }

  private itemsWithFileQuery() {
    return this.kysely<DocumentSyncItemsKyselyDB>()
      .selectFrom('document_sync_items as i')
      .leftJoin('trip_files as f', 'f.id', 'i.file_id')
      .selectAll('i')
      .select(['f.original_name as file_name']);
  }
}

function toRow(entity: DocumentSyncItems): DocumentSyncItemRow {
  return {
    id: entity.id,
    link_id: entity.link_id,
    trip_id: entity.trip_id,
    file_id: entity.file_id ?? null,
    trek_doc_uid: entity.trek_doc_uid,
    remote_id: entity.remote_id ?? null,
    remote_name: entity.remote_name ?? null,
    remote_version: entity.remote_version ?? null,
    remote_size: entity.remote_size ?? null,
    remote_modified_at: entity.remote_modified_at ?? null,
    content_sha256: entity.content_sha256 ?? null,
    pushed_sha256: entity.pushed_sha256 ?? null,
    state: entity.state,
    error_code: entity.error_code ?? null,
    attempts: entity.attempts,
    next_attempt_at: entity.next_attempt_at ?? null,
    remote_missing_at: entity.remote_missing_at ?? null,
    first_seen_at: entity.first_seen_at,
    last_seen_at: entity.last_seen_at,
    synced_at: entity.synced_at ?? null,
    remote_trashed_at: entity.remote_trashed_at ?? null,
  };
}
