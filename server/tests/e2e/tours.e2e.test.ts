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
import { db } from '../../src/db/database';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { PaddleFeatures } from '../../src/db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../src/db/entities/PaddleRegions.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourObstacleReviews } from '../../src/db/entities/TourObstacleReviews.entity';
import { TourSources } from '../../src/db/entities/TourSources.entity';
import { TourTypes } from '../../src/db/entities/TourTypes.entity';
import { TourWaypoints } from '../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { BudgetService } from '../../src/nest/budget/budget.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { TripsModule } from '../../src/nest/trips/trips.module';
import { makeDayAssignment } from '../helpers/factories/itinerary';
import { makePlace, type PlaceRow } from '../helpers/factories/places';
import { countRows, deleteRows, findRow, insertRows, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { keyed } from '../helpers/tour-keys';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import archiver from 'archiver';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { PassThrough } from 'stream';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi, type MockInstance } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const { journeyHooks } = vi.hoisted(() => ({
  journeyHooks: {
    reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
    onPlaceCreated: vi.fn().mockResolvedValue(undefined),
    onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
    onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
  },
}));

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

let orm: TestOrm;

let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;

const GEOMETRY = [
  [47, 11, 600],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];
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
/** A paddle plan without marks: enough for the gates, which answer before the body is read. */
const NO_MARKS = { paddle_speed_kmh: null, portage_speed_kmh: null, track_marks: { portages: [], locks: [] } };

/** A change to a paddle tour's checklist: enough for the gates, which answer before the body is read. */
const NO_OPS = { ops: [{ key: 'node/1', op: 'clear', decision: null, note: null, basis: null }] };

