import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { readEnv } from '../../../app-config';
import { RealtimeService } from '../../realtime/realtime.service';
import { isUpdateConflict } from '../../../services/conflictResult';
import { getWeather } from '../../../services/weatherService';
import { BLOCKED_EXTENSIONS, filesDir } from '../../files/files.constants';
import { joinTripAsMember } from '../../../services/tripMembership';
import { send as sendNotification } from '../../../services/notificationService';
import { createLlmClient } from '../../llm-parse/llm-client.factory';
import { readUserSettingDecrypted } from '../plugins.service';
import { PluginOAuthService } from '../plugin-oauth.service';
import fsMod from 'node:fs';
import pathMod from 'node:path';
import { randomUUID } from 'node:crypto';
import { PermissionsService } from '../../permissions/permissions.service';
import { TripsService, NotFoundError, ValidationError } from '../../trips/trips.service';
import { createPlace, updatePlace, deletePlace, getPlace } from '../../../services/placeService';
import { AddonsService } from '../../addons/addons.service';
import { isDemoEmail } from '../../../services/demo';
import { ADDON_IDS } from '../../../addons';
import { listJourneys, listEntries as listJournalEntriesSvc, createEntry as createJournalEntrySvc, updateEntry as updateJournalEntrySvc, deleteEntry as deleteJournalEntrySvc, createJourney as createJourneySvc, deleteJourney as deleteJourneySvc, onPlaceCreated, onPlaceUpdated, onPlaceDeleted } from '../../../services/journeyService';
import { listVisitedCountries, listManuallyVisitedRegions, listBucketList, markCountryVisited, unmarkCountryVisited, markRegionVisited, unmarkRegionVisited, createBucketItem as createBucketItemSvc, deleteBucketItem as deleteBucketItemSvc } from '../../../services/atlasService';
import { listCollections, getCollection, createCollection, updateCollection, savePlace as saveCollectionPlaceSvc, copyToTrip as copyCollectionToTripSvc, deletePlace as deleteCollectionPlaceSvc } from '../../../services/collectionsService';
import { BudgetService } from '../../budget/budget.service';
import { ExchangeRatesService } from '../../budget/exchange-rates.service';
import { ReservationsService } from '../../reservations/reservations.service';
import { TagsService } from '../../tags/tags.service';
import { CategoriesService } from '../../categories/categories.service';
import { TodoService } from '../../todo/todo.service';
import { PackingService } from '../../packing/packing.service';
import { DayNotesService } from '../../days/day-notes.service';
import { DaysService } from '../../days/days.service';
import { AssignmentsService } from '../../assignments/assignments.service';
import { LlmConfigResolver } from '../../llm-parse/llm-config.resolver';
import { DatabaseService } from '../../database/database.service';
import { FilesService } from '../../files/files.service';
import { CollabService } from '../../collab/collab.service';
import { VacayService } from '../../vacay/vacay.service';
import { PluginRpcHost, ForbiddenResource, BadParams } from './rpc-host';
import { appendAudit } from './plugin-audit';
import { getPluginDataDb, budgetFor } from './plugin-host-state';

// collectionsService self-gates per-collection role by THROWING status-tagged errors
// (assertAccess 404, assertCanEdit 403, validation 400). Map them onto the RPC error
// classes so a plugin sees RESOURCE_FORBIDDEN / BAD_PARAMS instead of HOST_ERROR.
function mapCollectionError<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    const status = (e as { status?: number })?.status;
    const msg = e instanceof Error ? e.message : 'collection error';
    if (status === 403 || status === 404) throw new ForbiddenResource(msg);
    if (status === 400 || status === 409) throw new BadParams(msg);
    throw e;
  }
}

// Journey mirroring is best-effort on every other path that triggers it
// (places.service wraps the same hooks, assignments.service wraps the reconcile),
// so a broken journey link can never turn a successful write into an RPC error.
function mirrorJourneys(run: () => void): void {
  try { run(); } catch { /* non-fatal */ }
}

// --- #858 packing privacy: viewer-scoped fan-out mirrored from
// packing.controller.broadcastUpdate/emitToViewers and PackingService's
// broadcastItem/viewersOf/broadcastToViewers. A private item's events reach ONLY
// its owner (+ recipients for a shared item), never the whole trip room; passing the
// wrong onlyUserId — or forgetting to drop a freshly-privatized item from the room —
// leaks it. Kept as a local copy (rather than delegating to the injected
// PackingService) so the factory's unit test can assert the fan-out through the
// websocket mock while PackingService stays a plain data stub. Keep in lockstep
// with packing.controller.ts + packing.service.ts. ---
type PackingPrivacy = { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] };

function packingViewersOf(item: PackingPrivacy | null | undefined): number[] | null {
  if (!item || !item.is_private) return null; // Common — visible to the whole room
  return [item.owner_id, ...(item.recipients || []).map((r) => r.user_id)].filter((x): x is number => x != null);
}

/** CREATE/DELETE fan-out: whole room for a Common item, else owner + recipients only. */
function emitPackingToViewers<E extends TrekWsTripEventName>(realtime: RealtimeService, tripId: number, event: E, payload: TrekWsPayload<E>, item: PackingPrivacy): void {
  const viewers = packingViewersOf(item);
  if (viewers === null) {
    realtime.broadcast(tripId, event, payload, undefined);
    return;
  }
  for (const uid of new Set(viewers)) if (uid != null) realtime.broadcast(tripId, event, payload, undefined, uid);
}

/** An item event delivered owner-only when the item is private (else to the room). */
function broadcastPackingItem<E extends TrekWsTripEventName>(realtime: RealtimeService, tripId: number, event: E, payload: TrekWsPayload<E>, item: PackingPrivacy): void {
  const onlyUserId = item?.is_private && item.owner_id != null ? item.owner_id : undefined;
  realtime.broadcast(tripId, event, payload, undefined, onlyUserId);
}

/** The four public<->private transitions (packing.controller.broadcastUpdate). `wasPrivate`
 * is read BEFORE the write — getting this wrong LEAKS a freshly-privatized item. */
function broadcastPackingUpdate(realtime: RealtimeService, tripId: number, itemId: number, item: PackingPrivacy, wasPrivate: boolean): void {
  const nowPrivate = !!item.is_private;
  if (nowPrivate) {
    if (wasPrivate) {
      broadcastPackingItem(realtime, tripId, 'packing:updated', { item }, item); // stays private -> owner-only
    } else {
      realtime.broadcast(tripId, 'packing:deleted', { itemId }, undefined); // public->private: drop from the room...
      broadcastPackingItem(realtime, tripId, 'packing:created', { item }, item); // ...then re-add for the owner
    }
  } else {
    if (wasPrivate) realtime.broadcast(tripId, 'packing:created', { item }, undefined); // private->public: add for members who lacked it
    realtime.broadcast(tripId, 'packing:updated', { item }, undefined);
  }
}

// Quotas for plugin entity metadata (db:meta) — a cheap disk-DoS guard on the
// shared trek.db volume. Generous for real use, small enough to bound abuse.
const META_VALUE_MAX = 64 * 1024; // serialized JSON bytes per value
const META_KEY_MAX = 256; // key string length (the key is attacker-controlled too)
const META_KEYS_MAX = 100; // keys per (plugin, entity)

