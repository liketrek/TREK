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

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
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
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { DaysService } from '../../../src/nest/days/days.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { ReservationsReadService } from '../../../src/nest/reservations/reservations-read.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { makeAccommodationsService } from '../../helpers/accommodations-service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { notificationsStub } from '../../helpers/notifications';
import { accommodationsOver } from '../../helpers/accommodations-service';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import {
  createTestUnitOfWork, createTestAppSettingsRepo, createTestUsersRepo, sharedTestOrm,
  createTestDaysRepo, createTestDayAssignmentsRepo, createTestDayNotesRepo, createTestTripsRepo,
  createTestTripMembersRepo, createTestTagsRepo, createTestPlaceRatingsRepo, createTestAssignmentParticipantsRepo,
  createTestGooglePlacePhotoMetaRepo, createTestPlacesRepo, createTestCategoriesRepo, createTestPlaceDetailsCacheRepo,
  createTestReservationsRepo,
  createTestReservationEndpointsRepo,
  createTestReservationTravelersRepo,
  createTestReservationDayPositionsRepo,
  createTestDayAccommodationsRepo,
  createTestRoadtripViasRepo,
  createTestRoadtripDayBoundariesRepo,
} from '../../helpers/test-uow';
import { createTestTripFilesRepo, createTestFileLinksRepo, createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import {
  createTestCollabMessageReactionsRepo, createTestCollabNotesRepo, createTestCollabPollsRepo,
  createTestCollabPollVotesRepo, createTestCollabLinksRepo, createTestCollabMessagesRepo,
} from '../../helpers/collab-repos';
import {
  createTestPackingItemsRepo, createTestPackingItemContributorsRepo, createTestPackingBagsRepo,
  createTestPackingCategoryAssigneesRepo, createTestPackingTemplatesRepo, createTestPackingTemplateCategoriesRepo,
  createTestPackingTemplateItemsRepo,
} from '../../helpers/packing-repos';
import { createTestTodoItemsRepo, createTestTodoCategoryAssigneesRepo } from '../../helpers/todo-repos';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';
import { createTestShareTokensRepo, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from '../../helpers/share-repos';
import { createTestCollectionPlacesRepo } from '../../helpers/test-uow';
import { noGoogleQuota } from '../../helpers/google-quota';

// Real sibling services over the same in-memory DB — the aggregation runs the
// actual SQL of every domain it fans out to, so a shape change downstream shows
// up here instead of being papered over by a stub.

// One shared cache instance (the PlacePhotoCacheService rule): the in-flight dedup in
// PlacePhotoCacheService only works while both consumers hold the same object.
// Plan 3c Task 1: built inside the async `beforeAll` below now — the
// constructor needs two repositories, resolved through `createTestOrm`.
let photoCache: PlacePhotoCacheService;

let accommodationsSvc: Awaited<ReturnType<typeof makeAccommodationsService>>;
beforeAll(async () => {
  accommodationsSvc = await makeAccommodationsService(testDb);
});
let budgetSvc: BudgetService;
let daysSvc: DaysService;
let placesSvc: PlacesService;
let membersSvc: TripMembersService;
beforeAll(async () => {
  photoCache = new PlacePhotoCacheService(
    makeStorageFixture('photos/google/').storage,
    await createTestGooglePlacePhotoMetaRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestCollectionPlacesRepo(testDb),
  );
  budgetSvc = new BudgetService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new ExchangeRatesService(), new RealtimeService(), await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb)));
  daysSvc = new DaysService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
    new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
    await createTestUnitOfWork(testDb),
    await createTestDaysRepo(testDb),
    await createTestDayAssignmentsRepo(testDb),
    await createTestDayNotesRepo(testDb),
    await createTestTripsRepo(testDb),
    await createTestReservationsRepo(testDb),
    await createTestReservationEndpointsRepo(testDb),
    await createTestDayAccommodationsRepo(testDb),
    await createTestRoadtripViasRepo(testDb),
    await createTestRoadtripDayBoundariesRepo(testDb),
  );
  placesSvc = new PlacesService(
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService(),
  new MapsService(photoCache, await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), await createTestPlaceDetailsCacheRepo(testDb), await createTestPlacesRepo(testDb), noGoogleQuota), new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
  new UnsplashService(await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), new RuntimeEnvService(), makeStorageFixture('').storage), photoCache,
  new JourneyDomainService(
    new RealtimeService(), new TrekPhotoRegistrationService((await sharedTestOrm(testDb)).repo(TrekPhotos), (await sharedTestOrm(testDb)).repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)), await createTestUnitOfWork(testDb),
    await createTestJourneysRepo(testDb), await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
    // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
    await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
  ),
  makeStorageFixture('').storage,
  await accommodationsOver(testDb), await createTestUnitOfWork(testDb),
  await createTestPlacesRepo(testDb),
  await createTestTagsRepo(testDb),
  await createTestPlaceRatingsRepo(testDb),
  await createTestTripMembersRepo(testDb),
  await createTestDayAssignmentsRepo(testDb),
  await createTestCategoriesRepo(testDb),
  await createTestTripsRepo(testDb),
  await createTestBudgetItemsRepo(testDb),
  await createTestCollectionPlacesRepo(testDb),
);
  membersSvc = new TripMembersService(budgetSvc, new UserCleanupService((await sharedTestOrm(testDb)).em, budgetSvc, await createTestUnitOfWork(testDb), await createTestUsersRepo(testDb), await createTestTripMembersRepo(testDb), await createTestBudgetItemsRepo(testDb), await createTestJourneyShareTokensRepo(testDb), await createTestJourneysRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestJourneyContributorsRepo(testDb), await createTestShareTokensRepo(testDb), await createTestPluginsRepo(testDb), await createTestPluginUserErasureQueueRepo(testDb)), new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService(), notificationsStub(), await createTestUnitOfWork(testDb), await createTestTripsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb));
});

