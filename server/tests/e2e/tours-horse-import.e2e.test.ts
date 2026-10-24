/**
 * Tours e2e for rides taken from a GPX file (HOR-02): the canonical Tours GPX
 * import, previewed and then confirmed as a ride, stored with its line as the
 * file recorded it, its origin and only the measures the file carries, opened
 * again and put on a day of the trip; a failed import leaves an existing ride
 * as it was. Real JwtAuthGuard, AddonGuard and TripAccessGuard against a
 * migrated and seeded temp SQLite db, as in tours-horse.e2e.test.ts; the
 * permission check is a container spy and the broadcast goes to a
 * FakeRealtimeService.
 *
 * Fixtures: user 1 owns trip 5 with day 3, user 2 is a member of it whom the
 * permission spy denies 'place_edit'.
 */
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
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
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

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
const realtime = new FakeRealtimeService();

let orm: TestOrm;
let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;

/** A ride as a watch records it: a few points, with heights. */
const RECORDED = [
  [47, 11, 600],
  [47.01, 11.01, 640],
  [47.02, 11.03, 610],
];
const RIDE_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Ausritt an der Isar</name><trkseg>
${RECORDED.map(([lat, lon, ele]) => `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele></trkpt>`).join('\n')}
</trkseg></trk></gpx>`;
/** One without heights: the import has nothing to say about them. */
const FLAT_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Feldweg</name><trkseg>
<trkpt lat="48" lon="12"/><trkpt lat="48.01" lon="12.01"/>
</trkseg></trk></gpx>`;

