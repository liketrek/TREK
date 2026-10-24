/**
 * Tours e2e for runs (RUN-01, RUN-02): a run saved with its profile and pace, listed
 * and opened so, its time the distance at the pace, its pace changed or taken
 * out without touching the route or the days, refused without a profile or
 * with a pace out of bounds, copied, exported and imported, through the real
 * JwtAuthGuard, AddonGuard and TripAccessGuard against a migrated and seeded
 * temp SQLite db. The permission check is a container spy and the broadcast
 * goes to a FakeRealtimeService, as in tours-ski.e2e.test.ts.
 *
 * Fixtures: user 1 owns trip 5, user 2 is a member of trip 5 whom the
 * permission spy denies 'place_edit'.
 */
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { MapsService } from '../../src/nest/maps/maps.service';
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
import { oneByOne } from '../helpers/one-by-one';
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
const realtime = new FakeRealtimeService();

let orm: TestOrm;
let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;

const GEOMETRY = [
  [48.137, 11.575, 520],
  [48.15, 11.59, 515],
  [48.164, 11.605, 510],
];
// What the planner sends for 8 km at 6:00 min/km: 48 minutes.
const runBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'River loop',
  tour_type: 'run',
  run_profile: 'running',
  run_pace_seconds_per_km: 360,
  route_geometry: GEOMETRY,
  waypoints: [
    { lat: 48.137, lng: 11.575, role: 'start', sequence: 0 },
    { lat: 48.164, lng: 11.605, role: 'end', sequence: 1 },
  ],
  duration_seconds: 48 * 60,
  ...overrides,
});

