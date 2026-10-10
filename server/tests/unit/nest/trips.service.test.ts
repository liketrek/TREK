/**
 * Unit tests for the DI-native TripsService — TRIP-SVC-001 through TRIP-SVC-059
 * (001–038 moved 1:1 from the legacy tests/unit/services/tripService.test.ts;
 * the exportICS cases that duplicated the generateDays 010–012 numbering were
 * renumbered to 024–026 with the post-fold quirk-fix commit; 040–041 pinned
 * the deleted trips.bridge and died with it; 042–050 cover the folded
 * summary/list/create/delete/copy SQL; 051–053 pin the post-fold quirk fixes
 * (transactional deletes, owner display_name)). Uses a real in-memory SQLite
 * DB so SQL logic is exercised faithfully.
 *
 * The membership and read-aggregate cases now drive TripMembersService and
 * TripReadModelService, which is where that code went when the aggregate root
 * was split. They stayed in this file, over the same in-memory DB, so the diff
 * shows the move rather than a rewrite.
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
  };
    return mock;
});

// notifyInvite fires a notification via a dynamic import — keep it out of unit scope

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createPlace, createDay, createDayAssignment, createDayNote, addTripMember, createBudgetItem } from '../../helpers/factories';
import { createTestTourWaypointsRepo, createTour } from '../../helpers/tours-repos';
import { MAX_TRIP_DAYS, resolveDayGridRange, tripSpanDays } from '@trek/shared';
import { DaysService } from '../../../src/nest/days/days.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { ReservationsReadService } from '../../../src/nest/reservations/reservations-read.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { buildPlaceImportService } from '../../helpers/place-import';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { accommodationsOver, makeAccommodationsService } from '../../helpers/accommodations-service';
import { buildMapsService } from '../../helpers/maps-service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import fs from 'fs';
import path from 'path';
import { notificationsStub } from '../../helpers/notifications';
import { EphemeralTokenService } from '../../../src/nest/auth-core/ephemeral-token.service';
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
  createTestSettingsRepo,
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
  createTestVacayPlansRepo, createTestVacayPlanMembersRepo, createTestVacayYearsRepo, createTestVacayUserYearsRepo,
  createTestVacayUserColorsRepo, createTestVacayEntriesRepo, createTestVacayCompanyHolidaysRepo,
  createTestVacaySharesRepo, createTestVacayUserSettingsRepo,
} from '../../helpers/vacay-repos';
import { createTestVacayHolidayCalendarsRepo, createTestSchoolHolidayRegionsRepo } from '../../helpers/school-holidays-repos';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';
import { createTestShareTokensRepo, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from '../../helpers/share-repos';
import { createTestCollectionPlacesRepo } from '../../helpers/test-uow';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { noGoogleQuota } from '../../helpers/google-quota';
import { createTestBudgetSettlementsRepo } from '../../helpers/budget-repos';
import { MaintenanceRepository } from '../../../src/db/repositories/MaintenanceRepository';
import type { EntityClass, EntityDTO, FilterQuery, FindOptions } from '@mikro-orm/core';
import { countRows, deleteRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { setAppSetting, setUserSetting } from '../../helpers/factories/settings';
import { tagPlace } from '../../helpers/factories/places';
import { AssignmentParticipants } from '../../../src/db/entities/AssignmentParticipants.entity';
import { BudgetCategoryOrder } from '../../../src/db/entities/BudgetCategoryOrder.entity';
import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../../src/db/entities/BudgetItemPayers.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../../src/db/entities/DayNotes.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { PackingBags } from '../../../src/db/entities/PackingBags.entity';
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { RoadtripDayBoundaries } from '../../../src/db/entities/RoadtripDayBoundaries.entity';
import { RoadtripDayTracks } from '../../../src/db/entities/RoadtripDayTracks.entity';
import { RoadtripPreferences } from '../../../src/db/entities/RoadtripPreferences.entity';
import { RoadtripVias } from '../../../src/db/entities/RoadtripVias.entity';
import { Tags } from '../../../src/db/entities/Tags.entity';
import { TodoItems } from '../../../src/db/entities/TodoItems.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { legacyBoundIntegerText } from '../../../src/nest/common/row-id';
import { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';
import { FakeRealtimeService } from '../../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

const orm = () => sharedTestOrm(testDb);

/** The stored row matching `where`, or undefined when there is none. */
async function storedRow<T extends object>(entity: EntityClass<T>, where: FilterQuery<T>): Promise<EntityDTO<T> | undefined> {
  return (await findRow(await orm(), entity, where)) ?? undefined;
}

/** Only `cols` of a stored row, the way a SELECT of those columns returns it. */
function pickColumns<T extends object>(row: EntityDTO<T>, cols: string[]): Record<string, unknown> {
  const all = row as Record<string, unknown>;
  return Object.fromEntries(cols.map((col) => [col, all[col]]));
}

/** Only `cols` of the stored row matching `where`, or undefined when there is none. */
async function storedFields<T extends object>(
  entity: EntityClass<T>,
  where: FilterQuery<T>,
  cols: string[],
): Promise<Record<string, unknown> | undefined> {
  const row = await findRow(await orm(), entity, where);
  return row ? pickColumns(row, cols) : undefined;
}

/** The stored rows matching `where`, whole or cut down to `cols`. */
async function storedRows<T extends object>(
  entity: EntityClass<T>,
  where: FilterQuery<T>,
  orderBy?: FindOptions<T>['orderBy'],
  cols?: string[],
): Promise<Array<Record<string, unknown>>> {
  const rows = await findRows(await orm(), entity, where, orderBy);
  return cols ? rows.map((row) => pickColumns(row, cols)) : (rows as Array<Record<string, unknown>>);
}

/** The tag a place carries, read the way a `SELECT tag_id FROM place_tags` would. */
async function placeTagRow(placeId: number): Promise<{ tag_id: number } | undefined> {
  const [tag] = await findRows(await orm(), Tags, { place_tags_inverse: placeId });
  return tag ? { tag_id: tag.id } : undefined;
}

// Real sibling services over the same in-memory DB — updateTrip's date-shift
// resyncs and the summary/bundle aggregation run their actual SQL.
//
// Plan 3c Task 0b: `dbsEm` is resolved once, at the top of the first
// `beforeAll` below — `canAccessTrip`/`isOwner`/`rosterUserIds`/
// `getPlaceWithTags` resolve `TripsRepository`/`TripMembersRepository`/
// `PlacesRepository` through it. Plan 4 Task 4: `DatabaseService` itself is
// gone — `UserCleanupService` now takes this `EntityManager` directly.
let dbsEm: import('@mikro-orm/core').EntityManager | undefined;

// Same collaborator set the container hands PlacesService (see places.service.test.ts).
// Only the read-model aggregation reaches into places here, but the photo cache,
// Unsplash and journey domain are real instances over the same in-memory DB
// rather than casts: the place hooks are fire-and-forget behind a catch, so a
// missing collaborator would look like a pass while swallowing a TypeError.
// One PlacePhotoCacheService for both PlacesService and MapsService, matching
// production, where the in-flight dedup only works on a shared instance.
// Plan 3c Task 1: built inside the async `beforeAll` below now — the
// constructor needs two repositories, resolved through `createTestOrm`.
let photoCache: PlacePhotoCacheService;
const coversFx = makeStorageFixture('covers/');

let accommodationsSvc: Awaited<ReturnType<typeof makeAccommodationsService>>;
let createAccommodation: (...args: Parameters<typeof accommodationsSvc.createAccommodation>) => ReturnType<typeof accommodationsSvc.createAccommodation>;
beforeAll(async () => {
  accommodationsSvc = await makeAccommodationsService(testDb, realtime);
  createAccommodation = (...args) => accommodationsSvc.createAccommodation(...args);
});

