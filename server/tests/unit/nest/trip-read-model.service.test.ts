/**
 * Unit tests for the DI-native TripReadModelService — TRIP-READ-001..006.
 * The two read aggregates (MCP summary + offline bundle) moved here when the
 * trips aggregate root was split; the happy-path aggregation cases stayed in
 * tests/unit/nest/trips.service.test.ts so that diff reads as a move. This file
 * pins the guards around them: the early returns, the falsy-price fold, the
 * checked tally and the viewer scoping that keeps other members' private
 * packing items (#858) out of both aggregates.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { DaysService } from '../../../src/nest/days/days.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { ReservationsReadRepository } from '../../../src/nest/reservations/reservations-read.repository';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { notificationsStub } from '../../helpers/notifications';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';

// Real sibling services over the same in-memory DB — the aggregation runs the
// actual SQL of every domain it fans out to, so a shape change downstream shows
// up here instead of being papered over by a stub.
const dbs = () => new DatabaseService(testDb);
const budgetSvc = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());
const daysSvc = new DaysService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new QueryHelpersService(dbs()));
// One shared cache instance (the PlacePhotoCacheService rule): the in-flight dedup in
// PlacePhotoCacheService only works while both consumers hold the same object.
const photoCache = new PlacePhotoCacheService(dbs(), makeStorageFixture('photos/google/').storage);
const placesSvc = new PlacesService(
  dbs(), new PermissionsService(dbs()), new RealtimeService(),
  new MapsService(dbs(), photoCache), new QueryHelpersService(dbs()),
  new UnsplashService(dbs(), new RuntimeEnvService(), makeStorageFixture('').storage), photoCache,
  new JourneyDomainService(dbs(), new RealtimeService(), new TrekPhotosRepository(dbs())),
  makeStorageFixture('').storage,
);
const accommodationsSvc = new AccommodationsService(dbs(), new PermissionsService(dbs()), new RealtimeService());
const membersSvc = new TripMembersService(dbs(), budgetSvc, new UserCleanupService(dbs(), budgetSvc), new PermissionsService(dbs()), new RealtimeService(), notificationsStub());

const buildReadModel = (database: DatabaseService, roster: TripMembersService = membersSvc) =>
  new TripReadModelService(
    database, roster, daysSvc, accommodationsSvc, budgetSvc,
    new PackingService(dbs(), new PermissionsService(dbs()), new RealtimeService(), notificationsStub()),
    new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService(), notificationsStub(), new ReservationsReadRepository(dbs())),
    new CollabService(dbs(), new PermissionsService(dbs()), new RealtimeService(), notificationsStub(), makeStorageFixture('').storage, new RateLimitService()),
    placesSvc,
    new TodoService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
    new FilesService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new EphemeralTokenService(), makeStorageFixture('').storage),
  );

const svc = buildReadModel(dbs());

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const addBudgetItem = (tripId: number, name: string, totalPrice: number) =>
  testDb.prepare("INSERT INTO budget_items (trip_id, category, name, total_price) VALUES (?, 'food', ?, ?)")
    .run(tripId, name, totalPrice);

const addPackingItem = (tripId: number, name: string, checked: number) =>
  testDb.prepare('INSERT INTO packing_items (trip_id, name, checked) VALUES (?, ?, ?)')
    .run(tripId, name, checked);

/**
 * A DatabaseService whose connection cannot resolve the owner lookup, standing in
 * for the trip row disappearing between the two SELECTs getTripSummary issues.
 * Only the read model's own two statements go through this connection; the
 * sibling services keep the real one.
 */