/** Routes inter-plugin calls/events; supplied by PluginRuntimeService (owns the supervisor). */
export interface PluginCallRouter {
  callPlugin(callerId: string, targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown>;
  emitPluginEvent(sourceId: string, event: string, payload: unknown): void;
}

/**
 * Wires a plugin's capability host to the REAL privileged modules (#plugins,
 * M1). This is the ONLY plugin file that touches the realtime broadcast facade
 * — it runs in the host (parent), never in the child. Broadcasts are
 * force-namespaced to `plugin:{id}:{event}` so a plugin can't forge a core event.
 *
 * DI-native domain services (budget, exchange-rates, reservations, tags,
 * categories, todo, packing, day-notes, assignments, oauth, files, collab,
 * vacay, trips, the LLM config resolver) and
 * the DatabaseService (all inline SQL + the trip-access helper) are
 * constructor-injected; legacy `services/*` domains stay plain function
 * imports until their own migration lands (DI-MIGRATION.md), at which point
 * each swaps one import for one injected service.
 */
@Injectable()
export class PluginHostDepsFactory {
  constructor(
    private readonly budget: BudgetService,
    private readonly reservations: ReservationsService,
    private readonly tags: TagsService,
    private readonly categories: CategoriesService,
    private readonly todos: TodoService,
    private readonly packing: PackingService,
    private readonly oauth: PluginOAuthService,
    private readonly dayNotes: DayNotesService,
    private readonly assignments: AssignmentsService,
    private readonly llmConfig: LlmConfigResolver,
    private readonly db: DatabaseService,
    private readonly files: FilesService,
    private readonly collab: CollabService,
    private readonly vacay: VacayService,
    private readonly days: DaysService,
    private readonly permissions: PermissionsService,
    private readonly exchangeRates: ExchangeRatesService,
    private readonly addons: AddonsService,
    private readonly realtime: RealtimeService,
    private readonly trips: TripsService,
  ) {}