describe('Rides imported from GPX e2e (real guards + temp SQLite)', () => {
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
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue(journeyHooks)
      .overrideProvider(MapsService)
      .useValue({ pois: vi.fn() })
      .overrideProvider(OverpassElementsClient)
      // An import asks OpenStreetMap nothing: any call here would be a bug.
      .useValue({ query: vi.fn().mockRejectedValue(new Error('no network in a test')) })
      .compile();
    const nest = moduleRef.createNestApplication<NestExpressApplication>();
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
    await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Isar' }]);
    await addTripMember(orm, 5, 2);
    await insertRows(orm, Days, [{ id: 3, trip: 5, day_number: 1, date: '2026-07-10' }]);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockImplementation(
      (action: string, _role: string, _owner: number, userId: number) =>
        !((action === 'place_edit' || action === 'day_edit') && userId === VIEWER),
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

  const upload = (
    path: 'import/gpx' | 'import/gpx/preview',
    xml: string,
    fields: Record<string, string> = {},
    userId = OWNER,
  ) => {
    let req = request(server).post(`/api/trips/5/tours/${path}`).set('Cookie', sessionCookie(userId));
    for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
    return req.attach('file', Buffer.from(xml), { filename: 'ride.gpx', contentType: 'application/gpx+xml' });
  };
  const importRide = async (xml = RIDE_GPX) => {
    const res = await upload('import/gpx', xml, { tour_type: 'horse' });
    expect(res.status).toBe(201);
    return res.body.tours[0].place_id as number;
  };

  it('HORSE-IMPORT-E2E-001: the preview measures the file and stores nothing', async () => {
    const res = await upload('import/gpx/preview', RIDE_GPX);
    expect(res.status).toBe(200);
    expect(res.body.tracks).toHaveLength(1);
    expect(res.body.tracks[0]).toMatchObject({ name: 'Ausritt an der Isar', point_count: 3, duplicate: false });
    expect(res.body.tracks[0].elevation_gain_m).toBeCloseTo(40);
    expect(res.body.tracks[0].elevation_loss_m).toBeCloseTo(30);
    expect(await countRows(orm, Tours)).toBe(0);
    expect(await countRows(orm, Places)).toBe(0);
  });

  it('HORSE-IMPORT-E2E-002: confirmed as a ride, the line stays as recorded with its origin, heights and no riding time', async () => {
    const placeId = await importRide();
    const place = await findRow(orm, Places, { id: placeId });
    expect(JSON.parse(String(place?.route_geometry))).toEqual(RECORDED);
    expect(await findRow(orm, Tours, { place: placeId })).toMatchObject({
      tour_type: 'horse',
      origin: 'gpx',
      origin_file_name: 'ride.gpx',
      duration: null,
      planned_duration_minutes: null,
      max_hiking_difficulty: null,
      bike_profile: null,
      boat_type: null,
    });
    expect(realtime.broadcastMock.mock.calls.map((call) => call[1])).toEqual(
      expect.arrayContaining(['tours:changed', 'place:created']),
    );
  });

  it('HORSE-IMPORT-E2E-003: opens again as a ride, naming the file it came from, with nothing routed', async () => {
    const placeId = await importRide();
    const res = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', sessionCookie(VIEWER));
    expect(res.status).toBe(200);
    expect(res.body.tour).toMatchObject({ tour_type: 'horse', origin: 'gpx', duration: null, caution: false });
    expect(res.body.tour.elevation_gain).toBeCloseTo(40);
    expect(res.body.provenance).toMatchObject({
      origin: 'gpx',
      source: { kind: 'gpx', fileName: 'ride.gpx' },
      plannedOver: false,
    });
    // The two ends of the track stand for its points; no leg was planned or taken from a route.
    expect(res.body.waypoints).toEqual([
      { lat: 47, lng: 11, role: 'start', sequence: 0 },
      { lat: 47.02, lng: 11.03, role: 'end', sequence: 1 },
    ]);
  });

  it('HORSE-IMPORT-E2E-004: a file without heights keeps them unknown and says so, never zero', async () => {
    const res = await upload('import/gpx', FLAT_GPX, { tour_type: 'horse' });
    expect(res.status).toBe(201);
    expect(res.body.caution).toBe(true);
    expect(res.body.tours[0]).toMatchObject({
      tour_type: 'horse',
      elevation_gain: null,
      elevation_loss: null,
      match_confidence: 0.3,
    });
    expect(res.body.tours[0].distance).toBeGreaterThan(0);
  });

  it('HORSE-IMPORT-E2E-005: goes on a day of the trip like any tour', async () => {
    const placeId = await importRide();
    const assigned = await request(server)
      .post('/api/trips/5/days/3/assignments')
      .set('Cookie', sessionCookie(OWNER))
      .send({ place_id: placeId });
    expect(assigned.status).toBe(201);
    const list = await request(server).get('/api/trips/5/tours').set('Cookie', sessionCookie(OWNER));
    expect(list.status).toBe(200);
    expect(list.body.tours.find((tour: { place_id: number }) => tour.place_id === placeId)).toMatchObject({
      tour_type: 'horse',
      planned: true,
    });
  });

  it('HORSE-IMPORT-E2E-006: a failed import leaves the rides there are as they were', async () => {
    const placeId = await importRide();
    const before = await findRow(orm, Tours, { place: placeId });
    const placeBefore = await findRow(orm, Places, { id: placeId });

    const refusals = [
      // No track in the file.
      await upload('import/gpx', '<gpx><wpt lat="47" lon="11"/></gpx>', { tour_type: 'horse' }),
      // A field of another type on a ride.
      await upload('import/gpx', FLAT_GPX, { tour_type: 'horse', bike_profile: 'road' }),
      // A member who may only read.
      await upload('import/gpx', FLAT_GPX, { tour_type: 'horse' }, VIEWER),
    ];
    expect(refusals.map((res) => res.status)).toEqual([400, 400, 403]);

    expect(await countRows(orm, Tours)).toBe(1);
    expect(await countRows(orm, Places)).toBe(1);
    expect(await findRow(orm, Tours, { place: placeId })).toEqual(before);
    expect(await findRow(orm, Places, { id: placeId })).toEqual(placeBefore);
  });

  it('HORSE-IMPORT-E2E-007: the same recorded ride again is skipped, not stored twice', async () => {
    await importRide();
    const again = await upload('import/gpx', RIDE_GPX, { tour_type: 'horse' });
    expect(again.status).toBe(201);
    expect(again.body).toEqual({ tours: [], caution: false, skipped: 1 });
    expect(await countRows(orm, Tours)).toBe(1);
  });
});
