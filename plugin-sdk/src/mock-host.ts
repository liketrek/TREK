import type { PluginContext, Trip, Place, Day, Reservation, PackingItem, TripFile, BudgetItem, User } from './index.js';

/**
 * A mock PluginContext for unit-testing a plugin without a running TREK
 * (#plugins, M6). It enforces the SAME permission model: calling a capability
 * your plugin wasn't granted throws PERMISSION_DENIED — so a test can prove your
 * plugin degrades gracefully. Data access returns configured fixtures; the db is
 * a lightweight recorder (configure results, or use an integration test for real
 * SQL).
 */

export interface MockHostOptions {
  grants?: string[];
  config?: Record<string, unknown>;
  /**
   * Fixtures keyed by trip id; `members` gates access like the real host.
   * `costs` seeds budget items; `canEditCosts` (default true) models the
   * 'budget_edit' permission for `costs.create`.
   */
  trips?: Record<
    number,
    {
      members: number[]; data?: unknown; places?: unknown[]; reservations?: unknown[]; costs?: unknown[];
      days?: unknown[]; assignments?: unknown[]; packing?: unknown[]; files?: unknown[];
      /** Default true — model the place_edit / day_edit / trip_edit permission for writes. */
      canEditCosts?: boolean; canEditPlaces?: boolean; canEditDays?: boolean; canEditTrip?: boolean;
    }
  >;
  users?: Record<number, unknown>;
  /** Optional canned db.query results, keyed by the exact sql string. */
  queryResults?: Record<string, unknown[]>;
  /** The host-bound acting user for costs.* (a job/onLoad has none → refused). */
  actingUserId?: number;
  /** Whether the Costs (budget) addon is enabled; gates all costs.* (default true). */
  budgetAddonEnabled?: boolean;
  /** Exports of the plugins this one depends on, keyed by plugin id then fn name.
   * `ctx.plugins.call(id, fn, args)` invokes the matching function; a missing entry
   * throws RESOURCE_FORBIDDEN (models "not a satisfied dependency / not exported"). */
  pluginExports?: Record<string, Record<string, (args: unknown) => unknown>>;
}

export interface MockHost {
  ctx: PluginContext;
  /** Everything the plugin did, for assertions. */
  calls: { method: string; args: unknown[] }[];
  logs: { level: string; msg: string }[];
  broadcasts: { kind: 'trip' | 'user'; target: number; event: string; data: unknown }[];
  /** Events the plugin published via ctx.events.emit, for assertions. */
  emitted: { name: string; payload: unknown }[];
}

class PermissionDenied extends Error {}

