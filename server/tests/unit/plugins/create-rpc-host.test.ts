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
    CREATE TABLE packing_items (id INTEGER PRIMARY KEY, trip_id INTEGER, is_private INTEGER, owner_id INTEGER);
  `);
  d.prepare('INSERT INTO trips (id, user_id) VALUES (1, 5)').run();
  d.prepare('INSERT INTO packing_items (id, trip_id, is_private, owner_id) VALUES (70, 1, 0, 5)').run(); // public before an update
  d.prepare('INSERT INTO packing_items (id, trip_id, is_private, owner_id) VALUES (71, 1, 1, 5)').run(); // private before an update
  d.prepare('INSERT INTO places (id, trip_id) VALUES (7, 1)').run();
  d.prepare('INSERT INTO days (id, trip_id) VALUES (3, 1)').run();
  d.prepare('INSERT INTO users (id, role) VALUES (5, ?)').run('trip_owner');
  d.prepare('INSERT INTO users (id, role) VALUES (6, ?)').run('user');
  d.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (1, 6)').run(); // user 6 shares trip 1 with owner 5
  return { db: d, canAccessTrip: (tripId: number, userId: number) => (tripId === 1 && (userId === 5 || userId === 6) ? { id: 1, user_id: 5 } : undefined) };
});
vi.mock('../../../src/websocket', () => ({ broadcast, broadcastToUser }));
// Addon gate — flip per test to exercise the "addon disabled" branch of the reads.
const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true as boolean) }));
vi.mock('../../../src/services/adminService', () => ({ isAddonEnabled }));
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
    listTrips: () => [{ id: 1 }],
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
vi.mock('../../../src/services/packingService', () => ({
  listItems: vi.fn((tid: number, userId: number) => [{ id: 1, trip_id: tid, name: 'Socks', _uid: userId }]),
  // Return the item with the #858 privacy fields the create-rpc-host deps scope on.
  createItem: vi.fn((tid: number, input: { name: string; visibility?: string; recipient_ids?: number[] }, ownerId?: number) => {
    if (input.visibility === 'personal') return { id: 70, trip_id: Number(tid), name: input.name, is_private: 1, owner_id: ownerId, recipients: [] };
    if (input.visibility === 'shared') return { id: 70, trip_id: Number(tid), name: input.name, is_private: 1, owner_id: ownerId, recipients: (input.recipient_ids || []).map((id) => ({ user_id: id })) };
    return { id: 70, trip_id: Number(tid), name: input.name, is_private: 0, owner_id: ownerId };
  }),
  // itemId 99 => a stale-write conflict result; otherwise the after-state (is_private per input).
  updateItem: vi.fn((tid: number, id: string, input: { is_private?: boolean }) =>
    Number(id) === 99 ? { conflict: true, server: { id: 99 } } : { id: Number(id), trip_id: Number(tid), is_private: input.is_private ? 1 : 0, owner_id: 5 },
  ),
  // The raw deleted row (owner-only for a private item, no recipients — #858).
  deleteItem: vi.fn((_tid: number, id: string) => (Number(id) === 404 ? null : Number(id) === 71 ? { id: 71, is_private: 1, owner_id: 5 } : { id: Number(id), is_private: 0 })),
  listBags: vi.fn((tid: number) => [{ id: 80, trip_id: Number(tid), name: 'Backpack' }]),
  createBag: vi.fn((tid: number, data: { name: string }) => ({ id: 80, trip_id: Number(tid), name: data.name })),
  updateBag: vi.fn((_tid: number, bagId: string) => (Number(bagId) === 404 ? null : { id: Number(bagId), name: 'Renamed' })),
  deleteBag: vi.fn((_tid: number, bagId: string) => Number(bagId) !== 404),
  setBagMembers: vi.fn((_tid: number, bagId: string, userIds: number[]) => (Number(bagId) === 404 ? null : userIds.map((u) => ({ user_id: u })))),
}));
vi.mock('../../../src/services/conflictResult', () => ({ isUpdateConflict: (r: unknown) => !!(r as { conflict?: boolean })?.conflict }));
vi.mock('../../../src/services/weatherService', () => ({ getWeather: vi.fn(async (lat: string, lng: string) => ({ lat, lng, temp: 20 })) }));
vi.mock('../../../src/services/categoryService', () => ({ listCategories: vi.fn(() => [{ id: 1, name: 'Food' }]) }));
vi.mock('../../../src/services/tagService', () => ({
  listTags: vi.fn((uid: number) => [{ id: 1, user_id: uid, name: 'work' }]),
  createTag: vi.fn((uid: number, name: string, color?: string) => ({ id: 9, user_id: uid, name, color })),
  getTagByIdAndUser: vi.fn((tagId: number, _uid: number) => (Number(tagId) === 404 ? undefined : { id: Number(tagId) })),
  updateTag: vi.fn((tagId: number, name?: string) => ({ id: Number(tagId), name })),
  deleteTag: vi.fn(),
}));
vi.mock('../../../src/services/todoService', () => ({
  listItems: vi.fn((tid: number) => [{ id: 1, trip_id: Number(tid), name: 'Pack' }]),
  createItem: vi.fn((tid: number, data: { name: string }) => ({ id: 90, trip_id: Number(tid), name: data.name })),
  updateItem: vi.fn((_tid: number, id: string) => (Number(id) === 404 ? null : { id: Number(id), name: 'Done' })),
  deleteItem: vi.fn((_tid: number, id: string) => Number(id) !== 404),
}));
const { testFilesDir } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const osm = require('node:os') as typeof import('node:os');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pm = require('node:path') as typeof import('node:path');
  return { testFilesDir: pm.join(osm.tmpdir(), 'trek-crh-files-test') };
});
vi.mock('../../../src/services/fileService', () => ({
  listFiles: vi.fn((tid: number, trash: boolean) => [{ id: 2, trip_id: tid, trash }]),
  filesDir: testFilesDir,
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.sh'],
  createFile: vi.fn((tid: number, file: { filename: string; originalname: string; size: number }, uploadedBy: number) => ({ id: 130, trip_id: Number(tid), ...file, uploaded_by: uploadedBy })),
  createFileLink: vi.fn(() => [{ file_id: 130 }]),
  getFileById: vi.fn((id: number) => (Number(id) === 404 ? undefined : { id: Number(id), description: 'old', place_id: null, reservation_id: null })),
  updateFile: vi.fn((id: number, _cur: unknown, updates: unknown) => ({ id: Number(id), ...(updates as object) })),
  softDeleteFile: vi.fn(),
  // reservation_id/place_id 999 = belongs to another trip
  findForeignLinkTarget: vi.fn((_tid: number, opts: { reservation_id?: number | null; place_id?: number | null }) =>
    (Number(opts.reservation_id) === 999 ? 'reservation_id' : Number(opts.place_id) === 999 ? 'place_id' : null)),
}));
vi.mock('../../../src/services/collabService', () => ({
  createNote: vi.fn((tid: number, uid: number, data: { title: string }) => ({ id: 140, trip_id: Number(tid), created_by: uid, title: data.title })),
  createPoll: vi.fn((tid: number, _uid: number, data: { question: string }) => ({ id: 141, trip_id: Number(tid), question: data.question })),
  votePoll: vi.fn((_tid: number, pollId: number, _uid: number, optionIndex: number) =>
    (optionIndex > 5 ? { error: 'Invalid option' } : { poll: { id: Number(pollId), votes: 1 } })),
  createMessage: vi.fn((tid: number, uid: number, text: string) =>
    (text === 'toolong' ? { error: 'Message too long' } : { message: { id: 142, trip_id: Number(tid), user_id: uid, text } })),
}));
vi.mock('../../../src/services/tripMembership', () => ({
  joinTripAsMember: vi.fn((tripId: number, userId: number) => ({ joined: userId !== 5, tripId })), // owner add = no-op
}));
// Reservations: the Nest service is delegated to; mock it so the create-rpc-host
// reservation deps' side-effect branches (accommodation / budget-sync / notify) run.
vi.mock('../../../src/nest/reservations/reservations.service', () => ({
  ReservationsService: class {
    create(tid: string, input: Record<string, unknown>) {
      return { reservation: { id: 40, trip_id: Number(tid), ...input }, accommodationCreated: input.title === 'Stay' };
    }
    getReservation(id: string) { return id === '404' ? undefined : { id: Number(id), title: 'Old', type: 'flight' }; }
    update(id: string, tid: string, input: Record<string, unknown>) {
      return { reservation: { id: Number(id), trip_id: Number(tid), ...input }, accommodationChanged: input.title === 'New' };
    }
    remove(id: string) {
      if (id === '404') return { deleted: undefined, accommodationDeleted: false, deletedBudgetItemId: null };
      return { deleted: { id: Number(id), title: 'Gone', type: 'hotel', accommodation_id: 7 }, accommodationDeleted: true, deletedBudgetItemId: 9 };
    }
    list(tid: string) { return [{ id: 1, trip_id: Number(tid), title: 'Flight' }]; }
    syncBudgetOnCreate() {}
    syncBudgetOnUpdate() {}
    notifyBookingChange() {}
  },
}));
vi.mock('../../../src/services/journeyService', () => ({
  listJourneys: vi.fn((uid: number) => [{ id: 1, owner: uid }]),
  // journeyId 99 = not editable by the acting user (canEdit inside returns null/false)
  createEntry: vi.fn((journeyId: number, uid: number, data: unknown) => (journeyId === 99 ? null : { id: 120, journey_id: journeyId, created_by: uid, ...(data as object) })),
  updateEntry: vi.fn((entryId: number, _uid: number, data: unknown) => (entryId === 99 ? null : { id: entryId, ...(data as object) })),
  deleteEntry: vi.fn((entryId: number) => entryId !== 99),
}));
vi.mock('../../../src/services/atlasService', () => ({
  listVisitedCountries: vi.fn(() => [{ country_code: 'JP' }]),
  listManuallyVisitedRegions: vi.fn(() => [{ region_code: 'JP-13' }]),
  markCountryVisited: vi.fn(),
  unmarkCountryVisited: vi.fn(),
  markRegionVisited: vi.fn(),
  unmarkRegionVisited: vi.fn(),
  createBucketItem: vi.fn((uid: number, data: { name: string }) => ({ id: 110, user_id: uid, name: data.name })),
  deleteBucketItem: vi.fn((_uid: number, itemId: number) => Number(itemId) !== 404),
}));
vi.mock('../../../src/services/vacayService', () => ({
  getPlanData: vi.fn((uid: number) => ({ plan: { id: 1, owner: uid } })),
  getActivePlanId: vi.fn(() => 77),
  toggleEntry: vi.fn((uid: number, planId: number) => ({ action: 'added', uid, planId })),
  toggleCompanyHoliday: vi.fn((planId: number) => ({ action: 'added', planId })),
}));
vi.mock('../../../src/services/collectionsService', () => {
  const httpError = (status: number, message: string) => { const e = new Error(message) as Error & { status: number }; e.status = status; throw e; };
  return {
    listCollections: vi.fn((uid: number) => ({ collections: [{ id: 1, owner: uid }] })),
    getCollection: vi.fn((uid: number, id: number) => ({ id, owner: uid, places: [] })),
    createCollection: vi.fn((uid: number, body: unknown) => ({ id: 100, owner_id: uid, ...(body as object) })),
    // id 99 = viewer-only (403); id 404 = invisible (404) — the service throws status-tagged errors
    updateCollection: vi.fn((_uid: number, id: number, body: unknown) => { if (id === 99) httpError(403, 'read-only'); if (id === 404) httpError(404, 'Collection not found'); return { id, ...(body as object) }; }),
    savePlace: vi.fn((uid: number, body: unknown) => ({ id: 101, saved_by: uid, ...(body as object) })),
    copyToTrip: vi.fn(() => ({ copied: 2, skipped: [] })),
    deletePlace: vi.fn((_uid: number, placeId: number) => { if (placeId === 404) httpError(404, 'Collection not found'); }),
  };
});
vi.mock('../../../src/services/dayNoteService', () => ({
  listNotes: vi.fn((dayId: number, tripId: number) => [{ id: 1, day_id: dayId, trip_id: tripId }]),
  createNote: vi.fn((dayId: number, _tripId: number, text: string) => ({ id: 50, day_id: dayId, text })),
  getNote: vi.fn((id: number) => (id === 99 ? undefined : { id, text: 'Old' })),
  updateNote: vi.fn((id: number, _current: unknown, fields: Record<string, unknown>) => ({ id, ...fields })),
  deleteNote: vi.fn(),
  dayExists: vi.fn((dayId: number) => dayId === 3),
}));

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

describe('create-rpc-host — reservations, day notes, cross-trip + addon reads (Waves 1-5)', () => {
  const host = (...perms: string[]) => createRealRpcHost('w15', new Set(perms));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (h: ReturnType<typeof host>, method: string, params: Record<string, unknown>, uid: number | undefined = 5): Promise<any> =>
    h.dispatch({ k: 'req', id: 'x', method, params }, uid);
  beforeEach(() => {
    checkPermission.mockReset(); checkPermission.mockReturnValue(true);
    isAddonEnabled.mockReset(); isAddonEnabled.mockReturnValue(true);
  });
  afterAll(() => closePluginDataDb('w15'));

  it('reservations create/update/delete run the real side-effect wiring; a missing one is refused', async () => {
    const h = host('db:write:reservations');
    expect((await call(h, 'reservations.create', { tripId: 1, input: { title: 'Flight' } })).ok).toBe(true);
    // title 'Stay' drives the accommodationCreated branch of the wiring
    expect((await call(h, 'reservations.create', { tripId: 1, input: { title: 'Stay' } })).ok).toBe(true);
    expect(broadcast).toHaveBeenCalledWith(1, 'reservation:created', expect.anything(), undefined);
    expect((await call(h, 'reservations.update', { tripId: 1, reservationId: 40, input: { title: 'New' } })).ok).toBe(true);
    expect((await call(h, 'reservations.update', { tripId: 1, reservationId: 404, input: { title: 'X' } })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'reservations.delete', { tripId: 1, reservationId: 40 })).ok).toBe(true);
    expect((await call(h, 'reservations.delete', { tripId: 1, reservationId: 404 })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('day notes create/update/delete run the wiring; a day/note outside the trip is refused', async () => {
    const h = host('db:write:daynotes');
    expect((await call(h, 'daynotes.create', { tripId: 1, dayId: 3, input: { text: 'Pack' } })).ok).toBe(true);
    expect((await call(h, 'daynotes.create', { tripId: 1, dayId: 88, input: { text: 'x' } })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'daynotes.update', { tripId: 1, dayId: 3, noteId: 5, input: { text: 'y' } })).ok).toBe(true);
    expect((await call(h, 'daynotes.update', { tripId: 1, dayId: 3, noteId: 99, input: {} })).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'daynotes.delete', { tripId: 1, dayId: 3, noteId: 5 })).ok).toBe(true);
    expect((await call(h, 'daynotes.delete', { tripId: 1, dayId: 3, noteId: 99 })).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('cross-trip reads enumerate accessible trips and reservations', async () => {
    const h = host('db:read:trips');
    expect((await call(h, 'trips.listMine', {})).ok).toBe(true);
    const r = await call(h, 'reservations.listMine', {});
    expect(r.ok).toBe(true);
    expect(r.result).toHaveLength(1);
  });

  it('addon reads delegate, and a disabled addon is refused', async () => {
    const h = host('db:read:journal', 'db:read:atlas', 'db:read:vacay', 'db:read:collections');
    expect((await call(h, 'journal.listMine', {})).ok).toBe(true);
    expect((await call(h, 'atlas.visited', {})).ok).toBe(true);
    expect((await call(h, 'vacay.mine', {})).ok).toBe(true);
    expect((await call(h, 'collections.listMine', {})).ok).toBe(true);
    expect((await call(h, 'collections.get', { id: 1 })).ok).toBe(true);
    isAddonEnabled.mockReturnValue(false);
    expect((await call(h, 'journal.listMine', {})).error.code).toBe('RESOURCE_FORBIDDEN');
    expect((await call(h, 'collections.listMine', {})).error.code).toBe('RESOURCE_FORBIDDEN');
  });
});

describe('create-rpc-host — packing write with #858 privacy-scoped broadcasts', () => {
  const host = () => createRealRpcHost('pk', new Set(['db:write:packing']))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (method: string, params: Record<string, unknown>, uid = 5): Promise<any> =>
    host().dispatch({ k: 'req', id: 'x', method, params }, uid)
  // the onlyUserId (5th arg) of every broadcast for `event` since the last clear:
  // undefined = whole trip room, a number = that user's sockets only.
  const fanout = (event: string) => broadcast.mock.calls.filter((c) => c[1] === event).map((c) => c[4])
  beforeEach(() => { checkPermission.mockReset(); checkPermission.mockReturnValue(true); isAddonEnabled.mockReset(); isAddonEnabled.mockReturnValue(true); broadcast.mockClear() })
  afterAll(() => closePluginDataDb('pk'))

  it('create: Common -> whole room; Personal -> owner-only; Shared -> owner + recipients', async () => {
    expect((await call('packing.create', { tripId: 1, input: { name: 'Common', visibility: 'common' } })).ok).toBe(true)
    expect(fanout('packing:created')).toEqual([undefined]) // whole room

    broadcast.mockClear()
    expect((await call('packing.create', { tripId: 1, input: { name: 'Mine', visibility: 'personal' } })).ok).toBe(true)
    expect(fanout('packing:created')).toEqual([5]) // owner-only

    broadcast.mockClear()
    expect((await call('packing.create', { tripId: 1, input: { name: 'Ours', visibility: 'shared', recipient_ids: [6] } })).ok).toBe(true)
    expect([...fanout('packing:created')].sort()).toEqual([5, 6]) // owner + recipient, never the room
  })

  it('update: the four public<->private transitions route correctly (never leaks a privatized item)', async () => {
    await call('packing.update', { tripId: 1, itemId: 71, input: { is_private: true } }) // stays private (71 seeded private)
    expect(fanout('packing:updated')).toEqual([5])
    expect(fanout('packing:deleted')).toEqual([])
    expect(fanout('packing:created')).toEqual([])

    broadcast.mockClear()
    await call('packing.update', { tripId: 1, itemId: 70, input: { is_private: true } }) // public -> private (70 seeded public)
    expect(fanout('packing:deleted')).toEqual([undefined]) // drop from the room FIRST (the anti-leak)
    expect(fanout('packing:created')).toEqual([5])         // then re-add owner-only

    broadcast.mockClear()
    await call('packing.update', { tripId: 1, itemId: 71, input: { is_private: false } }) // private -> public
    expect(fanout('packing:created')).toEqual([undefined])
    expect(fanout('packing:updated')).toEqual([undefined])

    broadcast.mockClear()
    await call('packing.update', { tripId: 1, itemId: 70, input: { is_private: false } }) // stays public
    expect(fanout('packing:updated')).toEqual([undefined])
    expect(fanout('packing:deleted')).toEqual([])
  })

  it('update: a stale-write conflict is BAD_PARAMS and never broadcasts', async () => {
    const res = await call('packing.update', { tripId: 1, itemId: 99, input: { name: 'x' } })
    expect((res as { error: { code: string } }).error.code).toBe('BAD_PARAMS')
    expect(broadcast).not.toHaveBeenCalled()
  })

  it('delete: a private item is owner-scoped; a missing one is RESOURCE_FORBIDDEN', async () => {
    await call('packing.delete', { tripId: 1, itemId: 71 })
    expect(fanout('packing:deleted')).toEqual([5]) // owner-only (recipients get no packing:deleted)
    broadcast.mockClear()
    await call('packing.delete', { tripId: 1, itemId: 70 })
    expect(fanout('packing:deleted')).toEqual([undefined]) // common -> room
    const missing = await call('packing.delete', { tripId: 1, itemId: 404 })
    expect((missing as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })
})

describe('create-rpc-host — Wave 1 wiring (weather/categories/tags/todos/roster/bags)', () => {
  const host = (...perms: string[]) => createRealRpcHost('w1', new Set(perms))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (h: ReturnType<typeof host>, method: string, params: Record<string, unknown>, uid: number | undefined = 5): Promise<any> =>
    h.dispatch({ k: 'req', id: 'x', method, params }, uid)
  beforeEach(() => { checkPermission.mockReset(); checkPermission.mockReturnValue(true) })
  afterAll(() => closePluginDataDb('w1'))

  it('weather + categories are tenant-free reads (no user needed)', async () => {
    expect((await call(host('weather:read'), 'weather.get', { lat: 48, lng: 11 }, undefined)).ok).toBe(true)
    expect((await call(host('db:read:categories'), 'categories.list', {}, undefined)).ok).toBe(true)
  })

  it('tags: list/create/update/delete are the acting user\'s; a missing tag is RESOURCE_FORBIDDEN', async () => {
    const h = host('db:read:tags', 'db:write:tags')
    expect((await call(h, 'tags.list', {}, 5)).ok).toBe(true)
    expect((await call(h, 'tags.create', { input: { name: 'x' } }, 5)).ok).toBe(true)
    expect((await call(h, 'tags.update', { tagId: 1, input: { name: 'y' } }, 5)).ok).toBe(true)
    expect((await call(h, 'tags.delete', { tagId: 1 }, 5)).ok).toBe(true)
    expect(((await call(h, 'tags.update', { tagId: 404, input: {} }, 5)) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    expect(((await call(h, 'tags.delete', { tagId: 404 }, 5)) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('trips.members returns the roster', async () => {
    const r = await call(host('db:read:trips'), 'trips.members', { tripId: 1 }, 5)
    expect(r.ok).toBe(true)
    expect(Array.isArray(r.result)).toBe(true)
  })

  it('todos list/create/update/delete run the wiring; a missing one is RESOURCE_FORBIDDEN', async () => {
    const h = host('db:write:todos', 'db:read:todos')
    expect((await call(h, 'todos.list', { tripId: 1 }, 5)).ok).toBe(true)
    expect((await call(h, 'todos.create', { tripId: 1, input: { name: 'Pack' } }, 5)).ok).toBe(true)
    expect((await call(h, 'todos.update', { tripId: 1, todoId: 90, input: { checked: 1 } }, 5)).ok).toBe(true)
    expect((await call(h, 'todos.delete', { tripId: 1, todoId: 90 }, 5)).ok).toBe(true)
    expect(((await call(h, 'todos.update', { tripId: 1, todoId: 404, input: {} }, 5)) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    expect(((await call(h, 'todos.delete', { tripId: 1, todoId: 404 }, 5)) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('packing bags list/create/update/delete/setMembers run the wiring', async () => {
    const h = host('db:write:packing')
    expect((await call(h, 'packing.listBags', { tripId: 1 }, 5)).ok).toBe(true)
    expect((await call(h, 'packing.createBag', { tripId: 1, input: { name: 'Bag' } }, 5)).ok).toBe(true)
    expect((await call(h, 'packing.updateBag', { tripId: 1, bagId: 80, input: { name: 'X' } }, 5)).ok).toBe(true)
    expect((await call(h, 'packing.setBagMembers', { tripId: 1, bagId: 80, userIds: [5] }, 5)).ok).toBe(true)
    expect((await call(h, 'packing.deleteBag', { tripId: 1, bagId: 80 }, 5)).ok).toBe(true)
    expect(((await call(h, 'packing.deleteBag', { tripId: 1, bagId: 404 }, 5)) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })
})

describe('create-rpc-host — Wave 2 wiring (atlas/vacay/journal/collections writes)', () => {
  const host = (...perms: string[]) => createRealRpcHost('w2', new Set(perms))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (h: ReturnType<typeof host>, method: string, params: Record<string, unknown>, uid: number | undefined = 5): Promise<any> =>
    h.dispatch({ k: 'req', id: 'x', method, params }, uid)
  beforeEach(() => { checkPermission.mockReset(); checkPermission.mockReturnValue(true); isAddonEnabled.mockReset(); isAddonEnabled.mockReturnValue(true) })
  afterAll(() => closePluginDataDb('w2'))

  it('atlas writes delegate uid-scoped; disabled addon refused; missing bucket item forbidden', async () => {
    const h = host('db:write:atlas')
    expect((await call(h, 'atlas.markCountry', { code: 'JP' })).ok).toBe(true)
    expect((await call(h, 'atlas.markRegion', { regionCode: 'JP-13', countryCode: 'JP' })).ok).toBe(true)
    expect((await call(h, 'atlas.unmarkRegion', { regionCode: 'JP-13' })).ok).toBe(true)
    expect((await call(h, 'atlas.createBucketItem', { input: { name: 'Kyoto' } })).ok).toBe(true)
    expect((await call(h, 'atlas.deleteBucketItem', { itemId: 110 })).ok).toBe(true)
    expect(((await call(h, 'atlas.deleteBucketItem', { itemId: 404 })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    isAddonEnabled.mockReturnValue(false)
    expect(((await call(h, 'atlas.markCountry', { code: 'JP' })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('vacay writes resolve the plan host-side from the acting user', async () => {
    const h = host('db:write:vacay')
    const r = await call(h, 'vacay.toggleEntry', { date: '2026-08-01' })
    expect(r.ok).toBe(true)
    expect(r.result).toMatchObject({ uid: 5, planId: 77 }) // uid + the user's own active plan, never a plugin-named one
    expect((await call(h, 'vacay.toggleCompanyHoliday', { date: '2026-12-24' })).ok).toBe(true)
  })

  it('journal writes map an uneditable journey/entry to RESOURCE_FORBIDDEN', async () => {
    const h = host('db:write:journal')
    expect((await call(h, 'journal.createEntry', { journeyId: 1, input: { entry_date: '2026-08-01' } })).ok).toBe(true)
    expect(((await call(h, 'journal.createEntry', { journeyId: 99, input: { entry_date: '2026-08-01' } })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    expect((await call(h, 'journal.updateEntry', { entryId: 120, input: { story: 'x' } })).ok).toBe(true)
    expect(((await call(h, 'journal.updateEntry', { entryId: 99, input: {} })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    expect((await call(h, 'journal.deleteEntry', { entryId: 120 })).ok).toBe(true)
    expect(((await call(h, 'journal.deleteEntry', { entryId: 99 })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('collections writes map the service 403/404 to RESOURCE_FORBIDDEN', async () => {
    const h = host('db:write:collections')
    expect((await call(h, 'collections.create', { input: { name: 'Tokyo eats' } })).ok).toBe(true)
    expect((await call(h, 'collections.update', { id: 1, input: { name: 'Renamed' } })).ok).toBe(true)
    expect(((await call(h, 'collections.update', { id: 99, input: { name: 'x' } })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN') // viewer-only 403
    expect(((await call(h, 'collections.update', { id: 404, input: { name: 'x' } })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN') // invisible 404
    expect((await call(h, 'collections.savePlace', { input: { collection_id: 1, name: 'Ramen' } })).ok).toBe(true)
    expect((await call(h, 'collections.copyToTrip', { input: { trip_id: 1, place_ids: [101] } })).ok).toBe(true)
    expect((await call(h, 'collections.deletePlace', { placeId: 101 })).ok).toBe(true)
    expect(((await call(h, 'collections.deletePlace', { placeId: 404 })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })
})

describe('create-rpc-host — Wave 3 wiring (files write / collab / member-add)', () => {
  const host = (...perms: string[]) => createRealRpcHost('w3', new Set(perms))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = async (h: ReturnType<typeof host>, method: string, params: Record<string, unknown>, uid: number | undefined = 5): Promise<any> =>
    h.dispatch({ k: 'req', id: 'x', method, params }, uid)
  beforeEach(() => { checkPermission.mockReset(); checkPermission.mockReturnValue(true); isAddonEnabled.mockReset(); isAddonEnabled.mockReturnValue(true); broadcast.mockClear() })
  afterAll(() => closePluginDataDb('w3'))

  it('files.create writes bytes, blocks bad extensions + foreign targets, broadcasts file:created', async () => {
    const h = host('db:write:files')
    const good = await call(h, 'files.create', { tripId: 1, input: { name: 'plan.pdf', content_base64: Buffer.from('hello').toString('base64') } })
    expect(good.ok).toBe(true)
    expect(broadcast.mock.calls.some((c) => c[1] === 'file:created')).toBe(true)
    expect(((await call(h, 'files.create', { tripId: 1, input: { name: 'evil.exe', content_base64: 'aGk=' } })) as { error: { code: string } }).error.code).toBe('BAD_PARAMS')
    expect(((await call(h, 'files.create', { tripId: 1, input: { name: 'noext', content_base64: 'aGk=' } })) as { error: { code: string } }).error.code).toBe('BAD_PARAMS')
    expect(((await call(h, 'files.create', { tripId: 1, input: { name: 'a.pdf', content_base64: 'aGk=', reservation_id: 999 } })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('files link/update/softDelete verify the file is on the trip + same-trip targets', async () => {
    const h = host('db:write:files')
    expect((await call(h, 'files.createLink', { tripId: 1, fileId: 130, opts: { place_id: 7 } })).ok).toBe(true)
    expect(((await call(h, 'files.createLink', { tripId: 1, fileId: 404, opts: {} })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    expect(((await call(h, 'files.createLink', { tripId: 1, fileId: 130, opts: { place_id: 999 } })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
    expect((await call(h, 'files.update', { tripId: 1, fileId: 130, input: { description: 'new' } })).ok).toBe(true)
    expect(broadcast.mock.calls.some((c) => c[1] === 'file:updated')).toBe(true)
    expect((await call(h, 'files.softDelete', { tripId: 1, fileId: 130 })).ok).toBe(true)
    expect(broadcast.mock.calls.some((c) => c[1] === 'file:deleted')).toBe(true)
    expect(((await call(h, 'files.softDelete', { tripId: 1, fileId: 404 })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('collab writes delegate + broadcast; service errors map to BAD_PARAMS; addon gated', async () => {
    const h = host('db:write:collab')
    expect((await call(h, 'collab.createNote', { tripId: 1, input: { title: 'Ideas' } })).ok).toBe(true)
    expect(broadcast.mock.calls.some((c) => c[1] === 'collab:note:created')).toBe(true)
    expect((await call(h, 'collab.createPoll', { tripId: 1, input: { question: 'Where?', options: ['A', 'B'] } })).ok).toBe(true)
    expect((await call(h, 'collab.votePoll', { tripId: 1, pollId: 141, optionIndex: 0 })).ok).toBe(true)
    expect(((await call(h, 'collab.votePoll', { tripId: 1, pollId: 141, optionIndex: 9 })) as { error: { code: string } }).error.code).toBe('BAD_PARAMS')
    expect((await call(h, 'collab.createMessage', { tripId: 1, text: 'hi' })).ok).toBe(true)
    expect(((await call(h, 'collab.createMessage', { tripId: 1, text: 'toolong' })) as { error: { code: string } }).error.code).toBe('BAD_PARAMS')
    isAddonEnabled.mockReturnValue(false)
    expect(((await call(h, 'collab.createNote', { tripId: 1, input: { title: 'x' } })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })

  it('trips.addMember verifies the target user exists and reports owner-add as joined:false', async () => {
    const h = host('db:write:members')
    const r = await call(h, 'trips.addMember', { tripId: 1, userId: 6 })
    expect(r.ok).toBe(true)
    expect(r.result).toMatchObject({ joined: true })
    const ownerAdd = await call(h, 'trips.addMember', { tripId: 1, userId: 5 }) // owner -> no-op
    expect(ownerAdd.result).toMatchObject({ joined: false })
    expect(((await call(h, 'trips.addMember', { tripId: 1, userId: 12345 })) as { error: { code: string } }).error.code).toBe('RESOURCE_FORBIDDEN')
  })
})