  /**
   * The trip-access + role gate used by every planner write, mirroring the app's
   * per-domain `canEdit` (canAccessTrip + checkPermission for the entity's *_edit
   * action). Returns false — never throws — so the caller maps it to a clean
   * RESOURCE_FORBIDDEN.
   */
  private canEditTripAs(action: string, tripId: number, userId: number): boolean {
    const trip = this.db.canAccessTrip(tripId, userId) as { user_id: number } | undefined;
    if (!trip) return false;
    const u = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
    if (!u) return false;
    return this.permissions.checkPermission(action, u.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
  }

  // The booking notification the REST controller sends after a create/update/delete
  // is fire-and-forget, so it never blocks the plugin write.
  private notifyBooking(actingUserId: number, tripId: number, booking: string, type: string): void {
    this.reservations.notifyBookingChange(tripId, actingUserId, booking, type);
  }

  create(id: string, granted: ReadonlySet<string>, router: PluginCallRouter): PluginRpcHost {
    // A subsystem read is refused when its addon is off — parity with the app, where a
    // disabled addon means there is simply nothing to read (same shape as the Costs gate).
    const requireAddon = (addonId: string, noun: string): void => {
      if (!this.addons.isAddonEnabled(addonId)) throw new ForbiddenResource(`the ${noun} addon is disabled`);
    };
    return new PluginRpcHost(id, granted, {
      // Resolve the data handle lazily on every access rather than capturing it once.
      // disable()/uninstall() drop the entry from `running` BEFORE awaiting the kill grace
      // and calling dispose(), so a re-enable in that window builds a NEW host. A captured
      // handle would let the OLD host's dispose() close the DB out from under the NEW one
      // (every db.* call then throws 'database connection is not open'). Resolving per call
      // means the new host always uses the current, open handle — getPluginDataDb recreates
      // one the moment a stale dispose closes it. Safe because db.* is synchronous, so no
      // call is ever mid-flight when a dispose from another tick closes the handle.
      get data() { return getPluginDataDb(id); },
      db: this.db.connection,
      canAccessTrip: (tripId, userId) => this.db.canAccessTrip(tripId, userId),
      // The router binds this host's plugin id as the caller/source.
      callPlugin: (targetId, fn, args, actingUserId) => router.callPlugin(id, targetId, fn, args, actingUserId),
      emitPluginEvent: (event, payload) => router.emitPluginEvent(id, event, payload),
      // Two users "share a trip" when both are owner-or-member of the same trip.
      canSeeUser: (actingUserId, targetUserId) =>
        !!this.db
          .prepare(
            `SELECT 1 FROM trips t
               LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
               LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
              WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
                AND (t.user_id = ? OR m2.user_id IS NOT NULL)
              LIMIT 1`,
          )
          .get(actingUserId, targetUserId, actingUserId, targetUserId),
      broadcastToTrip: (tripId, event, payload) => this.realtime.broadcast(tripId, `plugin:${id}:${event}`, payload),
      broadcastToUser: (userId, payload) => this.realtime.broadcastToUser(userId, { type: `plugin:${id}`, ...payload }),
      audit: (entry) => appendAudit(this.db.connection, entry),
      // --- Costs (budget items) ---
      budgetAddonEnabled: () => this.addons.isAddonEnabled(ADDON_IDS.BUDGET),
      // Same gate as a REST/MCP budget mutation: the acting user must have trip
      // access AND the 'budget_edit' permission for their global role.
      canEditCosts: (tripId, userId) => {
        const trip = this.db.canAccessTrip(tripId, userId) as { user_id: number } | undefined;
        if (!trip) return false;
        const u = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
        if (!u) return false;
        return this.permissions.checkPermission('budget_edit', u.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
      },
      // --- Read scopes (packing/files). Membership is checked by the host (tripRead);
      // these just delegate to the same services the REST paths use. ---
      listPackingItems: (tripId, userId) => this.packing.listItems(tripId, userId),
      listTripFiles: (tripId) => this.files.listFiles(tripId, false),
      // A file's bytes as base64, size-capped BEFORE the read so a 500MB video can't
      // be pulled (~667MB base64) through the IPC pipe. 10MB matches the plugin upload
      // cap; trashed files (deleted_at set) are refused like the download path.
      getTripFileContent: async (tripId, fileId) => {
        const CONTENT_MAX = 10 * 1024 * 1024;
        const file = this.files.getFileById(fileId, tripId) as { filename: string; original_name: string; mime_type: string | null; file_size: number | null; deleted_at: string | null } | undefined;
        if (!file || file.deleted_at) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
        if ((file.file_size ?? 0) > CONTENT_MAX) throw new BadParams(`file too large to read (>${CONTENT_MAX} bytes); use the download UI`);
        const { resolved, safe } = this.files.resolveFilePath(file.filename);
        if (!safe) throw new ForbiddenResource('file path is not accessible');
        // Read off the event loop — a 10MB read + base64 on the host thread would
        // otherwise stall every other plugin RPC and request for its duration.
        const buf = await fsMod.promises.readFile(resolved);
        if (buf.length > CONTENT_MAX) throw new BadParams('file too large to read');
        return { name: file.original_name, mimetype: file.mime_type ?? 'application/octet-stream', size: buf.length, content_base64: buf.toString('base64') };
      },
      // --- Files write. Bytes arrive as bounded base64; the extension is validated
      // against the central blocklist BEFORE anything touches disk, and link targets
      // must live on the same trip (findForeignLinkTarget). Same events as the app. ---
      canUploadFiles: (tripId, userId) => this.canEditTripAs('file_upload', tripId, userId),
      canEditFiles: (tripId, userId) => this.canEditTripAs('file_edit', tripId, userId),
      canDeleteFiles: (tripId, userId) => this.canEditTripAs('file_delete', tripId, userId),
      createTripFile: (tripId, input, actingUserId) => {
        // Mirror the REST upload guard (files.controller): a demo user must not write
        // bytes to the shared demo instance, even through a plugin's db:write:files.
        // Only resolve the email when demo mode is actually on — keeps the hot path
        // (and the schema surface) untouched for self-hosted installs.
        if (readEnv().demo.enabled) {
          const uploader = this.db.prepare('SELECT email FROM users WHERE id = ?').get(actingUserId) as { email?: string } | undefined;
          if (isDemoEmail(uploader?.email)) throw new ForbiddenResource('Uploads are disabled in demo mode.');
        }
        const i = input as { name: string; content_base64: string; mimetype?: string; description?: string; place_id?: number; reservation_id?: number };
        const original = pathMod.basename(i.name);
        const ext = pathMod.extname(original).toLowerCase();
        if (!ext || BLOCKED_EXTENSIONS.includes(ext)) throw new BadParams(`file extension '${ext || '(none)'}' is not allowed`);
        const buf = Buffer.from(i.content_base64, 'base64');
        if (buf.length === 0) throw new BadParams('file content is empty');
        if (buf.length > 10 * 1024 * 1024) throw new BadParams('file exceeds the 10MB plugin upload cap');
        const foreign = this.files.findForeignLinkTarget(tripId, { reservation_id: i.reservation_id ?? null, place_id: i.place_id ?? null });
        if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
        const filename = `${randomUUID()}${ext}`;
        fsMod.mkdirSync(filesDir, { recursive: true });
        fsMod.writeFileSync(pathMod.join(filesDir, filename), buf);
        const file = this.files.createFile(
          tripId,
          { filename, originalname: original, size: buf.length, mimetype: i.mimetype || 'application/octet-stream' },
          actingUserId,
          { place_id: i.place_id != null ? String(i.place_id) : null, reservation_id: i.reservation_id != null ? String(i.reservation_id) : null, description: i.description ?? null },
        );
        this.realtime.broadcast(tripId, 'file:created', { file }, undefined);
        return file;
      },
      createTripFileLink: (tripId, fileId, opts) => {
        if (!this.files.getFileById(fileId, tripId)) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
        const o = opts as { reservation_id?: number; assignment_id?: number; place_id?: number };
        const foreign = this.files.findForeignLinkTarget(tripId, o);
        if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
        return this.files.createFileLink(fileId, { reservation_id: o.reservation_id != null ? String(o.reservation_id) : null, assignment_id: o.assignment_id != null ? String(o.assignment_id) : null, place_id: o.place_id != null ? String(o.place_id) : null });
      },
      updateTripFile: (tripId, fileId, input) => {
        const current = this.files.getFileById(fileId, tripId);
        if (!current) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
        const i = input as { description?: string; place_id?: number | null; reservation_id?: number | null };
        const foreign = this.files.findForeignLinkTarget(tripId, { reservation_id: i.reservation_id ?? null, place_id: i.place_id ?? null });
        if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
        const file = this.files.updateFile(fileId, current, { description: i.description, place_id: i.place_id != null ? String(i.place_id) : i.place_id === null ? null : undefined, reservation_id: i.reservation_id != null ? String(i.reservation_id) : i.reservation_id === null ? null : undefined });
        this.realtime.broadcast(tripId, 'file:updated', { file }, undefined);
        return file;
      },
      softDeleteTripFile: (tripId, fileId) => {
        if (!this.files.getFileById(fileId, tripId)) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
        this.files.softDeleteFile(fileId);
        this.realtime.broadcast(tripId, 'file:deleted', { fileId }, undefined);
        return { deleted: true };
      },
      // --- Collab reads (collab addon; membership checked by the host). Same hydrated
      // shapes as the REST GETs, so a collab plugin can finally read what it writes. ---
      listCollabNotes: (tripId) => { requireAddon(ADDON_IDS.COLLAB, 'collab'); return this.collab.listNotes(tripId) as unknown[]; },
      listCollabPolls: (tripId) => { requireAddon(ADDON_IDS.COLLAB, 'collab'); return this.collab.listPolls(tripId) as unknown[]; },
      listCollabMessages: (tripId, before) => { requireAddon(ADDON_IDS.COLLAB, 'collab'); return this.collab.listMessages(tripId, before) as unknown[]; },
      // --- Collab content (collab addon). The services validate + self-report errors. ---
      canEditCollab: (tripId, userId) => this.canEditTripAs('collab_edit', tripId, userId),
      createCollabNote: (tripId, input, actingUserId) => {
        requireAddon(ADDON_IDS.COLLAB, 'collab');
        const note = this.collab.createNote(String(tripId), actingUserId, input as never);
        this.realtime.broadcast(tripId, 'collab:note:created', { note }, undefined);
        return note;
      },
      createCollabPoll: (tripId, input, actingUserId) => {
        requireAddon(ADDON_IDS.COLLAB, 'collab');
        const poll = this.collab.createPoll(String(tripId), actingUserId, input as never);
        this.realtime.broadcast(tripId, 'collab:poll:created', { poll }, undefined);
        return poll;
      },
      voteCollabPoll: (tripId, pollId, optionIndex, actingUserId) => {
        requireAddon(ADDON_IDS.COLLAB, 'collab');
        const result = this.collab.votePoll(String(tripId), String(pollId), actingUserId, optionIndex);
        if (result.error) throw new BadParams(result.error);
        this.realtime.broadcast(tripId, 'collab:poll:voted', { poll: result.poll }, undefined);
        return result.poll;
      },
      createCollabMessage: (tripId, text, replyTo, actingUserId) => {
        requireAddon(ADDON_IDS.COLLAB, 'collab');
        const result = this.collab.createMessage(String(tripId), actingUserId, text, replyTo ?? null);
        if (result.error) throw new BadParams(result.error);
        this.realtime.broadcast(tripId, 'collab:message:created', { message: result.message }, undefined);
        return result.message;
      },
      // --- Member add (member_manage). Grants trip access — the target must exist;
      // the acting user is recorded as the inviter. Owner/duplicate adds are no-ops. ---
      canManageMembers: (tripId, userId) => this.canEditTripAs('member_manage', tripId, userId),
      addTripMember: (tripId, targetUserId, invitedBy) => {
        const target = this.db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId) as { id: number } | undefined;
        if (!target) throw new ForbiddenResource(`no user ${targetUserId}`);
        return joinTripAsMember(tripId, targetUserId, invitedBy);
      },
      removeTripMember: (tripId, targetUserId) => {
        // Never remove the OWNER via this path — that would orphan the trip. Ownership
        // transfer is a separate, deliberate action, not a member-management side effect.
        const trip = this.db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as { user_id: number } | undefined;
        if (trip && trip.user_id === targetUserId) throw new ForbiddenResource('cannot remove the trip owner');
        this.trips.removeMember(tripId, targetUserId);
        return { removed: true };
      },
      // --- Host-mediated notifications. Recipient resolution + channel fan-out +
      // per-user preferences are all owned by notificationService.send; the plugin
      // supplies only the target (host-scoped by the router) + plain text. actorId is
      // null (no user sender), so the message body carries the plugin's content. ---
      canAccessTripForNotify: (tripId, userId) => !!this.db.canAccessTrip(tripId, userId),
      sendPluginNotification: async (_pluginId, input) => {
        if (!budgetFor(id).take('notify', Date.now())) throw new BadParams('daily notification budget exhausted (resets at UTC midnight)');
        await sendNotification({
          event: 'plugin_notification',
          actorId: null,
          params: { title: input.title, body: input.body, ...(input.link ? { link: input.link } : {}) },
          scope: input.scope,
          targetId: input.targetId,
          inApp: input.link ? { navigateTarget: input.link } : undefined,
        });
        return { sent: true };
      },
      // --- Host-mediated LLM. The host holds the credential (LlmConfigResolver, encrypted
      // apiKey) and runs the call under the acting user's provider config; caps + the
      // provider-availability check live at the router. Reuses the extraction client:
      // complete() wraps it with a {text} schema; extract() passes the plugin's schema. ---
      aiConfigured: (userId) => this.llmConfig.resolve(userId) !== null,
      aiComplete: async (userId, prompt, system) => {
        const config = this.llmConfig.resolve(userId);
        if (!config) throw new BadParams('no AI provider is configured for this user');
        if (!budgetFor(id).take('ai', Date.now())) throw new BadParams('daily AI budget exhausted (resets at UTC midnight)');
        const results = await createLlmClient(config).extract({
          prompt: system || 'You are a helpful assistant. Reply with a JSON object of the form {"text": "..."} whose "text" field holds your answer.',
          jsonSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
          model: config.model, baseUrl: config.baseUrl, apiKey: config.apiKey, text: prompt,
        });
        const first = results[0] as { text?: unknown } | undefined;
        return { text: typeof first?.text === 'string' ? first.text : '' };
      },
      aiExtract: async (userId, text, jsonSchema, prompt) => {
        const config = this.llmConfig.resolve(userId);
        if (!config) throw new BadParams('no AI provider is configured for this user');
        if (!budgetFor(id).take('ai', Date.now())) throw new BadParams('daily AI budget exhausted (resets at UTC midnight)');
        const results = await createLlmClient(config).extract({
          prompt: prompt || 'Extract structured data from the text into the given JSON schema.',
          jsonSchema, model: config.model, baseUrl: config.baseUrl, apiKey: config.apiKey, text,
        });
        return { results };
      },
      // The acting user's own decrypted value for one of this plugin's user-scope settings.
      getUserSetting: (pluginId, userId, key) => readUserSettingDecrypted(pluginId, userId, key),
      // A short-lived OAuth access token for the acting user (host-brokered; refreshes).
      getOAuthToken: (pluginId, userId) => this.oauth.getAccessToken(pluginId, userId, Date.now()),
      // Persistent scheduler (jobs:run). Caps bound the abuse surface: a plugin can't
      // hoard timers, name-bomb, ship a huge payload, or busy-loop a recurring task.
      schedulerSet: (name, dueAt, everyMs, payload) => {
        const SCHED_MAX = 100;               // entries per plugin
        const NAME_MAX = 128;
        const PAYLOAD_MAX = 8 * 1024;        // 8 KB JSON
        const EVERY_MIN = 60_000;            // 1 min floor for recurring
        const DUE_MAX = Date.now() + 366 * 24 * 60 * 60 * 1000; // <= ~1 year out
        if (!name || name.length > NAME_MAX) throw new BadParams(`scheduler name is required (max ${NAME_MAX} chars)`);
        if (!Number.isFinite(dueAt) || dueAt > DUE_MAX) throw new BadParams('scheduler dueAt out of range');
        if (everyMs !== undefined && (!Number.isFinite(everyMs) || everyMs < EVERY_MIN)) throw new BadParams(`recurring interval must be >= ${EVERY_MIN} ms`);
        const json = JSON.stringify(payload ?? null);
        if (json.length > PAYLOAD_MAX) throw new BadParams(`scheduler payload too large (max ${PAYLOAD_MAX} bytes)`);
        const existing = this.db.prepare('SELECT id FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?').get(id, name) as { id: number } | undefined;
        if (!existing) {
          const n = (this.db.prepare('SELECT COUNT(*) AS c FROM plugin_scheduled_tasks WHERE plugin_id = ?').get(id) as { c: number }).c;
          if (n >= SCHED_MAX) throw new BadParams(`too many scheduled tasks (max ${SCHED_MAX})`);
        }
        // Upsert by (plugin, name): re-scheduling the same name replaces it.
        this.db.prepare(
          `INSERT INTO plugin_scheduled_tasks (plugin_id, name, due_at, payload, every_ms) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (plugin_id, name) DO UPDATE SET due_at = excluded.due_at, payload = excluded.payload, every_ms = excluded.every_ms`,
        ).run(id, name, Math.max(dueAt, Date.now()), json, everyMs ?? null);
        return { scheduled: true };
      },
      schedulerCancel: (name) => {
        const r = this.db.prepare('DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?').run(id, name);
        return { cancelled: r.changes > 0 };
      },
      listCostsForTrip: (tripId) => this.budget.listBudgetItems(tripId),
      // Cross-trip: every accessible trip's budget items (membership predicate is
      // baked into listTrips). Reuses the hydrated list so members/payers come too.
      listCostsForUser: (userId) => {
        const trips = this.trips.list(userId, null) as Array<{ id: number }>;
        return trips.flatMap((t) => this.budget.listBudgetItems(t.id));
      },
      // Reuses BudgetService.create (frozen FX + members/payers), then broadcasts
      // the same 'budget:created' event the controller emits so the web app updates
      // live. No X-Socket-Id — a plugin has no originating socket.
      createCost: async (tripId, input) => {
        const item = await this.budget.create(String(tripId), input);
        this.realtime.broadcast(tripId, 'budget:created', { item });
        return item;
      },
      // Reuses BudgetService.update (re-frozen FX on a currency change), then
      // broadcasts the same 'budget:updated' event the REST controller emits. A
      // missing item is a clean RESOURCE_FORBIDDEN (parity with updatePlace).
      updateCost: async (tripId, itemId, input) => {
        const item = await this.budget.update(String(itemId), String(tripId), input);
        if (item == null) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'budget:updated', { item });
        return item;
      },
      // Reuses BudgetService.remove, then broadcasts 'budget:deleted' with the
      // numeric id — same payload the REST controller sends.
      deleteCost: (tripId, itemId) => {
        const deleted = this.budget.remove(String(itemId), String(tripId));
        if (!deleted) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'budget:deleted', { itemId });
        return { deleted: true };
      },
      // --- Places (place_edit). Delegate to the same placeService the REST/MCP paths
      // use, then broadcast the same events so open web sessions update live, and run
      // the journey hooks places.controller runs on the same three writes: a journey
      // linked to the trip carries a skeleton entry per day-assigned place, and
      // without the hooks it keeps the old title/location — or a dead entry — until
      // somebody reloads it. ---
      canEditPlaces: (tripId, userId) => this.canEditTripAs('place_edit', tripId, userId),
      createPlace: (tripId, input) => {
        const place = createPlace(String(tripId), input as Parameters<typeof createPlace>[1]);
        this.realtime.broadcast(tripId, 'place:created', { place });
        mirrorJourneys(() => onPlaceCreated(Number(tripId), place.id));
        return place;
      },
      updatePlace: (tripId, placeId, input) => {
        const place = updatePlace(String(tripId), String(placeId), input as Parameters<typeof updatePlace>[2]);
        if (place === null) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'place:updated', { place });
        mirrorJourneys(() => onPlaceUpdated(Number(placeId)));
        return place;
      },
      deletePlace: (tripId, placeId) => {
        // Scope the id to the trip before anything else: onPlaceDeleted keys on the
        // place alone, so an id belonging to a foreign trip would detach that trip's
        // journey entries even though the delete below refuses it.
        if (!getPlace(String(tripId), String(placeId))) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
        // Ahead of the DELETE, like the REST route and the MCP tool: journey_entries
        // .source_place_id is ON DELETE SET NULL, so afterwards the hook finds nothing
        // left to detach and the entries linger as orphans.
        mirrorJourneys(() => onPlaceDeleted(Number(placeId)));
        const deleted = deletePlace(String(tripId), String(placeId));
        if (!deleted) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'place:deleted', { placeId });
        return { deleted: true };
      },
      // --- Days (day_edit). getDay scopes the row to the trip before any write. ---
      canEditDays: (tripId, userId) => this.canEditTripAs('day_edit', tripId, userId),
      createDay: (tripId, input) => {
        const i = input as { date?: string; notes?: string };
        const day = this.days.create(tripId, i.date, i.notes);
        this.realtime.broadcast(tripId, 'day:created', { day });
        return day;
      },
      updateDay: (tripId, dayId, input) => {
        const current = this.days.getDay(dayId, tripId);
        if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
        const day = this.days.update(dayId, current, input as { notes?: string; title?: string | null });
        this.realtime.broadcast(tripId, 'day:updated', { day });
        return day;
      },
      deleteDay: (tripId, dayId) => {
        const current = this.days.getDay(dayId, tripId);
        if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
        this.days.remove(dayId);
        this.realtime.broadcast(tripId, 'day:deleted', { dayId });
        return { deleted: true };
      },
      // --- Itinerary (day_edit). Both the day AND the place must belong to the trip,
      // so a plugin can't cross-link another trip's rows (AssignmentsService doesn't
      // self-check this — the controllers do, so we reproduce it here). ---
      assignPlaceToDay: (tripId, dayId, placeId, notes) => {
        if (!this.assignments.dayExists(dayId, tripId)) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
        if (!this.assignments.placeExists(placeId, tripId)) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
        const assignment = this.assignments.createAssignment(dayId, placeId, notes);
        this.realtime.broadcast(tripId, 'assignment:created', { assignment });
        this.assignments.reconcile(tripId);
        return assignment;
      },
      unassignPlace: (tripId, assignmentId) => {
        const existing = this.assignments.getAssignmentForTrip(assignmentId, tripId);
        if (!existing) throw new ForbiddenResource(`no assignment ${assignmentId} on trip ${tripId}`);
        this.assignments.deleteAssignment(assignmentId);
        // Same payload shape as the REST/MCP delete, so client stores can
        // evict the assignment from the right day. The dayId is what the client
        // reducer keys the eviction on — without it nothing leaves the day.
        this.realtime.broadcast(tripId, 'assignment:deleted', { assignmentId, dayId: existing.day_id });
        // Create, delete, move and time re-mirror the linked journey skeletons
        // afterwards, in the controller and in the MCP tool alike (reorder,
        // transport and participants don't). Without it an open journey keeps
        // the removed place until the next reload. No sid — a plugin has no
        // originating socket.
        this.assignments.reconcile(tripId);
        return { deleted: true };
      },
      // --- Trip creation (trip_create; owner = acting user). No broadcast — a new trip
      // is only visible to its owner, who refetches (same as the REST POST). ---
      canCreateTrip: (userId) => {
        const u = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
        return this.permissions.checkPermission('trip_create', u?.role ?? 'user', null, userId, false);
      },
      createTripForUser: (userId, input) => {
        try {
          const result = this.trips.create(userId, input as unknown as Parameters<TripsService['create']>[1]);
          return result.trip;
        } catch (e) {
          if (e instanceof ValidationError) throw new BadParams(e.message);
          throw e;
        }
      },
      // --- Exchange rates: the same cached upstream feed the budget uses (tenant-free). ---
      getRates: (base) => this.exchangeRates.getRates(base),
      // --- Trip (trip_edit). Only the schema-writable fields reach updateTrip; its
      // NotFound/Validation errors are mapped to clean RPC codes. ---
      canEditTrip: (tripId, userId) => this.canEditTripAs('trip_edit', tripId, userId),
      updateTrip: (tripId, userId, input) => {
        // The REST controller gates two fields behind their OWN admin-configurable
        // permissions, separate from trip_edit — reproduce that here so a plugin (or
        // its member user) can't archive or re-cover a trip it may only edit.
        if ('is_archived' in input && !this.canEditTripAs('trip_archive', tripId, userId)) {
          throw new ForbiddenResource(`no permission to archive trip ${tripId}`);
        }
        if ('cover_image' in input && !this.canEditTripAs('trip_cover_upload', tripId, userId)) {
          throw new ForbiddenResource(`no permission to change the cover of trip ${tripId}`);
        }
        const u = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
        try {
          // The no-rebase updateTrip core — parity with the legacy host path,
          // which never re-anchored the budget currency.
          const result = this.trips.updateTrip(tripId, userId, input as Parameters<TripsService['updateTrip']>[2], u?.role ?? 'user');
          this.realtime.broadcast(tripId, 'trip:updated', { trip: result.updatedTrip });
          return result.updatedTrip;
        } catch (e) {
          if (e instanceof ValidationError) throw new BadParams(e.message);
          if (e instanceof NotFoundError) throw new ForbiddenResource(e.message);
          throw e;
        }
      },
      // --- Cross-trip reads. The membership predicate is baked into listTrips, so a
      // plugin only ever sees the acting user's own trips/reservations (no raw
      // cross-tenant SELECT). Reuses the same hydrated services as the REST paths. ---
      listTripsForUser: (userId) => this.trips.list(userId, null),
      listReservationsForUser: (userId) => {
        const trips = this.trips.list(userId, null) as Array<{ id: number }>;
        return trips.flatMap((t) => this.reservations.list(String(t.id)));
      },
      // --- Trip-scoped hydrated reads (membership already checked by tripRead). Same
      // services as the REST GETs, so plugins see the exact planner shapes. ---
      listTripDays: (tripId) => (this.days.list(tripId) as { days: unknown[] }).days,
      listTripReservations: (tripId) => this.reservations.list(String(tripId)),
      listTripAccommodations: (tripId) => this.days.listAccommodations(tripId) as unknown[],
      // --- Accommodations (lodging blocks, day_edit). Delegates to DaysService so the
      // partner hotel reservation, the metadata sync and the delete cascade behave
      // exactly like the accommodations REST controller, cascade broadcasts included. ---
      createAccommodation: (tripId, input) => {
        const i = input as { place_id: number | string; start_day_id: number | string; end_day_id: number | string; check_in?: string | null; check_in_end?: string | null; check_out?: string | null; confirmation?: string | null; notes?: string | null };
        const placeId = Math.trunc(Number(i.place_id));
        const startDayId = Math.trunc(Number(i.start_day_id));
        const endDayId = Math.trunc(Number(i.end_day_id));
        if (!placeId || !startDayId || !endDayId) throw new BadParams('place_id, start_day_id, and end_day_id are required');
        const errors = this.days.validateAccommodationRefs(tripId, placeId, startDayId, endDayId);
        if (errors.length > 0) throw new ForbiddenResource(errors[0].message);
        const accommodation = this.days.createAccommodation(tripId, {
          place_id: placeId, start_day_id: startDayId, end_day_id: endDayId,
          check_in: i.check_in ?? undefined, check_in_end: i.check_in_end ?? undefined,
          check_out: i.check_out ?? undefined, confirmation: i.confirmation ?? undefined, notes: i.notes ?? undefined,
        });
        this.realtime.broadcast(tripId, 'accommodation:created', { accommodation });
        this.realtime.broadcast(tripId, 'reservation:created', {});
        return accommodation;
      },
      updateAccommodation: (tripId, accommodationId, input) => {
        const existing = this.days.getAccommodation(accommodationId, tripId);
        if (!existing) throw new ForbiddenResource(`no accommodation ${accommodationId} on trip ${tripId}`);
        const i = input as { place_id?: number; start_day_id?: number; end_day_id?: number; check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string };
        const errors = this.days.validateAccommodationRefs(tripId, i.place_id, i.start_day_id, i.end_day_id);
        if (errors.length > 0) throw new ForbiddenResource(errors[0].message);
        const accommodation = this.days.updateAccommodation(accommodationId, existing, i);
        this.realtime.broadcast(tripId, 'accommodation:updated', { accommodation });
        return accommodation;
      },
      deleteAccommodation: (tripId, accommodationId) => {
        if (!this.days.getAccommodation(accommodationId, tripId)) throw new ForbiddenResource(`no accommodation ${accommodationId} on trip ${tripId}`);
        const { linkedReservationId, deletedBudgetItemId } = this.days.deleteAccommodation(accommodationId);
        if (linkedReservationId) this.realtime.broadcast(tripId, 'reservation:deleted', { reservationId: linkedReservationId });
        if (deletedBudgetItemId) this.realtime.broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId });
        this.realtime.broadcast(tripId, 'accommodation:deleted', { accommodationId });
        return { deleted: true };
      },
      // --- User-scoped addon reads (the acting user's own data across all trips). Each
      // reuses the same service the addon's REST/MCP path uses; the addon-enabled gate
      // mirrors the app (a disabled addon has nothing to read). ---
      listJournalsForUser: (userId) => { requireAddon(ADDON_IDS.JOURNEY, 'journey'); return listJourneys(userId); },
      journalEntriesForUser: (userId, journeyId) => {
        requireAddon(ADDON_IDS.JOURNEY, 'journey');
        // listEntries self-gates via canAccessJourney(journeyId, userId) → null if the
        // user can't see it (owner/contributor only).
        const entries = listJournalEntriesSvc(journeyId, userId);
        if (entries === null) throw new ForbiddenResource(`no access to journey ${journeyId}`);
        return entries;
      },
      atlasVisitedForUser: (userId) => {
        requireAddon(ADDON_IDS.ATLAS, 'atlas');
        return { countries: listVisitedCountries(userId), regions: listManuallyVisitedRegions(userId) };
      },
      atlasBucketForUser: (userId) => { requireAddon(ADDON_IDS.ATLAS, 'atlas'); return listBucketList(userId) as unknown[]; },
      vacayForUser: (userId) => { requireAddon(ADDON_IDS.VACAY, 'vacay'); return this.vacay.getPlanData(userId); },
      listCollectionsForUser: (userId) => { requireAddon(ADDON_IDS.COLLECTIONS, 'collections'); return listCollections(userId); },
      getCollectionForUser: (userId, id) => { requireAddon(ADDON_IDS.COLLECTIONS, 'collections'); return getCollection(userId, id); },
      // --- Collections write. The service self-gates per-collection role (assertAccess/
      // assertCanEdit throw status-tagged errors) — map those to the RPC error codes. ---
      createCollectionForUser: (userId, input) => {
        requireAddon(ADDON_IDS.COLLECTIONS, 'collections');
        return mapCollectionError(() => createCollection(userId, input as never));
      },
      updateCollectionForUser: (userId, id, input) => {
        requireAddon(ADDON_IDS.COLLECTIONS, 'collections');
        return mapCollectionError(() => updateCollection(userId, id, input as never, undefined));
      },
      saveCollectionPlace: (userId, input) => {
        requireAddon(ADDON_IDS.COLLECTIONS, 'collections');
        return mapCollectionError(() => saveCollectionPlaceSvc(userId, input as never, undefined));
      },
      copyCollectionToTrip: (userId, input) => {
        requireAddon(ADDON_IDS.COLLECTIONS, 'collections');
        return mapCollectionError(() => copyCollectionToTripSvc(userId, input as never));
      },
      deleteCollectionPlace: (userId, placeId) => {
        requireAddon(ADDON_IDS.COLLECTIONS, 'collections');
        mapCollectionError(() => deleteCollectionPlaceSvc(userId, placeId, undefined));
        return { deleted: true };
      },
      // --- Atlas write: plain uid-scoped rows, no broadcasts in the service. ---
      markCountryVisited: (userId, code) => { requireAddon(ADDON_IDS.ATLAS, 'atlas'); markCountryVisited(userId, code); return { visited: true }; },
      unmarkCountryVisited: (userId, code) => { requireAddon(ADDON_IDS.ATLAS, 'atlas'); unmarkCountryVisited(userId, code); return { visited: false }; },
      markRegionVisited: (userId, regionCode, regionName, countryCode) => {
        requireAddon(ADDON_IDS.ATLAS, 'atlas');
        markRegionVisited(userId, regionCode, regionName, countryCode);
        return { visited: true };
      },
      unmarkRegionVisited: (userId, regionCode) => { requireAddon(ADDON_IDS.ATLAS, 'atlas'); unmarkRegionVisited(userId, regionCode); return { visited: false }; },
      createBucketItem: (userId, input) => { requireAddon(ADDON_IDS.ATLAS, 'atlas'); return createBucketItemSvc(userId, input as never); },
      deleteBucketItem: (userId, itemId) => {
        requireAddon(ADDON_IDS.ATLAS, 'atlas');
        if (!deleteBucketItemSvc(userId, itemId)) throw new ForbiddenResource(`no bucket item ${itemId} for this user`);
        return { deleted: true };
      },
      // --- Vacay write: the plan is the ACTING USER's active plan (resolved host-side);
      // the service broadcasts to plan users itself. ---
      vacayToggleEntry: (userId, date) => { requireAddon(ADDON_IDS.VACAY, 'vacay'); return this.vacay.toggleEntry(userId, this.vacay.getActivePlanId(userId), date, 1, 'vacation', undefined); },
      vacayToggleCompanyHoliday: (userId, date, note) => {
        requireAddon(ADDON_IDS.VACAY, 'vacay');
        return this.vacay.toggleCompanyHoliday(this.vacay.getActivePlanId(userId), date, note, undefined);
      },
      // --- Journal write: journeyService.canEdit self-gates each call (owner/contributor). ---
      createJournalEntry: (userId, journeyId, input) => {
        requireAddon(ADDON_IDS.JOURNEY, 'journey');
        const entry = createJournalEntrySvc(journeyId, userId, input as never);
        if (!entry) throw new ForbiddenResource(`no editable journey ${journeyId} for this user`);
        return entry;
      },
      updateJournalEntry: (userId, entryId, input) => {
        requireAddon(ADDON_IDS.JOURNEY, 'journey');
        const entry = updateJournalEntrySvc(entryId, userId, input as never);
        if (!entry) throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
        return entry;
      },
      deleteJournalEntry: (userId, entryId) => {
        requireAddon(ADDON_IDS.JOURNEY, 'journey');
        if (!deleteJournalEntrySvc(entryId, userId)) throw new ForbiddenResource(`no editable journal entry ${entryId} for this user`);
        return { deleted: true };
      },
      createJournal: (userId, input) => {
        requireAddon(ADDON_IDS.JOURNEY, 'journey');
        const title = typeof (input as { title?: unknown }).title === 'string' ? String((input as { title: string }).title).trim() : '';
        if (!title) throw new BadParams('journal title is required');
        return createJourneySvc(userId, { title, subtitle: (input as { subtitle?: string }).subtitle, trip_ids: (input as { trip_ids?: number[] }).trip_ids });
      },
      deleteJournal: (userId, journeyId) => {
        requireAddon(ADDON_IDS.JOURNEY, 'journey');
        if (!deleteJourneySvc(journeyId, userId)) throw new ForbiddenResource(`no deletable journal ${journeyId} for this user`);
        return { deleted: true };
      },
      // Day notes are core (no addon) and trip-scoped; membership is enforced by the host.
      listDayNotes: (tripId, dayId) => this.dayNotes.list(dayId, tripId),
      // --- Day notes write (day_edit). The day must belong to the trip; broadcasts the
      // same dayNote:* events the REST controller emits so open sessions update live. ---
      createDayNote: (tripId, dayId, input) => {
        if (!this.dayNotes.dayExists(dayId, tripId)) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
        const i = input as { text?: string; time?: string; icon?: string; sort_order?: number };
        const note = this.dayNotes.create(dayId, tripId, i.text ?? '', i.time, i.icon, i.sort_order);
        this.realtime.broadcast(tripId, 'dayNote:created', { dayId, note }, undefined);
        return note;
      },
      updateDayNote: (tripId, dayId, noteId, input) => {
        const current = this.dayNotes.getNote(noteId, dayId, tripId);
        if (!current) throw new ForbiddenResource(`no note ${noteId} on day ${dayId}`);
        const note = this.dayNotes.update(noteId, current as never, input as { text?: string; time?: string; icon?: string; sort_order?: number });
        this.realtime.broadcast(tripId, 'dayNote:updated', { dayId, note }, undefined);
        return note;
      },
      deleteDayNote: (tripId, dayId, noteId) => {
        const current = this.dayNotes.getNote(noteId, dayId, tripId);
        if (!current) throw new ForbiddenResource(`no note ${noteId} on day ${dayId}`);
        this.dayNotes.remove(noteId);
        this.realtime.broadcast(tripId, 'dayNote:deleted', { noteId, dayId }, undefined);
        return { deleted: true };
      },
      // --- Reservations (bookings, reservation_edit). Delegates to ReservationsService
      // so the accommodation/budget-sync/notification/broadcast side effects match the
      // web app EXACTLY. socketId is undefined — a plugin has no originating socket. ---
      canEditReservations: (tripId, userId) => this.canEditTripAs('reservation_edit', tripId, userId),
      createReservation: (tripId, input, actingUserId) => {
        const { reservation, accommodationCreated } = this.reservations.create(String(tripId), input as never);
        if (accommodationCreated) this.realtime.broadcast(tripId, 'accommodation:created', {}, undefined);
        const i = input as { title?: string; type?: string; create_budget_entry?: unknown };
        this.reservations.syncBudgetOnCreate(String(tripId), reservation.id, i.title ?? '', i.type, i.create_budget_entry as never, undefined);
        this.realtime.broadcast(tripId, 'reservation:created', { reservation }, undefined);
        this.notifyBooking(actingUserId, tripId, i.title ?? '', i.type ?? '');
        return reservation;
      },
      updateReservation: (tripId, reservationId, input, actingUserId) => {
        const current = this.reservations.getReservation(String(reservationId), String(tripId));
        if (!current) throw new ForbiddenResource(`no reservation ${reservationId} on trip ${tripId}`);
        const { reservation, accommodationChanged } = this.reservations.update(String(reservationId), String(tripId), input as never, current as never);
        if (accommodationChanged) this.realtime.broadcast(tripId, 'accommodation:updated', {}, undefined);
        const cur = current as { title: string; type?: string };
        const i = input as { title?: string; type?: string; create_budget_entry?: unknown };
        this.reservations.syncBudgetOnUpdate(String(tripId), String(reservationId), i.title ?? '', i.type, cur.title, cur.type, i.create_budget_entry as never, undefined);
        this.realtime.broadcast(tripId, 'reservation:updated', { reservation }, undefined);
        this.notifyBooking(actingUserId, tripId, i.title || cur.title, i.type || cur.type || '');
        return reservation;
      },
      deleteReservation: (tripId, reservationId, actingUserId) => {
        const { deleted, accommodationDeleted, deletedBudgetItemId } = this.reservations.remove(String(reservationId), String(tripId));
        if (!deleted) throw new ForbiddenResource(`no reservation ${reservationId} on trip ${tripId}`);
        if (accommodationDeleted) this.realtime.broadcast(tripId, 'accommodation:deleted', { accommodationId: deleted.accommodation_id }, undefined);
        if (deletedBudgetItemId) this.realtime.broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId }, undefined);
        this.realtime.broadcast(tripId, 'reservation:deleted', { reservationId: Number(reservationId) }, undefined);
        this.notifyBooking(actingUserId, tripId, deleted.title, deleted.type || '');
        return { deleted: true };
      },
      // --- Packing (packing_edit). Reuses PackingService + replicates the #858
      // privacy-scoped broadcasts (create/delete via emitPackingToViewers, update via
      // the four-case broadcastPackingUpdate) so a private item never leaks room-wide. ---
      canEditPacking: (tripId, userId) => this.canEditTripAs('packing_edit', tripId, userId),
      createPackingItem: (tripId, input, actingUserId) => {
        const i = input as { name: string; category?: string; checked?: boolean; is_private?: boolean; visibility?: 'common' | 'personal' | 'shared'; recipient_ids?: number[] };
        const item = this.packing.createItem(String(tripId), i, actingUserId) as PackingPrivacy;
        emitPackingToViewers(this.realtime, tripId, 'packing:created', { item }, item);
        return item;
      },
      updatePackingItem: (tripId, itemId, input, actingUserId) => {
        // Privacy BEFORE the write, so a public<->private toggle routes correctly.
        const before = this.packing.getItemPrivacy(tripId, itemId);
        const updated = this.packing.updateItem(String(tripId), String(itemId), input as never, Object.keys(input), undefined, actingUserId);
        if (!updated) throw new ForbiddenResource(`no packing item ${itemId} on trip ${tripId}`);
        if (isUpdateConflict(updated)) throw new BadParams('packing item was modified concurrently');
        broadcastPackingUpdate(this.realtime, tripId, itemId, updated as PackingPrivacy, !!before?.is_private);
        return updated;
      },
      deletePackingItem: (tripId, itemId) => {
        const deleted = this.packing.deleteItem(String(tripId), String(itemId)) as PackingPrivacy | null;
        if (!deleted) throw new ForbiddenResource(`no packing item ${itemId} on trip ${tripId}`);
        emitPackingToViewers(this.realtime, tripId, 'packing:deleted', { itemId }, deleted);
        return { deleted: true };
      },
      // --- Packing bags (no privacy — plain room broadcasts). ---
      listPackingBags: (tripId) => this.packing.listBags(String(tripId)) as unknown[],
      createPackingBag: (tripId, input) => {
        const i = input as { name: string; color?: string };
        const bag = this.packing.createBag(String(tripId), { name: i.name, color: i.color });
        this.realtime.broadcast(tripId, 'packing:bag-created', { bag }, undefined);
        return bag;
      },
      updatePackingBag: (tripId, bagId, input) => {
        const bag = this.packing.updateBag(String(tripId), String(bagId), input as never, Object.keys(input));
        if (!bag) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'packing:bag-updated', { bag }, undefined);
        return bag;
      },
      deletePackingBag: (tripId, bagId) => {
        if (!this.packing.deleteBag(String(tripId), String(bagId))) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'packing:bag-deleted', { bagId }, undefined);
        return { deleted: true };
      },
      setPackingBagMembers: (tripId, bagId, userIds) => {
        const members = this.packing.setBagMembers(String(tripId), String(bagId), userIds);
        if (!members) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'packing:bag-members-updated', { bagId, members }, undefined);
        return members;
      },
      // --- Read-convenience: weather (host cache, tenant-free), categories (global), roster ---
      getWeather: (lat, lng, date) => getWeather(String(lat), String(lng), date, 'en'),
      listCategories: () => this.categories.list() as unknown[],
      tripMembers: (tripId) =>
        this.db.prepare('SELECT u.id, u.username, u.display_name, u.avatar FROM trip_members tm JOIN users u ON u.id = tm.user_id WHERE tm.trip_id = ?').all(tripId) as unknown[],
      // --- Tags (the acting user's own; ownership re-checked before a write). ---
      listTagsForUser: (userId) => this.tags.list(userId) as unknown[],
      createTagForUser: (userId, name, color) => this.tags.create(userId, name, color),
      updateTagForUser: (userId, tagId, name, color) => {
        if (!this.tags.getByIdAndUser(tagId, userId)) throw new ForbiddenResource(`no tag ${tagId} for this user`);
        return this.tags.update(tagId, name, color);
      },
      deleteTagForUser: (userId, tagId) => {
        if (!this.tags.getByIdAndUser(tagId, userId)) throw new ForbiddenResource(`no tag ${tagId} for this user`);
        this.tags.remove(tagId);
        return { deleted: true };
      },
      // --- Todos (core, trip-scoped; the app's 'packing_edit' permission). ---
      canEditTodos: (tripId, userId) => this.canEditTripAs('packing_edit', tripId, userId),
      listTodos: (tripId) => this.todos.listItems(String(tripId)) as unknown[],
      createTodo: (tripId, input) => {
        const item = this.todos.createItem(String(tripId), input as never);
        this.realtime.broadcast(tripId, 'todo:created', { item }, undefined);
        return item;
      },
      updateTodo: (tripId, todoId, input) => {
        const updated = this.todos.updateItem(String(tripId), String(todoId), input as never, Object.keys(input));
        if (!updated) throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'todo:updated', { item: updated }, undefined);
        return updated;
      },
      deleteTodo: (tripId, todoId) => {
        if (!this.todos.deleteItem(String(tripId), String(todoId))) throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
        this.realtime.broadcast(tripId, 'todo:deleted', { itemId: todoId }, undefined);
        return { deleted: true };
      },
      // --- Plugin metadata (db:meta). A per-plugin namespaced key/value store keyed
      // to a core entity; the plugin only ever sees rows tagged with its own id. ---
      metaEntityTrip: (entityType, entityId) => {
        if (entityType === 'trip') {
          return (this.db.prepare('SELECT id FROM trips WHERE id = ?').get(entityId) as { id: number } | undefined)?.id;
        }
        // Each of these tables has a NOT NULL trip_id, so the metadata gate resolves to
        // the owning trip and reuses the standard canAccessTrip / *_edit checks.
        const table = entityType === 'place' ? 'places'
          : entityType === 'day' ? 'days'
          : entityType === 'reservation' ? 'reservations'
          : 'day_accommodations'; // accommodation
        return (this.db.prepare(`SELECT trip_id FROM ${table} WHERE id = ?`).get(entityId) as { trip_id: number } | undefined)?.trip_id;
      },
      metaGet: (entityType, entityId, key) => {
        const row = this.db.prepare('SELECT value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
          .get(id, entityType, entityId, key) as { value: string } | undefined;
        if (!row) return null;
        try { return JSON.parse(row.value); } catch { return null; }
      },
      metaSet: (entityType, entityId, key, value) => {
        if (key.length > META_KEY_MAX) throw new BadParams(`metadata key too long (>${META_KEY_MAX} chars)`);
        const json = JSON.stringify(value ?? null);
        if (json.length > META_VALUE_MAX) throw new BadParams(`metadata value too large (>${META_VALUE_MAX} bytes)`);
        const exists = this.db.prepare('SELECT 1 FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
          .get(id, entityType, entityId, key);
        if (!exists) {
          const { n } = this.db.prepare('SELECT COUNT(*) AS n FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=?')
            .get(id, entityType, entityId) as { n: number };
          if (n >= META_KEYS_MAX) throw new BadParams(`too many metadata keys on this ${entityType} (max ${META_KEYS_MAX})`);
        }
        this.db.prepare(`INSERT INTO plugin_entity_metadata (plugin_id, entity_type, entity_id, key, value, updated_at)
                    VALUES (?, ?, ?, ?, ?, datetime('now'))
                    ON CONFLICT(plugin_id, entity_type, entity_id, key)
                    DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
          .run(id, entityType, entityId, key, json);
        return { key, value: value ?? null };
      },
      metaList: (entityType, entityId) => {
        const list = this.db.prepare('SELECT key, value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? ORDER BY key')
          .all(id, entityType, entityId) as Array<{ key: string; value: string }>;
        const out: Record<string, unknown> = {};
        for (const r of list) { try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = null; } }
        return out;
      },
      metaDelete: (entityType, entityId, key) => {
        const res = this.db.prepare('DELETE FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
          .run(id, entityType, entityId, key);
        return { deleted: res.changes > 0 };
      },
    });
  }
}
