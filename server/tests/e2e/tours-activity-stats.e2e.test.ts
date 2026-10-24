/**
 * STA-02 e2e: the user's own tour activities for the Atlas, through the real
 * JwtAuthGuard and AddonGuard against a real migrated temp SQLite db. Tours
 * are created through the tours API and put on dated days; whose they are
 * follows the day's participants as the planner reads them: a day naming
 * nobody is everyone's in the trip, a day naming people is only theirs.
 *
 * Fixtures: user 1 owns trip 5 (two dated days, one without a date), user 2 is
 * a member, user 3 has no access.
 */
import { AssignmentParticipants } from '../../src/db/entities/AssignmentParticipants.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourActivityExclusions } from '../../src/db/entities/TourActivityExclusions.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeDayAssignment } from '../helpers/factories/itinerary';
import { countRows, deleteRows, insertRow, insertRows } from '../helpers/factories/rows';
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
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
const MEMBER = 2;
const OUTSIDER = 3;
const TRIP = 5;
const STATS = '/api/tours/activity-stats';

const tourBody = (name: string) => ({
  name,
  route_geometry: [
    [47, 11, 600],
    [47.01, 11.01, 700],
  ],
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.01, lng: 11.01, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 3,
  duration_seconds: 3600,
});

describe('Tour activity stats e2e (STA-02)', () => {
  let orm: TestOrm;
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
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

  /** A tour of trip 5 through the API, put on the given day. */
  const tourOnDay = async (name: string, dayId: number | null) => {
    const res = await request(server).post(`/api/trips/${TRIP}/tours`).set(as(OWNER)).send(tourBody(name));
    expect(res.status).toBe(201);
    const placeId = res.body.tour.place_id as number;
    const assignmentId = dayId === null ? null : (await makeDayAssignment(orm, dayId, placeId)).id;
    return { placeId, assignmentId };
  };

  const exclude = (body: object, userId = OWNER) =>
    request(server).put(`${STATS}/exclusions`).set(as(userId)).send(body);

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'member', email: 'member@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 3, username: 'outsider', email: 'out@example.test', role: 'user', password_version: 0 });
    await insertRows(orm, Trips, [{ id: TRIP, user: 1, title: 'Alps' }]);
    await addTripMember(orm, TRIP, 2);
    await insertRows(orm, Days, [
      { id: 3, trip: TRIP, day_number: 1, date: '2026-07-02' },
      { id: 4, trip: TRIP, day_number: 2, date: '2026-07-03' },
      { id: 6, trip: TRIP, day_number: 3 },
    ]);
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await setAddonEnabled(orm, 'tours', true);
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('STA2-E2E-001: the owner gets the planned tours of dated days, on the plan, and what cannot count', async () => {
    const ridge = await tourOnDay('Ridge', 3);
    await tourOnDay('Undated', 6);
    await tourOnDay('Idle', null);

    const res = await request(server).get(STATS).set(as(OWNER));
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([
      expect.objectContaining({
        place_id: ridge.placeId,
        name: 'Ridge',
        tour_type: 'hike',
        trip: { id: TRIP, title: 'Alps' },
        date: '2026-07-02',
        basis: 'plan',
        track: null,
        day_count: 1,
        excluded: false,
      }),
    ]);
    expect(res.body.uncounted).toEqual({ unassigned: 1, undated: 1 });
    // The days name nobody, so they are the member's as much as the owner's.
    const member = await request(server).get(STATS).set(as(MEMBER));
    expect(member.body).toEqual(res.body);
  });

  it('STA2-E2E-002: a day naming people counts only for them, one naming nobody for all; no outsider', async () => {
    const ridge = await tourOnDay('Ridge', 3);
    const lake = await tourOnDay('Lake', 4);
    await insertRow(orm, AssignmentParticipants, { assignment: lake.assignmentId, user: MEMBER });

    const member = await request(server).get(STATS).set(as(MEMBER));
    expect(member.body.entries.map((entry: { place_id: number }) => entry.place_id)).toEqual([
      lake.placeId,
      ridge.placeId,
    ]);
    expect(member.body.uncounted).toEqual({ unassigned: 0, undated: 0 });
    // The owner is not on Lake's day any more, only on Ridge's.
    const owner = await request(server).get(STATS).set(as(OWNER));
    expect(owner.body.entries.map((entry: { place_id: number }) => entry.place_id)).toEqual([ridge.placeId]);
    const outsider = await request(server).get(STATS).set(as(OUTSIDER));
    expect(outsider.body).toEqual({ entries: [], uncounted: { unassigned: 0, undated: 0 } });
  });

  it('STA2-E2E-003: leaving a tour out flags it for the user alone and counts it again on request', async () => {
    const ridge = await tourOnDay('Ridge', 3);
    await insertRow(orm, AssignmentParticipants, { assignment: ridge.assignmentId, user: MEMBER });
    await insertRow(orm, AssignmentParticipants, { assignment: ridge.assignmentId, user: OWNER });

    const left = await exclude({ place_id: ridge.placeId, excluded: true });
    expect(left.status).toBe(200);
    expect(left.body.entries[0]).toMatchObject({ place_id: ridge.placeId, excluded: true });
    const member = await request(server).get(STATS).set(as(MEMBER));
    expect(member.body.entries[0]).toMatchObject({ place_id: ridge.placeId, excluded: false });

    const back = await exclude({ place_id: ridge.placeId, excluded: false });
    expect(back.body.entries[0]).toMatchObject({ excluded: false });
    expect(await countRows(orm, TourActivityExclusions)).toBe(0);
  });

  it('STA2-E2E-004: the gates: 401 without a session, 404 without access or the addon, 400 on a bad body', async () => {
    const ridge = await tourOnDay('Ridge', 3);
    expect((await request(server).get(STATS)).status).toBe(401);
    const body = { place_id: ridge.placeId, excluded: true };
    const anonymous = await request(server).put(`${STATS}/exclusions`).send(body);
    expect(anonymous.status).toBe(401);
    const foreign = await exclude({ place_id: ridge.placeId, excluded: true }, OUTSIDER);
    expect(foreign.status).toBe(404);
    expect((await exclude({ place_id: ridge.placeId })).status).toBe(400);
    expect((await exclude({ place_id: ridge.placeId, excluded: true, note: 'rain' })).status).toBe(400);
    expect(await countRows(orm, TourActivityExclusions)).toBe(0);

    await setAddonEnabled(orm, 'tours', false);
    const off = await request(server).get(STATS).set(as(OWNER));
    expect(off.status).toBe(404);
    expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
  });

  it('STA2-E2E-005: a tour on two days counts once, dated on the last of them', async () => {
    const ridge = await tourOnDay('Ridge', 3);
    await makeDayAssignment(orm, 4, ridge.placeId);
    const res = await request(server).get(STATS).set(as(OWNER));
    expect(res.body.entries).toEqual([
      expect.objectContaining({ place_id: ridge.placeId, date: '2026-07-03', day_count: 2 }),
    ]);
  });
});
