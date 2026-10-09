/**
 * The tours-mode GPX import end to end through the real PlacesService and
 * ToursService over the migrated per-worker DB: the places, their track
 * colours and their tours facets commit in one transaction (PlacesService's
 * importPreparedGpx nests in ToursService's as a savepoint), any failure on
 * the way rolls all of it back, and the realtime events go out only after the
 * commit. Failures are injected with SQLite triggers on the real tables.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { Logger } from '@nestjs/common';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { db as testDb } from '../../../src/db/database';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { gpxParser } from '../../../src/nest/places/places.helpers';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { resetTestDb } from '../../helpers/test-db';
import { createTrip, createUser } from '../../helpers/factories';
import { accommodationsOver } from '../../helpers/accommodations-service';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { noGoogleQuota } from '../../helpers/google-quota';
import {
  createTestUnitOfWork, createTestAppSettingsRepo, createTestUsersRepo, createTestTagsRepo, createTestPlaceRatingsRepo,
  createTestAssignmentParticipantsRepo, createTestPlacesRepo, createTestTripMembersRepo, createTestDayAssignmentsRepo,
  createTestCategoriesRepo, createTestTripsRepo, createTestCollectionPlacesRepo, sharedTestOrm,
} from '../../helpers/test-uow';
import type { EntityClass } from '@mikro-orm/core';
import { countRows, findRows } from '../../helpers/factories/rows';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { createTestToursRepo, createTestTourTypesRepo, createTestTourWaypointsRepo } from '../../helpers/tours-repos';

const mixedGpx = Buffer.from(`<gpx>
  <wpt lat="1" lon="2"><name>Ignored POI</name></wpt>
  <rte><desc>Route description</desc><rtept lat="48" lon="11"/><rtept lat="48.01" lon="11.01"/></rte>
  <trk><name>Ridge</name><desc>Track description</desc><trkseg>
    <trkpt lat="49" lon="12"><ele>100</ele></trkpt>
    <trkpt lat="49.01" lon="12.01"><ele>150</ele></trkpt>
  </trkseg><trkseg><trkpt lat="49.02" lon="12.02"><ele>120</ele></trkpt></trkseg></trk>
</gpx>`);

const TRIGGERS = ['fail_facet', 'fail_place', 'fail_color'];

/** The collaborator set the container hands PlacesService (the places.service.test.ts builder). */
async function makePlacesService(): Promise<PlacesService> {
  const photoCacheStub = { removeIfUnreferenced: vi.fn() } as unknown as PlacePhotoCacheService;
  const noAppSettings = { getValue: async () => null } as unknown as AppSettingsRepository;
  const noUsers = { getApiKeyColumn: async () => null } as unknown as UsersRepository;
  const storage = makeStorageFixture('').storage;
  const orm = await sharedTestOrm(testDb);
  return new PlacesService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
    new MapsService(photoCacheStub, noAppSettings, noUsers, {} as never, {} as never, noGoogleQuota),
    new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
    new UnsplashService(await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), new RuntimeEnvService(), storage),
    photoCacheStub,
    new JourneyDomainService(
      new RealtimeService(), new TrekPhotoRegistrationService(orm.repo(TrekPhotos), orm.repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)), await createTestUnitOfWork(testDb),
      await createTestJourneysRepo(testDb), await createTestJourneyContributorsRepo(testDb),
      await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
      await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
    ),
    storage,
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
}

let uow: UnitOfWork;
let places: PlacesService;
let tours: ToursService;
let tripId: string;
let broadcast: MockInstance<PlacesService['broadcast']>;

const countedTables = { places: Places, tours: Tours, tour_waypoints: TourWaypoints } as const;
const count = async (table: keyof typeof countedTables) =>
  countRows(await sharedTestOrm(testDb), countedTables[table] as EntityClass<object>);
/**
 * The broadcast probe reads mid-request, while the import may still hold the
 * connection inside its transaction: it has to see the handle's own state
 * synchronously, past the ORM's connection queue, which a raw read on the
 * shared handle does.
 */