let budgetSvc: BudgetService;
let daysSvc: DaysService;
let placesSvc: PlacesService;
let svc: TripsService;
let membersSvc: TripMembersService;
let readModelSvc: TripReadModelService;
beforeAll(async () => {
  dbsEm = (await sharedTestOrm(testDb)).em;
  photoCache = new PlacePhotoCacheService(
    makeStorageFixture('photos/google/').storage,
    await createTestGooglePlacePhotoMetaRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestCollectionPlacesRepo(testDb),
  );
  budgetSvc = new BudgetService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new ExchangeRatesService(), realtime, await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb)));
  daysSvc = new DaysService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    realtime,
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
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
  realtime,
  buildMapsService(photoCache, await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), await createTestPlaceDetailsCacheRepo(testDb), await createTestPlacesRepo(testDb), noGoogleQuota),
  new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
  new UnsplashService(await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), new RuntimeEnvService(), coversFx.storage),
  photoCache,
  new JourneyDomainService(
    realtime, new TrekPhotoRegistrationService(dbsEm!.getRepository(TrekPhotos), dbsEm!.getRepository(TripPhotos), dbsEm!.getRepository(JourneyPhotos)), await createTestUnitOfWork(testDb),
    await createTestJourneysRepo(testDb), await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
    // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
    await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
  ),
  makeStorageFixture('').storage,
  await accommodationsOver(testDb, realtime), await createTestUnitOfWork(testDb),
  await createTestPlacesRepo(testDb),
  await createTestTagsRepo(testDb),
  await createTestPlaceRatingsRepo(testDb),
  await createTestTripMembersRepo(testDb),
  await createTestDayAssignmentsRepo(testDb),
  await createTestCategoriesRepo(testDb),
  await createTestTripsRepo(testDb),
  await createTestBudgetItemsRepo(testDb),
  await createTestCollectionPlacesRepo(testDb),
  buildPlaceImportService(),
);
  svc = new TripsService(
  new ReservationsService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), budgetSvc, realtime, notificationsStub(), new ReservationsReadService(await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb)), accommodationsSvc, await createTestUnitOfWork(testDb), await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb), await createTestReservationDayPositionsRepo(testDb), await createTestDayAccommodationsRepo(testDb), await createTestDaysRepo(testDb), await createTestPlacesRepo(testDb), await createTestDayAssignmentsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb), await createTestTripsRepo(testDb), await createTestBudgetItemsRepo(testDb)),
  daysSvc,
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
  budgetSvc,
  new VacayService(
    await createTestVacayPlansRepo(testDb), await createTestVacayPlanMembersRepo(testDb),
    await createTestVacayYearsRepo(testDb), await createTestVacayUserYearsRepo(testDb),
    await createTestVacayUserColorsRepo(testDb), await createTestVacayEntriesRepo(testDb),
    await createTestVacayCompanyHolidaysRepo(testDb), await createTestVacayHolidayCalendarsRepo(testDb),
    await createTestVacaySharesRepo(testDb), await createTestVacayUserSettingsRepo(testDb),
    await createTestSchoolHolidayRegionsRepo(testDb),
    realtime, notificationsStub(), await createTestUnitOfWork(testDb),
  ),
  realtime,
  undefined as never, // unsplash — not exercised here
  coversFx.storage,
  await createTestUnitOfWork(testDb),
  (await sharedTestOrm(testDb)).em,
  new SettingsService(await createTestUnitOfWork(testDb), await createTestAppSettingsRepo(testDb), await createTestSettingsRepo(testDb)),
);
  membersSvc = new TripMembersService(budgetSvc, new UserCleanupService(new MaintenanceRepository(dbsEm!), budgetSvc, await createTestUnitOfWork(testDb), await createTestUsersRepo(testDb), await createTestTripMembersRepo(testDb), await createTestBudgetItemsRepo(testDb), await createTestBudgetSettlementsRepo(testDb), await createTestJourneyShareTokensRepo(testDb), await createTestJourneysRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestJourneyContributorsRepo(testDb), await createTestShareTokensRepo(testDb), await createTestPluginsRepo(testDb), await createTestPluginUserErasureQueueRepo(testDb)), new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), realtime, notificationsStub(), await createTestUnitOfWork(testDb), await createTestTripsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb));
  readModelSvc = new TripReadModelService(
  await createTestTripsRepo(testDb), membersSvc, daysSvc, accommodationsSvc, budgetSvc,
  new PackingService(
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), realtime, notificationsStub(), await createTestUnitOfWork(testDb),
  await createTestPackingItemsRepo(testDb), await createTestPackingItemContributorsRepo(testDb), await createTestPackingBagsRepo(testDb),
  await createTestPackingCategoryAssigneesRepo(testDb), await createTestPackingTemplatesRepo(testDb), await createTestPackingTemplateCategoriesRepo(testDb),
  await createTestPackingTemplateItemsRepo(testDb), await createTestTripsRepo(testDb), await createTestTripMembersRepo(testDb),
  ),
  new ReservationsService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), budgetSvc, realtime, notificationsStub(), new ReservationsReadService(await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb)), accommodationsSvc, await createTestUnitOfWork(testDb), await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb), await createTestReservationDayPositionsRepo(testDb), await createTestDayAccommodationsRepo(testDb), await createTestDaysRepo(testDb), await createTestPlacesRepo(testDb), await createTestDayAssignmentsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb), await createTestTripsRepo(testDb), await createTestBudgetItemsRepo(testDb)),
  new CollabService(
    // Plan 4 Task 2 — CollabService's own DatabaseService param is gone:
    // canAccessTrip now reads through the TripsRepository at the end.
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), realtime, notificationsStub(), coversFx.storage, new RateLimitService(), await createTestUnitOfWork(testDb),
    await createTestCollabMessageReactionsRepo(testDb), await createTestCollabNotesRepo(testDb), await createTestCollabPollsRepo(testDb),
    await createTestCollabPollVotesRepo(testDb), await createTestCollabLinksRepo(testDb), await createTestCollabMessagesRepo(testDb),
    await createTestTripsRepo(testDb),
  ),
  placesSvc,
  new TodoService(
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), realtime, await createTestUnitOfWork(testDb),
  await createTestTodoItemsRepo(testDb), await createTestTodoCategoryAssigneesRepo(testDb),
  new TripAccessService(await createTestTripsRepo(testDb)),
  await createTestTripMembersRepo(testDb),
  ),
  new FilesService(
    // Plan 4 Task 2 — FilesService's own canAccessTrip delegate is now
    // TripsRepository.findAccessible, in the same constructor slot.
    new TripAccessService(await createTestTripsRepo(testDb)),
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    realtime,
    new EphemeralTokenService(),
    coversFx.storage,
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
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getDays(tripId: number) {
  return await storedRows(Days, { trip: tripId }, { day_number: 'asc' }) as {
    id: number; trip_id: number; day_number: number; date: string | null;
  }[];
}

async function getAssignments(dayId: number) {
  return await storedRows(DayAssignments, { day: dayId }) as { id: number; day_id: number }[];
}

async function getNotes(dayId: number) {
  return await storedRows(DayNotes, { day: dayId }) as { id: number; day_id: number }[];
}

function addDaysIso(date: string, n: number) {
  return new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateDays', () => {
  it('TRIP-SVC-010: full range shift preserves day assignments and notes positionally', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const daysBefore = (await getDays(trip.id));
    expect(daysBefore).toHaveLength(5);

    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, daysBefore[0].id, place.id);
    const note = createDayNote(testDb, daysBefore[1].id, trip.id, { text: 'packed' });

    // Shift forward 9 days — zero overlap with original dates
    await svc.generateDays(trip.id, '2025-06-10', '2025-06-14');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-06-10', '2025-06-11', '2025-06-12', '2025-06-13', '2025-06-14',
    ]);

    // day_number 1 (formerly June 1) now has date June 10 — assignment still attached
    const day1 = daysAfter[0];
    const day2 = daysAfter[1];
    expect((await getAssignments(day1.id))).toHaveLength(1);
    expect((await getAssignments(day1.id))[0].id).toBe(assignment.id);
    expect((await getNotes(day2.id))).toHaveLength(1);
    expect((await getNotes(day2.id))[0].id).toBe(note.id);
  });

  it('TRIP-SVC-011: shrinking range deletes overflow days and their assignments (issue #909)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' });
    const daysBefore = (await getDays(trip.id));
    expect(daysBefore).toHaveLength(5);

    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, daysBefore[3].id, place.id);
    createDayAssignment(testDb, daysBefore[4].id, place.id);

    // Shrink from 5 to 3 days — surplus days and their content are removed
    await svc.generateDays(trip.id, '2025-07-01', '2025-07-03');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(3);
    expect(daysAfter.map(d => d.date)).toEqual(['2025-07-01', '2025-07-02', '2025-07-03']);
  });

  it('TRIP-SVC-016: shrinking range deletes empty overflow days (issue #909)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-07' });
    expect((await getDays(trip.id))).toHaveLength(7);

    // Shrink 7 → 5; days 6 and 7 have no content
    await svc.generateDays(trip.id, '2025-07-01', '2025-07-05');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-07-01', '2025-07-02', '2025-07-03', '2025-07-04', '2025-07-05',
    ]);
  });

  it('TRIP-SVC-012: growing range keeps existing day content and appends new empty days', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-08-01', end_date: '2025-08-03' });
    const daysBefore = (await getDays(trip.id));
    expect(daysBefore).toHaveLength(3);

    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, daysBefore[0].id, place.id);

    // Grow to 5 days
    await svc.generateDays(trip.id, '2025-08-01', '2025-08-05');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05',
    ]);

    // Existing day 1 retains its assignment
    expect((await getAssignments(daysAfter[0].id))).toHaveLength(1);
    expect((await getAssignments(daysAfter[0].id))[0].id).toBe(assignment.id);

    // New days 4 and 5 are empty
    expect((await getAssignments(daysAfter[3].id))).toHaveLength(0);
    expect((await getAssignments(daysAfter[4].id))).toHaveLength(0);
  });

  it('TRIP-SVC-062: a range longer than a year gets every one of its days (#2403)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-01-26', end_date: '2025-01-28' });
    // The reporter's range: 368 days, and the days used to stop at 365.
    await svc.generateDays(trip.id, '2025-01-26', '2026-01-28');
    const days = (await getDays(trip.id));
    expect(days).toHaveLength(368);
    expect(days[364].date).toBe('2026-01-25');
    expect(days[367]).toMatchObject({ day_number: 368, date: '2026-01-28' });
  });

  it('TRIP-SVC-063: a dateless day_count is clamped to MAX_TRIP_DAYS', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await svc.generateDays(trip.id, null, null, MAX_TRIP_DAYS + 50);
    expect((await getDays(trip.id))).toHaveLength(MAX_TRIP_DAYS);
  });

  it('TRIP-SVC-013: clearing dates converts all days to dateless without destroying assignments', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-09-01', end_date: '2025-09-04' });
    const daysBefore = (await getDays(trip.id));
    expect(daysBefore).toHaveLength(4);

    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, daysBefore[1].id, place.id);

    // Clear both dates
    await svc.generateDays(trip.id, null, null);

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(4);
    expect(daysAfter.every(d => d.date === null)).toBe(true);

    // The assignment on the former day 2 still exists
    const formerDay2 = daysAfter.find(d => d.id === daysBefore[1].id);
    expect(formerDay2).toBeDefined();
    expect((await getAssignments(formerDay2!.id))).toHaveLength(1);
    expect((await getAssignments(formerDay2!.id))[0].id).toBe(assignment.id);
  });

  it('TRIP-SVC-014: partial overlap shift remaps by position (day 1→3 kept, 4-5 overflow)', async () => {
    // Original: Jun 1-5. New: Jun 3-7 (overlap on Jun 3-5, but we map by position)
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-10-01', end_date: '2025-10-05' });
    const daysBefore = (await getDays(trip.id));
    const place = createPlace(testDb, trip.id);
    // Assign to each of the 5 days
    for (const day of daysBefore) createDayAssignment(testDb, day.id, place.id);

    // Shift forward 2 days (partial overlap with original range)
    await svc.generateDays(trip.id, '2025-10-03', '2025-10-07');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07',
    ]);

    // All 5 assignments survive
    for (const day of daysAfter) {
      expect((await getAssignments(day.id))).toHaveLength(1);
    }
  });

  it('TRIP-SVC-015: growing into dateless days reuses them; leftover dateless renumber without UNIQUE collision', async () => {
    // 3 dated days + 2 pre-existing dateless days. Resize to 4 dated days.
    // Main loop: dated[0..2] → positions 1-3, dateless[0] → position 4 (consumed).
    // Unused dateless: dateless[1] should land at position 5, NOT 4 (collision bug).
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-11-01', end_date: '2025-11-03' });

    // Insert 2 dateless days directly
    const daysBefore = (await getDays(trip.id));
    await insertRow(await orm(), Days, { trip: trip.id, day_number: 4, date: null });
    await insertRow(await orm(), Days, { trip: trip.id, day_number: 5, date: null });

    const allDays = (await getDays(trip.id));
    expect(allDays).toHaveLength(5);

    const place = createPlace(testDb, trip.id);
    // Put an assignment on the second dateless day (day_number=5) — it should survive
    const assignment = createDayAssignment(testDb, allDays[4].id, place.id);

    // Grow from 3 to 4 dated days — consumes dateless[0], leaves dateless[1] unused
    // This is the scenario that triggered the UNIQUE collision bug
    await svc.generateDays(trip.id, '2025-11-01', '2025-11-04');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(5);

    const dated = daysAfter.filter(d => d.date !== null);
    const dateless = daysAfter.filter(d => d.date === null);
    expect(dated).toHaveLength(4);
    expect(dateless).toHaveLength(1);

    // The remaining dateless day still has its assignment
    expect((await getAssignments(dateless[0].id))).toHaveLength(1);
    expect((await getAssignments(dateless[0].id))[0].id).toBe(assignment.id);

    // All day_numbers are unique 1..5
    const nums = daysAfter.map(d => d.day_number).sort((a, b) => a - b);
    expect(nums).toEqual([1, 2, 3, 4, 5]);
  });

  it('TRIP-SVC-017: switching a dateless trip to a shorter dated range drops empty leftover days but keeps ones with content (#1083)', async () => {
    const { user } = createUser(testDb);
    // A 7-day trip, then cleared to dateless placeholders (day_count = 7).
    const trip = createTrip(testDb, user.id, { start_date: '2025-12-01', end_date: '2025-12-07' });
    await svc.generateDays(trip.id, null, null);
    const dateless = (await getDays(trip.id));
    expect(dateless).toHaveLength(7);
    expect(dateless.every(d => d.date === null)).toBe(true);

    // Give the LAST dateless day real content so it must be preserved.
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, dateless[6].id, place.id);

    // Now set an explicit 2-day range. The first two dateless days are reused for
    // the dates; the four empty leftovers must be removed, the one with content kept.
    await svc.generateDays(trip.id, '2026-01-10', '2026-01-11');

    const daysAfter = (await getDays(trip.id));
    const dated = daysAfter.filter(d => d.date !== null);
    const stillDateless = daysAfter.filter(d => d.date === null);
    expect(dated.map(d => d.date)).toEqual(['2026-01-10', '2026-01-11']);
    // day_count is COUNT(*) FROM days: 2 dated + 1 content-bearing dateless = 3 (not the stale 7)
    expect(daysAfter).toHaveLength(3);
    expect(stillDateless).toHaveLength(1);
    expect((await getAssignments(stillDateless[0].id))[0].id).toBe(assignment.id);
  });

  // ── generateDays carries out the shared planDayGrid plan ──────────────────
  // The trip dialog warns about lost days by the same plan, so the plan has to
  // be exactly what the rebuild did before it was written down in shared.

  async function addUndatedDay(tripId: number) {
    const [last] = await findRows(await orm(), Days, { trip: tripId }, { day_number: 'desc' });
    const next = (last?.day_number ?? 0) + 1;
    const id = Number(await insertRow(await orm(), Days, { trip: tripId, day_number: next, date: null }));
    return id;
  }

  async function addStay(tripId: number, placeId: number, startDayId: number, endDayId: number) {
    return Number(await insertRow(await orm(), DayAccommodations, { trip: tripId, place: placeId, startDay: startDayId, endDay: endDayId }));
  }

  const stayExists = async (id: number) => !!await storedRow(DayAccommodations, { id });

  it('TRIP-SVC-074: a stay from a removed day to a spare day goes, and the spare day it left empty goes too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' });
    const days = (await getDays(trip.id));
    const spare = await addUndatedDay(trip.id);
    const place = createPlace(testDb, trip.id);
    const stay = await addStay(trip.id, place.id, days[4].id, spare);

    const plan = await svc.generateDays(trip.id, '2025-07-01', '2025-07-04');

    expect(plan.removed.map(r => [r.id, r.reason])).toEqual([[days[4].id, 'overflow'], [spare, 'spare']]);
    expect(await stayExists(stay)).toBe(false);
    expect((await getDays(trip.id)).map(d => d.id)).toEqual(days.slice(0, 4).map(d => d.id));
  });

  it('TRIP-SVC-075: only moving the dates drops an empty spare day and keeps one with a note', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-03' });
    const empty = await addUndatedDay(trip.id);
    const noted = await addUndatedDay(trip.id);
    createDayNote(testDb, noted, trip.id, { text: 'Buffer' });

    const plan = await svc.generateDays(trip.id, '2025-07-11', '2025-07-13');

    expect(plan.removed).toEqual([{ id: empty, day_number: 4, date: null, reason: 'spare' }]);
    const after = (await getDays(trip.id));
    expect(after.map(d => d.date)).toEqual(['2025-07-11', '2025-07-12', '2025-07-13', null]);
    expect(after[3]).toMatchObject({ id: noted, day_number: 4 });
    expect((await getNotes(noted))).toHaveLength(1);
  });

  it('TRIP-SVC-076: without dates only empty days are trimmed, the highest numbers first', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const ids: number[] = [];
    for (let i = 0; i < 6; i++) ids.push(await addUndatedDay(trip.id));
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, ids[1], place.id);
    createDayAssignment(testDb, ids[5], place.id);

    const plan = await svc.generateDays(trip.id, null, null, 3);

    expect(plan.removed.map(r => r.id)).toEqual([ids[4], ids[3], ids[2]]);
    expect((await getDays(trip.id)).map(d => [d.id, d.day_number])).toEqual([[ids[0], 1], [ids[1], 2], [ids[5], 3]]);
  });

  it('TRIP-SVC-077: generateDays returns the plan it carried out', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-03' });
    const before = (await getDays(trip.id));
    const spare = await addUndatedDay(trip.id);

    const plan = await svc.generateDays(trip.id, '2025-07-01', '2025-07-06');

    const after = (await getDays(trip.id));
    expect(plan.removed).toEqual([]);
    expect(plan.rows.map(r => r.date)).toEqual(after.map(d => d.date));
    expect(plan.rows.slice(0, 4).map(r => r.id)).toEqual([...before.map(d => d.id), spare]);
    // New rows come back without an id and are the rows the insert created.
    expect(plan.rows.slice(4).map(r => r.id)).toEqual([null, null]);
    expect(after.slice(4).every(d => !before.some(b => b.id === d.id) && d.id !== spare)).toBe(true);

    const shrink = await svc.generateDays(trip.id, '2025-07-01', '2025-07-02');
    expect(shrink.removed.map(r => r.id)).toEqual(after.slice(2).map(d => d.id));
    expect((await getDays(trip.id)).map(d => d.id)).toEqual(shrink.rows.map(r => r.id));
  });

  it('TRIP-SVC-078: fuzz, 300 random day grids end exactly where the rebuild before the shared plan left them', async () => {
    // The rebuild as it stood before planDayGrid, kept here as the oracle.
    function legacyGenerateDays(tripId: number, startDate: string | null, endDate: string | null, dayCount?: number) {
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      const existing = testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; day_number: number; date: string | null }[];
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      const setDayNumber = testDb.prepare('UPDATE days SET day_number = ? WHERE id = ?');
      const renumber = (list: { id: number }[]) => {
        list.forEach((d, i) => setDayNumber.run(-(i + 1), d.id));
        list.forEach((d, i) => setDayNumber.run(i + 1, d.id));
      };
      if (!startDate || !endDate) {
        // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
        for (const d of existing.filter(d => d.date)) testDb.prepare('UPDATE days SET date = NULL WHERE id = ?').run(d.id);
        // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
        const all = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[];
        const target = Math.min(Math.max(dayCount ?? (all.length || 7), 1), MAX_TRIP_DAYS);
        const needed = target - all.length;
        if (needed > 0) {
          // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
          for (let i = 0; i < needed; i++) testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)').run(tripId, all.length + i + 1);
        } else if (needed < 0) {
          // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
          const candidates = testDb.prepare(
            `SELECT d.id FROM days d WHERE d.trip_id = ?
               AND NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = d.id)
               AND NOT EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = d.id)
               AND NOT EXISTS (SELECT 1 FROM day_accommodations dac WHERE dac.start_day_id = d.id OR dac.end_day_id = d.id)
             ORDER BY d.day_number DESC LIMIT ?`,
          ).all(tripId, -needed) as { id: number }[];
          // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
          for (const d of candidates) testDb.prepare('DELETE FROM days WHERE id = ?').run(d.id);
        }
        // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
        renumber(testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[]);
        return;
      }
      const numDays = tripSpanDays(startDate, endDate);
      const targetDates = Array.from({ length: Math.max(numDays, 0) }, (_, i) => addDaysIso(startDate, i));
      const dated = existing.filter(d => d.date).sort((a, b) => a.day_number - b.day_number);
      const dateless = existing.filter(d => !d.date).sort((a, b) => a.day_number - b.day_number);
      [...dated, ...dateless].forEach((d, i) => setDayNumber.run(-(i + 1), d.id));
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      const assignDay = testDb.prepare('UPDATE days SET date = ?, day_number = ? WHERE id = ?');
      let datelessIdx = 0;
      targetDates.forEach((date, i) => {
        if (i < dated.length) assignDay.run(date, i + 1, dated[i].id);
        else if (datelessIdx < dateless.length) assignDay.run(date, i + 1, dateless[datelessIdx++].id);
        // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
        else testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)').run(tripId, i + 1, date);
      });
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      for (let i = targetDates.length; i < dated.length; i++) testDb.prepare('DELETE FROM days WHERE id = ?').run(dated[i].id);
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      const isEmpty = testDb.prepare(
        `SELECT NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = @id)
              AND NOT EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = @id)
              AND NOT EXISTS (SELECT 1 FROM day_accommodations dac WHERE dac.start_day_id = @id OR dac.end_day_id = @id) AS empty`,
      );
      const maxAssigned = Math.max(targetDates.length, dated.length);
      let kept = 0;
      for (let i = datelessIdx; i < dateless.length; i++) {
        // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
        if ((isEmpty.get({ id: dateless[i].id }) as { empty: number }).empty) testDb.prepare('DELETE FROM days WHERE id = ?').run(dateless[i].id);
        else setDayNumber.run(maxAssigned + ++kept, dateless[i].id);
      }
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      renumber(testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[]);
    }

    // A seeded generator, so a failure names a grid that can be replayed.
    let seed = 20260923;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

    const snapshot = (tripId: number) => ({
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      days: testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId),
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      stays: testDb.prepare('SELECT id FROM day_accommodations WHERE trip_id = ? ORDER BY id').all(tripId),
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      assignments: testDb.prepare(
        'SELECT da.id, da.day_id FROM day_assignments da JOIN days d ON d.id = da.day_id WHERE d.trip_id = ? ORDER BY da.id',
      ).all(tripId),
      // test-sql-allow: the legacy rebuild oracle runs inside a synchronous transaction it rolls back, so it stays on the raw handle.
      notes: testDb.prepare('SELECT id, day_id FROM day_notes WHERE trip_id = ? ORDER BY id').all(tripId),
    });
    const ROLLBACK = new Error('rollback');

    const { user } = createUser(testDb);
    let removing = 0;
    for (let round = 0; round < 300; round++) {
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id);
      const dayIds: number[] = [];
      const count = int(0, 9);
      for (let n = 1; n <= count; n++) {
        const date = rand() < 0.7 ? addDaysIso('2026-03-20', int(0, 20)) : null;
        const id = await insertRow(await orm(), Days, { trip: trip.id, day_number: n, date });
        dayIds.push(id);
        if (rand() < 0.3) createDayAssignment(testDb, id, place.id);
        if (rand() < 0.2) createDayNote(testDb, id, trip.id);
      }
      if (dayIds.length > 0) {
        for (let k = int(0, 3); k > 0; k--) await addStay(trip.id, place.id, dayIds[int(0, dayIds.length - 1)], dayIds[int(0, dayIds.length - 1)]);
      }
      let range: [string | null, string | null, number | undefined];
      if (rand() < 0.25) {
        range = [null, null, rand() < 0.4 ? undefined : int(1, 12)];
      } else {
        const start = addDaysIso('2026-03-15', int(0, 20));
        range = [start, addDaysIso(start, int(0, 11)), rand() < 0.8 ? undefined : int(1, 12)];
      }

      const before = snapshot(trip.id);
      let expected: ReturnType<typeof snapshot> | undefined;
      try {
        testDb.transaction(() => {
          legacyGenerateDays(trip.id, ...range);
          expected = snapshot(trip.id);
          throw ROLLBACK;
        })();
      } catch (err) {
        if (err !== ROLLBACK) throw err;
      }
      expect(snapshot(trip.id), `round ${round}: the oracle must leave no trace`).toEqual(before);

      const plan = await svc.generateDays(trip.id, ...range);
      const actual = snapshot(trip.id);
      expect(actual, `round ${round}: ${JSON.stringify({ range, before: before.days })}`).toEqual(expected);
      const survivors = new Set((actual.days as { id: number }[]).map(d => d.id));
      expect(plan.removed.map(r => r.id).sort((a, b) => a - b), `round ${round}: removed`)
        .toEqual((before.days as { id: number }[]).map(d => d.id).filter(id => !survivors.has(id)).sort((a, b) => a - b));
      if (plan.removed.length > 0) removing++;
    }
    // The grids are random, not easy: plenty of them lose days.
    expect(removing).toBeGreaterThan(60);
  });

  it('TRIP-SVC-079: resolveRange reads a range the way the shared resolveDayGridRange does, a day_count of 0 included', async () => {
    const { user } = createUser(testDb);
    const dated = (await svc.getRaw(createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' }).id))!;
    const undated = (await svc.getRaw(createTrip(testDb, user.id).id))!;
    const resolve = (trip: typeof dated, data: Parameters<typeof svc.updateTrip>[2]) => svc['resolveRange'](trip, data);
    const cases: [typeof dated, Parameters<typeof svc.updateTrip>[2]][] = [
      [dated, {}],
      [dated, { title: 'Renamed' }],
      [dated, { end_date: '2025-07-03' }],
      [dated, { start_date: '2025-07-03', end_date: '2025-07-05' }],
      [dated, { start_date: null, end_date: null }],
      [dated, { start_date: null, end_date: null, day_count: 3 }],
      [undated, { day_count: 0 }],
      [undated, { day_count: 4 }],
      [undated, { day_count: MAX_TRIP_DAYS + 1 }],
      [undated, { start_date: '2025-07-01', end_date: '2025-07-02' }],
    ];
    for (const [trip, data] of cases) expect(resolve(trip, data), JSON.stringify(data)).toEqual(resolveDayGridRange(trip, data));
    expect(resolve(undated, { day_count: 0 }).regenerate).toBe(false);
    // The refusals stay on the server side of the rule.
    expect(() => resolve(dated, { start_date: '2025-07-05', end_date: '2025-07-01' })).toThrow('End date must be after start date');
    expect(() => resolve(dated, { end_date: '2025-06-30' })).toThrow('End date must be after start date');
  });
});