const buildReadModel = async (tripsRepo: TripsRepository, roster: TripMembersService = membersSvc) =>
  new TripReadModelService(
    tripsRepo, roster, daysSvc, accommodationsSvc, budgetSvc,
    new PackingService(
      new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService(), notificationsStub(), await createTestUnitOfWork(testDb),
      await createTestPackingItemsRepo(testDb), await createTestPackingItemContributorsRepo(testDb), await createTestPackingBagsRepo(testDb),
      await createTestPackingCategoryAssigneesRepo(testDb), await createTestPackingTemplatesRepo(testDb), await createTestPackingTemplateCategoriesRepo(testDb),
      await createTestPackingTemplateItemsRepo(testDb), await createTestTripsRepo(testDb), await createTestTripMembersRepo(testDb),
    ),
    new ReservationsService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), budgetSvc, new RealtimeService(), notificationsStub(), new ReservationsReadService(await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb)), await accommodationsOver(testDb), await createTestUnitOfWork(testDb), await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb), await createTestReservationDayPositionsRepo(testDb), await createTestDayAccommodationsRepo(testDb), await createTestDaysRepo(testDb), await createTestPlacesRepo(testDb), await createTestDayAssignmentsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb), await createTestTripsRepo(testDb), await createTestBudgetItemsRepo(testDb)),
    new CollabService(
      // Plan 4 Task 2 — CollabService's own DatabaseService param is gone:
      // canAccessTrip now reads through the TripsRepository at the end.
      new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService(), notificationsStub(), makeStorageFixture('').storage, new RateLimitService(), await createTestUnitOfWork(testDb),
      await createTestCollabMessageReactionsRepo(testDb), await createTestCollabNotesRepo(testDb), await createTestCollabPollsRepo(testDb),
      await createTestCollabPollVotesRepo(testDb), await createTestCollabLinksRepo(testDb), await createTestCollabMessagesRepo(testDb),
      await createTestTripsRepo(testDb),
    ),
    placesSvc,
    new TodoService(
      new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService(), await createTestUnitOfWork(testDb),
      await createTestTodoItemsRepo(testDb), await createTestTodoCategoryAssigneesRepo(testDb),
      // Plan 4 Task 2 — TodoService's own canAccessTrip delegate is now
      // TripsRepository.findAccessible, a new trailing constructor param.
      await createTestTripsRepo(testDb),
      // Plan 4 Task 3 — DatabaseService.rosterUserIds inlined onto
      // TripMembersRepository.rosterUserIds directly.
      await createTestTripMembersRepo(testDb),
    ),
    new FilesService(
      // Plan 4 Task 2 — FilesService's own canAccessTrip delegate is now
      // TripsRepository.findAccessible, in the same constructor slot.
      await createTestTripsRepo(testDb),
      new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
      new RealtimeService(),
      new EphemeralTokenService(),
      makeStorageFixture('').storage,
      (await sharedTestOrm(testDb)).em,
      await createTestUnitOfWork(testDb),
      await createTestTripFilesRepo(testDb),
      await createTestFileLinksRepo(testDb),
      await createTestReservationsRepo(testDb),
      await createTestPlacesRepo(testDb),
      await createTestDayAssignmentsRepo(testDb),
      await createTestBudgetItemsRepo(testDb),
    ),
  );

