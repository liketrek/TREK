/**
 * trek-plugin-sdk — the author-facing SDK for building TREK plugins (#plugins, M6).
 *
 * Types + `definePlugin` mirror what the isolated runtime injects, so a plugin
 * written against this package runs unchanged inside TREK. Pure and
 * dependency-free.
 */

/** Bumped on any breaking change to the plugin API surface. Embed as `apiVersion` in your manifest. */
export const PLUGIN_API_VERSION = 1 as const;

// Core entity shapes returned by ctx reads/writes. Only `id` is guaranteed; the rest
// are the fields plugins most commonly use (typed for autocomplete), left optional
// because they mirror raw DB rows — and every shape keeps an index signature, so no
// column is ever hidden from you.
export interface Trip { id: number; user_id?: number; title?: string; start_date?: string | null; end_date?: string | null; currency?: string | null; [k: string]: unknown }
export interface Place { id: number; trip_id?: number; name?: string; lat?: number | null; lng?: number | null; day_id?: number | null; category_id?: number | null; notes?: string | null; [k: string]: unknown }
export interface Day { id: number; trip_id?: number; date?: string | null; title?: string | null; [k: string]: unknown }
export interface Reservation { id: number; trip_id?: number; type?: string; [k: string]: unknown }
export interface PackingItem { id: number; trip_id?: number; name?: string; [k: string]: unknown }
export interface TripFile { id: number; trip_id?: number; filename?: string; [k: string]: unknown }
export interface BudgetItem { id: number; trip_id?: number; name?: string; total_price?: number | null; currency?: string | null; [k: string]: unknown }
export interface Assignment { id: number; day_id?: number; place_id?: number; notes?: string | null; [k: string]: unknown }
export interface User { id: number; username?: string; display_name?: string | null; avatar?: string | null; [k: string]: unknown }

export interface PluginContext {
  readonly id: string;
  readonly config: Readonly<Record<string, unknown>>;
  db: {
    query<T = unknown>(sql: string, ...args: unknown[]): Promise<T[]>;
    exec(sql: string, ...args: unknown[]): Promise<{ changes: number }>;
    migrate(id: string, sql: string): Promise<{ applied: boolean }>;
  };
  trips: {
    getById(tripId: number, asUserId?: number): Promise<Trip | null>;
    getPlaces(tripId: number, asUserId?: number): Promise<Place[]>;
    getReservations(tripId: number, asUserId?: number): Promise<Reservation[]>;
    /** Update trip fields; needs `db:write:trips` + the acting user's trip_edit permission. Route context only. */
    update(tripId: number, input: Record<string, unknown>): Promise<Trip>;
  };
  // Read-only views of other trip subsystems (#1429 eco). Membership-checked against
  // the current user; each needs its own db:read:* scope.
  packing: {
    /** A trip's packing items (hydrated bags/assignees). Needs `db:read:packing`. */
    list(tripId: number): Promise<PackingItem[]>;
  };
  files: {
    /** A trip's files, trash excluded. Needs `db:read:files`. */
    list(tripId: number): Promise<TripFile[]>;
  };
  // "Costs" = budget items. The acting user is bound by the host to the current
  // invocation; create/update/delete also need 'budget_edit' and the Costs addon
  // enabled.
  costs: {
    getByTrip(tripId: number): Promise<BudgetItem[]>;
    listMine(): Promise<BudgetItem[]>;
    create(tripId: number, input: Record<string, unknown>): Promise<BudgetItem>;
    update(tripId: number, itemId: number, input: Record<string, unknown>): Promise<BudgetItem>;
    delete(tripId: number, itemId: number): Promise<{ deleted: boolean }>;
  };
  // Core planner writes (#1429). Membership-checked against the invocation's user;
  // each needs the matching write scope + the app's place_edit/day_edit permission.
  places: {
    create(tripId: number, input: Record<string, unknown>): Promise<Place>;
    update(tripId: number, placeId: number, input: Record<string, unknown>): Promise<Place>;
    delete(tripId: number, placeId: number): Promise<{ deleted: boolean }>;
  };
  days: {
    create(tripId: number, input: Record<string, unknown>): Promise<Day>;
    update(tripId: number, dayId: number, input: Record<string, unknown>): Promise<Day>;
    delete(tripId: number, dayId: number): Promise<{ deleted: boolean }>;
  };
  itinerary: {
    assign(tripId: number, dayId: number, placeId: number, notes?: string | null): Promise<Assignment>;
    unassign(tripId: number, assignmentId: number): Promise<{ deleted: boolean }>;
  };
  // Your OWN namespaced key/value store on a trip/place/day (#1429) — enrich core
  // entities without forking the schema. Needs `db:meta`; the entity must belong to
  // a trip the current user can access. Values are JSON-serialisable.
  meta: {
    get(entityType: 'trip' | 'place' | 'day', entityId: number, key: string): Promise<unknown>;
    set(entityType: 'trip' | 'place' | 'day', entityId: number, key: string, value: unknown): Promise<unknown>;
    list(entityType: 'trip' | 'place' | 'day', entityId: number): Promise<Record<string, unknown>>;
    delete(entityType: 'trip' | 'place' | 'day', entityId: number, key: string): Promise<{ deleted: boolean }>;
  };
  users: { getById(id: number): Promise<User | null> };
  ws: {
    broadcastToTrip(tripId: number, event: string, data: Record<string, unknown>): Promise<void>;
    broadcastToUser(userId: number, event: string, data: Record<string, unknown>): Promise<void>;
  };
  log: {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
  };
  /** Call a function another plugin exposes. `pluginId` must be a declared, version-
   * satisfied dependency that lists `fn` in its manifest `capabilities.provides`. The
   * call runs as the current acting user. */
  plugins: {
    call(pluginId: string, fn: string, args?: unknown): Promise<unknown>;
  };
  /** Publish an event to dependents that subscribed to it. `name` must be declared in
   * this plugin's manifest `capabilities.emits`. Fire-and-forget. */
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
  /** Default true. Set false for OAuth callbacks / webhooks (public route). */
  auth?: boolean;
  handler(req: PluginRequest, ctx: PluginContext): Promise<PluginResponse>;
}
export interface PluginJob {
  id: string;
  /** Cron expression; the host owns the schedule. */
  schedule: string;
  handler(ctx: PluginContext): Promise<void>;
}

