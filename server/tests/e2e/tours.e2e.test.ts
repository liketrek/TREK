/**
 * Tours module e2e: every /api/trips/:tripId/tours endpoint through the real
 * JwtAuthGuard, AddonGuard and TripAccessGuard against a real migrated and
 * seeded temp SQLite db (createSnapshotTestDb()). ToursService, PlacesService,
 * AssignmentsService and TripsService run their real SQL; only the permission
 * check (a container spy) and the journey hooks are stubbed, and the broadcast
 * goes to a FakeRealtimeService.
 *
 * Fixtures: user 1 owns trips 5 and 6, user 2 is a member of trip 5 whom the
 * permission spy denies 'place_edit', user 3 has no access to either trip.
 * AssignmentsModule and TripsModule are mounted next to ToursModule so the
 * one-tour-per-day 409 on move and the trip copy run through their real routes.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));

import { db } from '../../src/db/database';

const { journeyHooks } = vi.hoisted(() => ({
  journeyHooks: {
    reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
    onPlaceCreated: vi.fn().mockResolvedValue(undefined),
    onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
    onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
  },
}));
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { BudgetService } from '../../src/nest/budget/budget.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TripsModule } from '../../src/nest/trips/trips.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { countRows, deleteRows, findRow, insertRows } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { addTripMember } from '../helpers/factories/trips';
import { makePlace, type PlaceRow } from '../helpers/factories/places';
import { makeDayAssignment } from '../helpers/factories/itinerary';
import { setAddonEnabled } from '../helpers/factories/settings';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourWaypoints } from '../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { FakeRealtimeService } from '../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

let orm: TestOrm;

let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;

const GEOMETRY = [[47, 11, 600], [47.01, 11.01, 700], [47.02, 11.02, 650]];
const tourBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ridge walk',
  route_geometry: GEOMETRY,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 3,
  duration_seconds: 3600,
  ...overrides,
});

const TRACK_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Alpine loop</name><trkseg>
  <trkpt lat="49" lon="12"><ele>100</ele></trkpt>
  <trkpt lat="49.01" lon="12.01"><ele>150</ele></trkpt>
  <trkpt lat="49.02" lon="12.02"><ele>120</ele></trkpt>
</trkseg></trk></gpx>`;
const FLAT_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Flat path</name><trkseg>
  <trkpt lat="50" lon="13"/><trkpt lat="50.01" lon="13.01"/>
</trkseg></trk></gpx>`;
// Large enough that a guard rejecting before multer drained the body would
// surface as a connection reset instead of a JSON response.
const BIG_GPX = TRACK_GPX.replace('</gpx>', `<!-- ${'x'.repeat(512 * 1024)} --></gpx>`);

describe('Tours e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ToursModule,
        AssignmentsModule,
        TripsModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue(journeyHooks)
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const setAddon = (enabled: boolean) => setAddonEnabled(orm, 'tours', enabled);

  /** The named columns of a stored place, as a projected SELECT would return them. */
  const placeColumns = async <K extends keyof PlaceRow>(id: number, ...keys: K[]) => {
    const row = await findRow(orm, Places, { id });
    return Object.fromEntries(keys.map((k) => [k, row?.[k]])) as Pick<PlaceRow, K>;
  };

  /** A plain place on the trip, no coordinates and no category. */
  const plainPlace = async (tripId: number, name: string) =>
    (await makePlace(orm, tripId, { name, lat: null, lng: null, category: null })).id;

  const createViaApi = async (tripId = 5, body: Record<string, unknown> = tourBody()) => {
    const res = await request(server).post(`/api/trips/${tripId}/tours`).set('Cookie', sessionCookie(OWNER)).send(body);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

  const importGpx = (userId: number, xml: string | null, tripId = 5) => {
    const req = request(server).post(`/api/trips/${tripId}/tours/import/gpx`).set('Cookie', sessionCookie(userId));
    return xml === null ? req.field('note', 'none') : req.attach('file', Buffer.from(xml), { filename: 'track.gpx', contentType: 'application/gpx+xml' });
  };

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 3, username: 'outsider', email: 'outsider@example.test', role: 'user', password_version: 0 });
    await insertRows(orm, Trips, [
      { id: 5, user: 1, title: 'Alps' },
      { id: 6, user: 1, title: 'Other' },
    ]);
    await addTripMember(orm, 5, 2);
    await insertRows(orm, Days, [
      { id: 3, trip: 5, day_number: 1 },
      { id: 4, trip: 5, day_number: 2 },
    ]);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    vi.spyOn(app.get(BudgetService), 'listBudgetItems').mockResolvedValue([]);
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    // The viewer is a trip member whose 'place_edit' is withheld; every other
    // action and user passes, so the owner can create, move and copy.
    checkPermission.mockImplementation((action: string, _role: string, _owner: number, userId: number) =>
      !(action === 'place_edit' && userId === VIEWER));
    await setAddon(true);
    broadcast.mockClear();
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
    await deleteRows(orm, Trips, { id: { $nin: [5, 6] } });
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  describe('addon and access gates', () => {
    it('401 without a cookie', async () => {
      expect((await request(server).get('/api/trips/5/tours')).status).toBe(401);
    });

    it('404 on every route while the addon is disabled', async () => {
      const placeId = await createViaApi();
      await setAddon(false);
      const off = { error: 'Tours addon is not enabled' };
      const cookie = sessionCookie(OWNER);
      const responses = [
        await request(server).get('/api/trips/5/tours').set('Cookie', cookie),
        await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie),
        await request(server).post('/api/trips/5/tours').set('Cookie', cookie).send(tourBody()),
        await request(server).put(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie).send(tourBody({ name: 'Renamed' })),
        await importGpx(OWNER, BIG_GPX),
      ];
      for (const res of responses) {
        expect(res.status).toBe(404);
        expect(res.body).toEqual(off);
      }
      expect(await countRows(orm, Tours)).toBe(1);
      expect(await placeColumns(placeId, 'name')).toEqual({ name: 'Ridge walk' });
    });

    it('404 Trip not found for a user without access to the trip', async () => {
      const placeId = await createViaApi();
      const cookie = sessionCookie(OUTSIDER);
      const responses = [
        await request(server).get('/api/trips/5/tours').set('Cookie', cookie),
        await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie),
        await request(server).post('/api/trips/5/tours').set('Cookie', cookie).send(tourBody()),
        await request(server).put(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie).send(tourBody()),
        await importGpx(OUTSIDER, BIG_GPX),
        await request(server).get('/api/trips/999/tours').set('Cookie', sessionCookie(OWNER)),
      ];
      for (const res of responses) {
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Trip not found' });
      }
      expect(await countRows(orm, Tours)).toBe(1);
    });

    it('a member without place_edit can read but gets 403 on every write', async () => {
      const placeId = await createViaApi();
      const cookie = sessionCookie(VIEWER);

      const list = await request(server).get('/api/trips/5/tours').set('Cookie', cookie);
      expect(list.status).toBe(200);
      expect(list.body.tours).toHaveLength(1);
      expect((await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie)).status).toBe(200);

      const writes = [
        await request(server).post('/api/trips/5/tours').set('Cookie', cookie).send(tourBody()),
        await request(server).put(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie).send(tourBody({ name: 'Hijacked' })),
        await importGpx(VIEWER, BIG_GPX),
      ];
      for (const res of writes) {
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'No permission' });
      }
      expect(await countRows(orm, Tours)).toBe(1);
      expect(await placeColumns(placeId, 'name')).toEqual({ name: 'Ridge walk' });
    });
  });

  describe('POST and GET', () => {
    it('201 creates the place, the facet and its waypoints, then lists and reads them back', async () => {
      const res = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', sessionCookie(OWNER))
        .set('X-Socket-Id', 'sock-1')
        .send(tourBody());
      expect(res.status).toBe(201);
      const placeId = res.body.tour.place_id as number;
      expect(res.body.tour).toMatchObject({
        place_id: placeId, name: 'Ridge walk', tour_type: 'hike', duration: 60, match_confidence: 1,
        max_hiking_difficulty: 3, planned: false, caution: false, has_waypoints: true,
      });
      expect(res.body.tour.distance).toBeGreaterThan(0);
      expect(res.body.tour.elevation_gain).toBe(100);
      expect(res.body.tour.elevation_loss).toBe(50);
      expect(res.body.waypoints).toEqual(tourBody().waypoints);

      expect(await placeColumns(placeId, 'trip_id', 'lat', 'lng', 'transport_mode', 'route_geometry')).toEqual({
        trip_id: 5, lat: 47, lng: 11, transport_mode: 'walking', route_geometry: JSON.stringify(GEOMETRY),
      });
      const events = broadcast.mock.calls.map(c => c[1]);
      expect(events).toEqual(expect.arrayContaining(['tours:changed', 'place:created']));
      expect(broadcast.mock.calls.every(c => c[3] === 'sock-1')).toBe(true);

      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      expect(list.status).toBe(200);
      expect(list.body.tours).toEqual([res.body.tour]);

      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.status).toBe(200);
      expect(detail.body).toEqual(res.body);
    });

    it('lists newest first and reports planned once a day holds the tour', async () => {
      const first = await createViaApi(5, tourBody({ name: 'First' }));
      const second = await createViaApi(5, tourBody({ name: 'Second' }));
      await makeDayAssignment(orm, 3, first, { order_index: 0 });
      const res = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      expect(res.body.tours.map((t: { place_id: number; planned: boolean }) => [t.place_id, t.planned])).toEqual([
        [second, false],
        [first, true],
      ]);
    });

    it('400 for an invalid body, nothing written', async () => {
      const cookie = sessionCookie(OWNER);
      const badRole = await request(server).post('/api/trips/5/tours').set('Cookie', cookie).send(tourBody({
        waypoints: [{ lat: 47, lng: 11, role: 'via', sequence: 0 }, { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 }],
      }));
      expect(badRole.status).toBe(400);
      const shortRoute = await request(server).post('/api/trips/5/tours').set('Cookie', cookie).send(tourBody({ route_geometry: [[47, 11, 600]] }));
      expect(shortRoute.status).toBe(400);
      const badDifficulty = await request(server).post('/api/trips/5/tours').set('Cookie', cookie).send(tourBody({ max_hiking_difficulty: 7 }));
      expect(badDifficulty.status).toBe(400);
      expect(await countRows(orm, Places)).toBe(0);
    });

    it('GET 404 for a tour of another trip, a plain place and a non-numeric id', async () => {
      const foreign = await createViaApi(6);
      const plain = await plainPlace(5, 'Cafe');
      for (const id of [foreign, plain, 'abc', 999999]) {
        const res = await request(server).get(`/api/trips/5/tours/${id}`).set('Cookie', sessionCookie(OWNER));
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Tour not found' });
      }
      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      expect(list.body.tours).toEqual([]);
    });

    it('GET falls back to the geometry endpoints for a tour without saved waypoints', async () => {
      const res = await importGpx(OWNER, TRACK_GPX);
      expect(res.status).toBe(201);
      const placeId = res.body.tours[0].place_id as number;
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.status).toBe(200);
      expect(detail.body.tour).toMatchObject({ place_id: placeId, has_waypoints: false });
      expect(detail.body.waypoints).toEqual([
        { lat: 49, lng: 12, role: 'start', sequence: 0 },
        { lat: 49.02, lng: 12.02, role: 'end', sequence: 1 },
      ]);
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(0);
    });
  });

  describe('PUT', () => {
    it('200 replaces the route, metrics and waypoints', async () => {
      const placeId = await createViaApi();
      const geometry = [[46, 10, 1000], [46.01, 10.01, 1200], [46.02, 10.02, 1100]];
      const waypoints = [
        { lat: 46, lng: 10, role: 'start', sequence: 0 },
        { lat: 46.01, lng: 10.01, role: 'via', sequence: 1 },
        { lat: 46.02, lng: 10.02, role: 'end', sequence: 2 },
      ];
      const res = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ name: 'Summit', route_geometry: geometry, waypoints, max_hiking_difficulty: 5, duration_seconds: null }));
      expect(res.status).toBe(200);
      expect(res.body.tour).toMatchObject({
        place_id: placeId, name: 'Summit', elevation_gain: 200, elevation_loss: 100, duration: null, max_hiking_difficulty: 5,
      });
      expect(res.body.waypoints).toEqual(waypoints);
      expect(await placeColumns(placeId, 'name', 'lat', 'lng', 'route_geometry')).toEqual({
        name: 'Summit', lat: 46, lng: 10, route_geometry: JSON.stringify(geometry),
      });
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(3);
      expect(broadcast.mock.calls.map(c => c[1])).toEqual(expect.arrayContaining(['tours:changed', 'place:updated']));
    });

    it('404 for a tour of another trip, a plain place and a non-numeric id, nothing changes', async () => {
      const foreign = await createViaApi(6);
      const plain = await plainPlace(5, 'Cafe');
      for (const id of [foreign, plain, 'abc']) {
        const res = await request(server).put(`/api/trips/5/tours/${id}`).set('Cookie', sessionCookie(OWNER)).send(tourBody({ name: 'Moved' }));
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Tour not found' });
      }
      expect(await placeColumns(foreign, 'trip_id', 'name')).toEqual({ trip_id: 6, name: 'Ridge walk' });
      expect(await placeColumns(plain, 'name', 'route_geometry')).toEqual({ name: 'Cafe', route_geometry: null });
      expect(await countRows(orm, Tours, { place: plain })).toBe(0);
      expect(await countRows(orm, TourWaypoints, { place: foreign })).toBe(2);
    });
  });

  describe('POST import/gpx', () => {
    it('201 imports each track as a hike tour', async () => {
      const res = await importGpx(OWNER, TRACK_GPX);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ caution: false, skipped: 0 });
      expect(res.body.tours).toHaveLength(1);
      const tour = res.body.tours[0];
      expect(tour).toMatchObject({ name: 'Alpine loop', tour_type: 'hike', match_confidence: 1, max_hiking_difficulty: 2, has_waypoints: false });
      expect(await placeColumns(tour.place_id, 'trip_id')).toEqual({ trip_id: 5 });
      expect((await findRow(orm, Tours, { place: tour.place_id }))?.tour_type).toBe('hike');
      expect(broadcast.mock.calls.map(c => c[1])).toEqual(expect.arrayContaining(['tours:changed', 'place:created']));
    });

    it('flags a track without elevation with caution', async () => {
      const res = await importGpx(OWNER, FLAT_GPX);
      expect(res.status).toBe(201);
      expect(res.body.caution).toBe(true);
      expect(res.body.tours[0]).toMatchObject({ match_confidence: 0.3, caution: true });
    });

    it('a second import of the same track is skipped as a duplicate', async () => {
      expect((await importGpx(OWNER, TRACK_GPX)).status).toBe(201);
      const again = await importGpx(OWNER, TRACK_GPX);
      expect(again.status).toBe(201);
      expect(again.body).toEqual({ tours: [], caution: false, skipped: 1 });
      expect(await countRows(orm, Tours)).toBe(1);
    });

    it('400 without a file, and for a file with no track or route', async () => {
      const missing = await importGpx(OWNER, null);
      expect(missing.status).toBe(400);
      expect(missing.body).toEqual({ error: 'No file uploaded' });
      for (const xml of ['<not-gpx/>', '<gpx/>', '<gpx><wpt lat="1" lon="2"/></gpx>', 'plain text']) {
        const res = await importGpx(OWNER, xml);
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'No track or route found in GPX file' });
      }
      expect(await countRows(orm, Places)).toBe(0);
    });
  });

  describe('other domains', () => {
    it('409 moving a tour onto a day that already holds it, on create and on move', async () => {
      const placeId = await createViaApi();
      const cookie = sessionCookie(OWNER);
      const onDay4 = await request(server).post('/api/trips/5/days/4/assignments').set('Cookie', cookie).send({ place_id: placeId });
      expect(onDay4.status).toBe(201);
      const onDay3 = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', cookie).send({ place_id: placeId });
      expect(onDay3.status).toBe(201);

      const twice = await request(server).post('/api/trips/5/days/4/assignments').set('Cookie', cookie).send({ place_id: placeId });
      expect(twice.status).toBe(409);
      expect(twice.body).toEqual({ error: 'Tour is already assigned to this day' });

      const moving = onDay3.body.assignment.id as number;
      const move = await request(server).put(`/api/trips/5/assignments/${moving}/move`).set('Cookie', cookie).send({ new_day_id: 4, order_index: 1 });
      expect(move.status).toBe(409);
      expect(move.body).toEqual({ error: 'Tour is already assigned to this day' });
      expect((await findRow(orm, DayAssignments, { id: moving }))?.day_id).toBe(3);
      expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(2);
    });

    it('copying the trip carries its tours and waypoints onto the new places', async () => {
      const placeId = await createViaApi(5, tourBody({
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0 },
          { lat: 47.01, lng: 11.01, role: 'via', sequence: 1 },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
        ],
      }));
      const res = await request(server).post('/api/trips/5/copy').set('Cookie', sessionCookie(OWNER)).send({ title: 'Alps again' });
      expect(res.status).toBe(201);
      const copyId = res.body.trip.id as number;

      const list = await request(server).get(`/api/trips/${copyId}/tours`).set('Cookie', sessionCookie(OWNER));
      expect(list.status).toBe(200);
      expect(list.body.tours).toHaveLength(1);
      const copied = list.body.tours[0];
      expect(copied.place_id).not.toBe(placeId);
      const source = (await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER))).body;
      const { place_id: _sourceId, ...sourceRest } = source.tour;
      const { place_id: _copyId, ...copyRest } = copied;
      expect(copyRest).toEqual(sourceRest);

      const detail = await request(server).get(`/api/trips/${copyId}/tours/${copied.place_id}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.waypoints).toEqual(source.waypoints);
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(3);
    });

    it('deleting the place removes its tour and waypoints and reports the tour id', async () => {
      const placeId = await createViaApi();
      const res = await request(server).delete(`/api/trips/5/places/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, tourPlaceIds: [placeId] });
      expect(await countRows(orm, Tours, { place: placeId })).toBe(0);
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(0);
    });
  });
});
