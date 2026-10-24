/**
 * ACT-01 e2e: a recorded track assigned to a tour, through the real
 * JwtAuthGuard, AddonGuard and TripAccessGuard against a real migrated temp
 * SQLite db. The recording comes in through the existing GPX import, is
 * assigned on purpose to one execution of a planned tour, read with the
 * tour's detail and taken off again; the plan stays as it was all along.
 *
 * Fixtures: user 1 owns trip 5 (two days), user 2 is a member whom the
 * permission spy denies 'place_edit', user 3 has no access.
 */
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourActivities } from '../../src/db/entities/TourActivities.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeDayAssignment } from '../helpers/factories/itinerary';
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
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const db = createSnapshotTestDb();
const journeyHooks = {
  reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
  onPlaceCreated: vi.fn().mockResolvedValue(undefined),
  onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
  onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
};

const realtime = new FakeRealtimeService();
const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;
const TRIP = 5;

const PLAN = [
  [47, 11, 600],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];
const tourBody = {
  name: 'Ridge walk',
  route_geometry: PLAN,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 3,
  duration_seconds: 3600,
};

const WATCH_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Watch export</name><trkseg>
  <trkpt lat="47" lon="11"><ele>600</ele><time>2026-07-02T06:10:00Z</time></trkpt>
  <trkpt lat="47.012" lon="11.008"><ele>720</ele><time>2026-07-02T07:40:00Z</time></trkpt>
  <trkpt lat="47.02" lon="11.02"><ele>660</ele><time>2026-07-02T09:25:00Z</time></trkpt>
</trkseg></trk></gpx>`;
const PHONE_GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="e2e"><trk><name>Phone export</name><trkseg>
  <trkpt lat="47.5" lon="11.5"/><trkpt lat="47.51" lon="11.51"/>
</trkseg></trk></gpx>`;

