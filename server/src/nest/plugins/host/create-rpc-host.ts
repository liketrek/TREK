import { db, canAccessTrip } from '../../../db/database';
import { broadcast, broadcastToUser } from '../../../websocket';
import { listBudgetItems } from '../../../services/budgetService';
import { listItems as listPackingItemsSvc, createItem as createPackingItemSvc, updateItem as updatePackingItemSvc, deleteItem as deletePackingItemSvc, listBags, createBag as createBagSvc, updateBag as updateBagSvc, deleteBag as deleteBagSvc, setBagMembers } from '../../../services/packingService';
import { isUpdateConflict } from '../../../services/conflictResult';
import { getWeather } from '../../../services/weatherService';
import { listCategories } from '../../../services/categoryService';
import { listTags, createTag, updateTag, deleteTag, getTagByIdAndUser } from '../../../services/tagService';
import { listItems as listTodosSvc, createItem as createTodoSvc, updateItem as updateTodoSvc, deleteItem as deleteTodoSvc } from '../../../services/todoService';
import { listFiles, createFile, createFileLink, getFileById, updateFile, softDeleteFile, findForeignLinkTarget, resolveFilePath, BLOCKED_EXTENSIONS, filesDir } from '../../../services/fileService';
import { createNote as createCollabNoteSvc, createPoll as createCollabPollSvc, votePoll as voteCollabPollSvc, createMessage as createCollabMessageSvc, listNotes as listCollabNotesSvc, listPolls as listCollabPollsSvc, listMessages as listCollabMessagesSvc } from '../../../services/collabService';
import { getRates as getExchangeRates } from '../../../services/exchangeRateService';
import { joinTripAsMember } from '../../../services/tripMembership';
import { send as sendNotification } from '../../../services/notificationService';
import { resolveLlmConfig } from '../../llm-parse/llm-config.resolver';
import { createLlmClient } from '../../llm-parse/llm-client.factory';
import { readUserSettingDecrypted } from '../plugins.service';
import { PluginOAuthService } from '../plugin-oauth.service';
import fsMod from 'node:fs';
import pathMod from 'node:path';
import { randomUUID } from 'node:crypto';
import { checkPermission } from '../../../services/permissions';
import { listTrips, updateTrip, createTrip, removeMember as removeTripMemberSvc, NotFoundError, ValidationError } from '../../../services/tripService';
import { createPlace, updatePlace, deletePlace } from '../../../services/placeService';
import { createDay, getDay, updateDay, deleteDay, listDays, listAccommodations, validateAccommodationRefs, createAccommodation as createAccommodationSvc, getAccommodation, updateAccommodation as updateAccommodationSvc, deleteAccommodation as deleteAccommodationSvc } from '../../../services/dayService';
import { createAssignment, deleteAssignment, dayExists, placeExists, getAssignmentForTrip } from '../../../services/assignmentService';
import { isAddonEnabled } from '../../../services/adminService';
import { isDemoEmail } from '../../../services/demo';
import { ADDON_IDS } from '../../../addons';
import { listJourneys, listEntries as listJournalEntriesSvc, createEntry as createJournalEntrySvc, updateEntry as updateJournalEntrySvc, deleteEntry as deleteJournalEntrySvc, createJourney as createJourneySvc, deleteJourney as deleteJourneySvc } from '../../../services/journeyService';
import { listVisitedCountries, listManuallyVisitedRegions, listBucketList, markCountryVisited, unmarkCountryVisited, markRegionVisited, unmarkRegionVisited, createBucketItem as createBucketItemSvc, deleteBucketItem as deleteBucketItemSvc } from '../../../services/atlasService';
import { getPlanData, getActivePlanId, toggleEntry as vacayToggleEntrySvc, toggleCompanyHoliday as vacayToggleCompanyHolidaySvc } from '../../../services/vacayService';
import { listNotes, createNote, getNote, updateNote, deleteNote, dayExists as dayNoteDayExists } from '../../../services/dayNoteService';
import { listCollections, getCollection, createCollection, updateCollection, savePlace as saveCollectionPlaceSvc, copyToTrip as copyCollectionToTripSvc, deletePlace as deleteCollectionPlaceSvc } from '../../../services/collectionsService';
import { BudgetService } from '../../budget/budget.service';
import { ReservationsService } from '../../reservations/reservations.service';
import { notifyBookingChange } from '../../../services/reservationService';
import { PluginDataDb } from './plugin-data.service';
import { DailyBudget, DEFAULT_DAILY_BUDGET } from './daily-budget';
import { PluginRpcHost, ForbiddenResource, BadParams } from './rpc-host';
import { appendAudit } from './plugin-audit';

/**
 * The trip-access + role gate used by every planner write, mirroring the app's
 * per-domain `canEdit` (canAccessTrip + checkPermission for the entity's *_edit
 * action). Returns false — never throws — so the caller maps it to a clean
 * RESOURCE_FORBIDDEN.
 */
function canEditTripAs(action: string, tripId: number, userId: number): boolean {
  const trip = canAccessTrip(tripId, userId) as { user_id: number } | undefined;
  if (!trip) return false;
  const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
  if (!u) return false;
  return checkPermission(action, u.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
}

// Reused for costs.create so a plugin write frozen-FX and members/payers logic
// matches a normal web-app budget write exactly (it has no injected deps).
const budgetSvc = new BudgetService();
const reservationsSvc = new ReservationsService();
// The booking notification the REST controller sends after a create/update/delete
// is fire-and-forget, so it never blocks the plugin write.
function notifyBooking(actingUserId: number, tripId: number, booking: string, type: string): void {
  notifyBookingChange(tripId, actingUserId, booking, type);
}

// A subsystem read is refused when its addon is off — parity with the app, where a
// disabled addon means there is simply nothing to read (same shape as the Costs gate).
function requireAddon(addonId: string, noun: string): void {
  if (!isAddonEnabled(addonId)) throw new ForbiddenResource(`the ${noun} addon is disabled`);
}

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

// --- #858 packing privacy: viewer-scoped fan-out replicated from packing.controller +
// packing.service (their helpers aren't exported). A private item's events reach ONLY
// its owner (+ recipients for a shared item), never the whole trip room; passing the
// wrong onlyUserId — or forgetting to drop a freshly-privatized item from the room —
// leaks it. Keep in lockstep with packing.controller.broadcastUpdate/emitToViewers. ---
type PackingPrivacy = { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] };

