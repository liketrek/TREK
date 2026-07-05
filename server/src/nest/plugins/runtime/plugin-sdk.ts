/**
 * The plugin-author-facing SDK surface (#plugins, M1) — the minimal in-repo
 * version. The published `@trek/plugin-sdk` (M6) will re-export these types; for
 * now the runtime ships its own copy so the child has zero external deps.
 *
 * PURE — no server imports. This runs inside the isolated child. Every ctx
 * method is plumbing that turns a call into an RPC message to the host; the
 * child holds no db handle, no secrets, no network by default.
 */

/** Mirrors the published package's constant — bumped on any breaking API change. */
export const PLUGIN_API_VERSION = 1 as const;

export interface PluginContext {
  readonly id: string;
  readonly config: Readonly<Record<string, unknown>>;
  db: {
    query<T = unknown>(sql: string, ...args: unknown[]): Promise<T[]>;
    exec(sql: string, ...args: unknown[]): Promise<{ changes: number }>;
    migrate(id: string, sql: string): Promise<{ applied: boolean }>;
  };
  trips: {
    // `asUserId` is accepted for source compatibility but IGNORED by the host —
    // trip reads are always membership-checked against the authenticated user of
    // the current invocation (the request's `req.user`), which the plugin cannot
    // override. Only reachable from a route handler (a user context); a job has
    // no user and its trip reads are refused.
    getById(tripId: number, asUserId?: number): Promise<unknown>;
    getPlaces(tripId: number, asUserId?: number): Promise<unknown[]>;
    getReservations(tripId: number, asUserId?: number): Promise<unknown[]>;
    /** Update trip fields (title/dates/currency/reminder_days/...); needs 'db:write:trips' + the acting user's 'trip_edit' permission. */
    update(tripId: number, input: Record<string, unknown>): Promise<unknown>;
  };
  // Read-only views of other trip subsystems (#1429 eco). Membership-checked like
  // `trips`; each needs its own db:read:* scope.
  packing: {
    /** A trip's packing items (hydrated bags/assignees). Needs 'db:read:packing'. */
    list(tripId: number): Promise<unknown[]>;
  };
  files: {
    /** A trip's files, trash excluded. Needs 'db:read:files'. */
    list(tripId: number): Promise<unknown[]>;
  };
  // "Costs" = budget items. Reads are membership-checked against the current
  // invocation's user (like `trips`); `create` additionally needs the acting
  // user's 'budget_edit' permission and the Costs addon enabled.
  costs: {
    getByTrip(tripId: number): Promise<unknown[]>;
    listMine(): Promise<unknown[]>;
    create(tripId: number, input: Record<string, unknown>): Promise<unknown>;
    update(tripId: number, itemId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, itemId: number): Promise<{ deleted: boolean }>;
  };
  // Core planner writes (#1429). Each is membership-checked against the current
  // invocation's user and needs the matching write scope + the app's edit
  // permission (place_edit / day_edit / trip_edit). Route context only.
  places: {
    create(tripId: number, input: Record<string, unknown>): Promise<unknown>;
    update(tripId: number, placeId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, placeId: number): Promise<{ deleted: boolean }>;
  };
  days: {
    create(tripId: number, input: Record<string, unknown>): Promise<unknown>;
    update(tripId: number, dayId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, dayId: number): Promise<{ deleted: boolean }>;
  };
  itinerary: {
    assign(tripId: number, dayId: number, placeId: number, notes?: string | null): Promise<unknown>;
    unassign(tripId: number, assignmentId: number): Promise<{ deleted: boolean }>;
  };
  // Your OWN namespaced key/value store attached to a trip/place/day (#1429), so
  // you can enrich core entities without forking the schema. The entity must belong
  // to a trip the current user can access. Values are JSON-serialisable.
  meta: {
    get(entityType: 'trip' | 'place' | 'day', entityId: number, key: string): Promise<unknown>;
    set(entityType: 'trip' | 'place' | 'day', entityId: number, key: string, value: unknown): Promise<unknown>;
    list(entityType: 'trip' | 'place' | 'day', entityId: number): Promise<Record<string, unknown>>;
    delete(entityType: 'trip' | 'place' | 'day', entityId: number, key: string): Promise<{ deleted: boolean }>;
  };
  users: {
    getById(id: number): Promise<unknown>;
  };
  ws: {
    broadcastToTrip(tripId: number, event: string, data: Record<string, unknown>): Promise<void>;
    broadcastToUser(userId: number, event: string, data: Record<string, unknown>): Promise<void>;
  };
  log: {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
  };
  /** Call a function another plugin exposes (must be a declared, satisfied dependency
   * that lists `fn` in its manifest `capabilities.provides`). Runs as the current user. */
  plugins: {
    call(pluginId: string, fn: string, args?: unknown): Promise<unknown>;
  };
  /** Publish an event to dependents that subscribed to it (must be declared in this
   * plugin's manifest `capabilities.emits`). Fire-and-forget. */
  events: {
    emit(name: string, payload?: unknown): void;
  };
}