// ── deleteOldCover — path containment ──────────────────────────────────────────

describe('deleteOldCover', () => {
  it('TRIP-SVC-COVER-001: never deletes outside the covers category for a crafted cover_image', async () => {
    // Attacker-controlled values aimed at auth-gated sibling upload dirs — the
    // basename + category addressing keeps every delete inside covers/.
    const filesDir = path.join(coversFx.root, 'files');
    const avatarsDir = path.join(coversFx.root, 'avatars');
    fs.mkdirSync(filesDir, { recursive: true });
    fs.mkdirSync(avatarsDir, { recursive: true });
    const secret = path.join(filesDir, 'secret.pdf');
    const someone = path.join(avatarsDir, 'someone.png');
    fs.writeFileSync(secret, 'pdf');
    fs.writeFileSync(someone, 'png');

    await svc.deleteOldCover('/uploads/files/secret.pdf');
    await svc.deleteOldCover('/uploads/covers/../files/secret.pdf');
    await svc.deleteOldCover('/uploads/avatars/someone.png');

    expect(fs.existsSync(secret)).toBe(true);
    expect(fs.existsSync(someone)).toBe(true);
  });

  it('TRIP-SVC-COVER-002: deletes a legitimate cover file', async () => {
    const coversDir = path.join(coversFx.root, 'covers');
    fs.mkdirSync(coversDir, { recursive: true });
    const cover = path.join(coversDir, 'abc123.jpg');
    fs.writeFileSync(cover, 'jpeg');

    await svc.deleteOldCover('/uploads/covers/abc123.jpg');
    expect(fs.existsSync(cover)).toBe(false);
  });

  it('TRIP-SVC-COVER-003: an external https cover URL is tolerated (no throw)', async () => {
    await expect(svc.deleteOldCover('https://example.com/some/pic.jpg')).resolves.toBeUndefined();
    await expect(svc.deleteOldCover(null)).resolves.toBeUndefined();
  });
});

describe('resyncReservationDays (#1288)', () => {
  const dayFor = async (tripId: number, date: string) =>
    (await storedFields(Days, { trip: tripId, date }, ['id']) as { id: number }).id;
  const insertDatedReservation = async (tripId: number, dayId: number, time: string) =>
    Number(await insertRow(await orm(), Reservations, { trip: tripId, day: dayId, title: 'Dinner', reservation_time: time, type: 'restaurant', status: 'pending' }));

  it('TRIP-SVC-018: changing the start date re-anchors a dated reservation to the day matching its time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const resId = (await insertDatedReservation(trip.id, (await dayFor(trip.id, '2025-06-02')), '2025-06-02T19:00:00'));
    // Shift the whole range one day forward (days become 2025-06-02..06).
    await svc.updateTrip(trip.id, user.id, { start_date: '2025-06-02', end_date: '2025-06-06' }, 'user');
    const res = await storedFields(Reservations, { id: resId }, ['day_id']) as { day_id: number };
    // The booking stays on its absolute date (2025-06-02) instead of shifting with its old day row.
    expect(res.day_id).toBe((await dayFor(trip.id, '2025-06-02')));
  });

  it('TRIP-SVC-018b: the trip row and its rebuilt days are one write: a failing rebuild keeps the old dates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const days = await createTestDaysRepo(testDb);
    const spy = vi.spyOn(days, 'listOrderedForReorder').mockRejectedValueOnce(new Error('boom'));

    await expect(svc.updateTrip(trip.id, user.id, { start_date: '2025-06-02', end_date: '2025-06-06' }, 'user')).rejects.toThrow('boom');

    expect(await storedFields(Trips, { id: trip.id }, ['start_date', 'end_date']))
      .toEqual({ start_date: '2025-06-01', end_date: '2025-06-05' });
    spy.mockRestore();
  });

  it('TRIP-SVC-019: a reservation whose date falls outside the new range keeps its day_id (not nulled)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const origDayId = (await dayFor(trip.id, '2025-06-02'));
    const resId = (await insertDatedReservation(trip.id, origDayId, '2025-06-02T19:00:00'));
    // Shift far forward so 2025-06-02 is no longer covered by any day.
    await svc.updateTrip(trip.id, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' }, 'user');
    const res = await storedFields(Reservations, { id: resId }, ['day_id']) as { day_id: number };
    expect(res.day_id).toBe(origDayId);
  });
});

describe('resyncAccommodationDays (#1288)', () => {
  const dayFor = async (tripId: number, date: string) =>
    (await storedFields(Days, { trip: tripId, date }, ['id']) as { id: number }).id;

  const insertAccommodation = async (tripId: number, startDayId: number, endDayId: number) => {
    const place = createPlace(testDb, tripId, { name: 'Grand Hotel' });
    const { accommodation: acc } = (await createAccommodation(tripId, {
      place_id: place.id, start_day_id: startDayId, end_day_id: endDayId,
    })) as { accommodation: { id: number } };
    const linkedRes = await storedFields(Reservations, { accommodation_id: legacyBoundIntegerText(acc.id) }, ['id']) as { id: number };
    return { accId: acc.id, linkedResId: linkedRes.id };
  };

  const getAcc = async (id: number) =>
    await storedFields(DayAccommodations, { id }, ['start_day_id', 'end_day_id']) as
      { start_day_id: number; end_day_id: number };
  const getRes = async (id: number) =>
    await storedFields(Reservations, { id }, ['day_id', 'reservation_time']) as
      { day_id: number | null; reservation_time: string | null };

  it('TRIP-SVC-035: extending the start keeps an accommodation on its absolute dates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' });
    const { accId, linkedResId } = await insertAccommodation(trip.id, (await dayFor(trip.id, '2025-06-11')), (await dayFor(trip.id, '2025-06-13')));
    // Add a day at the start: days re-date positionally (old 06-11 row becomes 06-10, …).
    await svc.updateTrip(trip.id, user.id, { start_date: '2025-06-09', end_date: '2025-06-14' }, 'user');
    const acc = (await getAcc(accId));
    expect(acc.start_day_id).toBe((await dayFor(trip.id, '2025-06-11')));
    expect(acc.end_day_id).toBe((await dayFor(trip.id, '2025-06-13')));
    const res = (await getRes(linkedResId));
    expect(res.day_id).toBe(acc.start_day_id);
    expect(res.reservation_time?.slice(0, 10)).toBe('2025-06-11');
  });

  it('TRIP-SVC-059: the day stop a booking wrote follows it when the trip is re-dated', async () => {
    // Booking a night also puts its place on the check-in day. Re-dating the trip moves
    // the stay to whichever day row now carries its date, and the stop has to go with
    // it, or the route runs through a day the traveller is no longer staying on.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' });
    const { accId } = await insertAccommodation(trip.id, (await dayFor(trip.id, '2025-06-11')), (await dayFor(trip.id, '2025-06-13')));
    const stopOf = async () => await storedFields(DayAssignments, { accommodation_id: accId }, ['day_id']) as { day_id: number };
    expect((await stopOf()).day_id).toBe((await dayFor(trip.id, '2025-06-11')));

    await svc.updateTrip(trip.id, user.id, { start_date: '2025-06-09', end_date: '2025-06-14' }, 'user');

    expect((await stopOf()).day_id).toBe((await getAcc(accId)).start_day_id);
    expect((await stopOf()).day_id).toBe((await dayFor(trip.id, '2025-06-11')));
  });

  it('TRIP-SVC-036: moving the whole trip out of the old range keeps the accommodation glued to its days', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const startDayId = (await dayFor(trip.id, '2025-06-02'));
    const endDayId = (await dayFor(trip.id, '2025-06-03'));
    const { accId, linkedResId } = await insertAccommodation(trip.id, startDayId, endDayId);
    await svc.updateTrip(trip.id, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' }, 'user');
    const acc = (await getAcc(accId));
    expect(acc.start_day_id).toBe(startDayId);
    expect(acc.end_day_id).toBe(endDayId);
    // The linked reservation follows the (re-dated) start day instead of keeping a stale date snapshot.
    const res = (await getRes(linkedResId));
    expect(res.day_id).toBe(startDayId);
    expect(res.reservation_time?.slice(0, 10)).toBe('2025-07-02');
  });

  it("TRIP-SVC-038: date_shift_mode 'shift_all' glues bookings to their days and restamps their times", async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const origDayId = (await dayFor(trip.id, '2025-06-02'));
    const resId = Number(await insertRow(await orm(), Reservations, { trip: trip.id, day: origDayId, title: 'Dinner', reservation_time: '2025-06-02T19:00:00', type: 'restaurant', status: 'pending' }));
    const { accId } = await insertAccommodation(trip.id, origDayId, (await dayFor(trip.id, '2025-06-03')));
    await svc.updateTrip(trip.id, user.id, { start_date: '2025-06-03', end_date: '2025-06-07', date_shift_mode: 'shift_all' }, 'user');
    // The booking stays on its day row (now 2025-06-04) and its time follows.
    const res = await storedFields(Reservations, { id: resId }, ['day_id', 'reservation_time']) as
      { day_id: number; reservation_time: string };
    expect(res.day_id).toBe(origDayId);
    expect(res.reservation_time).toBe('2025-06-04T19:00:00');
    // The accommodation stays glued to its (re-dated) day rows too.
    const acc = (await getAcc(accId));
    expect(acc.start_day_id).toBe(origDayId);
  });

  it('TRIP-SVC-037: a dated hotel reservation without a linked accommodation is re-anchored like other bookings', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const resId = Number(await insertRow(await orm(), Reservations, { trip: trip.id, day: (await dayFor(trip.id, '2025-06-02')), title: 'Imported hotel', reservation_time: '2025-06-02T15:00:00', type: 'hotel', status: 'pending' }));
    await svc.updateTrip(trip.id, user.id, { start_date: '2025-06-02', end_date: '2025-06-06' }, 'user');
    const res = await storedFields(Reservations, { id: resId }, ['day_id']) as { day_id: number };
    expect(res.day_id).toBe((await dayFor(trip.id, '2025-06-02')));
  });
});