const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Park laps</name><trkseg>
<trkpt lat="48.137" lon="11.575"><ele>520</ele></trkpt>
<trkpt lat="48.15" lon="11.59"><ele>515</ele></trkpt>
</trkseg></trk></gpx>`;

describe('Runs e2e (real guards + temp SQLite)', () => {
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
      // No network in a test: the trail grades read OpenStreetMap through Overpass.
      .overrideProvider(OverpassElementsClient)
      .useValue({ query: vi.fn() })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const send = (method: 'post' | 'put', path: string, body: Record<string, unknown>, userId = OWNER) =>
    request(server)[method](`/api/trips/5/tours${path}`).set('Cookie', sessionCookie(userId)).send(body);

  const createViaApi = async (body: Record<string, unknown> = runBody()) => {
    const res = await send('post', '', body);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Running week' }]);
    await addTripMember(orm, 5, 2);
    await insertRows(orm, Days, [{ id: 3, trip: 5, day_number: 1, date: '2027-05-10' }]);
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

  it('TOURS-RUN-E2E-001: saves a run with its profile, pace and planned time, and lists and opens it so', async () => {
    const placeId = await createViaApi();
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
      max_hiking_difficulty: null,
      duration: 48,
    });
    const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(VIEWER));
    expect(list.status).toBe(200);
    expect(list.body.tours[0]).toMatchObject({
      place_id: placeId,
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
    });
    const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
    expect(detail.body.tour).toMatchObject({ tour_type: 'run', run_profile: 'running', duration: 48 });
    expect(detail.body.waypoints).toHaveLength(2);
  });

  it('TOURS-RUN-E2E-002: a run without a pace has no time rather than one at a pace nobody chose', async () => {
    const placeId = await createViaApi(runBody({ run_pace_seconds_per_km: null, duration_seconds: null }));
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
      run_pace_seconds_per_km: null,
      duration: null,
    });
  });

  it('TOURS-RUN-E2E-003: a new pace changes the time and keeps the route and the days', async () => {
    const placeId = await createViaApi();
    await insertRows(orm, DayAssignments, [{ day: 3, place: placeId, order_index: 0 }]);
    const faster = await send(
      'put',
      `/${placeId}`,
      runBody({ run_pace_seconds_per_km: 300, duration_seconds: 40 * 60, expected_revision: 1 }),
    );
    expect(faster.status).toBe(200);
    expect(faster.body.tour).toMatchObject({ run_pace_seconds_per_km: 300, duration: 40, planned: true, revision: 2 });
    expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(1);
    expect((await findRow(orm, Places, { id: placeId }))?.route_geometry).toBe(JSON.stringify(GEOMETRY));
  });

  it('TOURS-RUN-E2E-004: refuses a run without a profile, a pace out of bounds or not positive, and run fields on a hike', async () => {
    const refused = await oneByOne(
      [
        runBody({ run_profile: null }),
        runBody({ run_profile: 'road' }),
        runBody({ run_pace_seconds_per_km: 0 }),
        runBody({ run_pace_seconds_per_km: -360 }),
        runBody({ run_pace_seconds_per_km: 1201 }),
        runBody({ run_pace_seconds_per_km: 330.5 }),
        runBody({ max_hiking_difficulty: 2 }),
        runBody({ tour_type: 'hike', run_profile: undefined }),
      ],
      (body) => send('post', '', body),
    );
    expect(refused.map((res) => res.status)).toEqual([400, 400, 400, 400, 400, 400, 400, 400]);
    expect(await countRows(orm, Tours)).toBe(0);
  });

  it('TOURS-RUN-E2E-005: a run made into a hike loses its profile and pace', async () => {
    const placeId = await createViaApi();
    const hike = await send(
      'put',
      `/${placeId}`,
      runBody({
        tour_type: 'hike',
        max_hiking_difficulty: 2,
        run_profile: undefined,
        run_pace_seconds_per_km: undefined,
      }),
    );
    expect(hike.status).toBe(200);
    expect(hike.body.tour).toMatchObject({ tour_type: 'hike', run_profile: null, run_pace_seconds_per_km: null });
  });

  it('TOURS-RUN-E2E-006: a member who may only read cannot save one', async () => {
    expect((await send('post', '', runBody(), VIEWER)).status).toBe(403);
  });

  it('TOURS-RUN-E2E-007: a copy keeps the profile and the pace', async () => {
    const placeId = await createViaApi();
    const copy = await send('post', `/${placeId}/copy`, { name: 'Again' });
    expect(copy.status).toBe(201);
    expect(copy.body.tour).toMatchObject({ tour_type: 'run', run_profile: 'running', run_pace_seconds_per_km: 360 });
  });

  it('TOURS-RUN-E2E-008: exports a run as running', async () => {
    const placeId = await createViaApi();
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
    expect(/<type>([^<]+)<\/type>/.exec(String(res.body))?.[1]).toBe('running');
  });

  it('TOURS-RUN-E2E-009: imports a GPX file as a run only with its profile, and without a pace', async () => {
    const importGpx = (fields: Record<string, string>) => {
      let req = request(server).post('/api/trips/5/tours/import/gpx').set('Cookie', sessionCookie(OWNER));
      for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
      return req.attach('file', Buffer.from(GPX), { filename: 'laps.gpx', contentType: 'application/gpx+xml' });
    };
    expect((await importGpx({ tour_type: 'run' })).status).toBe(400);
    const res = await importGpx({ tour_type: 'run', run_profile: 'running' });
    expect(res.status).toBe(201);
    expect(res.body.tours[0]).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
      run_pace_seconds_per_km: null,
      duration: null,
      origin: 'gpx',
    });
  });

  it('TOURS-RUN-E2E-010: a trail run keeps its profile, pace and days through a save, an opening and a new pace', async () => {
    const placeId = await createViaApi(
      runBody({ run_profile: 'trail', run_pace_seconds_per_km: 450, duration_seconds: 60 * 60 }),
    );
    await insertRows(orm, DayAssignments, [{ day: 3, place: placeId, order_index: 0 }]);
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
      run_profile: 'trail',
      run_pace_seconds_per_km: 450,
      duration: 60,
    });
    const slower = await send(
      'put',
      `/${placeId}`,
      runBody({ run_profile: 'trail', run_pace_seconds_per_km: 480, duration_seconds: 64 * 60, expected_revision: 1 }),
    );
    expect(slower.status).toBe(200);
    const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER));
    expect(detail.body.tour).toMatchObject({
      tour_type: 'run',
      run_profile: 'trail',
      run_pace_seconds_per_km: 480,
      duration: 64,
    });
    expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(1);
  });

  it('TOURS-RUN-E2E-011: a trail run exports as trail running, and a GPX file imports as one', async () => {
    const placeId = await createViaApi(runBody({ run_profile: 'trail' }));
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
    expect(/<type>([^<]+)<\/type>/.exec(String(res.body))?.[1]).toBe('trail_running');
    const imported = await request(server)
      .post('/api/trips/5/tours/import/gpx')
      .set('Cookie', sessionCookie(OWNER))
      .field('tour_type', 'run')
      .field('run_profile', 'trail')
      .attach('file', Buffer.from(GPX), { filename: 'ridge.gpx', contentType: 'application/gpx+xml' });
    expect(imported.status).toBe(201);
    expect(imported.body.tours[0]).toMatchObject({
      tour_type: 'run',
      run_profile: 'trail',
      run_pace_seconds_per_km: null,
    });
  });
});
