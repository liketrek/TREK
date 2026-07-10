import type { PluginContext, PluginDefinition, PluginRequest, PluginResponse, Trip, Place, Day, Reservation, PackingItem, TripFile, BudgetItem, User } from './index.js';

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
      accommodations?: unknown[]; bags?: unknown[]; todos?: unknown[]; daynotes?: unknown[];
      notes?: unknown[]; polls?: unknown[]; messages?: unknown[];
      /** Default true — model the place_edit / day_edit / trip_edit permission for writes. */
      canEditCosts?: boolean; canEditPlaces?: boolean; canEditDays?: boolean; canEditTrip?: boolean;
      /** The remaining per-trip app rights (default true), keyed by the app's action
       * name: 'member_manage', 'reservation_edit', 'packing_edit', 'collab_edit',
       * 'file_upload', 'file_edit', 'file_delete'. Todos ride on 'packing_edit',
       * exactly like the real host. */
      can?: Record<string, boolean>;
    }
  >;
  /** User fixtures by id. `users.getById` serves only the public display fields
   * (id/username/display_name/avatar), and `trips.addMember` requires the target
   * to exist here — both like the real host. */
  users?: Record<number, unknown>;
  /** Optional canned db.query results, keyed by the exact sql string. */
  queryResults?: Record<string, unknown[]>;
  /** The host-bound acting user for costs.* (a job/onLoad has none → refused). */
  actingUserId?: number;
  /** Whether the Costs (budget) addon is enabled; gates all costs.* (default true). */
  budgetAddonEnabled?: boolean;
  /** Same idea for the other gated subsystems (default true): journey gates
   * journal.*, atlas gates atlas.*, vacay gates vacay.*, collections gates
   * collections.*, collab gates collab.* — a disabled addon refuses with
   * RESOURCE_FORBIDDEN, exactly like the real host's requireAddon. */
  journeyAddonEnabled?: boolean;
  atlasAddonEnabled?: boolean;
  vacayAddonEnabled?: boolean;
  collectionsAddonEnabled?: boolean;
  collabAddonEnabled?: boolean;
  /** Exports of the plugins this one depends on, keyed by plugin id then fn name.
   * `ctx.plugins.call(id, fn, args)` invokes the matching function; a missing entry
   * throws RESOURCE_FORBIDDEN (models "not a satisfied dependency / not exported"). */
  pluginExports?: Record<string, Record<string, (args: unknown) => unknown>>;
  /** Event names this plugin declares in its manifest `capabilities.emits`. When set,
   * an emit with an undeclared name is dropped with a console warning — production
   * refuses it (and the SDK client swallows the rejection, so subscribers silently
   * never see it). Unset = record every emit, as before. */
  declaredEmits?: string[];
  /** The acting user's per-user settings values for ctx.settings.get (unset key → undefined). */
  userSettings?: Record<string, unknown>;
  /** The acting user's own (non-trip) data: tags, journals, collections, atlas, vacay.
   * `journals` also gates journal entry access — an unknown journey id is refused. */
  tags?: unknown[];
  journals?: unknown[];
  journalEntries?: unknown[];
  collections?: unknown[];
  atlasVisited?: { countries?: unknown[]; regions?: unknown[] };
  atlasBucketList?: unknown[];
  vacayPlan?: unknown;
  /** Reference data + canned host answers for weather/ai/rates. */
  categories?: unknown[];
  weatherResult?: unknown;
  /** Canned map for ctx.rates.get (default null, like an upstream failure). */
  ratesResult?: Record<string, number> | null;
  aiText?: string;
  aiResults?: Record<string, unknown>[];
  /** The acting user's connected-service token for ctx.oauth.getAccessToken (default null). */
  oauthAccessToken?: string | null;
}

/** Drives a plugin's OWN entry points against the mock ctx — the missing half of a
 * unit test. After you've asserted what the plugin READ (via the recorders below),
 * fire a lifecycle handler and assert what it DID. Each method injects the same mock
 * `ctx`, so grants/fixtures configured on the host apply uniformly. */
export interface PluginDriver {
  /** Run onLoad / onUnload. */
  load(): Promise<void>;
  unload(): Promise<void>;
  /** Call a route by index, or by { method, path }. Missing request fields default
   * (empty query/headers, null body, the host's acting user). Returns its response. */
  route(match: number | { method: string; path: string }, req?: Partial<PluginRequest>): Promise<PluginResponse>;
  /** Fire a declared background job by id (userless — like the real host). */
  job(id: string): Promise<void>;
  /** Fire the `scheduled` handler as if a ctx.scheduler timer named `name` came due (userless). */
  scheduled(name: string, payload?: unknown): Promise<void>;
  /** Deliver a core event to every matching `events` subscription (userless). */
  event(name: string, payload?: { tripId?: number; entity?: string; entityId?: number; snapshot?: Record<string, unknown> }): Promise<void>;
  /** Deliver another plugin's event to every matching `subscriptions` entry (userless). */
  pluginEvent(plugin: string, event: string, payload: unknown): Promise<void>;
  /** Fire the GDPR handlers (userless). */
  deleteUserData(userId: number): Promise<void>;
  exportUserData(userId: number): Promise<unknown>;
  /** Invoke a provider hook, e.g. hook('tripCardProvider', 'getCards', [1, 2]). */
  hook<T = unknown>(name: string, fn: string, ...args: unknown[]): Promise<T>;
}

export interface MockHost {
  ctx: PluginContext;
  /** The same host with NO acting user bound — the ctx a job / scheduled task /
   * event subscription / GDPR handler receives in production (every user-bound
   * read or write refuses with RESOURCE_FORBIDDEN). Shares this host's fixtures,
   * grants and recorders. */
  userlessCtx: PluginContext;
  /** Everything the plugin did, for assertions. */
  calls: { method: string; args: unknown[] }[];
  logs: { level: string; msg: string }[];
  broadcasts: { kind: 'trip' | 'user'; target: number; event: string; data: unknown }[];
  /** Events the plugin published via ctx.events.emit, for assertions. */
  emitted: { name: string; payload: unknown }[];
  /** Notifications the plugin sent via ctx.notify.send, for assertions. */
  notifications: { title: string; body: string; link?: string; scope: 'user' | 'trip'; targetId: number }[];
  /** Timers the plugin armed via ctx.scheduler (name → schedule), for assertions. */
  scheduled: Map<string, { dueAt: number; everyMs?: number; payload?: unknown }>;
  /** Drive the plugin's own handlers against this mock ctx (routes, jobs, scheduled,
   * events, GDPR hooks, provider hooks). */
  run(def: PluginDefinition): PluginDriver;
}

class PermissionDenied extends Error {}

