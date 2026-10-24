/**
 * Tours e2e for ski tours (SKI-02): a GPX file imported as a ski track with
 * its discipline (and a cross-country technique), kept as recorded with no
 * time worked out, listed, opened, exported, copied and classified again
 * without touching the track, its days or its provenance; a ski tour planned
 * with its discipline, drawn and untimed; through the real
 * JwtAuthGuard, AddonGuard and TripAccessGuard against a migrated and seeded
 * temp SQLite db. The permission check is a container spy and the broadcast
 * goes to a FakeRealtimeService, as in tours-run.e2e.test.ts.
 *
 * Fixtures: user 1 owns trip 5 and trip 6, user 2 is a member of trip 5 whom
 * the permission spy denies 'place_edit'.
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

// Up on skins to the hut and back down: heights recorded, no timestamps.
const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Up to the hut</name><trkseg>
<trkpt lat="47.2" lon="11.3"><ele>1200</ele></trkpt>
<trkpt lat="47.21" lon="11.31"><ele>1650</ele></trkpt>
<trkpt lat="47.22" lon="11.32"><ele>1980</ele></trkpt>
</trkseg></trk></gpx>`;

// A planned hike; a planned ski tour is the same body as type ski with its discipline and no time.
const hikeBody = {
  name: 'Ridge walk',
  tour_type: 'hike',
  route_geometry: [
    [47.2, 11.3, 1200],
    [47.22, 11.32, 1980],
  ],
  waypoints: [
    { lat: 47.2, lng: 11.3, role: 'start', sequence: 0 },
    { lat: 47.22, lng: 11.32, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
};

describe('Ski tracks e2e (real guards + temp SQLite)', () => {
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
      .useValue({ query: vi.fn() })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const importGpx = (fields: Record<string, string>, tripId = 5) => {
    let req = request(server).post(`/api/trips/${tripId}/tours/import/gpx`).set('Cookie', sessionCookie(OWNER));
    for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
    return req.attach('file', Buffer.from(GPX), { filename: 'hut.gpx', contentType: 'application/gpx+xml' });
  };

  const importSki = async (fields: Record<string, string> = { ski_discipline: 'touring' }, tripId = 5) => {
    const res = await importGpx({ tour_type: 'ski', ...fields }, tripId);
    expect(res.status).toBe(201);
    return res.body.tours[0].place_id as number;
  };

  const classify = (placeId: number, body: Record<string, unknown>, userId = OWNER, tripId = 5) =>
    request(server)
      .put(`/api/trips/${tripId}/tours/${placeId}/ski`)
      .set('Cookie', sessionCookie(userId))
      .set('X-Socket-Id', 'sock-9')
      .send(body);

  const detail = async (placeId: number) =>
    (await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(OWNER))).body;

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await insertRows(orm, Trips, [
      { id: 5, user: 1, title: 'Ski week' },
      { id: 6, user: 1, title: 'Other trip' },
    ]);
    await addTripMember(orm, 5, 2);
    await insertRows(orm, Days, [{ id: 3, trip: 5, day_number: 1, date: '2027-02-10' }]);
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

  it('TOURS-SKI-E2E-001: imports a ski track with its discipline, kept as recorded, with its heights and no time', async () => {
    const placeId = await importSki();
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'touring',
      ski_technique: null,
      duration: null,
      max_hiking_difficulty: null,
      origin: 'gpx',
      origin_file_name: 'hut.gpx',
    });
    const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(VIEWER));
    expect(list.status).toBe(200);
    const listed = list.body.tours[0];
    expect(listed).toMatchObject({ place_id: placeId, tour_type: 'ski', ski_discipline: 'touring', duration: null });
    expect(listed.elevation_gain).toBeGreaterThan(0);
    expect(listed.distance).toBeGreaterThan(0);
    const opened = await detail(placeId);
    expect(opened.tour).toMatchObject({ tour_type: 'ski', ski_discipline: 'touring', has_waypoints: false });
    expect(opened.provenance).toMatchObject({ origin: 'gpx', source: { kind: 'gpx', fileName: 'hut.gpx' } });
  });

  it.each(['classic', 'skating', 'unknown'])(
    'TOURS-SKI-E2E-002: a cross-country track keeps its technique, unknown included: %s',
    async (technique) => {
      const placeId = await importSki({ ski_discipline: 'cross_country', ski_technique: technique });
      expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
        ski_discipline: 'cross_country',
        ski_technique: technique,
      });
      await deleteRows(orm, Places);
    },
  );

  it('TOURS-SKI-E2E-003: refuses a ski import without its discipline or with a technique it has not, and ski fields on a hike', async () => {
    const refused = await oneByOne(
      [
        { tour_type: 'ski' },
        { tour_type: 'ski', ski_discipline: 'cross_country' },
        { tour_type: 'ski', ski_discipline: 'alpine', ski_technique: 'classic' },
        { tour_type: 'ski', ski_discipline: 'freeride' },
        { tour_type: 'hike', ski_discipline: 'alpine' },
      ],
      (fields) => importGpx(fields),
    );
    expect(refused.map((res) => res.status)).toEqual([400, 400, 400, 400, 400]);
    expect(await countRows(orm, Places)).toBe(0);
  });

  it('TOURS-SKI-E2E-004: a planned ski tour saves with its discipline, drawn and untimed, and never without one', async () => {
    const planned = { ...hikeBody, name: 'Snowshoes to the hut', tour_type: 'ski', max_hiking_difficulty: null };
    const refused = await oneByOne(
      [
        { ...planned, duration_seconds: null },
        { ...planned, duration_seconds: null, ski_discipline: 'cross_country' },
        { ...planned, duration_seconds: null, ski_discipline: 'alpine', ski_technique: 'classic' },
        { ...planned, duration_seconds: null, ski_discipline: 'snowshoe', max_hiking_difficulty: 3 },
      ],
      (body) => request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(body),
    );
    expect(refused.map((res) => res.status)).toEqual([400, 400, 400, 400]);
    expect(await countRows(orm, Tours)).toBe(0);

    const res = await request(server)
      .post('/api/trips/5/tours')
      .set('Cookie', sessionCookie(OWNER))
      .send({ ...planned, duration_seconds: null, ski_discipline: 'snowshoe' });
    expect(res.status).toBe(201);
    expect(res.body.tour).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'snowshoe',
      ski_technique: null,
      max_hiking_difficulty: null,
      duration: null,
      origin: 'trek',
    });
    expect(res.body.tour.elevation_gain).toBeGreaterThan(0);
  });

  it('TOURS-SKI-E2E-010: a planned cross-country tour keeps its technique, exports as its discipline, and a hike takes both off', async () => {
    const planned = { ...hikeBody, tour_type: 'ski', max_hiking_difficulty: null, duration_seconds: null };
    const created = await request(server)
      .post('/api/trips/5/tours')
      .set('Cookie', sessionCookie(OWNER))
      .send({ ...planned, ski_discipline: 'cross_country', ski_technique: 'skating' });
    expect(created.status).toBe(201);
    const placeId = created.body.tour.place_id as number;
    expect(created.body.tour).toMatchObject({ ski_discipline: 'cross_country', ski_technique: 'skating' });

    const exported = await request(server)
      .get(`/api/trips/5/tours/${placeId}/export.gpx`)
      .set('Cookie', sessionCookie(OWNER))
      .buffer(true)
      .parse((response, done) => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => (text += chunk));
        response.on('end', () => done(null, text));
      });
    expect(/<type>([^<]+)<\/type>/.exec(String(exported.body))?.[1]).toBe('cross_country_skiing');

    const asHike = await request(server)
      .put(`/api/trips/5/tours/${placeId}`)
      .set('Cookie', sessionCookie(OWNER))
      .send({ ...hikeBody, expected_revision: created.body.tour.revision });
    expect(asHike.status).toBe(200);
    expect(asHike.body.tour).toMatchObject({ tour_type: 'hike', ski_discipline: null, ski_technique: null });
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({ ski_discipline: null, ski_technique: null });
  });

  it('TOURS-SKI-E2E-011: a ski tour the piste router planned keeps its time, its options and the build', async () => {
    const planned = { ...hikeBody, tour_type: 'ski', max_hiking_difficulty: null, ski_discipline: 'alpine' };
    const created = await request(server)
      .post('/api/trips/5/tours')
      .set('Cookie', sessionCookie(OWNER))
      .send({
        ...planned,
        duration_seconds: 3600,
        ski_options: { max_difficulty: 'advanced', lit_only: true },
        ski_route_build: '2026-11-02',
      });
    expect(created.status).toBe(201);
    expect(created.body.tour).toMatchObject({
      duration: 60,
      ski_route_build: '2026-11-02',
      ski_options: { max_difficulty: 'advanced', lit_only: false, priority: 'fastest' },
    });
    const placeId = created.body.tour.place_id as number;
    const stored = await findRow(orm, Tours, { place: placeId });
    expect(JSON.parse(String(stored?.ski_options))).toMatchObject({ build: '2026-11-02' });

    const refused = await request(server)
      .post('/api/trips/5/tours')
      .set('Cookie', sessionCookie(OWNER))
      .send({ ...hikeBody, ski_options: {} });
    expect(refused.status).toBe(400);

    const asHike = await request(server)
      .put(`/api/trips/5/tours/${placeId}`)
      .set('Cookie', sessionCookie(OWNER))
      .send({ ...hikeBody, expected_revision: created.body.tour.revision });
    expect(asHike.status).toBe(200);
    expect(asHike.body.tour).not.toHaveProperty('ski_options');
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({ ski_options: null });
  });

  it('TOURS-SKI-E2E-012: a copy of a ski tour the piste router planned keeps its options, build and planned legs', async () => {
    const created = await request(server)
      .post('/api/trips/5/tours')
      .set('Cookie', sessionCookie(OWNER))
      .send({
        ...hikeBody,
        tour_type: 'ski',
        max_hiking_difficulty: null,
        ski_discipline: 'alpine',
        ski_options: { max_difficulty: 'advanced', lit_only: false },
        ski_route_build: '2026-11-02',
        ski_planned_legs: [0],
      });
    expect(created.status).toBe(201);
    const copy = await request(server)
      .post(`/api/trips/5/tours/${created.body.tour.place_id as number}/copy`)
      .set('Cookie', sessionCookie(OWNER))
      .send({ name: 'Again' });
    expect(copy.status).toBe(201);
    expect(copy.body.tour).toMatchObject({
      tour_type: 'ski',
      ski_route_build: '2026-11-02',
      ski_options: { max_difficulty: 'advanced' },
      ski_planned_legs: [0],
    });
    const stored = await findRow(orm, Tours, { place: copy.body.tour.place_id as number });
    expect(JSON.parse(String(stored?.ski_options))).toMatchObject({ build: '2026-11-02' });
  });

  it('TOURS-SKI-E2E-005: classified again, only the classification changes: track, measures, days and provenance stay', async () => {
    const placeId = await importSki({ ski_discipline: 'cross_country', ski_technique: 'unknown' });
    await insertRows(orm, DayAssignments, [{ day: 3, place: placeId, order_index: 0 }]);
    const before = await findRow(orm, Places, { id: placeId });
    const measured = await findRow(orm, Tours, { place: placeId });

    const res = await classify(placeId, {
      ski_discipline: 'cross_country',
      ski_technique: 'skating',
      expected_revision: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.tour).toMatchObject({
      ski_discipline: 'cross_country',
      ski_technique: 'skating',
      revision: 2,
      planned: true,
      distance: measured?.distance,
      elevation_gain: measured?.elevation_gain,
    });
    expect(res.body.provenance).toMatchObject({ origin: 'gpx', source: { kind: 'gpx', fileName: 'hut.gpx' } });
    expect((await findRow(orm, Places, { id: placeId }))?.route_geometry).toBe(before?.route_geometry);
    expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(1);
    expect(realtime.broadcastMock).toHaveBeenCalledWith('5', 'tours:changed', { placeIds: [placeId] }, 'sock-9');

    // Another discipline takes the technique off.
    const alpine = await classify(placeId, { ski_discipline: 'alpine' });
    expect(alpine.status).toBe(200);
    expect(alpine.body.tour).toMatchObject({ ski_discipline: 'alpine', ski_technique: null, revision: 3 });
  });

  it('TOURS-SKI-E2E-006: a classification against a tour that moved on is a 409 and changes nothing', async () => {
    const placeId = await importSki({ ski_discipline: 'alpine' });
    expect((await classify(placeId, { ski_discipline: 'snowboard' })).status).toBe(200);
    const stale = await classify(placeId, { ski_discipline: 'touring', expected_revision: 1 });
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'tour_revision_conflict', revision: 2 });
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({ ski_discipline: 'snowboard', revision: 2 });
  });

  it('TOURS-SKI-E2E-007: refuses a classification that is no ski classification, or of a tour that is no ski track', async () => {
    const placeId = await importSki({ ski_discipline: 'alpine' });
    const invalid = await oneByOne(
      [
        {},
        { ski_discipline: 'cross_country' },
        { ski_discipline: 'touring', ski_technique: 'classic' },
        { ski_discipline: 'monoski' },
      ],
      (body) => classify(placeId, body),
    );
    expect(invalid.map((res) => res.status)).toEqual([400, 400, 400, 400]);

    const hike = await request(server).post('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER)).send(hikeBody);
    expect(hike.status).toBe(201);
    const notSki = await classify(hike.body.tour.place_id as number, { ski_discipline: 'alpine' });
    expect(notSki.status).toBe(400);
    expect(notSki.body).toMatchObject({ error: 'Only a ski track has a ski classification' });
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({ ski_discipline: 'alpine', revision: 1 });
  });

  it('TOURS-SKI-E2E-008: a member who may only read cannot classify, and a ski track of another trip is not found', async () => {
    const placeId = await importSki({ ski_discipline: 'alpine' });
    expect((await classify(placeId, { ski_discipline: 'snowboard' }, VIEWER)).status).toBe(403);
    const elsewhere = await importSki({ ski_discipline: 'alpine' }, 6);
    expect((await classify(elsewhere, { ski_discipline: 'snowboard' })).status).toBe(404);
    expect((await classify(999999, { ski_discipline: 'snowboard' })).status).toBe(404);
    expect(await findRow(orm, Tours, { place: elsewhere })).toMatchObject({ ski_discipline: 'alpine' });
  });

  it('TOURS-SKI-E2E-009: exports a ski track as its discipline, and a copy keeps the classification', async () => {
    const placeId = await importSki();
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
    expect(/<type>([^<]+)<\/type>/.exec(String(res.body))?.[1]).toBe('backcountry_skiing');

    const copy = await request(server)
      .post(`/api/trips/5/tours/${placeId}/copy`)
      .set('Cookie', sessionCookie(OWNER))
      .send({ name: 'Again' });
    expect(copy.status).toBe(201);
    expect(copy.body.tour).toMatchObject({ tour_type: 'ski', ski_discipline: 'touring', ski_technique: null });
  });
});
