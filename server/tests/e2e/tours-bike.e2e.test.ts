/**
 * Tours e2e for bike tours (BIK-01 to BIK-05): a bike tour saved, read, copied,
 * imported and exported with its profile, through the real JwtAuthGuard,
 * AddonGuard and TripAccessGuard against a migrated and seeded temp SQLite db.
 * The permission check is a container spy and the broadcast goes to a
 * FakeRealtimeService, as in tours.e2e.test.ts.
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
import { TrekPlacesLayersService } from '../../src/nest/maps/trek-places-layers.service';
import { OverpassElementsClient } from '../../src/nest/overpass/overpass-elements.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, deleteRows, findRow, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
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
const mapsPois = vi.fn();
// The trail grades (BIK-05) read OpenStreetMap from the TREK Places ways layer, else through
// Overpass: no network in a test.
const overpassQuery = vi.fn();
const placesWayTags = vi.fn();
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
const bikeBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Lakeside ride',
  tour_type: 'bike',
  bike_profile: 'gravel',
  route_geometry: GEOMETRY,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
  ],
  duration_seconds: 1800,
  ...overrides,
});
const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Gravel loop</name><trkseg>
<trkpt lat="47" lon="11"><ele>600</ele></trkpt>
<trkpt lat="47.01" lon="11.01"><ele>640</ele></trkpt>
</trkseg></trk></gpx>`;

describe('Bike tours e2e (real guards + temp SQLite)', () => {
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
      .useValue({ pois: mapsPois })
      .overrideProvider(OverpassElementsClient)
      .useValue({ query: overpassQuery })
      .overrideProvider(TrekPlacesLayersService)
      .useValue({ wayTags: placesWayTags })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const createViaApi = async (tripId = 5, body: Record<string, unknown> = bikeBody()) => {
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
    // The ways layer not built yet unless a case says otherwise, so the grades come through Overpass.
    placesWayTags.mockReset().mockResolvedValue({ ok: false, miss: 'not_built' });
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  const send = (method: 'post' | 'put', path: string, body: Record<string, unknown>, userId = OWNER) =>
    request(server)[method](`/api/trips/5/tours${path}`).set('Cookie', sessionCookie(userId)).send(body);

  const gpxTypeOf = async (placeId: number) => {
    const res = await request(server)
      .get(`/api/trips/5/tours/${placeId}/export.gpx`)
      .set('Cookie', sessionCookie(OWNER))
      .buffer(true)
      .parse((res, done) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (text += chunk));
        res.on('end', () => done(null, text));
      });
    return /<type>([^<]+)<\/type>/.exec(String(res.body))?.[1] ?? '';
  };

  describe('a bike tour and its profile (BIK-01 to BIK-04)', () => {
    it('saves a bike tour with its profile, lists it so and broadcasts the change', async () => {
      const placeId = await createViaApi();
      const row = await findRow(orm, Tours, { place: placeId });
      expect(row).toMatchObject({ bike_profile: 'gravel', max_hiking_difficulty: null, boat_type: null });
      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(VIEWER));
      expect(list.status).toBe(200);
      const tour = list.body.tours.find((item: { place_id: number }) => item.place_id === placeId);
      expect(tour).toMatchObject({ tour_type: 'bike', bike_profile: 'gravel', duration: 30 });
      expect(tour.elevation_gain).toBe(100);
      expect(realtime.broadcastMock).toHaveBeenCalled();
    });

    it('refuses a bike tour without a profile, with a hiking limit, or over a via ferrata', async () => {
      const ferrata = { kind: 'ferrata', ref: 'way/1', name: null, geometry: [GEOMETRY[0], GEOMETRY[2]] };
      const bodies = [
        bikeBody({ bike_profile: null }),
        bikeBody({ bike_profile: 'ebike' }),
        bikeBody({ max_hiking_difficulty: 3 }),
        bikeBody({
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0, fixed_leg: ferrata },
            { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
          ],
        }),
      ];
      const statuses = await bodies.reduce<Promise<number[]>>(
        async (done, body) => [...(await done), (await send('post', '', body)).status],
        Promise.resolve([]),
      );
      expect(statuses).toEqual([400, 400, 400, 400]);
      expect(await countRows(orm, Tours)).toBe(0);
    });

    it('changes the profile with an edit, and a hike made of it keeps none', async () => {
      const placeId = await createViaApi();
      const road = await send('put', `/${placeId}`, bikeBody({ bike_profile: 'road', expected_revision: 1 }));
      expect(road.status).toBe(200);
      expect(road.body.tour).toMatchObject({ bike_profile: 'road', revision: 2 });
      const hike = await send(
        'put',
        `/${placeId}`,
        bikeBody({ tour_type: 'hike', bike_profile: undefined, max_hiking_difficulty: 2, expected_revision: 2 }),
      );
      expect(hike.status).toBe(200);
      expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
        tour_type: 'hike',
        bike_profile: null,
        max_hiking_difficulty: 2,
      });
    });

    it('a member who may only read cannot save one', async () => {
      expect((await send('post', '', bikeBody(), VIEWER)).status).toBe(403);
    });

    it('a copy keeps the profile', async () => {
      const placeId = await createViaApi(5, bikeBody({ bike_profile: 'mtb' }));
      const copy = await send('post', `/${placeId}/copy`, { name: 'Again' });
      expect(copy.status).toBe(201);
      expect(copy.body.tour).toMatchObject({ tour_type: 'bike', bike_profile: 'mtb' });
    });

    it('exports a bike tour as the activity its profile names', async () => {
      const kinds: Record<string, string> = {
        touring: 'cycling',
        road: 'road_biking',
        gravel: 'gravel_cycling',
        mtb: 'mountain_biking',
      };
      const types = await Object.keys(kinds).reduce<Promise<string[]>>(
        async (done, profile) => [
          ...(await done),
          await gpxTypeOf(await createViaApi(5, bikeBody({ bike_profile: profile }))),
        ],
        Promise.resolve([]),
      );
      expect(types).toEqual(Object.values(kinds));
    });

    it('imports a GPX file as a bike tour only with its profile', async () => {
      const importGpx = (fields: Record<string, string>) => {
        let req = request(server).post('/api/trips/5/tours/import/gpx').set('Cookie', sessionCookie(OWNER));
        for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
        return req.attach('file', Buffer.from(GPX), { filename: 'loop.gpx', contentType: 'application/gpx+xml' });
      };
      expect((await importGpx({ tour_type: 'bike' })).status).toBe(400);
      const res = await importGpx({ tour_type: 'bike', bike_profile: 'road' });
      expect(res.status).toBe(201);
      expect(res.body.tours[0]).toMatchObject({ tour_type: 'bike', bike_profile: 'road', origin: 'gpx' });
    });
  });

  describe('POST trail-grades (BIK-05)', () => {
    const ask = (body: unknown, userId?: number, tripId = 5) => {
      const req = request(server).post(`/api/trips/${tripId}/tours/trail-grades`);
      return (userId ? req.set('Cookie', sessionCookie(userId)) : req).send(body as object);
    };

    it('answers the grades of the ways asked about to anyone who sees the trip', async () => {
      overpassQuery.mockResolvedValueOnce([
        { type: 'way', id: 11, tags: { 'mtb:scale': '2', 'mtb:scale:uphill': '1' } },
        { type: 'way', id: 12, tags: { sac_scale: 'mountain_hiking', surface: 'ground', highway: 'path' } },
      ]);
      const res = await ask({ way_ids: [11, 12] }, VIEWER);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ways: [
          {
            id: 11,
            mtb_scale: '2',
            mtb_scale_uphill: '1',
            mtb_scale_imba: null,
            sac_scale: null,
            sac_scale_unclear: null,
            surface: null,
            highway: null,
          },
          {
            id: 12,
            mtb_scale: null,
            mtb_scale_uphill: null,
            mtb_scale_imba: null,
            sac_scale: 'mountain_hiking',
            sac_scale_unclear: null,
            surface: 'ground',
            highway: 'path',
          },
        ],
        unanswered: [],
      });
    });

    it('reads the grades from the TREK Places ways layer when it has them, asking no mirror', async () => {
      overpassQuery.mockReset();
      placesWayTags.mockResolvedValueOnce({
        ok: true,
        value: {
          complete: true,
          ways: [{ type: 'way', id: 21, tags: { 'mtb:scale': '1', surface: 'gravel', highway: 'track' } }],
        },
      });
      const res = await ask({ way_ids: [21, 22] }, VIEWER);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ways: [
          {
            id: 21,
            mtb_scale: '1',
            mtb_scale_uphill: null,
            mtb_scale_imba: null,
            sac_scale: null,
            sac_scale_unclear: null,
            surface: 'gravel',
            highway: 'track',
          },
        ],
        unanswered: [],
      });
      expect(placesWayTags).toHaveBeenCalledWith([21, 22]);
      expect(overpassQuery).not.toHaveBeenCalled();
    });

    it('refuses an outsider, a body it does not know, and no session', async () => {
      expect((await ask({ way_ids: [1] }, OUTSIDER)).status).toBe(404);
      const statuses = await [{ way_ids: [] }, { way_ids: [0] }, { way_ids: [1], extra: 1 }].reduce<Promise<number[]>>(
        async (done, body) => [...(await done), (await ask(body, OWNER)).status],
        Promise.resolve([]),
      );
      expect(statuses).toEqual([400, 400, 400]);
      expect((await ask({ way_ids: [1] })).status).toBe(401);
    });
  });
});
