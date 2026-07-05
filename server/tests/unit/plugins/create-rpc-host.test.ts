/**
 * The production wiring that connects a plugin's capability host to the real
 * privileged modules (#plugins, M1). Verifies the per-plugin data db is cached,
 * a granted db:own call works through the wired host, and trip broadcasts are
 * force-namespaced to plugin:{id}:{event}.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { broadcast, broadcastToUser } = vi.hoisted(() => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
// A real in-memory core db so the metadata deps (inline SQL) and metaEntityTrip
// resolution run for real; trip 1 is owned by user 5. canAccessTrip is stubbed so
// user 5 (owner) can access trip 1 and user 6 cannot.
vi.mock('../../../src/db/database', () => {
  const Database = require('better-sqlite3');
  const d = new Database(':memory:');
  d.exec(`
    CREATE TABLE trips (id INTEGER PRIMARY KEY, user_id INTEGER);
    CREATE TABLE places (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE days (id INTEGER PRIMARY KEY, trip_id INTEGER);
    CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT, username TEXT, display_name TEXT, avatar TEXT);
    CREATE TABLE trip_members (trip_id INTEGER, user_id INTEGER);
    CREATE TABLE plugin_entity_metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, plugin_id TEXT, entity_type TEXT, entity_id INTEGER, key TEXT, value TEXT, updated_at TEXT, UNIQUE(plugin_id, entity_type, entity_id, key));
  `);
  d.prepare('INSERT INTO trips (id, user_id) VALUES (1, 5)').run();
  d.prepare('INSERT INTO places (id, trip_id) VALUES (7, 1)').run();
  d.prepare('INSERT INTO days (id, trip_id) VALUES (3, 1)').run();
  d.prepare('INSERT INTO users (id, role) VALUES (5, ?)').run('trip_owner');
  d.prepare('INSERT INTO users (id, role) VALUES (6, ?)').run('user');
  d.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (1, 6)').run(); // user 6 shares trip 1 with owner 5
  return { db: d, canAccessTrip: (tripId: number, userId: number) => (tripId === 1 && (userId === 5 || userId === 6) ? { id: 1, user_id: 5 } : undefined) };
});
vi.mock('../../../src/websocket', () => ({ broadcast, broadcastToUser }));
vi.mock('../../../src/services/adminService', () => ({ isAddonEnabled: () => true }));
vi.mock('../../../src/nest/budget/budget.service', () => ({
  BudgetService: class {
    async create(tid: string, input: Record<string, unknown>) { return { id: 1, trip_id: Number(tid), ...input }; }
    async update(id: string, tid: string, input: Record<string, unknown>) {
      return id === '404' ? null : { id: Number(id), trip_id: Number(tid), ...input };
    }
    remove(id: string, _tid: string) { return id !== '404'; }
  },
}));

// Edit permission — flip per test to exercise the gates.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn((..._a: any[]) => true as boolean) }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

// The core write services are delegated to; mock them so the create-rpc-host deps'
// wiring + error branches run without the full core schema. The error classes must
// be defined INSIDE the factory (vi.mock is hoisted above module-scope code).
vi.mock('../../../src/services/tripService', () => {
  class NotFoundError extends Error {}
  class ValidationError extends Error {}
  return {
    updateTrip: (tripId: number, _u: number, input: Record<string, unknown>) => {
      if (input.title === 'boom') throw new ValidationError('bad dates');
      if (input.title === 'gone') throw new NotFoundError('no trip');
      if (input.title === 'crash') throw new Error('unexpected');
      return { updatedTrip: { id: tripId, ...input } };
    },
    listTrips: () => [],
    NotFoundError, ValidationError,
  };
});
vi.mock('../../../src/services/placeService', () => ({
  createPlace: vi.fn((tid: string, body: Record<string, unknown>) => ({ id: 10, trip_id: Number(tid), ...body })),
  updatePlace: vi.fn((_tid: string, pid: string) => (pid === '99' ? null : { id: Number(pid) })),
  deletePlace: vi.fn((_tid: string, pid: string) => pid !== '99'),
}));
vi.mock('../../../src/services/dayService', () => ({
  createDay: vi.fn((tid: number) => ({ id: 20, trip_id: tid, assignments: [] })),
  getDay: vi.fn((id: number) => (id === 99 ? undefined : { id, title: null })),
  updateDay: vi.fn((id: number) => ({ id, assignments: [] })),
  deleteDay: vi.fn(),
}));
vi.mock('../../../src/services/assignmentService', () => ({
  createAssignment: vi.fn((dayId: number, placeId: number, notes: string | null) => ({ id: 30, day_id: dayId, place_id: placeId, notes })),
  deleteAssignment: vi.fn(),
  dayExists: vi.fn((dayId: number) => dayId === 3),
  placeExists: vi.fn((placeId: number) => placeId === 7),
  getAssignmentForTrip: vi.fn((id: number) => (id === 99 ? undefined : { id })),
}));
vi.mock('../../../src/services/budgetService', () => ({ listBudgetItems: vi.fn(() => []) }));
vi.mock('../../../src/services/packingService', () => ({ listItems: vi.fn((tid: number, userId: number) => [{ id: 1, trip_id: tid, name: 'Socks', _uid: userId }]) }));
vi.mock('../../../src/services/fileService', () => ({ listFiles: vi.fn((tid: number, trash: boolean) => [{ id: 2, trip_id: tid, trash }]) }));

import { createRealRpcHost, getPluginDataDb, closePluginDataDb } from '../../../src/nest/plugins/host/create-rpc-host';

let tmp: string;
beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trekplug-crh-'));
  process.env.TREK_PLUGINS_DATA_DIR = tmp;
});
afterAll(() => {
  closePluginDataDb('wired');
  delete process.env.TREK_PLUGINS_DATA_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('create-rpc-host wiring', () => {
  it('caches one data db per plugin id', () => {
    const a = getPluginDataDb('wired');
    const b = getPluginDataDb('wired');
    expect(a).toBe(b);
  });

  it('a granted db:own call runs against the plugin db, and a trip broadcast is namespaced', async () => {
    const host = createRealRpcHost('wired', new Set(['db:own', 'ws:broadcast:trip']));
    const migrated = await host.dispatch({ k: 'req', id: '1', method: 'db.migrate', params: { id: '001', sql: 'CREATE TABLE t (v TEXT)' } });
    expect(migrated.ok).toBe(true);

    // acting user 5 is a member of trip 1 (mocked canAccessTrip) → broadcast allowed + namespaced
    await host.dispatch({ k: 'req', id: '2', method: 'ws.broadcastToTrip', params: { tripId: 1, event: 'ping', data: { a: 1 } } }, 5);
    expect(broadcast).toHaveBeenCalledWith(1, 'plugin:wired:ping', { a: 1 });

    const bcastUser = createRealRpcHost('wired', new Set(['ws:broadcast:user']));
    // a per-user broadcast may only target the acting user themselves
    await bcastUser.dispatch({ k: 'req', id: '3', method: 'ws.broadcastToUser', params: { userId: 5, event: 'hi', data: {} } }, 5);
    expect(broadcastToUser).toHaveBeenCalledWith(5, { type: 'plugin:wired', event: 'hi' });
  });

  it('closePluginDataDb closes and drops the cached handle', () => {
    getPluginDataDb('transient');
    closePluginDataDb('transient');
    // a fresh get after close returns a NEW instance (cache was cleared)
    const a = getPluginDataDb('transient');
    closePluginDataDb('transient');
    const b = getPluginDataDb('transient');
    expect(a).not.toBe(b);
    closePluginDataDb('transient');
  });
});

describe('create-rpc-host — planner write + metadata deps', () => {
  const host = (...perms: string[]) => createRealRpcHost('writer', new Set(perms));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (h: ReturnType<typeof host>, method: string, params: Record<string, unknown>, uid = 5): Promise<any> =>
    h.dispatch({ k: 'req', id: 'x', method, params }, uid);
  beforeEach(() => { checkPermission.mockReset(); checkPermission.mockReturnValue(true); });
  afterAll(() => closePluginDataDb('writer'));

  it('places.create/update/delete delegate + broadcast; a missing place is RESOURCE_FORBIDDEN', async () => {
    const h = host('db:write:places');
    expect((await call(h, 'places.create', { tripId: 1, input: { name: 'P' } })).ok).toBe(true);
    // Write deps re-emit the SAME core event the controllers do (not the plugin: namespace).
    expect(broadcast).toHaveBeenCalledWith(1, 'place:created', expect.anything());
    expect((await call(h, 'places.update', { tripId: 1, placeId: 5, input: { name: 'Q' } })).ok).toBe(true);
    expect((await call(h, 'places.update', { tripId: 1, placeId: 99, input: {} })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'places.delete', { tripId: 1, placeId: 5 })).ok).toBe(true);
    expect((await call(h, 'places.delete', { tripId: 1, placeId: 99 })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('days + itinerary delegate; a day/place/assignment outside the trip is refused', async () => {
    const h = host('db:write:days', 'db:write:itinerary');
    expect((await call(h, 'days.create', { tripId: 1, input: { notes: 'n' } })).ok).toBe(true);
    expect((await call(h, 'days.update', { tripId: 1, dayId: 3, input: { notes: 'x' } })).ok).toBe(true);
    expect((await call(h, 'days.delete', { tripId: 1, dayId: 3 })).ok).toBe(true);
    expect((await call(h, 'days.update', { tripId: 1, dayId: 99, input: {} })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'itinerary.assign', { tripId: 1, dayId: 3, placeId: 7 })).ok).toBe(true);
    expect((await call(h, 'itinerary.assign', { tripId: 1, dayId: 99, placeId: 7 })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'itinerary.assign', { tripId: 1, dayId: 3, placeId: 99 })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'itinerary.unassign', { tripId: 1, assignmentId: 30 })).ok).toBe(true);
    expect((await call(h, 'itinerary.unassign', { tripId: 1, assignmentId: 99 })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('trips.update: archive/cover need their own permission; service errors map to RPC codes', async () => {
    const h = host('db:write:trips');
    expect((await call(h, 'trips.update', { tripId: 1, input: { title: 'T' } })).ok).toBe(true);
    checkPermission.mockImplementation((action: string) => action !== 'trip_archive');
    expect((await call(h, 'trips.update', { tripId: 1, input: { is_archived: 1 } })).error.code).toBe('RESOURCE_FORBIDDEN');
    checkPermission.mockImplementation((action: string) => action !== 'trip_cover_upload');
    expect((await call(h, 'trips.update', { tripId: 1, input: { cover_image: '/x.jpg' } })).error.code).toBe('RESOURCE_FORBIDDEN');
    checkPermission.mockReturnValue(true);
    expect((await call(h, 'trips.update', { tripId: 1, input: { title: 'boom' } })).error.code).toBe('BAD_PARAMS');
    expect((await call(h, 'trips.update', { tripId: 1, input: { title: 'gone' } })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'trips.update', { tripId: 1, input: { title: 'crash' } })).error.code).toBe('HOST_ERROR'); // rethrow of an unknown error
  });

  it('metadata: round-trips and enforces the key/value/access limits', async () => {
    const h = host('db:meta');
    expect((await call(h, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k', value: { a: 1 } })).ok).toBe(true);
    expect((await call(h, 'meta.get', { entityType: 'trip', entityId: 1, key: 'k' })).result).toEqual({ a: 1 });
    expect((await call(h, 'meta.set', { entityType: 'trip', entityId: 1, key: 'k', value: 2 })).ok).toBe(true); // upsert path
    expect((await call(h, 'meta.list', { entityType: 'place', entityId: 7 })).ok).toBe(true); // place → trip 1
    expect((await call(h, 'meta.delete', { entityType: 'trip', entityId: 1, key: 'k' })).result).toEqual({ deleted: true });
    expect((await call(h, 'meta.set', { entityType: 'trip', entityId: 1, key: 'x'.repeat(300), value: 1 })).error.code).toBe('BAD_PARAMS');
    expect((await call(h, 'meta.set', { entityType: 'trip', entityId: 1, key: 'big', value: 'y'.repeat(70000) })).error.code).toBe('BAD_PARAMS');
    expect((await call(h, 'meta.set', { entityType: 'trip', entityId: 2, key: 'k', value: 1 })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('costs deps: create + reads wired through the budget service and addon gate', async () => {
    const h = host('db:read:costs', 'db:write:costs');
    expect((await call(h, 'costs.create', { tripId: 1, input: { name: 'Hotel' } })).ok).toBe(true);
    expect(broadcast).toHaveBeenCalledWith(1, 'budget:created', expect.anything());
    expect((await call(h, 'costs.getByTrip', { tripId: 1 })).ok).toBe(true);
    expect((await call(h, 'costs.listMine', {})).ok).toBe(true);
  });

  it('costs deps: update wired through BudgetService.update + broadcasts budget:updated', async () => {
    const h = host('db:write:costs');
    expect((await call(h, 'costs.update', { tripId: 1, itemId: 9, input: { name: 'Hostel' } })).ok).toBe(true);
    expect(broadcast).toHaveBeenCalledWith(1, 'budget:updated', expect.anything());
  });

  it('costs deps: update of a missing item is RESOURCE_FORBIDDEN', async () => {
    const h = host('db:write:costs');
    expect((await call(h, 'costs.update', { tripId: 1, itemId: 404, input: { name: 'X' } })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('costs deps: delete wired through BudgetService.remove + broadcasts budget:deleted', async () => {
    const h = host('db:write:costs');
    const res = await call(h, 'costs.delete', { tripId: 1, itemId: 9 });
    expect(res.ok).toBe(true);
    expect(res.result).toMatchObject({ deleted: true });
    expect(broadcast).toHaveBeenCalledWith(1, 'budget:deleted', { itemId: 9 });
  });

  it('costs deps: delete of a missing item is RESOURCE_FORBIDDEN', async () => {
    const h = host('db:write:costs');
    expect((await call(h, 'costs.delete', { tripId: 1, itemId: 404 })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('packing/files read deps delegate to their services (trash excluded for files)', async () => {
    const h = host('db:read:packing', 'db:read:files');
    // acting user 5 is threaded to the packing service (#858 private-item filter); _uid proves it
    expect((await call(h, 'packing.list', { tripId: 1 })).result).toEqual([{ id: 1, trip_id: 1, name: 'Socks', _uid: 5 }]);
    expect((await call(h, 'files.list', { tripId: 1 })).result).toEqual([{ id: 2, trip_id: 1, trash: false }]);
  });

  it('users.getById is scoped to people the acting user shares a trip with', async () => {
    const h = host('db:read:users');
    expect((await call(h, 'users.getById', { id: 6 }, 5)).ok).toBe(true); // 5 (owner) + 6 (member) share trip 1
    expect((await call(h, 'users.getById', { id: 999 }, 5)).error.code).toBe('RESOURCE_FORBIDDEN');
  });
});