// ── integration hook interfaces ──────────────────────────────────────────────
export interface Photo {
  id: string;
  title?: string;
  thumbnailUrl: string;
  fullUrl: string;
  takenAt?: string;
}
export interface PhotoProvider {
  search(query: string, opts: { page: number; limit: number }): Promise<{ photos: Photo[]; total: number; hasMore: boolean }>;
  getById(id: string): Promise<Photo | null>;
}
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}
export interface CalendarSource {
  getName(): string;
  // start/end are ISO strings — the host->plugin boundary is JSON, so a Date would
  // arrive as a string anyway (kept in lockstep with the runtime SDK copy).
  getEvents(userId: number, start: string, end: string): Promise<CalendarEvent[]>;
}
/** One row of extra place info TREK renders natively (reviews/ratings/links/…). */
export interface PlaceDetailItem { label: string; value?: string; url?: string; }
export interface PlaceDetailProvider {
  /** Extra info for a place; core calls this for a `place-detail` panel. Needs `hook:place-detail-provider`. */
  getDetails(placeId: number, ctx: PluginContext): Promise<PlaceDetailItem[]>;
}
/** A validation/warning a plugin raises on a trip; TREK surfaces it in the planner. */
export interface TripWarning { level: 'info' | 'warning' | 'error'; message: string; dayId?: number; placeId?: number; }
export interface WarningProvider {
  /** Problems/warnings for a trip (e.g. overpacked day, place closed). Needs `hook:trip-warning-provider`. */
  getWarnings(tripId: number, ctx: PluginContext): Promise<TripWarning[]>;
}

/** A core-event subscription (#1429 eco). Handlers run with NO user (like a job)
 * and receive only the event name + tripId — never the payload. Needs `events:subscribe`. */
export interface PluginEventSubscription {
  /** A core event name (e.g. `place:created`, `day:updated`, `file:created`) or `*` for all. */
  on: string;
  handler(payload: { event: string; tripId: number }, ctx: PluginContext): Promise<void> | void;
}

/** A function this plugin exposes to its dependents (declared in `capabilities.provides`). */
export type PluginExport = (args: unknown, ctx: PluginContext) => Promise<unknown> | unknown;

/** A subscription to another plugin's event. Authorized by declaring that plugin as a
 * `pluginDependency`; the handler runs with NO user and receives the emitter's payload. */
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
  /** Functions exposed to dependents (names must match manifest `capabilities.provides`). */
  exports?: Record<string, PluginExport>;
  /** Subscriptions to other plugins' events (each `plugin` must be a declared dependency). */
  subscriptions?: PluginSubscription[];
}

/** Define a plugin. Gives you types; the returned object is what TREK loads. */
export function definePlugin(def: PluginDefinition): PluginDefinition {
  return def;
}

export { validateManifest, type PluginManifest, type ValidationResult } from './manifest.js';
export { createMockHost, type MockHostOptions } from './mock-host.js';
// The design kit for page/widget UIs: inline these into your client/index.html
// (or drop a `<!-- trek:ui -->` marker and let `dev`/`pack` expand it) to get the
// native TREK look — glass, hover, buttons, inputs — plus a `window.trek` bridge.
export { TREK_UI_CSS, TREK_THEME_JS, TREK_UI_MARKER, injectTrekUi } from './ui/kit.js';
