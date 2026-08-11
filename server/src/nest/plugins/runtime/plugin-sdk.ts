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
  /** The ACTING USER's own value for one of this plugin's `scope:'user'` settings fields
   * (decrypted host-side). Returns undefined for an unset value or a userless context
   * (job/onLoad) — fall back to `config` (the admin-owned instance settings) there. */
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
    // `asUserId` is accepted for source compatibility but IGNORED by the host —
    // trip reads are always membership-checked against the authenticated user of
    // the current invocation (the request's `req.user`), which the plugin cannot
    // override. Only reachable from a route handler (a user context); a job has
    // no user and its trip reads are refused.
    getById(tripId: number, asUserId?: number): Promise<unknown>;
    getPlaces(tripId: number, asUserId?: number): Promise<unknown[]>;
    /** Hydrated like the REST list: each row carries `endpoints`, `day_positions` + the day/place joins. */
    getReservations(tripId: number, asUserId?: number): Promise<unknown[]>;
    /** The trip's days with their `assignments` + `notes_items` (the planner GET's shape). Needs 'db:read:trips'. */
    getDays(tripId: number): Promise<unknown[]>;
    /** The trip's lodging blocks (day_accommodations) with joined place fields. Needs 'db:read:trips'. */
    getAccommodations(tripId: number): Promise<unknown[]>;
    /** Every trip the acting user owns or is a member of (for dashboards/aggregates). Needs 'db:read:trips'. */
    listMine(): Promise<unknown[]>;
    /** Update trip fields (title/dates/currency/reminder_days/...); needs 'db:write:trips' + the acting user's 'trip_edit' permission. */
    update(tripId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Create a new trip owned by the acting user (importers). `title` required. Needs 'db:create:trips' + the acting user's 'trip_create'. */
    create(input: { title: string; description?: string; start_date?: string; end_date?: string; currency?: string; reminder_days?: number; day_count?: number }): Promise<unknown>;
    /** The trip's member roster (id + display fields only). Membership-checked. Needs 'db:read:trips'. */
    members(tripId: number): Promise<unknown[]>;
    /** Add a user to a trip (GRANTS ACCESS — its own permission). Needs 'db:write:members' + the acting user's 'member_manage'. */
    addMember(tripId: number, userId: number): Promise<{ joined: boolean; tripId: number }>;
    /** Remove a member from a trip (not the owner). Needs `db:write:members` + member_manage. */
    removeMember(tripId: number, userId: number): Promise<{ removed: boolean }>;
  };
  // Reservations (bookings). `listMine` reads across every accessible trip (needs
  // 'db:read:trips'); create/update/delete need 'db:write:reservations' + the acting
  // user's 'reservation_edit' permission, and reuse the app's accommodation/budget/
  // notification side effects 1:1.
  reservations: {
    /** Every reservation across the acting user's accessible trips. Needs 'db:read:trips'. */
    listMine(): Promise<unknown[]>;
    /** Create a booking on a trip. An `endpoints` array (from/to/stop legs for flights,
     * trains, ferries) is persisted with it. Needs 'db:write:reservations' + 'reservation_edit'. */
    create(tripId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Update a booking on a trip. `endpoints` semantics: omitted = keep, [] = delete all,
     * array = replace (endpoint ids are NOT stable). Needs 'db:write:reservations' + 'reservation_edit'. */
    update(tripId: number, reservationId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Delete a booking from a trip. Needs 'db:write:reservations' + 'reservation_edit'. */
    delete(tripId: number, reservationId: number): Promise<{ deleted: boolean }>;
  };
  // Lodging blocks (day_accommodations): a hotel span from a start day to an end day.
  // Reads ride on 'db:read:trips' (ctx.trips.getAccommodations); writes need
  // 'db:write:accommodations' + the acting user's 'day_edit' permission (like the
  // REST path — accommodations live in the day service, not the bookings one).
  // Creating one auto-creates its partner hotel reservation, exactly like the app.
  accommodations: {
    create(tripId: number, input: { place_id: number; start_day_id: number; end_day_id: number; check_in?: string | null; check_in_end?: string | null; check_out?: string | null; confirmation?: string | null; notes?: string | null }): Promise<unknown>;
    update(tripId: number, accommodationId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, accommodationId: number): Promise<{ deleted: boolean }>;
  };
  // Read-only views of other trip subsystems (#1429 eco). Membership-checked like
  // `trips`; each needs its own db:read:* scope.
  packing: {
    /** A trip's packing items (hydrated bags/assignees). Needs 'db:read:packing'. */
    list(tripId: number): Promise<unknown[]>;
    /** Add a packing item (owner = acting user). Needs 'db:write:packing' + 'packing_edit'. */
    create(tripId: number, input: { name: string; category?: string; checked?: boolean; is_private?: boolean; visibility?: 'common' | 'personal' | 'shared'; recipient_ids?: number[] }): Promise<unknown>;
    /** Update a packing item. Needs 'db:write:packing' + 'packing_edit'. */
    update(tripId: number, itemId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Delete a packing item. Needs 'db:write:packing' + 'packing_edit'. */
    delete(tripId: number, itemId: number): Promise<{ deleted: boolean }>;
    /** List/create/update/delete packing bags + set members (no privacy). Needs 'db:write:packing' + 'packing_edit'. */
    listBags(tripId: number): Promise<unknown[]>;
    createBag(tripId: number, input: { name: string; color?: string }): Promise<unknown>;
    updateBag(tripId: number, bagId: number, input: Record<string, unknown>): Promise<unknown>;
    deleteBag(tripId: number, bagId: number): Promise<{ deleted: boolean }>;
    setBagMembers(tripId: number, bagId: number, userIds: number[]): Promise<unknown>;
  };
  files: {
    /** A trip's files, trash excluded. Needs 'db:read:files'. */
    list(tripId: number): Promise<unknown[]>;
    /** A file's bytes as base64 (10MB cap; trashed files refused). Needs 'db:read:files:content'. Returns { name, mimetype, size, content_base64 }. */
    getContent(tripId: number, fileId: number): Promise<{ name: string; mimetype: string; size: number; content_base64: string }>;
    /** Store base64 content as a trip file (10MB cap, blocked extensions refused). Needs 'db:write:files' + 'file_upload'. */
    create(tripId: number, input: { name: string; content_base64: string; mimetype?: string; description?: string; place_id?: number; reservation_id?: number }): Promise<unknown>;
    /** Link an existing file to a same-trip reservation/place/assignment. Needs 'db:write:files' + 'file_edit'. */
    createLink(tripId: number, fileId: number, opts: { reservation_id?: number; assignment_id?: number; place_id?: number }): Promise<unknown>;
    /** Update a file's description/links. Needs 'db:write:files' + 'file_edit'. */
    update(tripId: number, fileId: number, input: { description?: string; place_id?: number | null; reservation_id?: number | null }): Promise<unknown>;
    /** Move a file to the trash. Needs 'db:write:files' + 'file_delete'. */
    softDelete(tripId: number, fileId: number): Promise<{ deleted: boolean }>;
  };
  /** Collab content (notes/polls/chat). Reads need 'db:read:collab'; writes need 'db:write:collab' + the acting user's 'collab_edit'. Both need the Collab addon. */
  collab: {
    /** A trip's collab notes (hydrated with author + attachments). Needs 'db:read:collab'. */
    listNotes(tripId: number): Promise<unknown[]>;
    /** A trip's polls (with options + voters). Needs 'db:read:collab'. */
    listPolls(tripId: number): Promise<unknown[]>;
    /** A trip's chat messages (newest 100, oldest first; `before` = a message id to page back). Needs 'db:read:collab'. */
    listMessages(tripId: number, before?: number): Promise<unknown[]>;
    createNote(tripId: number, input: { title: string; content?: string; category?: string; color?: string; website?: string; pinned?: boolean }): Promise<unknown>;
    createPoll(tripId: number, input: { question: string; options: unknown[]; multiple?: boolean; deadline?: string }): Promise<unknown>;
    votePoll(tripId: number, pollId: number, optionIndex: number): Promise<unknown>;
    createMessage(tripId: number, text: string, replyTo?: number): Promise<unknown>;
  };
  /** Host-mediated notification. The plugin supplies only target + plain text; the host
   * owns delivery + preferences. Recipient is FORCED to the acting user (scope 'user',
   * targetId = the acting user) or a trip they belong to (scope 'trip'). Needs 'notify:send'. */
  notify: {
    send(input: { title: string; body: string; link?: string; scope: 'user' | 'trip'; targetId: number }): Promise<{ sent: boolean }>;
  };
  /** Host-mediated LLM using the admin/user-configured provider — the plugin never holds a
   * key. `complete` returns { text }; `extract` returns { results } for your JSON schema.
   * Output is DATA: to persist it, push it through the gated write methods yourself. Needs 'ai:invoke'. */
  ai: {
    complete(prompt: string, system?: string): Promise<{ text: string }>;
    extract(text: string, jsonSchema: object, prompt?: string): Promise<{ results: Record<string, unknown>[] }>;
  };
  /** Host-brokered outbound OAuth: a short-lived access token for the ACTING USER of a
   * third-party service the host connected on their behalf (Settings → Plugins → Connect).
   * Returns null when the user hasn't connected or in a userless context. The host holds
   * the refresh token + client secret — you never see them. Needs 'oauth:client'. */
  oauth: {
    getAccessToken(): Promise<string | null>;
  };
  /** Persistent, userless scheduling — a future callback into your `scheduled` handler
   * that survives restarts. Same risk class + grant as background jobs: needs 'jobs:run',
   * runs with NO acting user (trip reads refused; own db + declared egress only). Caps:
   * ≤100 tasks/plugin, ≤128-char name, ≤8 KB payload, recurring interval ≥60s, ≤1 year out.
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
  /** Host weather cache by coordinates (+ optional YYYY-MM-DD). Tenant-free. Needs 'weather:read'. */
  weather: {
    get(lat: number, lng: number, date?: string): Promise<unknown>;
  };
  /** Exchange rates (tenant-free, cached upstream). Needs 'rates:read'. */
  rates: {
    /** A map of quote → rate relative to `base` (e.g. base 'EUR' → { USD: 1.08, ... }). `null` on an upstream failure. */
    get(base: string): Promise<Record<string, number> | null>;
  };
  /** The global place-category reference list (read-only). Needs 'db:read:categories'. */
  categories: {
    list(): Promise<unknown[]>;
  };
  /** The acting user's own tags. Needs 'db:read:tags' (list) / 'db:write:tags' (create/update/delete). */
  tags: {
    list(): Promise<unknown[]>;
    create(input: { name: string; color?: string }): Promise<unknown>;
    update(tagId: number, input: { name?: string; color?: string }): Promise<unknown>;
    delete(tagId: number): Promise<{ deleted: boolean }>;
  };
  /** A trip's to-dos. Needs 'db:read:todos' (list) / 'db:write:todos' + 'packing_edit' (create/update/delete). */
  todos: {
    list(tripId: number): Promise<unknown[]>;
    create(tripId: number, input: { name: string; category?: string; due_date?: string; description?: string; assigned_user_id?: number; priority?: number }): Promise<unknown>;
    update(tripId: number, todoId: number, input: Record<string, unknown>): Promise<unknown>;
    delete(tripId: number, todoId: number): Promise<{ deleted: boolean }>;
  };
  // The acting user's OWN subsystem data across all their trips (not one trip), each
  // gated on its addon being enabled — mirrors the addon's own REST/MCP readers.
  journal: {
    /** The acting user's journals. Needs 'db:read:journal' + the journey addon. */
    listMine(): Promise<unknown[]>;
    /** The entries of one of the acting user's journeys (photos/story/checkins), access-checked. Needs 'db:read:journal'. */
    getEntries(journeyId: number): Promise<unknown[]>;
    /** Create an entry on a journey the acting user can edit. Needs 'db:write:journal'. */
    createEntry(journeyId: number, input: { entry_date: string; [k: string]: unknown }): Promise<unknown>;
    /** Update an entry (owner/contributor-gated). Needs 'db:write:journal'. */
    updateEntry(entryId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Delete an entry (owner/contributor-gated). Needs 'db:write:journal'. */
    deleteEntry(entryId: number): Promise<{ deleted: boolean }>;
    /** Create a new journal owned by the acting user (an importer bootstraps the journal
     * it then fills with entries). Needs 'db:write:journal'. */
    createJourney(input: { title: string; subtitle?: string; trip_ids?: number[] }): Promise<unknown>;
    /** Delete one of the acting user's journals. Needs 'db:write:journal'. */
    deleteJourney(journeyId: number): Promise<{ deleted: boolean }>;
  };
  atlas: {
    /** The acting user's visited countries + regions. Needs 'db:read:atlas' + the atlas addon. */
    visited(): Promise<{ countries: unknown[]; regions: unknown[] }>;
    /** The acting user's bucket-list items. Needs 'db:read:atlas'. */
    bucketList(): Promise<unknown[]>;
    /** Mark/unmark the ACTING USER's own visited countries/regions + bucket list. Needs 'db:write:atlas'. */
    markCountry(code: string): Promise<unknown>;
    unmarkCountry(code: string): Promise<unknown>;
    markRegion(regionCode: string, countryCode: string, regionName?: string): Promise<unknown>;
    unmarkRegion(regionCode: string): Promise<unknown>;
    createBucketItem(input: { name: string; lat?: number; lng?: number; country_code?: string; notes?: string; target_date?: string }): Promise<unknown>;
    deleteBucketItem(itemId: number): Promise<{ deleted: boolean }>;
  };
  vacay: {
    /** The acting user's vacation plan data. Needs 'db:read:vacay' + the vacay addon. */
    mine(): Promise<unknown>;
    /** Toggle the ACTING USER's own PTO day on their active plan. Needs 'db:write:vacay'. */
    toggleEntry(date: string): Promise<{ action: string }>;
    /** Toggle a company holiday on the acting user's active plan. Needs 'db:write:vacay'. */
    toggleCompanyHoliday(date: string, note?: string): Promise<{ action: string }>;
  };
  collections: {
    /** The acting user's saved-place collections. Needs 'db:read:collections' + the collections addon. */
    listMine(): Promise<unknown>;
    /** One of the acting user's collections by id. Needs 'db:read:collections' + the collections addon. */
    get(id: number): Promise<unknown>;
    /** Collections write (per-collection role enforced by the service). Needs 'db:write:collections'. */
    create(input: Record<string, unknown>): Promise<unknown>;
    update(id: number, input: Record<string, unknown>): Promise<unknown>;
    savePlace(input: Record<string, unknown>): Promise<unknown>;
    copyToTrip(input: Record<string, unknown>): Promise<unknown>;
    deletePlace(placeId: number): Promise<{ deleted: boolean }>;
  };
  daynotes: {
    /** A day's notes on a trip (membership-checked). Needs 'db:read:daynotes'. */
    list(tripId: number, dayId: number): Promise<unknown[]>;
    /** Add a note to a day. Needs 'db:write:daynotes' + the acting user's 'day_edit'. */
    create(tripId: number, dayId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Update a day note. Needs 'db:write:daynotes' + 'day_edit'. */
    update(tripId: number, dayId: number, noteId: number, input: Record<string, unknown>): Promise<unknown>;
    /** Delete a day note. Needs 'db:write:daynotes' + 'day_edit'. */
    delete(tripId: number, dayId: number, noteId: number): Promise<{ deleted: boolean }>;
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
    get(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number, key: string): Promise<unknown>;
    set(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number, key: string, value: unknown): Promise<unknown>;
    list(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number): Promise<Record<string, unknown>>;
    delete(entityType: 'trip' | 'place' | 'day' | 'reservation' | 'accommodation', entityId: number, key: string): Promise<{ deleted: boolean }>;
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

export interface CalendarEvent { id: string; title: string; start: string; end: string; allDay: boolean; }
export interface CalendarSource {
  getName(ctx: PluginContext): string;
  getEvents(userId: number, start: string, end: string, ctx: PluginContext): Promise<CalendarEvent[]>;
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

/** Host-rendered contributions into a native trip-planner view (reservations/places/day),
 * keyed to an entity by id (#plugins). DECLARATIVE ONLY — a column is text/badge/link,
 * an action is a labelled button whose target opens your sandboxed frame or calls a
 * route. Never raw HTML/markup; the host renders + sanitizes everything. */
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
   * skipped, never fatal. */
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
   * on a short timeout; the host caps the marker count and skips a failing call. */
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
   * bound, on a short timeout; the host caps counts/lengths and skips a failing call. */
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
   * the host caps the layer/country counts and skips a failing call. */
  getLayers(ctx: PluginContext): Promise<AtlasLayer[]>;
}

/** One row of extra info TREK renders under a journal entry (same shape as PlaceDetailItem). */
export interface JournalEntryRow { label: string; value?: string; url?: string; }
export interface JournalEntryProvider {
  /** Return rows for a journal entry. Runs with the current user bound, on a short
   * timeout; the host caps the row count and skips a failing call. */
  getRows(entryId: number, ctx: PluginContext): Promise<JournalEntryRow[]>;
}

/** One badge the host renders on a dashboard trip card (declarative primitives only). */
export interface TripCardContribution {
  tripId: number; id: string; label: string; value?: string; icon?: string; tone?: ContributionTone; url?: string;
}
export interface TripCardProvider {
  /** Return badges for the dashboard trip cards on screen. `tripIds` are those cards
   * (each access-checked for the acting user). Runs with the current user bound, on a
   * short timeout; the host caps the badge count and skips a failing call. */
  getCards(tripIds: number[], ctx: PluginContext): Promise<TripCardContribution[]>;
}

/** A core-event subscription (#1429 eco). Handlers run with NO user (like a job).
 * Needs 'events:subscribe'. */
export interface PluginEventSubscription {
  on: string; // a core event name (e.g. 'place:created', 'day:updated') or '*' for all
  // `entity` = the event family (e.g. 'reservation'); `entityId` = WHICH entity changed,
  // when known. `snapshot` = a whitelisted field view of the changed entity, delivered
  // ONLY when this plugin also holds the family's db:read:* grant (db:read:trips for
  // place/day/reservation/accommodation/assignment/trip, db:read:costs for budget,
  // db:read:packing for packing, db:read:daynotes for dayNote, db:read:files for file).
  // It never carries user ids, private packing items or secrets; delete/reorder/bulk
  // events have none. There is still no acting user — a trip read from the handler is
  // refused, so beyond the snapshot the id tells you what to react to, not what it
  // contains.
  handler(payload: { event: string; tripId: number; entity?: string; entityId?: number; snapshot?: Record<string, unknown> }, ctx: PluginContext): Promise<void> | void;
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
  events?: PluginEventSubscription[];
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
    settings: {
      get: (key) => (t.rpc('settings.get', { key, _inv: invocationId }) as Promise<{ value: unknown }>).then((r) => r?.value),
    },
    db: {
      query: (sql, ...args) => t.rpc('db.query', { sql, args }) as Promise<never[]>,
      exec: (sql, ...args) => t.rpc('db.exec', { sql, args }) as Promise<{ changes: number }>,
      migrate: (mid, sql) => t.rpc('db.migrate', { id: mid, sql }) as Promise<{ applied: boolean }>,
      tx: (ops) => t.rpc('db.tx', { ops }) as Promise<{ results: Array<{ changes?: number; rows?: unknown[] }> }>,
    },
    trips: {
      getById: (tripId) => t.rpc('trips.getById', { tripId, _inv: invocationId }),
      getPlaces: (tripId) => t.rpc('trips.getPlaces', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      getReservations: (tripId) => t.rpc('trips.getReservations', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      getDays: (tripId) => t.rpc('trips.getDays', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      getAccommodations: (tripId) => t.rpc('trips.getAccommodations', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      listMine: () => t.rpc('trips.listMine', { _inv: invocationId }) as Promise<unknown[]>,
      update: (tripId, input) => t.rpc('trips.update', { tripId, input, _inv: invocationId }),
      create: (input) => t.rpc('trips.create', { input, _inv: invocationId }),
      members: (tripId) => t.rpc('trips.members', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      addMember: (tripId, userId) => t.rpc('trips.addMember', { tripId, userId, _inv: invocationId }) as Promise<{ joined: boolean; tripId: number }>,
      removeMember: (tripId, userId) => t.rpc('trips.removeMember', { tripId, userId, _inv: invocationId }) as Promise<{ removed: boolean }>,
    },
    reservations: {
      listMine: () => t.rpc('reservations.listMine', { _inv: invocationId }) as Promise<unknown[]>,
      create: (tripId, input) => t.rpc('reservations.create', { tripId, input, _inv: invocationId }),
      update: (tripId, reservationId, input) => t.rpc('reservations.update', { tripId, reservationId, input, _inv: invocationId }),
      delete: (tripId, reservationId) => t.rpc('reservations.delete', { tripId, reservationId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    accommodations: {
      create: (tripId, input) => t.rpc('accommodations.create', { tripId, input, _inv: invocationId }),
      update: (tripId, accommodationId, input) => t.rpc('accommodations.update', { tripId, accommodationId, input, _inv: invocationId }),
      delete: (tripId, accommodationId) => t.rpc('accommodations.delete', { tripId, accommodationId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    packing: {
      list: (tripId) => t.rpc('packing.list', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      create: (tripId, input) => t.rpc('packing.create', { tripId, input, _inv: invocationId }),
      update: (tripId, itemId, input) => t.rpc('packing.update', { tripId, itemId, input, _inv: invocationId }),
      delete: (tripId, itemId) => t.rpc('packing.delete', { tripId, itemId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
      listBags: (tripId) => t.rpc('packing.listBags', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      createBag: (tripId, input) => t.rpc('packing.createBag', { tripId, input, _inv: invocationId }),
      updateBag: (tripId, bagId, input) => t.rpc('packing.updateBag', { tripId, bagId, input, _inv: invocationId }),
      deleteBag: (tripId, bagId) => t.rpc('packing.deleteBag', { tripId, bagId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
      setBagMembers: (tripId, bagId, userIds) => t.rpc('packing.setBagMembers', { tripId, bagId, userIds, _inv: invocationId }),
    },
    files: {
      list: (tripId) => t.rpc('files.list', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      getContent: (tripId, fileId) => t.rpc('files.getContent', { tripId, fileId, _inv: invocationId }) as Promise<{ name: string; mimetype: string; size: number; content_base64: string }>,
      create: (tripId, input) => t.rpc('files.create', { tripId, input, _inv: invocationId }),
      createLink: (tripId, fileId, opts) => t.rpc('files.createLink', { tripId, fileId, opts, _inv: invocationId }),
      update: (tripId, fileId, input) => t.rpc('files.update', { tripId, fileId, input, _inv: invocationId }),
      softDelete: (tripId, fileId) => t.rpc('files.softDelete', { tripId, fileId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    collab: {
      listNotes: (tripId) => t.rpc('collab.listNotes', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      listPolls: (tripId) => t.rpc('collab.listPolls', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      listMessages: (tripId, before) => t.rpc('collab.listMessages', { tripId, before, _inv: invocationId }) as Promise<unknown[]>,
      createNote: (tripId, input) => t.rpc('collab.createNote', { tripId, input, _inv: invocationId }),
      createPoll: (tripId, input) => t.rpc('collab.createPoll', { tripId, input, _inv: invocationId }),
      votePoll: (tripId, pollId, optionIndex) => t.rpc('collab.votePoll', { tripId, pollId, optionIndex, _inv: invocationId }),
      createMessage: (tripId, text, replyTo) => t.rpc('collab.createMessage', { tripId, text, replyTo, _inv: invocationId }),
    },
    notify: {
      send: (input) => t.rpc('notify.send', { input, _inv: invocationId }) as Promise<{ sent: boolean }>,
    },
    ai: {
      complete: (prompt, system) => t.rpc('ai.complete', { prompt, system, _inv: invocationId }) as Promise<{ text: string }>,
      extract: (text, jsonSchema, prompt) => t.rpc('ai.extract', { text, jsonSchema, prompt, _inv: invocationId }) as Promise<{ results: Record<string, unknown>[] }>,
    },
    oauth: {
      getAccessToken: () => (t.rpc('oauth.getToken', { _inv: invocationId }) as Promise<{ accessToken: string | null }>).then((r) => r?.accessToken ?? null),
    },
    scheduler: {
      at: (whenMs, name, payload) => t.rpc('scheduler.set', { name, dueAt: whenMs, payload }) as Promise<{ scheduled: boolean }>,
      in: (ms, name, payload) => t.rpc('scheduler.set', { name, dueAt: Date.now() + ms, payload }) as Promise<{ scheduled: boolean }>,
      every: (ms, name, payload) => t.rpc('scheduler.set', { name, dueAt: Date.now() + ms, everyMs: ms, payload }) as Promise<{ scheduled: boolean }>,
      cancel: (name) => t.rpc('scheduler.cancel', { name }) as Promise<{ cancelled: boolean }>,
    },
    weather: {
      get: (lat, lng, date) => t.rpc('weather.get', { lat, lng, date, _inv: invocationId }),
    },
    rates: {
      get: (base) => t.rpc('rates.get', { base, _inv: invocationId }) as Promise<Record<string, number> | null>,
    },
    categories: {
      list: () => t.rpc('categories.list', { _inv: invocationId }) as Promise<unknown[]>,
    },
    tags: {
      list: () => t.rpc('tags.list', { _inv: invocationId }) as Promise<unknown[]>,
      create: (input) => t.rpc('tags.create', { input, _inv: invocationId }),
      update: (tagId, input) => t.rpc('tags.update', { tagId, input, _inv: invocationId }),
      delete: (tagId) => t.rpc('tags.delete', { tagId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    todos: {
      list: (tripId) => t.rpc('todos.list', { tripId, _inv: invocationId }) as Promise<unknown[]>,
      create: (tripId, input) => t.rpc('todos.create', { tripId, input, _inv: invocationId }),
      update: (tripId, todoId, input) => t.rpc('todos.update', { tripId, todoId, input, _inv: invocationId }),
      delete: (tripId, todoId) => t.rpc('todos.delete', { tripId, todoId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    journal: {
      listMine: () => t.rpc('journal.listMine', { _inv: invocationId }) as Promise<unknown[]>,
      getEntries: (journeyId) => t.rpc('journal.getEntries', { journeyId, _inv: invocationId }) as Promise<unknown[]>,
      createEntry: (journeyId, input) => t.rpc('journal.createEntry', { journeyId, input, _inv: invocationId }),
      updateEntry: (entryId, input) => t.rpc('journal.updateEntry', { entryId, input, _inv: invocationId }),
      deleteEntry: (entryId) => t.rpc('journal.deleteEntry', { entryId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
      createJourney: (input) => t.rpc('journal.createJourney', { input, _inv: invocationId }),
      deleteJourney: (journeyId) => t.rpc('journal.deleteJourney', { journeyId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    atlas: {
      visited: () => t.rpc('atlas.visited', { _inv: invocationId }) as Promise<{ countries: unknown[]; regions: unknown[] }>,
      bucketList: () => t.rpc('atlas.bucketList', { _inv: invocationId }) as Promise<unknown[]>,
      markCountry: (code) => t.rpc('atlas.markCountry', { code, _inv: invocationId }),
      unmarkCountry: (code) => t.rpc('atlas.unmarkCountry', { code, _inv: invocationId }),
      markRegion: (regionCode, countryCode, regionName) => t.rpc('atlas.markRegion', { regionCode, countryCode, regionName, _inv: invocationId }),
      unmarkRegion: (regionCode) => t.rpc('atlas.unmarkRegion', { regionCode, _inv: invocationId }),
      createBucketItem: (input) => t.rpc('atlas.createBucketItem', { input, _inv: invocationId }),
      deleteBucketItem: (itemId) => t.rpc('atlas.deleteBucketItem', { itemId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    vacay: {
      mine: () => t.rpc('vacay.mine', { _inv: invocationId }),
      toggleEntry: (date) => t.rpc('vacay.toggleEntry', { date, _inv: invocationId }) as Promise<{ action: string }>,
      toggleCompanyHoliday: (date, note) => t.rpc('vacay.toggleCompanyHoliday', { date, note, _inv: invocationId }) as Promise<{ action: string }>,
    },
    collections: {
      listMine: () => t.rpc('collections.listMine', { _inv: invocationId }),
      get: (id) => t.rpc('collections.get', { id, _inv: invocationId }),
      create: (input) => t.rpc('collections.create', { input, _inv: invocationId }),
      update: (id, input) => t.rpc('collections.update', { id, input, _inv: invocationId }),
      savePlace: (input) => t.rpc('collections.savePlace', { input, _inv: invocationId }),
      copyToTrip: (input) => t.rpc('collections.copyToTrip', { input, _inv: invocationId }),
      deletePlace: (placeId) => t.rpc('collections.deletePlace', { placeId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
    },
    daynotes: {
      list: (tripId, dayId) => t.rpc('daynotes.list', { tripId, dayId, _inv: invocationId }) as Promise<unknown[]>,
      create: (tripId, dayId, input) => t.rpc('daynotes.create', { tripId, dayId, input, _inv: invocationId }),
      update: (tripId, dayId, noteId, input) => t.rpc('daynotes.update', { tripId, dayId, noteId, input, _inv: invocationId }),
      delete: (tripId, dayId, noteId) => t.rpc('daynotes.delete', { tripId, dayId, noteId, _inv: invocationId }) as Promise<{ deleted: boolean }>,
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
      // _inv binds the invocation's acting user host-side; without it the host can't
      // membership-check the broadcast and refuses every call (the capability was dead).
      broadcastToTrip: async (tripId, event, data) => {
        await t.rpc('ws.broadcastToTrip', { tripId, event, data, _inv: invocationId });
      },
      broadcastToUser: async (userId, event, data) => {
        await t.rpc('ws.broadcastToUser', { userId, event, data, _inv: invocationId });
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
      // Fire-and-forget by contract, but the host CAN reject (undeclared event name,
      // rate-limit). The rejection must not escape — a detached rejection crashes the child
      // and terminally disables the plugin over one bad emit — but swallowing it silently
      // left an author with no way to discover that `emits` was missing from the manifest.
      // Surface it on the plugin's own log stream instead.
      emit: (name, payload) => {
        t.rpc('events.emit', { event: name, payload }).catch((e: unknown) => {
          t.emit('log', {
            level: 'warn',
            msg: `events.emit("${name}") was rejected by the host: ${e instanceof Error ? e.message : String(e)}`,
            meta: { event: name },
          });
        });
      },
    },
  };
}