describe('transferOwnership (#973)', () => {
  it('TRIP-SVC-020: hands the trip to a member and demotes the former owner to a member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const result = await membersSvc.transferOwnership(trip.id, member.id, owner.id);
    expect(result.toEmail).toBe(member.email);

    const updated = await storedFields(Trips, { id: trip.id }, ['user_id']) as { user_id: number };
    expect(updated.user_id).toBe(member.id);

    // New owner no longer sits in trip_members, former owner now does.
    const memberIds = (await storedRows(TripMembers, { trip: trip.id }, undefined, ['user_id']) as { user_id: number }[]).map(r => r.user_id);
    expect(memberIds).toContain(owner.id);
    expect(memberIds).not.toContain(member.id);
  });

  it('TRIP-SVC-021: rejects a transfer from a non-owner', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    // member (not the owner) attempts the transfer
    await expect(membersSvc.transferOwnership(trip.id, member.id, member.id)).rejects.toThrow();
  });

  it('TRIP-SVC-022: rejects a transfer to someone who is not a member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await expect(membersSvc.transferOwnership(trip.id, stranger.id, owner.id)).rejects.toThrow('New owner must be a trip member');
  });

  it('TRIP-SVC-023: rejects transferring to yourself', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await expect(membersSvc.transferOwnership(trip.id, owner.id, owner.id)).rejects.toThrow('You already own this trip');
  });
});

describe('guest members (#1362)', () => {
  it('TRIP-SVC-030: createGuest adds a credential-less user joined into the trip', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const { member } = await membersSvc.createGuest(trip.id, '  Anna  ', owner.id);
    expect(member.username).toBe('Anna');
    expect(member.is_guest).toBe(true);

    const row = await storedFields(Users, { id: member.id }, ['username', 'email', 'password_hash', 'is_guest', 'role']) as any;
    expect(row.is_guest).toBe(1);
    expect(row.password_hash).toBe('');
    expect(row.email).toMatch(/@guests\.invalid$/);
    expect(row.role).toBe('user');

    // Joined as a trip member.
    const m = await storedFields(TripMembers, { trip: trip.id, user: member.id }, ['id']);
    expect(m).toBeTruthy();

    // Surfaces in listMembers with is_guest=true and the typed display name.
    const { members } = await membersSvc.listMembers(trip.id, owner.id) as any;
    const guest = members.find((x: any) => x.id === member.id);
    expect(guest.username).toBe('Anna');
    expect(guest.is_guest).toBe(true);
  });

  it('TRIP-SVC-031: the same guest name is allowed, not suffixed (#1446)', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const a = await membersSvc.createGuest(trip.id, 'Sam', owner.id);
    const b = await membersSvc.createGuest(trip.id, 'Sam', owner.id);
    // both keep the plain display name; only the internal (uuid) username differs
    expect(a.member.username).toBe('Sam');
    expect(b.member.username).toBe('Sam');
    expect(b.member.id).not.toBe(a.member.id);
    const usernames = await storedRows(Users, { id: { $in: [a.member.id, b.member.id] } }, undefined, ['username']) as { username: string }[];
    expect(usernames[0].username).not.toBe(usernames[1].username);
  });

  it('TRIP-SVC-032: renameGuest updates the display name (trip-scoped, guest-only)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id);
    const trip = createTrip(testDb, owner.id);
    const { member } = await membersSvc.createGuest(trip.id, 'Bob', owner.id);

    expect(await membersSvc.renameGuest(trip.id, member.id, 'Robert')).toBe(true);
    expect((await storedFields(Users, { id: member.id }, ['display_name']) as any).display_name).toBe('Robert');

    // A real user cannot be renamed through the guest path…
    expect(await membersSvc.renameGuest(trip.id, owner.id, 'Hacked')).toBe(false);
    // …and a guest cannot be renamed from a different trip.
    expect(await membersSvc.renameGuest(otherTrip.id, member.id, 'Nope')).toBe(false);
  });

  it('TRIP-SVC-033: deleteGuest removes the user (cascading membership), guest-only + trip-scoped', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member } = await membersSvc.createGuest(trip.id, 'Carol', owner.id);

    // Real members are not deletable via the guest path.
    expect(await membersSvc.deleteGuest(trip.id, owner.id)).toBe(false);

    expect(await membersSvc.deleteGuest(trip.id, member.id)).toBe(true);
    expect(await storedFields(Users, { id: member.id }, ['id'])).toBeUndefined();
    expect(await storedFields(TripMembers, { user: member.id }, ['id'])).toBeUndefined();
  });

  it('TRIP-SVC-034: a guest is never invitable (addMember) nor a transfer target', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member } = await membersSvc.createGuest(trip.id, 'Dora', owner.id);

    // The synthetic username/email must not resolve through the invite box.
    await expect(membersSvc.addMember(trip.id, 'Dora', owner.id, owner.id)).rejects.toThrow('User not found');
    // Ownership can never be handed to a guest.
    await expect(membersSvc.transferOwnership(trip.id, member.id, owner.id)).rejects.toThrow('Cannot transfer ownership to a guest');
  });
});

// ── Folded CRUD SQL (summary / list / create / delete / copy) ─────────────────

