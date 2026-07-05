import {
  budgetCreateItemRequestSchema, type BudgetCreateItemRequest,
  budgetUpdateItemRequestSchema, type BudgetUpdateItemRequest,
  placeCreateRequestSchema, placeUpdateRequestSchema,
  dayCreateRequestSchema, dayUpdateRequestSchema,
  tripUpdateRequestSchema,
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
