/**
 * The plugin surface that belongs to no domain: the plugin's own sqlite (DbRpc), its
 * namespaced entity metadata (MetaRpc) and the host-mediated calls (HostSurfaceRpc —
 * user lookup, broadcasts, notifications, LLM, OAuth, scheduler).
 *
 * These cases used to live in plugin-host-deps.factory.test.ts, which tested the same
 * behaviour through a 26-argument wiring sheet. Same requests, same expected codes;
 * what changed is that they now run against three decorated classes and a real
 * in-memory core DB, and that the host is built by the production factory.
 */
import { db as mockDb } from '../../../src/db/database';
import type { DayAccommodationsRepository } from '../../../src/db/repositories/DayAccommodations.repository';
import type { DaysRepository } from '../../../src/db/repositories/Days.repository';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';
import type { PluginCapabilityAuditRepository } from '../../../src/db/repositories/PluginCapabilityAudit.repository';
import type { PluginEntityMetadataRepository } from '../../../src/db/repositories/PluginEntityMetadata.repository';
import type { PluginScheduledTasksRepository } from '../../../src/db/repositories/PluginScheduledTasks.repository';
import type { ReservationsRepository } from '../../../src/db/repositories/Reservations.repository';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { PluginGuards } from '../../../src/nest-rpc/plugin-guards.service';
import { PluginRpcRegistryService } from '../../../src/nest-rpc/rpc-kit/registry.service';
import { createTestPluginRegistry } from '../../../src/nest-rpc/rpc-kit/testing';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { UnreadableLlmResponse } from '../../../src/nest/llm-parse/clients/openai-compatible.client';
import type { LlmConfigResolver } from '../../../src/nest/llm-parse/llm-config.resolver';
import type { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { verifyChain } from '../../../src/nest/plugins/host/plugin-audit';
import { getPluginDataDb, closePluginDataDb } from '../../../src/nest/plugins/host/plugin-host-state';
import { PluginRpcHostFactory, type PluginCallRouter } from '../../../src/nest/plugins/host/plugin-rpc-host.factory';
import { DbRpc } from '../../../src/nest/plugins/host/rpc/db.rpc';
import { HostSurfaceRpc } from '../../../src/nest/plugins/host/rpc/host-surface.rpc';
import { MetaRpc } from '../../../src/nest/plugins/host/rpc/meta.rpc';
import type { PluginOAuthService } from '../../../src/nest/plugins/oauth/plugin-oauth.service';
import type { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import type { RpcError, RpcResponse } from '../../../src/nest/plugins/protocol/envelope';
import { FakeRealtimeService } from '../../helpers/fake-realtime';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

// A real in-memory core db, so the metadata SQL and the entity->trip resolution run
// for real. Trip 1 is owned by user 5; user 6 is a member; user 9 shares nothing.
vi.mock('../../../src/db/database', () => {
  const Database = require('better-sqlite3');
  const d = new Database(':memory:');
  d.exec(`
    CREATE TABLE trips (id INTEGER PRIMARY KEY, user_id INTEGER);
    CREATE TABLE places (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE days (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE reservations (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE day_accommodations (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT, username TEXT, display_name TEXT, avatar TEXT, email TEXT);
    CREATE TABLE trip_members (trip_id INTEGER, user_id INTEGER);
    CREATE TABLE plugin_entity_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, entity_type TEXT, entity_id INTEGER, key TEXT, value TEXT, updated_at TEXT, UNIQUE(plugin_id, entity_type, entity_id, key));
    CREATE TABLE plugin_capability_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, acting_user_id INTEGER, method TEXT, resource TEXT, code TEXT, ts TEXT, prev_hash TEXT, hash TEXT);
    CREATE TABLE plugin_scheduled_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT NOT NULL, name TEXT NOT NULL, due_at INTEGER NOT NULL, payload TEXT NOT NULL DEFAULT 'null', every_ms INTEGER, created_at TEXT DEFAULT (datetime('now')), UNIQUE(plugin_id, name));
  `);
  d.prepare('INSERT INTO trips (id, user_id) VALUES (1, 5)').run();
  d.prepare('INSERT INTO places (id, trip_id) VALUES (7, 1)').run();
  d.prepare('INSERT INTO days (id, trip_id) VALUES (3, 1)').run();
  d.prepare('INSERT INTO reservations (id, trip_id) VALUES (40, 1)').run();
  d.prepare('INSERT INTO day_accommodations (id, trip_id) VALUES (11, 1)').run();
  d.prepare("INSERT INTO users (id, role, username, display_name) VALUES (5, 'trip_owner', 'owner', 'Owner')").run();
  d.prepare("INSERT INTO users (id, role, username, display_name) VALUES (6, 'user', 'ada', 'Ada')").run();
  d.prepare("INSERT INTO users (id, role, username, display_name) VALUES (9, 'user', 'eve', 'Eve')").run();
  d.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (1, 6)').run();
  return {
    db: d,
    canAccessTrip: (tripId: number, userId: number) =>
      tripId === 1 && (userId === 5 || userId === 6) ? { id: 1, user_id: 5 } : undefined,
  };
});

const notifySend = vi.fn(async () => undefined);
const { llmExtract } = vi.hoisted(() => ({
  llmExtract: vi.fn(async (input: { text?: string }) => [{ text: `answer:${input.text ?? ''}` }]),
}));
vi.mock('../../../src/nest/llm-parse/llm-client.factory', () => ({
  createLlmClient: vi.fn(() => ({ extract: llmExtract })),
}));

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;
const broadcastToUser = realtime.broadcastToUserMock;

// Typed from the real method rather than from the always-true body below, so a case that
// swaps in an implementation reading the action key (HOSTRPC-015) still type-checks.
const checkPermission = vi.fn<PermissionsService['checkPermission']>(() => Promise.resolve(true));
const permissions = { checkPermission } as unknown as PermissionsService;
const addons = { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService;
const notifications = { send: notifySend } as unknown as NotificationsService;
// user 7 has no provider configured; everyone else resolves to a stub config.
const llmConfig = {
  resolve: vi.fn((uid: number) =>
    uid === 7 ? null : { provider: 'openai', model: 'gpt-x', baseUrl: undefined, apiKey: 'sekret' },
  ),
} as unknown as LlmConfigResolver;
const oauth = {
  async getAccessToken(_pid: string, uid: number) {
    return uid === 5 ? 'tok-5' : null;
  },
} as unknown as PluginOAuthService;

// The per-user settings reads are stubbed rather than seeded: this suite is about the
// RPC surface, and plugin-user-settings.test.ts already covers the encryption round-trip.
const userSettings = {
  readOne: vi.fn((_pid: string, uid: number, key: string) => (uid === 5 && key === 'apiKey' ? 'k-5' : undefined)),
} as unknown as PluginUserSettingsService;

// Plan 3j Task 3: `budgetFor`/`appendAudit` now take `PluginCapabilityAuditRepository`,
// not a raw connection. `plugin_capability_audit`'s hand-rolled table above (unlike
// `trips`/`users`) matches the real entity's full column set, so a real MikroORM
// repository would work here too — but every other cross-cutting dependency in this
// file (`canAccessTrip`, `getRole`) is a synchronous stub against this same `mockDb`
// for the same reason (no top-level await in this file), so this stays consistent:
// real raw SQL against `mockDb`, wrapped in the repository's own method shapes.
// HOSTRPC-031 seeds real rows through `mockDb.prepare(...)` and reads them back
// through `budgetSeed`, so this must be backed by the real table, not a canned stub.
const pluginAuditRepo = {
  async budgetSeed(pluginId: string, since: string) {
    return (mockDb as unknown as { prepare(s: string): { all(...a: unknown[]): unknown[] } })
      .prepare(
        "SELECT method, COUNT(*) AS n FROM plugin_capability_audit WHERE plugin_id = ? AND code = 'ok' AND ts >= ? AND method IN ('ai.complete','ai.extract','notify.send') GROUP BY method",
      )
      .all(pluginId, since) as Array<{ method: string; n: number }>;
  },
  async lastHash(pluginId: string) {
    const row = (mockDb as unknown as { prepare(s: string): { get(...a: unknown[]): unknown } })
      .prepare('SELECT hash FROM plugin_capability_audit WHERE plugin_id = ? ORDER BY id DESC LIMIT 1')
      .get(pluginId) as { hash: string } | undefined;
    return row?.hash ?? null;
  },
  async insertRow(entry: {
    plugin_id: string;
    acting_user_id: number | null;
    method: string;
    resource: string | null;
    code: string;
    ts: string;
    prev_hash: string | null;
    hash: string;
  }) {
    (mockDb as unknown as { prepare(s: string): { run(...a: unknown[]): unknown } })
      .prepare(
        'INSERT INTO plugin_capability_audit (plugin_id, acting_user_id, method, resource, code, ts, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?)',
      )
      .run(
        entry.plugin_id,
        entry.acting_user_id,
        entry.method,
        entry.resource,
        entry.code,
        entry.ts,
        entry.prev_hash,
        entry.hash,
      );
  },
  async pruneKeepingNewest() {
    // Not exercised in this suite (PRUNE_EVERY = 500 appends/plugin) — a no-op stub.
  },
} as unknown as PluginCapabilityAuditRepository;

/**
 * Plan 3j Task 5: `MetaRpc`/`HostSurfaceRpc`'s own repository conversions
 * (MR#/HR#). Same reasoning as `pluginAuditRepo` above — this file's
 * hand-trimmed `:memory:` schema (no top-level await here) means a real
 * MikroORM repository isn't reachable, so every converted method is
 * reproduced as real raw SQL against `mockDb`, wrapped in the repository's
 * own method shape, rather than a canned stub — HOSTRPC-014/028/029/030
 * read the real table state back out through `mockDb.prepare(...)`
 * directly, so this HAS to be the real table.
 */
type RawDb = {
  prepare(sql: string): {
    get(...a: unknown[]): unknown;
    all(...a: unknown[]): unknown[];
    run(...a: unknown[]): { changes: number };
  };
};
const raw = mockDb as unknown as RawDb;

const tripsRepo = {
  // Plan 4 Task 2 — PluginGuards' own canAccessTrip delegate is now this
  // repository's findAccessible directly (same access rule the old
  // `db/database` mock factory above encoded: trip 1 belongs to user 5,
  // user 6 is a member).
  async findAccessible(tripId: number | string, userId: number) {
    return Number(tripId) === 1 && (userId === 5 || userId === 6) ? { id: 1, user_id: 5, currency: null } : undefined;
  },
  async sharesTripWith(userIdA: number, userIdB: number) {
    return !!raw
      .prepare(
        `SELECT 1 FROM trips t
           LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
           LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
          WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
            AND (t.user_id = ? OR m2.user_id IS NOT NULL)
          LIMIT 1`,
      )
      .get(userIdA, userIdB, userIdA, userIdB);
  },
  async existsById(id: number) {
    return !!raw.prepare('SELECT id FROM trips WHERE id = ?').get(id);
  },
} as unknown as TripsRepository;

const placesRepo = {
  async findTripId(id: number) {
    return (raw.prepare('SELECT trip_id FROM places WHERE id = ?').get(id) as { trip_id: number } | undefined)?.trip_id;
  },
} as unknown as PlacesRepository;

const daysRepo = {
  async findTripId(id: number) {
    return (raw.prepare('SELECT trip_id FROM days WHERE id = ?').get(id) as { trip_id: number } | undefined)?.trip_id;
  },
} as unknown as DaysRepository;

const reservationsRepo = {
  async findTripId(id: number) {
    return (raw.prepare('SELECT trip_id FROM reservations WHERE id = ?').get(id) as { trip_id: number } | undefined)
      ?.trip_id;
  },
} as unknown as ReservationsRepository;

const dayAccommodationsRepo = {
  async getTripId(id: number) {
    return (
      raw.prepare('SELECT trip_id FROM day_accommodations WHERE id = ?').get(id) as { trip_id: number } | undefined
    )?.trip_id;
  },
} as unknown as DayAccommodationsRepository;

const metaRepo = {
  async findValue(pluginId: string, entityType: string, entityId: number, key: string) {
    const row = raw
      .prepare('SELECT value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
      .get(pluginId, entityType, entityId, key) as { value: string } | undefined;
    return row?.value ?? null;
  },
  async countForEntity(pluginId: string, entityType: string, entityId: number) {
    return (
      raw
        .prepare('SELECT COUNT(*) AS n FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=?')
        .get(pluginId, entityType, entityId) as { n: number }
    ).n;
  },
  async upsertValue(pluginId: string, entityType: string, entityId: number, key: string, value: string) {
    raw
      .prepare(
        `INSERT INTO plugin_entity_metadata (plugin_id, entity_type, entity_id, key, value, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(plugin_id, entity_type, entity_id, key)
             DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run(pluginId, entityType, entityId, key, value);
  },
  async listForEntity(pluginId: string, entityType: string, entityId: number) {
    return raw
      .prepare(
        'SELECT key, value FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? ORDER BY key',
      )
      .all(pluginId, entityType, entityId) as Array<{ key: string; value: string }>;
  },
  async deleteValue(pluginId: string, entityType: string, entityId: number, key: string) {
    return (
      raw
        .prepare('DELETE FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?')
        .run(pluginId, entityType, entityId, key).changes > 0
    );
  },
  // Plan 3j Task 7 fix (must-land 2) — `meta.rpc.ts#set` now calls this ONE method
  // instead of `findValue`+`countForEntity`+`upsertValue` separately. One synchronous
  // better-sqlite3 statement (no `await` gap between the cap check and the write),
  // the same atomicity property the real `PluginEntityMetadataRepository
  // .upsertValueCapped` gets from `getEntityManager().transactional`.
  async upsertValueCapped(
    pluginId: string,
    entityType: string,
    entityId: number,
    key: string,
    value: string,
    maxKeys: number,
  ) {
    const result = raw
      .prepare(
        `INSERT INTO plugin_entity_metadata (plugin_id, entity_type, entity_id, key, value, updated_at)
             SELECT ?, ?, ?, ?, ?, datetime('now')
             WHERE EXISTS (SELECT 1 FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=? AND key=?)
                OR (SELECT COUNT(*) FROM plugin_entity_metadata WHERE plugin_id=? AND entity_type=? AND entity_id=?) < ?
             ON CONFLICT(plugin_id, entity_type, entity_id, key)
             DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run(
        pluginId,
        entityType,
        entityId,
        key,
        value,
        pluginId,
        entityType,
        entityId,
        key,
        pluginId,
        entityType,
        entityId,
        maxKeys,
      );
    return result.changes > 0;
  },
} as unknown as PluginEntityMetadataRepository;

const scheduledTasksRepo = {
  async existsForPluginAndName(pluginId: string, name: string) {
    return !!raw.prepare('SELECT id FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?').get(pluginId, name);
  },
  async countForPlugin(pluginId: string) {
    return (
      raw.prepare('SELECT COUNT(*) AS c FROM plugin_scheduled_tasks WHERE plugin_id = ?').get(pluginId) as { c: number }
    ).c;
  },
  async upsertTask(input: {
    plugin_id: string;
    name: string;
    due_at: number;
    payload: string;
    every_ms: number | null;
  }) {
    raw
      .prepare(
        `INSERT INTO plugin_scheduled_tasks (plugin_id, name, due_at, payload, every_ms) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (plugin_id, name) DO UPDATE SET due_at = excluded.due_at, payload = excluded.payload, every_ms = excluded.every_ms`,
      )
      .run(input.plugin_id, input.name, input.due_at, input.payload, input.every_ms);
  },
  async deleteByPluginAndName(pluginId: string, name: string) {
    return (
      raw.prepare('DELETE FROM plugin_scheduled_tasks WHERE plugin_id = ? AND name = ?').run(pluginId, name).changes > 0
    );
  },
  // Plan 3j Task 7 fix (must-land 3) — `host-surface.rpc.ts#schedulerSet` now calls
  // this ONE method instead of `existsForPluginAndName`+`countForPlugin`+`upsertTask`
  // separately. Same one-statement atomicity shape as `metaRepo.upsertValueCapped`
  // above, mirroring the real `PluginScheduledTasksRepository.upsertTaskCapped`.
  async upsertTaskCapped(
    input: { plugin_id: string; name: string; due_at: number; payload: string; every_ms: number | null },
    maxTasks: number,
  ) {
    const result = raw
      .prepare(
        `INSERT INTO plugin_scheduled_tasks (plugin_id, name, due_at, payload, every_ms)
             SELECT ?, ?, ?, ?, ?
             WHERE EXISTS (SELECT 1 FROM plugin_scheduled_tasks WHERE plugin_id=? AND name=?)
                OR (SELECT COUNT(*) FROM plugin_scheduled_tasks WHERE plugin_id=?) < ?
             ON CONFLICT (plugin_id, name) DO UPDATE SET due_at = excluded.due_at, payload = excluded.payload, every_ms = excluded.every_ms`,
      )
      .run(
        input.plugin_id,
        input.name,
        input.due_at,
        input.payload,
        input.every_ms,
        input.plugin_id,
        input.name,
        input.plugin_id,
        maxTasks,
      );
    return result.changes > 0;
  },
} as unknown as PluginScheduledTasksRepository;

// Plan 3j Task 1: PluginGuards' own role lookup (PG3/PG4) now goes through
// UsersRepository.getRole, not `dbs.prepare(...)`. Same reasoning as the
// canAccessTrip spy above — a real UsersRepository would need a real
// MikroORM over this file's hand-trimmed `:memory:` schema (async init, no
// top-level await here) for no benefit: checkPermission is a blanket stub
// in this file, so no case depends on which role value flows through it.
// Stubbed against the exact seeded rows (users.ts INSERTs above) so it stays
// accurate if a future case ever does start asserting on the role argument.
const seededRoles: Record<number, string> = { 5: 'trip_owner', 6: 'user', 9: 'user' };
const usersRepo = {
  getRole: vi.fn(async (id: number) => seededRoles[id] ?? null),
  // HR1 (Plan 3j Task 5) — same "real SQL against mockDb" reasoning as the
  // repository stubs above; HOSTRPC-019 asserts the exact returned shape.
  async findPublicIdentity(id: number) {
    return (
      (raw.prepare('SELECT id, username, display_name, avatar FROM users WHERE id = ?').get(id) as
        { id: number; username: string; display_name: string | null; avatar: string | null } | undefined) ?? null
    );
  },
} as unknown as UsersRepository;
// Plan 4 Task 2 — PluginGuards'/MetaRpc's/HostSurfaceRpc's own DatabaseService
// params are gone: canAccessTrip now reads through the TripsRepository each
// already injects (`tripsRepo` above, findAccessible-only).
const guards = new PluginGuards(tripsRepo, permissions, addons, usersRepo);
const registry = createTestPluginRegistry([
  new DbRpc(userSettings),
  new MetaRpc(guards, metaRepo, tripsRepo, placesRepo, daysRepo, reservationsRepo, dayAccommodationsRepo),
  new HostSurfaceRpc(
    realtime,
    notifications,
    llmConfig,
    oauth,
    guards,
    pluginAuditRepo,
    usersRepo,
    tripsRepo,
    scheduledTasksRepo,
  ),
]);
const factory = new PluginRpcHostFactory(pluginAuditRepo, registry as unknown as PluginRpcRegistryService);
const stubRouter: PluginCallRouter = { callPlugin: async () => undefined, emitPluginEvent: async () => {} };
const makeHost = (id: string, ...perms: string[]) => factory.create(id, new Set(perms), stubRouter);
/**
 * A response read loosely, on purpose.
 *
 * `RpcResponse & Partial<RpcError>` collapsed to `never`: both carry `ok`, one
 * as the literal `true` and the other as `false`, so the intersection has no
 * inhabitant and every `.ok` / `.result` / `.error` below was an error the
 * build never saw, because tests/ sits outside tsconfig's include. The union
 * would be the honest runtime type, but `dispatch` here is asserted on from
 * both sides in the same expression, so this widens instead of narrowing.
 */
type Res = Pick<RpcResponse, 'k' | 'id'> & {
  ok: boolean;
  result?: unknown;
  error?: RpcError['error'];
};
// The acting user is a REST arg, not a defaulted one: an explicit `undefined` has to
// stay undefined (that is the userless-context case), and a default parameter would
// quietly turn it back into user 5.
const call = (
  host: ReturnType<typeof makeHost>,
  method: string,
  params: Record<string, unknown> = {},
  ...uid: (number | undefined)[]
): Promise<Res> => host.dispatch({ k: 'req', id: 'x', method, params }, uid.length ? uid[0] : 5) as Promise<Res>;

let tmp: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-hostrpc-'));
  process.env.TREK_PLUGINS_DATA_DIR = tmp;
});
afterAll(() => {
  closePluginDataDb('wired');
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("DbRpc — the plugin's own sqlite", () => {
  it('HOSTRPC-001 caches one data db per plugin id', () => {
    expect(getPluginDataDb('wired')).toBe(getPluginDataDb('wired'));
  });

  it('HOSTRPC-002 a granted db:own call runs against the plugin db', async () => {
    const host = makeHost('wired', 'db:own');
    expect((await call(host, 'db.migrate', { id: '001', sql: 'CREATE TABLE t (v TEXT)' })).ok).toBe(true);
    expect((await call(host, 'db.exec', { sql: "INSERT INTO t (v) VALUES ('a')" })).ok).toBe(true);
    const rows = await call(host, 'db.query', { sql: 'SELECT v FROM t' });
    expect(rows.result).toEqual([{ v: 'a' }]);
  });

  it('HOSTRPC-003 db.tx dispatches an atomic batch; malformed ops are BAD_PARAMS', async () => {
    const host = makeHost('wtx', 'db:own');
    await call(host, 'db.migrate', { id: '001', sql: 'CREATE TABLE kv (k TEXT, n INTEGER)' });
    const res = await call(host, 'db.tx', {
      ops: [
        { sql: 'INSERT INTO kv (k, n) VALUES (?, ?)', args: ['a', 1] },
        { sql: 'SELECT n FROM kv WHERE k = ?', args: ['a'] },
      ],
    });
    expect((res.result as { results: unknown[] }).results).toEqual([{ changes: 1 }, { rows: [{ n: 1 }] }]);
    expect((await call(host, 'db.tx', { ops: [{ sql: 42 }] })).error?.code).toBe('BAD_PARAMS');
    closePluginDataDb('wtx');
  });

  it('HOSTRPC-004 without db:own not one of the four is reachable', async () => {
    const host = makeHost('wnogrant');
    for (const method of ['db.query', 'db.exec', 'db.migrate', 'db.tx']) {
      expect((await call(host, method, { sql: 'SELECT 1', id: '1', ops: [] })).error?.code).toBe('PERMISSION_DENIED');
    }
  });

  it("HOSTRPC-005 two plugins never see each other's tables", async () => {
    // The regression this guards: DbRpc is a SINGLETON that serves every plugin, so a
    // handle captured in a field or a closure would hand plugin B the rows of whichever
    // plugin happened to construct it first.
    const a = makeHost('tenant-a', 'db:own');
    const b = makeHost('tenant-b', 'db:own');
    await call(a, 'db.migrate', { id: '001', sql: 'CREATE TABLE secrets (v TEXT)' });
    await call(a, 'db.exec', { sql: "INSERT INTO secrets (v) VALUES ('a-only')" });
    const leaked = await call(b, 'db.query', { sql: 'SELECT v FROM secrets' });
    expect(leaked.ok).toBe(false);
    expect(leaked.error?.code).toBe('HOST_ERROR');
    expect(leaked.error?.message).toMatch(/no such table/i);
    // …and plugin A still reads its own row afterwards.
    expect((await call(a, 'db.query', { sql: 'SELECT v FROM secrets' })).result).toEqual([{ v: 'a-only' }]);
    closePluginDataDb('tenant-a');
    closePluginDataDb('tenant-b');
  });

  it('HOSTRPC-006 a handle closed WITHOUT eviction is recreated, not reused dead', () => {
    const a = getPluginDataDb('closedcache');
    expect(a.isOpen()).toBe(true);
    // The supervisor's dispose() path: close the handle but leave it cached.
    a.close();
    const b = getPluginDataDb('closedcache');
    expect(b).not.toBe(a);
    expect(b.isOpen()).toBe(true);
    closePluginDataDb('closedcache');
  });

  it('HOSTRPC-007 closePluginDataDb drops the cached handle', () => {
    const a = getPluginDataDb('transient');
    closePluginDataDb('transient');
    const b = getPluginDataDb('transient');
    expect(a).not.toBe(b);
    closePluginDataDb('transient');
  });
});

describe('DbRpc — the unconditional three', () => {
  afterAll(() => closePluginDataDb('open3'));

  it("HOSTRPC-008 plugins.call and events.emit route through the host's own router", async () => {
    const calls: unknown[] = [];
    const emits: unknown[] = [];
    const router: PluginCallRouter = {
      callPlugin: async (callerId, targetId, fn, args, uid) => {
        calls.push({ callerId, targetId, fn, args, uid });
        return { echoed: true };
      },
      emitPluginEvent: async (sourceId, event, payload) => {
        emits.push({ sourceId, event, payload });
      },
    };
    // No permission granted at all — these two are registered unconditionally.
    const host = factory.create('open3', new Set(), router);
    const res = await call(host, 'plugins.call', { targetId: 'other', fn: 'sum', args: [1, 2] }, 5);
    expect(res.result).toEqual({ echoed: true });
    // The caller id comes from the HOST, never from params, which is what lets the
    // router authorise the dependency edge.
    expect(calls).toEqual([{ callerId: 'open3', targetId: 'other', fn: 'sum', args: [1, 2], uid: 5 }]);
    expect((await call(host, 'events.emit', { event: 'ping', payload: { a: 1 } }, 5)).result).toEqual({ ok: true });
    expect(emits).toEqual([{ sourceId: 'open3', event: 'ping', payload: { a: 1 } }]);
  });

  it("HOSTRPC-009 settings.get returns the acting user's decrypted value; userless yields undefined", async () => {
    const host = makeHost('open3');
    expect((await call(host, 'settings.get', { key: 'apiKey' }, 5)).result).toEqual({ value: 'k-5' });
    expect((await call(host, 'settings.get', { key: 'apiKey' }, undefined)).result).toEqual({ value: undefined });
    // Another user's value is simply not there — the read is per acting user.
    expect((await call(host, 'settings.get', { key: 'apiKey' }, 6)).result).toEqual({ value: undefined });
  });

  it('HOSTRPC-010 a missing key is BAD_PARAMS, not a silent undefined', async () => {
    expect((await call(makeHost('open3'), 'settings.get', {}, 5)).error?.code).toBe('BAD_PARAMS');
  });
});

describe('MetaRpc — namespaced entity metadata', () => {
  beforeEach(() => {
    checkPermission.mockReset();
    checkPermission.mockResolvedValue(true);
  });
  afterAll(() => closePluginDataDb('meta'));

  it('HOSTRPC-011 round-trips and enforces the key/value/access limits', async () => {
    const host = makeHost('meta', 'db:meta');
    expect((await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k', value: { a: 1 } })).ok).toBe(
      true,
    );
    expect((await call(host, 'meta.get', { entityType: 'trip', entityId: 1, key: 'k' })).result).toEqual({ a: 1 });
    expect((await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k', value: 2 })).ok).toBe(true); // upsert
    expect((await call(host, 'meta.list', { entityType: 'place', entityId: 7 })).ok).toBe(true); // place -> trip 1
    expect((await call(host, 'meta.delete', { entityType: 'trip', entityId: 1, key: 'k' })).result).toEqual({
      deleted: true,
    });
    expect(
      (await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'x'.repeat(300), value: 1 })).error?.code,
    ).toBe('BAD_PARAMS');
    expect(
      (await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'big', value: 'y'.repeat(70000) })).error
        ?.code,
    ).toBe('BAD_PARAMS');
    expect((await call(host, 'meta.set', { entityType: 'trip', entityId: 2, key: 'k', value: 1 })).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
  });

  it('HOSTRPC-012 an unreadable value comes back as null rather than throwing', async () => {
    const host = makeHost('meta', 'db:meta');
    await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'corrupt', value: 1 });
    (mockDb as unknown as { prepare(sql: string): { run(...a: unknown[]): unknown } })
      .prepare("UPDATE plugin_entity_metadata SET value='{not json' WHERE plugin_id='meta' AND key='corrupt'")
      .run();
    expect((await call(host, 'meta.get', { entityType: 'trip', entityId: 1, key: 'corrupt' })).result).toBeNull();
    const listed = (await call(host, 'meta.list', { entityType: 'trip', entityId: 1 })).result as Record<
      string,
      unknown
    >;
    expect(listed.corrupt).toBeNull();
    await call(host, 'meta.delete', { entityType: 'trip', entityId: 1, key: 'corrupt' });
  });

  it('HOSTRPC-013a an omitted value is stored as null, not as the string "undefined"', async () => {
    const host = makeHost('meta', 'db:meta');
    const set = await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'blank' });
    expect(set.result).toEqual({ key: 'blank', value: null });
    expect((await call(host, 'meta.get', { entityType: 'trip', entityId: 1, key: 'blank' })).result).toBeNull();
    await call(host, 'meta.delete', { entityType: 'trip', entityId: 1, key: 'blank' });
  });

  it('HOSTRPC-013 a key that was never set reads as null, and deleting it reports false', async () => {
    const host = makeHost('meta', 'db:meta');
    expect((await call(host, 'meta.get', { entityType: 'trip', entityId: 1, key: 'ghost' })).result).toBeNull();
    expect((await call(host, 'meta.delete', { entityType: 'trip', entityId: 1, key: 'ghost' })).result).toEqual({
      deleted: false,
    });
  });

  it('HOSTRPC-014 the per-entity key quota is enforced on new keys only', async () => {
    const host = makeHost('metaquota', 'db:meta');
    for (let i = 0; i < 100; i++) {
      expect((await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: `k${i}`, value: i })).ok).toBe(true);
    }
    const overflow = await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k100', value: 1 });
    expect(overflow.error?.code).toBe('BAD_PARAMS');
    expect(overflow.error?.message).toMatch(/too many metadata keys/);
    // An existing key still updates — the quota counts keys, not writes.
    expect((await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k0', value: 'again' })).ok).toBe(
      true,
    );
    closePluginDataDb('metaquota');
  });

  it('HOSTRPC-015 every entity type resolves its own edit action, and a read-only member is refused a write', async () => {
    const host = makeHost('meta', 'db:meta');
    const seen: string[] = [];
    checkPermission.mockImplementation((action) => {
      seen.push(action);
      return Promise.resolve(true);
    });
    for (const [entityType, entityId] of [
      ['trip', 1],
      ['place', 7],
      ['day', 3],
      ['reservation', 40],
      ['accommodation', 11],
    ] as const) {
      expect((await call(host, 'meta.set', { entityType, entityId, key: 'k', value: 1 })).ok).toBe(true);
    }
    // Accommodations deliberately ride on day_edit, like the accommodation write path.
    expect(seen).toEqual(['trip_edit', 'place_edit', 'day_edit', 'reservation_edit', 'day_edit']);

    checkPermission.mockResolvedValue(false);
    const write = await call(host, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k', value: 2 });
    expect(write.error?.code).toBe('RESOURCE_FORBIDDEN');
    // …but a READ is only access-gated, so it still works for the same user.
    expect((await call(host, 'meta.get', { entityType: 'trip', entityId: 1, key: 'k' })).result).toBe(1);
  });

  it('HOSTRPC-016 an unknown entityType is BAD_PARAMS and a userless context is refused', async () => {
    const host = makeHost('meta', 'db:meta');
    expect((await call(host, 'meta.set', { entityType: 'user', entityId: 1, key: 'k', value: 1 })).error?.code).toBe(
      'BAD_PARAMS',
    );
    expect((await call(host, 'meta.get', { entityType: 'trip', entityId: 1, key: 'k' }, undefined)).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
    // An entity id that resolves to nothing is refused rather than reported as empty.
    expect((await call(host, 'meta.get', { entityType: 'reservation', entityId: 999, key: 'k' })).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
  });

  it("HOSTRPC-017 one plugin never reads another's keys on the same entity", async () => {
    const a = makeHost('meta-a', 'db:meta');
    const b = makeHost('meta-b', 'db:meta');
    await call(a, 'meta.set', { entityType: 'trip', entityId: 1, key: 'shared', value: 'a-value' });
    expect((await call(b, 'meta.get', { entityType: 'trip', entityId: 1, key: 'shared' })).result).toBeNull();
    expect((await call(b, 'meta.list', { entityType: 'trip', entityId: 1 })).result).toEqual({});
    closePluginDataDb('meta-a');
    closePluginDataDb('meta-b');
  });

  it('HOSTRPC-018 without db:meta not one of the four is reachable', async () => {
    const host = makeHost('meta', 'db:read:trips');
    for (const method of ['meta.get', 'meta.set', 'meta.list', 'meta.delete']) {
      expect((await call(host, method, { entityType: 'trip', entityId: 1, key: 'k' })).error?.code).toBe(
        'PERMISSION_DENIED',
      );
    }
  });
});

describe('HostSurfaceRpc — users, broadcasts, notify, ai, oauth, scheduler', () => {
  beforeEach(() => {
    checkPermission.mockReset();
    checkPermission.mockResolvedValue(true);
    notifySend.mockClear();
    llmExtract.mockClear();
    broadcast.mockClear();
    broadcastToUser.mockClear();
  });
  afterAll(() => closePluginDataDb('surface'));

  it('HOSTRPC-019 users.getById is scoped to people the acting user shares a trip with', async () => {
    const host = makeHost('surface', 'db:read:users');
    const shared = await call(host, 'users.getById', { id: 6 }, 5);
    expect(shared.result).toEqual({ id: 6, username: 'ada', display_name: 'Ada', avatar: null });
    // Reading yourself needs no shared trip.
    expect((await call(host, 'users.getById', { id: 5 }, 5)).ok).toBe(true);
    // A stranger is refused, which is what stops id enumeration.
    expect((await call(host, 'users.getById', { id: 9 }, 5)).error?.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(host, 'users.getById', { id: 6 }, undefined)).error?.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('HOSTRPC-033 a burst of concurrent auditable RPC calls for the SAME plugin never forks the capability-audit hash chain (Plan 3j Task 7 fix, must-land 1)', async () => {
    // The REAL production path, not a direct `appendAudit` unit call: `dispatch()`
    // audits every `isAuditable` method AFTER computing its answer (`users.getById`
    // here, permission `db:read:users` != `db:own`), through the SAME per-plugin
    // promise-tail `appendAudit` now serializes on — task-7-review.md's SDK default of
    // 16 in-flight RPCs is what made this reachable live.
    const host = makeHost('auditburst', 'db:read:users');
    const N = 20;
    const results = await Promise.all(Array.from({ length: N }, () => call(host, 'users.getById', { id: 5 }, 5)));
    expect(results.every((r) => r.ok)).toBe(true);
    const rows = (
      mockDb as unknown as {
        prepare(s: string): {
          all(...a: unknown[]): Array<{
            plugin_id: string;
            acting_user_id: number | null;
            method: string;
            resource: string | null;
            code: string;
            ts: string;
            prev_hash: string | null;
            hash: string;
          }>;
        };
      }
    )
      .prepare(
        "SELECT plugin_id, acting_user_id, method, resource, code, ts, prev_hash, hash FROM plugin_capability_audit WHERE plugin_id = 'auditburst' ORDER BY id ASC",
      )
      .all();
    expect(rows).toHaveLength(N);
    expect(verifyChain(rows)).toBe(true);
    const prevHashes = rows.map((r) => r.prev_hash ?? '');
    expect(new Set(prevHashes).size).toBe(prevHashes.length); // no two rows read the same "previous" tip
    closePluginDataDb('auditburst');
  });

  it('HOSTRPC-020 trip broadcasts are force-namespaced and membership-gated', async () => {
    const host = makeHost('surface', 'ws:broadcast:trip');
    expect((await call(host, 'ws.broadcastToTrip', { tripId: 1, event: 'ping', data: { a: 1 } }, 5)).ok).toBe(true);
    expect(broadcast).toHaveBeenCalledWith(1, 'plugin:surface:ping', { a: 1 });
    // A primitive payload is wrapped rather than dropped.
    await call(host, 'ws.broadcastToTrip', { tripId: 1, event: 'ping', data: 'primitive' }, 5);
    expect(broadcast).toHaveBeenLastCalledWith(1, 'plugin:surface:ping', { value: 'primitive' });
    broadcast.mockClear();
    expect((await call(host, 'ws.broadcastToTrip', { tripId: 2, event: 'x', data: {} }, 5)).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
    expect((await call(host, 'ws.broadcastToTrip', { tripId: 1, event: 'x', data: {} }, undefined)).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('HOSTRPC-021 a per-user broadcast may only target the acting user', async () => {
    const host = makeHost('surface', 'ws:broadcast:user');
    expect((await call(host, 'ws.broadcastToUser', { userId: 5, event: 'hi', data: { x: 2 } }, 5)).ok).toBe(true);
    expect(broadcastToUser).toHaveBeenCalledWith(5, { type: 'plugin:surface', event: 'hi', x: 2 });
    expect((await call(host, 'ws.broadcastToUser', { userId: 6, event: 'hi', data: {} }, 5)).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
    expect((await call(host, 'ws.broadcastToUser', { userId: 5, event: 'hi', data: {} }, undefined)).error?.code).toBe(
      'RESOURCE_FORBIDDEN',
    );
  });

  it('HOSTRPC-022 notify.send forces the recipient and carries the plugin_notification event', async () => {
    const host = makeHost('surface', 'notify:send');
    expect(
      (
        await call(
          host,
          'notify.send',
          { input: { title: 'Delay', body: 'AB123 late', scope: 'user', targetId: 5, link: '/trips/1' } },
          5,
        )
      ).ok,
    ).toBe(true);
    expect(notifySend).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'plugin_notification',
        actorId: null,
        scope: 'user',
        targetId: 5,
        params: expect.objectContaining({ title: 'Delay', body: 'AB123 late', link: '/trips/1' }),
      }),
    );
    expect(
      (await call(host, 'notify.send', { input: { title: 't', body: 'b', scope: 'trip', targetId: 1 } }, 5)).ok,
    ).toBe(true);
    // Another user, a trip the acting user isn't in, and the admin scope are all refused.
    expect(
      (await call(host, 'notify.send', { input: { title: 't', body: 'b', scope: 'user', targetId: 9 } }, 5)).error
        ?.code,
    ).toBe('RESOURCE_FORBIDDEN');
    expect(
      (await call(host, 'notify.send', { input: { title: 't', body: 'b', scope: 'trip', targetId: 2 } }, 5)).error
        ?.code,
    ).toBe('RESOURCE_FORBIDDEN');
    expect(
      (await call(host, 'notify.send', { input: { title: 't', body: 'b', scope: 'admin', targetId: 0 } }, 5)).error
        ?.code,
    ).toBe('BAD_PARAMS');
    expect(
      (await call(host, 'notify.send', { input: { title: 't', body: 'b', scope: 'user', targetId: 5 } }, undefined))
        .error?.code,
    ).toBe('RESOURCE_FORBIDDEN');
  });

  it('HOSTRPC-023 notify.send rejects an off-site link and an empty or emoji-only title', async () => {
    const host = makeHost('surface', 'notify:send');
    const base = { body: 'b', scope: 'user', targetId: 5 };
    for (const link of ['//evil.com', 'https://evil.com/x', '/\\evil.com', 'javascript:alert(1)']) {
      expect((await call(host, 'notify.send', { input: { ...base, title: 't', link } }, 5)).error?.code).toBe(
        'BAD_PARAMS',
      );
    }
    expect((await call(host, 'notify.send', { input: { ...base, title: '' } }, 5)).error?.code).toBe('BAD_PARAMS');
    // stripEmoji collapses an all-emoji title to '', so it lands on the same refusal.
    expect((await call(host, 'notify.send', { input: { ...base, title: '🎉🎉' } }, 5)).error?.code).toBe('BAD_PARAMS');
    expect((await call(host, 'notify.send', { input: { ...base, title: 'x'.repeat(201) } }, 5)).error?.code).toBe(
      'BAD_PARAMS',
    );
    expect(
      (
        await call(
          host,
          'notify.send',
          { input: { title: 't', body: 'y'.repeat(1001), scope: 'user', targetId: 5 } },
          5,
        )
      ).error?.code,
    ).toBe('BAD_PARAMS');
    // A non-string title or body lands on the same refusal as an empty one, rather
    // than reaching stripEmoji and throwing there.
    expect((await call(host, 'notify.send', { input: { ...base, title: 42 } }, 5)).error?.code).toBe('BAD_PARAMS');
    expect(
      (await call(host, 'notify.send', { input: { title: 't', body: 42, scope: 'user', targetId: 5 } }, 5)).error?.code,
    ).toBe('BAD_PARAMS');
    expect(notifySend).not.toHaveBeenCalled();
  });

  it('HOSTRPC-024 ai.complete/extract run under the resolved provider, with caps', async () => {
    const host = makeHost('surface', 'ai:invoke');
    const completed = await call(host, 'ai.complete', { prompt: 'Summarize' }, 5);
    expect(completed.result).toMatchObject({ text: expect.stringContaining('answer:') });
    const extracted = await call(host, 'ai.extract', { text: 'AB123 JFK', jsonSchema: { type: 'object' } }, 5);
    expect(Array.isArray((extracted.result as { results: unknown[] }).results)).toBe(true);
    // user 7 has no provider configured
    expect((await call(host, 'ai.complete', { prompt: 'hi' }, 7)).error?.code).toBe('BAD_PARAMS');
    expect((await call(host, 'ai.complete', { prompt: '' }, 5)).error?.code).toBe('BAD_PARAMS');
    expect((await call(host, 'ai.complete', { prompt: 'x'.repeat(20001) }, 5)).error?.code).toBe('BAD_PARAMS');
    expect((await call(host, 'ai.extract', { text: 'x', jsonSchema: 'not-an-object' }, 5)).error?.code).toBe(
      'BAD_PARAMS',
    );
    expect((await call(host, 'ai.extract', { text: '', jsonSchema: {} }, 5)).error?.code).toBe('BAD_PARAMS');
    expect((await call(host, 'ai.extract', { text: 'x'.repeat(20001), jsonSchema: {} }, 5)).error?.code).toBe(
      'BAD_PARAMS',
    );
    expect((await call(host, 'ai.complete', { prompt: 'hi' }, undefined)).error?.code).toBe('RESOURCE_FORBIDDEN');
    // A non-string prompt/text is the same refusal as an empty one, not a crash.
    expect((await call(host, 'ai.complete', { prompt: 42 }, 5)).error?.code).toBe('BAD_PARAMS');
    expect((await call(host, 'ai.extract', { text: 42, jsonSchema: {} }, 5)).error?.code).toBe('BAD_PARAMS');
    // …and a null jsonSchema is refused despite typeof null === 'object'.
    expect((await call(host, 'ai.extract', { text: 'x', jsonSchema: null }, 5)).error?.code).toBe('BAD_PARAMS');
  });

  it("HOSTRPC-025 the plugin's system prompt and extraction hint are passed through, with a default", async () => {
    const host = makeHost('surface', 'ai:invoke');
    await call(host, 'ai.complete', { prompt: 'p', system: 'be terse' }, 5);
    expect(llmExtract).toHaveBeenLastCalledWith(expect.objectContaining({ prompt: 'be terse', text: 'p' }));
    await call(host, 'ai.complete', { prompt: 'p' }, 5);
    expect(llmExtract).toHaveBeenLastCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('helpful assistant') }),
    );
    await call(host, 'ai.extract', { text: 't', jsonSchema: { type: 'object' }, prompt: '' }, 5);
    expect(llmExtract).toHaveBeenLastCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining('Extract structured data') }),
    );
  });

  it('HOSTRPC-026 a model that answers with no text yields an empty string, not undefined', async () => {
    llmExtract.mockResolvedValueOnce([{ text: 42 } as never]);
    expect((await call(makeHost('surface', 'ai:invoke'), 'ai.complete', { prompt: 'p' }, 5)).result).toEqual({
      text: '',
    });
    llmExtract.mockResolvedValueOnce([]);
    expect((await call(makeHost('surface', 'ai:invoke'), 'ai.complete', { prompt: 'p' }, 5)).result).toEqual({
      text: '',
    });
  });

  /*
   * The clients raise on a response nothing could read so the booking import can
   * warn per file (#2375). This surface answered an empty value for a model that
   * talks prose long before that, and it is versioned on its own, so the plugin
   * keeps the empty value — while a request that genuinely failed still has to
   * reach it as an error.
   */
  it('HOSTRPC-026a an unreadable answer stays empty here, a failed request does not (#2375)', async () => {
    const host = makeHost('surface', 'ai:invoke');
    llmExtract.mockRejectedValueOnce(
      new UnreadableLlmResponse('the model did not answer with JSON: Sure, happy to help.'),
    );
    expect((await call(host, 'ai.complete', { prompt: 'p' }, 5)).result).toEqual({ text: '' });

    llmExtract.mockRejectedValueOnce(new UnreadableLlmResponse('the model returned an empty response'));
    expect((await call(host, 'ai.extract', { text: 't', jsonSchema: { type: 'object' } }, 5)).result).toEqual({
      results: [],
    });

    llmExtract.mockRejectedValueOnce(new Error('LLM request failed (503): upstream is down'));
    const failed = await call(host, 'ai.complete', { prompt: 'p' }, 5);
    expect(failed.error?.code).toBe('HOST_ERROR');
    expect(failed.error?.message).toMatch(/503/);
  });

  it("HOSTRPC-027 oauth.getToken returns only the acting user's access token", async () => {
    const host = makeHost('surface', 'oauth:client');
    expect((await call(host, 'oauth.getToken', {}, 5)).result).toEqual({ accessToken: 'tok-5' });
    expect((await call(host, 'oauth.getToken', {}, 7)).result).toEqual({ accessToken: null }); // not connected
    // A userless context gets null, matching the SDK contract, not RESOURCE_FORBIDDEN.
    expect((await call(host, 'oauth.getToken', {}, undefined)).result).toEqual({ accessToken: null });
    expect((await call(makeHost('surface'), 'oauth.getToken', {}, 5)).error?.code).toBe('PERMISSION_DENIED');
  });

  it('HOSTRPC-028 scheduler.set upserts by name with caps; cancel removes', async () => {
    const host = makeHost('wsched', 'jobs:run');
    const count = () =>
      (mockDb as unknown as { prepare(s: string): { get(): { n: number } } })
        .prepare("SELECT COUNT(*) AS n FROM plugin_scheduled_tasks WHERE plugin_id='wsched'")
        .get().n;
    const due = Date.now() + 120_000;
    // Userless is fine — a scheduled task is like a job.
    expect((await call(host, 'scheduler.set', { name: 'poll', dueAt: due, payload: { a: 1 } }, undefined)).ok).toBe(
      true,
    );
    expect(count()).toBe(1);
    expect((await call(host, 'scheduler.set', { name: 'poll', dueAt: due + 1000 }, undefined)).ok).toBe(true);
    expect(count()).toBe(1); // upsert by (plugin, name)
    expect((await call(host, 'scheduler.cancel', { name: 'poll' }, undefined)).result).toEqual({ cancelled: true });
    expect(count()).toBe(0);
    expect((await call(host, 'scheduler.cancel', { name: 'ghost' }, undefined)).result).toEqual({ cancelled: false });
  });

  it('HOSTRPC-029 the scheduler caps bound name, horizon, interval and payload', async () => {
    const host = makeHost('wsched2', 'jobs:run');
    const due = Date.now() + 120_000;
    const bad = async (params: Record<string, unknown>) =>
      (await call(host, 'scheduler.set', params, undefined)).error?.code;
    expect(await bad({ name: '', dueAt: due })).toBe('BAD_PARAMS');
    expect(await bad({ name: 'x'.repeat(129), dueAt: due })).toBe('BAD_PARAMS');
    expect(await bad({ name: 'far', dueAt: Date.now() + 400 * 24 * 60 * 60 * 1000 })).toBe('BAD_PARAMS');
    expect(await bad({ name: 'nan', dueAt: Number.POSITIVE_INFINITY })).toBe('BAD_PARAMS');
    expect(await bad({ name: 'fast', dueAt: due, everyMs: 5000 })).toBe('BAD_PARAMS');
    expect(await bad({ name: 'fat', dueAt: due, payload: { blob: 'z'.repeat(9000) } })).toBe('BAD_PARAMS');
    // A dueAt in the past is clamped to now rather than refused, so a plugin that wakes
    // up late still gets its task fired on the next sweep.
    expect((await call(host, 'scheduler.set', { name: 'late', dueAt: 1 }, undefined)).ok).toBe(true);
    const row = (mockDb as unknown as { prepare(s: string): { get(): { due_at: number } } })
      .prepare("SELECT due_at FROM plugin_scheduled_tasks WHERE plugin_id='wsched2' AND name='late'")
      .get();
    expect(row.due_at).toBeGreaterThan(1);
  });

  it('HOSTRPC-030 a plugin cannot hoard more than 100 scheduled tasks', async () => {
    const host = makeHost('wschedmax', 'jobs:run');
    const due = Date.now() + 120_000;
    for (let i = 0; i < 100; i++) {
      expect((await call(host, 'scheduler.set', { name: `t${i}`, dueAt: due }, undefined)).ok).toBe(true);
    }
    const over = await call(host, 'scheduler.set', { name: 't100', dueAt: due }, undefined);
    expect(over.error?.message).toMatch(/too many scheduled tasks/);
    // An existing name still upserts — the cap counts entries, not calls.
    expect((await call(host, 'scheduler.set', { name: 't0', dueAt: due + 5 }, undefined)).ok).toBe(true);
  });

  it("HOSTRPC-031 the daily notify + AI budgets are enforced, seeded from today's audit rows", async () => {
    // Seed the audit with a plugin that has already spent its whole day (default caps
    // are 100 notify / 200 ai) so the budget is exhausted on first use.
    const today = `${new Date().toISOString().slice(0, 10)}T08:00:00.000Z`;
    const insert = (mockDb as unknown as { prepare(s: string): { run(...a: unknown[]): unknown } }).prepare(
      "INSERT INTO plugin_capability_audit (plugin_id, method, code, ts) VALUES (?, ?, 'ok', ?)",
    );
    for (let i = 0; i < 100; i++) insert.run('wbudget', 'notify.send', today);
    for (let i = 0; i < 200; i++) insert.run('wbudget', 'ai.complete', today);
    const host = makeHost('wbudget', 'notify:send', 'ai:invoke');
    const notified = await call(
      host,
      'notify.send',
      { input: { title: 't', body: 'b', scope: 'user', targetId: 5 } },
      5,
    );
    expect(notified.error?.code).toBe('BAD_PARAMS');
    expect(notified.error?.message).toMatch(/budget/i);
    expect(notifySend).not.toHaveBeenCalled();
    expect((await call(host, 'ai.complete', { prompt: 'hi' }, 5)).error?.message).toMatch(/budget/i);
    closePluginDataDb('wbudget');
  });

  it('HOSTRPC-032 every host-surface method is unreachable without its own grant', async () => {
    const host = makeHost('surface');
    const denied: Record<string, Record<string, unknown>> = {
      'users.getById': { id: 6 },
      'ws.broadcastToTrip': { tripId: 1, event: 'x' },
      'ws.broadcastToUser': { userId: 5, event: 'x' },
      'notify.send': { input: { title: 't', body: 'b', scope: 'user', targetId: 5 } },
      'ai.complete': { prompt: 'x' },
      'ai.extract': { text: 'x', jsonSchema: {} },
      'oauth.getToken': {},
      'scheduler.set': { name: 'x', dueAt: Date.now() + 1000 },
      'scheduler.cancel': { name: 'x' },
    };
    for (const [method, params] of Object.entries(denied)) {
      expect((await call(host, method, params, 5)).error?.code).toBe('PERMISSION_DENIED');
    }
  });
});
