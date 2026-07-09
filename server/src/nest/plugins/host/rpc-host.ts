import {
  budgetCreateItemRequestSchema, type BudgetCreateItemRequest,
  budgetUpdateItemRequestSchema, type BudgetUpdateItemRequest,
  placeCreateRequestSchema, placeUpdateRequestSchema,
  dayCreateRequestSchema, dayUpdateRequestSchema,
  tripUpdateRequestSchema,
  reservationCreateRequestSchema, reservationUpdateRequestSchema,
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
  /** The acting user's own journals (journey addon must be enabled). */
  listJournalsForUser(userId: number): unknown;
  /** The acting user's visited countries + regions (atlas addon must be enabled). */
  atlasVisitedForUser(userId: number): unknown;
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
  // --- Cross-trip reads (membership baked in — every trip the acting user can access) ---
  /** Every trip the acting user owns or is a member of (the listTrips baseline). */
  listTripsForUser(userId: number): unknown[];
  /** Every reservation across the acting user's accessible trips. */
  listReservationsForUser(userId: number): unknown[];
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
    }

    if (has('db:read:trips')) {
      this.methods.set('trips.getById', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM trips WHERE id = ?').get(num(p.tripId, 'tripId'))),
      );
      this.methods.set('trips.getPlaces', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM places WHERE trip_id = ? ORDER BY day_id, position').all(num(p.tripId, 'tripId'))),
      );
      this.methods.set('trips.getReservations', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM reservations WHERE trip_id = ? ORDER BY reservation_time').all(num(p.tripId, 'tripId'))),
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

    // User-scoped addon reads: the acting user's OWN journals/atlas/vacay across all
    // their trips (not one trip), so — like costs.listMine — they are gated on a bound
    // acting user, not a tripId; the wiring additionally refuses a disabled addon.
    if (has('db:read:journal')) {
      this.methods.set('journal.listMine', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('journal reads require an authenticated user context');
        return deps.listJournalsForUser(uid);
      });
    }
    if (has('db:read:atlas')) {
      this.methods.set('atlas.visited', (_p, uid) => {
        if (uid === undefined) throw new ForbiddenResource('atlas reads require an authenticated user context');
        return deps.atlasVisitedForUser(uid);
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
        this.requireTripEdit(tripId, actor, deps.canEditTrip);
        return deps.updateTrip(tripId, actor, parsed.data as Record<string, unknown>);
      });
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
        this.requireTripEdit(tripId, actor, deps.canEditReservations);
        return deps.createReservation(tripId, parsed.data as Record<string, unknown>, actor);
      });
      this.methods.set('reservations.update', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        const reservationId = num(p.reservationId, 'reservationId');
        const actor = this.requireActor(uid, 'reservation');
        const parsed = reservationUpdateRequestSchema.safeParse(p.input);
        if (!parsed.success) throw new BadParams(`invalid reservation: ${parsed.error.issues[0]?.message ?? 'bad input'}`);
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
    if (entityType !== 'trip' && entityType !== 'place' && entityType !== 'day') {
      throw new BadParams(`invalid entityType "${entityType}" (trip|place|day)`);
    }
    const entityId = num(p.entityId, 'entityId');
    if (uid === undefined) throw new ForbiddenResource('metadata requires an authenticated user context');
    const tripId = this.deps.metaEntityTrip(entityType, entityId);
    if (tripId === undefined || !this.deps.canAccessTrip(tripId, uid)) {
      throw new ForbiddenResource(`no access to ${entityType} ${entityId}`);
    }
    // Reads need trip access; WRITES additionally need the entity's edit permission
    // — so a read-only member can't overwrite/delete metadata an editor created
    // (matches how core writes are gated).
    if (write) {
      const canEdit = entityType === 'trip' ? this.deps.canEditTrip
        : entityType === 'place' ? this.deps.canEditPlaces
        : this.deps.canEditDays;
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
function asPayload(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : { value: v };
}
