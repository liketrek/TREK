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
  /** The ACTING USER's own value for one of this plugin's `scope:'user'` settings fields
   * (decrypted host-side). Undefined for an unset value or a userless context (job/onLoad)
   * — fall back to `config` (the admin-owned instance settings) there. */
  settings: {
    get(key: string): Promise<unknown>;
  };
  db: {
    query<T = unknown>(sql: string, ...args: unknown[]): Promise<T[]>;
    exec(sql: string, ...args: unknown[]): Promise<{ changes: number }>;
    migrate(id: string, sql: string): Promise<{ applied: boolean }>;
    /** Run several statements atomically on your OWN db — all commit or all roll
     * back. Each op is one statement; reads see the batch's own earlier writes.
     * A read returns `{ rows }`, a write `{ changes }`. Max 100 statements. */
    tx(ops: Array<{ sql: string; args?: unknown[] }>): Promise<{ results: Array<{ changes?: number; rows?: unknown[] }> }>;
  };
  trips: {
    getById(tripId: number, asUserId?: number): Promise<Trip | null>;
    getPlaces(tripId: number, asUserId?: number): Promise<Place[]>;
    /** Hydrated like the REST list: each row carries `endpoints`, `day_positions` + the day/place joins. */
    getReservations(tripId: number, asUserId?: number): Promise<Reservation[]>;
    /** The trip's days with their `assignments` + `notes_items` (the planner GET's shape). Needs `db:read:trips`. */
    getDays(tripId: number): Promise<Day[]>;
    /** The trip's lodging blocks (day_accommodations) with joined place fields. Needs `db:read:trips`. */
    getAccommodations(tripId: number): Promise<unknown[]>;
    /** Every trip the acting user owns or is a member of (for dashboards/aggregates). Needs `db:read:trips`. */
    listMine(): Promise<Trip[]>;
    /** Update trip fields; needs `db:write:trips` + the acting user's trip_edit permission. Route context only. */
    update(tripId: number, input: Record<string, unknown>): Promise<Trip>;
    /** Create a new trip owned by the acting user (importers). `title` required. Needs `db:create:trips` + the acting user's trip_create. */
    create(input: { title: string; description?: string; start_date?: string; end_date?: string; currency?: string; reminder_days?: number; day_count?: number }): Promise<Trip>;
    /** The trip's member roster (id + display fields only). Membership-checked. Needs `db:read:trips`. */
    members(tripId: number): Promise<User[]>;
    /** Add a user to a trip (GRANTS ACCESS — its own permission). Needs `db:write:members` + the acting user's member_manage. */
    addMember(tripId: number, userId: number): Promise<{ joined: boolean; tripId: number }>;
    /** Remove a member from a trip (not the owner). Needs `db:write:members` + member_manage. */
    removeMember(tripId: number, userId: number): Promise<{ removed: boolean }>;
  };
  // Reservations (bookings). `listMine` reads across every accessible trip (needs
  // `db:read:trips`); create/update/delete need `db:write:reservations` + the acting
  // user's reservation_edit permission, and reuse the app's accommodation/budget/
  // notification side effects 1:1.
  reservations: {
    /** Every reservation across the acting user's accessible trips. Needs `db:read:trips`. */
    listMine(): Promise<Reservation[]>;
    /** Create a booking on a trip. An `endpoints` array (from/to/stop legs for flights,
     * trains, ferries) is persisted with it. */
    create(tripId: number, input: Record<string, unknown>): Promise<Reservation>;
    /** Update a booking. `endpoints` semantics: omitted = keep, [] = delete all,
     * array = replace (endpoint ids are NOT stable). */
    update(tripId: number, reservationId: number, input: Record<string, unknown>): Promise<Reservation>;
    delete(tripId: number, reservationId: number): Promise<{ deleted: boolean }>;
  };
  // Lodging blocks (day_accommodations): a hotel span from a start day to an end day.
  // Reads ride on `db:read:trips` (ctx.trips.getAccommodations); writes need
  // `db:write:accommodations` + the acting user's day_edit permission (like the REST
  // path — accommodations live in the day service, not the bookings one). Creating one
  // auto-creates its partner hotel reservation, exactly like the app.
  accommodations: {
    create(tripId: number, input: { place_id: number; start_day_id: number; end_day_id: number; check_in?: string | null; check_in_end?: string | null; check_out?: string | null; confirmation?: string | null; notes?: string | null }): Promise<unknown>;
    update(tripId: number, accommodationId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, accommodationId: number): Promise<{ deleted: boolean }>;
  };
  packing: {
    /** A trip's packing items (hydrated bags/assignees). Needs `db:read:packing`. */
    list(tripId: number): Promise<PackingItem[]>;
    /** Add a packing item (owner = acting user). Needs `db:write:packing` + packing_edit. */
    create(tripId: number, input: { name: string; category?: string; checked?: boolean; is_private?: boolean; visibility?: 'common' | 'personal' | 'shared'; recipient_ids?: number[] }): Promise<PackingItem>;
    /** Update a packing item. Needs `db:write:packing` + packing_edit. */
    update(tripId: number, itemId: number, input: Record<string, unknown>): Promise<PackingItem>;
    /** Delete a packing item. Needs `db:write:packing` + packing_edit. */
    delete(tripId: number, itemId: number): Promise<{ deleted: boolean }>;
    /** List/create/update/delete packing bags + set members (no privacy). Needs `db:write:packing` + packing_edit. */
    listBags(tripId: number): Promise<unknown[]>;
    createBag(tripId: number, input: { name: string; color?: string }): Promise<unknown>;
    updateBag(tripId: number, bagId: number, input: Record<string, unknown>): Promise<unknown>;
    deleteBag(tripId: number, bagId: number): Promise<{ deleted: boolean }>;
    setBagMembers(tripId: number, bagId: number, userIds: number[]): Promise<unknown>;
  };
  files: {
    /** A trip's files, trash excluded. Needs `db:read:files`. */
    list(tripId: number): Promise<TripFile[]>;
    /** A file's bytes as base64 (10MB cap; trashed files refused). Needs `db:read:files:content`. */
    getContent(tripId: number, fileId: number): Promise<{ name: string; mimetype: string; size: number; content_base64: string }>;
    /** Store base64 content as a trip file (10MB cap, blocked extensions refused). Needs `db:write:files` + file_upload. */
    create(tripId: number, input: { name: string; content_base64: string; mimetype?: string; description?: string; place_id?: number; reservation_id?: number }): Promise<TripFile>;
    /** Link an existing file to a same-trip reservation/place/assignment. Needs `db:write:files` + file_edit. */
    createLink(tripId: number, fileId: number, opts: { reservation_id?: number; assignment_id?: number; place_id?: number }): Promise<unknown>;
    /** Update a file's description/links. Needs `db:write:files` + file_edit. */
    update(tripId: number, fileId: number, input: { description?: string; place_id?: number | null; reservation_id?: number | null }): Promise<TripFile>;
    /** Move a file to the trash. Needs `db:write:files` + file_delete. */
    softDelete(tripId: number, fileId: number): Promise<{ deleted: boolean }>;
  };
  /** Collab content (notes/polls/chat). Reads need `db:read:collab`; writes need `db:write:collab` + the acting user's collab_edit. Both need the Collab addon. */
  collab: {
    /** A trip's collab notes (hydrated with author + attachments). Needs `db:read:collab`. */
    listNotes(tripId: number): Promise<unknown[]>;
    /** A trip's polls (with options + voters). Needs `db:read:collab`. */
    listPolls(tripId: number): Promise<unknown[]>;
    /** A trip's chat messages (newest 100, oldest first; `before` = a message id to page back). Needs `db:read:collab`. */
    listMessages(tripId: number, before?: number): Promise<unknown[]>;
    createNote(tripId: number, input: { title: string; content?: string; category?: string; color?: string; website?: string; pinned?: boolean }): Promise<unknown>;
    createPoll(tripId: number, input: { question: string; options: unknown[]; multiple?: boolean; deadline?: string }): Promise<unknown>;
    votePoll(tripId: number, pollId: number, optionIndex: number): Promise<unknown>;
    createMessage(tripId: number, text: string, replyTo?: number): Promise<unknown>;
  };
  /** Host-mediated notification. The plugin supplies only target + plain text; the host
   * owns delivery + preferences. Recipient is FORCED to the acting user (scope 'user',
   * targetId = the acting user) or a trip they belong to (scope 'trip'). Needs `notify:send`. */
  notify: {
    send(input: { title: string; body: string; link?: string; scope: 'user' | 'trip'; targetId: number }): Promise<{ sent: boolean }>;
  };
  /** Host-mediated LLM using the admin/user-configured provider — the plugin never holds a
   * key. `complete` returns { text }; `extract` returns { results } for your JSON schema.
   * Output is DATA: to persist it, push it through the gated write methods yourself. Needs `ai:invoke`. */
  ai: {
    complete(prompt: string, system?: string): Promise<{ text: string }>;
    extract(text: string, jsonSchema: object, prompt?: string): Promise<{ results: Record<string, unknown>[] }>;
  };
  /** Host-brokered outbound OAuth: a short-lived access token for the ACTING USER of a
   * third-party service the host connected on their behalf (Settings → Plugins → Connect).
   * Returns null when the user hasn't connected or in a userless context. The host holds
   * the refresh token + client secret — you never see them. Needs `oauth:client`. */
  oauth: {
    getAccessToken(): Promise<string | null>;
  };
  /** Persistent, userless scheduling — a future callback into your `scheduled` handler
   * that survives restarts. Same risk class + grant as background jobs: needs `jobs:run`,
   * runs with NO acting user (trip reads refused; own db + declared egress only). Caps:
   * up to 100 tasks/plugin, 8 KB payload, recurring interval >= 60 s, <= ~1 year out.
   * `set` is an upsert by name; `cancel` removes it. */
  scheduler: {
    /** Fire once at an absolute epoch-ms time. */
    at(whenMs: number, name: string, payload?: unknown): Promise<{ scheduled: boolean }>;
    /** Fire once after `ms` from now. */
    in(ms: number, name: string, payload?: unknown): Promise<{ scheduled: boolean }>;
    /** Fire repeatedly every `ms` (first fire after `ms`). */
    every(ms: number, name: string, payload?: unknown): Promise<{ scheduled: boolean }>;
    /** Cancel a scheduled task by name. */
    cancel(name: string): Promise<{ cancelled: boolean }>;
  };
  /** Host weather cache by coordinates (+ optional YYYY-MM-DD). Tenant-free. Needs `weather:read`. */
  weather: {
    get(lat: number, lng: number, date?: string): Promise<unknown>;
  };
  /** Exchange rates (tenant-free, cached upstream). Needs `rates:read`. */
  rates: {
    /** A map of quote → rate relative to `base` (e.g. base 'EUR' → { USD: 1.08, ... }). `null` on an upstream failure. */
    get(base: string): Promise<Record<string, number> | null>;
  };
  /** The global place-category reference list (read-only). Needs `db:read:categories`. */
  categories: {
    list(): Promise<unknown[]>;
  };
  /** The acting user's own tags. Needs `db:read:tags` (list) / `db:write:tags` (create/update/delete). */
  tags: {
    list(): Promise<unknown[]>;
    create(input: { name: string; color?: string }): Promise<unknown>;
    update(tagId: number, input: { name?: string; color?: string }): Promise<unknown>;
    delete(tagId: number): Promise<{ deleted: boolean }>;
  };
  /** A trip's to-dos. Needs `db:read:todos` (list) / `db:write:todos` + packing_edit (create/update/delete). */
  todos: {
    list(tripId: number): Promise<unknown[]>;
    create(tripId: number, input: { name: string; category?: string; due_date?: string; description?: string; assigned_user_id?: number; priority?: number }): Promise<unknown>;
    update(tripId: number, todoId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, todoId: number): Promise<{ deleted: boolean }>;
  };
  // The acting user's OWN subsystem data across all their trips (not one trip), each
  // gated on its addon being enabled — mirrors the addon's own REST/MCP readers.
  journal: {
    /** The acting user's journals. Needs `db:read:journal` + the journey addon. */
    listMine(): Promise<unknown[]>;
    /** The entries of one of the acting user's journeys (photos/story/checkins), access-checked. Needs `db:read:journal`. */
    getEntries(journeyId: number): Promise<unknown[]>;
    /** Create an entry on a journey the acting user can edit. Needs `db:write:journal`. */
    createEntry(journeyId: number, input: { entry_date: string; [k: string]: unknown }): Promise<unknown>;
    /** Create a journal owned by the acting user (importers bootstrap the journal they fill). Needs `db:write:journal`. */
    createJourney(input: { title: string; subtitle?: string; trip_ids?: number[] }): Promise<unknown>;
    /** Delete one of the acting user's journals. Needs `db:write:journal`. */
    deleteJourney(journeyId: number): Promise<{ deleted: boolean }>;
    /** Update an entry (owner/contributor-gated). Needs `db:write:journal`. */
    updateEntry(entryId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Delete an entry (owner/contributor-gated). Needs `db:write:journal`. */
    deleteEntry(entryId: number): Promise<{ deleted: boolean }>;
  };
  atlas: {
    /** The acting user's visited countries + regions. Needs `db:read:atlas` + the atlas addon. */
    visited(): Promise<{ countries: unknown[]; regions: unknown[] }>;
    /** The acting user's bucket-list items. Needs `db:read:atlas`. */
    bucketList(): Promise<unknown[]>;
    /** Mark/unmark the ACTING USER's own visited countries/regions + bucket list. Needs `db:write:atlas`. */
    markCountry(code: string): Promise<unknown>;
    unmarkCountry(code: string): Promise<unknown>;
    markRegion(regionCode: string, countryCode: string, regionName?: string): Promise<unknown>;
    unmarkRegion(regionCode: string): Promise<unknown>;
    createBucketItem(input: { name: string; lat?: number; lng?: number; country_code?: string; notes?: string; target_date?: string }): Promise<unknown>;
    deleteBucketItem(itemId: number): Promise<{ deleted: boolean }>;
  };
  vacay: {
    /** The acting user's vacation plan data. Needs `db:read:vacay` + the vacay addon. */
    mine(): Promise<unknown>;
    /** Toggle the ACTING USER's own PTO day on their active plan. Needs `db:write:vacay`. */
    toggleEntry(date: string): Promise<{ action: string }>;
    /** Toggle a company holiday on the acting user's active plan. Needs `db:write:vacay`. */
    toggleCompanyHoliday(date: string, note?: string): Promise<{ action: string }>;
  };
  collections: {
    /** The acting user's saved-place collections. Needs `db:read:collections` + the collections addon. */
    listMine(): Promise<unknown>;
    /** One of the acting user's collections by id. Needs `db:read:collections` + the collections addon. */
    get(id: number): Promise<unknown>;
    /** Collections write (per-collection role enforced by the service). Needs `db:write:collections`. */
    create(input: Record<string, unknown>): Promise<unknown>;
    update(id: number, input: Record<string, unknown>): Promise<unknown>;
    savePlace(input: Record<string, unknown>): Promise<unknown>;
    copyToTrip(input: Record<string, unknown>): Promise<unknown>;
    deletePlace(placeId: number): Promise<{ deleted: boolean }>;
  };
  daynotes: {
    /** A day's notes on a trip (membership-checked). Needs `db:read:daynotes`. */
    list(tripId: number, dayId: number): Promise<unknown[]>;
    /** Add a note to a day. Needs `db:write:daynotes` + the acting user's day_edit. */
    create(tripId: number, dayId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Update a day note. Needs `db:write:daynotes` + day_edit. */
    update(tripId: number, dayId: number, noteId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Delete a day note. Needs `db:write:daynotes` + day_edit. */
    delete(tripId: number, dayId: number, noteId: number): Promise<{ deleted: boolean }>;
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
    get(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number, key: string): Promise<unknown>;
    set(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number, key: string, value: unknown): Promise<unknown>;
    list(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number): Promise<Record<string, unknown>>;
    delete(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number, key: string): Promise<{ deleted: boolean }>;
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
  /** Inbound headers — ONLY populated on `auth:false` routes (webhooks), and only an
   * explicit, credential-free allowlist (signature + event headers from the common
   * providers; never Cookie/Authorization/session). Empty on authenticated routes.
   * Verify a provider signature against a secret you hold in `ctx.config`/`ctx.settings`. */
  headers: Record<string, string>;
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
  /** Search your photo backend. `ctx` is the last arg so you can reach it via
   * ctx.settings/oauth/http. Needs `hook:photo-provider`. Surfaced in the photo picker
   * and at `GET /api/plugin-photos/search`; thumbnail/full URLs must be http/https. */
  search(query: string, opts: { page: number; limit: number }, ctx: PluginContext): Promise<{ photos: Photo[]; total: number; hasMore: boolean }>;
  getById(id: string, ctx: PluginContext): Promise<Photo | null>;
}
/**
 * A notification, already rendered by the host into the recipient's language.
 * A channel plugin never touches i18n — it only delivers.
 */
export interface NotificationMessage {
  /** The TREK event that produced this, e.g. `trip_invite`. */
  event: string;
  title: string;
  body: string;
  /** Absolute deep link back into TREK, when the event has one. */
  url?: string;
  tripName?: string;
}

/**
 * Deliver TREK notifications over a channel TREK doesn't ship (Gotify, Pushover, …).
 * Needs `hook:notification-channel`.
 *
 * Unlike every other hook, this one is HOST-initiated for an arbitrary recipient, so
 * it runs WITHOUT an acting user: `ctx.settings.get()` returns undefined here and trip
 * reads are refused. The recipient's own `scope:'user'` settings are decrypted by the
 * host and handed to you as `config` instead — that is the only way to reach them, and
 * it is why a channel plugin cannot enumerate the recipient's trips.
 *
 * Declare the channel in your manifest:
 *   "capabilities": { "notificationChannel": { "title": "Gotify" } }
 */
export interface NotificationChannel {
  send(msg: NotificationMessage, config: Record<string, unknown>, ctx: PluginContext): Promise<void>;
  /** Backs the "Send test" button in the user's notification settings. */
  test?(config: Record<string, unknown>, ctx: PluginContext): Promise<void>;
}

/**
 * Result of a settings-page action. `message` is shown to the user beside the button
 * (bounded + emoji-stripped host-side); throwing is equivalent to `{ ok: false }` with
 * the error message.
 */
export interface PluginActionResult {
  ok?: boolean;
  message?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}
export interface CalendarSource {
  /** A short label for this source (shown in the calendar UI). Needs `hook:calendar-source`. */
  getName(ctx: PluginContext): string;
  // start/end are ISO strings — the host->plugin boundary is JSON, so a Date would
  // arrive as a string anyway (kept in lockstep with the runtime SDK copy). `ctx` is the
  // last arg. Aggregated for the signed-in user at `GET /api/plugin-calendar`.
  getEvents(userId: number, start: string, end: string, ctx: PluginContext): Promise<CalendarEvent[]>;
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

/** Host-rendered contributions into a native trip-planner view (reservations/places/day),
 * keyed to an entity by id. DECLARATIVE ONLY — a column is text/badge/link, an action is
 * a labelled button whose target opens your sandboxed frame or calls a route. Never raw
 * HTML/markup; the host renders + sanitizes everything. */
export type ContributionTone = 'default' | 'success' | 'warn' | 'danger';
/** An extra read-only cell/badge on an entity's row/card. */
export interface TableColumnContribution {
  kind: 'column';
  entityId: number; // the reservation/place/day id this attaches to
  id: string;       // stable per-contribution id (for React keys / dedupe)
  label: string;
  value?: string;
  url?: string;     // http/https/mailto only — the host rejects any other scheme
  icon?: string;    // a lucide icon name, resolved by the host
  tone?: ContributionTone;
}
/** A labelled button on an entity's row/card; its target opens your sandboxed frame
 * (`{kind:'frame', sub}`) or invokes one of your routes (`{kind:'route', method, sub}`). */
export interface TableActionContribution {
  kind: 'action';
  entityId: number;
  id: string;
  label: string;
  icon?: string;
  target: { kind: 'frame'; sub: string } | { kind: 'route'; method: 'GET' | 'POST'; sub: string };
}
export type TableContribution = TableColumnContribution | TableActionContribution;
export interface TableContributor {
  /** `view` is one of 'reservations' | 'places' | 'day' | 'costs' | 'packing' | 'files'.
   * Runs with the current user bound, on a short timeout; a slow/failing call is
   * skipped, never fatal. Needs `hook:table-contributor`. */
  getContributions(view: string, tripId: number, ctx: PluginContext): Promise<TableContribution[]>;
}

/** A bounded marker the host renders onto the trip map (#587). Declarative only —
 * the host draws a Leaflet marker + popup; plugin JS never runs on the map canvas. */
export interface MapMarkerContribution {
  id: string;            // stable per-marker id (React key / dedupe)
  lat: number;           // -90..90
  lng: number;           // -180..180
  label?: string;        // short label shown in the popup title
  popupText?: string;    // one line of body text (host-sanitized, plain text)
  url?: string;          // http/https/mailto only — the host rejects any other scheme
  icon?: string;         // a lucide icon name, resolved by the host
  tone?: ContributionTone;
}
export interface MapMarkerProvider {
  /** Return markers to overlay on a trip's map. Runs with the current user bound,
   * on a short timeout; the host caps the marker count and skips a failing call.
   * Needs `hook:map-marker-provider`. */
  getMarkers(tripId: number, ctx: PluginContext): Promise<MapMarkerContribution[]>;
}

/** A text-only section the host appends to a trip's PDF export. Declarative only —
 * plain strings the host lays out and escapes; no markup ever reaches the document. */
export interface PdfSection {
  title: string;          // section heading (capped at 120 chars)
  paragraphs?: string[];  // body text — ≤20 paragraphs of ≤2000 chars each
  table?: { headers: string[]; rows: string[][] }; // simple table — ≤8 headers, ≤50 rows
}
export interface PdfSectionProvider {
  /** Return sections to append to a trip's PDF export. Runs with the current user
   * bound, on a short timeout; the host caps counts/lengths and skips a failing
   * call. Needs `hook:pdf-section-provider`. */
  getSections(tripId: number, ctx: PluginContext): Promise<PdfSection[]>;
}

/** One country in an Atlas tint layer. `code` is ISO-3166 alpha-2 (uppercased by the host). */
export interface AtlasLayerCountry { code: string; tone?: ContributionTone; label?: string; }
/** A country tint layer the host draws over the Atlas world map (wishlists, advisories, …). */
export interface AtlasLayer {
  id: string;                    // stable per-layer id (React key / dedupe)
  name?: string;                 // short layer name
  countries: AtlasLayerCountry[]; // ≤300 countries per layer
}
export interface AtlasLayerProvider {
  /** Return tint layers for the ACTING USER's Atlas map. User-scoped — the host binds
   * the current user; the hook takes no target parameter. Runs on a short timeout;
   * the host caps the layer/country counts and skips a failing call.
   * Needs `hook:atlas-layer-provider`. */
  getLayers(ctx: PluginContext): Promise<AtlasLayer[]>;
}

/** One badge the host renders on a dashboard trip card. Declarative primitives only —
 * the host draws the badge; plugin JS never runs on the dashboard. */
export interface TripCardContribution {
  tripId: number;        // which of the passed-in trips this badge belongs to
  id: string;            // stable per-badge id (React key / dedupe)
  label: string;         // short label (e.g. "Visa ✓", "3 tasks")
  value?: string;        // optional secondary text
  icon?: string;         // a lucide icon name, resolved by the host
  tone?: ContributionTone;
  url?: string;          // http/https/mailto only — the host rejects any other scheme
}
export interface TripCardProvider {
  /** Return badges for the dashboard trip cards currently on screen. `tripIds` are
   * exactly those cards (each already access-checked for the acting user). Runs with
   * the current user bound, on a short timeout; the host caps the badge count and
   * skips a failing call. Needs `hook:trip-card-provider`. */
  getCards(tripIds: number[], ctx: PluginContext): Promise<TripCardContribution[]>;
}

/** One row of extra info TREK renders under a journal entry (same shape as PlaceDetailItem). */
export interface JournalEntryRow { label: string; value?: string; url?: string; }
export interface JournalEntryProvider {
  /** Return rows for a journal entry. Runs with the current user bound, on a short
   * timeout; the host caps the row count and skips a failing call.
   * Needs `hook:journal-entry-provider`. */
  getRows(entryId: number, ctx: PluginContext): Promise<JournalEntryRow[]>;
}

/** A core-event subscription (#1429 eco). Handlers run with NO user (like a job).
 * Needs `events:subscribe`. */
export interface PluginEventSubscription {
  /** A core event name (e.g. `place:created`, `day:updated`, `file:created`) or `*` for all. */
  on: string;
  // `entity` = the event family (e.g. 'reservation'); `entityId` = WHICH entity changed,
  // when known. `snapshot` = a whitelisted field view of the changed entity, delivered
  // only when the plugin also holds the family's db:read:* grant — never user ids,
  // private packing items or secrets; delete/reorder/bulk events carry none. Still no
  // acting user: a trip read from the handler is refused.
  handler(payload: { event: string; tripId: number; entity?: string; entityId?: number; snapshot?: Record<string, unknown> }, ctx: PluginContext): Promise<void> | void;
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
  /** Handles a callback registered via ctx.scheduler (userless, like a job). The
   * `name` identifies which scheduled task fired; `payload` is what you passed. */
  scheduled?(input: { name: string; payload: unknown }, ctx: PluginContext): Promise<void> | void;
  /** GDPR erasure: a TREK account was deleted — remove everything you hold about it
   * from your OWN db. Userless (no acting user). Needs `hook:user-data`. The host
   * calls this durably (queued, retried until it succeeds), so make it idempotent. */
  deleteUserData?(input: { userId: number }, ctx: PluginContext): Promise<void> | void;
  /** GDPR portability: return the data you hold about a user (own db only), as a
   * JSON-serialisable value the host aggregates. Userless. Needs `hook:user-data`. */
  exportUserData?(input: { userId: number }, ctx: PluginContext): Promise<unknown> | unknown;
  events?: PluginEventSubscription[];
  /**
   * Buttons on the plugin's own settings page ("Test connection", "Sync now"). The key
   * must match an entry in the manifest's `actions`.
   *
   * USER-INITIATED, so unlike the notificationChannel hook there IS an acting user — the
   * person who clicked. `ctx.settings.get()` returns THEIR value and trip reads are
   * membership-checked against them, which is what makes a "test my credentials" button
   * possible at all.
   */
  actions?: Record<string, (ctx: PluginContext) => Promise<PluginActionResult | void> | PluginActionResult | void>;
  hooks?: {
    photoProvider?: PhotoProvider;
    calendarSource?: CalendarSource;
    placeDetailProvider?: PlaceDetailProvider;
    warningProvider?: WarningProvider;
    tableContributor?: TableContributor;
    mapMarkerProvider?: MapMarkerProvider;
    pdfSectionProvider?: PdfSectionProvider;
    atlasLayerProvider?: AtlasLayerProvider;
    journalEntryProvider?: JournalEntryProvider;
    tripCardProvider?: TripCardProvider;
    notificationChannel?: NotificationChannel;
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

export { validateManifest, CHANNEL_EVENTS, type PluginManifest, type ValidationResult } from './manifest.js';
export { createMockHost, type MockHostOptions } from './mock-host.js';
// The design kit for page/widget UIs: inline these into your client/index.html
// (or drop a `<!-- trek:ui -->` marker and let `dev`/`pack` expand it) to get the
// native TREK look — glass, hover, buttons, inputs — plus a `window.trek` bridge.
export { TREK_UI_CSS, TREK_THEME_JS, TREK_UI_MARKER, injectTrekUi } from './ui/kit.js';