/** A body as a second read answers it: a paddle tour's checklist is compared anew on every read, so its time moves. */
function readAgain(body: { obstacle_check?: { evaluated_at: string } }): unknown {
  return body.obstacle_check ? { ...body, obstacle_check: { ...body.obstacle_check, evaluated_at: 'read' } } : body;
}

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

  const importGpx = (
    userId: number,
    xml: string | null,
    tripId = 5,
    fields: Record<string, string> = {},
    path = 'import/gpx',
  ) => {
    let req = request(server).post(`/api/trips/${tripId}/tours/${path}`).set('Cookie', sessionCookie(userId));
    for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
    return xml === null
      ? req.field('note', 'none')
      : req.attach('file', Buffer.from(xml), { filename: 'track.gpx', contentType: 'application/gpx+xml' });
  };
  const previewGpx = (userId: number, xml: string | null, tripId = 5) =>
    importGpx(userId, xml, tripId, {}, 'import/gpx/preview');

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, {
      id: 3,
      username: 'outsider',
      email: 'outsider@example.test',
      role: 'user',
      password_version: 0,
    });
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
    checkPermission.mockImplementation(
      (action: string, _role: string, _owner: number, userId: number) =>
        !(action === 'place_edit' && userId === VIEWER),
    );
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
      expect((await request(server).put('/api/trips/5/tours/1/paddle-plan').send(NO_MARKS)).status).toBe(401);
      expect((await request(server).put('/api/trips/5/tours/1/obstacle-reviews').send(NO_OPS)).status).toBe(401);
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
        await request(server)
          .put(`/api/trips/5/tours/${placeId}`)
          .set('Cookie', cookie)
          .send(tourBody({ name: 'Renamed' })),
        await importGpx(OWNER, BIG_GPX),
        await previewGpx(OWNER, BIG_GPX),
        await request(server).put(`/api/trips/5/tours/${placeId}/paddle-plan`).set('Cookie', cookie).send(NO_MARKS),
        await request(server).put(`/api/trips/5/tours/${placeId}/obstacle-reviews`).set('Cookie', cookie).send(NO_OPS),
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
        await previewGpx(OUTSIDER, BIG_GPX),
        await request(server).put(`/api/trips/5/tours/${placeId}/paddle-plan`).set('Cookie', cookie).send(NO_MARKS),
        await request(server).put(`/api/trips/5/tours/${placeId}/obstacle-reviews`).set('Cookie', cookie).send(NO_OPS),
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
        await request(server)
          .put(`/api/trips/5/tours/${placeId}`)
          .set('Cookie', cookie)
          .send(tourBody({ name: 'Hijacked' })),
        await importGpx(VIEWER, BIG_GPX),
        await previewGpx(VIEWER, BIG_GPX),
        await request(server).put(`/api/trips/5/tours/${placeId}/paddle-plan`).set('Cookie', cookie).send(NO_MARKS),
        await request(server).put(`/api/trips/5/tours/${placeId}/obstacle-reviews`).set('Cookie', cookie).send(NO_OPS),
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
        place_id: placeId,
        name: 'Ridge walk',
        tour_type: 'hike',
        duration: 60,
        match_confidence: 1,
        max_hiking_difficulty: 3,
        planned: false,
        caution: false,
        has_waypoints: true,
      });
      expect(res.body.tour.distance).toBeGreaterThan(0);
      expect(res.body.tour.elevation_gain).toBe(100);
      expect(res.body.tour.elevation_loss).toBe(50);
      expect(res.body.waypoints).toEqual(keyed(tourBody().waypoints));

      expect(await placeColumns(placeId, 'trip_id', 'lat', 'lng', 'transport_mode', 'route_geometry')).toEqual({
        trip_id: 5,
        lat: 47,
        lng: 11,
        transport_mode: 'walking',
        route_geometry: JSON.stringify(GEOMETRY),
      });
      const events = broadcast.mock.calls.map((c) => c[1]);
      expect(events).toEqual(expect.arrayContaining(['tours:changed', 'place:created']));
      expect(broadcast.mock.calls.every((c) => c[3] === 'sock-1')).toBe(true);

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
      const badRole = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', cookie)
        .send(
          tourBody({
            waypoints: [
              { lat: 47, lng: 11, role: 'via', sequence: 0 },
              { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
            ],
          }),
        );
      expect(badRole.status).toBe(400);
      const shortRoute = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', cookie)
        .send(tourBody({ route_geometry: [[47, 11, 600]] }));
      expect(shortRoute.status).toBe(400);
      const badDifficulty = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', cookie)
        .send(tourBody({ max_hiking_difficulty: 7 }));
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
      const geometry = [
        [46, 10, 1000],
        [46.01, 10.01, 1200],
        [46.02, 10.02, 1100],
      ];
      const waypoints = [
        { lat: 46, lng: 10, role: 'start', sequence: 0 },
        { lat: 46.01, lng: 10.01, role: 'via', sequence: 1 },
        { lat: 46.02, lng: 10.02, role: 'end', sequence: 2 },
      ];
      const res = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(
          tourBody({
            name: 'Summit',
            route_geometry: geometry,
            waypoints,
            max_hiking_difficulty: 5,
            duration_seconds: null,
          }),
        );
      expect(res.status).toBe(200);
      expect(res.body.tour).toMatchObject({
        place_id: placeId,
        name: 'Summit',
        elevation_gain: 200,
        elevation_loss: 100,
        duration: null,
        max_hiking_difficulty: 5,
      });
      expect(res.body.waypoints).toEqual(keyed(waypoints));
      expect(await placeColumns(placeId, 'name', 'lat', 'lng', 'route_geometry')).toEqual({
        name: 'Summit',
        lat: 46,
        lng: 10,
        route_geometry: JSON.stringify(geometry),
      });
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(3);
      expect(broadcast.mock.calls.map((c) => c[1])).toEqual(expect.arrayContaining(['tours:changed', 'place:updated']));
    });

    it('404 for a tour of another trip, a plain place and a non-numeric id, nothing changes', async () => {
      const foreign = await createViaApi(6);
      const plain = await plainPlace(5, 'Cafe');
      for (const id of [foreign, plain, 'abc']) {
        const res = await request(server)
          .put(`/api/trips/5/tours/${id}`)
          .set('Cookie', sessionCookie(OWNER))
          .send(tourBody({ name: 'Moved' }));
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
      expect(tour).toMatchObject({
        name: 'Alpine loop',
        tour_type: 'hike',
        match_confidence: 1,
        max_hiking_difficulty: null,
        has_waypoints: false,
      });
      // TIME-01: the walking time it is estimated to take, worked out from its own heights and stored nowhere.
      expect(tour.duration).toBeNull();
      expect(tour.time_estimate).toEqual({ minutes: expect.any(Number), basis: 'din33466' });
      const listed = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      const again = listed.body.tours.find((item: { place_id: number }) => item.place_id === tour.place_id);
      expect(again.time_estimate).toEqual(tour.time_estimate);
      expect(await placeColumns(tour.place_id, 'trip_id')).toEqual({ trip_id: 5 });
      expect(await findRow(orm, Tours, { place: tour.place_id })).toMatchObject({
        tour_type: 'hike',
        max_hiking_difficulty: null,
      });
      expect(broadcast.mock.calls.map((c) => c[1])).toEqual(expect.arrayContaining(['tours:changed', 'place:created']));
    });

    it('flags a track without elevation with caution', async () => {
      const res = await importGpx(OWNER, FLAT_GPX);
      expect(res.status).toBe(201);
      expect(res.body.caution).toBe(true);
      expect(res.body.tours[0]).toMatchObject({ match_confidence: 0.3, caution: true });
      // TIME-01: without heights the estimate is unknown, never the time on the flat.
      expect(res.body.tours[0].time_estimate).toEqual({ minutes: null, basis: 'din33466' });
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

  describe('paddle tours (PAD-01) and free legs (P2A-04)', () => {
    const paddleBody = (overrides: Record<string, unknown> = {}) =>
      tourBody({
        tour_type: 'kayak',
        max_hiking_difficulty: null,
        boat_type: 'canoe',
        water_context: 'lake',
        waypoints: [
          {
            lat: 47,
            lng: 11,
            role: 'start',
            sequence: 0,
            fixed_leg: {
              kind: 'free',
              geometry: [
                [47, 11],
                [47.02, 11.02],
              ],
            },
          },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
        ],
        ...overrides,
      });

    it('saves a paddle tour with its boat, water, own speed and hand-drawn leg, and reads them back', async () => {
      const res = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', sessionCookie(OWNER))
        .send(paddleBody({ paddle_speed_kmh: 5 }));
      expect(res.status).toBe(201);
      expect(res.body.tour).toMatchObject({
        tour_type: 'kayak',
        boat_type: 'canoe',
        water_context: 'lake',
        paddle_speed_kmh: 5,
        max_hiking_difficulty: null,
        // Read off the banks at the points set, not off the water: unknown, never a made-up climb.
        elevation_gain: null,
        elevation_loss: null,
      });
      expect(res.body.waypoints[0].fixed_leg).toEqual({
        kind: 'free',
        geometry: [
          [47, 11],
          [47.02, 11.02],
        ],
      });
      const detail = await request(server)
        .get(`/api/trips/5/tours/${res.body.tour.place_id}`)
        .set('Cookie', sessionCookie(OWNER));
      expect(readAgain(detail.body)).toEqual(readAgain(res.body));
    });

    it('a change of boat keeps the chosen speed, and a paddle tour can become a hike again', async () => {
      const placeId = await createViaApi(5, paddleBody({ paddle_speed_kmh: 3.5 }));
      const reboated = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(paddleBody({ boat_type: 'sup', paddle_speed_kmh: 3.5 }));
      expect(reboated.status).toBe(200);
      expect(reboated.body.tour).toMatchObject({ boat_type: 'sup', paddle_speed_kmh: 3.5 });

      const hike = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody());
      expect(hike.status).toBe(200);
      expect(hike.body.tour).toMatchObject({
        tour_type: 'hike',
        boat_type: null,
        water_context: null,
        paddle_speed_kmh: null,
        max_hiking_difficulty: 3,
      });
    });

    it('400 for a paddle tour without a boat, a hike with one, and a free leg off its waypoints', async () => {
      const offTrack = paddleBody({
        waypoints: [
          {
            lat: 47,
            lng: 11,
            role: 'start',
            sequence: 0,
            fixed_leg: {
              kind: 'free',
              geometry: [
                [46, 10],
                [47.02, 11.02],
              ],
            },
          },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
        ],
      });
      const refused = await Promise.all(
        [paddleBody({ boat_type: null }), tourBody({ boat_type: 'kayak' }), offTrack].map((body) =>
          request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(body),
        ),
      );
      expect(refused.map((res) => res.status)).toEqual([400, 400, 400]);
      expect(await countRows(orm, Tours)).toBe(0);
    });

    it('400 for a paddle tour while its type is switched off', async () => {
      await updateRows(orm, TourTypes, { key: 'kayak' }, { enabled: 0 });
      try {
        const res = await request(server)
          .post('/api/trips/5/tours')
          .set('Cookie', sessionCookie(OWNER))
          .send(paddleBody());
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Tour type is not available' });
        expect(await countRows(orm, Tours)).toBe(0);
      } finally {
        await updateRows(orm, TourTypes, { key: 'kayak' }, { enabled: 1 });
      }
    });
  });

  describe('portages, locks and the paddle plan (PAD-03, PAD-07)', () => {
    const leg = (kind: 'free' | 'portage', from: [number, number], to: [number, number], extra?: number) => ({
      kind,
      geometry: [from, to],
      ...(extra === undefined ? {} : { extra_minutes: extra }),
    });
    const carried = (overrides: Record<string, unknown> = {}) =>
      tourBody({
        tour_type: 'kayak',
        max_hiking_difficulty: null,
        boat_type: 'canoe',
        water_context: 'river',
        portage_speed_kmh: 2.5,
        route_geometry: GEOMETRY,
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0, fixed_leg: leg('free', [47, 11], [47.01, 11.01]) },
          {
            lat: 47.01,
            lng: 11.01,
            role: 'via',
            sequence: 1,
            fixed_leg: leg('portage', [47.01, 11.01], [47.02, 11.02], 15),
            lock: { wait_minutes: 20, transit_minutes: null },
          },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
        ],
        ...overrides,
      });
    const paddlePlan = (placeId: number, body: Record<string, unknown>, userId = OWNER) =>
      request(server).put(`/api/trips/5/tours/${placeId}/paddle-plan`).set('Cookie', sessionCookie(userId)).send(body);
    const importPaddleTrack = async () => {
      const res = await importGpx(OWNER, TRACK_GPX, 5, {
        tour_type: 'kayak',
        boat_type: 'kayak',
        water_context: 'lake',
      });
      expect(res.status).toBe(201);
      return res.body.tours[0] as { place_id: number; distance: number };
    };

    it('saves a portage with its time out and in, a lock with its times and the carrying speed, and reads them back', async () => {
      const res = await request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(carried());
      expect(res.status).toBe(201);
      expect(res.body.tour).toMatchObject({ portage_speed_kmh: 2.5, track_marks: null });
      expect(res.body.waypoints[1]).toMatchObject({
        fixed_leg: { kind: 'portage', extra_minutes: 15 },
        lock: { wait_minutes: 20, transit_minutes: null },
      });
      expect(res.body.waypoints[0].lock).toBeUndefined();
      const detail = await request(server)
        .get(`/api/trips/5/tours/${res.body.tour.place_id}`)
        .set('Cookie', sessionCookie(OWNER));
      expect(readAgain(detail.body)).toEqual(readAgain(res.body));
    });

    it('saves how a paddle tour crosses lakes and its shaping points, and reads them back (PAD-11, P2A-03)', async () => {
      const body = carried({ paddle_lake_style: 'shore' });
      (body.waypoints as Array<Record<string, unknown>>)[1] = {
        lat: 47.01,
        lng: 11.01,
        role: 'via',
        sequence: 1,
        shaping: true,
      };
      const res = await request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(body);
      expect(res.status).toBe(201);
      expect(res.body.tour).toMatchObject({ paddle_lake_style: 'shore' });
      expect(res.body.waypoints[1]).toMatchObject({ shaping: true });
      expect(res.body.waypoints[0].shaping).toBeUndefined();
      const detail = await request(server)
        .get(`/api/trips/5/tours/${res.body.tour.place_id}`)
        .set('Cookie', sessionCookie(OWNER));
      expect(detail.body.tour.paddle_lake_style).toBe('shore');
      expect(detail.body.waypoints[1].shaping).toBe(true);

      const onHike = carried({
        tour_type: 'hike',
        max_hiking_difficulty: 2,
        boat_type: null,
        water_context: null,
        portage_speed_kmh: null,
        paddle_lake_style: 'direct',
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0 },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
        ],
      });
      const refused = await request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(onHike);
      expect(refused.status).toBe(400);
    });

    it('400 for a portage, a lock or a carrying speed on a hike; nothing written', async () => {
      const onHike = carried({ tour_type: 'hike', max_hiking_difficulty: 2, boat_type: null, water_context: null });
      const res = await request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(onHike);
      expect(res.status).toBe(400);
      expect(await countRows(orm, Tours)).toBe(0);
    });

    it('lays portages and locks onto a recorded paddle track, works out its moving time and leaves the track as it was', async () => {
      const track = await importPaddleTrack();
      const before = await placeColumns(track.place_id, 'route_geometry');
      const totalM = track.distance * 1000;
      const res = await paddlePlan(track.place_id, {
        paddle_speed_kmh: 4,
        portage_speed_kmh: null,
        track_marks: {
          portages: [{ from_m: 400, to_m: 800, extra_minutes: null }],
          locks: [{ at_m: Math.round(totalM - 200), wait_minutes: 15, transit_minutes: 10 }],
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.tour.track_marks.portages).toEqual([{ from_m: 400, to_m: 800, extra_minutes: null }]);
      // Water at 4 km/h, 400 m carried at 2 km/h, 10 minutes out and in, 25 minutes at the lock.
      const waterMinutes = ((totalM - 400) / 1000 / 4) * 60;
      expect(res.body.tour.duration).toBe(Math.round(waterMinutes + 12 + 10 + 25));
      expect(await placeColumns(track.place_id, 'route_geometry')).toEqual(before);
      expect(broadcast.mock.calls.map((c) => c[1])).toContain('tours:changed');

      const cleared = await paddlePlan(track.place_id, {
        paddle_speed_kmh: null,
        portage_speed_kmh: null,
        track_marks: { portages: [], locks: [] },
      });
      expect(cleared.body.tour.track_marks).toBeNull();
    });

    it('refuses a plan for a hike, for a planned tour, a mark past the end of the track and overlapping portages', async () => {
      const hike = (await importGpx(OWNER, FLAT_GPX, 5)).body.tours[0].place_id as number;
      const planned = await createViaApi(5, carried());
      const track = await importPaddleTrack();
      const none = { portages: [], locks: [] };
      const plan = (marks: Record<string, unknown>) => ({
        paddle_speed_kmh: null,
        portage_speed_kmh: null,
        track_marks: marks,
      });
      // One after another: supertest binds the unstarted server per request, and requests at once reset each other.
      const results = [
        await paddlePlan(hike, plan(none)),
        await paddlePlan(planned, plan(none)),
        await paddlePlan(
          track.place_id,
          plan({ portages: [], locks: [{ at_m: 999999, wait_minutes: 1, transit_minutes: 1 }] }),
        ),
        await paddlePlan(
          track.place_id,
          plan({
            portages: [
              { from_m: 100, to_m: 500, extra_minutes: null },
              { from_m: 400, to_m: 900, extra_minutes: null },
            ],
            locks: [],
          }),
        ),
      ];
      expect(results.map((res) => res.status)).toEqual([400, 400, 400, 400]);
      expect(results[0].body.code).toBe('not_a_paddle_tour');
      expect(results[1].body.code).toBe('planned_tour');
      expect(results[2].body.code).toBe('mark_beyond_track');
    });

    it('403 without place_edit, 404 for a tour of another trip', async () => {
      const track = await importPaddleTrack();
      const body = { paddle_speed_kmh: null, portage_speed_kmh: null, track_marks: { portages: [], locks: [] } };
      expect((await paddlePlan(track.place_id, body, VIEWER)).status).toBe(403);
      const elsewhere = await request(server)
        .put(`/api/trips/6/tours/${track.place_id}/paddle-plan`)
        .set('Cookie', sessionCookie(OWNER))
        .send(body);
      expect(elsewhere.status).toBe(404);
    });
  });

  describe('the obstacle checklist (PAD-06, PAD-09)', () => {
    /** A paddle tour along the GEOMETRY line, a weir in the middle of its first leg. */
    const paddleTour = () =>
      createViaApi(
        5,
        tourBody({
          tour_type: 'kayak',
          max_hiking_difficulty: null,
          boat_type: 'kayak',
          water_context: 'river',
        }),
      );
    const reviewsOf = (placeId: number, body: Record<string, unknown>, userId = OWNER) =>
      request(server)
        .put(`/api/trips/5/tours/${placeId}/obstacle-reviews`)
        .set('Cookie', sessionCookie(userId))
        .set('X-Socket-Id', 'sock-1')
        .send(body);
    const detailOf = async (placeId: number, tripId = 5) =>
      (await request(server).get(`/api/trips/${tripId}/tours/${placeId}`).set('Cookie', sessionCookie(OWNER))).body;

    beforeEach(async () => {
      await insertRows(orm, PaddleRegions, [
        {
          id: 'tirol',
          name: 'Tirol',
          boundary: null,
          min_lat: 46.9,
          min_lng: 10.9,
          max_lat: 47.1,
          max_lng: 11.1,
          status: 'ready',
          feature_count: 1,
          source_timestamp: '2026-10-01T00:00:00.000Z',
          imported_at: '2026-10-02 04:20:00',
        },
      ]);
      await insertRows(orm, PaddleFeatures, [
        {
          region: 'tirol',
          osm_ref: 'node/1',
          kind: 'weir',
          group_key: null,
          name: 'Wehr',
          geometry: JSON.stringify({ type: 'Point', coordinates: [11.005, 47.005] }),
          tags: JSON.stringify({ waterway: 'weir', name: 'Wehr' }),
          tag_hash: 'hash-1',
          min_lat: 47.005,
          min_lng: 11.005,
          max_lat: 47.005,
          max_lng: 11.005,
        },
      ]);
    });

    afterEach(async () => {
      await deleteRows(orm, PaddleRegions);
    });

    it('lists the weir as open, saves a decision against its basis, and the list carries the bench', async () => {
      const placeId = await paddleTour();
      const before = await detailOf(placeId);
      expect(before.tour.paddle_check).toMatchObject({ data: 'covered', entries: 1, open: 1, decided: 0 });
      const [entry] = before.obstacle_check.entries;
      expect(entry).toMatchObject({ key: 'node/1', status: 'open', relation: 'on_route' });

      broadcast.mockClear();
      const res = await reviewsOf(placeId, {
        ops: [{ key: 'node/1', op: 'decide', decision: 'pass', note: 'Rechts ueber die Rampe', basis: entry.basis }],
      });
      expect(res.status).toBe(200);
      expect(res.body.obstacle_check.entries[0]).toMatchObject({
        status: 'decided',
        decision: { decision: 'pass', note: 'Rechts ueber die Rampe', decided_by: OWNER },
      });
      expect(broadcast).toHaveBeenCalledWith('5', 'tours:changed', { placeIds: [placeId] }, 'sock-1');
      expect(await countRows(orm, TourObstacleReviews, { place: placeId })).toBe(1);

      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      expect(list.body.tours[0].paddle_check).toMatchObject({ open: 0, decided: 1 });
    });

    it('400 for a hike, for a decision without its basis and for one obstacle twice; 403 without place_edit', async () => {
      const hike = await createViaApi();
      const refused = await reviewsOf(hike, NO_OPS);
      expect(refused.status).toBe(400);
      expect(refused.body.error).toBe('Only a paddle tour has an obstacle checklist');

      const placeId = await paddleTour();
      const decision = { key: 'node/1', op: 'decide', decision: 'pass', note: null, basis: null };
      expect((await reviewsOf(placeId, { ops: [decision] })).status).toBe(400);
      expect((await reviewsOf(placeId, { ops: [NO_OPS.ops[0], NO_OPS.ops[0]] })).status).toBe(400);
      expect((await reviewsOf(placeId, { ops: [] })).status).toBe(400);
      expect((await reviewsOf(placeId, NO_OPS, VIEWER)).status).toBe(403);
      expect(await countRows(orm, TourObstacleReviews)).toBe(0);
    });

    it('copying the trip carries the decisions, still bound to what they were decided on', async () => {
      const placeId = await paddleTour();
      const [entry] = (await detailOf(placeId)).obstacle_check.entries;
      expect(
        (
          await reviewsOf(placeId, {
            ops: [{ key: 'node/1', op: 'decide', decision: 'portage', note: null, basis: entry.basis }],
          })
        ).status,
      ).toBe(200);
      const res = await request(server)
        .post('/api/trips/5/copy')
        .set('Cookie', sessionCookie(OWNER))
        .send({ title: 'Regen again' });
      expect(res.status).toBe(201);
      const copyId = res.body.trip.id as number;
      const [copied] = (await request(server).get(`/api/trips/${copyId}/tours`).set('Cookie', sessionCookie(OWNER)))
        .body.tours;
      expect((await detailOf(copied.place_id, copyId)).obstacle_check.entries[0]).toMatchObject({
        key: 'node/1',
        status: 'todo',
        decision: { decision: 'portage' },
      });
    });
  });

  describe('GPX preview and typed import (PAD-02)', () => {
    it('shows every track with its whole line and measures, and stores nothing', async () => {
      const res = await previewGpx(OWNER, TRACK_GPX);
      expect(res.status).toBe(200);
      expect(res.body.tracks).toHaveLength(1);
      expect(res.body.tracks[0]).toMatchObject({
        name: 'Alpine loop',
        point_count: 3,
        elevation_gain_m: 50,
        elevation_loss_m: 30,
        duplicate: false,
      });
      expect(res.body.tracks[0].geometry).toEqual([
        [49, 12, 100],
        [49.01, 12.01, 150],
        [49.02, 12.02, 120],
      ]);
      expect(res.body.tracks[0].distance_km).toBeGreaterThan(0);
      expect(await countRows(orm, Places)).toBe(0);
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('leaves heights it does not have unknown, and names a track the trip already holds', async () => {
      const flat = await previewGpx(OWNER, FLAT_GPX);
      expect(flat.body.tracks[0]).toMatchObject({ elevation_gain_m: null, elevation_loss_m: null });
      expect((await importGpx(OWNER, TRACK_GPX)).status).toBe(201);
      const again = await previewGpx(OWNER, TRACK_GPX);
      expect(again.body.tracks[0].duplicate).toBe(true);
    });

    it('400 without a file, and for a file with no track, as the import says', async () => {
      const missing = await previewGpx(OWNER, null);
      expect(missing.status).toBe(400);
      expect(missing.body).toEqual({ error: 'No file uploaded' });
      const empty = await previewGpx(OWNER, '<gpx/>');
      expect(empty.status).toBe(400);
      expect(empty.body).toEqual({ error: 'No track or route found in GPX file' });
    });

    it('imports as a paddle tour with the chosen boat and water', async () => {
      const res = await importGpx(OWNER, TRACK_GPX, 5, {
        tour_type: 'kayak',
        boat_type: 'sup',
        water_context: 'river',
      });
      expect(res.status).toBe(201);
      expect(res.body.tours[0]).toMatchObject({
        tour_type: 'kayak',
        boat_type: 'sup',
        water_context: 'river',
        paddle_speed_kmh: null,
        max_hiking_difficulty: null,
        origin: 'gpx',
      });
      expect(await findRow(orm, Tours, { place: res.body.tours[0].place_id })).toMatchObject({
        tour_type: 'kayak',
        boat_type: 'sup',
      });
    });

    it('400 for a paddle import without its boat, or a hike import that names one; nothing written', async () => {
      const refused = await Promise.all(
        [
          { tour_type: 'kayak', water_context: 'lake' },
          { tour_type: 'hike', boat_type: 'sup' },
          { tour_type: 'food' },
        ].map((fields) => importGpx(OWNER, TRACK_GPX, 5, fields)),
      );
      for (const res of refused) {
        expect(res.status).toBe(400);
        expect(res.body.error).toEqual(expect.any(String));
      }
      expect(await countRows(orm, Places)).toBe(0);
    });
  });

  describe('KML and KMZ preview and import (IO-02)', () => {
    const MAP_KML = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>
      <Placemark><name>Coast walk</name><LineString><coordinates>12,49,0 12.01,49.01,0 12.02,49.02,0</coordinates>
      </LineString></Placemark>
      <Placemark><name>Summit</name><LineString><altitudeMode>absolute</altitudeMode>
        <coordinates>13,50,100 13.01,50.01,180 13.02,50.02,150</coordinates></LineString></Placemark>
      <Placemark><name>Hut</name><Point><coordinates>12,49</coordinates></Point></Placemark>
      <Placemark><name>Lake</name><Polygon><outerBoundaryIs><LinearRing>
        <coordinates>1,1 2,2 3,1 1,1</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>
      <NetworkLink><Link><href>https://example.test/more.kml</href></Link></NetworkLink>
    </Document></kml>`;

    /** A KMZ archive holding these entries. */
    async function kmz(entries: Record<string, string>): Promise<Buffer> {
      const chunks: Buffer[] = [];
      const output = new PassThrough();
      output.on('data', (chunk: Buffer) => chunks.push(chunk));
      const archive = archiver('zip', { zlib: { level: 1 } });
      archive.pipe(output);
      for (const [name, content] of Object.entries(entries)) archive.append(Buffer.from(content), { name });
      await archive.finalize();
      return Buffer.concat(chunks);
    }

    const upload = (
      bytes: Buffer,
      filename: string,
      path = 'import/gpx/preview',
      fields: Record<string, string> = {},
    ) => {
      let req = request(server).post(`/api/trips/5/tours/${path}`).set('Cookie', sessionCookie(OWNER));
      for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
      return req.attach('file', bytes, { filename, contentType: 'application/octet-stream' });
    };

    it('shows each line apart with the heights it has, counts what it leaves out, and stores nothing', async () => {
      const res = await upload(Buffer.from(MAP_KML), 'alps.kml');
      expect(res.status).toBe(200);
      expect(res.body.tracks.map((track: { name: string }) => track.name)).toEqual(['Coast walk', 'Summit']);
      // Google My Maps writes 0 for every height: that is no height, not a flat walk.
      expect(res.body.tracks[0]).toMatchObject({ point_count: 3, elevation_gain_m: null, elevation_loss_m: null });
      expect(res.body.tracks[1]).toMatchObject({ point_count: 3, elevation_gain_m: 80, elevation_loss_m: 30 });
      expect(res.body.left_out).toEqual({ points: 1, areas: 1, other: 1 });
      expect(await countRows(orm, Places)).toBe(0);
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('imports the lines as tours of the chosen type, keeps the file name, skips them the second time', async () => {
      const res = await upload(Buffer.from(MAP_KML), 'alps.kml', 'import/gpx', {
        tour_type: 'kayak',
        boat_type: 'canoe',
        water_context: 'river',
      });
      expect(res.status).toBe(201);
      expect(res.body.tours.map((tour: { name: string }) => tour.name)).toEqual(['Coast walk', 'Summit']);
      expect(res.body.tours[0]).toMatchObject({ tour_type: 'kayak', boat_type: 'canoe', origin: 'gpx' });
      expect(res.body.caution).toBe(true);
      expect(await countRows(orm, Tours)).toBe(2);
      const placeId = res.body.tours[1].place_id as number;
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.provenance.source).toEqual({ kind: 'gpx', fileName: 'alps.kml' });

      const again = await upload(Buffer.from(MAP_KML), 'alps.kml', 'import/gpx');
      expect(again.body).toMatchObject({ tours: [], skipped: 2 });
      expect(await countRows(orm, Tours)).toBe(2);
    });

    it('reads a KMZ archive through its KML', async () => {
      const archive = await kmz({ 'doc.kml': MAP_KML, 'files/photo.jpg': 'jpeg' });
      const res = await upload(archive, 'alps.kmz');
      expect(res.status).toBe(200);
      expect(res.body.tracks).toHaveLength(2);
    });

    it('400 with a reason for a broken KML, a broken or empty archive and a file without a line', async () => {
      const PINS_ONLY = '<kml><Placemark><Point><coordinates>1,2</coordinates></Point></Placemark></kml>';
      const answers = [
        await upload(Buffer.from('<kml><Placemark></kml>'), 'broken.kml'),
        await upload(Buffer.from('not a zip'), 'broken.kmz', 'import/gpx'),
        await upload(await kmz({ 'photo.jpg': 'jpeg' }), 'photos.kmz'),
        await upload(Buffer.from(PINS_ONLY), 'pins.kml'),
      ];
      expect(answers.map((res) => [res.status, res.body])).toEqual([
        [400, { error: 'Malformed KML: invalid XML structure', code: 'malformed' }],
        [400, { error: 'Invalid KMZ archive.', code: 'archive_invalid' }],
        [400, { error: 'KMZ archive does not contain a KML file.', code: 'archive_without_kml' }],
        [400, { error: 'No line found in KML file', code: 'no_track' }],
      ]);
      expect(await countRows(orm, Places)).toBe(0);
    });

    it('a member without place_edit gets 403 for a KML file too', async () => {
      const res = await request(server)
        .post('/api/trips/5/tours/import/gpx')
        .set('Cookie', sessionCookie(VIEWER))
        .attach('file', Buffer.from(MAP_KML), { filename: 'alps.kml', contentType: 'application/octet-stream' });
      expect(res.status).toBe(403);
      expect(await countRows(orm, Places)).toBe(0);
    });
  });

  describe('provenance (P2C-02)', () => {
    const detail = async (placeId: number) =>
      (await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER))).body;

    it('a planned tour says it was planned here, with no source invented', async () => {
      const placeId = await createViaApi();
      const body = await detail(placeId);
      expect(body.tour.origin).toBe('trek');
      expect(body.provenance).toMatchObject({
        origin: 'trek',
        source: { kind: 'trek' },
        derivedFrom: null,
        plannedOver: false,
        editedLocally: null,
      });
      expect(body.provenance.createdAt).toEqual(expect.any(String));
    });

    it('a GPX import keeps its origin and file name, also after it is planned over in place', async () => {
      const res = await importGpx(OWNER, TRACK_GPX);
      const placeId = res.body.tours[0].place_id as number;
      expect(res.body.tours[0].origin).toBe('gpx');
      expect((await detail(placeId)).provenance).toMatchObject({
        origin: 'gpx',
        source: { kind: 'gpx', fileName: 'track.gpx' },
        plannedOver: false,
      });

      await request(server).put(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER)).send(tourBody());
      const after = await detail(placeId);
      expect(after.tour).toMatchObject({ origin: 'gpx', has_waypoints: true });
      expect(after.provenance).toMatchObject({ origin: 'gpx', plannedOver: true });
    });

    it('a tour planned from an import names it while it is in the trip', async () => {
      const res = await importGpx(OWNER, TRACK_GPX);
      const source = res.body.tours[0].place_id as number;
      const derived = await createViaApi(5, tourBody({ derived_from_place_id: source }));
      const sourceName = (await placeColumns(source, 'name')).name;
      expect((await detail(derived)).provenance).toMatchObject({
        origin: 'trek',
        derivedFrom: { placeId: source, name: sourceName },
      });
    });

    it('a wanderer snapshot without its import record names its source from its reference, and invents none', async () => {
      const placeId = await createViaApi();
      await updateRows(orm, Tours, { place: placeId }, { origin: 'wanderer', wanderer_ref: 'https://w.example#t9' });
      expect((await detail(placeId)).provenance.source).toEqual({
        kind: 'wanderer',
        instance: 'https://w.example',
        externalId: 't9',
        externalUrl: null,
        externalUpdated: null,
        importedAt: null,
      });

      await updateRows(orm, Tours, { place: placeId }, { wanderer_ref: null });
      expect((await detail(placeId)).provenance.source).toMatchObject({ instance: '', externalId: '' });
    });

    it('a trip copy keeps the import record of a wanderer snapshot', async () => {
      const placeId = await createViaApi(5, tourBody({ name: 'Snapshot' }));
      await updateRows(orm, Tours, { place: placeId }, { origin: 'wanderer', wanderer_ref: 'https://w.example#t1' });
      await insertRows(orm, TourSources, [
        {
          place: placeId,
          provider: 'wanderer',
          instance: 'https://w.example',
          external_id: 't1',
          external_url: 'https://w.example/trail/view/@me/t1',
          external_updated: '2026-10-01',
          content_hash: 'c.c.c',
          local_hash: 'l.l',
        },
      ]);
      const res = await request(server)
        .post('/api/trips/5/copy')
        .set('Cookie', sessionCookie(OWNER))
        .send({ title: 'Copy' });
      const copyId = res.body.trip.id as number;
      const tours = (await request(server).get(`/api/trips/${copyId}/tours`).set('Cookie', sessionCookie(OWNER))).body
        .tours;
      const copied = tours.find((tour: { name: string }) => tour.name === 'Snapshot');
      const copiedDetail = (
        await request(server).get(`/api/trips/${copyId}/tours/${copied.place_id}`).set('Cookie', sessionCookie(OWNER))
      ).body;

      expect(copiedDetail.provenance).toMatchObject({
        origin: 'wanderer',
        source: (await detail(placeId)).provenance.source,
      });
      expect(copiedDetail.provenance.source).toMatchObject({ instance: 'https://w.example', externalId: 't1' });
      expect(await findRow(orm, TourSources, { place: copied.place_id })).toMatchObject({
        content_hash: 'c.c.c',
        local_hash: 'l.l',
      });
    });
  });

  describe('save as new tour (P2C-07)', () => {
    const copy = (
      placeId: number,
      body: Record<string, unknown> = { name: 'Ridge (copy)' },
      userId = OWNER,
      tripId = 5,
    ) =>
      request(server)
        .post(`/api/trips/${tripId}/tours/${placeId}/copy`)
        .set('Cookie', sessionCookie(userId))
        .send(body);
    const detail = async (placeId: number) =>
      (await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER))).body;

    it('makes an independent tour with its own line and control points, no days, pointing at its source', async () => {
      const source = await createViaApi();
      await makeDayAssignment(orm, 3, source, { order_index: 0 });
      const res = await copy(source);
      expect(res.status).toBe(201);
      const copyId = res.body.tour.place_id as number;
      expect(copyId).not.toBe(source);
      expect(res.body.tour).toMatchObject({
        name: 'Ridge (copy)',
        derived_from_place_id: source,
        planned: false,
        origin: 'trek',
      });
      expect(res.body.waypoints).toEqual((await detail(source)).waypoints);
      expect(res.body.provenance).toMatchObject({ derivedFrom: { placeId: source } });
      expect((await placeColumns(copyId, 'route_geometry')).route_geometry).toBe(
        (await placeColumns(source, 'route_geometry')).route_geometry,
      );

      // Editing the copy leaves the original as it was.
      await request(server)
        .put(`/api/trips/5/tours/${copyId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ name: 'Shorter ridge' }));
      expect((await detail(source)).tour).toMatchObject({ name: tourBody().name, planned: true });
    });

    it('a copied GPX import stays a GPX import with its file name', async () => {
      const imported = await importGpx(OWNER, TRACK_GPX);
      const source = imported.body.tours[0].place_id as number;
      const res = await copy(source, { name: 'Track again' });
      expect(res.status).toBe(201);
      expect(res.body.tour).toMatchObject({ origin: 'gpx', has_waypoints: false });
      expect(res.body.provenance).toMatchObject({ source: { kind: 'gpx', fileName: 'track.gpx' } });
    });

    it('refuses an empty name, a tour of another trip, a plain place, and someone who may not add places', async () => {
      const source = await createViaApi();
      expect((await copy(source, { name: '  ' })).status).toBe(400);
      expect((await copy(source, { name: 'x' }, VIEWER)).status).toBe(403);
      expect((await copy(await plainPlace(5, 'Cafe'))).status).toBe(404);
      const foreign = await createViaApi(6);
      expect((await copy(foreign)).status).toBe(404);
      const notAnId = await request(server)
        .post('/api/trips/5/tours/abc/copy')
        .set('Cookie', sessionCookie(OWNER))
        .send({ name: 'x' });
      expect(notAnId.status).toBe(404);
    });

    it('a tour whose line holds no point has nothing to copy', async () => {
      const source = await createViaApi();
      await updateRows(orm, Places, { id: source }, { route_geometry: '[]' });
      const before = await countRows(orm, Tours, {});
      expect((await copy(source)).status).toBe(404);
      expect(await countRows(orm, Tours, {})).toBe(before);
    });
  });

  describe('multi-day tours (MDT-01)', () => {
    /** Two days over the ridge: the middle stop ends the first stage. */
    const twoDays = (stageAt: number) =>
      tourBody({
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0 },
          { lat: 47.01, lng: 11.01, role: 'via', sequence: 1 },
          { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
        ].map((point) => (point.sequence === stageAt ? { ...point, stage_end: true } : point)),
      });

    it('saves one route with its stage ends, lists its stages, and an edit joins them again', async () => {
      const placeId = await createViaApi(5, twoDays(1));
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.status).toBe(200);
      expect(detail.body.tour).toMatchObject({ stage_count: 2, tour_type: 'hike' });
      expect(detail.body.waypoints.map((point: { stage_end?: boolean }) => point.stage_end ?? false)).toEqual([
        false,
        true,
        false,
      ]);
      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      expect(list.body.tours[0]).toMatchObject({ place_id: placeId, stage_count: 2 });

      const joined = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(twoDays(-1));
      expect(joined.status).toBe(200);
      expect(joined.body.tour.stage_count).toBeNull();
    });

    it('400 for a stage end at the start or the end of the tour, and nothing is written', async () => {
      const before = await countRows(orm, Tours, {});
      const refused = await Promise.all(
        [0, 2].map((at) =>
          request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(twoDays(at)),
        ),
      );
      expect(refused.map((res) => res.status)).toEqual([400, 400]);
      expect(await countRows(orm, Tours, {})).toBe(before);
    });
  });

  describe('planning over an import (PR1-05)', () => {
    /** An imported GPX tour on trip 5: no waypoints, the recorded line as it came. */
    const importedTour = async (tripId = 5) => {
      const res = await importGpx(OWNER, TRACK_GPX, tripId);
      expect(res.status).toBe(201);
      return res.body.tours[0].place_id as number;
    };
    const listed = async (placeId: number, tripId = 5) =>
      (await request(server).get(`/api/trips/${tripId}/tours`).set('Cookie', sessionCookie(OWNER))).body.tours.find(
        (tour: { place_id: number }) => tour.place_id === placeId,
      );
    const restore = (placeId: number, userId = OWNER, tripId = 5) =>
      request(server)
        .post(`/api/trips/${tripId}/tours/${placeId}/restore-recorded`)
        .set('Cookie', sessionCookie(userId));

    it('a new tour planned from an import remembers it; the import stays as it was', async () => {
      const source = await importedTour();
      const recorded = (await placeColumns(source, 'route_geometry')).route_geometry;
      const derived = await createViaApi(5, tourBody({ derived_from_place_id: source }));

      expect(await listed(derived)).toMatchObject({ derived_from_place_id: source, has_waypoints: true });
      expect(await listed(source)).toMatchObject({
        derived_from_place_id: null,
        has_waypoints: false,
        has_recorded_track: false,
      });
      expect((await placeColumns(source, 'route_geometry')).route_geometry).toBe(recorded);

      // Deleting the import keeps the derived tour and forgets where it came from.
      await request(server).delete(`/api/trips/5/places/${source}`).set('Cookie', sessionCookie(OWNER));
      expect(await listed(derived)).toMatchObject({ derived_from_place_id: null });
    });

    const refusedOrigins: Record<string, () => Promise<number>> = {
      'a planned tour': () => createViaApi(),
      'a tour of another trip': () => importedTour(6),
      'no tour at all': () => plainPlace(5, 'Cafe'),
      'a place that does not exist': async () => 999_999,
    };
    it.each(Object.keys(refusedOrigins))('400 for an origin that is %s, and nothing is written', async (kind) => {
      const origin = await refusedOrigins[kind]();
      const before = await countRows(orm, Tours, {});
      const res = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ derived_from_place_id: origin }));
      expect(res.status).toBe(400);
      expect(await countRows(orm, Tours, {})).toBe(before);
    });

    it('planning an import over in place keeps its recorded track, and restoring brings it back', async () => {
      const placeId = await importedTour();
      const recorded = (await placeColumns(placeId, 'route_geometry')).route_geometry;
      const before = await listed(placeId);

      const put = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody());
      expect(put.status).toBe(200);
      expect(await listed(placeId)).toMatchObject({ has_waypoints: true, has_recorded_track: true });
      // A second edit does not overwrite the track kept the first time.
      await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ name: 'Edited again' }));

      broadcast.mockClear();
      const res = await restore(placeId);
      expect(res.status).toBe(200);
      // An import's detail names its two ends from the line, as before it was planned over.
      expect(res.body.waypoints.map((point: { role: string }) => point.role)).toEqual(['start', 'end']);
      expect(res.body.tour).toMatchObject({
        place_id: placeId,
        has_waypoints: false,
        has_recorded_track: false,
        distance: before.distance,
        elevation_gain: before.elevation_gain,
        elevation_loss: before.elevation_loss,
        max_hiking_difficulty: null,
      });
      expect((await placeColumns(placeId, 'route_geometry')).route_geometry).toBe(recorded);
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(0);
      expect(broadcast.mock.calls.map((c) => c[1])).toEqual(expect.arrayContaining(['tours:changed', 'place:updated']));
    });

    it('409 restoring a tour that keeps no recorded track; 403 without place_edit; 404 for another trip', async () => {
      const planned = await createViaApi();
      await request(server)
        .put(`/api/trips/5/tours/${planned}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ name: 'Edited' }));
      const none = await restore(planned);
      expect(none.status).toBe(409);
      expect(none.body).toMatchObject({ code: 'no_recorded_track' });

      const replaced = await importedTour();
      await request(server).put(`/api/trips/5/tours/${replaced}`).set('Cookie', sessionCookie(OWNER)).send(tourBody());
      expect((await restore(replaced, VIEWER)).status).toBe(403);
      expect((await restore(replaced, OWNER, 6)).status).toBe(404);
      expect(await listed(replaced)).toMatchObject({ has_recorded_track: true });
    });

    it('copying the trip points a derived tour at the copied import, never back into the source', async () => {
      const source = await importedTour();
      await createViaApi(5, tourBody({ name: 'Planned from import', derived_from_place_id: source }));
      const res = await request(server)
        .post('/api/trips/5/copy')
        .set('Cookie', sessionCookie(OWNER))
        .send({ title: 'Copy' });
      const copyId = res.body.trip.id as number;
      const tours = (await request(server).get(`/api/trips/${copyId}/tours`).set('Cookie', sessionCookie(OWNER))).body
        .tours;
      const copiedImport = tours.find((tour: { name: string }) => tour.name === 'Alpine loop');
      const copiedDerived = tours.find((tour: { name: string }) => tour.name === 'Planned from import');
      expect(copiedDerived.derived_from_place_id).toBe(copiedImport.place_id);
      expect(copiedDerived.derived_from_place_id).not.toBe(source);
    });
  });

  describe('other domains', () => {
    it('409 moving a tour onto a day that already holds it, on create and on move', async () => {
      const placeId = await createViaApi();
      const cookie = sessionCookie(OWNER);
      const onDay4 = await request(server)
        .post('/api/trips/5/days/4/assignments')
        .set('Cookie', cookie)
        .send({ place_id: placeId });
      expect(onDay4.status).toBe(201);
      const onDay3 = await request(server)
        .post('/api/trips/5/days/3/assignments')
        .set('Cookie', cookie)
        .send({ place_id: placeId });
      expect(onDay3.status).toBe(201);

      const twice = await request(server)
        .post('/api/trips/5/days/4/assignments')
        .set('Cookie', cookie)
        .send({ place_id: placeId });
      expect(twice.status).toBe(409);
      expect(twice.body).toEqual({ error: 'Tour is already assigned to this day' });

      const moving = onDay3.body.assignment.id as number;
      const move = await request(server)
        .put(`/api/trips/5/assignments/${moving}/move`)
        .set('Cookie', cookie)
        .send({ new_day_id: 4, order_index: 1 });
      expect(move.status).toBe(409);
      expect(move.body).toEqual({ error: 'Tour is already assigned to this day' });
      expect((await findRow(orm, DayAssignments, { id: moving }))?.day_id).toBe(3);
      expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(2);
    });

    it('copying the trip carries its tours and waypoints onto the new places', async () => {
      const placeId = await createViaApi(
        5,
        tourBody({
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0 },
            { lat: 47.01, lng: 11.01, role: 'via', sequence: 1 },
            { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
          ],
        }),
      );
      const res = await request(server)
        .post('/api/trips/5/copy')
        .set('Cookie', sessionCookie(OWNER))
        .send({ title: 'Alps again' });
      expect(res.status).toBe(201);
      const copyId = res.body.trip.id as number;

      const list = await request(server).get(`/api/trips/${copyId}/tours`).set('Cookie', sessionCookie(OWNER));
      expect(list.status).toBe(200);
      expect(list.body.tours).toHaveLength(1);
      const copied = list.body.tours[0];
      expect(copied.place_id).not.toBe(placeId);
      const source = (await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER)))
        .body;
      const { place_id: _sourceId, ...sourceRest } = source.tour;
      const { place_id: _copyId, ...copyRest } = copied;
      expect(copyRest).toEqual(sourceRest);

      const detail = await request(server)
        .get(`/api/trips/${copyId}/tours/${copied.place_id}`)
        .set('Cookie', sessionCookie(OWNER));
      expect(detail.body.waypoints).toEqual(source.waypoints);
      expect(await countRows(orm, TourWaypoints, { place: placeId })).toBe(3);
    });

    it('copying the trip points a waypoint that stands for a place at the copied place (PR1-10)', async () => {
      const hut = await makePlace(orm, 5, { name: 'Hut' });
      const placeId = await createViaApi(
        5,
        tourBody({
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0, linked_place_id: hut.id },
            { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
          ],
        }),
      );
      const res = await request(server)
        .post('/api/trips/5/copy')
        .set('Cookie', sessionCookie(OWNER))
        .send({ title: 'Alps again' });
      const copyId = res.body.trip.id as number;
      const copiedHut = await findRow(orm, Places, { trip: copyId, name: 'Hut' });
      const list = await request(server).get(`/api/trips/${copyId}/tours`).set('Cookie', sessionCookie(OWNER));
      const detail = await request(server)
        .get(`/api/trips/${copyId}/tours/${list.body.tours[0].place_id}`)
        .set('Cookie', sessionCookie(OWNER));
      expect(copiedHut?.id).toBeDefined();
      expect(copiedHut?.id).not.toBe(hut.id);
      expect(detail.body.waypoints[0].linked_place_id).toBe(copiedHut?.id);
      expect(await countRows(orm, TourWaypoints, { place: placeId, linkedPlace: hut.id })).toBe(1);
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
