import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { Readable } from 'node:stream';
import type { DocsyncErrorCode } from '@trek/shared';
import { AddonsService } from '../addons/addons.service';
import { ADDON_IDS } from '../../addons';
import { StorageService } from '../storage/storage.service';
import { UnitOfWork } from '../database/unit-of-work';
import { FilesService } from '../files/files.service';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { RealtimeService } from '../realtime/realtime.service';
import { MAX_FILE_SIZE, isVideoExtension } from '../files/files.constants';
import { TripDocumentLinks } from '../../db/entities/TripDocumentLinks.entity';
import type { TripDocumentLinksRepository } from '../../db/repositories/TripDocumentLinks.repository';
import { DocumentSyncItems } from '../../db/entities/DocumentSyncItems.entity';
import type { DocumentSyncIssueRow, DocumentSyncItemsRepository } from '../../db/repositories/DocumentSyncItems.repository';
import { TripFiles } from '../../db/entities/TripFiles.entity';
import type { TripFilesRepository } from '../../db/repositories/TripFiles.repository';
import { FileLinks } from '../../db/entities/FileLinks.entity';
import type { FileLinksRepository } from '../../db/repositories/FileLinks.repository';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { DocumentProviderRegistry } from './document-provider.registry';
import { DocSyncConfigService, type ConnectionRow, type LinkRow } from './doc-sync-config.service';
import type { DocumentProvider, RemoteDocument } from './document-provider';
import { docFailed } from './document-provider';
import {
  ITEM_BACKOFF_SECONDS,
  ITEM_MAX_ATTEMPTS,
  LINK_BACKOFF_SECONDS,
  LINK_CIRCUIT_OPEN_AFTER,
  MAX_TRANSFERS_PER_RUN,
  SETTING_SYNC_ENABLED,
} from './doc-sync.constants';
import {
  backoffSeconds,
  isAllowedByOperator,
  isBlockedName,
  needsFullListing,
  newTrekDocUid,
  planReconcile,
  sanitizeIncomingName,
  type LocalDocument,
  type PlanAction,
  type SyncItemState,
} from './doc-sync.helpers';

/**
 * The reconciler: it executes what `planReconcile` decided, and does nothing
 * else of consequence.
 *
 * It enumerates both sides in full on every run rather than asking for a delta.
 * That looks wasteful and is deliberate. A changed-since query cannot see a
 * deletion at all; Papra does not bump `updatedAt` when a tag changes (measured,
 * not assumed); Paperless's bulk edit changes documents without touching
 * `modified`; and Synology FileStation has no change feed whatsoever. A webhook
 * is therefore only ever "look now", never a source of truth: the same
 * conclusion AirTrail and Dawarich reached for their own providers, written
 * down in dawarich-sync.service.ts.
 *
 * Two safety rules outrank everything else here:
 *   1. A document that disappears upstream is RECORDED as missing. It is never
 *      deleted locally as a side effect. An unmounted share answers with an
 *      empty listing, and a trip is not a cache.
 *   2. TREK's own writes must not come back as foreign changes. That is what
 *      `pushed_sha256` is for, and why the comparison is over content rather
 *      than over timestamps.
 *
 * Plan 3h Task 5: every `this.db.connection.prepare(...)` call converted onto
 * `TripDocumentLinksRepository`/`DocumentSyncItemsRepository` (own tables) and
 * additive methods on `TripFilesRepository`/`FileLinksRepository` (3e,
 * cross-domain — DS4/DS15/DS16/DS19/DS29/DS32/DS36). `FOUND_AGAIN`'s CASE
 * expression is now `foundAgainState` (`src/db/dialect/sql-functions.ts`),
 * built once and consumed by the repository methods behind DS2/DS3/DS5/DS12.
 */
@Injectable()
export class DocSyncService {
  private readonly logger = new Logger(DocSyncService.name);
  /** Container singleton, so one in-flight run per link across callers. */
  private readonly running = new Set<number>();

  constructor(
    @InjectRepository(TripDocumentLinks) private readonly linksRepo: TripDocumentLinksRepository,
    @InjectRepository(DocumentSyncItems) private readonly items: DocumentSyncItemsRepository,
    @InjectRepository(TripFiles) private readonly tripFiles: TripFilesRepository,
    @InjectRepository(FileLinks) private readonly fileLinks: FileLinksRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly config: DocSyncConfigService,
    private readonly registry: DocumentProviderRegistry,
    private readonly storage: StorageService,
    private readonly files: FilesService,
    private readonly allowedTypes: AllowedFileTypesService,
    private readonly realtime: RealtimeService,
    private readonly addons: AddonsService,
    private readonly uow: UnitOfWork,
  ) {}

  // ── Entry points ───────────────────────────────────────────────────────────

  /**
   * Links the scheduler should look at now, longest-waiting first.
   *
   * The second sort key is what makes the limit fair. A successful run clears
   * `next_attempt_at`, so on a healthy instance every binding sorts equal on the
   * first key and SQLite falls back to insertion order, which means the twenty
   * oldest bindings were picked on every tick and everything created after them
   * was never synced automatically at all. Found on a dev database with 170
   * bindings, where a freshly created one was still untouched minutes later
   * while the first twenty ran again and again.
   *
   * A binding whose provider an admin switched off is left out here rather
   * than stood down per run. It never runs, so it never gets a `last_sync_at`,
   * and twenty of them would sort first on every tick and take every slot.
   *
   * DS1's 3-key ORDER BY (`next_attempt_at`, then `last_sync_at`, then `id`)
   * is production-proven — preserved byte-exact in
   * `TripDocumentLinksRepository.dueLinks`. The provider-enabled subquery is
   * resolved here first (`config.enabledProviderIds`), then handed to the
   * repository as a plain id list — see that method's own docstring for why.
   */
  async dueLinks(limit = 20): Promise<LinkRow[]> {
    const enabledProviderIds = await this.config.enabledProviderIds();
    return this.linksRepo.dueLinks(LINK_CIRCUIT_OPEN_AFTER, enabledProviderIds, limit);
  }

