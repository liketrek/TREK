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
  /** The acting user's per-user settings values for ctx.settings.get (unset key → undefined). */
  userSettings?: Record<string, unknown>;
  /** The acting user's own (non-trip) data: tags, journals, collections, atlas, vacay. */
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
  /** Fire the `scheduled` handler as if a ctx.scheduler timer named `name` came due. */
  scheduled(name: string, payload?: unknown): Promise<void>;
  /** Deliver a core event to every matching `events` subscription. */
  event(name: string, payload?: { tripId?: number; entity?: string; entityId?: number; snapshot?: Record<string, unknown> }): Promise<void>;
  /** Deliver another plugin's event to every matching `subscriptions` entry. */
  pluginEvent(plugin: string, event: string, payload: unknown): Promise<void>;
  /** Fire the GDPR handlers (userless). */
  deleteUserData(userId: number): Promise<void>;
  exportUserData(userId: number): Promise<unknown>;
  /** Invoke a provider hook, e.g. hook('tripCardProvider', 'getCards', [1, 2]). */
  hook<T = unknown>(name: string, fn: string, ...args: unknown[]): Promise<T>;
}

export interface MockHost {
  ctx: PluginContext;
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
  // In-memory stores for the acting user's own (non-trip) data — seeded from opts,
  // mutated in place by the write methods (same idea as the trip fixtures).
  const visitedCountries: unknown[] = [...(opts.atlasVisited?.countries ?? [])];
  const visitedRegions: unknown[] = [...(opts.atlasVisited?.regions ?? [])];
  const bucketItems: unknown[] = [...(opts.atlasBucketList ?? [])];
  const journalEntries: unknown[] = [...(opts.journalEntries ?? [])];
  const savedPlaces: unknown[] = [];
  const vacayEntries = new Set<string>();
  const vacayHolidays = new Set<string>();
  let collabSeq = 0;
  // In-memory scheduled tasks for ctx.scheduler (upsert by name, like the real host).
  const scheduledTasks = new Map<string, { dueAt: number; everyMs?: number; payload?: unknown }>();
  // Upsert a timer, enforcing the SAME caps as the real host so a test catches a
  // plugin that exceeds them (≤100 tasks, name ≤128 chars, payload ≤8 KB JSON).
  const scheduleTask = (name: string, dueAt: number, everyMs: number | undefined, payload: unknown) => {
    if (!name || name.length > 128) throw new Error(`scheduler name is required (max 128 chars)`);
    if (JSON.stringify(payload ?? null).length > 8 * 1024) throw new Error('scheduler payload too large (max 8192 bytes)');
    if (!scheduledTasks.has(name) && scheduledTasks.size >= 100) throw new Error('too many scheduled tasks (max 100)');
    scheduledTasks.set(name, { dueAt, everyMs, payload });
  };
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
    settings: {
      // No permission gate (like the real host); undefined in a userless context so
      // plugins fall back to ctx.config, exactly as documented.
      async get(key) {
        calls.push({ method: 'settings.get', args: [key] });
        if (opts.actingUserId === undefined) return undefined;
        return opts.userSettings?.[key];
      },
    },
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
      async tx(ops) {
        need('db:own', 'db.tx');
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
        const t = assertMember(tripId, requireActingUser());
        assertEdit(t, 'canEditTrip', tripId);
        const data = (t.data ??= {}) as Record<string, unknown>;
        Object.assign(data, input);
        return data as Trip;
      },
      async create(input) {
        need('db:create:trips', 'trips.create');
        const uid = requireActingUser();
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
        const joined = !t.members.includes(userId);
        if (joined) t.members.push(userId);
        return { joined, tripId };
      },
      async removeMember(tripId, userId) {
        need('db:write:members', 'trips.removeMember');
        const t = assertMember(tripId, requireActingUser());
        const i = t.members.indexOf(userId);
        if (i >= 0) t.members.splice(i, 1);
        return { removed: i >= 0 };
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
        const t = assertMember(tripId, requireActingUser());
        const r = { id: (t.reservations?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.reservations ??= []).push(r);
        return r;
      },
      async update(tripId, reservationId, input) {
        need('db:write:reservations', 'reservations.update');
        const t = assertMember(tripId, requireActingUser());
        const r = rows(t.reservations).find((x) => x.id === reservationId);
        if (!r) throw new Error(`RESOURCE_FORBIDDEN: no reservation ${reservationId} on trip ${tripId}`);
        Object.assign(r, input);
        return r as Reservation;
      },
      async delete(tripId, reservationId) {
        need('db:write:reservations', 'reservations.delete');
        const t = assertMember(tripId, requireActingUser());
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
        const t = assertMember(tripId, requireActingUser());
        const item = { id: (t.packing?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.packing ??= []).push(item);
        return item;
      },
      async update(tripId, itemId, input) {
        need('db:write:packing', 'packing.update');
        const t = assertMember(tripId, requireActingUser());
        const item = rows(t.packing).find((x) => x.id === itemId);
        if (!item) throw new Error(`RESOURCE_FORBIDDEN: no packing item ${itemId} on trip ${tripId}`);
        Object.assign(item, input);
        return item as PackingItem;
      },
      async delete(tripId, itemId) {
        need('db:write:packing', 'packing.delete');
        const t = assertMember(tripId, requireActingUser());
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
        const t = assertMember(tripId, requireActingUser());
        const bag = { id: (t.bags?.length ?? 0) + 1, trip_id: tripId, member_ids: [] as number[], ...input };
        (t.bags ??= []).push(bag);
        return bag;
      },
      async updateBag(tripId, bagId, input) {
        need('db:write:packing', 'packing.updateBag');
        const t = assertMember(tripId, requireActingUser());
        const bag = rows(t.bags).find((x) => x.id === bagId);
        if (!bag) throw new Error(`RESOURCE_FORBIDDEN: no bag ${bagId} on trip ${tripId}`);
        Object.assign(bag, input);
        return bag;
      },
      async deleteBag(tripId, bagId) {
        need('db:write:packing', 'packing.deleteBag');
        const t = assertMember(tripId, requireActingUser());
        const list = rows((t.bags ??= []));
        const i = list.findIndex((x) => x.id === bagId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no bag ${bagId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
      async setBagMembers(tripId, bagId, userIds) {
        need('db:write:packing', 'packing.setBagMembers');
        const t = assertMember(tripId, requireActingUser());
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
        const t = assertMember(tripId, requireActingUser());
        const { content_base64, ...rest } = input;
        const file = { id: (t.files?.length ?? 0) + 1, trip_id: tripId, size: Buffer.from(content_base64 ?? '', 'base64').length, ...rest };
        (t.files ??= []).push(file);
        return file;
      },
      async createLink(tripId, fileId, linkOpts) {
        need('db:write:files', 'files.createLink');
        const t = assertMember(tripId, requireActingUser());
        const file = rows(t.files).find((x) => x.id === fileId);
        if (!file) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
        Object.assign(file, linkOpts);
        return file;
      },
      async update(tripId, fileId, input) {
        need('db:write:files', 'files.update');
        const t = assertMember(tripId, requireActingUser());
        const file = rows(t.files).find((x) => x.id === fileId);
        if (!file) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
        Object.assign(file, input);
        return file as TripFile;
      },
      async softDelete(tripId, fileId) {
        need('db:write:files', 'files.softDelete');
        const t = assertMember(tripId, requireActingUser());
        const list = rows((t.files ??= []));
        const i = list.findIndex((x) => x.id === fileId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no file ${fileId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    collab: {
      async listNotes(tripId) {
        need('db:read:collab', 'collab.listNotes');
        return assertMember(tripId, requireActingUser()).notes ?? [];
      },
      async listPolls(tripId) {
        need('db:read:collab', 'collab.listPolls');
        return assertMember(tripId, requireActingUser()).polls ?? [];
      },
      async listMessages(tripId, before) {
        need('db:read:collab', 'collab.listMessages');
        const messages = rows(assertMember(tripId, requireActingUser()).messages);
        return before === undefined ? messages : messages.filter((m) => typeof m.id === 'number' && m.id < before);
      },
      async createNote(tripId, input) {
        need('db:write:collab', 'collab.createNote');
        assertMember(tripId, requireActingUser());
        return { id: ++collabSeq, trip_id: tripId, ...input };
      },
      async createPoll(tripId, input) {
        need('db:write:collab', 'collab.createPoll');
        assertMember(tripId, requireActingUser());
        return { id: ++collabSeq, trip_id: tripId, ...input };
      },
      async votePoll(tripId, pollId, optionIndex) {
        need('db:write:collab', 'collab.votePoll');
        assertMember(tripId, requireActingUser());
        return { poll_id: pollId, option_index: optionIndex };
      },
      async createMessage(tripId, text, replyTo) {
        need('db:write:collab', 'collab.createMessage');
        assertMember(tripId, requireActingUser());
        return { id: ++collabSeq, trip_id: tripId, text, reply_to: replyTo ?? null };
      },
    },
    notify: {
      async send(input) {
        need('notify:send', 'notify.send');
        const uid = requireActingUser();
        // Match the real host exactly: a 'user' target must BE the acting user — it throws
        // rather than silently coercing, so a test can't pass on a wrong recipient that
        // production would reject; a 'trip' target is membership-checked.
        if (input.scope === 'user' && input.targetId !== uid) {
          throw new Error('RESOURCE_FORBIDDEN: a plugin may only notify the acting user');
        }
        if (input.scope === 'trip') assertMember(input.targetId, uid);
        notifications.push({ ...input });
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
        if (opts.actingUserId === undefined) return null; // userless context — nobody to act for
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
        if (ms < 60_000) throw new Error('recurring interval must be >= 60000 ms');
        scheduleTask(name, Date.now() + ms, ms, payload);
        return { scheduled: true };
      },
      async cancel(name) {
        need('jobs:run', 'scheduler.cancel');
        return { cancelled: scheduledTasks.delete(name) };
      },
    },
    weather: {
      async get() {
        need('weather:read', 'weather.get');
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
        const tag = { id: (opts.tags?.length ?? 0) + 1, ...input };
        (opts.tags ??= []).push(tag);
        return tag;
      },
      async update(tagId, input) {
        need('db:write:tags', 'tags.update');
        requireActingUser();
        const tag = rows(opts.tags).find((x) => x.id === tagId);
        if (!tag) throw new Error(`RESOURCE_FORBIDDEN: no tag ${tagId}`);
        Object.assign(tag, input);
        return tag;
      },
      async delete(tagId) {
        need('db:write:tags', 'tags.delete');
        requireActingUser();
        const list = rows((opts.tags ??= []));
        const i = list.findIndex((x) => x.id === tagId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no tag ${tagId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    todos: {
      async list(tripId) {
        need('db:read:todos', 'todos.list');
        return assertMember(tripId, requireActingUser()).todos ?? [];
      },
      async create(tripId, input) {
        need('db:write:todos', 'todos.create');
        const t = assertMember(tripId, requireActingUser());
        const todo = { id: (t.todos?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.todos ??= []).push(todo);
        return todo;
      },
      async update(tripId, todoId, input) {
        need('db:write:todos', 'todos.update');
        const t = assertMember(tripId, requireActingUser());
        const todo = rows(t.todos).find((x) => x.id === todoId);
        if (!todo) throw new Error(`RESOURCE_FORBIDDEN: no todo ${todoId} on trip ${tripId}`);
        Object.assign(todo, input);
        return todo;
      },
      async delete(tripId, todoId) {
        need('db:write:todos', 'todos.delete');
        const t = assertMember(tripId, requireActingUser());
        const list = rows((t.todos ??= []));
        const i = list.findIndex((x) => x.id === todoId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no todo ${todoId} on trip ${tripId}`);
        list.splice(i, 1);
        return { deleted: true };
      },
    },
    journal: {
      async listMine() {
        need('db:read:journal', 'journal.listMine');
        requireActingUser();
        return opts.journals ?? [];
      },
      async getEntries(journeyId) {
        need('db:read:journal', 'journal.getEntries');
        requireActingUser();
        return rows(journalEntries).filter((x) => x.journey_id === journeyId);
      },
      async createEntry(journeyId, input) {
        need('db:write:journal', 'journal.createEntry');
        requireActingUser();
        const entry = { id: journalEntries.length + 1, journey_id: journeyId, ...input };
        journalEntries.push(entry);
        return entry;
      },
      async createJourney(input) {
        need('db:write:journal', 'journal.createJourney');
        requireActingUser();
        return { id: (opts.journals?.length ?? 0) + 1, ...input };
      },
      async deleteJourney(journeyId) {
        need('db:write:journal', 'journal.deleteJourney');
        requireActingUser();
        return { deleted: journeyId > 0 };
      },
      async updateEntry(entryId, input) {
        need('db:write:journal', 'journal.updateEntry');
        requireActingUser();
        const entry = rows(journalEntries).find((x) => x.id === entryId);
        if (!entry) throw new Error(`RESOURCE_FORBIDDEN: no journal entry ${entryId}`);
        Object.assign(entry, input);
        return entry;
      },
      async deleteEntry(entryId) {
        need('db:write:journal', 'journal.deleteEntry');
        requireActingUser();
        const i = rows(journalEntries).findIndex((x) => x.id === entryId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no journal entry ${entryId}`);
        journalEntries.splice(i, 1);
        return { deleted: true };
      },
    },
    atlas: {
      async visited() {
        need('db:read:atlas', 'atlas.visited');
        requireActingUser();
        return { countries: visitedCountries, regions: visitedRegions };
      },
      async bucketList() {
        need('db:read:atlas', 'atlas.bucketList');
        requireActingUser();
        return bucketItems;
      },
      async markCountry(code) {
        need('db:write:atlas', 'atlas.markCountry');
        requireActingUser();
        if (!visitedCountries.includes(code)) visitedCountries.push(code);
        return { code };
      },
      async unmarkCountry(code) {
        need('db:write:atlas', 'atlas.unmarkCountry');
        requireActingUser();
        const i = visitedCountries.indexOf(code);
        if (i >= 0) visitedCountries.splice(i, 1);
        return { code };
      },
      async markRegion(regionCode, countryCode, regionName) {
        need('db:write:atlas', 'atlas.markRegion');
        requireActingUser();
        const region = { region_code: regionCode, country_code: countryCode, region_name: regionName ?? null };
        visitedRegions.push(region);
        return region;
      },
      async unmarkRegion(regionCode) {
        need('db:write:atlas', 'atlas.unmarkRegion');
        requireActingUser();
        const i = rows(visitedRegions).findIndex((x) => x.region_code === regionCode);
        if (i >= 0) visitedRegions.splice(i, 1);
        return { region_code: regionCode };
      },
      async createBucketItem(input) {
        need('db:write:atlas', 'atlas.createBucketItem');
        requireActingUser();
        const item = { id: bucketItems.length + 1, ...input };
        bucketItems.push(item);
        return item;
      },
      async deleteBucketItem(itemId) {
        need('db:write:atlas', 'atlas.deleteBucketItem');
        requireActingUser();
        const i = rows(bucketItems).findIndex((x) => x.id === itemId);
        if (i < 0) throw new Error(`RESOURCE_FORBIDDEN: no bucket item ${itemId}`);
        bucketItems.splice(i, 1);
        return { deleted: true };
      },
    },
    vacay: {
      async mine() {
        need('db:read:vacay', 'vacay.mine');
        requireActingUser();
        return opts.vacayPlan ?? null;
      },
      async toggleEntry(date) {
        need('db:write:vacay', 'vacay.toggleEntry');
        requireActingUser();
        if (vacayEntries.has(date)) { vacayEntries.delete(date); return { action: 'removed' }; }
        vacayEntries.add(date);
        return { action: 'added' };
      },
      async toggleCompanyHoliday(date) {
        need('db:write:vacay', 'vacay.toggleCompanyHoliday');
        requireActingUser();
        if (vacayHolidays.has(date)) { vacayHolidays.delete(date); return { action: 'removed' }; }
        vacayHolidays.add(date);
        return { action: 'added' };
      },
    },
    collections: {
      async listMine() {
        need('db:read:collections', 'collections.listMine');
        requireActingUser();
        return opts.collections ?? [];
      },
      async get(id) {
        need('db:read:collections', 'collections.get');
        requireActingUser();
        const c = rows(opts.collections).find((x) => x.id === id);
        if (!c) throw new Error(`RESOURCE_FORBIDDEN: no collection ${id}`);
        return c;
      },
      async create(input) {
        need('db:write:collections', 'collections.create');
        requireActingUser();
        const c = { id: (opts.collections?.length ?? 0) + 1, ...input };
        (opts.collections ??= []).push(c);
        return c;
      },
      async update(id, input) {
        need('db:write:collections', 'collections.update');
        requireActingUser();
        const c = rows(opts.collections).find((x) => x.id === id);
        if (!c) throw new Error(`RESOURCE_FORBIDDEN: no collection ${id}`);
        Object.assign(c, input);
        return c;
      },
      async savePlace(input) {
        need('db:write:collections', 'collections.savePlace');
        requireActingUser();
        const place = { id: savedPlaces.length + 1, ...input };
        savedPlaces.push(place);
        return place;
      },
      async copyToTrip(input) {
        need('db:write:collections', 'collections.copyToTrip');
        requireActingUser();
        return { copied: true, ...input };
      },
      async deletePlace(placeId) {
        need('db:write:collections', 'collections.deletePlace');
        requireActingUser();
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
        const t = assertMember(tripId, requireActingUser());
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
      await j.handler(ctx);
    },
    scheduled: async (name, payload) => {
      if (typeof def.scheduled !== 'function') throw new Error('plugin has no scheduled handler');
      await def.scheduled({ name, payload }, ctx);
    },
    event: async (name, payload) => {
      for (const s of def.events ?? []) {
        if (s.on === name || s.on === '*') {
          await s.handler({ event: name, tripId: payload?.tripId ?? 0, entity: payload?.entity, entityId: payload?.entityId, snapshot: payload?.snapshot }, ctx);
        }
      }
    },
    pluginEvent: async (plugin, event, payload) => {
      for (const s of def.subscriptions ?? []) {
        if (s.plugin === plugin && s.event === event) await s.handler(payload, ctx);
      }
    },
    deleteUserData: async (userId) => {
      if (typeof def.deleteUserData !== 'function') throw new Error('plugin has no deleteUserData handler');
      await def.deleteUserData({ userId }, ctx);
    },
    exportUserData: async (userId) => {
      if (typeof def.exportUserData !== 'function') throw new Error('plugin has no exportUserData handler');
      return def.exportUserData({ userId }, ctx);
    },
    hook: async (name, fn, ...args) => {
      const hooks = def.hooks as Record<string, Record<string, (...a: unknown[]) => unknown> | undefined> | undefined;
      const impl = hooks?.[name];
      if (!impl || typeof impl[fn] !== 'function') throw new Error(`no hook ${name}.${fn}`);
      return impl[fn](...args, ctx) as never;
    },
  });

  return { ctx, calls, logs, broadcasts, emitted, notifications, scheduled: scheduledTasks, run };
}