describe('folded trip CRUD', () => {
  it('TRIP-SVC-042: getTripSummary aggregates members, days, budget, packing and reservations', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { start_date: '2025-06-01', end_date: '2025-06-02' });
    addTripMember(testDb, trip.id, member.id);
    await insertRow(await orm(), BudgetItems, { trip: trip.id, category: 'food', name: 'Dinner', total_price: 40 });
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: 'Socks', checked: 1 });

    const summary = (await readModelSvc.getTripSummary(trip.id, owner.id))!;
    expect(summary).toBeTruthy();
    expect((summary.trip as any).id).toBe(trip.id);
    expect(summary.members.owner.id).toBe(owner.id);
    expect(summary.members.collaborators.map((m: any) => m.id)).toEqual([member.id]);
    expect(summary.days).toHaveLength(2);
    expect(summary.budget.item_count).toBe(1);
    expect(summary.budget.total).toBe(40);
    expect(summary.packing.total).toBe(1);
    expect(summary.packing.checked).toBe(1);
    expect(summary.reservations).toEqual([]);
    expect(summary.collab_notes).toEqual([]);

    // Missing trips return null instead of throwing.
    expect(await readModelSvc.getTripSummary(99999)).toBeNull();
  });

  it('TRIP-SVC-043: list returns owned + shared trips with is_owner, honoring the archived filter', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const own = createTrip(testDb, owner.id, { title: 'Mine' });
    const shared = createTrip(testDb, other.id, { title: 'Shared' });
    addTripMember(testDb, shared.id, owner.id);
    const archived = createTrip(testDb, owner.id, { title: 'Old' });
    await updateRows(await orm(), Trips, { id: archived.id }, { is_archived: 1 });

    const active = (await svc.list(owner.id, 0)) as any[];
    expect(active.map(t => t.id).sort()).toEqual([own.id, shared.id].sort());
    expect(active.find(t => t.id === own.id).is_owner).toBe(1);
    expect(active.find(t => t.id === shared.id).is_owner).toBe(0);

    const all = (await svc.list(owner.id, null)) as any[];
    expect(all.map(t => t.id).sort()).toEqual([own.id, shared.id, archived.id].sort());
  });

  it('TRIP-SVC-044: create applies || defaults, clamps reminder_days and generates days', async () => {
    const { user } = createUser(testDb);
    const { trip, tripId, reminderDays } = await svc.create(user.id, {
      title: 'New Trip', start_date: '2025-06-01', end_date: '2025-06-03', reminder_days: 99,
    });
    expect(reminderDays).toBe(3); // out-of-range → default 3
    expect((trip as any).currency).toBe('EUR'); // no currency → 'EUR'
    expect((await getDays(tripId))).toHaveLength(3);
  });

  it('TRIP-SVC-090: one given date makes a week, counted in calendar days across a DST change', async () => {
    const { user } = createUser(testDb);
    const fromStart = await svc.create(user.id, { title: 'Spring', start_date: '2026-03-25' });
    expect(fromStart.trip).toMatchObject({ start_date: '2026-03-25', end_date: '2026-03-31' });
    expect((await getDays(fromStart.tripId))).toHaveLength(7);
    const fromEnd = await svc.create(user.id, { title: 'Autumn', end_date: '2026-10-30' });
    expect(fromEnd.trip).toMatchObject({ start_date: '2026-10-24', end_date: '2026-10-30' });
  });

  it('TRIP-SVC-091: the trip and its days commit together', async () => {
    const { user } = createUser(testDb);
    const before = ({ c: await countRows(await orm(), Trips, {}) } as { c: number }).c;
    const generate = vi.spyOn(svc, 'generateDays').mockRejectedValueOnce(new Error('disk I/O error'));
    await expect(svc.create(user.id, { title: 'Half', start_date: '2026-05-01', end_date: '2026-05-03' })).rejects.toThrow('disk I/O error');
    generate.mockRestore();
    expect(({ c: await countRows(await orm(), Trips, {}) } as { c: number }).c).toBe(before);
  });

  it('TRIP-SVC-080: create without a currency takes the display currency, admin default included, else EUR', async () => {
    const { user } = createUser(testDb);
    const setUser = async (value: string) =>
      setUserSetting(await orm(), user.id, 'default_currency', JSON.stringify(value));
    const setAdmin = async (value: string) =>
      setAppSetting(await orm(), 'default_user_setting_default_currency', JSON.stringify(value));
    const currencyOf = async (data: Parameters<typeof svc.create>[1]) => ((await svc.create(user.id, data)).trip as any).currency;

    expect(await currencyOf({ title: 'Nothing set' })).toBe('EUR');
    // "Trip currency" in the settings stores an empty string, which counts as unset.
    await setUser('');
    expect(await currencyOf({ title: 'Cleared, no admin default' })).toBe('EUR');
    await setUser('   ');
    expect(await currencyOf({ title: 'Blank, no admin default' })).toBe('EUR');
    await setUser('');
    await setAdmin('CHF');
    expect(await currencyOf({ title: 'Admin default' })).toBe('CHF');
    await setUser('USD');
    expect(await currencyOf({ title: 'Own display currency' })).toBe('USD');
    await setUser('');
    expect(await currencyOf({ title: 'Back on the admin default' })).toBe('CHF');
    // An explicit currency always wins.
    await setUser('USD');
    expect(await currencyOf({ title: 'Explicit', currency: 'JPY' })).toBe('JPY');
  });

  it('TRIP-SVC-064: create refuses a range past MAX_TRIP_DAYS and writes nothing', async () => {
    const { user } = createUser(testDb);
    const before = ({ n: await countRows(await orm(), Trips, {}) } as { n: number }).n;
    await expect(svc.create(user.id, { title: 'Decade', start_date: '2026-01-01', end_date: '2036-01-01' }))
      .rejects.toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
    expect(({ n: await countRows(await orm(), Trips, {}) } as { n: number }).n).toBe(before);
    // The longest allowed range goes through in full.
    const { tripId } = await svc.create(user.id, { title: 'Longest', start_date: '2026-01-01', end_date: addDaysIso('2026-01-01', MAX_TRIP_DAYS - 1) });
    expect((await getDays(tripId))).toHaveLength(MAX_TRIP_DAYS);
  });

  it('TRIP-SVC-045: remove deletes the trip, cleans skeleton journey entries and detaches filled ones', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const journeyId = Number(await insertRow(await orm(), Journeys, { user: user.id, title: 'J', created_at: 0, updated_at: 0 }));
    await insertRow(await orm(), JourneyEntries, { journey: journeyId, sourceTrip: trip.id, author: user.id, type: 'skeleton', title: 'S', entry_date: '2025-06-01', created_at: 0, updated_at: 0 });
    const filledId = Number(await insertRow(await orm(), JourneyEntries, { journey: journeyId, sourceTrip: trip.id, author: user.id, type: 'story', title: 'F', entry_date: '2025-06-01', created_at: 0, updated_at: 0 }));

    const info = await svc.remove(trip.id, user.id, 'user');
    expect(info).toMatchObject({ tripId: trip.id, ownerId: user.id, isAdminDelete: false });

    expect(await storedFields(Trips, { id: trip.id }, ['id'])).toBeUndefined();
    expect(await storedFields(JourneyEntries, { type: 'skeleton' }, ['id'])).toBeUndefined();
    const filled = await storedFields(JourneyEntries, { id: filledId }, ['source_trip_id']) as any;
    expect(filled.source_trip_id).toBeNull();

    // Missing trips throw the byte-identical error.
    await expect(svc.remove(99999, user.id, 'user')).rejects.toThrow('Trip not found');
  });

  it('TRIP-SVC-046: copy duplicates days/places/assignments and resets packing to unchecked', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Origin', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = (await getDays(trip.id));
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    createDayAssignment(testDb, days[0].id, place.id);
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: 'Socks', checked: 1 });

    const newTripId = await svc.copy(trip.id, user.id, 'Clone');

    const copied = await storedFields(Trips, { id: newTripId }, ['title', 'is_archived']) as any;
    expect(copied.title).toBe('Clone');
    expect(copied.is_archived).toBe(0);
    expect((await getDays(newTripId))).toHaveLength(2);
    const newPlaces = await storedRows(Places, { trip: newTripId }, undefined, ['id', 'name']) as any[];
    expect(newPlaces.map(p => p.name)).toEqual(['Louvre']);
    expect(await getAssignments((await getDays(newTripId))[0].id)).toHaveLength(1);
    const packing = await storedRows(PackingItems, { trip: newTripId }, undefined, ['checked']) as any[];
    expect(packing).toEqual([{ checked: 0 }]);

    // No title → source title (|| fallback).
    const secondCopy = await svc.copy(trip.id, user.id);
    expect((await storedFields(Trips, { id: secondCopy }, ['title']) as any).title).toBe('Origin');
  });

  it('TRIP-SVC-061: copy carries the road-trip shaping, not just the places', async () => {
    // A via is the road the traveller chose over the one the router prefers, and
    // a day track is the line a day was fitted to. Leaving them behind gave back
    // a trip that looks complete and quietly drives somewhere else — noticed
    // only once somebody edits the copy, with nothing left to recover from.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Norway', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = (await getDays(trip.id));
    const stop = createPlace(testDb, trip.id, { name: 'Geiranger' });
    const track = createPlace(testDb, trip.id, { name: 'Scenic route' });
    await updateRows(await orm(), Places, { id: stop.id }, { stop_type: 'fuel' });
    await updateRows(await orm(), Places, { id: track.id }, { route_geometry: '[[1,2],[3,4]]' });
    createDayAssignment(testDb, days[0].id, stop.id);
    await insertRow(await orm(), RoadtripVias, { day: days[0].id, after_order_index: 0, sequence: 0, lat: 62.1, lng: 7.2 });
    await insertRow(await orm(), RoadtripVias, { day: days[0].id, after_order_index: 0, sequence: 1, lat: 62.2, lng: 7.3 });
    await insertRow(await orm(), RoadtripDayTracks, { day: days[0].id, place: track.id, stray_km: 1.5 });

    const newTripId = await svc.copy(trip.id, user.id, 'Clone');
    const newDays = (await getDays(newTripId));

    // The kind of stop each place is survives the copy.
    const copiedStop = await storedFields(Places, { trip: newTripId, name: 'Geiranger' }, ['stop_type']) as { stop_type: string | null };
    expect(copiedStop.stop_type).toBe('fuel');

    const vias = await storedRows(RoadtripVias, { day: newDays[0].id }, { sequence: 'asc' }, ['after_order_index', 'sequence', 'lat', 'lng']) as { after_order_index: number; sequence: number; lat: number; lng: number }[];
    expect(vias).toEqual([
      { after_order_index: 0, sequence: 0, lat: 62.1, lng: 7.2 },
      { after_order_index: 0, sequence: 1, lat: 62.2, lng: 7.3 },
    ]);

    // The track points at the COPY's place, never back at the original.
    const copiedTrack = await storedFields(RoadtripDayTracks, { day: newDays[0].id }, ['place_id', 'stray_km']) as { place_id: number; stray_km: number };
    const copiedTrackPlace = await storedFields(Places, { trip: newTripId, name: 'Scenic route' }, ['id']) as { id: number };
    expect(copiedTrack.place_id).toBe(copiedTrackPlace.id);
    expect(copiedTrack.stray_km).toBe(1.5);

    // And the original keeps exactly what it had.
    expect({ c: await countRows(await orm(), RoadtripVias, { day: days[0].id }) }).toEqual({ c: 2 });
  });

  it('TRIP-SVC-060: copying a trip keeps a staged booking staged', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Origin', start_date: '2025-06-01', end_date: '2025-06-02' });
    await insertRow(await orm(), Reservations, { trip: trip.id, title: 'Parked', type: 'flight', status: 'confirmed', ingest_state: 'staged' });
    await insertRow(await orm(), Reservations, { trip: trip.id, title: 'Booked', type: 'flight', status: 'confirmed' });

    const newTripId = await svc.copy(trip.id, user.id, 'Clone');

    // Without ingest_state on the duplicate INSERT the staged row falls back to
    // the column default and shows up in the copy's public feed.
    const rows = await storedRows(Reservations, { trip: newTripId }, { title: 'asc' }, ['title', 'ingest_state']) as any[];
    expect(rows).toEqual([
      { title: 'Booked', ingest_state: 'live' },
      { title: 'Parked', ingest_state: 'staged' },
    ]);
  });

  /**
   * Copying a trip used to take every packing row and re-insert it without
   * is_private/owner_id, so both fell back to the column defaults and another
   * member's Personal or Shared item reappeared in the copy as a Common item
   * that everyone on the new trip could read (GHSA-vh2h-288v-ggch).
   */
  it("TRIP-SVC-046b: copy leaves other members' restricted packing items behind", async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Origin', start_date: '2025-06-01', end_date: '2025-06-02' });
    const ins = async (name: string, isPrivate: number, ownerId: number | null) =>
      insertRow(await orm(), PackingItems, { trip: trip.id, name, checked: 0, is_private: isPrivate, owner: ownerId });
    await ins('Shared tent', 0, null);            // Common
    await ins("Owner's diary", 1, owner.id);      // the owner's Personal
    await ins("Member's meds", 1, member.id);     // the copier's own Personal

    const newTripId = await svc.copy(trip.id, member.id, 'Copy');
    const rows = await storedRows(PackingItems, { trip: newTripId }, { name: 'asc' }, ['name', 'is_private', 'owner_id']) as any[];

    // The owner's private row is gone, not relabelled as Common.
    expect(rows.map(r => r.name)).toEqual(["Member's meds", 'Shared tent']);
    expect(rows.find(r => r.name === 'Shared tent')).toMatchObject({ is_private: 0, owner_id: null });
    // The copier's own item stays restricted and belongs to them in the copy.
    expect(rows.find(r => r.name === "Member's meds")).toMatchObject({ is_private: 1, owner_id: member.id });
  });

  it('TRIP-SVC-059: copy remaps cross-links and carries splits/participants (smoke-test I-01)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Linked', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = (await getDays(trip.id));
    const place = createPlace(testDb, trip.id, { name: 'Hotel Le Test' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    await insertRow(await orm(), AssignmentParticipants, { assignment: assignment.id, user: owner.id });

    const accomId = Number(await insertRow(await orm(), DayAccommodations, { trip: trip.id, place: place.id, startDay: days[0].id, endDay: days[1].id, check_in: '15:00', check_out: '11:00' }));

    const resId = Number(await insertRow(await orm(), Reservations, { trip: trip.id, day: days[0].id, assignment: assignment.id, accommodation_id: legacyBoundIntegerText(accomId), title: 'Hotel booking', type: 'hotel', url: 'https://example.test/booking' }));

    const itemId = Number(await insertRow(await orm(), BudgetItems, { trip: trip.id, category: 'Accommodation', name: 'Hotel', total_price: 240, persons: 2, reservation: resId, currency: 'JPY', exchange_rate: 0.0062, expense_date: '2025-06-01' }));
    await insertRow(await orm(), BudgetItemMembers, { budgetItem: itemId, user: owner.id, paid: 1, amount: 120 });
    await insertRow(await orm(), BudgetItemMembers, { budgetItem: itemId, user: friend.id, paid: 0, amount: 120 });
    await insertRow(await orm(), BudgetItemPayers, { budgetItem: itemId, user: owner.id, amount: 240 });
    await insertRow(await orm(), TodoItems, { trip: trip.id, name: 'Book transfer', checked: 1 });

    const newTripId = await svc.copy(trip.id, owner.id, 'Linked copy');

    // Budget → reservation link points at the copied reservation, not null / not the old id.
    const newItem = await storedRow(BudgetItems, { trip: newTripId }) as any;
    const newRes = await storedRow(Reservations, { trip: newTripId }) as any;
    expect(newRes.id).not.toBe(resId);
    expect(newItem.reservation_id).toBe(newRes.id);
    expect(newItem).toMatchObject({ currency: 'JPY', exchange_rate: 0.0062, expense_date: '2025-06-01' });

    // Reservation → accommodation resolves to the copied accommodation (accommodation_id is TEXT).
    const newAccom = await storedRow(DayAccommodations, { trip: newTripId }) as any;
    expect(newAccom.id).not.toBe(accomId);
    expect(Number(newRes.accommodation_id)).toBe(newAccom.id);
    expect(newRes.url).toBe('https://example.test/booking');

    // Splits carried over with per-member paid flags and amounts.
    const members = await storedRows(BudgetItemMembers, { budgetItem: newItem.id }, { user: 'asc' }, ['user_id', 'paid', 'amount']) as any[];
    expect(members).toEqual([
      { user_id: owner.id, paid: 1, amount: 120 },
      { user_id: friend.id, paid: 0, amount: 120 },
    ]);
    const payers = await storedRows(BudgetItemPayers, { budgetItem: newItem.id }, undefined, ['user_id', 'amount']) as any[];
    expect(payers).toEqual([{ user_id: owner.id, amount: 240 }]);

    // Assignment participants copied onto the remapped assignment.
    const newAssignment = (await getAssignments((await getDays(newTripId))[0].id))[0];
    const participants = await storedRows(AssignmentParticipants, { assignment: newAssignment.id }, undefined, ['user_id']) as any[];
    expect(participants).toEqual([{ user_id: owner.id }]);

    // To-dos come across but reset to unchecked (documented behaviour).
    const todos = await storedRows(TodoItems, { trip: newTripId }, undefined, ['name', 'checked']) as any[];
    expect(todos).toEqual([{ name: 'Book transfer', checked: 0 }]);
  });
});

// ── Wrapper helpers (delegating members of the aggregate root) ────────────────

describe('TripsService wrapper helpers', () => {
  it('re-anchors the budget before the trip row leaves its old currency (#1543)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await updateRows(await orm(), Trips, { id: trip.id }, { currency: 'EUR' });
    const plan = { next: 'RUB', rates: null };
    const seen: string[] = [];
    const prepareSpy = vi.spyOn(budgetSvc, 'prepareCurrencyRebase').mockResolvedValue(plan);
    const applySpy = vi.spyOn(budgetSvc, 'applyCurrencyRebase').mockImplementation(async () => {
      // test-sql-allow: runs inside the update's open transaction, where an ORM read in a context of its own would wait on the held connection.
      seen.push((testDb.prepare('SELECT currency FROM trips WHERE id = ?').get(trip.id) as { currency: string }).currency);
    });
    try {
      await svc.update(trip.id, user.id, { currency: 'RUB' } as never, 'user');
      expect(prepareSpy).toHaveBeenCalledWith(trip.id, 'RUB');
      // The rebase reads the outgoing currency off the trip row, so it runs before the row moves.
      expect(applySpy).toHaveBeenCalledWith(trip.id, plan);
      expect(seen).toEqual(['EUR']);
      expect(await storedFields(Trips, { id: trip.id }, ['currency'])).toEqual({ currency: 'RUB' });
    } finally {
      prepareSpy.mockRestore();
      applySpy.mockRestore();
    }
  });

  it('TRIP-SVC-092: a failing day rebuild leaves the budget on the old currency with the trip (#1543)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-03' });
    await updateRows(await orm(), Trips, { id: trip.id }, { currency: 'EUR' });
    const item = createBudgetItem(testDb, trip.id, { total_price: 100 });
    await updateRows(await orm(), BudgetItems, { id: item.id }, { currency: 'USD', exchange_rate: 1.1 });
    // Rates come from the network in production; the plan is handed in so the real write runs.
    const prepareSpy = vi.spyOn(budgetSvc, 'prepareCurrencyRebase').mockResolvedValue({ next: 'JPY', rates: { USD: 0.0067, EUR: 0.0062 } });
    const daysSpy = vi.spyOn(svc, 'generateDays').mockRejectedValue(new Error('boom'));
    try {
      await expect(svc.update(trip.id, user.id, { currency: 'JPY', end_date: '2026-07-05' }, 'user')).rejects.toThrow('boom');
      expect(await storedFields(Trips, { id: trip.id }, ['currency', 'end_date'])).toEqual({ currency: 'EUR', end_date: '2026-07-03' });
      expect(await storedFields(BudgetItems, { id: item.id }, ['currency', 'exchange_rate'])).toEqual({ currency: 'USD', exchange_rate: 1.1 });
    } finally {
      prepareSpy.mockRestore();
      daysSpy.mockRestore();
    }
  });

  it('TRIP-SVC-093: updateTrip, the plugin host path, never rebases the budget', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const prepareSpy = vi.spyOn(budgetSvc, 'prepareCurrencyRebase');
    const applySpy = vi.spyOn(budgetSvc, 'applyCurrencyRebase');
    try {
      await svc.updateTrip(trip.id, user.id, { currency: 'USD' }, 'user');
      expect(prepareSpy).not.toHaveBeenCalled();
      expect(applySpy).not.toHaveBeenCalled();
    } finally {
      prepareSpy.mockRestore();
      applySpy.mockRestore();
    }
  });

  it('TRIP-SVC-068: update refuses a bad range before the budget is rebased (#2403)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-07' });
    const prepareSpy = vi.spyOn(budgetSvc, 'prepareCurrencyRebase').mockResolvedValue(null);
    try {
      await expect(svc.update(trip.id, user.id, { currency: 'USD', end_date: '2036-07-01' }, 'user'))
        .rejects.toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
      await expect(svc.update(trip.id, user.id, { currency: 'USD', start_date: '2026-07-10' }, 'user'))
        .rejects.toThrow('End date must be after start date');
      expect(prepareSpy).not.toHaveBeenCalled();
      await expect(svc.update(99999, user.id, { currency: 'USD' }, 'user')).rejects.toThrow('Trip not found');
    } finally {
      prepareSpy.mockRestore();
    }
  });

  it('canAccessTrip delegates to the db helper; can() delegates to checkPermission; broadcast forwards', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.canAccessTrip(String(trip.id), user.id)).toMatchObject({ user_id: user.id });

    expect(await svc.can('trip_edit', 'user', user.id, user.id, false)).toBe(true);

    svc.broadcast('9', 'trip:updated', { a: 1 } as never, 'sock');
    expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { a: 1 }, 'sock');
  });

  it('getCopiedTrip re-reads via the TRIP_SELECT query', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Copied' });
    const row = (await svc.getCopiedTrip(trip.id, user.id)) as any;
    expect(row.id).toBe(trip.id);
    expect(row.is_owner).toBe(1);
  });

  it('bundle aggregates every sub-collection + the member list, scoping packing to the viewer (#858)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { start_date: '2025-06-01', end_date: '2025-06-02' });
    addTripMember(testDb, trip.id, viewer.id);
    // A personal item of the OWNER must stay out of the other member's bundle.
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: 'Secret', is_private: 1, owner: owner.id });
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: 'Shared' });

    const result = (await readModelSvc.bundle(String(trip.id), { user_id: owner.id }, viewer.id)) as any;
    expect(result.days).toHaveLength(2);
    expect(result.members.map((m: any) => m.id).sort()).toEqual([owner.id, viewer.id].sort());
    expect(result.packingItems.map((p: any) => p.name)).toEqual(['Shared']);
  });

  it('notifyInvite is fire-and-forget (no throw)', () => {
    expect(() => membersSvc.notifyInvite('9', { id: 1, email: 'a@b.c' } as never, 2, 'T', 'b@x.y')).not.toThrow();
  });
});