// --- Statement guards copied from the host's PluginDataDb (plugin-data.service.ts),
// so SQL production refuses fails in a unit test too instead of silently passing. ---
const MAX_SQL_LENGTH = 100_000;
const FORBIDDEN_SQL = /\b(ATTACH|DETACH|VACUUM|PRAGMA|RECURSIVE|LOAD_EXTENSION)\b/i;
// Transaction-control keywords, matched only at statement start (CASE…END and
// identifiers are unaffected). A raw COMMIT inside tx() would break atomicity.
const TX_CONTROL = /^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|END)\b/i;
const MAX_TX_OPS = 100;

function guardSql(sql: string): void {
  if (typeof sql !== 'string') throw new Error('sql must be a string');
  if (sql.length > MAX_SQL_LENGTH) throw new Error('sql too long');
  if (FORBIDDEN_SQL.test(sql)) throw new Error('statement type not allowed for plugin databases');
}

/** Strip LEADING comments/whitespace so a COMMIT hidden behind a line or block
 * comment can't slip past the start-anchored TX_CONTROL check. */
function stripLeadingComments(sql: string): string {
  return String(sql ?? '').replace(/^(?:\s|--[^\n]*\n?|\/\*[\s\S]*?\*\/)*/, '');
}

// The host's stripEmoji (text-sanitize.ts), copied so notify.send cleans/rejects the
// same strings without a server import: colour emoji + sequence glue removed, then
// the horizontal gaps they leave are collapsed. An all-emoji title becomes ''.
const EMOJI_RE = /\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Regional_Indicator}|[\u200D\uFE00-\uFE0F\u20E3\u{E0020}-\u{E007F}]/gu;
function stripEmoji(s: string): string {
  const stripped = s.replace(EMOJI_RE, '');
  if (stripped === s) return s;
  return stripped.replace(/[^\S\r\n]{2,}/g, ' ').replace(/ +$/gm, '').trim();
}

// The REST string caps the host mirrors on the plugin write path (rpc-host.ts).
const PLACE_STR_LIMITS: Record<string, number> = { name: 200, description: 2000, address: 500, notes: 2000 };
const TRIP_STR_LIMITS: Record<string, number> = { title: 200, description: 2000 };