const countNow = (table: keyof typeof countedTables) =>
  // test-sql-allow: a synchronous read on the shared handle mid-transaction is what this probe measures.
  (testDb.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

beforeAll(async () => {
  uow = await createTestUnitOfWork(testDb);
  places = await makePlacesService();
  tours = new ToursService(
    uow, places, await createTestToursRepo(testDb), await createTestTourTypesRepo(testDb), await createTestTourWaypointsRepo(testDb), await createTestPlacesRepo(testDb),
  );
});

beforeEach(async () => {
  resetTestDb(testDb);
  (await sharedTestOrm(testDb)).clear();
  const { user } = createUser(testDb);
  tripId = String(createTrip(testDb, user.id).id);
  broadcast = vi.spyOn(places, 'broadcast').mockImplementation(() => {});
});

afterEach(() => {
  for (const name of TRIGGERS) testDb.exec(`DROP TRIGGER IF EXISTS ${name}`);
  vi.restoreAllMocks();
});

afterAll(() => { testDb.close(); });

describe('Tours GPX atomic persistence and postcommit publication', () => {
  async function expectEmpty() {
    for (const table of ['places', 'tours', 'tour_waypoints'] as const) expect(await count(table)).toBe(0);
    expect(broadcast).not.toHaveBeenCalled();
  }

  it('commits routes, tracks, colors and facets once before publishing, without Planner waypoints', async () => {
    const transactional = vi.spyOn(uow, 'transactional');
    const seen: { inTransaction: boolean; tours: number }[] = [];
    broadcast.mockImplementation(() => { seen.push({ inTransaction: testDb.inTransaction, tours: countNow('tours') }); });

    const result = (await tours.importGpxAsTour(tripId, mixedGpx, 'walk.gpx', 'socket'))!;

    // The tours transaction, with importPreparedGpx and its colouring nested inside as savepoints.
    expect(transactional.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.tours).toHaveLength(2);
    expect(result.skipped).toBe(0);
    expect(result.caution).toBe(true);
    expect(result.tours[0]).toMatchObject({ name: 'walk', tour_type: 'hike', max_hiking_difficulty: 2, planned: false, has_waypoints: false, caution: true, match_confidence: 0.3, duration: null, planned_duration_minutes: null, break_additional_minutes: null });
    expect(result.tours[1]).toMatchObject({ name: 'Ridge', elevation_gain: 50, elevation_loss: 30, caution: false, match_confidence: 1 });

    const rows = (await findRows(await sharedTestOrm(testDb), Places, {}, { id: 'asc' })) as Array<{ id: number; trip_id: number; description: string; route_geometry: string; route_color: string }>;
    expect(rows.map(row => row.trip_id)).toEqual([Number(tripId), Number(tripId)]);
    expect(rows.map(row => row.description)).toEqual(['Route description', 'Track description']);
    expect(JSON.parse(rows[0].route_geometry)).toEqual([[48, 11], [48.01, 11.01]]);
    expect(JSON.parse(rows[1].route_geometry)).toEqual([[49, 12, 100], [49.01, 12.01, 150], [49.02, 12.02, 120]]);
    expect(new Set(rows.map(row => row.route_color)).size).toBe(2);
    expect((await findRows(await sharedTestOrm(testDb), Tours, {}, { place: 'asc' })).map(tour => ({
      place_id: tour.place_id,
      tour_type: tour.tour_type,
      duration: tour.duration,
      planned_duration_minutes: tour.planned_duration_minutes,
      break_additional_minutes: tour.break_additional_minutes,
    }))).toEqual(rows.map(row => ({
      place_id: row.id,
      tour_type: 'hike',
      duration: null,
      planned_duration_minutes: null,
      break_additional_minutes: null,
    })));
    expect(await count('tour_waypoints')).toBe(0);

    expect(seen).toEqual([
      { inTransaction: false, tours: 2 }, { inTransaction: false, tours: 2 }, { inTransaction: false, tours: 2 },
    ]);
    expect(broadcast.mock.calls.map(call => call[1])).toEqual(['tours:changed', 'place:created', 'place:created']);
    expect(broadcast.mock.calls[0]).toEqual([tripId, 'tours:changed', { placeIds: rows.map(row => row.id) }, 'socket']);
    for (const call of broadcast.mock.calls.slice(1)) {
      expect(call[3]).toBe('socket');
      expect((call[2] as { place: { route_color: string } }).place.route_color).toBeTruthy();
    }
    expect(broadcast.mock.calls.slice(1).map(call => (call[2] as { place: { id: number } }).place.id))
      .toEqual(result.tours.map(tour => tour.place_id));
  });

  it.each([1, 2])('rolls back every carrier and facet when facet %i fails', async (ordinal) => {
    testDb.exec(`CREATE TRIGGER fail_facet BEFORE INSERT ON tours
      WHEN (SELECT COUNT(*) FROM tours) = ${ordinal - 1}
      BEGIN SELECT RAISE(ABORT, 'facet failure'); END;`);
    await expect(tours.importGpxAsTour(tripId, mixedGpx)).rejects.toThrow('facet failure');
    await expectEmpty();
  });

  it('rolls back earlier carriers when the later Place insert fails', async () => {
    testDb.exec(`CREATE TRIGGER fail_place BEFORE INSERT ON places WHEN NEW.name = 'Ridge'
      BEGIN SELECT RAISE(ABORT, 'place failure'); END;`);
    await expect(tours.importGpxAsTour(tripId, mixedGpx)).rejects.toThrow('place failure');
    await expectEmpty();
  });

  it('rolls back carriers and earlier colors when later coloring fails', async () => {
    testDb.exec(`CREATE TRIGGER fail_color BEFORE UPDATE OF route_color ON places WHEN NEW.name = 'Ridge'
      BEGIN SELECT RAISE(ABORT, 'color failure'); END;`);
    await expect(tours.importGpxAsTour(tripId, mixedGpx)).rejects.toThrow('color failure');
    await expectEmpty();
  });

  it.each(['<not-gpx/>', '<gpx/>', '<gpx><wpt lat="1" lon="2"/></gpx>', '<gpx><trk><trkseg><trkpt/></trkseg></trk></gpx>'])('does not write or publish unusable input %s', async (xml) => {
    const transactional = vi.spyOn(uow, 'transactional');
    expect(await tours.importGpxAsTour(tripId, Buffer.from(xml))).toBeNull();
    expect(transactional).not.toHaveBeenCalled();
    await expectEmpty();
  });

  it('propagates parser failures before entering the transaction', async () => {
    const transactional = vi.spyOn(uow, 'transactional');
    vi.spyOn(gpxParser, 'parse').mockImplementationOnce(() => { throw new Error('parser failure'); });
    await expect(tours.importGpxAsTour(tripId, mixedGpx)).rejects.toThrow('parser failure');
    expect(transactional).not.toHaveBeenCalled();
    await expectEmpty();
  });

  it('keeps a committed response and attempts remaining events if publication throws', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    broadcast.mockImplementationOnce(() => { throw new Error('transport unavailable'); });
    expect((await tours.importGpxAsTour(tripId, mixedGpx))?.tours).toHaveLength(2);
    expect(await count('tours')).toBe(2);
    expect(broadcast).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('keeps committed rows and success response if a place event fails', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    broadcast.mockImplementation((_tripId, event) => {
      if (event === 'place:created') throw new Error('transport unavailable');
    });

    expect((await tours.importGpxAsTour(tripId, mixedGpx))?.tours).toHaveLength(2);
    expect(await count('places')).toBe(2);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('keeps committed rows and success response if the Tours invalidation event fails', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    broadcast.mockImplementation((_tripId, event) => {
      if (event === 'tours:changed') throw new Error('invalidation unavailable');
    });

    const result = await tours.importGpxAsTour(tripId, mixedGpx);

    expect(result?.tours).toHaveLength(2);
    expect(await count('places')).toBe(2);
    expect(await count('tours')).toBe(2);
    expect(broadcast.mock.calls.map(call => call[1])).toEqual(['tours:changed', 'place:created', 'place:created']);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('returns a successful skipped result for duplicate-only imports without publishing events', async () => {
    expect((await tours.importGpxAsTour(tripId, mixedGpx))?.tours).toHaveLength(2);
    const placeRows = async () =>
      (await findRows(await sharedTestOrm(testDb), Places, {}, { id: 'asc' })).map(row => ({ id: row.id, trip_id: row.trip_id, name: row.name }));
    const tourFacets = async () =>
      (await findRows(await sharedTestOrm(testDb), Tours, {}, { place: 'asc' })).map(tour => ({ place_id: tour.place_id }));
    const rowsBefore = await placeRows();
    const facetsBefore = await tourFacets();
    broadcast.mockClear();

    expect(await tours.importGpxAsTour(tripId, mixedGpx)).toEqual({ tours: [], caution: false, skipped: 2 });
    expect(await placeRows()).toEqual(rowsBefore);
    expect(await tourFacets()).toEqual(facetsBefore);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('imports only the new tracks and publishes only committed rows in a mixed result', async () => {
    const existing = Buffer.from(`<gpx><trk><name>Ridge</name><trkseg>
      <trkpt lat="49" lon="12"><ele>100</ele></trkpt><trkpt lat="49.01" lon="12.01"><ele>150</ele></trkpt>
    </trkseg></trk></gpx>`);
    expect((await tours.importGpxAsTour(tripId, existing))?.tours).toHaveLength(1);
    broadcast.mockClear();

    const result = await tours.importGpxAsTour(tripId, mixedGpx, 'walk.gpx', 'socket');

    expect(result?.tours).toHaveLength(1);
    expect(result?.tours[0].name).toBe('walk');
    expect(result?.skipped).toBe(1);
    expect(await count('places')).toBe(2);
    expect(await count('tours')).toBe(2);
    const walkId = result!.tours[0].place_id;
    expect(broadcast.mock.calls.map(call => [call[1], call[2]])).toEqual([
      ['tours:changed', { placeIds: [walkId] }],
      ['place:created', expect.objectContaining({ place: expect.objectContaining({ id: walkId, name: 'walk' }) })],
    ]);
  });

  it('preserves single-track response and trip scoping', async () => {
    const { user } = createUser(testDb);
    const otherTripId = String(createTrip(testDb, user.id).id);
    const single = Buffer.from('<gpx><trk><trkseg><trkpt lat="48" lon="11"/><trkpt lat="48.01" lon="11.01"/></trkseg></trk></gpx>');

    const result = (await tours.importGpxAsTour(otherTripId, single, 'single.gpx'))!;

    expect(result.tours).toHaveLength(1);
    expect(result.tours[0].name).toBe('single');
    expect(result.caution).toBe(true);
    expect((await findRows(await sharedTestOrm(testDb), Places, {}, { id: 'asc' })).map(row => ({ trip_id: row.trip_id }))).toEqual([{ trip_id: Number(otherTripId) }]);
    expect((await tours.listTours(otherTripId)).map(t => t.place_id)).toEqual([result.tours[0].place_id]);
    expect(await tours.listTours(tripId)).toEqual([]);
    expect(broadcast.mock.calls.map(call => call[1])).toEqual(['tours:changed', 'place:created']);
  });
});
