import {
  budgetCreateItemRequestSchema, type BudgetCreateItemRequest,
  budgetUpdateItemRequestSchema, type BudgetUpdateItemRequest,
  placeCreateRequestSchema, placeUpdateRequestSchema,
  dayCreateRequestSchema, dayUpdateRequestSchema,
  tripUpdateRequestSchema, tripCreateRequestSchema,
  reservationCreateRequestSchema, reservationUpdateRequestSchema,
  reservationEndpointsInputSchema,
  accommodationCreateRequestSchema, accommodationUpdateRequestSchema,
  packingCreateItemRequestSchema, packingUpdateItemRequestSchema,
  collectionCreateRequestSchema, collectionUpdateRequestSchema,
  collectionSavePlaceRequestSchema, collectionCopyToTripRequestSchema,
} from '@trek/shared';
import {
  KNOWN_METHODS,
  type KnownMethod,
  type RpcError,
  type RpcRequest,
  type RpcResponse,
} from '../protocol/envelope';
import type { PluginDataDb } from './plugin-data.service';
import { stripEmoji } from '../text-sanitize';
import { auditResource, isAuditable } from './plugin-audit';

/**
 * The per-plugin capability router (#plugins, M1) — the ENFORCEMENT POINT.
 *
 * Built from the plugin's GRANTED permission set. Only the methods a permission
 * unlocks are registered; an ungranted method is simply never in the map, so the
 * plugin cannot "call it anyway" — there is no shared object, only messages, and
 * the host is the sole holder of the trek.db handle and the broadcast fns.
 *
 * Runs in the HOST (parent) process.
 */

/** Thrown by a handler when the acting user may not touch the requested resource. */
export class ForbiddenResource extends Error {}

interface CoreDb {
  prepare(sql: string): {
    all(...args: unknown[]): unknown[];
    get(...args: unknown[]): unknown;
  };
}