function packingItemPrivacy(tripId: number, itemId: number): { is_private?: number; owner_id?: number | null } | undefined {
  return db.prepare('SELECT is_private, owner_id FROM packing_items WHERE id = ? AND trip_id = ?').get(itemId, tripId) as
    | { is_private?: number; owner_id?: number | null }
    | undefined;
}

function packingViewersOf(item: PackingPrivacy | null | undefined): number[] | null {
  if (!item || !item.is_private) return null; // Common — visible to the whole room
  return [item.owner_id, ...(item.recipients || []).map((r) => r.user_id)].filter((x): x is number => x != null);
}

/** CREATE/DELETE fan-out: whole room for a Common item, else owner + recipients only. */
function emitPackingToViewers(tripId: number, event: string, payload: Record<string, unknown>, item: PackingPrivacy): void {
  const viewers = packingViewersOf(item);
  if (viewers === null) {
    broadcast(tripId, event, payload, undefined);
    return;
  }
  for (const uid of new Set(viewers)) if (uid != null) broadcast(tripId, event, payload, undefined, uid);
}

/** An item event delivered owner-only when the item is private (else to the room). */
function broadcastPackingItem(tripId: number, event: string, payload: Record<string, unknown>, item: PackingPrivacy): void {
  const onlyUserId = item?.is_private && item.owner_id != null ? item.owner_id : undefined;
  broadcast(tripId, event, payload, undefined, onlyUserId);
}

/** The four public<->private transitions (packing.controller.broadcastUpdate). `wasPrivate`
 * is read BEFORE the write — getting this wrong LEAKS a freshly-privatized item. */
function broadcastPackingUpdate(tripId: number, itemId: number, item: PackingPrivacy, wasPrivate: boolean): void {
  const nowPrivate = !!item.is_private;
  if (nowPrivate) {
    if (wasPrivate) {
      broadcastPackingItem(tripId, 'packing:updated', { item }, item); // stays private -> owner-only
    } else {
      broadcast(tripId, 'packing:deleted', { itemId }, undefined); // public->private: drop from the room...
      broadcastPackingItem(tripId, 'packing:created', { item }, item); // ...then re-add for the owner
    }
  } else {
    if (wasPrivate) broadcast(tripId, 'packing:created', { item }, undefined); // private->public: add for members who lacked it
    broadcast(tripId, 'packing:updated', { item }, undefined);
  }
}

// Quotas for plugin entity metadata (db:meta) — a cheap disk-DoS guard on the
// shared trek.db volume. Generous for real use, small enough to bound abuse.
const META_VALUE_MAX = 64 * 1024; // serialized JSON bytes per value
const META_KEY_MAX = 256; // key string length (the key is attacker-controlled too)
const META_KEYS_MAX = 100; // keys per (plugin, entity)

/**
 * Wires a plugin's capability host to the REAL privileged modules (#plugins,
 * M1). This is the ONLY plugin file that imports db/websocket — it runs in the
 * host (parent), never in the child. Broadcasts are force-namespaced to
 * `plugin:{id}:{event}` so a plugin can't forge a core event.
 */

const dataDbs = new Map<string, PluginDataDb>();

export function getPluginDataDb(id: string): PluginDataDb {
  let d = dataDbs.get(id);
  // A cached handle can be CLOSED without being evicted: the supervisor's terminal
  // failure paths (activation timeout / load-error / crash auto-disable) call
  // rpcHost.dispose() → PluginDataDb.close() directly, never closePluginDataDb. A
  // plain admin re-enable would then reuse the closed handle and every db.* call
  // would throw 'database connection is not open'. Recreate when the handle is shut.
  if (!d || !d.isOpen()) {
    d = new PluginDataDb(id);
    dataDbs.set(id, d);
  }
  return d;
}

export function closePluginDataDb(id: string): void {
  dataDbs.get(id)?.close();
  dataDbs.delete(id);
  budgets.delete(id);
}

// Per-plugin daily broker budgets (ai/notify). Lazily created + seeded from the
// local capability audit — which already records every ai/notify call today — so a
// restart continues the same UTC day instead of resetting the budget. In-memory,
// nothing persisted or phoned home.
const budgets = new Map<string, DailyBudget>();
function budgetFor(id: string): DailyBudget {
  let b = budgets.get(id);
  if (!b) {
    const now = Date.now();
    const since = new Date(now).toISOString().slice(0, 10) + 'T00:00:00';
    const rows = db
      .prepare("SELECT method, COUNT(*) AS n FROM plugin_capability_audit WHERE plugin_id = ? AND code = 'ok' AND ts >= ? AND method IN ('ai.complete','ai.extract','notify.send') GROUP BY method")
      .all(id, since) as Array<{ method: string; n: number }>;
    let ai = 0, notify = 0;
    for (const r of rows) {
      if (r.method === 'notify.send') notify += r.n;
      else ai += r.n; // ai.complete + ai.extract
    }
    b = new DailyBudget(DEFAULT_DAILY_BUDGET, now, { ai, notify });
    budgets.set(id, b);
  }
  return b;
}