export interface PluginRequest {
  method: string;
  path: string;
  query: Record<string, unknown>;
  body: unknown;
  user: { id: number; username: string; isAdmin: boolean } | null;
}
export interface PluginResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}
export interface PluginRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  auth?: boolean;
  handler(req: PluginRequest, ctx: PluginContext): Promise<PluginResponse>;
}
export interface PluginJob {
  id: string;
  schedule: string;
  handler(ctx: PluginContext): Promise<void>;
}
// ── Provider hooks (host→plugin): core asks a hook the plugin implements for data,
// gated by the matching hook:* permission. Each method also receives the per-
// invocation ctx, so any trip reads it makes bind to the authenticated user. ──
export interface Photo { id: string; title?: string; thumbnailUrl: string; fullUrl: string; takenAt?: string; }
export interface PhotoProvider {
  search(query: string, opts: { page: number; limit: number }): Promise<{ photos: Photo[]; total: number; hasMore: boolean }>;
  getById(id: string): Promise<Photo | null>;
}
export interface CalendarEvent { id: string; title: string; start: string; end: string; allDay: boolean; }
export interface CalendarSource {
  getName(): string;
  getEvents(userId: number, start: string, end: string): Promise<CalendarEvent[]>;
}
/** One row of extra place info TREK renders natively (reviews/ratings/links/…). */
export interface PlaceDetailItem { label: string; value?: string; url?: string; }
export interface PlaceDetailProvider {
  getDetails(placeId: number, ctx: PluginContext): Promise<PlaceDetailItem[]>;
}
/** A validation/warning a plugin raises on a trip; TREK surfaces it in the planner. */
export interface TripWarning { level: 'info' | 'warning' | 'error'; message: string; dayId?: number; placeId?: number; }
export interface WarningProvider {
  getWarnings(tripId: number, ctx: PluginContext): Promise<TripWarning[]>;
}

/** A core-event subscription (#1429 eco). Handlers run with NO user (like a job)
 * and receive only the event name + tripId — never the payload. Needs 'events:subscribe'. */
export interface PluginEventSubscription {
  on: string; // a core event name (e.g. 'place:created', 'day:updated') or '*' for all
  handler(payload: { event: string; tripId: number }, ctx: PluginContext): Promise<void> | void;
}

/** A function this plugin exposes to its dependents (declared in capabilities.provides). */
export type PluginExport = (args: unknown, ctx: PluginContext) => Promise<unknown> | unknown;

/** A subscription to another plugin's event. Authorized by declaring that plugin as a
 * dependency; the handler runs with NO user and receives the emitter's payload. */
export interface PluginSubscription {
  plugin: string;
  event: string;
  handler(payload: unknown, ctx: PluginContext): Promise<void> | void;
}

export interface PluginDefinition {
  onLoad?(ctx: PluginContext): Promise<void> | void;
  onUnload?(ctx: PluginContext): Promise<void> | void;
  routes?: PluginRoute[];
  jobs?: PluginJob[];
  events?: PluginEventSubscription[];
  hooks?: {
    photoProvider?: PhotoProvider;
    calendarSource?: CalendarSource;
    placeDetailProvider?: PlaceDetailProvider;
    warningProvider?: WarningProvider;
  };
  /** Functions exposed to dependents (names must match manifest capabilities.provides). */
  exports?: Record<string, PluginExport>;
  /** Subscriptions to other plugins' events (each `plugin` must be a declared dependency). */
  subscriptions?: PluginSubscription[];
}

/** Identity helper: gives authors types + a stable shape. A plain object works too. */
export function definePlugin(def: PluginDefinition): PluginDefinition {
  return def;
}

/** Transport the child entry wires to process.send / message correlation. */
export interface ChildTransport {
  rpc(method: string, params: Record<string, unknown>): Promise<unknown>;
  emit(topic: string, data: unknown): void;
}