export function createMockHost(opts: MockHostOptions = {}): MockHost {
  const grants = new Set(opts.grants ?? []);
  const calls: MockHost['calls'] = [];
  const logs: MockHost['logs'] = [];
  const broadcasts: MockHost['broadcasts'] = [];
  const emitted: MockHost['emitted'] = [];
  const notifications: MockHost['notifications'] = [];

  const need = (perm: string, method: string) => {
    calls.push({ method, args: [] });
    if (!grants.has(perm)) throw new PermissionDenied(`PERMISSION_DENIED: ${method} requires ${perm}`);
  };
  const assertMember = (tripId: number, asUserId: number) => {
    const t = opts.trips?.[tripId];
    if (!t || !t.members.includes(asUserId)) throw new Error(`RESOURCE_FORBIDDEN: no access to trip ${tripId}`);
    return t;
  };
  // A subsystem call is refused when its addon is off — same message as the real host.
  const requireAddon = (enabled: boolean | undefined, noun: string) => {
    if (enabled === false) throw new Error(`RESOURCE_FORBIDDEN: the ${noun} addon is disabled`);
  };
  const assertEdit = (
    t: { canEditPlaces?: boolean; canEditDays?: boolean; canEditTrip?: boolean },
    flag: 'canEditPlaces' | 'canEditDays' | 'canEditTrip',
    tripId: number,
  ) => {
    if (t[flag] === false) throw new Error(`RESOURCE_FORBIDDEN: no permission to edit trip ${tripId}`);
  };
  // The remaining per-trip app rights (member_manage, reservation_edit, packing_edit,
  // collab_edit, file_*) — modelled by the fixture's `can` record, default allowed.
  const assertRight = (t: { can?: Record<string, boolean> }, right: string, tripId: number) => {
    if (t.can?.[right] === false) throw new Error(`RESOURCE_FORBIDDEN: no permission to edit trip ${tripId}`);
  };
  // Same field caps the host applies over the open @trek/shared write schemas.
  const capStrings = (input: Record<string, unknown>, limits: Record<string, number>) => {
    for (const [field, max] of Object.entries(limits)) {
      const v = input[field];
      if (typeof v === 'string' && v.length > max) throw new Error(`${field} must be ${max} characters or fewer`);
    }
  };
  // Prod normalizes atlas codes: trimmed + UPPERCASED, max 8 chars ('de' → 'DE').
  const shortCode = (v: unknown, name: string): string => {
    if (typeof v !== 'string' || v.trim() === '' || v.length > 8) throw new Error(`${name} must be a short code`);
    return v.trim().toUpperCase();
  };
  const vacayDate = (date: string): string => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be YYYY-MM-DD');
    return date;
  };
  const rows = (arr: unknown[] | undefined): Array<Record<string, unknown>> => (arr ?? []) as Array<Record<string, unknown>>;
  // Two users "see" each other when they co-member a trip (prod's canSeeUser).
  const sharesTrip = (a: number, b: number) =>
    Object.values(opts.trips ?? {}).some((t) => t.members.includes(a) && t.members.includes(b));
  // In-memory stores for the acting user's own (non-trip) data — seeded from opts,
  // mutated in place by the write methods (same idea as the trip fixtures).
  const visitedCountries: unknown[] = [...(opts.atlasVisited?.countries ?? [])];
  const visitedRegions: unknown[] = [...(opts.atlasVisited?.regions ?? [])];
  const bucketItems: unknown[] = [...(opts.atlasBucketList ?? [])];
  const journals: unknown[] = [...(opts.journals ?? [])];
  const journalEntries: unknown[] = [...(opts.journalEntries ?? [])];
  const savedPlaces: unknown[] = [];
  const vacayEntries = new Set<string>();
  const vacayHolidays = new Set<string>();
  let collabSeq = 0;
  // In-memory scheduled tasks for ctx.scheduler (upsert by name, like the real host).
  const scheduledTasks = new Map<string, { dueAt: number; everyMs?: number; payload?: unknown }>();
  // Upsert a timer, enforcing the SAME caps as the real host so a test catches a
  // plugin that exceeds them (≤100 tasks, name ≤128 chars, payload ≤8 KB JSON,
  // dueAt finite and ≤ ~1 year out, recurring interval ≥60s).
  const scheduleTask = (name: string, dueAt: number, everyMs: number | undefined, payload: unknown) => {
    if (!name || name.length > 128) throw new Error(`scheduler name is required (max 128 chars)`);
    if (!Number.isFinite(dueAt) || dueAt > Date.now() + 366 * 24 * 60 * 60 * 1000) throw new Error('scheduler dueAt out of range');
    if (everyMs !== undefined && (!Number.isFinite(everyMs) || everyMs < 60_000)) throw new Error('recurring interval must be >= 60000 ms');
    if (JSON.stringify(payload ?? null).length > 8 * 1024) throw new Error('scheduler payload too large (max 8192 bytes)');
    if (!scheduledTasks.has(name) && scheduledTasks.size >= 100) throw new Error('too many scheduled tasks (max 100)');
    scheduledTasks.set(name, { dueAt, everyMs, payload });
  };
  // In-memory namespaced metadata store for ctx.meta (per mock plugin).
  const metaStore: Record<string, unknown> = {};
  const metaKey = (et: string, eid: number, key: string) => `${et}:${eid}:${key}`;

  const buildCtx = (actingUserId: number | undefined): PluginContext => {
    const requireActingUser = (): number => {
      if (actingUserId === undefined) throw new Error('RESOURCE_FORBIDDEN: this call requires an authenticated user context');
      return actingUserId;
    };
    const metaGate = (entityType: string, entityId: number) => {
      // The real host resolves place/day → trip; the mock only membership-checks the
      // 'trip' entity type and otherwise just requires an acting user.
      if (entityType === 'trip') assertMember(entityId, requireActingUser());
      else requireActingUser();
    };

    return {
      id: 'mock-plugin',
      config: Object.freeze({ ...(opts.config ?? {}) }),
      settings: {
        // No permission gate (like the real host); undefined in a userless context so
        // plugins fall back to ctx.config, exactly as documented.
        async get(key) {
          calls.push({ method: 'settings.get', args: [key] });
          if (actingUserId === undefined) return undefined;
          return opts.userSettings?.[key];
        },
      },
      db: {
        async query(sql) {
          need('db:own', 'db.query');
          guardSql(sql);
          return (opts.queryResults?.[sql] ?? []) as never[];
        },
        async exec(sql) {
          need('db:own', 'db.exec');
          guardSql(sql);
          return { changes: 0 };
        },
        async migrate(_id, sql) {
          need('db:own', 'db.migrate');
          guardSql(sql);
          return { applied: true };
        },
        async tx(ops) {
          need('db:own', 'db.tx');
          // Same batch guards as the host's PluginDataDb: an op cap, the forbidden
          // statement types, and no transaction control inside the batch.
          if (ops.length > MAX_TX_OPS) throw new Error(`tx allows at most ${MAX_TX_OPS} statements`);
          for (const op of ops) {
            guardSql(op.sql);
            if (TX_CONTROL.test(stripLeadingComments(op.sql))) throw new Error('transaction-control statements are not allowed inside tx()');
          }
          // Mirror the host: reads resolve from queryResults, writes report 0 changes.
          return {
            results: ops.map((op) =>
              // A statement returns rows if it starts with SELECT/WITH/VALUES OR carries a
              // RETURNING clause (an INSERT/UPDATE/DELETE … RETURNING is a reader in the
              // real host's stmt.reader), matching how the host shapes the result.
              (/^\s*(SELECT|WITH|VALUES)\b/i.test(op.sql) || /\bRETURNING\b/i.test(op.sql))
                ? { rows: (opts.queryResults?.[op.sql] ?? []) as unknown[] }
                : { changes: 0 },
            ),
          };
        },
      },
      trips: {
        async getById(tripId, _asUserId) {
          need('db:read:trips', 'trips.getById');
          return (assertMember(tripId, requireActingUser()).data ?? null) as Trip | null;
        },
        async getPlaces(tripId, _asUserId) {
          need('db:read:trips', 'trips.getPlaces');
          return (assertMember(tripId, requireActingUser()).places ?? []) as Place[];
        },
        async getReservations(tripId, _asUserId) {
          need('db:read:trips', 'trips.getReservations');
          return (assertMember(tripId, requireActingUser()).reservations ?? []) as Reservation[];
        },
        async getDays(tripId) {
          need('db:read:trips', 'trips.getDays');
          return (assertMember(tripId, requireActingUser()).days ?? []) as Day[];
        },
        async getAccommodations(tripId) {
          need('db:read:trips', 'trips.getAccommodations');
          return assertMember(tripId, requireActingUser()).accommodations ?? [];
        },
        async listMine() {
          need('db:read:trips', 'trips.listMine');
          const uid = requireActingUser();
          return Object.values(opts.trips ?? {})
            .filter((t) => t.members.includes(uid))
            .map((t) => t.data)
            .filter((d) => d != null) as Trip[];
        },
        async update(tripId, input) {
          need('db:write:trips', 'trips.update');
          const uid = requireActingUser();
          capStrings(input, TRIP_STR_LIMITS);
          const t = assertMember(tripId, uid);
          assertEdit(t, 'canEditTrip', tripId);
          const data = (t.data ??= {}) as Record<string, unknown>;
          Object.assign(data, input);
          return data as Trip;
        },
        async create(input) {
          need('db:create:trips', 'trips.create');
          const uid = requireActingUser();
          if (typeof input.title !== 'string' || input.title === '') throw new Error('invalid trip: title is required');
          capStrings(input as Record<string, unknown>, TRIP_STR_LIMITS);
          const id = Math.max(0, ...Object.keys(opts.trips ?? {}).map(Number)) + 1;
          const data = { id, user_id: uid, ...input } as Trip;
          (opts.trips ??= {})[id] = { members: [uid], data };
          return data;
        },
        async members(tripId) {
          need('db:read:trips', 'trips.members');
          return assertMember(tripId, requireActingUser()).members.map((id) => opts.users?.[id] ?? { id }) as User[];
        },
        async addMember(tripId, userId) {
          need('db:write:members', 'trips.addMember');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'member_manage', tripId);
          // Prod verifies the target account exists before granting access; the owner
          // and existing members are no-ops (joined: false), like joinTripAsMember.
          if (!opts.users?.[userId]) throw new Error(`RESOURCE_FORBIDDEN: no user ${userId}`);
          const owner = (t.data as { user_id?: number } | undefined)?.user_id;
          const joined = userId !== owner && !t.members.includes(userId);
          if (joined) t.members.push(userId);
          return { joined, tripId };
        },
        async removeMember(tripId, userId) {
          need('db:write:members', 'trips.removeMember');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'member_manage', tripId);
          // Never the owner — prod refuses rather than orphaning the trip.
          if ((t.data as { user_id?: number } | undefined)?.user_id === userId) {
            throw new Error('RESOURCE_FORBIDDEN: cannot remove the trip owner');
          }
          const i = t.members.indexOf(userId);
          if (i >= 0) t.members.splice(i, 1);
          // Prod reports { removed: true } unconditionally (a plain DELETE, no row check).
          return { removed: true };
        },
      },
      reservations: {
        async listMine() {
          need('db:read:trips', 'reservations.listMine');
          const uid = requireActingUser();
          return Object.values(opts.trips ?? {})
            .filter((t) => t.members.includes(uid))
            .flatMap((t) => t.reservations ?? []) as Reservation[];
        },
        async create(tripId, input) {
          need('db:write:reservations', 'reservations.create');
          const uid = requireActingUser();
          if (typeof (input as { title?: unknown }).title !== 'string' || (input as { title: string }).title === '') {
            throw new Error('invalid reservation: title is required');
          }
          const t = assertMember(tripId, uid);
          assertRight(t, 'reservation_edit', tripId);
          const r = { id: (t.reservations?.length ?? 0) + 1, trip_id: tripId, ...input };
          (t.reservations ??= []).push(r);
          return r;
        },
        async update(tripId, reservationId, input) {
          need('db:write:reservations', 'reservations.update');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'reservation_edit', tripId);
          const r = rows(t.reservations).find((x) => x.id === reservationId);
          if (!r) throw new Error(`RESOURCE_FORBIDDEN: no reservation ${reservationId} on trip ${tripId}`);
          Object.assign(r, input);
          return r as Reservation;
        },
        async delete(tripId, reservationId) {
          need('db:write:reservations', 'reservations.delete');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'reservation_edit', tripId);
          const list = rows((t.reservations ??= []));
          const i = list.findIndex((x) => x.id === reservationId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no reservation ${reservationId} on trip ${tripId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
      },
      // Lodging blocks: the real host needs 'day_edit' here (they live in the day
      // service), so the mock reuses the canEditDays flag.
      accommodations: {
        async create(tripId, input) {
          need('db:write:accommodations', 'accommodations.create');
          const t = assertMember(tripId, requireActingUser());
          // Same required-refs check as the host wiring (ids may arrive as strings).
          if (!Math.trunc(Number(input.place_id)) || !Math.trunc(Number(input.start_day_id)) || !Math.trunc(Number(input.end_day_id))) {
            throw new Error('place_id, start_day_id, and end_day_id are required');
          }
          assertEdit(t, 'canEditDays', tripId);
          const a = { id: (t.accommodations?.length ?? 0) + 1, trip_id: tripId, ...input };
          (t.accommodations ??= []).push(a);
          return a;
        },
        async update(tripId, accommodationId, input) {
          need('db:write:accommodations', 'accommodations.update');
          const t = assertMember(tripId, requireActingUser());
          assertEdit(t, 'canEditDays', tripId);
          const a = rows(t.accommodations).find((x) => x.id === accommodationId);
          if (!a) throw new Error(`RESOURCE_FORBIDDEN: no accommodation ${accommodationId} on trip ${tripId}`);
          Object.assign(a, input);
          return a;
        },
        async delete(tripId, accommodationId) {
          need('db:write:accommodations', 'accommodations.delete');
          const t = assertMember(tripId, requireActingUser());
          assertEdit(t, 'canEditDays', tripId);
          const list = rows((t.accommodations ??= []));
          const i = list.findIndex((x) => x.id === accommodationId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no accommodation ${accommodationId} on trip ${tripId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
      },
      packing: {
        async list(tripId) {
          need('db:read:packing', 'packing.list');
          return (assertMember(tripId, requireActingUser()).packing ?? []) as PackingItem[];
        },
        async create(tripId, input) {
          need('db:write:packing', 'packing.create');
          const uid = requireActingUser();
          if (typeof input.name !== 'string' || input.name === '') throw new Error('invalid packing item: name is required');
          const t = assertMember(tripId, uid);
          assertRight(t, 'packing_edit', tripId);
          const item = { id: (t.packing?.length ?? 0) + 1, trip_id: tripId, ...input };
          (t.packing ??= []).push(item);
          return item;
        },
        async update(tripId, itemId, input) {
          need('db:write:packing', 'packing.update');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const item = rows(t.packing).find((x) => x.id === itemId);
          if (!item) throw new Error(`RESOURCE_FORBIDDEN: no packing item ${itemId} on trip ${tripId}`);
          Object.assign(item, input);
          return item as PackingItem;
        },
        async delete(tripId, itemId) {
          need('db:write:packing', 'packing.delete');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const list = rows((t.packing ??= []));
          const i = list.findIndex((x) => x.id === itemId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no packing item ${itemId} on trip ${tripId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
        async listBags(tripId) {
          need('db:write:packing', 'packing.listBags');
          return assertMember(tripId, requireActingUser()).bags ?? [];
        },
        async createBag(tripId, input) {
          need('db:write:packing', 'packing.createBag');
          const uid = requireActingUser();
          if (typeof input.name !== 'string' || input.name.trim() === '') throw new Error('bag name is required');
          const t = assertMember(tripId, uid);
          assertRight(t, 'packing_edit', tripId);
          const bag = { id: (t.bags?.length ?? 0) + 1, trip_id: tripId, member_ids: [] as number[], ...input };
          (t.bags ??= []).push(bag);
          return bag;
        },
        async updateBag(tripId, bagId, input) {
          need('db:write:packing', 'packing.updateBag');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const bag = rows(t.bags).find((x) => x.id === bagId);
          if (!bag) throw new Error(`RESOURCE_FORBIDDEN: no bag ${bagId} on trip ${tripId}`);
          Object.assign(bag, input);
          return bag;
        },
        async deleteBag(tripId, bagId) {
          need('db:write:packing', 'packing.deleteBag');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const list = rows((t.bags ??= []));
          const i = list.findIndex((x) => x.id === bagId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no bag ${bagId} on trip ${tripId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
        async setBagMembers(tripId, bagId, userIds) {
          need('db:write:packing', 'packing.setBagMembers');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const bag = rows(t.bags).find((x) => x.id === bagId);
          if (!bag) throw new Error(`RESOURCE_FORBIDDEN: no bag ${bagId} on trip ${tripId}`);
          bag.member_ids = [...userIds];
          return bag;
        },
      },
      files: {
        async list(tripId) {
          need('db:read:files', 'files.list');
          return (assertMember(tripId, requireActingUser()).files ?? []) as TripFile[];
        },
        async getContent(tripId, fileId) {
          need('db:read:files:content', 'files.getContent');
          const t = assertMember(tripId, requireActingUser());
          const file = rows(t.files).find((x) => x.id === fileId);
          if (!file) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
          const content = typeof file.content_base64 === 'string' ? file.content_base64 : '';
          return {
            name: String(file.name ?? `file-${fileId}`),
            mimetype: String(file.mimetype ?? 'application/octet-stream'),
            size: typeof file.size === 'number' ? file.size : Buffer.from(content, 'base64').length,
            content_base64: content,
          };
        },
        async create(tripId, input) {
          need('db:write:files', 'files.create');
          const uid = requireActingUser();
          const { content_base64, ...rest } = input;
          // Same caps as the host: bounded name, required bytes, 10MB base64 ceiling.
          if (typeof input.name !== 'string' || input.name.trim() === '' || input.name.length > 255) throw new Error('file name is required (max 255 chars)');
          if (typeof content_base64 !== 'string' || content_base64 === '') throw new Error('content_base64 is required');
          if (content_base64.length > 14 * 1024 * 1024) throw new Error('file exceeds the 10MB plugin upload cap');
          const t = assertMember(tripId, uid);
          assertRight(t, 'file_upload', tripId);
          const file = { id: (t.files?.length ?? 0) + 1, trip_id: tripId, size: Buffer.from(content_base64, 'base64').length, ...rest };
          (t.files ??= []).push(file);
          return file;
        },
        async createLink(tripId, fileId, linkOpts) {
          need('db:write:files', 'files.createLink');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'file_edit', tripId);
          const file = rows(t.files).find((x) => x.id === fileId);
          if (!file) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
          Object.assign(file, linkOpts);
          return file;
        },
        async update(tripId, fileId, input) {
          need('db:write:files', 'files.update');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'file_edit', tripId);
          const file = rows(t.files).find((x) => x.id === fileId);
          if (!file) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
          Object.assign(file, input);
          return file as TripFile;
        },
        async softDelete(tripId, fileId) {
          need('db:write:files', 'files.softDelete');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'file_delete', tripId);
          const list = rows((t.files ??= []));
          const i = list.findIndex((x) => x.id === fileId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
      },
      // Collab is addon-gated on the real host (reads and writes); writes additionally
      // need the app's collab_edit right.
      collab: {
        async listNotes(tripId) {
          need('db:read:collab', 'collab.listNotes');
          const t = assertMember(tripId, requireActingUser());
          requireAddon(opts.collabAddonEnabled, 'collab');
          return t.notes ?? [];
        },
        async listPolls(tripId) {
          need('db:read:collab', 'collab.listPolls');
          const t = assertMember(tripId, requireActingUser());
          requireAddon(opts.collabAddonEnabled, 'collab');
          return t.polls ?? [];
        },
        async listMessages(tripId, before) {
          need('db:read:collab', 'collab.listMessages');
          const t = assertMember(tripId, requireActingUser());
          requireAddon(opts.collabAddonEnabled, 'collab');
          const messages = rows(t.messages);
          return before === undefined ? messages : messages.filter((m) => typeof m.id === 'number' && m.id < before);
        },
        async createNote(tripId, input) {
          need('db:write:collab', 'collab.createNote');
          const uid = requireActingUser();
          if (typeof input.title !== 'string' || input.title.trim() === '') throw new Error('note title is required');
          const t = assertMember(tripId, uid);
          assertRight(t, 'collab_edit', tripId);
          requireAddon(opts.collabAddonEnabled, 'collab');
          return { id: ++collabSeq, trip_id: tripId, ...input };
        },
        async createPoll(tripId, input) {
          need('db:write:collab', 'collab.createPoll');
          const uid = requireActingUser();
          if (typeof input.question !== 'string' || input.question.trim() === '') throw new Error('poll question is required');
          if (!Array.isArray(input.options) || input.options.length < 2) throw new Error('a poll needs at least two options');
          const t = assertMember(tripId, uid);
          assertRight(t, 'collab_edit', tripId);
          requireAddon(opts.collabAddonEnabled, 'collab');
          return { id: ++collabSeq, trip_id: tripId, ...input };
        },
        async votePoll(tripId, pollId, optionIndex) {
          need('db:write:collab', 'collab.votePoll');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'collab_edit', tripId);
          requireAddon(opts.collabAddonEnabled, 'collab');
          return { poll_id: pollId, option_index: optionIndex };
        },
        async createMessage(tripId, text, replyTo) {
          need('db:write:collab', 'collab.createMessage');
          const uid = requireActingUser();
          if (typeof text !== 'string' || text.trim() === '' || text.length > 4000) throw new Error('message text is required (max 4000 chars)');
          const t = assertMember(tripId, uid);
          assertRight(t, 'collab_edit', tripId);
          requireAddon(opts.collabAddonEnabled, 'collab');
          return { id: ++collabSeq, trip_id: tripId, text, reply_to: replyTo ?? null };
        },
      },
      notify: {
        async send(input) {
          need('notify:send', 'notify.send');
          const uid = requireActingUser();
          // Mirror the host: title/body are emoji-stripped with the same required/length
          // caps (an all-emoji title collapses to '' → rejected), scope is restricted to
          // user|trip, and a link must be an in-app path, capped at 512 chars.
          const title = typeof input.title === 'string' ? stripEmoji(input.title) : '';
          const body = typeof input.body === 'string' ? stripEmoji(input.body) : '';
          if (!title || title.length > 200) throw new Error('notification title is required (max 200 chars)');
          if (!body || body.length > 1000) throw new Error('notification body is required (max 1000 chars)');
          const scope: unknown = input.scope;
          if (scope !== 'user' && scope !== 'trip') throw new Error("scope must be 'user' or 'trip'");
          // Match the real host exactly: a 'user' target must BE the acting user — it throws
          // rather than silently coercing, so a test can't pass on a wrong recipient that
          // production would reject; a 'trip' target is membership-checked.
          if (scope === 'user' && input.targetId !== uid) {
            throw new Error('RESOURCE_FORBIDDEN: a plugin may only notify the acting user');
          }
          if (scope === 'trip') {
            const t = opts.trips?.[input.targetId];
            if (!t || !t.members.includes(uid)) throw new Error('RESOURCE_FORBIDDEN: the acting user is not a member of that trip');
          }
          let link: string | undefined;
          if (typeof input.link === 'string' && input.link !== '') {
            // Same open-redirect-safe relative-link rule as the host: an in-app path only.
            if (!input.link.startsWith('/') || input.link.startsWith('//')) throw new Error('link must be an in-app path starting with /');
            link = input.link.slice(0, 512);
          }
          notifications.push({ title, body, ...(link ? { link } : {}), scope, targetId: input.targetId });
          return { sent: true };
        },
      },
      ai: {
        async complete() {
          need('ai:invoke', 'ai.complete');
          return { text: opts.aiText ?? '' };
        },
        async extract() {
          need('ai:invoke', 'ai.extract');
          return { results: opts.aiResults ?? [] };
        },
      },
      oauth: {
        async getAccessToken() {
          need('oauth:client', 'oauth.getToken');
          if (actingUserId === undefined) return null; // userless context — nobody to act for
          return opts.oauthAccessToken ?? null;
        },
      },
      scheduler: {
        async at(whenMs, name, payload) {
          need('jobs:run', 'scheduler.set');
          scheduleTask(name, whenMs, undefined, payload);
          return { scheduled: true };
        },
        async in(ms, name, payload) {
          need('jobs:run', 'scheduler.set');
          scheduleTask(name, Date.now() + ms, undefined, payload);
          return { scheduled: true };
        },
        async every(ms, name, payload) {
          need('jobs:run', 'scheduler.set');
          scheduleTask(name, Date.now() + ms, ms, payload);
          return { scheduled: true };
        },
        async cancel(name) {
          need('jobs:run', 'scheduler.cancel');
          return { cancelled: scheduledTasks.delete(name) };
        },
      },
      weather: {
        async get(lat, lng) {
          need('weather:read', 'weather.get');
          // Coordinates are required numbers on the real host (BAD_PARAMS otherwise).
          if (typeof lat !== 'number' || !Number.isFinite(lat)) throw new Error('lat must be a number');
          if (typeof lng !== 'number' || !Number.isFinite(lng)) throw new Error('lng must be a number');
          return opts.weatherResult ?? null;
        },
      },
      rates: {
        async get() {
          need('rates:read', 'rates.get');
          return opts.ratesResult ?? null;
        },
      },
      categories: {
        async list() {
          need('db:read:categories', 'categories.list');
          return opts.categories ?? [];
        },
      },
      tags: {
        async list() {
          need('db:read:tags', 'tags.list');
          requireActingUser();
          return opts.tags ?? [];
        },
        async create(input) {
          need('db:write:tags', 'tags.create');
          requireActingUser();
          if (typeof input.name !== 'string' || input.name.trim() === '') throw new Error('tag name is required');
          const tag = { id: (opts.tags?.length ?? 0) + 1, ...input };
          (opts.tags ??= []).push(tag);
          return tag;
        },
        async update(tagId, input) {
          need('db:write:tags', 'tags.update');
          requireActingUser();
          const tag = rows(opts.tags).find((x) => x.id === tagId);
          if (!tag) throw new Error(`RESOURCE_FORBIDDEN: no tag ${tagId} for this user`);
          Object.assign(tag, input);
          return tag;
        },
        async delete(tagId) {
          need('db:write:tags', 'tags.delete');
          requireActingUser();
          const list = rows((opts.tags ??= []));
          const i = list.findIndex((x) => x.id === tagId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no tag ${tagId} for this user`);
          list.splice(i, 1);
          return { deleted: true };
        },
      },
      // Todos are edited under the app's 'packing_edit' permission, like the real host.
      todos: {
        async list(tripId) {
          need('db:read:todos', 'todos.list');
          return assertMember(tripId, requireActingUser()).todos ?? [];
        },
        async create(tripId, input) {
          need('db:write:todos', 'todos.create');
          const uid = requireActingUser();
          if (typeof input.name !== 'string' || input.name.trim() === '') throw new Error('todo name is required');
          const t = assertMember(tripId, uid);
          assertRight(t, 'packing_edit', tripId);
          const todo = { id: (t.todos?.length ?? 0) + 1, trip_id: tripId, ...input };
          (t.todos ??= []).push(todo);
          return todo;
        },
        async update(tripId, todoId, input) {
          need('db:write:todos', 'todos.update');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const todo = rows(t.todos).find((x) => x.id === todoId);
          if (!todo) throw new Error(`RESOURCE_FORBIDDEN: no todo ${todoId} on trip ${tripId}`);
          Object.assign(todo, input);
          return todo;
        },
        async delete(tripId, todoId) {
          need('db:write:todos', 'todos.delete');
          const t = assertMember(tripId, requireActingUser());
          assertRight(t, 'packing_edit', tripId);
          const list = rows((t.todos ??= []));
          const i = list.findIndex((x) => x.id === todoId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no todo ${todoId} on trip ${tripId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
      },
      // Journeys are the acting user's own (the journals fixture); every method is
      // gated on the Journey addon like the real host, and entry writes check the
      // journey exists/is editable.
      journal: {
        async listMine() {
          need('db:read:journal', 'journal.listMine');
          requireActingUser();
          requireAddon(opts.journeyAddonEnabled, 'journey');
          return journals;
        },
        async getEntries(journeyId) {
          need('db:read:journal', 'journal.getEntries');
          requireActingUser();
          requireAddon(opts.journeyAddonEnabled, 'journey');
          if (!rows(journals).some((x) => x.id === journeyId)) throw new Error(`RESOURCE_FORBIDDEN: no access to journey ${journeyId}`);
          return rows(journalEntries).filter((x) => x.journey_id === journeyId);
        },
        async createEntry(journeyId, input) {
          need('db:write:journal', 'journal.createEntry');
          requireActingUser();
          if (typeof input.entry_date !== 'string' || input.entry_date === '') throw new Error('entry_date is required');
          requireAddon(opts.journeyAddonEnabled, 'journey');
          if (!rows(journals).some((x) => x.id === journeyId)) throw new Error(`RESOURCE_FORBIDDEN: no editable journey ${journeyId} for this user`);
          const entry = { id: journalEntries.length + 1, journey_id: journeyId, ...input };
          journalEntries.push(entry);
          return entry;
        },
        async createJourney(input) {
          need('db:write:journal', 'journal.createJourney');
          requireActingUser();
          requireAddon(opts.journeyAddonEnabled, 'journey');
          if (typeof input.title !== 'string' || input.title.trim() === '') throw new Error('journal title is required');
          const journey = { id: journals.length + 1, ...input };
          journals.push(journey);
          return journey;
        },
        async deleteJourney(journeyId) {
          need('db:write:journal', 'journal.deleteJourney');
          requireActingUser();
          requireAddon(opts.journeyAddonEnabled, 'journey');
          const i = rows(journals).findIndex((x) => x.id === journeyId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no deletable journal ${journeyId} for this user`);
          journals.splice(i, 1);
          return { deleted: true };
        },
        async updateEntry(entryId, input) {
          need('db:write:journal', 'journal.updateEntry');
          requireActingUser();
          requireAddon(opts.journeyAddonEnabled, 'journey');
          const entry = rows(journalEntries).find((x) => x.id === entryId);
          if (!entry) throw new Error(`RESOURCE_FORBIDDEN: no editable journal entry ${entryId} for this user`);
          Object.assign(entry, input);
          return entry;
        },
        async deleteEntry(entryId) {
          need('db:write:journal', 'journal.deleteEntry');
          requireActingUser();
          requireAddon(opts.journeyAddonEnabled, 'journey');
          const i = rows(journalEntries).findIndex((x) => x.id === entryId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no editable journal entry ${entryId} for this user`);
          journalEntries.splice(i, 1);
          return { deleted: true };
        },
      },
      atlas: {
        async visited() {
          need('db:read:atlas', 'atlas.visited');
          requireActingUser();
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          return { countries: visitedCountries, regions: visitedRegions };
        },
        async bucketList() {
          need('db:read:atlas', 'atlas.bucketList');
          requireActingUser();
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          return bucketItems;
        },
        async markCountry(code) {
          need('db:write:atlas', 'atlas.markCountry');
          requireActingUser();
          const c = shortCode(code, 'code');
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          if (!visitedCountries.includes(c)) visitedCountries.push(c);
          return { visited: true };
        },
        async unmarkCountry(code) {
          need('db:write:atlas', 'atlas.unmarkCountry');
          requireActingUser();
          const c = shortCode(code, 'code');
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          const i = visitedCountries.indexOf(c);
          if (i >= 0) visitedCountries.splice(i, 1);
          return { visited: false };
        },
        async markRegion(regionCode, countryCode, regionName) {
          need('db:write:atlas', 'atlas.markRegion');
          requireActingUser();
          // Prod defaults a missing name to the RAW region code, before normalization.
          const name = typeof regionName === 'string' && regionName ? regionName.slice(0, 128) : String(regionCode ?? '');
          const region = { region_code: shortCode(regionCode, 'regionCode'), country_code: shortCode(countryCode, 'countryCode'), region_name: name };
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          visitedRegions.push(region);
          return { visited: true };
        },
        async unmarkRegion(regionCode) {
          need('db:write:atlas', 'atlas.unmarkRegion');
          requireActingUser();
          const c = shortCode(regionCode, 'regionCode');
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          const i = rows(visitedRegions).findIndex((x) => x.region_code === c);
          if (i >= 0) visitedRegions.splice(i, 1);
          return { visited: false };
        },
        async createBucketItem(input) {
          need('db:write:atlas', 'atlas.createBucketItem');
          requireActingUser();
          if (typeof input.name !== 'string' || input.name.trim() === '') throw new Error('bucket item name is required');
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          const item = { id: bucketItems.length + 1, ...input };
          bucketItems.push(item);
          return item;
        },
        async deleteBucketItem(itemId) {
          need('db:write:atlas', 'atlas.deleteBucketItem');
          requireActingUser();
          requireAddon(opts.atlasAddonEnabled, 'atlas');
          const i = rows(bucketItems).findIndex((x) => x.id === itemId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no bucket item ${itemId} for this user`);
          bucketItems.splice(i, 1);
          return { deleted: true };
        },
      },
      vacay: {
        async mine() {
          need('db:read:vacay', 'vacay.mine');
          requireActingUser();
          requireAddon(opts.vacayAddonEnabled, 'vacay');
          return opts.vacayPlan ?? null;
        },
        async toggleEntry(date) {
          need('db:write:vacay', 'vacay.toggleEntry');
          requireActingUser();
          const d = vacayDate(date);
          requireAddon(opts.vacayAddonEnabled, 'vacay');
          if (vacayEntries.has(d)) { vacayEntries.delete(d); return { action: 'removed' }; }
          vacayEntries.add(d);
          return { action: 'added' };
        },
        async toggleCompanyHoliday(date) {
          need('db:write:vacay', 'vacay.toggleCompanyHoliday');
          requireActingUser();
          const d = vacayDate(date);
          requireAddon(opts.vacayAddonEnabled, 'vacay');
          if (vacayHolidays.has(d)) { vacayHolidays.delete(d); return { action: 'removed' }; }
          vacayHolidays.add(d);
          return { action: 'added' };
        },
      },
      collections: {
        async listMine() {
          need('db:read:collections', 'collections.listMine');
          requireActingUser();
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          return opts.collections ?? [];
        },
        async get(id) {
          need('db:read:collections', 'collections.get');
          requireActingUser();
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          const c = rows(opts.collections).find((x) => x.id === id);
          if (!c) throw new Error(`RESOURCE_FORBIDDEN: no collection ${id}`);
          return c;
        },
        async create(input) {
          need('db:write:collections', 'collections.create');
          requireActingUser();
          if (typeof input.name !== 'string' || input.name === '' || input.name.length > 120) throw new Error('invalid collection: name is required (max 120 chars)');
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          const c = { id: (opts.collections?.length ?? 0) + 1, ...input };
          (opts.collections ??= []).push(c);
          return c;
        },
        async update(id, input) {
          need('db:write:collections', 'collections.update');
          requireActingUser();
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          const c = rows(opts.collections).find((x) => x.id === id);
          if (!c) throw new Error(`RESOURCE_FORBIDDEN: no collection ${id}`);
          Object.assign(c, input);
          return c;
        },
        async savePlace(input) {
          need('db:write:collections', 'collections.savePlace');
          requireActingUser();
          if (typeof input.collection_id !== 'number') throw new Error('invalid place: collection_id is required');
          if (typeof input.name !== 'string' || input.name === '') throw new Error('invalid place: name is required');
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          const place = { id: savedPlaces.length + 1, ...input };
          savedPlaces.push(place);
          return place;
        },
        async copyToTrip(input) {
          need('db:write:collections', 'collections.copyToTrip');
          requireActingUser();
          if (typeof input.trip_id !== 'number') throw new Error('invalid copy request: trip_id is required');
          if (!Array.isArray(input.place_ids) || input.place_ids.length < 1) throw new Error('invalid copy request: place_ids must be a non-empty array');
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          return { copied: true, ...input };
        },
        async deletePlace(placeId) {
          need('db:write:collections', 'collections.deletePlace');
          requireActingUser();
          requireAddon(opts.collectionsAddonEnabled, 'collections');
          const i = rows(savedPlaces).findIndex((x) => x.id === placeId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no saved place ${placeId}`);
          savedPlaces.splice(i, 1);
          return { deleted: true };
        },
      },
      // Day notes need 'day_edit' on the real host, so writes reuse canEditDays too.
      daynotes: {
        async list(tripId, dayId) {
          need('db:read:daynotes', 'daynotes.list');
          const t = assertMember(tripId, requireActingUser());
          return rows(t.daynotes).filter((x) => x.day_id === dayId);
        },
        async create(tripId, dayId, input) {
          need('db:write:daynotes', 'daynotes.create');
          const uid = requireActingUser();
          if (typeof input.text !== 'string' || input.text.trim() === '') throw new Error('note text is required');
          const t = assertMember(tripId, uid);
          assertEdit(t, 'canEditDays', tripId);
          const note = { id: (t.daynotes?.length ?? 0) + 1, day_id: dayId, ...input };
          (t.daynotes ??= []).push(note);
          return note;
        },
        async update(tripId, dayId, noteId, input) {
          need('db:write:daynotes', 'daynotes.update');
          const t = assertMember(tripId, requireActingUser());
          assertEdit(t, 'canEditDays', tripId);
          const note = rows(t.daynotes).find((x) => x.id === noteId && x.day_id === dayId);
          if (!note) throw new Error(`RESOURCE_FORBIDDEN: no note ${noteId} on day ${dayId}`);
          Object.assign(note, input);
          return note;
        },
        async delete(tripId, dayId, noteId) {
          need('db:write:daynotes', 'daynotes.delete');
          const t = assertMember(tripId, requireActingUser());
          assertEdit(t, 'canEditDays', tripId);
          const list = rows((t.daynotes ??= []));
          const i = list.findIndex((x) => x.id === noteId && x.day_id === dayId);
          if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no note ${noteId} on day ${dayId}`);
          list.splice(i, 1);
          return { deleted: true };
        },
      },
      costs: {
        async getByTrip(tripId) {
          need('db:read:costs', 'costs.getByTrip');
          const t = assertMember(tripId, requireActingUser());
          requireAddon(opts.budgetAddonEnabled, 'costs');
          return (t.costs ?? []) as BudgetItem[];
        },
        async listMine() {
          need('db:read:costs', 'costs.listMine');
          const uid = requireActingUser();
          requireAddon(opts.budgetAddonEnabled, 'costs');
          return Object.values(opts.trips ?? {})
            .filter((t) => t.members.includes(uid))
            .flatMap((t) => t.costs ?? []) as BudgetItem[];
        },
        async create(tripId, input) {
          need('db:write:costs', 'costs.create');
          const uid = requireActingUser();
          requireAddon(opts.budgetAddonEnabled, 'costs');
          if (typeof input.name !== 'string' || input.name === '') throw new Error('invalid cost: name is required');
          const t = assertMember(tripId, uid);
          if (t.canEditCosts === false) {
            throw new Error(`RESOURCE_FORBIDDEN: no permission to edit costs on trip ${tripId}`);
          }
          const item = { id: (t.costs?.length ?? 0) + 1, trip_id: tripId, ...input };
          (t.costs ??= []).push(item);
          return item;
        },
        async update(tripId, itemId, input) {
          need('db:write:costs', 'costs.update');
          const uid = requireActingUser();
          requireAddon(opts.budgetAddonEnabled, 'costs');
          const t = assertMember(tripId, uid);
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
          const uid = requireActingUser();
          requireAddon(opts.budgetAddonEnabled, 'costs');
          const t = assertMember(tripId, uid);
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
          const uid = requireActingUser();
          if (typeof input.name !== 'string' || input.name === '') throw new Error('invalid place: name is required');
          capStrings(input, PLACE_STR_LIMITS);
          const t = assertMember(tripId, uid);
          assertEdit(t, 'canEditPlaces', tripId);
          const place = { id: (t.places?.length ?? 0) + 1, trip_id: tripId, ...input };
          (t.places ??= []).push(place);
          return place;
        },
        async update(tripId, placeId, input) {
          need('db:write:places', 'places.update');
          const uid = requireActingUser();
          capStrings(input, PLACE_STR_LIMITS);
          const t = assertMember(tripId, uid);
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
          // Prod scopes to people the acting user can SEE (self or a shared trip) and
          // serves ONLY the public display columns — never email/role/secrets.
          const uid = requireActingUser();
          if (id !== uid && !sharesTrip(uid, id)) throw new Error(`RESOURCE_FORBIDDEN: no access to user ${id}`);
          const u = opts.users?.[id] as Record<string, unknown> | undefined;
          if (!u) return null;
          const out: Record<string, unknown> = { id, username: u.username, display_name: u.display_name, avatar: u.avatar };
          return out as User;
        },
      },
      ws: {
        async broadcastToTrip(tripId, event, data) {
          need('ws:broadcast:trip', 'ws.broadcastToTrip');
          // Prod gates the TARGET like a read: only a trip room the acting user can access.
          if (actingUserId === undefined) throw new Error('RESOURCE_FORBIDDEN: broadcasts require an authenticated user context');
          assertMember(tripId, actingUserId);
          broadcasts.push({ kind: 'trip', target: tripId, event, data });
        },
        async broadcastToUser(userId, event, data) {
          need('ws:broadcast:user', 'ws.broadcastToUser');
          if (actingUserId === undefined || userId !== actingUserId) {
            throw new Error('RESOURCE_FORBIDDEN: a plugin may only broadcast to the acting user');
          }
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
          // Prod refuses an emit whose name isn't in capabilities.emits — the SDK client
          // swallows the rejection, so subscribers silently never see it. Mirror that:
          // warn the author and drop the event instead of recording it as delivered.
          if (opts.declaredEmits && !opts.declaredEmits.includes(name)) {
            console.warn(`[mock-host] events.emit("${name}") is not declared in capabilities.emits — production drops this event`);
            return;
          }
          emitted.push({ name, payload });
        },
      },
    };
  };

  const ctx = buildCtx(opts.actingUserId);
  // Prod invokes jobs, scheduled tasks, event subscriptions and the GDPR handlers
  // with NO acting user — membership-bound reads/writes refuse there. This second
  // ctx shares every fixture and recorder but binds nobody.
  const userlessCtx = buildCtx(undefined);

  const run = (def: PluginDefinition): PluginDriver => ({
    load: async () => { await def.onLoad?.(ctx); },
    unload: async () => { await def.onUnload?.(ctx); },
    route: async (match, req) => {
      const routes = def.routes ?? [];
      const r = typeof match === 'number' ? routes[match] : routes.find((x) => x.method === match.method && x.path === match.path);
      if (!r) throw new Error(`no route ${typeof match === 'number' ? `#${match}` : `${match.method} ${match.path}`}`);
      const full: PluginRequest = {
        method: r.method, path: r.path, query: {}, body: null, headers: {},
        user: opts.actingUserId != null ? { id: opts.actingUserId, username: 'mock', isAdmin: false } : null,
        ...(req as object),
      };
      return r.handler(full, ctx);
    },
    job: async (id) => {
      const j = (def.jobs ?? []).find((x) => x.id === id);
      if (!j) throw new Error(`no job "${id}"`);
      await j.handler(userlessCtx);
    },
    scheduled: async (name, payload) => {
      if (typeof def.scheduled !== 'function') throw new Error('plugin has no scheduled handler');
      await def.scheduled({ name, payload }, userlessCtx);
    },
    event: async (name, payload) => {
      for (const s of def.events ?? []) {
        if (s.on === name || s.on === '*') {
          await s.handler({ event: name, tripId: payload?.tripId ?? 0, entity: payload?.entity, entityId: payload?.entityId, snapshot: payload?.snapshot }, userlessCtx);
        }
      }
    },
    pluginEvent: async (plugin, event, payload) => {
      for (const s of def.subscriptions ?? []) {
        if (s.plugin === plugin && s.event === event) await s.handler(payload, userlessCtx);
      }
    },
    deleteUserData: async (userId) => {
      if (typeof def.deleteUserData !== 'function') throw new Error('plugin has no deleteUserData handler');
      await def.deleteUserData({ userId }, userlessCtx);
    },
    exportUserData: async (userId) => {
      if (typeof def.exportUserData !== 'function') throw new Error('plugin has no exportUserData handler');
      return def.exportUserData({ userId }, userlessCtx);
    },
    hook: async (name, fn, ...args) => {
      const hooks = def.hooks as Record<string, Record<string, (...a: unknown[]) => unknown> | undefined> | undefined;
      const impl = hooks?.[name];
      if (!impl || typeof impl[fn] !== 'function') throw new Error(`no hook ${name}.${fn}`);
      return impl[fn](...args, ctx) as never;
    },
  });

  return { ctx, userlessCtx, calls, logs, broadcasts, emitted, notifications, scheduled: scheduledTasks, run };
}