/** Today's broker usage for one plugin (admin view). Seeds the counter if unseen. */
export function pluginBudgetUsage(id: string): ReturnType<DailyBudget['used']> {
  return budgetFor(id).used(Date.now());
}

/** Routes inter-plugin calls/events; supplied by PluginRuntimeService (owns the supervisor). */
export interface PluginCallRouter {
  callPlugin(callerId: string, targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown>;
  emitPluginEvent(sourceId: string, event: string, payload: unknown): void;
}

export function createRealRpcHost(id: string, granted: ReadonlySet<string>, router: PluginCallRouter): PluginRpcHost {
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
    db,
    canAccessTrip: (tripId, userId) => canAccessTrip(tripId, userId),
    // The router binds this host's plugin id as the caller/source.
    callPlugin: (targetId, fn, args, actingUserId) => router.callPlugin(id, targetId, fn, args, actingUserId),
    emitPluginEvent: (event, payload) => router.emitPluginEvent(id, event, payload),
    // Two users "share a trip" when both are owner-or-member of the same trip.
    canSeeUser: (actingUserId, targetUserId) =>
      !!db
        .prepare(
          `SELECT 1 FROM trips t
             LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
             LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
            WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
              AND (t.user_id = ? OR m2.user_id IS NOT NULL)
            LIMIT 1`,
        )
        .get(actingUserId, targetUserId, actingUserId, targetUserId),
    broadcastToTrip: (tripId, event, payload) => broadcast(tripId, `plugin:${id}:${event}`, payload),
    broadcastToUser: (userId, payload) => broadcastToUser(userId, { type: `plugin:${id}`, ...payload }),
    audit: (entry) => appendAudit(db, entry),
    // --- Costs (budget items) ---
    budgetAddonEnabled: () => isAddonEnabled(ADDON_IDS.BUDGET),
    // Same gate as a REST/MCP budget mutation: the acting user must have trip
    // access AND the 'budget_edit' permission for their global role.
    canEditCosts: (tripId, userId) => {
      const trip = canAccessTrip(tripId, userId) as { user_id: number } | undefined;
      if (!trip) return false;
      const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
      if (!u) return false;
      return checkPermission('budget_edit', u.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
    },
    // --- Read scopes (packing/files). Membership is checked by the host (tripRead);
    // these just delegate to the same services the REST paths use. ---
    listPackingItems: (tripId, userId) => listPackingItemsSvc(tripId, userId),
    listTripFiles: (tripId) => listFiles(tripId, false),
    // A file's bytes as base64, size-capped BEFORE the read so a 500MB video can't
    // be pulled (~667MB base64) through the IPC pipe. 10MB matches the plugin upload
    // cap; trashed files (deleted_at set) are refused like the download path.
    getTripFileContent: async (tripId, fileId) => {
      const CONTENT_MAX = 10 * 1024 * 1024;
      const file = getFileById(fileId, tripId) as { filename: string; original_name: string; mime_type: string | null; file_size: number | null; deleted_at: string | null } | undefined;
      if (!file || file.deleted_at) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
      if ((file.file_size ?? 0) > CONTENT_MAX) throw new BadParams(`file too large to read (>${CONTENT_MAX} bytes); use the download UI`);
      const { resolved, safe } = resolveFilePath(file.filename);
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
    canUploadFiles: (tripId, userId) => canEditTripAs('file_upload', tripId, userId),
    canEditFiles: (tripId, userId) => canEditTripAs('file_edit', tripId, userId),
    canDeleteFiles: (tripId, userId) => canEditTripAs('file_delete', tripId, userId),
    createTripFile: (tripId, input, actingUserId) => {
      // Mirror the REST upload guard (files.controller): a demo user must not write
      // bytes to the shared demo instance, even through a plugin's db:write:files.
      // Only resolve the email when demo mode is actually on — keeps the hot path
      // (and the schema surface) untouched for self-hosted installs.
      if (process.env.DEMO_MODE?.toLowerCase() === 'true') {
        const uploader = db.prepare('SELECT email FROM users WHERE id = ?').get(actingUserId) as { email?: string } | undefined;
        if (isDemoEmail(uploader?.email)) throw new ForbiddenResource('Uploads are disabled in demo mode.');
      }
      const i = input as { name: string; content_base64: string; mimetype?: string; description?: string; place_id?: number; reservation_id?: number };
      const original = pathMod.basename(i.name);
      const ext = pathMod.extname(original).toLowerCase();
      if (!ext || BLOCKED_EXTENSIONS.includes(ext)) throw new BadParams(`file extension '${ext || '(none)'}' is not allowed`);
      const buf = Buffer.from(i.content_base64, 'base64');
      if (buf.length === 0) throw new BadParams('file content is empty');
      if (buf.length > 10 * 1024 * 1024) throw new BadParams('file exceeds the 10MB plugin upload cap');
      const foreign = findForeignLinkTarget(tripId, { reservation_id: i.reservation_id ?? null, place_id: i.place_id ?? null });
      if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
      const filename = `${randomUUID()}${ext}`;
      fsMod.mkdirSync(filesDir, { recursive: true });
      fsMod.writeFileSync(pathMod.join(filesDir, filename), buf);
      const file = createFile(
        tripId,
        { filename, originalname: original, size: buf.length, mimetype: i.mimetype || 'application/octet-stream' },
        actingUserId,
        { place_id: i.place_id != null ? String(i.place_id) : null, reservation_id: i.reservation_id != null ? String(i.reservation_id) : null, description: i.description ?? null },
      );
      broadcast(tripId, 'file:created', { file }, undefined);
      return file;
    },
    createTripFileLink: (tripId, fileId, opts) => {
      if (!getFileById(fileId, tripId)) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
      const o = opts as { reservation_id?: number; assignment_id?: number; place_id?: number };
      const foreign = findForeignLinkTarget(tripId, o);
      if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
      return createFileLink(fileId, { reservation_id: o.reservation_id != null ? String(o.reservation_id) : null, assignment_id: o.assignment_id != null ? String(o.assignment_id) : null, place_id: o.place_id != null ? String(o.place_id) : null });
    },
    updateTripFile: (tripId, fileId, input) => {
      const current = getFileById(fileId, tripId);
      if (!current) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
      const i = input as { description?: string; place_id?: number | null; reservation_id?: number | null };
      const foreign = findForeignLinkTarget(tripId, { reservation_id: i.reservation_id ?? null, place_id: i.place_id ?? null });
      if (foreign) throw new ForbiddenResource(`${foreign} does not belong to trip ${tripId}`);
      const file = updateFile(fileId, current, { description: i.description, place_id: i.place_id != null ? String(i.place_id) : i.place_id === null ? null : undefined, reservation_id: i.reservation_id != null ? String(i.reservation_id) : i.reservation_id === null ? null : undefined });
      broadcast(tripId, 'file:updated', { file }, undefined);
      return file;
    },
    softDeleteTripFile: (tripId, fileId) => {
      if (!getFileById(fileId, tripId)) throw new ForbiddenResource(`no file ${fileId} on trip ${tripId}`);
      softDeleteFile(fileId);
      broadcast(tripId, 'file:deleted', { fileId }, undefined);
      return { deleted: true };
    },
    // --- Collab reads (collab addon; membership checked by the host). Same hydrated
    // shapes as the REST GETs, so a collab plugin can finally read what it writes. ---
    listCollabNotes: (tripId) => { requireAddon(ADDON_IDS.COLLAB, 'collab'); return listCollabNotesSvc(tripId) as unknown[]; },
    listCollabPolls: (tripId) => { requireAddon(ADDON_IDS.COLLAB, 'collab'); return listCollabPollsSvc(tripId) as unknown[]; },
    listCollabMessages: (tripId, before) => { requireAddon(ADDON_IDS.COLLAB, 'collab'); return listCollabMessagesSvc(tripId, before) as unknown[]; },
    // --- Collab content (collab addon). The services validate + self-report errors. ---
    canEditCollab: (tripId, userId) => canEditTripAs('collab_edit', tripId, userId),
    createCollabNote: (tripId, input, actingUserId) => {
      requireAddon(ADDON_IDS.COLLAB, 'collab');
      const note = createCollabNoteSvc(String(tripId), actingUserId, input as never);
      broadcast(tripId, 'collab:note:created', { note }, undefined);
      return note;
    },
    createCollabPoll: (tripId, input, actingUserId) => {
      requireAddon(ADDON_IDS.COLLAB, 'collab');
      const poll = createCollabPollSvc(String(tripId), actingUserId, input as never);
      broadcast(tripId, 'collab:poll:created', { poll }, undefined);
      return poll;
    },
    voteCollabPoll: (tripId, pollId, optionIndex, actingUserId) => {
      requireAddon(ADDON_IDS.COLLAB, 'collab');
      const result = voteCollabPollSvc(String(tripId), String(pollId), actingUserId, optionIndex);
      if (result.error) throw new BadParams(result.error);
      broadcast(tripId, 'collab:poll:voted', { poll: result.poll }, undefined);
      return result.poll;
    },
    createCollabMessage: (tripId, text, replyTo, actingUserId) => {
      requireAddon(ADDON_IDS.COLLAB, 'collab');
      const result = createCollabMessageSvc(String(tripId), actingUserId, text, replyTo ?? null);
      if (result.error) throw new BadParams(result.error);
      broadcast(tripId, 'collab:message:created', { message: result.message }, undefined);
      return result.message;
    },
    // --- Member add (member_manage). Grants trip access — the target must exist;
    // the acting user is recorded as the inviter. Owner/duplicate adds are no-ops. ---
    canManageMembers: (tripId, userId) => canEditTripAs('member_manage', tripId, userId),
    addTripMember: (tripId, targetUserId, invitedBy) => {
      const target = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId) as { id: number } | undefined;
      if (!target) throw new ForbiddenResource(`no user ${targetUserId}`);
      return joinTripAsMember(tripId, targetUserId, invitedBy);
    },
    removeTripMember: (tripId, targetUserId) => {
      // Never remove the OWNER via this path — that would orphan the trip. Ownership
      // transfer is a separate, deliberate action, not a member-management side effect.
      const trip = db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as { user_id: number } | undefined;
      if (trip && trip.user_id === targetUserId) throw new ForbiddenResource('cannot remove the trip owner');
      removeTripMemberSvc(tripId, targetUserId);
      return { removed: true };
    },
    // --- Host-mediated notifications. Recipient resolution + channel fan-out +
    // per-user preferences are all owned by notificationService.send; the plugin
    // supplies only the target (host-scoped by the router) + plain text. actorId is
    // null (no user sender), so the message body carries the plugin's content. ---
    canAccessTripForNotify: (tripId, userId) => !!canAccessTrip(tripId, userId),
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
    // --- Host-mediated LLM. The host holds the credential (resolveLlmConfig, encrypted
    // apiKey) and runs the call under the acting user's provider config; caps + the
    // provider-availability check live at the router. Reuses the extraction client:
    // complete() wraps it with a {text} schema; extract() passes the plugin's schema. ---
    aiConfigured: (userId) => resolveLlmConfig(userId) !== null,
    aiComplete: async (userId, prompt, system) => {
      const config = resolveLlmConfig(userId);
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
      const config = resolveLlmConfig(userId);
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
    getOAuthToken: (pluginId, userId) => new PluginOAuthService().getAccessToken(pluginId, userId, Date.now()),
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
      const existing = db.prepare('SELECT id FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?').get(id, name) as { id: number } | undefined;
      if (!existing) {
        const n = (db.prepare('SELECT COUNT(*) AS c FROM plugin_scheduled_tasks WHERE plugin_id = ?').get(id) as { c: number }).c;
        if (n >= SCHED_MAX) throw new BadParams(`too many scheduled tasks (max ${SCHED_MAX})`);
      }
      // Upsert by (plugin, name): re-scheduling the same name replaces it.
      db.prepare(
        `INSERT INTO plugin_scheduled_tasks (plugin_id, name, due_at, payload, every_ms) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (plugin_id, name) DO UPDATE SET due_at = excluded.due_at, payload = excluded.payload, every_ms = excluded.every_ms`,
      ).run(id, name, Math.max(dueAt, Date.now()), json, everyMs ?? null);
      return { scheduled: true };
    },
    schedulerCancel: (name) => {
      const r = db.prepare('DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?').run(id, name);
      return { cancelled: r.changes > 0 };
    },
    listCostsForTrip: (tripId) => listBudgetItems(tripId),
    // Cross-trip: every accessible trip's budget items (membership predicate is
    // baked into listTrips). Reuses the hydrated list so members/payers come too.
    listCostsForUser: (userId) => {
      const trips = listTrips(userId, null) as Array<{ id: number }>;
      return trips.flatMap((t) => listBudgetItems(t.id));
    },
    // Reuses BudgetService.create (frozen FX + members/payers), then broadcasts
    // the same 'budget:created' event the controller emits so the web app updates
    // live. No X-Socket-Id — a plugin has no originating socket.
    createCost: async (tripId, input) => {
      const item = await budgetSvc.create(String(tripId), input);
      broadcast(tripId, 'budget:created', { item });
      return item;
    },
    // Reuses BudgetService.update (re-frozen FX on a currency change), then
    // broadcasts the same 'budget:updated' event the REST controller emits. A
    // missing item is a clean RESOURCE_FORBIDDEN (parity with updatePlace).
    updateCost: async (tripId, itemId, input) => {
      const item = await budgetSvc.update(String(itemId), String(tripId), input);
      if (item == null) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
      broadcast(tripId, 'budget:updated', { item });
      return item;
    },
    // Reuses BudgetService.remove, then broadcasts 'budget:deleted' with the
    // numeric id — same payload the REST controller sends.
    deleteCost: (tripId, itemId) => {
      const deleted = budgetSvc.remove(String(itemId), String(tripId));
      if (!deleted) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
      broadcast(tripId, 'budget:deleted', { itemId });
      return { deleted: true };
    },
    // --- Places (place_edit). Delegate to the same placeService the REST/MCP paths
    // use, then broadcast the same events so open web sessions update live. ---
    canEditPlaces: (tripId, userId) => canEditTripAs('place_edit', tripId, userId),
    createPlace: (tripId, input) => {
      const place = createPlace(String(tripId), input as Parameters<typeof createPlace>[1]);
      broadcast(tripId, 'place:created', { place });
      return place;
    },
    updatePlace: (tripId, placeId, input) => {
      const place = updatePlace(String(tripId), String(placeId), input as Parameters<typeof updatePlace>[2]);
      if (place === null) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
      broadcast(tripId, 'place:updated', { place });
      return place;
    },
    deletePlace: (tripId, placeId) => {
      const deleted = deletePlace(String(tripId), String(placeId));
      if (!deleted) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
      broadcast(tripId, 'place:deleted', { placeId });
      return { deleted: true };
    },
    // --- Days (day_edit). getDay scopes the row to the trip before any write. ---
    canEditDays: (tripId, userId) => canEditTripAs('day_edit', tripId, userId),
    createDay: (tripId, input) => {
      const i = input as { date?: string; notes?: string };
      const day = createDay(tripId, i.date, i.notes);
      broadcast(tripId, 'day:created', { day });
      return day;
    },
    updateDay: (tripId, dayId, input) => {
      const current = getDay(dayId, tripId);
      if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      const day = updateDay(dayId, current, input as { notes?: string; title?: string | null });
      broadcast(tripId, 'day:updated', { day });
      return day;
    },
    deleteDay: (tripId, dayId) => {
      const current = getDay(dayId, tripId);
      if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      deleteDay(dayId);
      broadcast(tripId, 'day:deleted', { dayId });
      return { deleted: true };
    },
    // --- Itinerary (day_edit). Both the day AND the place must belong to the trip,
    // so a plugin can't cross-link another trip's rows (assignmentService doesn't
    // self-check this — the controllers do, so we reproduce it here). ---
    assignPlaceToDay: (tripId, dayId, placeId, notes) => {
      if (!dayExists(dayId, tripId)) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      if (!placeExists(placeId, tripId)) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
      const assignment = createAssignment(dayId, placeId, notes);
      broadcast(tripId, 'assignment:created', { assignment });
      return assignment;
    },
    unassignPlace: (tripId, assignmentId) => {
      if (!getAssignmentForTrip(assignmentId, tripId)) throw new ForbiddenResource(`no assignment ${assignmentId} on trip ${tripId}`);
      deleteAssignment(assignmentId);
      broadcast(tripId, 'assignment:deleted', { assignmentId });
      return { deleted: true };
    },
    // --- Trip creation (trip_create; owner = acting user). No broadcast — a new trip
    // is only visible to its owner, who refetches (same as the REST POST). ---
    canCreateTrip: (userId) => {
      const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
      return checkPermission('trip_create', u?.role ?? 'user', null, userId, false);
    },
    createTripForUser: (userId, input) => {
      try {
        const result = createTrip(userId, input as unknown as Parameters<typeof createTrip>[1]);
        return result.trip;
      } catch (e) {
        if (e instanceof ValidationError) throw new BadParams(e.message);
        throw e;
      }
    },
    // --- Exchange rates: the same cached upstream feed the budget uses (tenant-free). ---
    getRates: (base) => getExchangeRates(base),
    // --- Trip (trip_edit). Only the schema-writable fields reach updateTrip; its
    // NotFound/Validation errors are mapped to clean RPC codes. ---
    canEditTrip: (tripId, userId) => canEditTripAs('trip_edit', tripId, userId),
    updateTrip: (tripId, userId, input) => {
      // The REST controller gates two fields behind their OWN admin-configurable
      // permissions, separate from trip_edit — reproduce that here so a plugin (or
      // its member user) can't archive or re-cover a trip it may only edit.
      if ('is_archived' in input && !canEditTripAs('trip_archive', tripId, userId)) {
        throw new ForbiddenResource(`no permission to archive trip ${tripId}`);
      }
      if ('cover_image' in input && !canEditTripAs('trip_cover_upload', tripId, userId)) {
        throw new ForbiddenResource(`no permission to change the cover of trip ${tripId}`);
      }
      const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
      try {
        const result = updateTrip(tripId, userId, input as Parameters<typeof updateTrip>[2], u?.role ?? 'user');
        broadcast(tripId, 'trip:updated', { trip: result.updatedTrip });
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
    listTripsForUser: (userId) => listTrips(userId, null),
    listReservationsForUser: (userId) => {
      const trips = listTrips(userId, null) as Array<{ id: number }>;
      return trips.flatMap((t) => reservationsSvc.list(String(t.id)));
    },
    // --- Trip-scoped hydrated reads (membership already checked by tripRead). Same
    // services as the REST GETs, so plugins see the exact planner shapes. ---
    listTripDays: (tripId) => (listDays(tripId) as { days: unknown[] }).days,
    listTripReservations: (tripId) => reservationsSvc.list(String(tripId)),
    listTripAccommodations: (tripId) => listAccommodations(tripId) as unknown[],
    // --- Accommodations (lodging blocks, day_edit). Delegates to dayService so the
    // partner hotel reservation, the metadata sync and the delete cascade behave
    // exactly like the accommodations REST controller, cascade broadcasts included. ---
    createAccommodation: (tripId, input) => {
      const i = input as { place_id: number | string; start_day_id: number | string; end_day_id: number | string; check_in?: string | null; check_in_end?: string | null; check_out?: string | null; confirmation?: string | null; notes?: string | null };
      const placeId = Math.trunc(Number(i.place_id));
      const startDayId = Math.trunc(Number(i.start_day_id));
      const endDayId = Math.trunc(Number(i.end_day_id));
      if (!placeId || !startDayId || !endDayId) throw new BadParams('place_id, start_day_id, and end_day_id are required');
      const errors = validateAccommodationRefs(tripId, placeId, startDayId, endDayId);
      if (errors.length > 0) throw new ForbiddenResource(errors[0].message);
      const accommodation = createAccommodationSvc(tripId, {
        place_id: placeId, start_day_id: startDayId, end_day_id: endDayId,
        check_in: i.check_in ?? undefined, check_in_end: i.check_in_end ?? undefined,
        check_out: i.check_out ?? undefined, confirmation: i.confirmation ?? undefined, notes: i.notes ?? undefined,
      });
      broadcast(tripId, 'accommodation:created', { accommodation });
      broadcast(tripId, 'reservation:created', {});
      return accommodation;
    },
    updateAccommodation: (tripId, accommodationId, input) => {
      const existing = getAccommodation(accommodationId, tripId);
      if (!existing) throw new ForbiddenResource(`no accommodation ${accommodationId} on trip ${tripId}`);
      const i = input as { place_id?: number; start_day_id?: number; end_day_id?: number; check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string };
      const errors = validateAccommodationRefs(tripId, i.place_id, i.start_day_id, i.end_day_id);
      if (errors.length > 0) throw new ForbiddenResource(errors[0].message);
      const accommodation = updateAccommodationSvc(accommodationId, existing, i);
      broadcast(tripId, 'accommodation:updated', { accommodation });
      return accommodation;
    },
    deleteAccommodation: (tripId, accommodationId) => {
      if (!getAccommodation(accommodationId, tripId)) throw new ForbiddenResource(`no accommodation ${accommodationId} on trip ${tripId}`);
      const { linkedReservationId, deletedBudgetItemId } = deleteAccommodationSvc(accommodationId);
      if (linkedReservationId) broadcast(tripId, 'reservation:deleted', { reservationId: linkedReservationId });
      if (deletedBudgetItemId) broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId });
      broadcast(tripId, 'accommodation:deleted', { accommodationId });
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
    vacayForUser: (userId) => { requireAddon(ADDON_IDS.VACAY, 'vacay'); return getPlanData(userId); },
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
    vacayToggleEntry: (userId, date) => { requireAddon(ADDON_IDS.VACAY, 'vacay'); return vacayToggleEntrySvc(userId, getActivePlanId(userId), date, undefined); },
    vacayToggleCompanyHoliday: (userId, date, note) => {
      requireAddon(ADDON_IDS.VACAY, 'vacay');
      return vacayToggleCompanyHolidaySvc(getActivePlanId(userId), date, note, undefined);
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
    listDayNotes: (tripId, dayId) => listNotes(dayId, tripId),
    // --- Day notes write (day_edit). The day must belong to the trip; broadcasts the
    // same dayNote:* events the REST controller emits so open sessions update live. ---
    createDayNote: (tripId, dayId, input) => {
      if (!dayNoteDayExists(dayId, tripId)) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      const i = input as { text?: string; time?: string; icon?: string; sort_order?: number };
      const note = createNote(dayId, tripId, i.text ?? '', i.time, i.icon, i.sort_order);
      broadcast(tripId, 'dayNote:created', { dayId, note }, undefined);
      return note;
    },
    updateDayNote: (tripId, dayId, noteId, input) => {
      const current = getNote(noteId, dayId, tripId);
      if (!current) throw new ForbiddenResource(`no note ${noteId} on day ${dayId}`);
      const note = updateNote(noteId, current as never, input as { text?: string; time?: string; icon?: string; sort_order?: number });
      broadcast(tripId, 'dayNote:updated', { dayId, note }, undefined);
      return note;
    },
    deleteDayNote: (tripId, dayId, noteId) => {
      const current = getNote(noteId, dayId, tripId);
      if (!current) throw new ForbiddenResource(`no note ${noteId} on day ${dayId}`);
      deleteNote(noteId);
      broadcast(tripId, 'dayNote:deleted', { noteId, dayId }, undefined);
      return { deleted: true };
    },
    // --- Reservations (bookings, reservation_edit). Delegates to ReservationsService
    // so the accommodation/budget-sync/notification/broadcast side effects match the
    // web app EXACTLY. socketId is undefined — a plugin has no originating socket. ---
    canEditReservations: (tripId, userId) => canEditTripAs('reservation_edit', tripId, userId),
    createReservation: (tripId, input, actingUserId) => {
      const { reservation, accommodationCreated } = reservationsSvc.create(String(tripId), input as never);
      if (accommodationCreated) broadcast(tripId, 'accommodation:created', {}, undefined);
      const i = input as { title?: string; type?: string; create_budget_entry?: unknown };
      reservationsSvc.syncBudgetOnCreate(String(tripId), reservation.id, i.title ?? '', i.type, i.create_budget_entry as never, undefined);
      broadcast(tripId, 'reservation:created', { reservation }, undefined);
      notifyBooking(actingUserId, tripId, i.title ?? '', i.type ?? '');
      return reservation;
    },
    updateReservation: (tripId, reservationId, input, actingUserId) => {
      const current = reservationsSvc.getReservation(String(reservationId), String(tripId));
      if (!current) throw new ForbiddenResource(`no reservation ${reservationId} on trip ${tripId}`);
      const { reservation, accommodationChanged } = reservationsSvc.update(String(reservationId), String(tripId), input as never, current as never);
      if (accommodationChanged) broadcast(tripId, 'accommodation:updated', {}, undefined);
      const cur = current as { title: string; type?: string };
      const i = input as { title?: string; type?: string; create_budget_entry?: unknown };
      reservationsSvc.syncBudgetOnUpdate(String(tripId), String(reservationId), i.title ?? '', i.type, cur.title, cur.type, i.create_budget_entry as never, undefined);
      broadcast(tripId, 'reservation:updated', { reservation }, undefined);
      notifyBooking(actingUserId, tripId, i.title || cur.title, i.type || cur.type || '');
      return reservation;
    },
    deleteReservation: (tripId, reservationId, actingUserId) => {
      const { deleted, accommodationDeleted, deletedBudgetItemId } = reservationsSvc.remove(String(reservationId), String(tripId));
      if (!deleted) throw new ForbiddenResource(`no reservation ${reservationId} on trip ${tripId}`);
      if (accommodationDeleted) broadcast(tripId, 'accommodation:deleted', { accommodationId: deleted.accommodation_id }, undefined);
      if (deletedBudgetItemId) broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId }, undefined);
      broadcast(tripId, 'reservation:deleted', { reservationId: Number(reservationId) }, undefined);
      notifyBooking(actingUserId, tripId, deleted.title, deleted.type || '');
      return { deleted: true };
    },
    // --- Packing (packing_edit). Reuses packingService + replicates the #858
    // privacy-scoped broadcasts (create/delete via emitPackingToViewers, update via
    // the four-case broadcastPackingUpdate) so a private item never leaks room-wide. ---
    canEditPacking: (tripId, userId) => canEditTripAs('packing_edit', tripId, userId),
    createPackingItem: (tripId, input, actingUserId) => {
      const i = input as { name: string; category?: string; checked?: boolean; is_private?: boolean; visibility?: 'common' | 'personal' | 'shared'; recipient_ids?: number[] };
      const item = createPackingItemSvc(String(tripId), i, actingUserId) as PackingPrivacy;
      emitPackingToViewers(tripId, 'packing:created', { item }, item);
      return item;
    },
    updatePackingItem: (tripId, itemId, input, actingUserId) => {
      // Privacy BEFORE the write, so a public<->private toggle routes correctly.
      const before = packingItemPrivacy(tripId, itemId);
      const updated = updatePackingItemSvc(String(tripId), String(itemId), input as never, Object.keys(input), undefined, actingUserId);
      if (!updated) throw new ForbiddenResource(`no packing item ${itemId} on trip ${tripId}`);
      if (isUpdateConflict(updated)) throw new BadParams('packing item was modified concurrently');
      broadcastPackingUpdate(tripId, itemId, updated as PackingPrivacy, !!before?.is_private);
      return updated;
    },
    deletePackingItem: (tripId, itemId) => {
      const deleted = deletePackingItemSvc(String(tripId), String(itemId)) as PackingPrivacy | null;
      if (!deleted) throw new ForbiddenResource(`no packing item ${itemId} on trip ${tripId}`);
      emitPackingToViewers(tripId, 'packing:deleted', { itemId }, deleted);
      return { deleted: true };
    },
    // --- Packing bags (no privacy — plain room broadcasts). ---
    listPackingBags: (tripId) => listBags(String(tripId)) as unknown[],
    createPackingBag: (tripId, input) => {
      const i = input as { name: string; color?: string };
      const bag = createBagSvc(String(tripId), { name: i.name, color: i.color });
      broadcast(tripId, 'packing:bag-created', { bag }, undefined);
      return bag;
    },
    updatePackingBag: (tripId, bagId, input) => {
      const bag = updateBagSvc(String(tripId), String(bagId), input as never, Object.keys(input));
      if (!bag) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
      broadcast(tripId, 'packing:bag-updated', { bag }, undefined);
      return bag;
    },
    deletePackingBag: (tripId, bagId) => {
      if (!deleteBagSvc(String(tripId), String(bagId))) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
      broadcast(tripId, 'packing:bag-deleted', { bagId }, undefined);
      return { deleted: true };
    },
    setPackingBagMembers: (tripId, bagId, userIds) => {
      const members = setBagMembers(String(tripId), String(bagId), userIds);
      if (!members) throw new ForbiddenResource(`no packing bag ${bagId} on trip ${tripId}`);
      broadcast(tripId, 'packing:bag-members-updated', { bagId, members }, undefined);
      return members;
    },
    // --- Read-convenience: weather (host cache, tenant-free), categories (global), roster ---
    getWeather: (lat, lng, date) => getWeather(String(lat), String(lng), date, 'en'),
    listCategories: () => listCategories() as unknown[],
    tripMembers: (tripId) =>
      db.prepare('SELECT u.id, u.username, u.display_name, u.avatar FROM trip_members tm JOIN users u ON u.id = tm.user_id WHERE tm.trip_id = ?').all(tripId) as unknown[],
    // --- Tags (the acting user's own; ownership re-checked before a write). ---
    listTagsForUser: (userId) => listTags(userId) as unknown[],
    createTagForUser: (userId, name, color) => createTag(userId, name, color),
    updateTagForUser: (userId, tagId, name, color) => {
      if (!getTagByIdAndUser(tagId, userId)) throw new ForbiddenResource(`no tag ${tagId} for this user`);
      return updateTag(tagId, name, color);
    },
    deleteTagForUser: (userId, tagId) => {
      if (!getTagByIdAndUser(tagId, userId)) throw new ForbiddenResource(`no tag ${tagId} for this user`);
      deleteTag(tagId);
      return { deleted: true };
    },
    // --- Todos (core, trip-scoped; the app's 'packing_edit' permission). ---
    canEditTodos: (tripId, userId) => canEditTripAs('packing_edit', tripId, userId),
    listTodos: (tripId) => listTodosSvc(String(tripId)) as unknown[],
    createTodo: (tripId, input) => {
      const item = createTodoSvc(String(tripId), input as never);
      broadcast(tripId, 'todo:created', { item }, undefined);
      return item;
    },
    updateTodo: (tripId, todoId, input) => {
      const updated = updateTodoSvc(String(tripId), String(todoId), input as never, Object.keys(input));
      if (!updated) throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
      broadcast(tripId, 'todo:updated', { item: updated }, undefined);
      return updated;
    },
    deleteTodo: (tripId, todoId) => {
      if (!deleteTodoSvc(String(tripId), String(todoId))) throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
      broadcast(tripId, 'todo:deleted', { itemId: todoId }, undefined);
      return { deleted: true };
    },
    // --- Plugin metadata (db:meta). A per-plugin namespaced key/value store keyed
    // to a core entity; the plugin only ever sees rows tagged with its own id. ---
    metaEntityTrip: (entityType, entityId) => {
      if (entityType === 'trip') {
        return (db.prepare('SELECT id FROM trips WHERE id = ?').get(entityId) as { id: number } | undefined)?.id;
      }
      // Each of these tables has a NOT NULL trip_id, so the metadata gate resolves to
      // the owning trip and reuses the standard canAccessTrip / *_edit checks.
      const table = entityType === 'place' ? 'places'
        : entityType === 'day' ? 'days'
        : entityType === 'reservation' ? 'reservations'
        : 'day_accommodations'; // accommodation
      return (db.prepare(`SELECT trip_id FROM ${table} WHERE id = ?`).get(entityId) as { trip_id: number } | undefined)?.trip_id;
    },
    metaGet: (entityType, entityId, key) => {
      const row = db.prepare('SELECT value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
        .get(id, entityType, entityId, key) as { value: string } | undefined;
      if (!row) return null;
      try { return JSON.parse(row.value); } catch { return null; }
    },
    metaSet: (entityType, entityId, key, value) => {
      if (key.length > META_KEY_MAX) throw new BadParams(`metadata key too long (>${META_KEY_MAX} chars)`);
      const json = JSON.stringify(value ?? null);
      if (json.length > META_VALUE_MAX) throw new BadParams(`metadata value too large (>${META_VALUE_MAX} bytes)`);
      const exists = db.prepare('SELECT 1 FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
        .get(id, entityType, entityId, key);
      if (!exists) {
        const { n } = db.prepare('SELECT COUNT(*) AS n FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=?')
          .get(id, entityType, entityId) as { n: number };
        if (n >= META_KEYS_MAX) throw new BadParams(`too many metadata keys on this ${entityType} (max ${META_KEYS_MAX})`);
      }
      db.prepare(`INSERT INTO plugin_entity_metadata (plugin_id, entity_type, entity_id, key, value, updated_at)
                  VALUES (?, ?, ?, ?, ?, datetime('now'))
                  ON CONFLICT(plugin_id, entity_type, entity_id, key)
                  DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
        .run(id, entityType, entityId, key, json);
      return { key, value: value ?? null };
    },
    metaList: (entityType, entityId) => {
      const list = db.prepare('SELECT key, value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? ORDER BY key')
        .all(id, entityType, entityId) as Array<{ key: string; value: string }>;
      const out: Record<string, unknown> = {};
      for (const r of list) { try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = null; } }
      return out;
    },
    metaDelete: (entityType, entityId, key) => {
      const res = db.prepare('DELETE FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
        .run(id, entityType, entityId, key);
      return { deleted: res.changes > 0 };
    },
  });
}