// ── Branch coverage for the folded update/export/copy quirks ─────────────────

describe('folded quirk branches', () => {
  it('TRIP-SVC-047: updateTrip admin edit collects changes and the owner email; reminder 0 reads "none"', async () => {
    const { user: owner } = createUser(testDb);
    const { user: admin } = createUser(testDb);
    await updateRows(await orm(), Users, { id: admin.id }, { role: 'admin' });
    const trip = createTrip(testDb, owner.id, { title: 'Old' });

    const result = await svc.updateTrip(trip.id, admin.id, { title: 'New', is_archived: true, reminder_days: 0 }, 'admin');

    expect(result.isAdminEdit).toBe(true);
    expect(result.ownerEmail).toBe(owner.email);
    expect(result.changes).toMatchObject({ title: 'New', archived: true, reminder_days: 'none' });
    expect(result.newTitle).toBe('New');
    // || coercion: an empty-string title falls back to the stored one.
    const kept = await svc.updateTrip(trip.id, owner.id, { title: '' }, 'user');
    expect(kept.newTitle).toBe('New');
    // Missing trips throw the byte-identical error; invalid ranges reject.
    await expect(svc.updateTrip(99999, owner.id, {}, 'user')).rejects.toThrow('Trip not found');
    await expect(svc.updateTrip(trip.id, owner.id, { start_date: '2025-06-10', end_date: '2025-06-01' }, 'user')).rejects.toThrow('End date must be after start date');
  });

  it('TRIP-SVC-071 (Task 7 security review L1, absorbed): a stored NULL is_archived pre-image stays NULL through an unrelated update, never folded to 0', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Legacy row' });
    // A pre-migration row (or any row the `is_archived` column default never
    // touched) can genuinely hold NULL — the legacy statement wrote it back
    // unfolded whenever the request itself never sent `is_archived`.
    await updateRows(await orm(), Trips, { id: trip.id }, { is_archived: null });

    await svc.updateTrip(trip.id, user.id, { title: 'Renamed' }, 'user');

    expect((await storedFields(Trips, { id: trip.id }, ['is_archived']) as { is_archived: number | null }).is_archived).toBeNull();

    // Explicitly archiving still writes 1/0 as before — only the "untouched, was NULL" path is preserved.
    await svc.updateTrip(trip.id, user.id, { is_archived: true }, 'user');
    expect((await storedFields(Trips, { id: trip.id }, ['is_archived']) as { is_archived: number | null }).is_archived).toBe(1);
  });

  it('TRIP-SVC-072: the trip UPDATE (TP25) and the days regeneration are one write, so a failed regen rolls the new dates back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Ordering', start_date: '2025-06-01', end_date: '2025-06-03' });

    const daysRepo = await createTestDaysRepo(testDb);
    const spy = vi.spyOn(daysRepo, 'listOrderedForReorder').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(svc.updateTrip(trip.id, user.id, { start_date: '2025-07-01', end_date: '2025-07-03' }, 'user')).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    // TP25 runs inside the same transaction as the regeneration, so the
    // failure takes the new dates back with it.
    const row = await storedFields(Trips, { id: trip.id }, ['start_date', 'end_date']) as { start_date: string; end_date: string };
    expect(row).toEqual({ start_date: '2025-06-01', end_date: '2025-06-03' });
    // The day rows are untouched too: still the original 3, on their original dates.
    expect((await getDays(trip.id))).toHaveLength(3);
    expect((await getDays(trip.id)).map(d => d.date)).toEqual(['2025-06-01', '2025-06-02', '2025-06-03']);
  });

  it('TRIP-SVC-073 (Task 7 security review L2, absorbed): the two-phase renumber avoids a UNIQUE(trip_id, day_number) collision on a genuine swap', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id); // undated — no auto-generated days
    // A dateless day sits BETWEEN two dated ones. Regenerating a 3-day range
    // over this reassigns day_number so the dateless day and the LATER dated
    // day trade places — a genuine swap (2↔3), not just a compaction. A
    // single positive-only pass would try to write day_number=2 for dayC
    // while dayB still holds it, colliding with `UNIQUE(trip_id,
    // day_number)`; the two-phase renumber (negative pass first) avoids it.
    const dayA = createDay(testDb, trip.id, { day_number: 1, date: '2025-01-01' });
    const dayB = createDay(testDb, trip.id, { day_number: 2 });
    const dayC = createDay(testDb, trip.id, { day_number: 3, date: '2025-01-02' });
    const place = createPlace(testDb, trip.id);
    const assignmentOnB = createDayAssignment(testDb, dayB.id, place.id);

    await svc.generateDays(trip.id, '2025-01-01', '2025-01-03');

    const daysAfter = (await getDays(trip.id));
    expect(daysAfter).toHaveLength(3);
    const byId = new Map(daysAfter.map(d => [d.id, d]));
    expect(byId.get(dayA.id)).toMatchObject({ day_number: 1, date: '2025-01-01' });
    expect(byId.get(dayC.id)).toMatchObject({ day_number: 2, date: '2025-01-02' });
    expect(byId.get(dayB.id)).toMatchObject({ day_number: 3, date: '2025-01-03' });
    // dayB's own identity (and its assignment) survived the swap — renumbered
    // in place, never deleted-and-recreated.
    expect((await getAssignments(dayB.id))).toHaveLength(1);
    expect((await getAssignments(dayB.id))[0].id).toBe(assignmentOnB.id);
  });

  it('TRIP-SVC-065: updateTrip refuses a range past MAX_TRIP_DAYS before touching the row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Week', start_date: '2026-07-01', end_date: '2026-07-07' });
    await expect(svc.updateTrip(trip.id, user.id, { title: 'Decade', end_date: '2036-07-01' }, 'user'))
      .rejects.toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
    expect(await storedFields(Trips, { id: trip.id }, ['title', 'end_date'])).toEqual({ title: 'Week', end_date: '2026-07-07' });
    expect((await getDays(trip.id))).toHaveLength(7);
    // Moving only the start keeps the stored end and is measured against it.
    await expect(svc.updateTrip(trip.id, user.id, { start_date: '2020-01-01' }, 'user'))
      .rejects.toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
  });

  it('TRIP-SVC-066: a trip whose stored range already exceeds the limit can still be renamed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Legacy' });
    await updateRows(await orm(), Trips, { id: trip.id }, { start_date: '2020-01-01', end_date: '2030-01-01' });
    const result = await svc.updateTrip(trip.id, user.id, { title: 'Renamed' }, 'user');
    expect(result.newTitle).toBe('Renamed');
    expect(result.changes).toEqual({ title: 'Renamed' });
    // A day_count would rebuild the grid over the whole stored range, so it is held to the limit too.
    await expect(svc.updateTrip(trip.id, user.id, { day_count: 5 }, 'user'))
      .rejects.toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
    expect((await getDays(trip.id))).toHaveLength(0);
  });

  it('TRIP-SVC-067: a start date moved past the stored end is refused instead of emptying the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Week', start_date: '2026-07-01', end_date: '2026-07-07' });
    await expect(svc.updateTrip(trip.id, user.id, { start_date: '2026-07-10' }, 'user'))
      .rejects.toThrow('End date must be after start date');
    expect(await storedFields(Trips, { id: trip.id }, ['start_date'])).toEqual({ start_date: '2026-07-01' });
    expect((await getDays(trip.id))).toHaveLength(7);
  });

  it('TRIP-SVC-049: addMember inserts the membership and reports the trip title; removeMember deletes it', async () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Joinable' });

    const result = await membersSvc.addMember(trip.id, invitee.email, owner.id, owner.id);
    expect(result.member.id).toBe(invitee.id);
    expect(result.tripTitle).toBe('Joinable');
    expect(result.targetUserId).toBe(invitee.id);

    // Duplicate + owner + missing identifier reject with the byte-identical errors.
    await expect(membersSvc.addMember(trip.id, invitee.email, owner.id, owner.id)).rejects.toThrow('User already has access');
    await expect(membersSvc.addMember(trip.id, owner.email, owner.id, owner.id)).rejects.toThrow('Trip owner is already a member');
    await expect(membersSvc.addMember(trip.id, '', owner.id, owner.id)).rejects.toThrow('Email or username required');

    await membersSvc.removeMember(trip.id, invitee.id);
    expect(await storedFields(TripMembers, { trip: trip.id, user: invitee.id }, ['id'])).toBeUndefined();
  });

  it('TRIP-SVC-050: copy remaps tags, accommodations, reservations, day notes, budget, bags and category order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Deep', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = (await getDays(trip.id));
    const place = createPlace(testDb, trip.id, { name: 'Hotel Zed' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    const tagId = Number(await insertRow(await orm(), Tags, { name: 'beach', user: user.id }));
    await tagPlace(await orm(), place.id, [tagId]);
    const accomId = Number(await insertRow(await orm(), DayAccommodations, { trip: trip.id, place: place.id, startDay: days[0].id, endDay: days[1].id, check_in: '15:00', check_out: '11:00' }));
    await insertRow(await orm(), Reservations, { trip: trip.id, day: days[0].id, endDay: days[1].id, place: place.id, assignment: assignment.id, accommodation_id: legacyBoundIntegerText(accomId), title: 'Stay', type: 'hotel' });
    await insertRow(await orm(), BudgetItems, { trip: trip.id, category: 'stay', name: 'Hotel', total_price: 120 });
    const bagId = Number(await insertRow(await orm(), PackingBags, { trip: trip.id, name: 'Backpack' }));
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: 'Towel', checked: 1, bag: bagId });
    createDayNote(testDb, days[0].id, trip.id, { text: 'note' });
    await insertRow(await orm(), TodoItems, { trip: trip.id, name: 'Book', checked: 1 });
    await insertRow(await orm(), BudgetCategoryOrder, { trip: trip.id, category: 'stay', sort_order: 2 });

    const newTripId = await svc.copy(trip.id, user.id);

    const newDays = (await getDays(newTripId));
    expect(newDays).toHaveLength(2);
    const newPlace = await storedFields(Places, { trip: newTripId }, ['id']) as { id: number };
    expect(await placeTagRow(newPlace.id)).toEqual({ tag_id: tagId });
    const newAccom = await storedFields(DayAccommodations, { trip: newTripId }, ['id', 'place_id', 'start_day_id', 'end_day_id']) as any;
    expect(newAccom.place_id).toBe(newPlace.id);
    expect(newAccom.start_day_id).toBe(newDays[0].id);
    const newRes = await storedFields(Reservations, { trip: newTripId }, ['day_id', 'end_day_id', 'place_id', 'accommodation_id']) as any;
    // The legacy copyTripById nulled this link (TEXT column vs number-keyed map);
    // fixed with smoke-test I-01 — the copy now coerces and remaps it.
    expect(newRes.day_id).toBe(newDays[0].id);
    expect(newRes.end_day_id).toBe(newDays[1].id);
    expect(newRes.place_id).toBe(newPlace.id);
    expect(Number(newRes.accommodation_id)).toBe(newAccom.id);
    expect(({ n: await countRows(await orm(), BudgetItems, { trip: newTripId }) } as any).n).toBe(1);
    const newItem = await storedFields(PackingItems, { trip: newTripId }, ['checked', 'bag_id']) as any;
    expect(newItem.checked).toBe(0);
    expect(newItem.bag_id).not.toBeNull();
    expect((await storedFields(TodoItems, { trip: newTripId }, ['checked', 'assigned_user_id']) as any)).toEqual({ checked: 0, assigned_user_id: null });
    expect((await storedFields(BudgetCategoryOrder, { trip: newTripId }, ['sort_order']) as any).sort_order).toBe(2);
    expect(({ n: await countRows(await orm(), DayNotes, { trip: newTripId }) } as any).n).toBe(1);

    // Missing source throws the byte-identical error.
    await expect(svc.copy(99999, user.id)).rejects.toThrow('Trip not found');
  });
});

// ── Plan 3c Task 8 deliverable: whole-copy parity + rollback ─────────────────