  /**
   * Whether an admin has closed the door on this binding: the Documents addon
   * is off, or the provider it runs against is.
   *
   * A kill switch, not a failure. Nothing about the binding is written while it
   * is off, not its state and not its documents' attempt counters, so it
   * resumes exactly where it stopped once the switch is back on. Public because
   * a manual run has to refuse before it un-shelves anything.
   */
  async isSwitchedOff(link: Pick<LinkRow, 'provider_id'>): Promise<boolean> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.DOCUMENTS))) return true;
    return !(await this.config.enabledProviderIds()).includes(link.provider_id);
  }

  /**
   * DSWH1 (R2 — moved off `DocSyncWebhookController`) — the instance-wide
   * kill switch (`SELECT value FROM app_settings WHERE key = ?`,
   * `SETTING_SYNC_ENABLED`), the same switch the job's own tick obeys.
   * Unrecognised values mean ON: the setting is absent by default, and only
   * an explicit `'false'` stops the sync.
   */
  async isSyncEnabled(): Promise<boolean> {
    const value = await this.appSettings.getValue(SETTING_SYNC_ENABLED);
    return value !== 'false';
  }

  /**
   * Run one link.
   *
   * Never throws for provider trouble: a failing link records its state, backs
   * off and lets the next link run. One unreachable NAS must not stop the
   * Paperless binding on another trip.
   */
  async syncLink(link: LinkRow, opts: { full?: boolean } = {}): Promise<{
    state: string;
    pulled: number;
    pushed: number;
    conflicts: number;
    missing: number;
    errorCode?: DocsyncErrorCode;
  }> {
    if (this.running.has(link.id)) {
      return { state: 'busy', pulled: 0, pushed: 0, conflicts: 0, missing: 0 };
    }
    this.running.add(link.id);
    try {
      return await this.runLink(link, opts);
    } catch (err) {
      this.logger.error(`link ${link.id} failed: ${err instanceof Error ? err.message : String(err)}`);
      await this.recordLinkFailure(link, 'unknown');
      return { state: 'failed', pulled: 0, pushed: 0, conflicts: 0, missing: 0, errorCode: 'unknown' };
    } finally {
      this.running.delete(link.id);
    }
  }

  private async runLink(link: LinkRow, opts: { full?: boolean }): Promise<{
    state: string; pulled: number; pushed: number; conflicts: number; missing: number; errorCode?: DocsyncErrorCode;
  }> {
    // First, before anything that records a failure: a binding whose provider
    // is switched off must come back as it was left. The webhook and a first
    // run after binding reach this without asking beforehand.
    if ((await this.isSwitchedOff(link))) {
      return { state: 'disabled', pulled: 0, pushed: 0, conflicts: 0, missing: 0 };
    }
    // An orphaned binding runs for nobody. Its credential belongs to somebody
    // who has left the trip, and a webhook or a resolved conflict reach this
    // without asking beforehand.
    if (await this.config.isOrphaned(link)) {
      return { state: 'orphaned', pulled: 0, pushed: 0, conflicts: 0, missing: 0 };
    }
    const conn = await this.config.getConnection(link.connection_id);
    if (!conn) {
      await this.recordLinkFailure(link, 'not_found');
      return { state: 'failed', pulled: 0, pushed: 0, conflicts: 0, missing: 0, errorCode: 'not_found' };
    }
    const provider = this.registry.get(link.provider_id);
    if (!provider) {
      await this.recordLinkFailure(link, 'provider_error');
      return { state: 'failed', pulled: 0, pushed: 0, conflicts: 0, missing: 0, errorCode: 'provider_error' };
    }

    const ref = this.config.toRef(conn);
    const scope = this.config.toScopeRef(link);

    // A binding whose folder or tag is gone needs a human, not a retry: the
    // alternative is re-creating someone's deleted folder and filling it again.
    const resolved = await provider.resolveScope(ref, scope);
    if (docFailed(resolved)) {
      const code = resolved.error.code === 'not_found' || resolved.error.code === 'scope_missing' ? 'scope_missing' : resolved.error.code;
      await this.recordLinkFailure(link, code, code === 'scope_missing' ? 'scope_lost' : undefined);
      return { state: code === 'scope_missing' ? 'scope_lost' : 'failed', pulled: 0, pushed: 0, conflicts: 0, missing: 0, errorCode: code };
    }

    // Read before the listing because they decide how much of it is needed: a
    // file restored in TREK waits for a listing that shows its copy.
    const items = await this.loadItems(link.id);
    const local = await this.loadLocalDocuments(link);
    if (opts.full || needsFullListing(items, local)) scope.cursor = null;

    const listing = await provider.list(ref, scope);
    if (docFailed(listing)) {
      const state = listing.error.code === 'unauthorized' ? 'needs_reauth' : 'failed';
      await this.recordLinkFailure(link, listing.error.code, state);
      return { state, pulled: 0, pushed: 0, conflicts: 0, missing: 0, errorCode: listing.error.code };
    }

    const plan = planReconcile({
      items,
      remote: listing.data.documents,
      local,
      direction: link.direction as 'both' | 'pull' | 'push',
      remoteTruncated: listing.data.truncated,
      remoteUnchanged: listing.data.cursorUnchanged === true,
      stableRemoteIds: provider.capabilities(ref).stableId,
      maxAttempts: ITEM_MAX_ATTEMPTS,
      conflictPolicy: link.conflict_policy as 'manual' | 'trek_wins' | 'provider_wins',
    });

    if (plan.massDeleteGuardTripped) {
      // Refusing the whole run is the point: the listing is not trustworthy, so
      // nothing in it should be acted on, not even the parts that look fine.
      this.logger.warn(`link ${link.id}: mass-delete guard tripped (${plan.missingCount} of ${items.length} gone), run abandoned`);
      await this.recordLinkFailure(link, 'mass_delete_guard', 'partial');
      return { state: 'partial', pulled: 0, pushed: 0, conflicts: 0, missing: plan.missingCount, errorCode: 'mass_delete_guard' };
    }

    let pulled = 0;
    let pushed = 0;
    let conflicts = 0;
    let transfers = 0;
    let budgetExhausted = false;
    let wroteUpstream = false;
    let softFailure: DocsyncErrorCode | undefined;

    for (const action of plan.actions) {
      if (transfers >= MAX_TRANSFERS_PER_RUN && isTransfer(action)) {
        // Leaving the rest for the next run keeps one enormous trip from
        // starving every other binding on the instance. Reported as `partial`
        // rather than `ok`: the binding is not in step yet, and a status line
        // claiming it is would be a lie a user acts on.
        budgetExhausted = true;
        break;
      }
      if (changesProvider(action, link)) wroteUpstream = true;
      const outcome = await this.applyAction(action, { provider, ref, scope, link, conn });
      if (outcome === 'pulled') { pulled += 1; transfers += 1; }
      else if (outcome === 'pushed') { pushed += 1; transfers += 1; }
      else if (outcome === 'conflict') conflicts += 1;
      else if (outcome && outcome !== 'ok') softFailure = outcome;
    }

    const state = softFailure || budgetExhausted ? 'partial' : 'ok';
    /**
     * The cursor belongs to the listing this run started from, so it is only
     * handed on while that listing still describes both sides.
     *
     * Paperless, Papra and Synology build theirs from what they list. A copy
     * TREK uploaded and somebody deleted before the next run left the scope
     * exactly as this listing had it, so the cursor came back unchanged and
     * nothing flagged the copy or asked the mass-delete guard until something
     * else moved in the scope. A copy TREK binned and somebody restored read
     * the same way. A run that stopped short, at the transfer budget or on a
     * failed download, left part of the listing undone, and under an unchanged
     * cursor the planner never looks at the remote half again. Without one, the
     * next run compares both sides in full and hands a cursor on if it ends
     * clean.
     */
    const cursor = state === 'ok' && !wroteUpstream ? listing.data.cursor : null;
    await this.recordLinkSuccess(link, cursor, state, softFailure ?? null);
    if (pulled > 0 || pushed > 0) {
      this.realtime.broadcast(link.trip_id, 'docsync:changed', { linkId: link.id, pulled, pushed });
    }
    return { state, pulled, pushed, conflicts, missing: plan.missingCount, errorCode: softFailure };
  }

  // ── Action execution ───────────────────────────────────────────────────────

  private async applyAction(
    action: PlanAction,
    ctx: { provider: DocumentProvider; ref: ReturnType<DocSyncConfigService['toRef']>; scope: ReturnType<DocSyncConfigService['toScopeRef']>; link: LinkRow; conn: ConnectionRow },
  ): Promise<'ok' | 'pulled' | 'pushed' | 'conflict' | DocsyncErrorCode> {
    switch (action.kind) {
      case 'pull':
      case 'pull_update':
        return this.pull(action.remote, action.kind === 'pull_update' ? action.itemId : null, ctx);
      case 'push':
      case 'push_update':
        return this.push(action.local, 'itemId' in action ? action.itemId : null, 'remoteId' in action ? action.remoteId : null, ctx);
      case 'relocate': {
        // The id and the version only. `remote_name` is the rename arbiter and
        // keeps the agreed name; the rename, if there was one, is the planner's
        // next action for this row. That may be a rename rather than a `touch`,
        // so a copy on record as missing is lifted here already.
        await this.items.applyRelocate(action.itemId, {
          remote_id: action.remote.remoteId,
          remote_version: action.remote.remoteVersion,
          remote_size: action.remote.size,
          remote_modified_at: action.remote.remoteModifiedAt,
        });
        return 'ok';
      }
      case 'rename_remote': {
        const res = await ctx.provider.rename(ctx.ref, ctx.scope, action.remoteId, action.name);
        if (docFailed(res)) return res.error.code;
        await this.items.applyRenameRemote(action.itemId, { remote_name: action.name, remote_version: res.data.remoteVersion });
        return 'ok';
      }
      case 'rename_local': {
        await this.tripFiles.renameOriginalName(action.fileId, action.name);
        this.realtime.broadcast(ctx.link.trip_id, 'file:updated', {
          file: await this.files.getFileById(action.fileId, ctx.link.trip_id),
        });
        await this.items.applyRenameLocal(action.itemId, { remote_name: action.name });
        return 'ok';
      }
      case 'conflict': {
        await this.items.markConflict(action.itemId);
        return 'conflict';
      }
      case 'mark_remote_missing': {
        // Recorded, not executed. A human decides whether the local copy goes.
        await this.items.markRemoteMissing(action.itemId);
        return 'ok';
      }
      case 'local_deleted': {
        // A copy already gone upstream cannot be binned, and asking would only
        // fail the run for a document that no longer exists anywhere.
        const remoteGone = action.remoteGone === true;
        const binned = ctx.link.delete_policy === 'trash' && !remoteGone;
        if (binned) {
          const res = await ctx.provider.trash(ctx.ref, ctx.scope, action.remoteId);
          if (docFailed(res)) return res.error.code;
        }
        // The policy is applied here and never again: the planner leaves a
        // `local_deleted` row alone, so a policy changed later cannot reach
        // back. Whether TREK binned the copy is written down with it, because a
        // restore in TREK later has to know whether the gap upstream is TREK's.
        // A copy on record as gone stays on record: the holdings count reads
        // the mark, and the copy is no more at the store than it was before.
        await this.items.markLocalDeleted(action.itemId, { remoteGone, binned });
        return 'ok';
      }
      case 'local_restored': {
        // A copy found gone is flagged the way `mark_remote_missing` flags one,
        // and recovers the same way: a later `touch` lifts it once it is back.
        const missing = action.missing === true;
        await this.items.markLocalRestored(action.itemId, { state: missing ? 'remote_missing' : 'synced', missing });
        return 'ok';
      }
      case 'detach': {
        // The trek_doc_uid stays: it is the same document to TREK, only the
        // provider copy is new. The push the planner queued after this fills
        // the pairing in again, and if that push fails the row is an ordinary
        // unpaired file that the next run retries.
        await this.items.markDetached(action.itemId);
        return 'ok';
      }
      case 'remote_restored': {
        await this.items.markRemoteRestored(action.itemId);
        return 'ok';
      }
      case 'touch': {
        // `error` is NOT cleared here (see FOUND_AGAIN). Only a `remote_missing`
        // row, whose file is present and whose provider copy came back,
        // recovers this way.
        //
        // Size and modification time are kept current as well: where the id is
        // the path, they are how the planner recognises this copy once it has
        // been renamed or moved.
        await this.items.applyTouch(action.itemId, {
          remote_version: action.remote?.remoteVersion ?? null,
          remote_name: action.remote?.name ?? null,
          remote_id: action.remote?.remoteId ?? null,
          remote_size: action.remote?.size ?? null,
          remote_modified_at: action.remote?.remoteModifiedAt ?? null,
        });
        return 'ok';
      }
      default:
        return 'ok';
    }
  }

  /** Download a remote document into TREK as an ordinary trip file. */
  private async pull(
    remote: RemoteDocument,
    itemId: number | null,
    ctx: { provider: DocumentProvider; ref: ReturnType<DocSyncConfigService['toRef']>; scope: ReturnType<DocSyncConfigService['toScopeRef']>; link: LinkRow },
  ): Promise<'pulled' | 'ok' | DocsyncErrorCode> {
    const name = sanitizeIncomingName(remote.name);

    // The same defences an upload goes through. A provider folder routinely
    // holds .svg and .html, and TREK serves downloads inline with a
    // Content-Type derived from the extension: letting those through would be
    // stored XSS. Rejected documents become a visible row, never a silent skip.
    // Video is admitted the way the upload admits it, whatever the operator's
    // list says: a clip the file manager takes must not come back as refused
    // when it arrives through the store instead.
    const allowed = isVideoExtension(path.extname(name)) || isAllowedByOperator(name, await this.allowedTypes.get());
    if (isBlockedName(name) || !allowed) {
      await this.upsertItem(ctx.link, { itemId, remote, state: 'rejected_type', errorCode: 'unsupported_type' });
      return 'unsupported_type';
    }
    if (remote.size !== null && remote.size > MAX_FILE_SIZE) {
      await this.upsertItem(ctx.link, { itemId, remote, state: 'too_large', errorCode: 'too_large' });
      return 'too_large';
    }

    const fetched = await ctx.provider.fetch(ctx.ref, ctx.scope, remote.remoteId);
    if (docFailed(fetched)) {
      await this.upsertItem(ctx.link, { itemId, remote, state: 'error', errorCode: fetched.error.code });
      return fetched.error.code;
    }

    // Spool to disk first and hash while writing: the size a provider claims in
    // a listing is not a promise, and the hash is needed for the echo guard
    // regardless. Committing to storage only after the bytes are complete keeps
    // a half-written object from ever becoming a trip_files row.
    const ext = path.extname(name);
    const storageKey = `${crypto.randomUUID()}${ext}`;
    const spoolDir = this.storage.spoolDirFor('files');
    const tmpPath = path.join(spoolDir, `${storageKey}.part`);
    const hash = crypto.createHash('sha256');
    let bytes = 0;

    try {
      const counting = new Transform({
        transform(chunk: Buffer, _enc: BufferEncoding, cb: (e?: Error | null, d?: Buffer) => void) {
          bytes += chunk.length;
          hash.update(chunk);
          if (bytes > MAX_FILE_SIZE) { cb(new Error('too_large')); return; }
          cb(null, chunk);
        },
      });
      await pipeline(fetched.data.body, counting, fs.createWriteStream(tmpPath));
    } catch (err) {
      await fs.promises.rm(tmpPath, { force: true });
      const code: DocsyncErrorCode = err instanceof Error && err.message === 'too_large' ? 'too_large' : 'provider_error';
      await this.upsertItem(ctx.link, { itemId, remote, state: code === 'too_large' ? 'too_large' : 'error', errorCode: code });
      return code;
    }

    const sha256 = hash.digest('hex');

    // What this row pointed at before, if anything: a pull_update replaces a
    // document TREK already holds, and `createFile` only ever inserts.
    const pairing = itemId === null ? undefined : await this.items.findPairing(itemId);
    const supersededId = pairing?.file_id ?? null;
    const superseded = supersededId === null ? undefined : await this.files.getFileById(supersededId, ctx.link.trip_id);

    // The bytes TREK already holds, under a version marker that moved on
    // metadata: Paperless bumps it for a tag or a correspondent as much as for
    // a new revision, and not every listing carries a hash the planner could
    // have read this off. Nothing to replace, so the file stays, and with it
    // the booking it hangs on. The agreed name stays too: a rename that came
    // with the edit is the planner's business next run, and moving the arbiter
    // here would read it as TREK's own and send the old name back up.
    if (superseded && !superseded.deleted_at && pairing?.content_sha256 === sha256) {
      await fs.promises.rm(tmpPath, { force: true });
      await this.upsertItem(ctx.link, {
        itemId,
        remote,
        state: 'synced',
        remoteNameOverride: pairing.remote_name ?? undefined,
        errorCode: null,
      });
      return 'ok';
    }

    try {
      await this.storage.put('files', storageKey, { tmpPath });
    } catch {
      await fs.promises.rm(tmpPath, { force: true });
      await this.upsertItem(ctx.link, { itemId, remote, state: 'error', errorCode: 'provider_error' });
      return 'provider_error';
    }

    /**
     * The file row, the retirement of the copy it replaces and the pairing are
     * one fact, so they are one transaction. Written separately, a crash
     * between them leaves a trip file with no sync item, which the next run
     * reads as a document TREK gained and pushes straight back up, turning one
     * upstream edit into two documents on both sides.
     *
     * The superseded copy goes to the trash rather than out of existence: the
     * bytes it holds are a version somebody may still want, and TREK's own
     * delete works the same way. What it was attached to goes to the new row:
     * a new revision is the same document to the trip, and without this every
     * edit in the store quietly took the attachment off its booking.
     */
    const { created, retired } = await this.uow.transactional(async () => {
      const file = await this.files.createFile(
        ctx.link.trip_id,
        { filename: storageKey, originalname: name, size: bytes, mimetype: remote.mimeType || 'application/octet-stream' },
        // Attributed to the person whose connection brought it in, which is the
        // only honest answer: nobody in TREK uploaded it.
        (await this.config.getConnection(ctx.link.connection_id))?.owner_user_id ?? 0,
        {
          place_id: superseded?.place_id ?? null,
          reservation_id: superseded?.reservation_id ?? null,
          description: superseded?.description ?? null,
        },
      );
      const gone = supersededId !== null && Number(supersededId) !== Number(file.id);
      const starred = gone && !!superseded?.starred;
      if (gone) {
        if (starred) await this.tripFiles.setStarred(Number(file.id), 1);
        await this.fileLinks.copySelectIgnore(Number(file.id), supersededId as number);
        await this.files.softDeleteFile(supersededId as number);
      }
      await this.upsertItem(ctx.link, {
        itemId,
        remote,
        state: 'synced',
        fileId: Number(file.id),
        contentSha256: sha256,
        errorCode: null,
      });
      return { created: starred ? { ...file, starred: 1 } : file, retired: gone ? (supersededId as number) : null };
    });

    // Announced only once it is committed: a rolled-back transaction that had
    // already told every client the file exists cannot be taken back.
    if (retired !== null) this.realtime.broadcast(ctx.link.trip_id, 'file:deleted', { fileId: retired });
    this.realtime.broadcast(ctx.link.trip_id, 'file:created', { file: created });
    return 'pulled';
  }

  /** Upload a TREK document to the provider. */
  private async push(
    local: LocalDocument,
    itemId: number | null,
    remoteId: string | null,
    ctx: { provider: DocumentProvider; ref: ReturnType<DocSyncConfigService['toRef']>; scope: ReturnType<DocSyncConfigService['toScopeRef']>; link: LinkRow },
  ): Promise<'pushed' | DocsyncErrorCode> {
    const caps = ctx.provider.capabilities(ctx.ref);
    const mime = local.mimeType || 'application/octet-stream';

    // Paperless refuses anything outside its parser list with a 400. Checking
    // first turns a recurring hard failure into one visible row that says why.
    if (caps.acceptedMimeTypes && !caps.acceptedMimeTypes.includes(mime)) {
      await this.upsertItem(ctx.link, { itemId, fileId: local.fileId, state: 'rejected_type', errorCode: 'unsupported_type' });
      return 'unsupported_type';
    }
    if (caps.maxUploadBytes !== null && local.size > caps.maxUploadBytes) {
      await this.upsertItem(ctx.link, { itemId, fileId: local.fileId, state: 'too_large', errorCode: 'too_large' });
      return 'too_large';
    }

    const file = await this.files.getFileById(local.fileId, ctx.link.trip_id);
    if (!file) return 'not_found';
    // Re-read rather than trust the plan: a run walks a whole folder, and a
    // document somebody deleted in the meantime would otherwise still be
    // uploaded: a delete that looks ignored, and a document that reappears
    // upstream after the person watched it go.
    if ((file as { deleted_at?: string | null }).deleted_at) return 'not_found';

    let sha256 = local.sha256;
    let stream: Readable;
    try {
      // Hash before sending when it is not known yet: the push result has to
      // record exactly what was written, or the echo guard has nothing to
      // compare against on the next run.
      if (!sha256) sha256 = await this.hashStoredFile(String(file.filename));
      const got = await this.storage.getStream('files', String(file.filename));
      stream = got.stream;
    } catch {
      await this.upsertItem(ctx.link, { itemId, fileId: local.fileId, state: 'error', errorCode: 'provider_error' });
      return 'provider_error';
    }

    const uid = (await this.existingUid(ctx.link.id, itemId)) ?? newTrekDocUid();
    const res = await ctx.provider.push(ctx.ref, ctx.scope, {
      body: stream,
      fileName: local.name,
      mimeType: mime,
      size: local.size,
      sha256,
      mtimeSeconds: Math.floor(Date.now() / 1000),
      remoteId: remoteId ?? undefined,
      trekDocUid: uid,
      trekTripUid: `trek-trip-${ctx.link.trip_id}`,
    });

    if (docFailed(res)) {
      await this.upsertItem(ctx.link, { itemId, fileId: local.fileId, state: 'error', errorCode: res.error.code, trekDocUid: uid });
      return res.error.code;
    }

    // A provider may answer a push with a document it already held rather than
    // a new one: Papra deduplicates identical bytes, and `deduplicated` says so.
    // Two trip files with the same content therefore push to ONE document, and
    // the unique index on (link_id, remote_id) would abort this run (and every
    // run after it) with a constraint error. The upload happened, so nothing is
    // lost; what must not happen is the pairing moving off the file that owns it.
    const heldBy = await this.pairingOwner(ctx.link.id, res.data.remoteId, itemId);
    if (heldBy !== null) {
      await this.upsertItem(ctx.link, {
        itemId,
        fileId: local.fileId,
        state: 'error',
        errorCode: 'conflict',
        trekDocUid: uid,
      });
      return 'conflict';
    }

    await this.upsertItem(ctx.link, {
      itemId,
      fileId: local.fileId,
      state: 'synced',
      remoteIdOverride: res.data.remoteId,
      remoteVersion: res.data.remoteVersion,
      contentSha256: sha256,
      pushedSha256: sha256,
      // The name both sides now agree on. Leaving it null meant the first
      // `touch` filled the arbiter with whatever the provider had made of the
      // name (Paperless stores a title and keeps its own filename), and the
      // run after that read the difference as TREK having renamed the document
      // and renamed the provider's copy to match, unasked.
      remoteNameOverride: local.name,
      // What the copy looks like at the provider, for the same reason as the
      // name: on a provider whose id is the path, a rename before the next run
      // could otherwise not be told from a deletion.
      remoteSize: local.size,
      remoteModifiedAt: res.data.remoteModifiedAt,
      trekDocUid: uid,
      errorCode: null,
    });
    return 'pushed';
  }

  /**
   * Put the shelved rows of one binding back in the queue.
   *
   * A row that has used up its attempts stays put until a person says otherwise,
   * and pressing "Sync now" is that person saying otherwise: they have taken the
   * bad document out of the folder, cleared the quota, or fixed the permission,
   * and the only way to find out is to try again. The scheduler never calls
   * this: automatic retries are exactly what the limit exists to stop.
   */
  async retryShelvedItems(linkId: number): Promise<void> {
    await this.items.resetShelvedForLink(linkId);
  }

  // ── State loading and writing ──────────────────────────────────────────────

  private async loadItems(linkId: number): Promise<SyncItemState[]> {
    const rows = await this.items.findByLink(linkId);
    return rows.map((r) => ({
      id: r.id,
      fileId: r.file_id,
      trekDocUid: r.trek_doc_uid,
      remoteId: r.remote_id,
      remoteVersion: r.remote_version,
      remoteName: r.remote_name,
      remoteSize: r.remote_size,
      remoteModifiedAt: r.remote_modified_at,
      contentSha256: r.content_sha256,
      pushedSha256: r.pushed_sha256,
      state: r.state,
      attempts: r.attempts,
      nextAttemptAt: r.next_attempt_at,
      remoteMissingAt: r.remote_missing_at,
      remoteTrashedAt: r.remote_trashed_at,
    }));
  }

  /**
   * The trip's own documents, minus the ones that are not really documents.
   *
   * Chat attachments (`message_id`) and note attachments (`note_id`) live in
   * the same table but belong to a conversation, not to the trip's paperwork:
   * syncing them would push someone's chat screenshot into a shared Paperless.
   *
   * The set is per TRIP, not per binding, and that is a property rather than an
   * oversight: a binding mirrors the trip's documents, so two bindings on one
   * trip each hold a full copy. That is the right answer for "the same papers,
   * in both my Nextcloud and my Paperless", and the wrong one for "receipts to
   * Paperless, everything else to Nextcloud": splitting a trip across bindings
   * would need a per-document assignment that nothing in the UI offers yet.
   */
  private async loadLocalDocuments(link: LinkRow): Promise<LocalDocument[]> {
    const rows = await this.tripFiles.listSyncableForTrip(link.trip_id);
    return rows.map((r) => ({
      fileId: r.id,
      name: r.original_name,
      size: r.file_size ?? 0,
      mimeType: r.mime_type,
      // Deliberately null, and not the agreed hash out of document_sync_items:
      // reading that column here would compare it against itself, and
      // `localChanged` in the planner could then never be true. TREK has no way
      // to replace a document's bytes (an upload creates a new row), so there
      // is no local change to detect, and claiming otherwise would be worse
      // than admitting it. The day the file manager grows a replace, this needs
      // a real hash column on trip_files, filled at upload time.
      sha256: null,
      deletedAt: r.deleted_at,
    }));
  }

  /** The item already paired with this remote document, if it is a different one. */
  private async pairingOwner(linkId: number, remoteId: string, itemId: number | null): Promise<number | null> {
    const found = await this.items.findPairingOwner(linkId, remoteId);
    if (found === undefined) return null;
    return itemId !== null && Number(found) === Number(itemId) ? null : Number(found);
  }

  private async existingUid(linkId: number, itemId: number | null): Promise<string | null> {
    if (itemId === null) return null;
    return (await this.items.findTrekDocUid(itemId, linkId)) ?? null;
  }

  private async hashStoredFile(storageKey: string): Promise<string> {
    const { stream } = await this.storage.getStream('files', storageKey);
    const hash = crypto.createHash('sha256');
    for await (const chunk of stream) hash.update(chunk as Buffer);
    return hash.digest('hex');
  }

  private async upsertItem(
    link: LinkRow,
    patch: {
      itemId: number | null;
      remote?: RemoteDocument;
      remoteIdOverride?: string;
      /** The agreed name, where the caller knows it better than the listing does. */
      remoteNameOverride?: string;
      remoteVersion?: string;
      /** Size and modification time at the provider, where there is no listing entry to take them from. */
      remoteSize?: number;
      remoteModifiedAt?: string | null;
      fileId?: number;
      state: string;
      errorCode?: DocsyncErrorCode | null;
      contentSha256?: string;
      pushedSha256?: string;
      trekDocUid?: string;
    },
  ): Promise<void> {
    const failed = patch.state === 'error';
    /**
     * A failed transfer leaves the pairing describing the copy TREK holds.
     *
     * The listing entry is the copy that did not arrive. Its version marker
     * written next to the old bytes meant the next run saw no upstream change,
     * planned `touch`, which leaves `error` alone, and the row stayed in error
     * on stale bytes for good, "Sync now" included. Size and time go with it:
     * where the id is the path they are how a moved copy is recognised as the
     * same bytes, and a match there adopts the listing's version as well.
     *
     * A new row keeps the listing's name, size and time, because they are what
     * pairs it and follows it to be fetched again, but no version: TREK holds
     * none yet, and the planner retries it for having no file.
     */
    const described = failed && patch.itemId !== null ? undefined : patch.remote;
    const remoteId = patch.remoteIdOverride ?? patch.remote?.remoteId ?? null;
    const remoteVersion = patch.remoteVersion ?? (failed ? null : patch.remote?.remoteVersion) ?? null;
    const remoteName = patch.remoteNameOverride ?? described?.name ?? null;
    const remoteSize = patch.remoteSize ?? described?.size ?? null;
    const remoteModifiedAt = patch.remoteModifiedAt ?? described?.remoteModifiedAt ?? null;

    if (patch.itemId !== null) {
      /**
       * The attempt counter, read before it is written.
       *
       * Two things needed it. The backoff was computed as
       * `backoffSeconds(curve, 1)`, always the first step, so three of the
       * four steps in the curve were unreachable and a provider that was down
       * got asked again at the same short interval. And the counter only ever
       * grew: a row that failed once a month reached the limit after six months
       * of otherwise healthy syncing and was shelved for good. A successful
       * pass now clears it, which is what makes the limit mean "six failures in
       * a row" rather than "six failures ever".
       */
      const before = (await this.items.getAttempts(patch.itemId)) ?? 0;
      const attempts = failed ? before + 1 : 0;
      // A row that has used up its attempts stops retrying and waits for a
      // person; planReconcile skips it and a manual run clears the counter
      // (see retryShelvedItems). The repository turns this second count into
      // the DB-clock `datetime('now', ...)` fragment itself (recordAttempt's
      // own docstring).
      const nextAttemptAfterSeconds = failed && attempts < ITEM_MAX_ATTEMPTS ? backoffSeconds(ITEM_BACKOFF_SECONDS, attempts) : null;

      await this.items.recordAttempt(patch.itemId, {
        state: patch.state,
        error_code: patch.errorCode ?? null,
        file_id: patch.fileId ?? null,
        remote_id: remoteId,
        remote_version: remoteVersion,
        remote_name: remoteName,
        remote_size: remoteSize,
        remote_modified_at: remoteModifiedAt,
        content_sha256: patch.contentSha256 ?? null,
        pushed_sha256: patch.pushedSha256 ?? null,
        attempts,
        next_attempt_after_seconds: nextAttemptAfterSeconds,
      });
      return;
    }

    // The WHERE clause is repeated on purpose: the unique index is partial
    // (`WHERE remote_id IS NOT NULL`, so a not-yet-pushed local file can exist
    // without one), and SQLite only matches an ON CONFLICT target to a partial
    // index when the predicate is restated. Without it every insert fails with
    // "ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint".
    await this.items.insertOrUpsertOnConflict({
      link_id: link.id,
      trip_id: link.trip_id,
      file_id: patch.fileId ?? null,
      trek_doc_uid: patch.trekDocUid ?? newTrekDocUid(),
      remote_id: remoteId,
      remote_name: remoteName,
      remote_version: remoteVersion,
      remote_size: remoteSize,
      remote_modified_at: remoteModifiedAt,
      content_sha256: patch.contentSha256 ?? null,
      pushed_sha256: patch.pushedSha256 ?? null,
      state: patch.state,
      error_code: patch.errorCode ?? null,
      attempts: failed ? 1 : 0,
      // A new row is always at its first failure.
      next_attempt_after_seconds: failed ? backoffSeconds(ITEM_BACKOFF_SECONDS, 1) : null,
      synced_now: patch.state === 'synced',
    });
  }

  private async recordLinkSuccess(link: LinkRow, cursor: string | null, state: string, errorCode: string | null): Promise<void> {
    await this.linksRepo.recordSuccess(link.id, { remote_cursor: cursor, state, error_code: errorCode });
  }

  private async recordLinkFailure(link: LinkRow, code: string, state = 'failed'): Promise<void> {
    const failures = link.failure_count + 1;
    const wait = backoffSeconds(LINK_BACKOFF_SECONDS, failures);
    await this.linksRepo.recordFailure(link.id, {
      state,
      error_code: code,
      failure_count: failures,
      next_attempt_seconds: wait,
    });
  }

  // ── Conflict resolution ────────────────────────────────────────────────────

  /**
   * Rename the provider's copy, outside a run.
   *
   * Only `resolveConflict` needs this: every other rename is planned and
   * executed by a run. A failure is not fatal here: the row is left for the
   * next run to sort out rather than the owner's choice being refused.
   */
  private async renameRemoteTo(link: LinkRow, remoteId: string, name: string, itemId: number): Promise<void> {
    const conn = await this.config.getConnection(link.connection_id);
    const provider = this.registry.get(link.provider_id);
    if (!conn || !provider) return;
    const res = await provider.rename(this.config.toRef(conn), this.config.toScopeRef(link), remoteId, name);
    if (docFailed(res)) {
      this.logger.warn(`link ${link.id}: renaming ${remoteId} to "${name}" failed: ${res.error.code}`);
      return;
    }
    await this.items.setRemoteName(itemId, { remote_name: name, remote_version: res.data.remoteVersion });
  }

  /**
   * Decide a conflict.
   *
   * `tripId` is not decoration: the route authorises the caller against the trip
   * in its URL, and without checking the row against the same trip an owner of
   * any trip could resolve a conflict in somebody else's: the id is a plain
   * integer and nothing else tied the two together. Same rule as everywhere in
   * this codebase: every referenced id must exist AND belong to the same trip.
   * This check stays a JS-level comparison AFTER the read — never folded into
   * the SQL WHERE clause — per the inventory's explicit callout.
   *
   * `both` keeps the provider copy as a second TREK document rather than
   * overwriting either side, which is the only outcome that cannot lose work
   * and is therefore what the UI offers first.
   */
  async resolveConflict(itemId: number, keep: 'trek' | 'provider' | 'both', tripId?: number): Promise<boolean> {
    const item = await this.items.findRaw(itemId);
    if (!item || item.state !== 'conflict') return false;
    if (tripId !== undefined && Number(item.trip_id) !== Number(tripId)) return false;
    const link = await this.config.getLink(item.link_id);
    if (!link) return false;

    /**
     * The name has to be decided too, not only the bytes.
     *
     * The only conflict the planner can actually raise today is a double
     * rename, and that is arbitrated entirely by `remote_name`, the name both
     * sides last agreed on. Clearing a version marker leaves all three names
     * exactly as they were, so the next run compared them again, found both
     * sides changed again, and wrote the conflict straight back. Whatever the
     * owner picked, the issue reappeared within minutes, forever.
     *
     * So each choice moves the arbiter to the side that won: keeping TREK's
     * name makes the agreed name TREK's (the provider then reads as the one
     * that renamed, and gets renamed back), keeping the provider's takes the
     * local rename back (TREK then reads as unchanged, and follows).
     */
    const localName = item.file_id === null ? null : ((await this.tripFiles.findOriginalName(item.file_id)) ?? null);

    if (keep === 'trek') {
      // Forget the provider's version marker, so the next run sees no upstream
      // change and pushes TREK's copy. Clearing content_sha256 instead would do
      // the opposite: it reads as "TREK never agreed to these bytes", and the
      // provider's copy comes down over the one the user just chose to keep.
      await this.items.resolveKeepTrek(itemId);
      // Carry the name over as well, here rather than by moving the arbiter:
      // TREK winning means the provider's copy takes TREK's name, and the only
      // way to say that through `remote_name` would be to write the provider's
      // CURRENT name into it, which this method does not know without asking.
      if (localName && item.remote_id && localName !== item.remote_name) {
        await this.renameRemoteTo(link, item.remote_id, localName, itemId);
      }
    } else if (keep === 'provider') {
      await this.items.resolveKeepProvider(itemId);
      // Take the local rename back to the agreed name. Only the provider's
      // rename is then left standing, and the next run follows it the ordinary
      // way, through the planner, with no special case in it. Cleaned the way
      // a download cleans it: the planner compares cleaned names, so a raw one
      // with a slash in it would read as TREK renaming the file all over again.
      const agreedName = item.remote_name ? sanitizeIncomingName(item.remote_name) : null;
      if (item.file_id !== null && agreedName && localName !== agreedName) {
        await this.tripFiles.renameOriginalName(item.file_id, agreedName);
      }
    } else {
      // Detach the pairing and let the next run pull the provider copy as a new
      // document. Both versions survive, under two rows.
      await this.items.resolveKeepBoth(itemId);
    }
    await this.syncLink(link, { full: true });
    return true;
  }

  /**
   * The documents a person has to decide about: conflicts, refusals and things
   * that vanished upstream. Deliberately not "everything not synced": a row
   * waiting for its turn is not a problem anyone should be shown.
   */
  async issues(tripId: number): Promise<DocumentSyncIssueRow[]> {
    return this.items.listIssues(tripId);
  }

  /**
   * DSCTRL4/DSCTRL5 (R2 — moved off the controller, `DocSyncController.items`)
   * — the trip's sync items, state-filtered or not. Two distinct `LIMIT 500`
   * queries (a 3rd near-duplicate listing shape alongside {@link issues}'s
   * own `LIMIT 200` fixed-state-list) stay two repository methods, per R2's
   * own instruction not to unify near-duplicate reads with different shapes.
   * `state` is checked for TRUTHINESS, not `undefined` (Plan 3h Task 7
   * review, M2): legacy's own gate (`doc-sync.controller.ts`, pre-R2) read
   * `state ? <filtered> : <unfiltered>`, so `?state=` (an empty string)
   * returns every item — an `=== undefined` check would instead filter on
   * `state = ''`, which matches nothing.
   */
  async itemsForTrip(tripId: number, state?: string) {
    return state ? this.items.listForTripByState(tripId, state) : this.items.listForTrip(tripId);
  }

  /** Per-trip view for the UI: what is synced, what needs attention. */
  async status(tripId: number): Promise<Record<string, unknown>> {
    const links = await this.config.listLinks(tripId);
    const counts = await this.items.countByState(tripId);

    /**
     * What each side is actually holding, per binding.
     *
     * The UI showed the last run's transfer counts, which are zero on a binding
     * that is already in step, so the interesting screen said nothing. These
     * are the standing numbers instead: how many documents this trip has, how
     * many of them the store has, and how many are only on one side.
     */
    const totalHere = await this.tripFiles.countActiveDocuments(tripId);
    const perLink = await this.items.perLinkHoldings(tripId);

    const byLink = new Map(perLink.map((r) => [r.link_id, r]));
    // `map` cannot await the provider-off read, so the projection runs as an
    // explicit loop — same order, same rows.
    const linkCards = [];
    for (const l of links) {
      const row = byLink.get(l.id);
      linkCards.push({
        ...(await this.config.publicLink(l, null)),
        // Paused rather than failed, so the card can say why nothing moves
        // without the binding's own state being touched.
        providerOff: await this.isSwitchedOff(l),
        holdings: {
          inTrek: totalHere,
          atProvider: Number(row?.atProvider ?? 0),
          paired: Number(row?.paired ?? 0),
          missing: Number(row?.missing ?? 0),
        },
      });
    }
    return {
      links: linkCards,
      items: Object.fromEntries(counts.map((c) => [c.state, c.n])),
    };
  }
}

function isTransfer(action: PlanAction): boolean {
  return action.kind === 'pull' || action.kind === 'pull_update' || action.kind === 'push' || action.kind === 'push_update';
}

/** Whether carrying out the action asks the provider to change something. */
function changesProvider(action: PlanAction, link: LinkRow): boolean {
  if (action.kind === 'local_deleted') return link.delete_policy === 'trash';
  return action.kind === 'push' || action.kind === 'push_update' || action.kind === 'rename_remote';
}