export function createMockHost(opts: MockHostOptions = {}): MockHost {
  const grants = new Set(opts.grants ?? []);
  const calls: MockHost['calls'] = [];
  const logs: MockHost['logs'] = [];
  const broadcasts: MockHost['broadcasts'] = [];
  const emitted: MockHost['emitted'] = [];

  const need = (perm: string, method: string) => {
    calls.push({ method, args: [] });
    if (!grants.has(perm)) throw new PermissionDenied(`PERMISSION_DENIED: ${method} requires ${perm}`);
  };
  const assertMember = (tripId: number, asUserId: number) => {
    const t = opts.trips?.[tripId];
    if (!t || !t.members.includes(asUserId)) throw new Error(`RESOURCE_FORBIDDEN: no access to trip ${tripId}`);
    return t;
  };
  const requireBudgetAddon = () => {
    if (opts.budgetAddonEnabled === false) throw new Error('RESOURCE_FORBIDDEN: the costs addon is disabled');
  };
  const requireActingUser = (): number => {
    if (opts.actingUserId === undefined) throw new Error('RESOURCE_FORBIDDEN: this call requires an authenticated user context');
    return opts.actingUserId;
  };
  const assertEdit = (
    t: { canEditPlaces?: boolean; canEditDays?: boolean; canEditTrip?: boolean },
    flag: 'canEditPlaces' | 'canEditDays' | 'canEditTrip',
    tripId: number,
  ) => {
    if (t[flag] === false) throw new Error(`RESOURCE_FORBIDDEN: no permission to edit trip ${tripId}`);
  };
  const rows = (arr: unknown[] | undefined): Array<Record<string, unknown>> => (arr ?? []) as Array<Record<string, unknown>>;
  // In-memory namespaced metadata store for ctx.meta (per mock plugin).
  const metaStore: Record<string, unknown> = {};
  const metaKey = (et: string, eid: number, key: string) => `${et}:${eid}:${key}`;
  const metaGate = (entityType: string, entityId: number) => {
    // The real host resolves place/day → trip; the mock only membership-checks the
    // 'trip' entity type and otherwise just requires an acting user.
    if (entityType === 'trip') assertMember(entityId, requireActingUser());
    else requireActingUser();
  };

  const ctx: PluginContext = {
    id: 'mock-plugin',
    config: Object.freeze({ ...(opts.config ?? {}) }),
    db: {
      async query(sql) {
        need('db:own', 'db.query');
        return (opts.queryResults?.[sql] ?? []) as never[];
      },
      async exec() {
        need('db:own', 'db.exec');
        return { changes: 0 };
      },
      async migrate() {
        need('db:own', 'db.migrate');
        return { applied: true };
      },
    },
    trips: {
      async getById(tripId, asUserId) {
        need('db:read:trips', 'trips.getById');
        return (assertMember(tripId, asUserId ?? requireActingUser()).data ?? null) as Trip | null;
      },
      async getPlaces(tripId, asUserId) {
        need('db:read:trips', 'trips.getPlaces');
        return (assertMember(tripId, asUserId ?? requireActingUser()).places ?? []) as Place[];
      },
      async getReservations(tripId, asUserId) {
        need('db:read:trips', 'trips.getReservations');
        return (assertMember(tripId, asUserId ?? requireActingUser()).reservations ?? []) as Reservation[];
      },
      async update(tripId, input) {
        need('db:write:trips', 'trips.update');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditTrip', tripId);
        const data = (t.data ??= {}) as Record<string, unknown>;
        Object.assign(data, input);
        return data as Trip;
      },
    },
    packing: {
      async list(tripId) {
        need('db:read:packing', 'packing.list');
        return (assertMember(tripId, requireActingUser()).packing ?? []) as PackingItem[];
      },
    },
    files: {
      async list(tripId) {
        need('db:read:files', 'files.list');
        return (assertMember(tripId, requireActingUser()).files ?? []) as TripFile[];
      },
    },
    costs: {
      async getByTrip(tripId) {
        need('db:read:costs', 'costs.getByTrip');
        requireBudgetAddon();
        return (assertMember(tripId, requireActingUser()).costs ?? []) as BudgetItem[];
      },
      async listMine() {
        need('db:read:costs', 'costs.listMine');
        requireBudgetAddon();
        const uid = requireActingUser();
        return Object.values(opts.trips ?? {})
          .filter((t) => t.members.includes(uid))
          .flatMap((t) => t.costs ?? []) as BudgetItem[];
      },
      async create(tripId, input) {
        need('db:write:costs', 'costs.create');
        requireBudgetAddon();
        const t = assertMember(tripId, requireActingUser());
        if (t.canEditCosts === false) {
          throw new Error(`RESOURCE_FORBIDDEN: no permission to edit costs on trip ${tripId}`);
        }
        const item = { id: (t.costs?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.costs ??= []).push(item);
        return item;
      },
      async update(tripId, itemId, input) {
        need('db:write:costs', 'costs.update');
        requireBudgetAddon();
        const t = assertMember(tripId, requireActingUser());
        if (t.canEditCosts === false) {
          throw new Error(`RESOURCE_FORBIDDEN: no permission to edit costs on trip ${tripId}`);
        }
        const item = rows(t.costs).find((x) => x.id === itemId);
        if (!item) throw new Error(`RESOURCE_FORBIDDEN: no cost ${itemId} on trip ${tripId}`);
        Object.assign(item, input);
        return item as BudgetItem;
      },
      async delete(tripId, itemId) {
        need('db:write:costs', 'costs.delete');
        requireBudgetAddon();
        const t = assertMember(tripId, requireActingUser());
        if (t.canEditCosts === false) {
          throw new Error(`RESOURCE_FORBIDDEN: no permission to edit costs on trip ${tripId}`);
        }
        const list = rows((t.costs ??= []));
        const i = list.findIndex((x) => x.id === itemId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no cost ${itemId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    places: {
      async create(tripId, input) {
        need('db:write:places', 'places.create');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditPlaces', tripId);
        const place = { id: (t.places?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.places ??= []).push(place);
        return place;
      },
      async update(tripId, placeId, input) {
        need('db:write:places', 'places.update');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditPlaces', tripId);
        const place = rows(t.places).find((x) => x.id === placeId);
        if (!place) throw new Error(`RESOURCE_FORBIDDEN: no place ${placeId} on trip ${tripId}`);
        Object.assign(place, input);
        return place as Place;
      },
      async delete(tripId, placeId) {
        need('db:write:places', 'places.delete');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditPlaces', tripId);
        const list = rows((t.places ??= []));
        const i = list.findIndex((x) => x.id === placeId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no place ${placeId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    days: {
      async create(tripId, input) {
        need('db:write:days', 'days.create');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditDays', tripId);
        const day = { id: (t.days?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.days ??= []).push(day);
        return day;
      },
      async update(tripId, dayId, input) {
        need('db:write:days', 'days.update');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditDays', tripId);
        const day = rows(t.days).find((x) => x.id === dayId);
        if (!day) throw new Error(`RESOURCE_FORBIDDEN: no day ${dayId} on trip ${tripId}`);
        Object.assign(day, input);
        return day as Day;
      },
      async delete(tripId, dayId) {
        need('db:write:days', 'days.delete');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditDays', tripId);
        const list = rows((t.days ??= []));
        const i = list.findIndex((x) => x.id === dayId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no day ${dayId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    itinerary: {
      async assign(tripId, dayId, placeId, notes) {
        need('db:write:itinerary', 'itinerary.assign');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditDays', tripId);
        const assignment = { id: (t.assignments?.length ?? 0) + 1, day_id: dayId, place_id: placeId, notes: notes ?? null };
        (t.assignments ??= []).push(assignment);
        return assignment;
      },
      async unassign(tripId, assignmentId) {
        need('db:write:itinerary', 'itinerary.unassign');
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditDays', tripId);
        const list = rows((t.assignments ??= []));
        const i = list.findIndex((x) => x.id === assignmentId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no assignment ${assignmentId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    meta: {
      async get(entityType, entityId, key) {
        need('db:meta', 'meta.get');
        metaGate(entityType, entityId);
        return metaStore[metaKey(entityType, entityId, key)] ?? null;
      },
      async set(entityType, entityId, key, value) {
        need('db:meta', 'meta.set');
        metaGate(entityType, entityId);
        metaStore[metaKey(entityType, entityId, key)] = value ?? null;
        return { key, value: value ?? null };
      },
      async list(entityType, entityId) {
        need('db:meta', 'meta.list');
        metaGate(entityType, entityId);
        const prefix = `${entityType}:${entityId}:`;
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(metaStore)) if (k.startsWith(prefix)) out[k.slice(prefix.length)] = metaStore[k];
        return out;
      },
      async delete(entityType, entityId, key) {
        need('db:meta', 'meta.delete');
        metaGate(entityType, entityId);
        const k = metaKey(entityType, entityId, key);
        const had = k in metaStore;
        delete metaStore[k];
        return { deleted: had };
      },
    },
    users: {
      async getById(id) {
        need('db:read:users', 'users.getById');
        return (opts.users?.[id] ?? null) as User | null;
      },
    },
    ws: {
      async broadcastToTrip(tripId, event, data) {
        need('ws:broadcast:trip', 'ws.broadcastToTrip');
        broadcasts.push({ kind: 'trip', target: tripId, event, data });
      },
      async broadcastToUser(userId, event, data) {
        need('ws:broadcast:user', 'ws.broadcastToUser');
        broadcasts.push({ kind: 'user', target: userId, event, data });
      },
    },
    log: {
      info: (msg) => logs.push({ level: 'info', msg }),
      warn: (msg) => logs.push({ level: 'warn', msg }),
      error: (msg) => logs.push({ level: 'error', msg }),
    },
    plugins: {
      async call(pluginId, fn, args) {
        calls.push({ method: 'plugins.call', args: [pluginId, fn, args] });
        const impl = opts.pluginExports?.[pluginId]?.[fn];
        if (typeof impl !== 'function') throw new Error(`RESOURCE_FORBIDDEN: plugin ${pluginId} does not export "${fn}"`);
        return impl(args);
      },
    },
    events: {
      emit(name, payload) {
        calls.push({ method: 'events.emit', args: [name, payload] });
        emitted.push({ name, payload });
      },
    },
  };

  return { ctx, calls, logs, broadcasts, emitted };
}
