/**
 * Tours e2e for rides on horseback (HOR-01): a horse tour saved, read, copied
 * and exported with the origin of each of its legs, and the horse routes
 * around a map view, through the real JwtAuthGuard, AddonGuard and
 * TripAccessGuard against a migrated and seeded temp SQLite db. Overpass is a
 * container stub, the permission check a container spy and the broadcast goes
 * to a FakeRealtimeService, as in tours-bike.e2e.test.ts.
 *
 * Fixtures: user 1 owns trip 5, user 2 is a member of it whom the permission
 * spy denies 'place_edit', user 3 has no access.
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
import { HORSE_ROUTES_UNAVAILABLE_MESSAGE } from '../../src/nest/tours/tour-horse-routes.service';
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
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { FERRATA_BBOX_TOO_LARGE_MESSAGE, HORSE_ROUTES_ATTRIBUTION, TOUR_WRITE_MAX_BYTES } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

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
// The horse routes come from OpenStreetMap, from the TREK Places routes layer or else through
// Overpass: no network in a test.
const overpassQuery = vi.fn();
const placesRoutes = vi.fn();
const realtime = new FakeRealtimeService();

let orm: TestOrm;
let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;

const GEOMETRY = [
  [47, 11, 600],
  [47.005, 11.005, 640],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];
const SECTION = {
  kind: 'horse_route',
  ref: 'relation/42',
  name: 'Reitweg Isartal',
  geometry: [
    [47, 11],
    [47.005, 11.005],
    [47.01, 11.01],
  ],
  signposted: 'with',
  access: [
    { value: 'designated', length_m: 900 },
    { value: 'unknown', length_m: 450 },
  ],
};
const DRAWN = {
  kind: 'free',
  geometry: [
    [47.01, 11.01],
    [47.02, 11.02],
  ],
};
const rideBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ausritt am Fluss',
  tour_type: 'horse',
  route_geometry: GEOMETRY,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0, fixed_leg: SECTION },
    { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, fixed_leg: DRAWN },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
  ],
  ...overrides,
});
const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Recorded ride</name><trkseg>
<trkpt lat="47" lon="11"><ele>600</ele></trkpt>
<trkpt lat="47.01" lon="11.01"><ele>640</ele></trkpt>
</trkseg></trk></gpx>`;
const overpassAnswer = [
  {
    type: 'relation',
    id: 42,
    tags: { route: 'horse', name: 'Reitweg Isartal', ref: 'R1' },
    members: [
      { type: 'way', ref: 1, role: '' },
      { type: 'way', ref: 2, role: '' },
    ],
  },
  {
    type: 'way',
    id: 1,
    tags: { horse: 'designated' },
    nodes: [1, 2],
    geometry: [
      { lat: 47.15, lon: 11.25 },
      { lat: 47.16, lon: 11.25 },
    ],
  },
];

describe('Horse tours e2e (real guards + temp SQLite)', () => {
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
      .useValue({ pois: vi.fn() })
      .overrideProvider(OverpassElementsClient)
      .useValue({ query: overpassQuery })
      .overrideProvider(TrekPlacesLayersService)
      .useValue({ routes: placesRoutes })
      .compile();
    const nest = moduleRef.createNestApplication<NestExpressApplication>();
    // The ceiling bootstrap.ts gives a tour create or edit, in place of the 100kb default.
    nest.useBodyParser('json', { limit: TOUR_WRITE_MAX_BYTES });
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

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
    await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Isar' }]);
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
    overpassQuery.mockReset();
    // The routes layer not built yet unless a case says otherwise, so the routes come through Overpass.
    placesRoutes.mockReset().mockResolvedValue({ ok: false, miss: 'not_built' });
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  const send = (method: 'post' | 'put', path: string, body: Record<string, unknown>, userId = OWNER) =>
    request(server)[method](`/api/trips/5/tours${path}`).set('Cookie', sessionCookie(userId)).send(body);
  const create = async (body: Record<string, unknown> = rideBody()) => {
    const res = await send('post', '', body);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

  describe('a ride and the origin of its legs', () => {
    it('saves a ride, lists it without a riding time and broadcasts the change', async () => {
      const placeId = await create();
      expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
        tour_type: 'horse',
        duration: null,
        max_hiking_difficulty: null,
        bike_profile: null,
      });
      const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(VIEWER));
      expect(list.status).toBe(200);
      const tour = list.body.tours.find((item: { place_id: number }) => item.place_id === placeId);
      expect(tour).toMatchObject({ tour_type: 'horse', duration: null });
      // The heights of its line are read like any other tour's; only a time is never worked out.
      expect(tour.elevation_gain).toBeGreaterThan(0);
      expect(realtime.broadcastMock).toHaveBeenCalled();
    });

    it('opens again with each leg as taken, a section with its direction and access', async () => {
      const placeId = await create();
      const res = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(res.status).toBe(200);
      expect(res.body.tour.tour_type).toBe('horse');
      expect(res.body.waypoints.map((point: { fixed_leg?: unknown }) => point.fixed_leg ?? null)).toEqual([
        SECTION,
        DRAWN,
        null,
      ]);
    });

    it('refuses a routed leg, a via ferrata, a riding time worked out and a section on a hike', async () => {
      const ferrata = { kind: 'ferrata', ref: 'way/1', name: null, geometry: SECTION.geometry };
      const routed = rideBody({
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0 },
          { lat: 47.01, lng: 11.01, role: 'end', sequence: 1 },
        ],
      });
      const bodies = [
        routed,
        rideBody({
          waypoints: [
            { lat: 47, lng: 11, role: 'start', sequence: 0, fixed_leg: ferrata },
            { lat: 47.01, lng: 11.01, role: 'end', sequence: 1 },
          ],
        }),
        rideBody({ duration_seconds: 5400 }),
        rideBody({ tour_type: 'hike', max_hiking_difficulty: 2 }),
      ];
      const statuses = await bodies.reduce<Promise<number[]>>(
        async (done, body) => [...(await done), (await send('post', '', body)).status],
        Promise.resolve([]),
      );
      expect(statuses).toEqual([400, 400, 400, 400]);
      expect(await countRows(orm, Tours)).toBe(0);
    });

    it('saves and opens again a ride along a long section, a body far past 100kb', async () => {
      // A few thousand points at OSM's seven decimals, as a section of bridleway comes.
      const line = Array.from({ length: 4000 }, (_, i) => [
        Number((47 + i * 0.00001).toFixed(7)),
        Number((11 + i * 0.0000013).toFixed(7)),
      ]);
      const end = line[line.length - 1];
      const long = rideBody({
        route_geometry: line.map(([lat, lng], i) => [lat, lng, 600 + (i % 40)]),
        waypoints: [
          { lat: 47, lng: 11, role: 'start', sequence: 0, fixed_leg: { ...SECTION, geometry: line } },
          { lat: end[0], lng: end[1], role: 'end', sequence: 1 },
        ],
      });
      expect(JSON.stringify(long).length).toBeGreaterThan(150 * 1024);
      const placeId = await create(long);
      const res = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
      expect(res.status).toBe(200);
      expect(res.body.waypoints[0].fixed_leg.geometry).toEqual(line);
    });

    it('a member who may only read cannot save one', async () => {
      expect((await send('post', '', rideBody(), VIEWER)).status).toBe(403);
    });

    it('a copy keeps the type and the legs', async () => {
      const placeId = await create();
      const copy = await send('post', `/${placeId}/copy`, { name: 'Noch einmal' });
      expect(copy.status).toBe(201);
      expect(copy.body.tour).toMatchObject({ tour_type: 'horse' });
      expect(copy.body.waypoints[0].fixed_leg).toEqual(SECTION);
    });

    it('exports a ride as horseback riding', async () => {
      const placeId = await create();
      const res = await request(server)
        .get(`/api/trips/5/tours/${placeId}/export.gpx`)
        .set('Cookie', sessionCookie(OWNER))
        .buffer(true)
        .parse((response, done) => {
          let text = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => (text += chunk));
          response.on('end', () => done(null, text));
        });
      expect(res.status).toBe(200);
      expect(String(res.body)).toContain('<type>horseback_riding</type>');
    });

    it('imports a recorded ride as a ride, with nothing of another type', async () => {
      const res = await request(server)
        .post('/api/trips/5/tours/import/gpx')
        .set('Cookie', sessionCookie(OWNER))
        .field('tour_type', 'horse')
        .attach('file', Buffer.from(GPX), { filename: 'ride.gpx', contentType: 'application/gpx+xml' });
      expect(res.status).toBe(201);
      expect(res.body.tours[0]).toMatchObject({
        tour_type: 'horse',
        origin: 'gpx',
        duration: null,
        bike_profile: null,
      });
    });
  });

  describe('GET horse-routes', () => {
    const ask = (bbox: string | undefined, userId?: number) => {
      const req = request(server).get('/api/trips/5/tours/horse-routes');
      const withQuery = bbox === undefined ? req : req.query({ bbox });
      return userId ? withQuery.set('Cookie', sessionCookie(userId)) : withQuery;
    };

    it('answers the routes in the view, cut into sections, to anyone who sees the trip', async () => {
      overpassQuery.mockResolvedValueOnce(overpassAnswer);
      const res = await ask('47.12,11.21,47.18,11.29', VIEWER);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        truncated: false,
        source: 'openstreetmap',
        attribution: HORSE_ROUTES_ATTRIBUTION,
      });
      expect(res.body.routes).toEqual([
        expect.objectContaining({ id: 'relation/42', name: 'Reitweg Isartal', ref: 'R1', continues: true }),
      ]);
      expect(res.body.routes[0].sections[0]).toMatchObject({
        number: 1,
        signposted: null,
        access: [{ value: 'designated', length_m: 1112 }],
      });
    });

    it('reads the routes from the TREK Places routes layer when it has them, asking no mirror', async () => {
      placesRoutes.mockResolvedValueOnce({ ok: true, value: { elements: overpassAnswer, truncated: true } });
      const res = await ask('46.12,11.21,46.18,11.29', VIEWER);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ truncated: true, source: 'openstreetmap' });
      expect(res.body.routes).toEqual([expect.objectContaining({ id: 'relation/42', name: 'Reitweg Isartal' })]);
      expect(placesRoutes).toHaveBeenCalledWith({ south: 46.1, west: 11.2, north: 46.2, east: 11.3 }, 'horse', {
        relations: 60,
        ways: 4000,
      });
      expect(overpassQuery).not.toHaveBeenCalled();
    });

    it('says when no mirror answered, and refuses a box too large, an outsider and no session', async () => {
      overpassQuery.mockRejectedValueOnce(new Error('all mirrors down'));
      const failed = await ask('48.12,11.21,48.18,11.29', OWNER);
      expect(failed.status).toBe(502);
      expect(failed.body).toEqual({ error: HORSE_ROUTES_UNAVAILABLE_MESSAGE, code: 'horse_routes_unavailable' });
      const wide = await ask('46,11,47,11.4', OWNER);
      expect(wide.status).toBe(400);
      expect(wide.body).toEqual({ error: FERRATA_BBOX_TOO_LARGE_MESSAGE });
      expect((await ask('47.12,11.21,47.18,11.29', OUTSIDER)).status).toBe(404);
      expect((await ask('47.12,11.21,47.18,11.29')).status).toBe(401);
    });

    it('is not there while the Tours addon is off', async () => {
      await setAddonEnabled(orm, 'tours', false);
      expect((await ask('47.12,11.21,47.18,11.29', OWNER)).status).toBe(404);
    });
  });
});
