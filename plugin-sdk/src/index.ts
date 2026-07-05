/**
 * trek-plugin-sdk — the author-facing SDK for building TREK plugins (#plugins, M6).
 *
 * Types + `definePlugin` mirror what the isolated runtime injects, so a plugin
 * written against this package runs unchanged inside TREK. Pure and
 * dependency-free.
 */

/** Bumped on any breaking change to the plugin API surface. Embed as `apiVersion` in your manifest. */
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
    getById(tripId: number, asUserId?: number): Promise<unknown>;
    getPlaces(tripId: number, asUserId?: number): Promise<unknown[]>;
    getReservations(tripId: number, asUserId?: number): Promise<unknown[]>;
    /** Update trip fields; needs `db:write:trips` + the acting user's trip_edit permission. Route context only. */
    update(tripId: number, input: Record<string, unknown>): Promise<unknown>;
  };
  // "Costs" = budget items. The acting user is bound by the host to the current
  // invocation; create/update/delete also need 'budget_edit' and the Costs addon
  // enabled.
  costs: {
    getByTrip(tripId: number): Promise<unknown[]>;
    listMine(): Promise<unknown[]>;
    create(tripId: number, input: Record<string, unknown>): Promise<unknown>;
    update(tripId: number, itemId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, itemId: number): Promise<{ deleted: boolean }>;
  };
  // Core planner writes (#1429). Membership-checked against the invocation's user;
  // each needs the matching write scope + the app's place_edit/day_edit permission.
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
  // Your OWN namespaced key/value store on a trip/place/day (#1429) — enrich core
  // entities without forking the schema. Needs `db:meta`; the entity must belong to
  // a trip the current user can access. Values are JSON-serialisable.
  meta: {
    get(entityType: 'trip' | 'place' | 'day', entityId: number, key: string): Promise<unknown>;
    set(entityType: 'trip' | 'place' | 'day', entityId: number, key: string, value: unknown): Promise<unknown>;
    list(entityType: 'trip' | 'place' | 'day', entityId: number): Promise<Record<string, unknown>>;
    delete(entityType: 'trip' | 'place' | 'day', entityId: number, key: string): Promise<{ deleted: boolean }>;
  };
  users: { getById(id: number): Promise<unknown> };
  ws: {
    broadcastToTrip(tripId: number, event: string, data: Record<string, unknown>): Promise<void>;
    broadcastToUser(userId: number, event: string, data: Record<string, unknown>): Promise<void>;
  };
  log: {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
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
  getEvents(userId: number, start: Date, end: Date): Promise<CalendarEvent[]>;
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

export interface PluginDefinition {
  onLoad?(ctx: PluginContext): Promise<void> | void;
  onUnload?(ctx: PluginContext): Promise<void> | void;
  routes?: PluginRoute[];
  jobs?: PluginJob[];
  hooks?: {
    photoProvider?: PhotoProvider;
    calendarSource?: CalendarSource;
    placeDetailProvider?: PlaceDetailProvider;
    warningProvider?: WarningProvider;
  };
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