describe('copy — whole-trip parity (Task 8)', () => {
  it('TRIP-SVC-069: every table copy touches is byte-identical to the source modulo ids/timestamps, with ids consistently remapped', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, {
      title: 'Full Fixture', start_date: '2025-09-01', end_date: '2025-09-03',
    });
    await updateRows(await orm(), Trips, { id: trip.id }, { description: 'A full trip', currency: 'EUR', cover_image: 'cover.png', reminder_days: 5 });
    addTripMember(testDb, trip.id, member.id);
    const days = (await getDays(trip.id));
    await updateRows(await orm(), Days, { id: days[0].id }, { notes: 'Pack light', title: 'Arrival' });
    await updateRows(await orm(), Days, { id: days[1].id }, { notes: 'Checkout' });

    const stop = createPlace(testDb, trip.id, { name: 'Hotel Full', description: 'Nice place' });
    const track = createPlace(testDb, trip.id, { name: 'Scenic road' });
    await updateRows(await orm(), Places, { id: stop.id }, { reservation_status: 'booked', reservation_notes: 'rn', reservation_datetime: '2025-09-01T14:00', route_color: '#ff0000', stop_type: 'hotel', fill_percent: 80 });

    const tag = Number(await insertRow(await orm(), Tags, { name: 'beach', user: owner.id }));
    await tagPlace(await orm(), stop.id, [tag]);

    const assignment = createDayAssignment(testDb, days[0].id, stop.id);
    await updateRows(await orm(), DayAssignments, { id: assignment.id }, { reservation_status: 'booked', reservation_notes: 'arn', reservation_datetime: '2025-09-01T15:00', assignment_time: '15:00', assignment_end_time: '16:00', end_day: 1 });
    await insertRow(await orm(), AssignmentParticipants, { assignment: assignment.id, user: owner.id });
    await insertRow(await orm(), AssignmentParticipants, { assignment: assignment.id, user: member.id });

    await insertRow(await orm(), RoadtripVias, { day: days[0].id, after_order_index: 0, sequence: 0, lat: 48.1, lng: 2.1 });
    await insertRow(await orm(), RoadtripDayTracks, { day: days[0].id, place: track.id, stray_km: 2.5 });
    await insertRow(await orm(), RoadtripPreferences, { trip: trip.id, key: 'avoid_tolls', value: 'true' });
    await insertRow(await orm(), RoadtripDayBoundaries, { trip: trip.id, day_number: 1, fromAssignment: assignment.id, toAssignment: null, fraction: 0.5 });

    const accomId = Number(await insertRow(await orm(), DayAccommodations, { trip: trip.id, place: stop.id, startDay: days[0].id, endDay: days[1].id, check_in: '15:00', check_in_end: '15:30', check_out: '11:00', confirmation: 'CONF-1', notes: 'Late checkout ok' }));
    await updateRows(await orm(), DayAssignments, { id: assignment.id }, { accommodation_id: accomId });

    const resId = Number(await insertRow(await orm(), Reservations, {
      trip: trip.id, day: days[0].id, endDay: days[1].id, place: stop.id, assignment: assignment.id,
      accommodation_id: legacyBoundIntegerText(accomId), title: 'Stay', reservation_time: '15:00', reservation_end_time: '11:00',
      location: 'Front desk', confirmation_number: 'CONF-99', notes: 'Bring ID', url: 'https://example.com/booking',
      status: 'confirmed', type: 'hotel', metadata: '{"note":"seed"}', day_plan_position: 1.5, needs_review: 1, ingest_state: 'live',
      external_source: 'airtrail', external_id: 'ext-123', sync_enabled: 0,
    }));
    // Confirms the seed itself carries the legacy "14.0" TEXT shape on the
    // SOURCE row's accommodation_id, the shape the pre-migration `copy`
    // produced by binding a plain number into the TEXT column.
    expect((await storedFields(Reservations, { id: resId }, ['accommodation_id']) as { accommodation_id: string }).accommodation_id).toBe(`${accomId}.0`);

    const itemId = Number(await insertRow(await orm(), BudgetItems, { trip: trip.id, category: 'Accommodation', name: 'Hotel', total_price: 300, reservation: resId, currency: 'EUR' }));
    await insertRow(await orm(), BudgetItemMembers, { budgetItem: itemId, user: owner.id, paid: 1, amount: 150 });
    await insertRow(await orm(), BudgetItemMembers, { budgetItem: itemId, user: member.id, paid: 0, amount: 150 });
    await insertRow(await orm(), BudgetItemPayers, { budgetItem: itemId, user: owner.id, amount: 300 });
    await insertRow(await orm(), BudgetCategoryOrder, { trip: trip.id, category: 'Accommodation', sort_order: 1 });

    const bagId = Number(await insertRow(await orm(), PackingBags, { trip: trip.id, name: 'Carry-on' }));
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: 'Shared tent', checked: 1, bag: bagId });
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: "Owner's diary", checked: 1, is_private: 1, owner: owner.id });
    await insertRow(await orm(), PackingItems, { trip: trip.id, name: "Member's meds", checked: 1, is_private: 1, owner: member.id });

    createDayNote(testDb, days[0].id, trip.id, { text: 'Remember passport', time: '08:00', icon: '🛂', sort_order: 1 });
    await insertRow(await orm(), TodoItems, { trip: trip.id, name: 'Book taxi', checked: 1, category: 'travel', sort_order: 1 });

    // ── copy, run by the OWNER (so their own private item copies, member's does not) ──
    const newTripId = await svc.copy(trip.id, owner.id, 'Full Copy');

    // trips
    const newTrip = await storedRow(Trips, { id: newTripId }) as Record<string, unknown>;
    expect(newTrip).toMatchObject({
      user_id: owner.id, title: 'Full Copy', description: 'A full trip',
      start_date: '2025-09-01', end_date: '2025-09-03', currency: 'EUR',
      cover_image: 'cover.png', is_archived: 0, reminder_days: 5,
    });

    // days
    const newDays = (await getDays(newTripId));
    expect(newDays).toHaveLength(3);
    expect(newDays.map(d => ({ day_number: d.day_number, date: d.date }))).toEqual(
      days.map(d => ({ day_number: d.day_number, date: d.date })),
    );
    expect((await storedFields(Days, { id: newDays[0].id }, ['notes', 'title']) as { notes: string | null; title: string | null })).toEqual({ notes: 'Pack light', title: 'Arrival' });
    expect((await storedFields(Days, { id: newDays[1].id }, ['notes']) as { notes: string | null }).notes).toBe('Checkout');

    // places
    const newStop = await storedRow(Places, { trip: newTripId, name: 'Hotel Full' }) as {
      id: number; description: string | null; reservation_status: string | null; reservation_notes: string | null;
      reservation_datetime: string | null; route_color: string | null; stop_type: string | null; fill_percent: number | null;
    };
    const newTrack = await storedRow(Places, { trip: newTripId, name: 'Scenic road' }) as { id: number };
    expect(newStop).toMatchObject({
      description: 'Nice place', reservation_status: 'booked', reservation_notes: 'rn',
      reservation_datetime: '2025-09-01T14:00', route_color: '#ff0000', stop_type: 'hotel', fill_percent: 80,
    });

    // place_tags
    expect((await placeTagRow(newStop.id))!.tag_id).toBe(tag);

    // day_assignments (+ the TP57 accommodation stamp)
    const newAssignment = (await getAssignments(newDays[0].id))[0];
    const newAssignmentFull = await storedRow(DayAssignments, { id: newAssignment.id }) as {
      place_id: number; reservation_status: string | null; reservation_notes: string | null; reservation_datetime: string | null;
      assignment_time: string | null; assignment_end_time: string | null; end_day: number; accommodation_id: number | null;
    };
    expect(newAssignmentFull).toMatchObject({
      place_id: newStop.id, reservation_status: 'booked', reservation_notes: 'arn',
      reservation_datetime: '2025-09-01T15:00', assignment_time: '15:00', assignment_end_time: '16:00', end_day: 1,
    });

    // assignment_participants
    const newParticipants = await storedRows(AssignmentParticipants, { assignment: newAssignment.id }, undefined, ['user_id']) as { user_id: number }[];
    expect(newParticipants.map(p => p.user_id).sort((a, b) => a - b)).toEqual([owner.id, member.id].sort((a, b) => a - b));

    // roadtrip_vias / roadtrip_day_tracks
    const newVia = await storedFields(RoadtripVias, { day: newDays[0].id }, ['after_order_index', 'sequence', 'lat', 'lng']) as {
      after_order_index: number; sequence: number; lat: number; lng: number;
    };
    expect(newVia).toEqual({ after_order_index: 0, sequence: 0, lat: 48.1, lng: 2.1 });
    const newTrackRow = await storedFields(RoadtripDayTracks, { day: newDays[0].id }, ['place_id', 'stray_km']) as { place_id: number; stray_km: number | null };
    expect(newTrackRow).toEqual({ place_id: newTrack.id, stray_km: 2.5 });

    // roadtrip_preferences / roadtrip_day_boundaries
    expect((await storedFields(RoadtripPreferences, { trip: newTripId, key: 'avoid_tolls' }, ['value']) as { value: string }).value).toBe('true');
    const newBoundary = await storedFields(RoadtripDayBoundaries, { trip: newTripId }, ['day_number', 'from_assignment_id', 'to_assignment_id', 'fraction']) as {
      day_number: number; from_assignment_id: number; to_assignment_id: number | null; fraction: number;
    };
    expect(newBoundary).toEqual({ day_number: 1, from_assignment_id: newAssignment.id, to_assignment_id: null, fraction: 0.5 });

    // day_accommodations (TP55/TP56, byte-diffed against the source — full
    // key set modulo id/trip_id/place_id/start_day_id/end_day_id/created_at,
    // every one of which is either a remapped FK or excluded on principle),
    // and the assignment's accommodation_id stamped at the NEW accommodation
    const newAccom = await storedRow(DayAccommodations, { trip: newTripId }) as {
      id: number; place_id: number | null; start_day_id: number; end_day_id: number;
      check_in: string | null; check_in_end: string | null; check_out: string | null; confirmation: string | null; notes: string | null;
    };
    const sourceAccom = await storedFields(DayAccommodations, { id: accomId }, ['check_in', 'check_in_end', 'check_out', 'confirmation', 'notes']) as {
      check_in: string | null; check_in_end: string | null; check_out: string | null; confirmation: string | null; notes: string | null;
    };
    expect({ check_in: newAccom.check_in, check_in_end: newAccom.check_in_end, check_out: newAccom.check_out, confirmation: newAccom.confirmation, notes: newAccom.notes }).toEqual(sourceAccom);
    expect({ place_id: newAccom.place_id, start_day_id: newAccom.start_day_id, end_day_id: newAccom.end_day_id }).toEqual({ place_id: newStop.id, start_day_id: newDays[0].id, end_day_id: newDays[1].id });
    expect(newAssignmentFull.accommodation_id).toBe(newAccom.id);

    // reservations (TP58/TP59), byte-diffed against the source — full key
    // set modulo id/trip_id/day_id/end_day_id/place_id/assignment_id/
    // created_at (remapped FKs) and the external_*/sync_enabled columns
    // (deliberately NOT copied, asserted below).
    const newRes = await storedRow(Reservations, { trip: newTripId }) as {
      id: number; day_id: number | null; end_day_id: number | null; place_id: number | null; assignment_id: number | null;
      title: string; reservation_time: string | null; reservation_end_time: string | null; location: string | null;
      confirmation_number: string | null; notes: string | null; url: string | null; status: string | null; type: string | null;
      metadata: string | null; day_plan_position: number | null; needs_review: number; ingest_state: string; accommodation_id: string | null;
      external_source: string | null; external_id: string | null; sync_enabled: number | null;
    };
    expect({
      title: newRes.title, reservation_time: newRes.reservation_time, reservation_end_time: newRes.reservation_end_time,
      location: newRes.location, confirmation_number: newRes.confirmation_number, notes: newRes.notes, url: newRes.url,
      status: newRes.status, type: newRes.type, metadata: newRes.metadata, day_plan_position: newRes.day_plan_position,
      needs_review: newRes.needs_review, ingest_state: newRes.ingest_state,
    }).toEqual({
      title: 'Stay', reservation_time: '15:00', reservation_end_time: '11:00', location: 'Front desk',
      confirmation_number: 'CONF-99', notes: 'Bring ID', url: 'https://example.com/booking', status: 'confirmed',
      type: 'hotel', metadata: '{"note":"seed"}', day_plan_position: 1.5, needs_review: 1, ingest_state: 'live',
    });
    expect({ day_id: newRes.day_id, end_day_id: newRes.end_day_id, place_id: newRes.place_id, assignment_id: newRes.assignment_id }).toEqual({
      day_id: newDays[0].id, end_day_id: newDays[1].id, place_id: newStop.id, assignment_id: newAssignment.id,
    });
    // The TRAP proof: the copy's accommodation_id is the LEGACY raw-bound
    // TEXT shape (`'<id>.0'`), not the `em.insert()`-inlined `'<id>'` shape
    // rule 22 would otherwise produce.
    expect(newRes.accommodation_id).toBe(`${newAccom.id}.0`);
    // external_* / sync_enabled are deliberately NOT copied — the duplicate
    // must not inherit the source's external sync identity (the source has
    // both set, above).
    expect(newRes.external_source).toBeNull();
    expect(newRes.external_id).toBeNull();
    expect(newRes.sync_enabled).toBe(1); // the column's own DB DEFAULT, never the source's `0`

    // budget_items / members / payers / category order
    const newItem = await storedRow(BudgetItems, { trip: newTripId }) as {
      id: number; category: string; name: string; total_price: number; reservation_id: number | null; currency: string | null;
    };
    expect(newItem).toMatchObject({ category: 'Accommodation', name: 'Hotel', total_price: 300, reservation_id: newRes.id, currency: 'EUR' });
    const newMembers = await storedRows(BudgetItemMembers, { budgetItem: newItem.id }, { user: 'asc' }, ['user_id', 'paid', 'amount']) as { user_id: number; paid: number; amount: number | null }[];
    expect(newMembers).toEqual([owner.id, member.id].sort((a, b) => a - b).map((uid) =>
      uid === owner.id ? { user_id: owner.id, paid: 1, amount: 150 } : { user_id: member.id, paid: 0, amount: 150 },
    ));
    const newPayers = await storedRows(BudgetItemPayers, { budgetItem: newItem.id }, undefined, ['user_id', 'amount']) as { user_id: number; amount: number }[];
    expect(newPayers).toEqual([{ user_id: owner.id, amount: 300 }]);
    expect((await storedFields(BudgetCategoryOrder, { trip: newTripId, category: 'Accommodation' }, ['sort_order']) as { sort_order: number }).sort_order).toBe(1);

    // packing_bags / packing_items (incl. the TP68 privacy filter — the copIER is the owner)
    const newBag = await storedFields(PackingBags, { trip: newTripId, name: 'Carry-on' }, ['id']) as { id: number };
    const newPacking = await storedRows(PackingItems, { trip: newTripId }, { name: 'asc' }, ['name', 'checked', 'is_private', 'owner_id', 'bag_id']) as {
      name: string; checked: number | null; is_private: number; owner_id: number | null; bag_id: number | null;
    }[];
    expect(newPacking.map(p => p.name)).toEqual(['Owner\'s diary', 'Shared tent']); // member's private item is NOT copied
    expect(newPacking.find(p => p.name === 'Shared tent')).toMatchObject({ checked: 0, is_private: 0, owner_id: null, bag_id: newBag.id });
    expect(newPacking.find(p => p.name === "Owner's diary")).toMatchObject({ checked: 0, is_private: 1, owner_id: owner.id });

    // day_notes
    const newNote = await storedFields(DayNotes, { trip: newTripId }, ['day_id', 'text', 'time', 'icon', 'sort_order']) as {
      day_id: number; text: string; time: string | null; icon: string | null; sort_order: number | null;
    };
    expect(newNote).toEqual({ day_id: newDays[0].id, text: 'Remember passport', time: '08:00', icon: '🛂', sort_order: 1 });

    // todo_items — reset to unchecked, no assignee
    const newTodo = await storedFields(TodoItems, { trip: newTripId }, ['name', 'checked', 'category', 'sort_order', 'assigned_user_id']) as {
      name: string; checked: number | null; category: string | null; sort_order: number | null; assigned_user_id: number | null;
    };
    expect(newTodo).toEqual({ name: 'Book taxi', checked: 0, category: 'travel', sort_order: 1, assigned_user_id: null });

    // The source trip is untouched.
    expect({ n: await countRows(await orm(), Days, { trip: trip.id }) }).toEqual({ n: 3 });
    expect({ n: await countRows(await orm(), PackingItems, { trip: trip.id }) }).toEqual({ n: 3 });
  });

  it('TRIP-SVC-070 (mutation-proved): copy is atomic — a failing late insert leaves no new trip and no partial rows', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rollback source', start_date: '2025-10-01', end_date: '2025-10-02' });
    const days = (await getDays(trip.id));
    const place = createPlace(testDb, trip.id, { name: 'Doomed place' });
    createDayAssignment(testDb, days[0].id, place.id);
    const tripsBefore = ({ n: await countRows(await orm(), Trips, {}) } as { n: number }).n;
    const daysBefore = ({ n: await countRows(await orm(), Days, {}) } as { n: number }).n;

    const dayNotesRepo = await createTestDayNotesRepo(testDb);
    const spy = vi.spyOn(dayNotesRepo, 'insertNoteCopy').mockRejectedValueOnce(new Error('boom'));
    createDayNote(testDb, days[0].id, trip.id, { text: 'Triggers the late failure' });
    try {
      await expect(svc.copy(trip.id, user.id, 'Never lands')).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    // No new trip, and every earlier insert in the same transaction (trips/days/
    // places/assignments/…) rolled back with it — nothing partially lands.
    expect(({ n: await countRows(await orm(), Trips, {}) } as { n: number }).n).toBe(tripsBefore);
    expect(({ n: await countRows(await orm(), Days, {}) } as { n: number }).n).toBe(daysBefore);
    expect(await storedFields(Trips, { title: 'Never lands' }, ['id'])).toBeUndefined();
    // The source trip itself is untouched.
    expect(await storedFields(Trips, { id: trip.id }, ['id'])).toBeDefined();
  });
});