let svc: Awaited<ReturnType<typeof buildReadModel>>;
let tripsRepo: TripsRepository;
beforeAll(async () => {
  tripsRepo = await createTestTripsRepo(testDb);
  svc = await buildReadModel(tripsRepo);
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

// R8 (Plan 3c program brief item 8): the SQL-text-keyed Proxy fault injection
// this file used to build (`ownerlessDbs`, keyed on the literal
// `'SELECT user_id FROM trips'` fragment) is rewritten onto a repository-level
// fault: TR-A's `getOwnerId` failing while TR-B's `findRaw` still succeeds —
// the trip row disappearing between the two reads `getTripSummary` issues.
function forceMissingOwner(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(tripsRepo, 'getOwnerId').mockResolvedValueOnce(null);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getTripSummary guards', () => {
  it('TRIP-READ-001: returns null for a missing trip instead of throwing', async () => {
    // The MCP get_trip_summary tool hands over whatever id the model produced, so
    // an unknown id has to come back as an empty answer; a throw there surfaces as
    // a tool error rather than "no such trip".
    expect(await svc.getTripSummary(99999)).toBeNull();
    expect(await svc.getTripSummary(99999, 1)).toBeNull();
  });

  it('TRIP-READ-002: returns null when the owner row cannot be read', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // Trip row and owner id are two separate reads; if the second one comes back
    // empty (trip deleted in between) the guard has to stop. Without it listMembers
    // runs with an undefined owner id and the summary reports an ownerless trip.
    const spy = forceMissingOwner();
    try {
      expect(await svc.getTripSummary(trip.id, owner.id)).toBeNull();
    } finally {
      spy.mockRestore();
    }

    // Same trip through the real repository still aggregates — the null above is
    // the missing owner row, not a broken fixture.
    expect(await svc.getTripSummary(trip.id, owner.id)).not.toBeNull();
  });
});

describe('getTripSummary — feed_token never reaches the wire (TR-B)', () => {
  it('TRIP-READ-002b: withoutFeedToken strips feed_token even though findRaw hands it back intact', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run('secret-anon-feed-credential', trip.id);

    // TripsRepository.findRaw is a plain `SELECT *` — it hands feed_token back
    // intact (proven directly, bypassing the service, so this test would fail
    // if the repository ever started blanking the column itself).
    expect((await tripsRepo.findRaw(trip.id))?.feed_token).toBe('secret-anon-feed-credential');

    // getTripSummary's own withoutFeedToken() strip is the only thing standing
    // between that credential and an MCP reader — assert it on the actual
    // result object, not just that the call succeeds.
    const summary = (await svc.getTripSummary(trip.id, owner.id))!;
    expect(summary.trip).not.toHaveProperty('feed_token');
    expect(JSON.stringify(summary)).not.toContain('secret-anon-feed-credential');
  });
});