/**
 * Build the ctx the plugin's handlers receive — every method is an RPC call.
 * `invocationId` (the host's reqId for the route/job currently being handled) is
 * attached to trip reads as `_inv` so the host can bind the acting user to THIS
 * invocation. It is undefined for the load-time ctx (onLoad), where trip reads
 * have no user and are refused.
 */
export function createPluginContext(
  id: string,
  config: Record<string, unknown>,
  t: ChildTransport,
  invocationId?: string,
): PluginContext {
  return {
    id,
    config: Object.freeze({ ...config }),
    db: {
      query: (sql, ...args) => t.rpc('db.query', { sql, args }) as Promise<never[]>,
      exec: (sql, ...args) => t.rpc('db.exec', { sql, args }) as Promise<{ changes: number }>,
      migrate: (mid, sql) => t.rpc('db.migrate', { id: mid, sql }) as Promise<{ applied: boolean }>,
    },
    trips: {
      getById: (tripId) => t.rpc('trips.getById', { tripId, _inv: invocationId }),
      getPlaces: (tripId) => t.rpc('trips.getPlaces', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      getReservations: (tripId) => t.rpc('trips.getReservations', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      update: (tripId, input) => t.rpc('trips.update', { tripId, input, _inv: invocationId }),
    },
    packing: {
      list: (tripId) => t.rpc('packing.list', { tripId, _inv: invocationId }) as Promise<unknown[]>,
    },
    files: {
      list: (tripId) => t.rpc('files.list', { tripId, _inv: invocationId }) as Promise<unknown[]>,
    },
    costs: {
      getByTrip: (tripId) => t.rpc('costs.getByTrip', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      listMine: () => t.rpc('costs.listMine', { _inv: invocationId }) as Promise<unknown[]>,
      create: (tripId, input) => t.rpc('costs.create', { tripId, input, _inv: invocationId }),
      update: (tripId, itemId, input) => t.rpc('costs.update', { tripId, itemId, input, _inv: invocationId }),
      delete: (tripId, itemId) => t.rpc('costs.delete', { tripId, itemId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    places: {
      create: (tripId, input) => t.rpc('places.create', { tripId, input, _inv: invocationId }),
      update: (tripId, placeId, input) => t.rpc('places.update', { tripId, placeId, input, _inv: invocationId }),
      delete: (tripId, placeId) => t.rpc('places.delete', { tripId, placeId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    days: {
      create: (tripId, input) => t.rpc('days.create', { tripId, input, _inv: invocationId }),
      update: (tripId, dayId, input) => t.rpc('days.update', { tripId, dayId, input, _inv: invocationId }),
      delete: (tripId, dayId) => t.rpc('days.delete', { tripId, dayId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    itinerary: {
      assign: (tripId, dayId, placeId, notes) => t.rpc('itinerary.assign', { tripId, dayId, placeId, notes, _inv: invocationId }),
      unassign: (tripId, assignmentId) => t.rpc('itinerary.unassign', { tripId, assignmentId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    meta: {
      get: (entityType, entityId, key) => t.rpc('meta.get', { entityType, entityId, key, _inv: invocationId }),
      set: (entityType, entityId, key, value) => t.rpc('meta.set', { entityType, entityId, key, value, _inv: invocationId }),
      list: (entityType, entityId) => t.rpc('meta.list', { entityType, entityId, _inv: invocationId }) as Promise<Record<string, unknown>>,
      delete: (entityType, entityId, key) => t.rpc('meta.delete', { entityType, entityId, key, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    users: {
      getById: (uid) => t.rpc('users.getById', { id: uid, _inv: invocationId }),
    },
    ws: {
      broadcastToTrip: async (tripId, event, data) => {
        await t.rpc('ws.broadcastToTrip', { tripId, event, data });
      },
      broadcastToUser: async (userId, event, data) => {
        await t.rpc('ws.broadcastToUser', { userId, event, data });
      },
    },
    log: {
      info: (msg, meta) => t.emit('log', { level: 'info', msg, meta }),
      warn: (msg, meta) => t.emit('log', { level: 'warn', msg, meta }),
      error: (msg, meta) => t.emit('log', { level: 'error', msg, meta }),
    },
    plugins: {
      call: (pluginId, fn, args) => t.rpc('plugins.call', { targetId: pluginId, fn, args, _inv: invocationId }),
    },
    events: {
      emit: (name, payload) => { void t.rpc('events.emit', { event: name, payload }); },
    },
  };
}