describe('copy: Tours (#2586)', () => {
  /** A Tour on `tripId`: the place, its `tours` facet and three route waypoints. */
  async function seedTour(tripId: number, name: string) {
    const place = createPlace(testDb, tripId, { name });
    await updateRows(await orm(), Places, { id: place.id }, { transport_mode: 'walking', route_geometry: '[[47,11],[47.2,11.2]]' });
    createTour(testDb, place.id, { distance: 12.5, match_confidence: 0.9, max_hiking_difficulty: 4, created_at: '2025-01-02 03:04:05' });
    await updateRows(await orm(), Tours, { place: place.id }, { elevation_gain: 800, elevation_loss: 790, duration: 5.5, difficulty: 'T3', wanderer_ref: 'w-1' });
    const insert = async (lat: number, lng: number, role: string, sequence: number) =>
      insertRow(await orm(), TourWaypoints, { place: place.id, lat, lng, role, sequence });
    await insert(47, 11, 'start', 0);
    await insert(47.1, 11.1, 'via', 1);
    await insert(47.2, 11.2, 'end', 2);
    return place;
  }

  const tourColumns = async (placeId: number) => {
    const { place_id: _placeId, ...rest } = await storedRow(Tours, { place: placeId }) as Record<string, unknown>;
    return rest;
  };
  const waypoints = async (placeId: number) =>
    await storedRows(TourWaypoints, { place: placeId }, { sequence: 'asc' }, ['lat', 'lng', 'role', 'sequence']);

  it('TRIP-SVC-081: a copied Tour keeps its facet row and waypoints, remapped onto the copied place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Alps' });
    const tour = await seedTour(trip.id, 'Ridge walk');
    createPlace(testDb, trip.id, { name: 'Plain stop' });

    const newTripId = await svc.copy(trip.id, user.id, 'Alps again');

    const newTour = await storedFields(Places, { trip: newTripId, name: 'Ridge walk' }, ['id']) as { id: number };
    const newPlain = await storedFields(Places, { trip: newTripId, name: 'Plain stop' }, ['id']) as { id: number };
    expect(newTour.id).not.toBe(tour.id);
    expect((await tourColumns(newTour.id))).toEqual((await tourColumns(tour.id)));
    expect((await tourColumns(newTour.id))).toMatchObject({ tour_type: 'hike', created_at: '2025-01-02 03:04:05', max_hiking_difficulty: 4 });
    expect((await waypoints(newTour.id))).toEqual((await waypoints(tour.id)));
    expect((await waypoints(newTour.id))).toHaveLength(3);
    // The plain place stays plain, and the source keeps its own rows.
    expect(await storedRow(Tours, { place: newPlain.id })).toBeUndefined();
    expect({ n: await countRows(await orm(), Tours, { place: { trip: trip.id } }) }).toEqual({ n: 1 });
    expect((await waypoints(tour.id))).toHaveLength(3);
  });

  it('TRIP-SVC-082: a failing waypoint insert rolls the copied Tour back with the rest of the copy', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Doomed alps' });
    await seedTour(trip.id, 'Doomed ridge');
    const toursBefore = ({ n: await countRows(await orm(), Tours, {}) } as { n: number }).n;

    const waypointsRepo = await createTestTourWaypointsRepo(testDb);
    const spy = vi.spyOn(waypointsRepo, 'insertForPlace').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(svc.copy(trip.id, user.id, 'Never lands')).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    expect(({ n: await countRows(await orm(), Tours, {}) } as { n: number }).n).toBe(toursBefore);
    expect(await storedFields(Trips, { title: 'Never lands' }, ['id'])).toBeUndefined();
  });
});

// ── Post-fold quirk fixes (transactions, owner display name) ─────────────────

describe('quirk fixes', () => {
  // Plan 3c Task 7 (R8): the SQL-text-keyed `failingConnection`/`failingTrips`
  // Proxy this test used to build a one-off TripsService around is rewritten
  // as a repository-level fault, the same shape TRIP-SVC-052 below already
  // uses for `deleteGuest` — `remove`'s TP32-TP34 (journey_entries stay raw;
  // `deleteById` is TP34, `TripsRepository`'s) are the statements this test
  // pins, and TP34 is now a repository method to `vi.spyOn`, not SQL text to
  // pattern-match. The Proxy could never trigger any more: no statement text
  // matching `'DELETE FROM trips WHERE id = ?'` runs through `this.db`
  // inside `remove`'s transaction any more (TP32/TP33 are the only survivors
  // there, and their own text is untouched).

  it('TRIP-SVC-051 (mutation-proved): remove is atomic — a failed trip DELETE keeps the journey entries intact', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const journeyId = Number(await insertRow(await orm(), Journeys, { user: user.id, title: 'J', created_at: 0, updated_at: 0 }));
    await insertRow(await orm(), JourneyEntries, { journey: journeyId, sourceTrip: trip.id, author: user.id, type: 'skeleton', title: 'S', entry_date: '2025-06-01', created_at: 0, updated_at: 0 });

    const tripsRepo = await createTestTripsRepo(testDb);
    const spy = vi.spyOn(tripsRepo, 'deleteById').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(svc.remove(trip.id, user.id, 'user')).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    // The skeleton cleanup rolled back with the failed delete.
    expect(await storedFields(JourneyEntries, { type: 'skeleton' }, ['id'])).toBeDefined();
    expect(await storedFields(Trips, { id: trip.id }, ['id'])).toBeDefined();
  });

  // R8 (Plan 3c program brief item 8): the SQL-text-keyed `failingConnection`
  // Proxy this test used to build a `failingMembers(match)` service around is
  // rewritten as a repository-level fault (Task 6 converted `deleteGuest` off
  // the raw `this.db` statements entirely, onto `UsersRepository.deleteGuest` — the
  // Proxy could never trigger any more, since no statement text runs through
  // `this.db` inside `deleteGuest`'s transaction).
  it('TRIP-SVC-052: deleteGuest is atomic — a failed user DELETE rolls the budget re-split back', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member: guest } = await membersSvc.createGuest(trip.id, 'Gia', owner.id);
    const item = await budgetSvc.createBudgetItem(trip.id, { name: 'Dinner', total_price: 80, member_ids: [owner.id, guest.id] });

    const usersRepo = await createTestUsersRepo(testDb);
    const spy = vi.spyOn(usersRepo, 'deleteGuest').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(membersSvc.deleteGuest(trip.id, guest.id)).rejects.toThrow('boom');
    } finally {
      spy.mockRestore();
    }

    // Neither the guest nor their split membership was touched.
    expect(await storedFields(Users, { id: guest.id }, ['id'])).toBeDefined();
    const row = await storedFields(BudgetItems, { id: item.id }, ['persons']) as { persons: number | null };
    expect(row.persons).toBe(2);
  });

  it('TRIP-SVC-053: listMembers prefers the owner display_name over the raw username (quirk fix)', async () => {
    const { user: owner } = createUser(testDb, { username: 'owner-handle' });
    await updateRows(await orm(), Users, { id: owner.id }, { display_name: 'Olive Displayed' });
    const trip = createTrip(testDb, owner.id);
    const { owner: row } = await membersSvc.listMembers(trip.id, owner.id);
    expect(row.username).toBe('Olive Displayed');
  });
});

/**
 * activeTrip powers the startup redirect, so its order has to stay identical to
 * the dashboard's sortTrips (client/src/pages/dashboard/dashboardModel.ts):
 * running today → next one starting (earliest first) → most recently started →
 * undated last. If these drift, "open my trip" and the hero show different trips.
 */
describe('searchPlaces (#2190)', () => {
  it('TRIP-SVC-2190-1: finds places by name or address across own and shared trips, archived ones too', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const own = createTrip(testDb, user.id, { title: 'Philly' });
    const shared = createTrip(testDb, other.id, { title: 'SF' });
    addTripMember(testDb, shared.id, user.id);
    const foreign = createTrip(testDb, other.id, { title: 'Hidden' });
    createPlace(testDb, own.id, { name: "Dante's Diner" });
    const museum = createPlace(testDb, own.id, { name: 'Museum' });
    await updateRows(await orm(), Places, { id: museum.id }, { address: '1 Diner Street' });
    createPlace(testDb, shared.id, { name: 'City Lights Books' });
    createPlace(testDb, foreign.id, { name: 'Secret Diner' });
    await updateRows(await orm(), Trips, { id: own.id }, { is_archived: 1 });

    expect(await svc.searchPlaces(user.id, 'diner')).toEqual([{ trip_id: own.id, places: ["Dante's Diner", 'Museum'] }]);
    expect(await svc.searchPlaces(user.id, 'books')).toEqual([{ trip_id: shared.id, places: ['City Lights Books'] }]);
  });

  it('TRIP-SVC-2190-2: wildcards are literal, short queries match nothing, and three names per trip at most', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    for (const name of ['Cafe A', 'Cafe B', 'Cafe C', 'Cafe D', '100% Juice']) createPlace(testDb, trip.id, { name });
    expect((await svc.searchPlaces(user.id, 'cafe'))[0].places).toHaveLength(3);
    expect(await svc.searchPlaces(user.id, '%')).toEqual([]);
    expect((await svc.searchPlaces(user.id, '0%'))[0].places).toEqual(['100% Juice']);
    expect(await svc.searchPlaces(user.id, '_a')).toEqual([]);
  });
});

describe('activeTrip (startup destination)', () => {
  const TODAY = '2026-08-08';

  it('TRIP-SVC-054: prefers the trip running today over anything upcoming', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'soon', start_date: '2026-08-20', end_date: '2026-08-25' });
    createTrip(testDb, user.id, { title: 'running', start_date: '2026-08-05', end_date: '2026-08-12' });
    expect((await svc.activeTrip(user.id, TODAY))?.title).toBe('running');
  });

  it('TRIP-SVC-055: without a running trip it takes the next one starting, earliest first', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'late', start_date: '2026-12-01', end_date: '2026-12-10' });
    createTrip(testDb, user.id, { title: 'soon', start_date: '2026-09-01', end_date: '2026-09-10' });
    expect((await svc.activeTrip(user.id, TODAY))?.title).toBe('soon');
  });

  it('TRIP-SVC-056: falls back to the most recently started trip, undated ones last', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'undated' });
    createTrip(testDb, user.id, { title: 'old', start_date: '2020-01-01', end_date: '2020-01-10' });
    createTrip(testDb, user.id, { title: 'recent', start_date: '2026-07-01', end_date: '2026-07-10' });
    expect((await svc.activeTrip(user.id, TODAY))?.title).toBe('recent');
  });

  it('TRIP-SVC-057: skips archived trips and returns undefined when nothing is left', async () => {
    const { user } = createUser(testDb);
    const archived = createTrip(testDb, user.id, { title: 'archived', start_date: '2026-08-05', end_date: '2026-08-12' });
    await updateRows(await orm(), Trips, { id: archived.id }, { is_archived: 1 });
    expect(await svc.activeTrip(user.id, TODAY)).toBeUndefined();
  });

  it('TRIP-SVC-058: sees shared trips but never another user\'s private ones', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    createTrip(testDb, owner.id, { title: 'private', start_date: '2026-08-05', end_date: '2026-08-12' });
    const shared = createTrip(testDb, owner.id, { title: 'shared', start_date: '2026-09-01', end_date: '2026-09-10' });
    addTripMember(testDb, shared.id, guest.id);
    expect((await svc.activeTrip(guest.id, TODAY))?.title).toBe('shared');
  });
});