export interface HostDeps {
  /** The plugin's own sqlite (db:own). */
  data: PluginDataDb;
  /** Read-only handle to the core trek.db, used ONLY through the typed readers here. */
  db: CoreDb;
  /** Returns the trip row if the user may access it, else undefined. */
  canAccessTrip(tripId: number, userId: number): unknown;
  /** True if the target user is the acting user or co-members a trip with them. */
  canSeeUser(actingUserId: number, targetUserId: number): boolean;
  /** Namespaced trip broadcast (host forces the plugin:{id}:{event} event type). */
  broadcastToTrip(tripId: number, eventType: string, payload: Record<string, unknown>): void;
  /** Namespaced per-user broadcast. */
  broadcastToUser(userId: number, payload: Record<string, unknown>): void;
  // --- Host-mediated notifications (recipient resolution + channel fan-out owned
  // by the host; the plugin supplies only target + plain text). ---
  canAccessTripForNotify(tripId: number, userId: number): boolean;
  sendPluginNotification(pluginId: string, input: { title: string; body: string; link?: string; scope: 'user' | 'trip'; targetId: number }): Promise<unknown>;
  // --- Host-mediated LLM (the host owns the credential; output is DATA the plugin
  // must still push through the gated write methods). ---
  aiConfigured(userId: number): boolean;
  aiComplete(userId: number, prompt: string, system: string | undefined): Promise<unknown>;
  aiExtract(userId: number, text: string, jsonSchema: object, prompt: string | undefined): Promise<unknown>;
  /** The acting user's own value for one of this plugin's `scope:'user'` settings (decrypted). */
  getUserSetting(pluginId: string, userId: number, key: string): unknown;
  /** A short-lived OAuth access token for the acting user (host-brokered; refreshes if
   * expiring). Null when the user hasn't connected. The plugin never sees the refresh token. */
  getOAuthToken(pluginId: string, userId: number): Promise<string | null>;
  /** Schedule (upsert by name) a userless future callback; everyMs set = recurring. Caps enforced here. */
  schedulerSet(name: string, dueAt: number, everyMs: number | undefined, payload: unknown): { scheduled: boolean };
  /** Cancel a scheduled callback by name. */
  schedulerCancel(name: string): { cancelled: boolean };
  /** Optional sink for the capability audit log (host-side, hash-chained). */
  audit?(entry: { pluginId: string; actingUserId?: number; method: string; resource: string | null; code: string }): void;
  /** Call an export on another plugin (this host's plugin is the caller). Authorizes
   * the dependency edge + the target's `provides` allowlist, forwards the acting user. */
  callPlugin(targetId: string, fn: string, args: unknown, actingUserId: number | undefined): Promise<unknown>;
  /** Publish an event from this host's plugin to its subscribed dependents. */
  emitPluginEvent(event: string, payload: unknown): void;
  /** True when the Costs (budget) addon is enabled — gates all costs.* methods. */
  budgetAddonEnabled(): boolean;
  /** True if the acting user may create costs on the trip (the 'budget_edit' permission). */
  canEditCosts(tripId: number, userId: number): boolean;
  /** A trip's packing items visible to `userId` (#858 private-item filter), for `packing.list`. */
  listPackingItems(tripId: number, userId: number): unknown[];
  /** A trip's files (trash excluded), for `files.list`. */
  listTripFiles(tripId: number): unknown[];
  /** One trip file's bytes as base64 (size-capped), for `files.getContent`. Throws if it's not on the trip or exceeds the cap. */
  getTripFileContent(tripId: number, fileId: number): unknown;
  // --- Files write (the app's file_upload / file_edit / file_delete permissions) ---
  canUploadFiles(tripId: number, userId: number): boolean;
  canEditFiles(tripId: number, userId: number): boolean;
  canDeleteFiles(tripId: number, userId: number): boolean;
  /** Store a bounded base64 payload as a trip file (extension + size validated); broadcasts file:created. */
  createTripFile(tripId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  /** Link an existing trip file to a reservation/place/assignment on the SAME trip. */
  createTripFileLink(tripId: number, fileId: number, opts: Record<string, unknown>): unknown;
  /** Update a file's description/links (same-trip targets enforced); broadcasts file:updated. */
  updateTripFile(tripId: number, fileId: number, input: Record<string, unknown>): unknown;
  /** Move a trip file to the trash; broadcasts file:deleted. */
  softDeleteTripFile(tripId: number, fileId: number): unknown;
  // --- Collab reads (membership + collab addon; no separate right, like the REST GETs) ---
  listCollabNotes(tripId: number): unknown[];
  listCollabPolls(tripId: number): unknown[];
  listCollabMessages(tripId: number, before: number | undefined): unknown[];
  // --- Collab content (the app's collab_edit permission; collab addon gated) ---
  canEditCollab(tripId: number, userId: number): boolean;
  createCollabNote(tripId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  createCollabPoll(tripId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  voteCollabPoll(tripId: number, pollId: number, optionIndex: number, actingUserId: number): unknown;
  createCollabMessage(tripId: number, text: string, replyTo: number | undefined, actingUserId: number): unknown;
  // --- Member add (the DISTINCT member_manage permission — never bundled) ---
  canManageMembers(tripId: number, userId: number): boolean;
  addTripMember(tripId: number, targetUserId: number, invitedBy: number): unknown;
  removeTripMember(tripId: number, targetUserId: number, actingUserId: number): unknown;
  /** The acting user's own journals (journey addon must be enabled). */
  listJournalsForUser(userId: number): unknown;
  /** The entries of one of the acting user's journeys (journey addon; access-checked). */
  journalEntriesForUser(userId: number, journeyId: number): unknown;
  /** The acting user's visited countries + regions (atlas addon must be enabled). */
  atlasVisitedForUser(userId: number): unknown;
  /** The acting user's bucket-list items (atlas addon must be enabled). */
  atlasBucketForUser(userId: number): unknown[];
  /** The acting user's vacation plan data (vacay addon must be enabled). */
  vacayForUser(userId: number): unknown;
  /** The acting user's saved-place collections (collections addon must be enabled). */
  listCollectionsForUser(userId: number): unknown;
  /** One of the acting user's collections by id (collections addon must be enabled). */
  getCollectionForUser(userId: number, id: number): unknown;
  // --- Collections write (the service enforces per-collection role itself) ---
  createCollectionForUser(userId: number, input: Record<string, unknown>): unknown;
  updateCollectionForUser(userId: number, id: number, input: Record<string, unknown>): unknown;
  saveCollectionPlace(userId: number, input: Record<string, unknown>): unknown;
  copyCollectionToTrip(userId: number, input: Record<string, unknown>): unknown;
  deleteCollectionPlace(userId: number, placeId: number): unknown;
  // --- Atlas write (all rows are the acting user's own; atlas addon gated) ---
  markCountryVisited(userId: number, code: string): unknown;
  unmarkCountryVisited(userId: number, code: string): unknown;
  markRegionVisited(userId: number, regionCode: string, regionName: string, countryCode: string): unknown;
  unmarkRegionVisited(userId: number, regionCode: string): unknown;
  createBucketItem(userId: number, input: Record<string, unknown>): unknown;
  deleteBucketItem(userId: number, itemId: number): unknown;
  // --- Vacay write (plan resolved from the acting user; vacay addon gated) ---
  vacayToggleEntry(userId: number, date: string): unknown;
  vacayToggleCompanyHoliday(userId: number, date: string, note: string | undefined): unknown;
  // --- Journal write (journeyService.canEdit self-gates; journey addon gated) ---
  createJournalEntry(userId: number, journeyId: number, input: Record<string, unknown>): unknown;
  updateJournalEntry(userId: number, entryId: number, input: Record<string, unknown>): unknown;
  deleteJournalEntry(userId: number, entryId: number): unknown;
  /** Create/delete a JOURNAL itself (owned by the acting user) — lets an importer
   * bootstrap the journal it then fills, and clean it up. */
  createJournal(userId: number, input: Record<string, unknown>): unknown;
  deleteJournal(userId: number, journeyId: number): unknown;
  /** A trip day's notes (trip-scoped), for `daynotes.list`. */
  listDayNotes(tripId: number, dayId: number): unknown[];
  /** Create a day note (the day must be on the trip); broadcasts dayNote:created. */
  createDayNote(tripId: number, dayId: number, input: Record<string, unknown>): unknown;
  /** Update a day note (scoped to the day+trip); broadcasts dayNote:updated. */
  updateDayNote(tripId: number, dayId: number, noteId: number, input: Record<string, unknown>): unknown;
  /** Delete a day note (scoped to the day+trip); broadcasts dayNote:deleted. */
  deleteDayNote(tripId: number, dayId: number, noteId: number): unknown;
  /** All budget items of one trip, hydrated with members/payers. */
  listCostsForTrip(tripId: number): unknown[];
  /** All budget items across every trip the acting user can access. */
  listCostsForUser(userId: number): unknown[];
  /** Create a budget item on a trip (and broadcast); returns the created item. */
  createCost(tripId: number, input: BudgetCreateItemRequest): unknown;
  /** Update a budget item on a trip (and broadcast); returns the updated item. */
  updateCost(tripId: number, itemId: number, input: BudgetUpdateItemRequest): unknown;
  /** Delete a budget item from a trip (and broadcast); returns { deleted: true }. */
  deleteCost(tripId: number, itemId: number): unknown;
  // --- Places (the 'place_edit' permission) ---
  canEditPlaces(tripId: number, userId: number): boolean;
  createPlace(tripId: number, input: Record<string, unknown>): unknown;
  updatePlace(tripId: number, placeId: number, input: Record<string, unknown>): unknown;
  deletePlace(tripId: number, placeId: number): unknown;
  // --- Days + itinerary (the 'day_edit' permission) ---
  canEditDays(tripId: number, userId: number): boolean;
  createDay(tripId: number, input: Record<string, unknown>): unknown;
  updateDay(tripId: number, dayId: number, input: Record<string, unknown>): unknown;
  deleteDay(tripId: number, dayId: number): unknown;
  /** Assign a place to a day (both trip-scoped by the wiring); returns the assignment. */
  assignPlaceToDay(tripId: number, dayId: number, placeId: number, notes: string | null): unknown;
  /** Remove a day-assignment (trip-scoped by the wiring). */
  unassignPlace(tripId: number, assignmentId: number): unknown;
  // --- Trip (the 'trip_edit' permission) ---
  canEditTrip(tripId: number, userId: number): boolean;
  updateTrip(tripId: number, userId: number, input: Record<string, unknown>): unknown;
  // --- Trip creation (the 'trip_create' permission; owner = acting user) ---
  canCreateTrip(userId: number): boolean;
  createTripForUser(userId: number, input: Record<string, unknown>): unknown;
  // --- Exchange rates (tenant-free, like weather) ---
  getRates(base: string): Promise<unknown>;
  // --- Cross-trip reads (membership baked in — every trip the acting user can access) ---
  /** Every trip the acting user owns or is a member of (the listTrips baseline). */
  listTripsForUser(userId: number): unknown[];
  /** Every reservation across the acting user's accessible trips. */
  listReservationsForUser(userId: number): unknown[];
  /** A trip's days with their assignments + day notes — the planner GET's shape. */
  listTripDays(tripId: number): unknown[];
  /** A trip's reservations, hydrated like the REST list (endpoints, day_positions, joins). */
  listTripReservations(tripId: number): unknown[];
  /** A trip's lodging blocks (day_accommodations) with the joined place fields. */
  listTripAccommodations(tripId: number): unknown[];
  // --- Accommodations write (the 'day_edit' permission, like the accommodations REST path) ---
  /** Create a lodging block (auto-creates its partner hotel reservation + broadcasts); returns it. */
  createAccommodation(tripId: number, input: Record<string, unknown>): unknown;
  /** Update a lodging block (syncs the partner reservation); throws if it isn't on the trip. */
  updateAccommodation(tripId: number, accommodationId: number, input: Record<string, unknown>): unknown;
  /** Delete a lodging block (cascades the partner reservation/budget row); returns { deleted: true }. */
  deleteAccommodation(tripId: number, accommodationId: number): unknown;
  // --- Reservations (the 'reservation_edit' permission) ---
  canEditReservations(tripId: number, userId: number): boolean;
  /** Create a reservation (accommodation/budget side effects + broadcasts, as the web app); returns it. */
  createReservation(tripId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  /** Update a reservation on a trip (same side effects); returns it, or throws if it isn't on the trip. */
  updateReservation(tripId: number, reservationId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  /** Delete a reservation from a trip (same side effects); returns { deleted: true }. */
  deleteReservation(tripId: number, reservationId: number, actingUserId: number): unknown;
  // --- Packing (the 'packing_edit' permission; #858 privacy-scoped broadcasts) ---
  canEditPacking(tripId: number, userId: number): boolean;
  /** Create a packing item (owner = acting user); privacy-scoped packing:created broadcast; returns it. */
  createPackingItem(tripId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  /** Update a packing item; four-case public<->private broadcast; throws if not on the trip. */
  updatePackingItem(tripId: number, itemId: number, input: Record<string, unknown>, actingUserId: number): unknown;
  /** Delete a packing item; owner+recipients-scoped packing:deleted broadcast; returns { deleted: true }. */
  deletePackingItem(tripId: number, itemId: number): unknown;
  // --- Packing bags (packing_edit; no privacy — broadcast to the whole room) ---
  listPackingBags(tripId: number): unknown[];
  createPackingBag(tripId: number, input: Record<string, unknown>): unknown;
  updatePackingBag(tripId: number, bagId: number, input: Record<string, unknown>): unknown;
  deletePackingBag(tripId: number, bagId: number): unknown;
  setPackingBagMembers(tripId: number, bagId: number, userIds: number[]): unknown;
  // --- Read-convenience: weather (tenant-free), categories (global), the trip roster ---
  getWeather(lat: number, lng: number, date: string | undefined): unknown;
  listCategories(): unknown[];
  tripMembers(tripId: number): unknown[];
  // --- Tags (the acting user's own; no trip) ---
  listTagsForUser(userId: number): unknown[];
  createTagForUser(userId: number, name: string, color: string | undefined): unknown;
  updateTagForUser(userId: number, tagId: number, name: string | undefined, color: string | undefined): unknown;
  deleteTagForUser(userId: number, tagId: number): unknown;
  // --- Todos (core, trip-scoped; the 'packing_edit' permission, like the REST path) ---
  canEditTodos(tripId: number, userId: number): boolean;
  listTodos(tripId: number): unknown[];
  createTodo(tripId: number, input: Record<string, unknown>): unknown;
  updateTodo(tripId: number, todoId: number, input: Record<string, unknown>): unknown;
  deleteTodo(tripId: number, todoId: number): unknown;
  // --- Plugin metadata on core entities (db:meta) ---
  /** The trip a trip/place/day belongs to (for the membership gate), or undefined. */
  metaEntityTrip(entityType: string, entityId: number): number | undefined;
  metaGet(entityType: string, entityId: number, key: string): unknown;
  metaSet(entityType: string, entityId: number, key: string, value: unknown): unknown;
  metaList(entityType: string, entityId: number): unknown;
  metaDelete(entityType: string, entityId: number, key: string): unknown;
}

type Handler = (params: Record<string, unknown>, actingUserId: number | undefined) => unknown;

const num = (v: unknown, name: string): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new BadParams(`${name} must be a number`);
  return n;
};
const str = (v: unknown, name: string): string => {
  if (typeof v !== 'string') throw new BadParams(`${name} must be a string`);
  return v;
};
export class BadParams extends Error {}

// Mirrors the STRING_LIMITS the places REST controller enforces (the @trek/shared
// schema doesn't), so the plugin write path rejects the same oversized fields.
const PLACE_STR_LIMITS: Record<string, number> = { name: 200, description: 2000, address: 500, notes: 2000 };
// Core entities a plugin may attach its own db:meta to. Each maps to an owning
// trip (metaEntityTrip) so the membership + edit gates are the standard ones.
const META_ENTITY_TYPES: ReadonlySet<string> = new Set(['trip', 'place', 'day', 'reservation', 'accommodation']);
// Same idea for trips — the @trek/shared schema leaves the title/description open,
// so mirror the REST controller's field limits on the plugin write path too.
const TRIP_STR_LIMITS: Record<string, number> = { title: 200, description: 2000 };

export class PluginRpcHost {
  private methods = new Map<string, Handler>();

  constructor(
    private readonly pluginId: string,
    granted: ReadonlySet<string>,
    private readonly deps: HostDeps,
  ) {
    const has = (p: string) => granted.has(p);

    if (has('db:own')) {
      this.methods.set('db.query', (p) => deps.data.query(str(p.sql, 'sql'), asArgs(p.args)));
      this.methods.set('db.exec', (p) => deps.data.exec(str(p.sql, 'sql'), asArgs(p.args)));
      this.methods.set('db.migrate', (p) => deps.data.migrate(str(p.id, 'id'), str(p.sql, 'sql')));
      this.methods.set('db.tx', (p) => deps.data.tx(asTxOps(p.ops)));
    }

    if (has('db:read:trips')) {
      this.methods.set('trips.getById', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM trips WHERE id = ?').get(num(p.tripId, 'tripId'))),
      );
      // The trip's place POOL — places carry no itinerary position of their own
      // (day_id/order_index live on day_assignments), so order by created_at like
      // the REST list does. Use trips.getDays for the day-ordered itinerary.
      this.methods.set('trips.getPlaces', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM places WHERE trip_id = ? ORDER BY created_at DESC').all(num(p.tripId, 'tripId'))),
      );
      // Hydrated like the REST list (endpoints, day_positions, joins, normalized
      // accommodation_id) — a strict superset of the raw row, so older callers
      // only ever gain fields.
      this.methods.set('trips.getReservations', (p, uid) =>
        this.tripRead(p, uid, () => deps.listTripReservations(num(p.tripId, 'tripId'))),
      );
      // Days with their assignments + day notes: the read half of db:write:days —
      // without it a writer can't even discover the day ids it may edit.
      this.methods.set('trips.getDays', (p, uid) =>
        this.tripRead(p, uid, () => deps.listTripDays(num(p.tripId, 'tripId'))),
      );
      // Lodging blocks (day_accommodations) with their joined place fields. Reads
      // ride on db:read:trips like every other trip entity: the REST GET, too,
      // asks only for trip access.
      this.methods.set('trips.getAccommodations', (p, uid) =>
        this.tripRead(p, uid, () => deps.listTripAccommodations(num(p.tripId, 'tripId'))),
      );
      // Cross-trip enumeration: every trip the acting user can access. Membership is
      // baked into listTripsForUser, so there is no tripId to check — but a job/onLoad
      // (no bound user) is refused, exactly like costs.listMine.
      this.methods.set('trips.listMine', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('trip reads require an authenticated user context');
        return deps.listTripsForUser(uid);
      });
      // Cross-trip reservations feed (dashboards): reservations across every accessible
      // trip. Same membership predicate + no-user refusal.
      this.methods.set('reservations.listMine', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('reservation reads require an authenticated user context');
        return deps.listReservationsForUser(uid);
      });
      // The trip's member roster (ids + display fields only), membership-checked.
      this.methods.set('trips.members', (p, uid) => this.tripRead(p, uid, () => deps.tripMembers(num(p.tripId, 'tripId'))));
    }
    if (has('db:read:packing')) {
      // Delegate to the packing service, scoped to the acting user so its #858 private-
      // item visibility filter applies (a plugin must not see other members' private items).
      this.methods.set('packing.list', (p, uid) =>
        this.tripRead(p, uid, (userId) => deps.listPackingItems(num(p.tripId, 'tripId'), userId)),
      );
    }
    if (has('db:read:files')) {
      // Trip files, trash excluded — same view the files tab shows.
      this.methods.set('files.list', (p, uid) =>
        this.tripRead(p, uid, () => deps.listTripFiles(num(p.tripId, 'tripId'))),
      );
    }
    if (has('db:read:files:content')) {
      // Reading a file's BYTES is a step up from its metadata (a passport scan is
      // more sensitive than its filename), so it's a separate grant. Membership-
      // checked like files.list; the wiring caps the size before base64-ing it
      // through the IPC pipe.
      this.methods.set('files.getContent', (p, uid) =>
        this.tripRead(p, uid, () => deps.getTripFileContent(num(p.tripId, 'tripId'), num(p.fileId, 'fileId'))),
      );
    }
    if (has('db:write:files')) {
      // Files write, under the app's separate file_upload / file_edit / file_delete
      // rights. A created file arrives as bounded base64 (10MB decoded cap — well
      // under the app's 50MB upload limit); the wiring validates the extension
      // against the central blocklist before anything touches disk.
      this.methods.set('files.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'file');
        const input = asPayload(p.input);
        if (typeof input.name !== 'string' || input.name.trim() === '' || input.name.length > 255) throw new BadParams('file name is required (max 255 chars)');
        if (typeof input.content_base64 !== 'string' || input.content_base64 === '') throw new BadParams('content_base64 is required');
        if (input.content_base64.length > 14 * 1024 * 1024) throw new BadParams('file exceeds the 10MB plugin upload cap');
        this.requireTripEdit(tripId, actor, deps.canUploadFiles);
        return deps.createTripFile(tripId, input, actor);
      });
      this.methods.set('files.createLink', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const fileId = num(p.fileId, 'fileId');
        const actor = this.requireActor(uid, 'file link');
        this.requireTripEdit(tripId, actor, deps.canEditFiles);
        return deps.createTripFileLink(tripId, fileId, asPayload(p.opts));
      });
      this.methods.set('files.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const fileId = num(p.fileId, 'fileId');
        const actor = this.requireActor(uid, 'file');
        this.requireTripEdit(tripId, actor, deps.canEditFiles);
        return deps.updateTripFile(tripId, fileId, asPayload(p.input));
      });
      this.methods.set('files.softDelete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const fileId = num(p.fileId, 'fileId');
        const actor = this.requireActor(uid, 'file');
        this.requireTripEdit(tripId, actor, deps.canDeleteFiles);
        return deps.softDeleteTripFile(tripId, fileId);
      });
    }
    if (has('db:write:collab')) {
      // Collab content (notes/polls/messages) under the app's collab_edit right.
      this.methods.set('collab.createNote', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'collab note');
        const input = asPayload(p.input);
        if (typeof input.title !== 'string' || input.title.trim() === '') throw new BadParams('note title is required');
        this.requireTripEdit(tripId, actor, deps.canEditCollab);
        return deps.createCollabNote(tripId, input, actor);
      });
      this.methods.set('collab.createPoll', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'collab poll');
        const input = asPayload(p.input);
        if (typeof input.question !== 'string' || input.question.trim() === '') throw new BadParams('poll question is required');
        if (!Array.isArray(input.options) || input.options.length < 2) throw new BadParams('a poll needs at least two options');
        this.requireTripEdit(tripId, actor, deps.canEditCollab);
        return deps.createCollabPoll(tripId, input, actor);
      });
      this.methods.set('collab.votePoll', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'collab poll');
        this.requireTripEdit(tripId, actor, deps.canEditCollab);
        return deps.voteCollabPoll(tripId, num(p.pollId, 'pollId'), num(p.optionIndex, 'optionIndex'), actor);
      });
      this.methods.set('collab.createMessage', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'collab message');
        if (typeof p.text !== 'string' || p.text.trim() === '' || p.text.length > 4000) throw new BadParams('message text is required (max 4000 chars)');
        this.requireTripEdit(tripId, actor, deps.canEditCollab);
        return deps.createCollabMessage(tripId, p.text, typeof p.replyTo === 'number' ? p.replyTo : undefined, actor);
      });
    }
    if (has('db:write:members')) {
      // Adding a member GRANTS TRIP ACCESS — deliberately its own permission behind
      // the app's member_manage right (default: trip owner only), never bundled with
      // a lower-risk write. The acting user is recorded as the inviter.
      this.methods.set('trips.addMember', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const targetUserId = num(p.userId, 'userId');
        const actor = this.requireActor(uid, 'trip member');
        this.requireTripEdit(tripId, actor, deps.canManageMembers);
        return deps.addTripMember(tripId, targetUserId, actor);
      });
      // Symmetry with addMember: a directory-sync integration must be able to reconcile
      // DEPARTURES, not only additions. Same grant + the same manage-members gate.
      this.methods.set('trips.removeMember', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const targetUserId = num(p.userId, 'userId');
        const actor = this.requireActor(uid, 'trip member');
        this.requireTripEdit(tripId, actor, deps.canManageMembers);
        return deps.removeTripMember(tripId, targetUserId, actor);
      });
    }

    // User-scoped addon reads: the acting user's OWN journals/atlas/vacay across all
    // their trips (not one trip), so — like costs.listMine — they are gated on a bound
    // acting user, not a tripId; the wiring additionally refuses a disabled addon.
    if (has('db:read:collab')) {
      // Collab reads mirror the REST GETs: membership only (the addon gate lives in
      // the wiring), no separate right — the write side already has collab_edit.
      this.methods.set('collab.listNotes', (p, uid) => this.tripRead(p, uid, () => deps.listCollabNotes(num(p.tripId, 'tripId'))));
      this.methods.set('collab.listPolls', (p, uid) => this.tripRead(p, uid, () => deps.listCollabPolls(num(p.tripId, 'tripId'))));
      this.methods.set('collab.listMessages', (p, uid) =>
        this.tripRead(p, uid, () => deps.listCollabMessages(num(p.tripId, 'tripId'), p.before != null ? num(p.before, 'before') : undefined)),
      );
    }
    if (has('db:read:journal')) {
      this.methods.set('journal.listMine', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('journal reads require an authenticated user context');
        return deps.listJournalsForUser(uid);
      });
      // A journey's entries (photos/story/checkins). Journeys are user-scoped, not
      // trip-scoped, so the access check is journey membership inside the wiring.
      this.methods.set('journal.getEntries', (p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('journal reads require an authenticated user context');
        return deps.journalEntriesForUser(uid, num(p.journeyId, 'journeyId'));
      });
    }
    if (has('db:read:atlas')) {
      this.methods.set('atlas.visited', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('atlas reads require an authenticated user context');
        return deps.atlasVisitedForUser(uid);
      });
      this.methods.set('atlas.bucketList', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('atlas reads require an authenticated user context');
        return deps.atlasBucketForUser(uid);
      });
    }
    if (has('db:read:vacay')) {
      this.methods.set('vacay.mine', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('vacay reads require an authenticated user context');
        return deps.vacayForUser(uid);
      });
    }
    if (has('db:read:collections')) {
      this.methods.set('collections.listMine', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('collection reads require an authenticated user context');
        return deps.listCollectionsForUser(uid);
      });
      // getCollection is user-scoped by the service (it takes the acting user), so a
      // plugin can only fetch a collection the acting user owns.
      this.methods.set('collections.get', (p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('collection reads require an authenticated user context');
        return deps.getCollectionForUser(uid, num(p.id, 'id'));
      });
    }
    if (has('db:write:collections')) {
      // Collections write. The service enforces per-collection role itself
      // (owner/admin/editor via assertCanEdit) against the HOST-bound acting user —
      // the wiring maps its 403/404 to RESOURCE_FORBIDDEN. Inputs are schema-validated.
      const requireUid = (uid: number | undefined): number => {
        if (uid === undefined) throw new ForbiddenResource('collection writes require an authenticated user context');
        return uid;
      };
      this.methods.set('collections.create', (p, uid) => {
        const parsed = collectionCreateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid collection: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        return deps.createCollectionForUser(requireUid(uid), parsed.data as Record<string, unknown>);
      });
      this.methods.set('collections.update', (p, uid) => {
        const parsed = collectionUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid collection: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        return deps.updateCollectionForUser(requireUid(uid), num(p.id, 'id'), parsed.data as Record<string, unknown>);
      });
      this.methods.set('collections.savePlace', (p, uid) => {
        const parsed = collectionSavePlaceRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid place: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        return deps.saveCollectionPlace(requireUid(uid), parsed.data as Record<string, unknown>);
      });
      this.methods.set('collections.copyToTrip', (p, uid) => {
        const parsed = collectionCopyToTripRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid copy request: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        return deps.copyCollectionToTrip(requireUid(uid), parsed.data as Record<string, unknown>);
      });
      this.methods.set('collections.deletePlace', (p, uid) => deps.deleteCollectionPlace(requireUid(uid), num(p.placeId, 'placeId')));
    }
    if (has('db:write:atlas')) {
      // Atlas write: every row is the acting user's own (visited_countries /
      // visited_regions / bucket) — no trip scoping, no cross-tenant surface.
      const requireUid = (uid: number | undefined): number => {
        if (uid === undefined) throw new ForbiddenResource('atlas writes require an authenticated user context');
        return uid;
      };
      const code = (v: unknown, name: string): string => {
        if (typeof v !== 'string' || v.trim() === '' || v.length > 8) throw new BadParams(`${name} must be a short code`);
        return v.trim().toUpperCase();
      };
      this.methods.set('atlas.markCountry', (p, uid) => deps.markCountryVisited(requireUid(uid), code(p.code, 'code')));
      this.methods.set('atlas.unmarkCountry', (p, uid) => deps.unmarkCountryVisited(requireUid(uid), code(p.code, 'code')));
      this.methods.set('atlas.markRegion', (p, uid) => {
        const u = requireUid(uid);
        const regionName = typeof p.regionName === 'string' && p.regionName ? p.regionName.slice(0, 128) : String(p.regionCode ?? '');
        return deps.markRegionVisited(u, code(p.regionCode, 'regionCode'), regionName, code(p.countryCode, 'countryCode'));
      });
      this.methods.set('atlas.unmarkRegion', (p, uid) => deps.unmarkRegionVisited(requireUid(uid), code(p.regionCode, 'regionCode')));
      this.methods.set('atlas.createBucketItem', (p, uid) => {
        const u = requireUid(uid);
        const input = asPayload(p.input);
        if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('bucket item name is required');
        return deps.createBucketItem(u, input);
      });
      this.methods.set('atlas.deleteBucketItem', (p, uid) => deps.deleteBucketItem(requireUid(uid), num(p.itemId, 'itemId')));
    }
    if (has('db:write:vacay')) {
      // Vacay write: the plan is resolved host-side from the acting user's active
      // plan — a plugin can never name another plan. toggleEntry only ever toggles
      // the ACTING USER's own PTO day.
      const requireUid = (uid: number | undefined): number => {
        if (uid === undefined) throw new ForbiddenResource('vacay writes require an authenticated user context');
        return uid;
      };
      const dateStr = (v: unknown): string => {
        if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new BadParams('date must be YYYY-MM-DD');
        return v;
      };
      this.methods.set('vacay.toggleEntry', (p, uid) => deps.vacayToggleEntry(requireUid(uid), dateStr(p.date)));
      this.methods.set('vacay.toggleCompanyHoliday', (p, uid) =>
        deps.vacayToggleCompanyHoliday(requireUid(uid), dateStr(p.date), typeof p.note === 'string' ? p.note.slice(0, 256) : undefined));
    }
    if (has('db:write:journal')) {
      // Journal write: journeyService.canEdit self-gates every call against the
      // acting user (owner/contributor) — the wiring maps a refusal to
      // RESOURCE_FORBIDDEN. Journeys are user-scoped, not trip-scoped.
      const requireUid = (uid: number | undefined): number => {
        if (uid === undefined) throw new ForbiddenResource('journal writes require an authenticated user context');
        return uid;
      };
      this.methods.set('journal.createEntry', (p, uid) => {
        const u = requireUid(uid);
        const input = asPayload(p.input);
        if (typeof input.entry_date !== 'string' || input.entry_date === '') throw new BadParams('entry_date is required');
        return deps.createJournalEntry(u, num(p.journeyId, 'journeyId'), input);
      });
      this.methods.set('journal.updateEntry', (p, uid) =>
        deps.updateJournalEntry(requireUid(uid), num(p.entryId, 'entryId'), asPayload(p.input)));
      this.methods.set('journal.deleteEntry', (p, uid) => deps.deleteJournalEntry(requireUid(uid), num(p.entryId, 'entryId')));
      this.methods.set('journal.createJourney', (p, uid) => deps.createJournal(requireUid(uid), asPayload(p.input)));
      this.methods.set('journal.deleteJourney', (p, uid) => deps.deleteJournal(requireUid(uid), num(p.journeyId, 'journeyId')));
    }
    if (has('db:read:daynotes')) {
      // Day notes are trip-scoped (core, no addon), so the standard membership gate applies.
      this.methods.set('daynotes.list', (p, uid) =>
        this.tripRead(p, uid, () => deps.listDayNotes(num(p.tripId, 'tripId'), num(p.dayId, 'dayId'))),
      );
    }

    if (has('db:read:costs')) {
      // "Costs" = budget items (trip-scoped). Same membership gate as trip reads;
      // additionally requires the Costs addon to be enabled (parity with the app,
      // where a disabled addon means there is nothing to read).
      this.methods.set('costs.getByTrip', (p, uid) =>
        this.tripRead(p, uid, () => {
          this.requireBudgetAddon();
          return deps.listCostsForTrip(num(p.tripId, 'tripId'));
        }),
      );
      // Cross-trip aggregate: every cost the acting user can access. The acting
      // user is host-bound; a job/onLoad (no user) is refused, same as tripRead.
      this.methods.set('costs.listMine', (p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('cost reads require an authenticated user context');
        this.requireBudgetAddon();
        return deps.listCostsForUser(uid);
      });
    }

    if (has('db:write:costs')) {
      // The first plugin path that MUTATES core data. Gate it exactly like a
      // normal web-app/MCP budget write: addon enabled + trip access + the
      // 'budget_edit' permission for the host-bound acting user.
      this.methods.set('costs.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        if (uid === undefined) throw new ForbiddenResource('cost writes require an authenticated user context');
        this.requireBudgetAddon();
        const parsed = budgetCreateItemRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid cost: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        if (!this.deps.canAccessTrip(tripId, uid)) throw new ForbiddenResource(`no access to trip ${tripId}`);
        if (!this.deps.canEditCosts(tripId, uid)) throw new ForbiddenResource(`no permission to edit costs on trip ${tripId}`);
        return deps.createCost(tripId, parsed.data);
      });
      // Same gate as costs.create — addon + trip access + the acting user's
      // 'budget_edit' permission — plus the item id. updateCost re-freezes the FX
      // rate through BudgetService.update exactly like the create path.
      this.methods.set('costs.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const itemId = num(p.itemId, 'itemId');
        if (uid === undefined) throw new ForbiddenResource('cost writes require an authenticated user context');
        this.requireBudgetAddon();
        const parsed = budgetUpdateItemRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid cost: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        if (!this.deps.canAccessTrip(tripId, uid)) throw new ForbiddenResource(`no access to trip ${tripId}`);
        if (!this.deps.canEditCosts(tripId, uid)) throw new ForbiddenResource(`no permission to edit costs on trip ${tripId}`);
        return deps.updateCost(tripId, itemId, parsed.data);
      });
      // Deleting a cost is a budget write too: gated by db:write:costs and, per the
      // app, the acting user's 'budget_edit' permission on the trip.
      this.methods.set('costs.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const itemId = num(p.itemId, 'itemId');
        if (uid === undefined) throw new ForbiddenResource('cost writes require an authenticated user context');
        this.requireBudgetAddon();
        if (!this.deps.canAccessTrip(tripId, uid)) throw new ForbiddenResource(`no access to trip ${tripId}`);
        if (!this.deps.canEditCosts(tripId, uid)) throw new ForbiddenResource(`no permission to edit costs on trip ${tripId}`);
        return deps.deleteCost(tripId, itemId);
      });
    }

    // --- Core planner writes (#1429). Each mirrors costs.create: validate the
    // input against the SAME @trek/shared schema the web app uses, then gate on
    // trip access + the entity's edit permission for the HOST-bound acting user
    // (a job/onLoad has no user, so its writes are refused). The delegating deps
    // reuse the real services + broadcast the same events, so the app stays live. ---
    if (has('db:write:places')) {
      this.methods.set('places.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'place');
        const parsed = placeCreateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid place: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.capStrings(parsed.data as Record<string, unknown>, PLACE_STR_LIMITS);
        this.requireTripEdit(tripId, actor, deps.canEditPlaces);
        return deps.createPlace(tripId, parsed.data as Record<string, unknown>);
      });
      this.methods.set('places.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const placeId = num(p.placeId, 'placeId');
        const actor = this.requireActor(uid, 'place');
        const parsed = placeUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid place: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.capStrings(parsed.data as Record<string, unknown>, PLACE_STR_LIMITS);
        this.requireTripEdit(tripId, actor, deps.canEditPlaces);
        return deps.updatePlace(tripId, placeId, parsed.data as Record<string, unknown>);
      });
      this.methods.set('places.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const placeId = num(p.placeId, 'placeId');
        const actor = this.requireActor(uid, 'place');
        this.requireTripEdit(tripId, actor, deps.canEditPlaces);
        return deps.deletePlace(tripId, placeId);
      });
    }

    if (has('db:write:days')) {
      this.methods.set('days.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'day');
        const parsed = dayCreateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid day: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.createDay(tripId, parsed.data as Record<string, unknown>);
      });
      this.methods.set('days.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const dayId = num(p.dayId, 'dayId');
        const actor = this.requireActor(uid, 'day');
        const parsed = dayUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid day: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.updateDay(tripId, dayId, parsed.data as Record<string, unknown>);
      });
      this.methods.set('days.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const dayId = num(p.dayId, 'dayId');
        const actor = this.requireActor(uid, 'day');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.deleteDay(tripId, dayId);
      });
    }

    if (has('db:write:itinerary')) {
      // Assigning/removing a place on a day is a DAY edit in the app (day_edit), so
      // gate it with canEditDays; the wiring also checks the day AND place belong to
      // the trip so a plugin can't cross-link another trip's rows.
      this.methods.set('itinerary.assign', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const dayId = num(p.dayId, 'dayId');
        const placeId = num(p.placeId, 'placeId');
        const actor = this.requireActor(uid, 'itinerary');
        const notes = p.notes === undefined || p.notes === null ? null : str(p.notes, 'notes');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.assignPlaceToDay(tripId, dayId, placeId, notes);
      });
      this.methods.set('itinerary.unassign', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const assignmentId = num(p.assignmentId, 'assignmentId');
        const actor = this.requireActor(uid, 'itinerary');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.unassignPlace(tripId, assignmentId);
      });
    }

    if (has('db:write:trips')) {
      this.methods.set('trips.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'trip');
        const parsed = tripUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid trip: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.capStrings(parsed.data as Record<string, unknown>, TRIP_STR_LIMITS);
        this.requireTripEdit(tripId, actor, deps.canEditTrip);
        return deps.updateTrip(tripId, actor, parsed.data as Record<string, unknown>);
      });
    }

    if (has('db:create:trips')) {
      // Create a brand-new trip owned by the acting user — the capability that
      // unlocks importers (Google MyMaps, booking dumps, calendar sync). Gated by
      // the app's own 'trip_create' right + a bound user (a job can't create one).
      this.methods.set('trips.create', (p, uid) => {
        const actor = this.requireActor(uid, 'trip');
        const parsed = tripCreateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid trip: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.capStrings(parsed.data as Record<string, unknown>, TRIP_STR_LIMITS);
        if (!deps.canCreateTrip(actor)) throw new ForbiddenResource('no permission to create trips');
        return deps.createTripForUser(actor, parsed.data as Record<string, unknown>);
      });
    }

    if (has('rates:read')) {
      // Exchange rates are tenant-free (like weather) — a cached upstream feed, no
      // user or trip. Useful for any plugin that shows or converts money.
      this.methods.set('rates.get', (p) => deps.getRates(str(p.base, 'base')));
    }

    if (has('db:write:daynotes')) {
      // Day notes are edited under the app's 'day_edit' permission (like days). The
      // wiring verifies the day belongs to the trip, so a plugin can't note a day on
      // another trip. Text is required; time/icon/sort_order are optional.
      this.methods.set('daynotes.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const dayId = num(p.dayId, 'dayId');
        const actor = this.requireActor(uid, 'day note');
        const input = asPayload(p.input);
        if (typeof input.text !== 'string' || input.text.trim() === '') throw new BadParams('note text is required');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.createDayNote(tripId, dayId, input);
      });
      this.methods.set('daynotes.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const dayId = num(p.dayId, 'dayId');
        const noteId = num(p.noteId, 'noteId');
        const actor = this.requireActor(uid, 'day note');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.updateDayNote(tripId, dayId, noteId, asPayload(p.input));
      });
      this.methods.set('daynotes.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const dayId = num(p.dayId, 'dayId');
        const noteId = num(p.noteId, 'noteId');
        const actor = this.requireActor(uid, 'day note');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.deleteDayNote(tripId, dayId, noteId);
      });
    }

    if (has('db:write:reservations')) {
      // Bookings write. Gated exactly like the reservations REST/MCP path: trip
      // access + the 'reservation_edit' permission for the HOST-bound acting user.
      // The delegating deps reuse the real ReservationsService so the accommodation,
      // budget-sync, notification and broadcast side effects match the web app 1:1.
      this.methods.set('reservations.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'reservation');
        const parsed = reservationCreateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid reservation: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        requireValidEndpoints((parsed.data as Record<string, unknown>).endpoints);
        this.requireTripEdit(tripId, actor, deps.canEditReservations);
        return deps.createReservation(tripId, parsed.data as Record<string, unknown>, actor);
      });
      this.methods.set('reservations.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const reservationId = num(p.reservationId, 'reservationId');
        const actor = this.requireActor(uid, 'reservation');
        const parsed = reservationUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid reservation: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        requireValidEndpoints((parsed.data as Record<string, unknown>).endpoints);
        this.requireTripEdit(tripId, actor, deps.canEditReservations);
        return deps.updateReservation(tripId, reservationId, parsed.data as Record<string, unknown>, actor);
      });
      this.methods.set('reservations.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const reservationId = num(p.reservationId, 'reservationId');
        const actor = this.requireActor(uid, 'reservation');
        this.requireTripEdit(tripId, actor, deps.canEditReservations);
        return deps.deleteReservation(tripId, reservationId, actor);
      });
    }

    if (has('db:write:accommodations')) {
      // Lodging blocks (day_accommodations). Gated exactly like the accommodations
      // REST path: trip access + the 'day_edit' permission — NOT reservation_edit;
      // the blocks live in the day service and REST guards them the same way. The
      // wiring reuses dayService, so the auto-created partner hotel reservation,
      // the metadata sync on update and the cascade broadcasts match the web app.
      this.methods.set('accommodations.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'accommodation');
        const parsed = accommodationCreateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid accommodation: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.createAccommodation(tripId, parsed.data as Record<string, unknown>);
      });
      this.methods.set('accommodations.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const accommodationId = num(p.accommodationId, 'accommodationId');
        const actor = this.requireActor(uid, 'accommodation');
        const parsed = accommodationUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid accommodation: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.updateAccommodation(tripId, accommodationId, parsed.data as Record<string, unknown>);
      });
      this.methods.set('accommodations.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const accommodationId = num(p.accommodationId, 'accommodationId');
        const actor = this.requireActor(uid, 'accommodation');
        this.requireTripEdit(tripId, actor, deps.canEditDays);
        return deps.deleteAccommodation(tripId, accommodationId);
      });
    }

    if (has('db:write:packing')) {
      // Packing list write. Gated exactly like the packing REST path — trip access +
      // the 'packing_edit' permission for the HOST-bound acting user. The deps reuse
      // packingService and replicate the #858 privacy-scoped broadcasts 1:1, so a
      // private item is never leaked to the whole trip room.
      this.methods.set('packing.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'packing item');
        const parsed = packingCreateItemRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid packing item: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        return deps.createPackingItem(tripId, parsed.data as Record<string, unknown>, actor);
      });
      this.methods.set('packing.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const itemId = num(p.itemId, 'itemId');
        const actor = this.requireActor(uid, 'packing item');
        const parsed = packingUpdateItemRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid packing item: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        return deps.updatePackingItem(tripId, itemId, parsed.data as Record<string, unknown>, actor);
      });
      this.methods.set('packing.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const itemId = num(p.itemId, 'itemId');
        const actor = this.requireActor(uid, 'packing item');
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        return deps.deletePackingItem(tripId, itemId);
      });
      // Bags carry no privacy — a plain packing:bag-* broadcast to the whole room.
      this.methods.set('packing.listBags', (p, uid) => this.tripRead(p, uid, () => deps.listPackingBags(num(p.tripId, 'tripId'))));
      this.methods.set('packing.createBag', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'packing bag');
        const input = asPayload(p.input);
        if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('bag name is required');
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        return deps.createPackingBag(tripId, input);
      });
      this.methods.set('packing.updateBag', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const bagId = num(p.bagId, 'bagId');
        const actor = this.requireActor(uid, 'packing bag');
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        return deps.updatePackingBag(tripId, bagId, asPayload(p.input));
      });
      this.methods.set('packing.deleteBag', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const bagId = num(p.bagId, 'bagId');
        const actor = this.requireActor(uid, 'packing bag');
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        return deps.deletePackingBag(tripId, bagId);
      });
      this.methods.set('packing.setBagMembers', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const bagId = num(p.bagId, 'bagId');
        const actor = this.requireActor(uid, 'packing bag');
        this.requireTripEdit(tripId, actor, deps.canEditPacking);
        const raw = asPayload(p).userIds;
        const userIds = Array.isArray(raw) ? raw.filter((x): x is number => typeof x === 'number') : [];
        return deps.setPackingBagMembers(tripId, bagId, userIds);
      });
    }

    if (has('weather:read')) {
      // Tenant-free host cache: forecast by coordinates + optional date. No user needed.
      this.methods.set('weather.get', (p) => deps.getWeather(num(p.lat, 'lat'), num(p.lng, 'lng'), typeof p.date === 'string' ? p.date : undefined));
    }
    if (has('db:read:categories')) {
      // Global, read-only reference list — carries no tenant data.
      this.methods.set('categories.list', () => deps.listCategories());
    }
    if (has('db:read:tags')) {
      // The acting user's own tags (not trip-scoped) — refuse a userless context.
      this.methods.set('tags.list', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('tag reads require an authenticated user context');
        return deps.listTagsForUser(uid);
      });
    }
    if (has('db:write:tags')) {
      this.methods.set('tags.create', (p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('tag writes require an authenticated user context');
        const input = asPayload(p.input);
        if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('tag name is required');
        return deps.createTagForUser(uid, input.name, typeof input.color === 'string' ? input.color : undefined);
      });
      this.methods.set('tags.update', (p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('tag writes require an authenticated user context');
        const input = asPayload(p.input);
        return deps.updateTagForUser(uid, num(p.tagId, 'tagId'), typeof input.name === 'string' ? input.name : undefined, typeof input.color === 'string' ? input.color : undefined);
      });
      this.methods.set('tags.delete', (p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('tag writes require an authenticated user context');
        return deps.deleteTagForUser(uid, num(p.tagId, 'tagId'));
      });
    }
    if (has('db:read:todos')) {
      this.methods.set('todos.list', (p, uid) => this.tripRead(p, uid, () => deps.listTodos(num(p.tripId, 'tripId'))));
    }
    if (has('db:write:todos')) {
      // Todos are edited under the app's 'packing_edit' permission (like the REST path).
      this.methods.set('todos.create', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const actor = this.requireActor(uid, 'todo');
        const input = asPayload(p.input);
        if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('todo name is required');
        this.requireTripEdit(tripId, actor, deps.canEditTodos);
        return deps.createTodo(tripId, input);
      });
      this.methods.set('todos.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const todoId = num(p.todoId, 'todoId');
        const actor = this.requireActor(uid, 'todo');
        this.requireTripEdit(tripId, actor, deps.canEditTodos);
        return deps.updateTodo(tripId, todoId, asPayload(p.input));
      });
      this.methods.set('todos.delete', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const todoId = num(p.todoId, 'todoId');
        const actor = this.requireActor(uid, 'todo');
        this.requireTripEdit(tripId, actor, deps.canEditTodos);
        return deps.deleteTodo(tripId, todoId);
      });
    }

    if (has('db:meta')) {
      // A plugin's OWN namespaced key/value store attached to a core entity. Not
      // core data — but the entity must belong to a trip the acting user can
      // ACCESS, so a plugin can't stash/read metadata against another tenant's rows.
      this.methods.set('meta.get', (p, uid) => { const e = this.metaEntity(p, uid, false); return deps.metaGet(e.entityType, e.entityId, str(p.key, 'key')); });
      this.methods.set('meta.set', (p, uid) => { const e = this.metaEntity(p, uid, true); return deps.metaSet(e.entityType, e.entityId, str(p.key, 'key'), p.value); });
      this.methods.set('meta.list', (p, uid) => { const e = this.metaEntity(p, uid, false); return deps.metaList(e.entityType, e.entityId); });
      this.methods.set('meta.delete', (p, uid) => { const e = this.metaEntity(p, uid, true); return deps.metaDelete(e.entityType, e.entityId, str(p.key, 'key')); });
    }

    if (has('db:read:users')) {
      // Scope to people the acting user can actually see (self or a trip they
      // share) so a plugin can't enumerate every account's profile by looping ids.
      this.methods.set('users.getById', (p, uid) => {
        const id = num(p.id, 'id');
        if (uid === undefined) throw new ForbiddenResource('user reads require an authenticated user context');
        if (id !== uid && !this.deps.canSeeUser(uid, id)) throw new ForbiddenResource(`no access to user ${id}`);
        return deps.db.prepare('SELECT id, username, display_name, avatar FROM users WHERE id = ?').get(id);
      });
    }

    if (has('ws:broadcast:trip')) {
      // Gate the TARGET the same way reads are gated: a plugin may only push to a
      // trip room the acting user is a member of — never an arbitrary/other-tenant
      // trip. (Event-type namespacing alone doesn't cross the membership boundary.)
      this.methods.set('ws.broadcastToTrip', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        if (uid === undefined) throw new ForbiddenResource('broadcasts require an authenticated user context');
        if (!this.deps.canAccessTrip(tripId, uid)) throw new ForbiddenResource(`no access to trip ${tripId}`);
        deps.broadcastToTrip(tripId, str(p.event, 'event'), asPayload(p.data));
        return { ok: true };
      });
    }
    if (has('ws:broadcast:user')) {
      // Restrict to the acting user's own connections — a plugin may not push to
      // an arbitrary user it has no relationship to.
      this.methods.set('ws.broadcastToUser', (p, uid) => {
        const userId = num(p.userId, 'userId');
        if (uid === undefined || userId !== uid) {
          throw new ForbiddenResource('a plugin may only broadcast to the acting user');
        }
        deps.broadcastToUser(userId, { event: str(p.event, 'event'), ...asPayload(p.data) });
        return { ok: true };
      });
    }

    if (has('notify:send')) {
      // Host-mediated notification. The plugin supplies only plain text + a target;
      // the host owns recipient resolution, channel fan-out and per-user preferences.
      // Recipients are FORCED to the acting user (scope 'user', targetId===uid) or a
      // trip the acting user is a member of (scope 'trip'); scope 'admin' is refused,
      // so there is no arbitrary-recipient / admin-broadcast path (no spam, no phishing).
      this.methods.set('notify.send', (p, uid) => {
        const actor = this.requireActor(uid, 'notification');
        const input = asPayload(p.input);
        // Emoji-stripped so a bell/push notification matches TREK's lucide-only UI (also
        // trims + collapses whitespace). An all-emoji title collapses to '' → rejected.
        const title = typeof input.title === 'string' ? stripEmoji(input.title) : '';
        const body = typeof input.body === 'string' ? stripEmoji(input.body) : '';
        if (!title || title.length > 200) throw new BadParams('notification title is required (max 200 chars)');
        if (!body || body.length > 1000) throw new BadParams('notification body is required (max 1000 chars)');
        const scope = input.scope;
        if (scope !== 'user' && scope !== 'trip') throw new BadParams("scope must be 'user' or 'trip'");
        const targetId = num(input.targetId, 'targetId');
        if (scope === 'user' && targetId !== actor) throw new ForbiddenResource('a plugin may only notify the acting user');
        if (scope === 'trip' && !deps.canAccessTripForNotify(targetId, actor)) throw new ForbiddenResource('the acting user is not a member of that trip');
        let link: string | undefined;
        if (typeof input.link === 'string' && input.link !== '') {
          // In-app path only. A bare startsWith check misses `/\evil.com`, `/<tab>/…`
          // etc. that browsers normalize to protocol-relative, so resolve against a
          // throwaway origin and require the result to stay on it (same rule as the
          // proxy's toRelativeLocation).
          let safe: string | null = null;
          try {
            const u = new URL(input.link, 'http://x.invalid');
            if (u.origin === 'http://x.invalid') safe = (u.pathname + u.search + u.hash);
          } catch { /* invalid → rejected below */ }
          if (!safe) throw new BadParams('link must be an in-app path starting with /');
          link = safe.slice(0, 512);
        }
        return deps.sendPluginNotification(this.pluginId, { title, body, link, scope, targetId });
      });
    }
    if (has('ai:invoke')) {
      // Host-mediated LLM. The host holds the (encrypted) credential and runs the
      // call under the acting user's resolved provider config; the plugin passes only
      // a prompt / JSON-schema. Output is returned as DATA — never auto-written — so
      // prompt-injection cannot reach a write without the plugin's own gated call.
      this.methods.set('ai.complete', (p, uid) => {
        const actor = this.requireActor(uid, 'AI');
        if (!deps.aiConfigured(actor)) throw new BadParams('no AI provider is configured for this user');
        const prompt = typeof p.prompt === 'string' ? p.prompt : '';
        if (prompt.trim() === '') throw new BadParams('prompt is required');
        if (prompt.length > 20000) throw new BadParams('prompt exceeds the 20000-char cap');
        return deps.aiComplete(actor, prompt, typeof p.system === 'string' ? p.system.slice(0, 4000) : undefined);
      });
      this.methods.set('ai.extract', (p, uid) => {
        const actor = this.requireActor(uid, 'AI');
        if (!deps.aiConfigured(actor)) throw new BadParams('no AI provider is configured for this user');
        const text = typeof p.text === 'string' ? p.text : '';
        if (text.trim() === '') throw new BadParams('text is required');
        if (text.length > 20000) throw new BadParams('text exceeds the 20000-char cap');
        if (typeof p.jsonSchema !== 'object' || p.jsonSchema === null) throw new BadParams('jsonSchema (an object) is required');
        return deps.aiExtract(actor, text, p.jsonSchema as object, typeof p.prompt === 'string' ? p.prompt.slice(0, 4000) : undefined);
      });
    }
    if (has('oauth:client')) {
      // Host-brokered outbound OAuth: return a short-lived access token for the acting
      // user (the host ran the flow + holds the refresh token). Never yields a token for
      // a userless context, and the plugin can never reach the refresh token/secret.
      this.methods.set('oauth.getToken', async (_p, uid) => {
        // Userless context (a job/scheduled task) → null, matching the SDK contract + mock
        // ("null when the user hasn't connected or in a userless context"), rather than
        // throwing RESOURCE_FORBIDDEN, which a background caller can't meaningfully handle.
        if (uid === undefined) return { accessToken: null };
        return { accessToken: await deps.getOAuthToken(this.pluginId, uid) };
      });
    }

    if (has('jobs:run')) {
      // Persistent scheduler: a plugin schedules a userless future callback (once or
      // recurring) that survives restarts. Same grant + risk class as its cron jobs.
      // Caps are enforced in the wiring (max entries, name/payload size, min interval).
      this.methods.set('scheduler.set', (p) => {
        const name = str(p.name, 'name');
        const dueAt = num(p.dueAt, 'dueAt');
        const everyMs = p.everyMs != null ? num(p.everyMs, 'everyMs') : undefined;
        return deps.schedulerSet(name, dueAt, everyMs, p.payload ?? null);
      });
      this.methods.set('scheduler.cancel', (p) => deps.schedulerCancel(str(p.name, 'name')));
    }

    // Inter-plugin capabilities (#plugins deps). Registered UNCONDITIONALLY — there
    // is no permission for these; the router authorizes each call against the
    // declared dependency edge + the target's `provides`/`emits` allowlist. The
    // acting user is forwarded so the target's export runs as the caller's user.
    this.methods.set('plugins.call', (p, uid) =>
      deps.callPlugin(str(p.targetId, 'targetId'), str(p.fn, 'fn'), p.args, uid),
    );
    this.methods.set('events.emit', (p) => {
      deps.emitPluginEvent(str(p.event, 'event'), p.payload);
      return { ok: true };
    });
    // The plugin's OWN per-user settings (the acting user's `scope:'user'` values,
    // decrypted host-side). Unconditional + not sensitive cross-tenant — it only ever
    // returns THIS plugin's config for the acting user. A userless context (job/onLoad)
    // has no user, so it returns undefined (the plugin falls back to ctx.config).
    this.methods.set('settings.get', (p, uid) => {
      if (uid === undefined) return { value: undefined };
      return { value: deps.getUserSetting(this.pluginId, uid, str(p.key, 'key')) };
    });
  }

  /**
   * Membership-check every trip read against the acting user. The acting user is
   * bound by the HOST from the authenticated invocation (see the supervisor's
   * invocation map) — NOT taken from a plugin-supplied `asUserId`, which a plugin
   * could set to any id to read another user's trips. If no acting user is bound
   * (a job / onLoad, or a forged call), the read is forbidden.
   */
  private tripRead(p: Record<string, unknown>, actingUserId: number | undefined, read: (userId: number) => unknown): unknown {
    const tripId = num(p.tripId, 'tripId');
    if (actingUserId === undefined) {
      throw new ForbiddenResource('trip reads require an authenticated user context');
    }
    if (!this.deps.canAccessTrip(tripId, actingUserId)) {
      throw new ForbiddenResource(`no access to trip ${tripId}`);
    }
    // The read runs only for a bound, membership-checked user — hand it through so
    // per-user visibility filters (e.g. packing's #858 private items) can apply.
    return read(actingUserId);
  }

  /** Refuse costs.* calls when the Costs (budget) addon is disabled. */
  private requireBudgetAddon(): void {
    if (!this.deps.budgetAddonEnabled()) {
      throw new ForbiddenResource('the costs addon is disabled');
    }
  }

  /**
   * Every write needs a HOST-bound acting user. A job / onLoad (no user) or a call
   * with a forged/unknown invocation id resolves to undefined and is refused — a
   * plugin can never write "as" an arbitrary user.
   */
  private requireActor(uid: number | undefined, noun: string): number {
    if (uid === undefined) throw new ForbiddenResource(`${noun} writes require an authenticated user context`);
    return uid;
  }

  /**
   * The @trek/shared write schemas don't carry the string-length caps the REST
   * controllers add, so mirror those caps here — otherwise a plugin could write a
   * field the web app would reject with 400 (e.g. a 100k-char place name).
   */
  private capStrings(input: Record<string, unknown>, limits: Record<string, number>): void {
    for (const [field, max] of Object.entries(limits)) {
      const v = input[field];
      if (typeof v === 'string' && v.length > max) throw new BadParams(`${field} must be ${max} characters or fewer`);
    }
  }

  /** A write is allowed only if the acting user can access AND edit the trip. */
  private requireTripEdit(tripId: number, uid: number, canEdit: (t: number, u: number) => boolean): void {
    if (!this.deps.canAccessTrip(tripId, uid)) throw new ForbiddenResource(`no access to trip ${tripId}`);
    if (!canEdit(tripId, uid)) throw new ForbiddenResource(`no permission to edit trip ${tripId}`);
  }

  /**
   * Validate a metadata target and gate it: the entity type must be one we support,
   * and the trip it belongs to must be accessible to the host-bound acting user.
   */
  private metaEntity(p: Record<string, unknown>, uid: number | undefined, write: boolean): { entityType: string; entityId: number } {
    const entityType = str(p.entityType, 'entityType');
    if (!META_ENTITY_TYPES.has(entityType)) {
      throw new BadParams(`invalid entityType "${entityType}" (${[...META_ENTITY_TYPES].join('|')})`);
    }
    const entityId = num(p.entityId, 'entityId');
    if (uid === undefined) throw new ForbiddenResource('metadata requires an authenticated user context');
    const tripId = this.deps.metaEntityTrip(entityType, entityId);
    if (tripId === undefined || !this.deps.canAccessTrip(tripId, uid)) {
      throw new ForbiddenResource(`no access to ${entityType} ${entityId}`);
    }
    // Reads need trip access; WRITES additionally need the entity's edit permission
    // — so a read-only member can't overwrite/delete metadata an editor created
    // (matches how core writes are gated). Accommodations ride on day_edit (like
    // the accommodation write path), reservations on reservation_edit.
    if (write) {
      const canEdit = entityType === 'trip' ? this.deps.canEditTrip
        : entityType === 'place' ? this.deps.canEditPlaces
        : entityType === 'reservation' ? this.deps.canEditReservations
        : this.deps.canEditDays; // day + accommodation
      if (!canEdit(tripId, uid)) throw new ForbiddenResource(`no permission to edit ${entityType} ${entityId}`);
    }
    return { entityType, entityId };
  }

  async dispatch(req: RpcRequest, actingUserId?: number): Promise<RpcResponse | RpcError> {
    const params = (req.params ?? {}) as Record<string, unknown>;
    const res = await this.handle(req, params, actingUserId);
    // Audit the core-data / broadcast surface (incl. denials) at the boundary.
    if (this.deps.audit && isAuditable(req.method)) {
      try {
        this.deps.audit({
          pluginId: this.pluginId,
          actingUserId,
          method: req.method,
          resource: auditResource(req.method, params),
          code: res.ok ? 'ok' : (res as RpcError).error.code,
        });
      } catch {
        /* auditing must never break a call */
      }
    }
    return res;
  }

  private async handle(
    req: RpcRequest,
    params: Record<string, unknown>,
    actingUserId?: number,
  ): Promise<RpcResponse | RpcError> {
    const handler = this.methods.get(req.method);
    if (!handler) {
      const known = (KNOWN_METHODS as readonly string[]).includes(req.method as KnownMethod);
      return this.err(
        req.id,
        known ? 'PERMISSION_DENIED' : 'UNKNOWN_METHOD',
        known
          ? `${req.method} requires a permission "${this.pluginId}" was not granted`
          : `unknown method ${req.method}`,
      );
    }
    try {
      const result = await handler(params, actingUserId);
      return { k: 'res', id: req.id, ok: true, result };
    } catch (e) {
      if (e instanceof BadParams) return this.err(req.id, 'BAD_PARAMS', e.message);
      if (e instanceof ForbiddenResource) return this.err(req.id, 'RESOURCE_FORBIDDEN', e.message);
      return this.err(req.id, 'HOST_ERROR', e instanceof Error ? e.message : 'internal error');
    }
  }

  private err(id: string, code: RpcError['error']['code'], message: string): RpcError {
    return { k: 'res', id, ok: false, error: { code, message } };
  }

  /** Release host-held resources (the plugin's own db handle) on terminal stop. */
  dispose(): void {
    try {
      this.deps.data.close();
    } catch {
      /* already closed */
    }
  }
}

function asArgs(v: unknown): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  throw new BadParams('args must be an array');
}
/** Coerce a db.tx `ops` param into a validated {sql, args}[] before it reaches the
 * data db — each op must carry a string sql and, if present, an array of args. */
function asTxOps(v: unknown): Array<{ sql: string; args?: unknown[] }> {
  if (!Array.isArray(v)) throw new BadParams('ops must be an array of { sql, args }');
  return v.map((op) => {
    const o = (op ?? {}) as Record<string, unknown>;
    return { sql: str(o.sql, 'ops[].sql'), args: asArgs(o.args) };
  });
}
function asPayload(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : { value: v };
}
/**
 * The reservation body is passthrough by contract, but a malformed `endpoints`
 * array would otherwise fail DEEP in the service (NOT-NULL mid-transaction) or be
 * dropped silently (missing coords) — both miserable to debug from a plugin. So
 * the plugin path pins the endpoint shape up front; absent stays absent
 * (update semantics: omitted = keep, [] = delete all).
 */
function requireValidEndpoints(v: unknown): void {
  if (v === undefined) return;
  const parsed = reservationEndpointsInputSchema.safeParse(v);
  if (!parsed.success) throw new BadParams(`invalid endpoints: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
}