describe('getTripSummary shaping', () => {
  it('TRIP-READ-003: folds a falsy total_price into the budget total instead of poisoning it', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addBudgetItem(trip.id, 'Dinner', 40);
    // total_price is NOT NULL DEFAULT 0, so 0 is the reachable falsy price: a free
    // entry someone logged to keep it on the list. The `|| 0` in the reduce is what
    // keeps any such value out of the sum — drop it and a price that arrives
    // non-numeric turns the whole trip total into NaN, which the MCP summary and
    // the offline clients both render as an empty budget.
    addBudgetItem(trip.id, 'Free walking tour', 0);

    const summary = (await svc.getTripSummary(trip.id, owner.id))!;
    expect(summary.budget.item_count).toBe(2);
    expect(summary.budget.total).toBe(40);
    expect(summary.budget.currency).toBe('EUR');
  });

  it('TRIP-READ-008: totals a foreign-currency bill in the trip currency, at its booked rate (#2525)', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addBudgetItem(trip.id, 'Dinner', 100);
    // 801.76 USD booked when a euro bought 1.17 dollars: 685.26 EUR of trip money. The
    // summary used to add the 801.76 to the euros and report 901.76 EUR.
    testDb.prepare("INSERT INTO budget_items (trip_id, category, name, total_price, currency, exchange_rate) VALUES (?, 'accommodation', 'Aparthotel Silver', 801.76, 'USD', 1.17)")
      .run(trip.id);

    const summary = (await svc.getTripSummary(trip.id, owner.id))!;
    expect(summary.budget.total).toBe(785.26);
    expect(summary.budget.by_category).toEqual({ food: 100, accommodation: 685.26 });
    expect(summary.budget.currency).toBe('EUR');
    // Both rows convert, so none is reported as left out of the total.
    expect(summary.budget.unconverted_item_ids).toEqual([]);
  });

  it('TRIP-READ-009: totals a trip saved without a currency in euros, the default the rest of the app reads it in (#2525)', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    testDb.prepare('UPDATE trips SET currency = NULL WHERE id = ?').run(trip.id);
    addBudgetItem(trip.id, 'Dinner', 100);
    // 117.33 USD booked at 1.1733 dollars to the euro is 100 EUR of trip money.
    testDb.prepare("INSERT INTO budget_items (trip_id, category, name, total_price, currency, exchange_rate) VALUES (?, 'transport', 'Taxi', 117.33, 'USD', 1.1733)")
      .run(trip.id);

    const summary = (await svc.getTripSummary(trip.id, owner.id))!;
    expect(summary.budget.total).toBe(200);
    expect(summary.budget.by_category).toEqual({ food: 100, transport: 100 });
    expect(summary.budget.currency).toBeNull();
  });

  it('TRIP-READ-004: counts only checked packing items, not the whole list', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addPackingItem(trip.id, 'Socks', 1);
    addPackingItem(trip.id, 'Charger', 1);
    addPackingItem(trip.id, 'Passport', 0);

    // total and checked come from the same array; if the filter is ever widened the
    // packing progress the summary reports jumps to 100% while items are still open.
    const summary = (await svc.getTripSummary(trip.id, owner.id))!;
    expect(summary.packing.total).toBe(3);
    expect(summary.packing.checked).toBe(2);
  });
});

describe('bundle shaping', () => {
  it('TRIP-READ-005: keeps the member list a flat array when the roster has no members', async () => {
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
      const result = (await svc.bundle(String(trip.id), { user_id: owner.id }, owner.id)) as any;
      expect(result.members).toEqual([{ id: owner.id, username: 'solo' }]);
    } finally {
      roster.mockRestore();
    }
  });

  it('TRIP-READ-006: drops a falsy owner rather than shipping a hole in the member list', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // filter(Boolean) exists because the owner lookup can come back empty (a user
    // row deleted while the trip lingers). Clients index the member list to render
    // avatars, so an undefined slot in it crashes the offline view.
    const roster = vi.spyOn(membersSvc, 'listMembers').mockReturnValue({
      owner: undefined, members: [{ id: 42, username: 'left-behind' }],
    } as never);
    try {
      const result = (await svc.bundle(String(trip.id), { user_id: owner.id }, owner.id)) as any;
      expect(result.members).toEqual([{ id: 42, username: 'left-behind' }]);
    } finally {
      roster.mockRestore();
    }
  });
});

describe('private packing items stay viewer-scoped (#858)', () => {
  it("TRIP-READ-007: neither summary nor bundle leaks another member's private item", async () => {
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
    const asViewer = (await svc.getTripSummary(trip.id, viewer.id))!;
    expect(asViewer.packing.items.map((i: any) => i.name)).toEqual(['Tent']);
    expect(asViewer.packing.total).toBe(1);

    const bundled = (await svc.bundle(String(trip.id), { user_id: owner.id }, viewer.id)) as any;
    expect(bundled.packingItems.map((i: any) => i.name)).toEqual(['Tent']);

    // The owner still sees their own private item through both paths, so the
    // assertions above are the filter working, not an empty fixture.
    expect((await svc.getTripSummary(trip.id, owner.id))!.packing.items.map((i: any) => i.name)).toEqual(['Ring', 'Tent']);
    expect(((await svc.bundle(String(trip.id), { user_id: owner.id }, owner.id)) as any)
      .packingItems.map((i: any) => i.name)).toEqual(['Ring', 'Tent']);
  });
});