describe('Tour activities e2e (ACT-01)', () => {
  let orm: TestOrm;
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let checkPermission: MockInstance;
  let assignmentIds: number[];

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
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

  const createTour = async () => {
    const res = await request(server).post(`/api/trips/${TRIP}/tours`).set(as(OWNER)).send(tourBody);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

  /** A recording through the one GPX import there is. */
  const importTrack = async (xml: string, name: string) => {
    const res = await request(server)
      .post(`/api/trips/${TRIP}/tours/import/gpx`)
      .set(as(OWNER))
      .attach('file', Buffer.from(xml), { filename: name, contentType: 'application/gpx+xml' });
    expect(res.status).toBe(201);
    return res.body.tours[0] as { place_id: number; track_started_at: string | null };
  };

  const assign = (placeId: number, body: object, userId = OWNER) =>
    request(server).put(`/api/trips/${TRIP}/tours/${placeId}/activities`).set(as(userId)).send(body);
  const unassign = (placeId: number, activityId: number, userId = OWNER) =>
    request(server).delete(`/api/trips/${TRIP}/tours/${placeId}/activities/${activityId}`).set(as(userId));

  /** The tour on both days of the trip; answers its two day assignments. */
  const onBothDays = async (placeId: number) => [
    (await makeDayAssignment(orm, 3, placeId)).id,
    (await makeDayAssignment(orm, 4, placeId)).id,
  ];

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 3, username: 'outsider', email: 'out@example.test', role: 'user', password_version: 0 });
    await insertRows(orm, Trips, [{ id: TRIP, user: 1, title: 'Alps' }]);
    await addTripMember(orm, TRIP, 2);
    await insertRows(orm, Days, [
      { id: 3, trip: TRIP, day_number: 1 },
      { id: 4, trip: TRIP, day_number: 2 },
    ]);
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
    await deleteRows(orm, Places);
    assignmentIds = [];
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('ACT-E2E-001: a GPX recording assigned to a day of a planned tour shows its own values; the plan stays', async () => {
    const tour = await createTour();
    assignmentIds = await onBothDays(tour);
    const watch = await importTrack(WATCH_GPX, 'watch.gpx');
    expect(watch.track_started_at).toBe('2026-07-02T06:10:00Z');
    const before = (await request(server).get(`/api/trips/${TRIP}/tours/${tour}`).set(as(OWNER))).body;

    const res = await assign(tour, { track_place_id: watch.place_id, assignment_id: assignmentIds[1] });
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0]).toMatchObject({
      assignment_id: assignmentIds[1],
      day_id: 4,
      track: { place_id: watch.place_id, name: 'Watch export', origin: 'gpx', file_name: 'watch.gpx' },
      metrics: {
        elevation_gain_m: 120,
        elevation_loss_m: 60,
        started_at: '2026-07-02T06:10:00Z',
        ended_at: '2026-07-02T09:25:00Z',
        elapsed_minutes: 195,
        point_count: 3,
      },
    });
    expect(res.body.activities[0].geometry).toHaveLength(3);
    // The planned values, line and revision are what they were.
    for (const key of ['distance', 'elevation_gain', 'elevation_loss', 'duration', 'revision']) {
      expect(res.body.tour[key]).toEqual(before.tour[key]);
    }
    expect(await findRow(orm, Places, { id: tour })).toMatchObject({ route_geometry: JSON.stringify(PLAN) });
    expect(realtime.broadcastMock).toHaveBeenCalledWith(
      String(TRIP),
      'tours:changed',
      { placeIds: [tour, watch.place_id] },
      undefined,
    );

    const listed = (await request(server).get(`/api/trips/${TRIP}/tours`).set(as(OWNER))).body.tours;
    expect(listed.find((item: { place_id: number }) => item.place_id === tour).activity_tracks).toEqual([
      { id: res.body.activities[0].id, track_place_id: watch.place_id, assignment_id: assignmentIds[1] },
    ]);
    expect(listed.find((item: { place_id: number }) => item.place_id === watch.place_id).activity_of).toBe(tour);
  });

  it('ACT-E2E-002: a track without times measures no time, and taking it off leaves it in the trip', async () => {
    const tour = await createTour();
    const phone = await importTrack(PHONE_GPX, 'phone.gpx');
    const res = await assign(tour, { track_place_id: phone.place_id, assignment_id: null });
    expect(res.status).toBe(200);
    expect(res.body.activities[0].metrics).toMatchObject({
      elevation_gain_m: null,
      started_at: null,
      ended_at: null,
      elapsed_minutes: null,
    });

    const removed = await unassign(tour, res.body.activities[0].id);
    expect(removed.status).toBe(200);
    expect(removed.body.activities).toEqual([]);
    expect(await countRows(orm, TourActivities)).toBe(0);
    expect(await findRow(orm, Places, { id: phone.place_id })).not.toBeNull();
    expect((await unassign(tour, res.body.activities[0].id)).status).toBe(404);
  });

  it('ACT-E2E-003: a refused assignment names why and changes nothing', async () => {
    const tour = await createTour();
    const other = await createTour();
    const watch = await importTrack(WATCH_GPX, 'watch.gpx');
    const otherAssignment = (await makeDayAssignment(orm, 3, other)).id;

    const planned = await assign(tour, { track_place_id: other, assignment_id: null });
    expect(planned.status).toBe(400);
    expect(planned.body).toEqual({
      error: 'Only an import that was not planned over can be assigned',
      code: 'activity_track_not_recorded',
    });
    const foreignDay = await assign(tour, { track_place_id: watch.place_id, assignment_id: otherAssignment });
    expect(foreignDay.status).toBe(400);
    expect(foreignDay.body.code).toBe('activity_assignment_not_of_tour');
    expect((await assign(tour, { track_place_id: watch.place_id })).status).toBe(400);
    expect((await assign(tour, { track_place_id: 999_999, assignment_id: null })).status).toBe(404);

    expect((await assign(tour, { track_place_id: watch.place_id, assignment_id: null })).status).toBe(200);
    const taken = await assign(other, { track_place_id: watch.place_id, assignment_id: null });
    expect(taken.status).toBe(409);
    expect(taken.body.code).toBe('activity_track_in_use');
    expect(await countRows(orm, TourActivities)).toBe(1);
  });

  it('ACT-E2E-004: the gates: 401 without a session, 404 without access or the addon, 403 without place_edit', async () => {
    const tour = await createTour();
    const watch = await importTrack(WATCH_GPX, 'watch.gpx');
    const body = { track_place_id: watch.place_id, assignment_id: null };

    expect((await request(server).put(`/api/trips/${TRIP}/tours/${tour}/activities`).send(body)).status).toBe(401);
    expect((await assign(tour, body, OUTSIDER)).status).toBe(404);
    expect((await unassign(tour, 1, OUTSIDER)).status).toBe(404);
    expect((await assign(tour, body, VIEWER)).status).toBe(403);
    expect((await unassign(tour, 1, VIEWER)).status).toBe(403);
    await setAddonEnabled(orm, 'tours', false);
    const off = await assign(tour, body);
    expect(off.status).toBe(404);
    expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
    expect(await countRows(orm, TourActivities)).toBe(0);
  });
});
