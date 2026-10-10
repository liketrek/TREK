/**
 * Day reorder + insert integration tests (#589) — exercises the real
 * DaysService against the real schema. Covers: position renumber, dates pinned
 * to slots while content rides along by id, booking-date re-stamp, permutation
 * validation, the accommodation-inversion guard, and insert (dated + dateless).
 */
import { db as testDb } from '../../src/db/database';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { DaysService, DayReorderError } from '../../src/nest/days/days.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { QueryHelpersService } from '../../src/nest/query-helpers/query-helpers.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import {
  createUser,
  createTrip,
  createPlace,
  createDay,
  createDayAssignment,
  createReservation,
  createDayAccommodation,
} from '../helpers/factories';
import { findRow, findRows, updateRows } from '../helpers/factories/rows';
import { readTripDays } from '../helpers/factories/trips';
import { resetTestDb } from '../helpers/test-db';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestDaysRepo,
  createTestDayAssignmentsRepo,
  createTestDayNotesRepo,
  createTestTripsRepo,
  createTestTagsRepo,
  createTestPlaceRatingsRepo,
  createTestAssignmentParticipantsRepo,
  createTestReservationsRepo,
  createTestReservationEndpointsRepo,
  createTestDayAccommodationsRepo,
  createTestRoadtripViasRepo,
  createTestRoadtripDayBoundariesRepo,
  sharedTestOrm,
} from '../helpers/test-uow';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let svc: DaysService;
beforeAll(async () => {
  svc = new DaysService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
    new QueryHelpersService(
      await createTestTagsRepo(testDb),
      await createTestPlaceRatingsRepo(testDb),
      await createTestAssignmentParticipantsRepo(testDb),
    ),
    await createTestUnitOfWork(testDb),
    await createTestDaysRepo(testDb),
    await createTestDayAssignmentsRepo(testDb),
    await createTestDayNotesRepo(testDb),
    await createTestTripsRepo(testDb),
    await createTestReservationsRepo(testDb),
    await createTestReservationEndpointsRepo(testDb),
    await createTestDayAccommodationsRepo(testDb),
    await createTestRoadtripViasRepo(testDb),
    await createTestRoadtripDayBoundariesRepo(testDb),
  );
});
const reorderDays = async (tripId: number, orderedIds: number[]) => await svc.reorder(tripId, orderedIds);
const insertDay = async (tripId: number, position?: number) => await svc.insert(tripId, position);

let userId: number;

beforeEach(() => {
  resetTestDb(testDb);
  userId = createUser(testDb).user.id;
});

afterAll(() => testDb.close());

const orderedDays = async (tripId: number) => readTripDays(await sharedTestOrm(testDb), tripId);

describe('reorderDays', () => {
  it('permutes positions, pins dates to slots, and content rides along by id', async () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = await orderedDays(trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, d2.id, place.id); // place sits on day 2

    // Move day 2 to the front: [d2, d1, d3]
    await reorderDays(trip.id, [d2.id, d1.id, d3.id]);

    const after = await orderedDays(trip.id);
    expect(after.map((d) => d.id)).toEqual([d2.id, d1.id, d3.id]);
    // Dates stay pinned to their calendar slots
    expect(after.map((d) => d.date)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
    // The place rides along with its day row (still attached to d2.id, now at slot 1)
    const onD2 = await findRows(await sharedTestOrm(testDb), DayAssignments, { day: d2.id });
    expect(onD2).toHaveLength(1);
  });

  it("re-stamps a booking's date onto its day's new date, keeping the time", async () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = await orderedDays(trip.id);
    const res = createReservation(testDb, trip.id, { day_id: d2.id, type: 'restaurant' });
    await updateRows(
      await sharedTestOrm(testDb),
      Reservations,
      { id: res.id },
      { reservation_time: '2026-03-02T19:00' },
    );

    await reorderDays(trip.id, [d2.id, d1.id, d3.id]); // d2 moves to the 2026-03-01 slot

    const r = await findRow(await sharedTestOrm(testDb), Reservations, { id: res.id });
    expect(r?.reservation_time).toBe('2026-03-01T19:00');
  });

  it('rejects an orderedIds list that is not a permutation of the trip days', async () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2] = await orderedDays(trip.id);
    await expect(reorderDays(trip.id, [d1.id, d2.id])).rejects.toThrow(DayReorderError);
  });

  it('blocks a move that would make an accommodation end before it starts, and rolls back', async () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = await orderedDays(trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id); // stay spans day 1 -> day 2

    // Put the start day (d1) after the end day (d2): [d2, d3, d1]
    await expect(reorderDays(trip.id, [d2.id, d3.id, d1.id])).rejects.toThrow(DayReorderError);

    // Transaction rolled back: original order intact
    expect((await orderedDays(trip.id)).map((d) => d.id)).toEqual([d1.id, d2.id, d3.id]);
  });
});

describe('insertDay', () => {
  it('inserts an empty day at a position on a dateless trip and shifts the rest', async () => {
    const trip = createTrip(testDb, userId);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const d3 = createDay(testDb, trip.id);

    const created = await insertDay(trip.id, 1);

    const after = await orderedDays(trip.id);
    expect(after).toHaveLength(4);
    expect(after[0].id).toBe(created.id);
    expect(after[0].date).toBeNull();
    expect(after.slice(1).map((d) => d.id)).toEqual([d1.id, d2.id, d3.id]);
  });

  it('inserts at the front of a dated trip: dates stay contiguous and the trip extends', async () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = await orderedDays(trip.id);

    const created = await insertDay(trip.id, 1);

    const after = await orderedDays(trip.id);
    expect(after).toHaveLength(4);
    expect(after[0].id).toBe(created.id);
    expect(after.map((d) => d.date)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04']);
    // Old content shifted down a slot
    expect(after.slice(1).map((d) => d.id)).toEqual([d1.id, d2.id, d3.id]);
    // Trip range extended by one day
    const stored = await findRow(await sharedTestOrm(testDb), Trips, { id: trip.id });
    expect(stored?.end_date).toBe('2026-03-04');
  });
});