function ownerlessDbs(): DatabaseService {
  const conn = new Proxy(testDb, {
    get(target, prop) {
      if (prop === 'prepare') {
        return (sql: string) =>
          (sql.includes('SELECT user_id FROM trips') ? { get: () => undefined } : target.prepare(sql));
      }
      const v = (target as any)[prop];
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  return { connection: conn } as unknown as DatabaseService;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getTripSummary guards', () => {
  it('TRIP-READ-001: returns null for a missing trip instead of throwing', () => {
    // The MCP get_trip_summary tool hands over whatever id the model produced, so
    // an unknown id has to come back as an empty answer; a throw there surfaces as
    // a tool error rather than "no such trip".
    expect(svc.getTripSummary(99999)).toBeNull();
    expect(svc.getTripSummary(99999, 1)).toBeNull();
  });

  it('TRIP-READ-002: returns null when the owner row cannot be read', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // Trip row and owner id are two separate SELECTs; if the second one comes back
    // empty (trip deleted in between) the guard has to stop. Without it listMembers
    // runs with an undefined owner id and the summary reports an ownerless trip.
    expect(buildReadModel(ownerlessDbs()).getTripSummary(trip.id, owner.id)).toBeNull();

    // Same trip through the real connection still aggregates — the null above is
    // the missing owner row, not a broken fixture.
    expect(svc.getTripSummary(trip.id, owner.id)).not.toBeNull();
  });
});

describe('getTripSummary shaping', () => {
  it('TRIP-READ-003: folds a falsy total_price into the budget total instead of poisoning it', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addBudgetItem(trip.id, 'Dinner', 40);
    // total_price is NOT NULL DEFAULT 0, so 0 is the reachable falsy price: a free
    // entry someone logged to keep it on the list. The `|| 0` in the reduce is what
    // keeps any such value out of the sum — drop it and a price that arrives
    // non-numeric turns the whole trip total into NaN, which the MCP summary and
    // the offline clients both render as an empty budget.
    addBudgetItem(trip.id, 'Free walking tour', 0);

    const summary = svc.getTripSummary(trip.id, owner.id)!;
    expect(summary.budget.item_count).toBe(2);
    expect(summary.budget.total).toBe(40);
    expect(summary.budget.currency).toBe('EUR');
  });

  it('TRIP-READ-004: counts only checked packing items, not the whole list', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addPackingItem(trip.id, 'Socks', 1);
    addPackingItem(trip.id, 'Charger', 1);
    addPackingItem(trip.id, 'Passport', 0);

    // total and checked come from the same array; if the filter is ever widened the
    // packing progress the summary reports jumps to 100% while items are still open.
    const summary = svc.getTripSummary(trip.id, owner.id)!;
    expect(summary.packing.total).toBe(3);
    expect(summary.packing.checked).toBe(2);
  });
});

describe('bundle shaping', () => {
  it('TRIP-READ-005: keeps the member list a flat array when the roster has no members', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // The bundle spreads the roster's members into the array it ships offline. The
    // `|| []` is the guard for a roster shape without that array — without it the
    // spread throws and the whole offline bundle fails, taking days, places and
    // reservations down with it over a trip that simply has no collaborators.
    const roster = vi.spyOn(membersSvc, 'listMembers').mockReturnValue({
      owner: { id: owner.id, username: 'solo' }, members: undefined,
    } as never);
    try {
      const result = svc.bundle(String(trip.id), { user_id: owner.id }, owner.id) as any;
      expect(result.members).toEqual([{ id: owner.id, username: 'solo' }]);
    } finally {
      roster.mockRestore();
    }
  });

  it('TRIP-READ-006: drops a falsy owner rather than shipping a hole in the member list', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // filter(Boolean) exists because the owner lookup can come back empty (a user
    // row deleted while the trip lingers). Clients index the member list to render
    // avatars, so an undefined slot in it crashes the offline view.
    const roster = vi.spyOn(membersSvc, 'listMembers').mockReturnValue({
      owner: undefined, members: [{ id: 42, username: 'left-behind' }],
    } as never);
    try {
      const result = svc.bundle(String(trip.id), { user_id: owner.id }, owner.id) as any;
      expect(result.members).toEqual([{ id: 42, username: 'left-behind' }]);
    } finally {
      roster.mockRestore();
    }
  });
});

describe('private packing items stay viewer-scoped (#858)', () => {
  it("TRIP-READ-007: neither summary nor bundle leaks another member's private item", () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { start_date: '2025-06-01', end_date: '2025-06-02' });
    addTripMember(testDb, trip.id, viewer.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, 'Ring', 1, ?)")
      .run(trip.id, owner.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name) VALUES (?, 'Tent')").run(trip.id);

    // Both read paths pass the viewer into packing.listItems; that argument is the
    // ONLY thing filtering the list. If either call site loses it, listItems falls
    // back to the unfiltered query and the surprise the owner is carrying shows up
    // in the other member's MCP summary and in their offline cache.
    const asViewer = svc.getTripSummary(trip.id, viewer.id)!;
    expect(asViewer.packing.items.map((i: any) => i.name)).toEqual(['Tent']);
    expect(asViewer.packing.total).toBe(1);

    const bundled = svc.bundle(String(trip.id), { user_id: owner.id }, viewer.id) as any;
    expect(bundled.packingItems.map((i: any) => i.name)).toEqual(['Tent']);

    // The owner still sees their own private item through both paths, so the
    // assertions above are the filter working, not an empty fixture.
    expect(svc.getTripSummary(trip.id, owner.id)!.packing.items.map((i: any) => i.name)).toEqual(['Ring', 'Tent']);
    expect((svc.bundle(String(trip.id), { user_id: owner.id }, owner.id) as any)
      .packingItems.map((i: any) => i.name)).toEqual(['Ring', 'Tent']);
  });
});
