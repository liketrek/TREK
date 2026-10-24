/**
 * Tours e2e for the planner's second round: the GPX export of one tour
 * (PR1-06A), through the real JwtAuthGuard, AddonGuard and TripAccessGuard
 * against a migrated and seeded temp SQLite db. The permission check is a
 * container spy and the broadcast goes to a FakeRealtimeService, as in
 * tours.e2e.test.ts.
 *
 * Fixtures: user 1 owns trips 5 and 6, user 2 is a member of trip 5 whom the
 * permission spy denies 'place_edit', user 3 has no access to either trip.
 */
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makePlace } from '../helpers/factories/places';
import { countRows, deleteRows, findRow, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTour } from '../helpers/factories/tours';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

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

const db = createSnapshotTestDb();
// The map search behind the POI search (PLN-02): no network in a test.
const mapsPoisAlong = vi.fn();
const realtime = new FakeRealtimeService();

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

describe('Tours planned e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ToursModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue(journeyHooks)
      .overrideProvider(MapsService)
      .useValue({ poisAlong: mapsPoisAlong })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const createViaApi = async (tripId = 5, body: Record<string, unknown> = tourBody()) => {
    const res = await request(server).post(`/api/trips/${tripId}/tours`).set('Cookie', sessionCookie(OWNER)).send(body);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

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
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockImplementation(
      (action: string, _role: string, _owner: number, userId: number) =>
        !(action === 'place_edit' && userId === VIEWER),
    );
    await setAddonEnabled(orm, 'tours', true);
    realtime.broadcastMock.mockClear();
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  describe('GET :placeId/export.gpx (PR1-06A)', () => {
    const exportGpx = (userId: number, placeId: number, tripId = 5) =>
      request(server)
        .get(`/api/trips/${tripId}/tours/${placeId}/export.gpx`)
        .set('Cookie', sessionCookie(userId))
        .buffer(true)
        .parse((res, done) => {
          let text = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => (text += chunk));
          res.on('end', () => done(null, text));
        });

    it('writes the whole saved line with its heights as one track, named after the tour', async () => {
      const placeId = await createViaApi(5, tourBody({ name: 'Grat über Ü', description: 'Früh los.' }));
      const res = await exportGpx(OWNER, placeId);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/gpx+xml; charset=utf-8');
      expect(res.headers['content-disposition']).toContain("filename*=UTF-8''Grat-%C3%BCber-%C3%9C.gpx");
      const gpx = res.body as string;
      expect(gpx).toContain('<name>Grat über Ü</name>');
      expect(gpx).toContain('<desc>Früh los.</desc>');
      expect(gpx).toContain('<type>hiking</type>');
      expect(gpx.match(/<trkpt /g)).toHaveLength(GEOMETRY.length);
      expect(gpx).toContain('<trkpt lat="47.01" lon="11.01">');
      expect(gpx).toContain('<ele>700</ele>');
    });

    it('writes no height a point lacks, and names a paddle tour by its boat', async () => {
      const place = await makePlace(orm, 5, {
        name: 'Canal',
        route_geometry: JSON.stringify([
          [48, 12],
          [48.01, 12.01, 300],
        ]),
      });
      await makeTour(orm, place.id, {
        tourTypeRef: 'kayak',
        boat_type: 'canoe',
        water_context: 'river',
        origin: 'gpx',
      });
      const res = await exportGpx(OWNER, place.id);
      expect(res.status).toBe(200);
      const gpx = res.body as string;
      expect(gpx).toContain('<type>canoeing</type>');
      expect(gpx.match(/<ele>/g)).toHaveLength(1);
    });

    it('a member who may only read can export; the export changes nothing', async () => {
      const placeId = await createViaApi();
      const before = await findRow(orm, Tours, { place: placeId });
      realtime.broadcastMock.mockClear();
      const res = await exportGpx(VIEWER, placeId);
      expect(res.status).toBe(200);
      expect(await findRow(orm, Tours, { place: placeId })).toEqual(before);
      expect(realtime.broadcastMock).not.toHaveBeenCalled();
    });

    it('422 for a tour without a line of two points, 404 for one of another trip or none', async () => {
      const lonely = await makePlace(orm, 5, { name: 'Dot', route_geometry: JSON.stringify([[47, 11, 1]]) });
      await makeTour(orm, lonely.id, { origin: 'gpx' });
      const refused = await request(server)
        .get(`/api/trips/5/tours/${lonely.id}/export.gpx`)
        .set('Cookie', sessionCookie(OWNER));
      expect(refused.status).toBe(422);
      expect(refused.body).toEqual({ error: 'This tour has no route to export' });

      const elsewhere = await createViaApi(6);
      const wrongTrip = await request(server)
        .get(`/api/trips/5/tours/${elsewhere}/export.gpx`)
        .set('Cookie', sessionCookie(OWNER));
      expect(wrongTrip.status).toBe(404);
      expect(wrongTrip.body).toEqual({ error: 'Tour not found' });
      const plain = await makePlace(orm, 5, { name: 'Cafe' });
      expect(
        (await request(server).get(`/api/trips/5/tours/${plain.id}/export.gpx`).set('Cookie', sessionCookie(OWNER)))
          .status,
      ).toBe(404);
    });

    it('404 Trip not found for an outsider, 404 while the addon is off, 401 without a cookie', async () => {
      const placeId = await createViaApi();
      const outsider = await request(server)
        .get(`/api/trips/5/tours/${placeId}/export.gpx`)
        .set('Cookie', sessionCookie(OUTSIDER));
      expect(outsider.status).toBe(404);
      expect(outsider.body).toEqual({ error: 'Trip not found' });
      expect((await request(server).get(`/api/trips/5/tours/${placeId}/export.gpx`)).status).toBe(401);
      await setAddonEnabled(orm, 'tours', false);
      const off = await request(server)
        .get(`/api/trips/5/tours/${placeId}/export.gpx`)
        .set('Cookie', sessionCookie(OWNER));
      expect(off.status).toBe(404);
      expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
    });
  });

  describe('revisions and conflicts (P2C-03)', () => {
    const put = (placeId: number, body: Record<string, unknown>) =>
      request(server).put(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER)).send(body);

    it('a tour starts at 1, and every saved change raises it by one, in the list and the detail', async () => {
      const placeId = await createViaApi();
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.tour.revision).toBe(1);

      const saved = await put(placeId, tourBody({ name: 'Renamed', expected_revision: 1 }));
      expect(saved.status).toBe(200);
      expect(saved.body.tour).toMatchObject({ name: 'Renamed', revision: 2 });
      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
      expect(list.body.tours[0].revision).toBe(2);
    });

    it('409 for a draft based on a revision the tour has left, and nothing of it is written', async () => {
      const placeId = await createViaApi();
      expect((await put(placeId, tourBody({ name: 'First', expected_revision: 1 }))).status).toBe(200);
      realtime.broadcastMock.mockClear();

      const stale = await put(
        placeId,
        tourBody({
          name: 'Stale',
          expected_revision: 1,
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0 },
            { lat: 47.01, lng: 11.01, role: 'via', sequence: 1 },
            { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
          ],
        }),
      );
      expect(stale.status).toBe(409);
      expect(stale.body).toEqual({
        error: 'This tour was changed in the meantime',
        code: 'tour_revision_conflict',
        revision: 2,
      });
      const after = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(after.body.tour).toMatchObject({ name: 'First', revision: 2 });
      expect(after.body.waypoints).toHaveLength(2);
      expect(realtime.broadcastMock).not.toHaveBeenCalled();
    });

    it('a write naming no revision writes as before, so an older client or a queued write still lands', async () => {
      const placeId = await createViaApi();
      expect((await put(placeId, tourBody({ name: 'One', expected_revision: 1 }))).status).toBe(200);
      const blind = await put(placeId, tourBody({ name: 'Two' }));
      expect(blind.status).toBe(200);
      expect(blind.body.tour).toMatchObject({ name: 'Two', revision: 3 });
    });

    it('a copy starts at 1 of its own, and the original keeps its count', async () => {
      const placeId = await createViaApi();
      await put(placeId, tourBody({ expected_revision: 1 }));
      const copy = await request(server)
        .post(`/api/trips/5/tours/${placeId}/copy`)
        .set('Cookie', sessionCookie(OWNER))
        .send({ name: 'Copy' });
      expect(copy.status).toBe(201);
      expect(copy.body.tour.revision).toBe(1);
      expect((await findRow(orm, Tours, { place: placeId }))?.revision).toBe(2);
    });

    it('the plan laid onto a recorded paddle track names its revision too', async () => {
      const place = await makePlace(orm, 5, {
        name: 'Canal',
        route_geometry: JSON.stringify([
          [48, 12],
          [48.01, 12.01],
        ]),
      });
      await makeTour(orm, place.id, {
        tourTypeRef: 'kayak',
        boat_type: 'kayak',
        water_context: 'river',
        origin: 'gpx',
      });
      const plan = { paddle_speed_kmh: 5, portage_speed_kmh: null, track_marks: { portages: [], locks: [] } };
      const putPlan = (body: Record<string, unknown>) =>
        request(server)
          .put(`/api/trips/5/tours/${place.id}/paddle-plan`)
          .set('Cookie', sessionCookie(OWNER))
          .send(body);

      const first = await putPlan({ ...plan, expected_revision: 1 });
      expect(first.status).toBe(200);
      expect(first.body.tour.revision).toBe(2);
      const stale = await putPlan({ ...plan, paddle_speed_kmh: 3, expected_revision: 1 });
      expect(stale.status).toBe(409);
      expect(stale.body).toMatchObject({ code: 'tour_revision_conflict', revision: 2 });
      expect((await findRow(orm, Tours, { place: place.id }))?.paddle_speed_kmh).toBe(5);
    });

    it('rejects a revision below 1 at the boundary', async () => {
      const placeId = await createViaApi();
      expect((await put(placeId, tourBody({ expected_revision: 0 }))).status).toBe(400);
    });
  });

  describe('trip places as waypoints (PR1-10)', () => {
    const linked = (placeId: number | null) => [
      { lat: 47, lng: 11, role: 'start', sequence: 0 },
      { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, linked_place_id: placeId },
      { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
    ];

    it('a waypoint stands for a place of the trip, read back with it, and the place stays as it was', async () => {
      const hut = await makePlace(orm, 5, { name: 'Höllentalangerhütte', lat: 47.4, lng: 11.0 });
      const placeId = await createViaApi(5, tourBody({ waypoints: linked(hut.id) }));
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.waypoints.map((point: { linked_place_id?: number }) => point.linked_place_id ?? null)).toEqual(
        [null, hut.id, null],
      );
      // The waypoint keeps its own coordinates; the place keeps its own.
      expect(detail.body.waypoints[1]).toMatchObject({ lat: 47.01, lng: 11.01 });
      expect(await findRow(orm, Places, { id: hut.id })).toMatchObject({ name: 'Höllentalangerhütte', lat: 47.4 });
      expect(await countRows(orm, DayAssignments, { place: hut.id })).toBe(0);
    });

    it('a place of another trip, or one that is gone, leaves the point unlinked; a tour cannot be stood for', async () => {
      const foreign = await makePlace(orm, 6, { name: 'Elsewhere' });
      const placeId = await createViaApi(5, tourBody({ waypoints: linked(foreign.id) }));
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.waypoints[1].linked_place_id).toBeUndefined();

      const missing = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ waypoints: linked(999_999) }));
      expect(missing.status).toBe(200);
      expect(missing.body.waypoints[1].linked_place_id).toBeUndefined();

      const otherTour = await createViaApi();
      const refused = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ waypoints: linked(otherTour) }));
      expect(refused.status).toBe(400);
      expect(refused.body).toEqual({ error: 'A waypoint cannot stand for a tour', code: 'waypoint_links_a_tour' });
    });

    it('deleting the place keeps the waypoint and only drops the link; the GPX names the stops that stand for a place', async () => {
      const hut = await makePlace(orm, 5, { name: 'Kreuzeckhaus' });
      const lake = await makePlace(orm, 5, { name: 'Eibsee' });
      const placeId = await createViaApi(
        5,
        tourBody({
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0, linked_place_id: lake.id },
            { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, linked_place_id: hut.id },
            { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
          ],
        }),
      );
      const gpx = await request(server)
        .get(`/api/trips/5/tours/${placeId}/export.gpx`)
        .set('Cookie', sessionCookie(OWNER))
        .buffer(true)
        .parse((res, done) => {
          let text = '';
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => (text += chunk));
          res.on('end', () => done(null, text));
        });
      expect((gpx.body as string).match(/<wpt /g)).toHaveLength(2);
      expect(gpx.body).toContain('<name>Kreuzeckhaus</name>');

      await deleteRows(orm, Places, { id: hut.id });
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.waypoints).toHaveLength(3);
      expect(detail.body.waypoints[1].linked_place_id).toBeUndefined();
      expect(detail.body.waypoints[0].linked_place_id).toBe(lake.id);
    });
  });

  describe('hiking preferences (MF-08)', () => {
    it('a hike keeps the preferences switched on, reads them back, and a copy carries them', async () => {
      const placeId = await createViaApi(
        5,
        tourBody({ hiking_preferences: { avoid_climbs: true, avoid_steps: true, avoid_ferries: false } }),
      );
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.tour.hiking_preferences).toEqual({ avoid_climbs: true, avoid_steps: true });
      const copy = await request(server)
        .post(`/api/trips/5/tours/${placeId}/copy`)
        .set('Cookie', sessionCookie(OWNER))
        .send({ name: 'Copy' });
      expect(copy.body.tour.hiking_preferences).toEqual({ avoid_climbs: true, avoid_steps: true });

      // An edit that switches them all off keeps none; one without the field keeps none too.
      const off = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ hiking_preferences: { avoid_steps: false } }));
      expect(off.body.tour.hiking_preferences).toBeNull();
      expect((await findRow(orm, Tours, { place: placeId }))?.hiking_preferences).toBeNull();
    });

    it('a tour saved before keeps none, an unknown preference is refused, and a paddle tour has none', async () => {
      const plain = await createViaApi();
      const detail = await request(server).get(`/api/trips/5/tours/${plain}`).set('Cookie', sessionCookie(OWNER));
      expect(detail.body.tour.hiking_preferences).toBeNull();
      const unknown = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ hiking_preferences: { avoid_hills: true } }));
      expect(unknown.status).toBe(400);
      const paddle = await request(server)
        .post('/api/trips/5/tours')
        .set('Cookie', sessionCookie(OWNER))
        .send(
          tourBody({
            tour_type: 'kayak',
            boat_type: 'kayak',
            water_context: 'lake',
            max_hiking_difficulty: null,
            hiking_preferences: { avoid_steps: true },
          }),
        );
      expect(paddle.status).toBe(400);
    });
  });
  describe('taking a tour over from another trip (LIB-02)', () => {
    beforeAll(async () => {
      // A trip of someone else's, which the owner never sees.
      await insertRows(orm, Trips, [{ id: 7, user: 3, title: 'Elsewhere' }]);
    });

    const outsiderTour = async () => {
      const res = await request(server)
        .post('/api/trips/7/tours')
        .set('Cookie', sessionCookie(OUTSIDER))
        .send(tourBody({ name: 'Secret ridge' }));
      expect(res.status).toBe(201);
      return res.body.tour.place_id as number;
    };

    it('lists the tours of the trips the user can open, with their trip, never one of another user', async () => {
      const ridge = await createViaApi(5, tourBody({ name: 'Ridge 100% walk' }));
      await createViaApi(
        5,
        tourBody({
          name: 'Lake loop',
          tour_type: 'kayak',
          boat_type: 'kayak',
          water_context: 'lake',
          max_hiking_difficulty: null,
        }),
      );
      await createViaApi(6, tourBody({ name: 'Valley walk' }));
      await outsiderTour();

      const all = await request(server).get('/api/tours/library').set('Cookie', sessionCookie(OWNER));
      expect(all.status).toBe(200);
      expect(all.body.tours.map((tour: { name: string }) => tour.name).sort()).toEqual([
        'Lake loop',
        'Ridge 100% walk',
        'Valley walk',
      ]);
      expect(all.body.tours.find((tour: { place_id: number }) => tour.place_id === ridge)).toMatchObject({
        trip: { id: 5, title: 'Alps' },
        tour_type: 'hike',
        has_waypoints: true,
        origin: 'trek',
      });
      expect(all.body.trips).toEqual([
        { id: 6, title: 'Other', tour_count: 1 },
        { id: 5, title: 'Alps', tour_count: 2 },
      ]);
      expect(all.body.truncated).toBe(false);
      expect(JSON.stringify(all.body)).not.toContain('Secret ridge');

      // Leaving the asking trip out, by name (case and a literal "%" alike), by type and by trip.
      const from6 = await request(server)
        .get('/api/tours/library?exclude_trip_id=6')
        .set('Cookie', sessionCookie(OWNER));
      expect(from6.body.tours.every((tour: { trip: { id: number } }) => tour.trip.id === 5)).toBe(true);
      expect(from6.body.trips).toEqual([{ id: 5, title: 'Alps', tour_count: 2 }]);
      const named = await request(server).get('/api/tours/library?q=100%25').set('Cookie', sessionCookie(OWNER));
      expect(named.body.tours.map((tour: { name: string }) => tour.name)).toEqual(['Ridge 100% walk']);
      const anyCase = await request(server).get('/api/tours/library?q=VALLEY').set('Cookie', sessionCookie(OWNER));
      expect(anyCase.body.tours.map((tour: { name: string }) => tour.name)).toEqual(['Valley walk']);
      const paddle = await request(server).get('/api/tours/library?type=kayak').set('Cookie', sessionCookie(OWNER));
      expect(paddle.body.tours.map((tour: { name: string }) => tour.name)).toEqual(['Lake loop']);
      const trip6 = await request(server).get('/api/tours/library?trip_id=6').set('Cookie', sessionCookie(OWNER));
      expect(trip6.body.tours.map((tour: { name: string }) => tour.name)).toEqual(['Valley walk']);
      const bad = await request(server).get('/api/tours/library?type=car').set('Cookie', sessionCookie(OWNER));
      expect(bad.status).toBe(400);

      // A member sees the trips they belong to.
      const member = await request(server).get('/api/tours/library').set('Cookie', sessionCookie(VIEWER));
      expect(member.body.trips.map((trip: { id: number }) => trip.id)).toEqual([5]);
    });

    it("previews one tour with its line and control points; another user's tour or none is not found", async () => {
      const ridge = await createViaApi(5);
      const preview = await request(server).get(`/api/tours/library/${ridge}`).set('Cookie', sessionCookie(OWNER));
      expect(preview.status).toBe(200);
      expect(preview.body.line).toEqual(GEOMETRY.map(([lat, lng]) => [lat, lng]));
      expect(preview.body.waypoint_count).toBe(2);
      expect(preview.body.tour).toMatchObject({ name: 'Ridge walk', trip: { id: 5, title: 'Alps' } });

      const secret = await outsiderTour();
      const hidden = await request(server).get(`/api/tours/library/${secret}`).set('Cookie', sessionCookie(OWNER));
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ error: 'Tour not found' });
      expect((await request(server).get('/api/tours/library/999999').set('Cookie', sessionCookie(OWNER))).status).toBe(
        404,
      );
      expect((await request(server).get('/api/tours/library/abc').set('Cookie', sessionCookie(OWNER))).status).toBe(
        404,
      );
    });

    it('a long line is thinned for the preview, its ends kept', async () => {
      const long = Array.from({ length: 1200 }, (_, index) => [47 + index / 10000, 11 + index / 10000, 600]);
      const placeId = await createViaApi(5, tourBody({ route_geometry: long }));
      const preview = await request(server).get(`/api/tours/library/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(preview.body.line).toHaveLength(400);
      expect(preview.body.line[0]).toEqual([47, 11]);
      const last = long[long.length - 1] ?? [];
      expect(preview.body.line[399]).toEqual([last[0], last[1]]);
    });

    it('takes a tour over as an independent tour of this trip, remembering where it came from', async () => {
      const hut = await makePlace(orm, 5, { name: 'Hut', lat: 47.01, lng: 11.01 });
      const source = await createViaApi(
        5,
        tourBody({
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0 },
            { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, linked_place_id: hut.id },
            { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
          ],
        }),
      );
      realtime.broadcastMock.mockClear();
      const res = await request(server)
        .post('/api/trips/6/tours/take-over')
        .set('Cookie', sessionCookie(OWNER))
        .send({ source_trip_id: 5, source_place_id: source });
      expect(res.status).toBe(201);
      const copy = res.body.tour.place_id as number;
      expect(copy).not.toBe(source);
      expect(res.body.tour).toMatchObject({
        name: 'Ridge walk',
        revision: 1,
        planned: false,
        max_hiking_difficulty: 3,
      });
      expect(res.body.provenance).toMatchObject({
        derivedFrom: null,
        takenOverFrom: { tripTitle: 'Alps', tourName: 'Ridge walk' },
      });
      // The stop stood for a place of the other trip: in this one it stands for nothing.
      expect(
        res.body.waypoints.map((point: { linked_place_id?: number | null }) => point.linked_place_id ?? null),
      ).toEqual([null, null, null]);
      expect(await findRow(orm, Places, { id: copy })).toMatchObject({ trip_id: 6 });
      expect(await countRows(orm, DayAssignments, { place: copy })).toBe(0);
      expect(realtime.broadcastMock.mock.calls.every(([tripId]) => String(tripId) === '6')).toBe(true);

      // The source is untouched, and a later change to one leaves the other as it is.
      const original = await request(server).get(`/api/trips/5/tours/${source}`).set('Cookie', sessionCookie(OWNER));
      expect(original.body.provenance.takenOverFrom).toBeNull();
      expect(original.body.waypoints[1].linked_place_id).toBe(hut.id);
      await request(server)
        .put(`/api/trips/6/tours/${copy}`)
        .set('Cookie', sessionCookie(OWNER))
        .send(tourBody({ name: 'Renamed copy' }));
      expect((await findRow(orm, Places, { id: source }))?.name).toBe('Ridge walk');

      // A copy of the copy still names where the line came from.
      const again = await request(server)
        .post(`/api/trips/6/tours/${copy}/copy`)
        .set('Cookie', sessionCookie(OWNER))
        .send({ name: 'Again' });
      expect(again.body.provenance.takenOverFrom).toEqual({ tripTitle: 'Alps', tourName: 'Ridge walk' });
    });

    it('a name can be given; a source out of reach or gone is not found and leaves nothing behind', async () => {
      const source = await createViaApi(5);
      const named = await request(server)
        .post('/api/trips/6/tours/take-over')
        .set('Cookie', sessionCookie(OWNER))
        .send({ source_trip_id: 5, source_place_id: source, name: 'My ridge' });
      expect(named.body.tour.name).toBe('My ridge');

      const before = await countRows(orm, Places, { trip: 7 });
      const stolen = await request(server)
        .post('/api/trips/7/tours/take-over')
        .set('Cookie', sessionCookie(OUTSIDER))
        .send({ source_trip_id: 5, source_place_id: source });
      expect(stolen.status).toBe(404);
      expect(stolen.body).toEqual({ error: 'Tour not found' });
      // The place id named with the wrong trip is not found either.
      const mismatched = await request(server)
        .post('/api/trips/6/tours/take-over')
        .set('Cookie', sessionCookie(OWNER))
        .send({ source_trip_id: 6, source_place_id: source });
      expect(mismatched.status).toBe(404);
      expect(await countRows(orm, Places, { trip: 7 })).toBe(before);
    });

    it('needs place_edit on the trip it writes into, the addon on, a session and a well-formed body', async () => {
      const source = await createViaApi(6);
      const viewer = await request(server)
        .post('/api/trips/5/tours/take-over')
        .set('Cookie', sessionCookie(VIEWER))
        .send({ source_trip_id: 6, source_place_id: source });
      expect(viewer.status).toBe(403);
      const extra = await request(server)
        .post('/api/trips/5/tours/take-over')
        .set('Cookie', sessionCookie(OWNER))
        .send({ source_trip_id: 6, source_place_id: source, day_id: 1 });
      expect(extra.status).toBe(400);
      expect((await request(server).get('/api/tours/library')).status).toBe(401);
      await setAddonEnabled(orm, 'tours', false);
      const off = await request(server).get('/api/tours/library').set('Cookie', sessionCookie(OWNER));
      expect(off.status).toBe(404);
      expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
    });
  });
  describe('places along a tour (PLN-02)', () => {
    const body = {
      tour_type: 'hike',
      categories: ['drinking_water'],
      corridor_m: 500,
      line: [
        [47, 11],
        [47.02, 11],
      ],
    };
    const spring = {
      osm_id: 'node:7',
      name: 'Spring',
      lat: 47.01,
      lng: 11.001,
      category: 'drinking_water',
      poi_type: 'amenity=drinking_water',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      cuisine: null,
      brand: null,
      brand_wikidata: null,
      charging: null,
      source: 'openstreetmap',
    };

    it('answers the places along a draft line to anyone who sees the trip, and writes nothing', async () => {
      mapsPoisAlong.mockResolvedValue({ pois: [spring], failed: [], partial: false, truncated: false, capped: false });
      const places = await countRows(orm, Places);
      const res = await request(server)
        .post('/api/trips/5/tours/poi-search')
        .set('Cookie', sessionCookie(VIEWER))
        .send(body);
      expect(res.status).toBe(200);
      expect(res.body.pois).toEqual([
        expect.objectContaining({ id: 'node:7', name: 'Spring', category: 'drinking_water' }),
      ]);
      expect(res.body).toMatchObject({ truncated: false, partial: false, capped: false, unavailable: [] });
      expect(await countRows(orm, Places)).toBe(places);
      expect(realtime.broadcastMock).not.toHaveBeenCalled();
    });

    it('names the kinds that could not be searched right now instead of reporting nothing found', async () => {
      mapsPoisAlong.mockResolvedValue({
        pois: [],
        failed: ['viewpoint', 'shelter'],
        partial: false,
        truncated: false,
        capped: false,
      });
      const res = await request(server)
        .post('/api/trips/5/tours/poi-search')
        .set('Cookie', sessionCookie(VIEWER))
        .send({ ...body, categories: ['viewpoint', 'shelter', 'drinking_water'] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        pois: [],
        truncated: false,
        partial: false,
        capped: false,
        unavailable: ['viewpoint', 'shelter'],
      });
    });

    it('says how many seconds until asking again makes sense while the map search holds back', async () => {
      mapsPoisAlong.mockResolvedValue({
        pois: [],
        failed: ['viewpoint'],
        partial: false,
        truncated: false,
        capped: false,
        retryAfterS: 20,
      });
      const res = await request(server)
        .post('/api/trips/5/tours/poi-search')
        .set('Cookie', sessionCookie(VIEWER))
        .send({ ...body, categories: ['viewpoint'] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        pois: [],
        truncated: false,
        partial: false,
        capped: false,
        unavailable: ['viewpoint'],
        retry_after_s: 20,
      });
    });

    it('finds e-bike charging along a bike tour with what the point states, and only there (BIK-07)', async () => {
      const charging = {
        sockets: [{ type: 'schuko', count: 2, kw: null }],
        capacity: null,
        fee: false,
        bicycle: 'designated',
        access: 'customers',
      };
      const charger = {
        ...spring,
        osm_id: 'node:8',
        name: '',
        category: 'ebike_charging',
        poi_type: 'amenity=charging_station&bicycle=designated',
        charging,
      };
      mapsPoisAlong.mockResolvedValue({
        pois: [charger, spring],
        failed: [],
        partial: false,
        truncated: false,
        capped: false,
      });
      const res = await request(server)
        .post('/api/trips/5/tours/poi-search')
        .set('Cookie', sessionCookie(VIEWER))
        .send({ ...body, tour_type: 'bike', categories: ['ebike_charging', 'drinking_water'], corridor_m: 1000 });
      expect(res.status).toBe(200);
      expect(mapsPoisAlong.mock.calls.at(-1)?.[0]).toEqual(['ebike_charging', 'drinking_water']);
      expect(res.body.pois).toEqual([
        {
          id: 'node:8',
          name: '',
          lat: 47.01,
          lng: 11.001,
          category: 'ebike_charging',
          kind: 'amenity=charging_station&bicycle=designated',
          source: 'openstreetmap',
          address: null,
          website: null,
          phone: null,
          opening_hours: null,
          distance_m: expect.any(Number),
          along_m: expect.any(Number),
          charging,
        },
        expect.not.objectContaining({ charging: expect.anything() }),
      ]);
    });

    it('404 for someone outside the trip, 400 for a body it does not know, 401 without a session', async () => {
      const outsider = await request(server)
        .post('/api/trips/5/tours/poi-search')
        .set('Cookie', sessionCookie(OUTSIDER))
        .send(body);
      expect(outsider.status).toBe(404);
      const bad = [
        { ...body, categories: ['fuel'] },
        { ...body, corridor_m: 9000 },
        { ...body, line: [[47, 11]] },
        { ...body, add: 1 },
      ];
      // One after another: the server under test takes one connection at a time.
      const refused = await bad.reduce<Promise<number[]>>(
        async (done, sent) => [
          ...(await done),
          (await request(server).post('/api/trips/5/tours/poi-search').set('Cookie', sessionCookie(OWNER)).send(sent))
            .status,
        ],
        Promise.resolve([]),
      );
      expect(refused).toEqual([400, 400, 400, 400]);
      expect((await request(server).post('/api/trips/5/tours/poi-search').send(body)).status).toBe(401);
    });
  });
});
