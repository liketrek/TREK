/**
 * DayRemovalService: deleting one day, the way the reorder dialog, the MCP tool
 * and the plugin RPC all do it. DAY-DEL-001 to DAY-DEL-019.
 *
 * Real in-memory SQLite (a copy of the migrated snapshot) with the real
 * accommodations and assignments services over the ORM test harness, so the
 * foreign key cascades and the stay cancellation are the ones production runs.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  // Trip access reads through TripsRepository now; the module only hands out the handle.
  return { db, closeDb: () => {}, reinitialize: () => {} };
});
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createDayAccommodation } from '../../helpers/factories';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { DaysService } from '../../../src/nest/days/days.service';
import { DayRemovalService, DayDeleteError, LAST_DAY_MESSAGE, type DayRemoval } from '../../../src/nest/days/day-removal.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { AssignmentsService } from '../../../src/nest/assignments/assignments.service';
import { AccommodationsService, type MirrorSender } from '../../../src/nest/accommodations/accommodations.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import {
  createTestUnitOfWork, createTestAppSettingsRepo, createTestTagsRepo, createTestPlaceRatingsRepo,
  createTestAssignmentParticipantsRepo, createTestDayAssignmentsRepo, createTestDaysRepo, createTestPlacesRepo,
  createTestTripMembersRepo, createTestRoadtripViasRepo, createTestDayAccommodationsRepo, createTestReservationsRepo,
  createTestReservationEndpointsRepo, createTestDayNotesRepo, createTestRoadtripDayBoundariesRepo,
  sharedTestOrm, createTestTripsRepo,
} from '../../helpers/test-uow';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { createTestToursRepo } from '../../helpers/tours-repos';
import type { EntityClass, FilterQuery } from '@mikro-orm/core';
import { countRows, deleteRows, findRow, findRows, insertRow } from '../../helpers/factories/rows';
import { makeReservation } from '../../helpers/factories/reservations';
import { makeBudgetItem } from '../../helpers/factories/budget';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { ReservationEndpoints } from '../../../src/db/entities/ReservationEndpoints.entity';
import { RoadtripDayBoundaries } from '../../../src/db/entities/RoadtripDayBoundaries.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { legacyBoundIntegerText } from '../../../src/nest/common/row-id';
import { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';

let days: DaysService;
let journey: JourneyDomainService;
let assignments: AssignmentsService;
let accommodations: AccommodationsService;
let removal: DayRemovalService;

/** A DayRemovalService over the test connection, with the accommodations service given. */
async function removalWith(acc: AccommodationsService): Promise<DayRemovalService> {
  return new DayRemovalService(
    days, acc, assignments, await createTestUnitOfWork(testDb),
    await createTestDaysRepo(testDb), await createTestDayAccommodationsRepo(testDb),
    await createTestRoadtripDayBoundariesRepo(testDb), await createTestTripsRepo(testDb),
  );
}

beforeAll(async () => {
  const permissions = new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb));
  const realtime = new RealtimeService();
  const queryHelpers = new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb));
  const t = await sharedTestOrm(testDb);
  days = new DaysService(
    permissions, realtime, queryHelpers, await createTestUnitOfWork(testDb),
    await createTestDaysRepo(testDb), await createTestDayAssignmentsRepo(testDb), await createTestDayNotesRepo(testDb),
    await createTestTripsRepo(testDb), await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb),
    await createTestDayAccommodationsRepo(testDb), await createTestRoadtripViasRepo(testDb), await createTestRoadtripDayBoundariesRepo(testDb),
  );
  journey = new JourneyDomainService(
    realtime, new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)), await createTestUnitOfWork(testDb),
    await createTestJourneysRepo(testDb), await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
    await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
  );
  assignments = new AssignmentsService(
    new TripAccessService(await createTestTripsRepo(testDb)), permissions, realtime, queryHelpers, journey,
    await createTestUnitOfWork(testDb),
    await createTestDayAssignmentsRepo(testDb),
    await createTestAssignmentParticipantsRepo(testDb),
    await createTestDaysRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestTripMembersRepo(testDb),
    await createTestRoadtripViasRepo(testDb),
    await createTestToursRepo(testDb),
  );
  accommodations = new AccommodationsService(
    permissions, realtime, assignments, await createTestUnitOfWork(testDb),
    new TripAccessService(await createTestTripsRepo(testDb)),
    await createTestDayAccommodationsRepo(testDb),
    await createTestDayAssignmentsRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestDaysRepo(testDb),
    await createTestRoadtripViasRepo(testDb),
    await createTestReservationsRepo(testDb),
    await createTestBudgetItemsRepo(testDb),
  );
  removal = await removalWith(accommodations);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  testDb.close();
});

type Row = { id: number; day_number: number; date: string | null };

const orm = () => sharedTestOrm(testDb);

const dayRows = async (tripId: number): Promise<Row[]> =>
  (await findRows(await orm(), Days, { trip: tripId }, { day_number: 'asc' })).map((d) => ({
    id: d.id,
    day_number: d.day_number,
    date: d.date ?? null,
  }));

const range = async (tripId: number) => {
  const trip = await findRow(await orm(), Trips, { id: tripId });
  if (!trip) throw new Error(`no trip ${tripId}`);
  return { start_date: trip.start_date ?? null, end_date: trip.end_date ?? null };
};

/** The booking's day links and times, or undefined once it is gone. */
const reservationRow = async (id: number) => {
  const r = await findRow(await orm(), Reservations, { id });
  if (!r) return undefined;
  return { day_id: r.day_id ?? null, end_day_id: r.end_day_id ?? null, reservation_time: r.reservation_time ?? null, reservation_end_time: r.reservation_end_time ?? null };
};

async function booking(tripId: number, dayId: number | null, time: string | null, extra: { endDayId?: number; endTime?: string } = {}): Promise<number> {
  return (await makeReservation(await orm(), tripId, {
    day: dayId,
    endDay: extra.endDayId ?? null,
    title: 'Booking',
    type: 'restaurant',
    reservation_time: time,
    reservation_end_time: extra.endTime ?? null,
  })).id;
}

/** A dated trip whose days the factory generated, one per date. */
async function datedTrip(start: string, end: string) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id, { start_date: start, end_date: end });
  return { user, trip, rows: await (await dayRows(trip.id)) };
}

/** A booked night: the stay, its hotel booking, the stop on its check-in day and an expense. */
async function bookedNight(tripId: number, startDayId: number, endDayId: number) {
  const place = createPlace(testDb, tripId, { name: 'Harbour Hotel' });
  const { accommodation } = await accommodations.createAccommodation(tripId, { place_id: place.id, start_day_id: startDayId, end_day_id: endDayId });
  const stayId = (accommodation as { id: number }).id;
  const hotelBooking = await findRow(await orm(), Reservations, { accommodation_id: legacyBoundIntegerText(stayId) });
  if (!hotelBooking) throw new Error('createAccommodation should have booked the stay');
  const reservationId = hotelBooking.id;
  const budgetId = (await makeBudgetItem(await orm(), tripId, {
    name: 'Harbour Hotel',
    category: 'Accommodation',
    total_price: 240,
    reservation: reservationId,
  })).id;
  const stopRow = await findRow(await orm(), DayAssignments, { accommodation_id: stayId });
  if (!stopRow) throw new Error('createAccommodation should have put a stop on the check-in day');
  const stop = { id: stopRow.id, day_id: stopRow.day_id };
  return { place, stayId, reservationId, budgetId, stop };
}

async function boundary(tripId: number, dayNumber: number, fromAssignmentId: number): Promise<void> {
  await insertRow(await orm(), RoadtripDayBoundaries, {
    trip: tripId,
    day_number: dayNumber,
    fromAssignment: fromAssignmentId,
    toAssignment: null,
    fraction: 1,
  });
}

/** The trip's road trip boundaries in day order, as the service hands them back. */
async function storedBoundaries(tripId: number) {
  return (await findRows(await orm(), RoadtripDayBoundaries, { trip: tripId }, { day_number: 'asc' })).map((b) => ({
    day_number: b.day_number,
    from_assignment_id: b.from_assignment_id,
    to_assignment_id: b.to_assignment_id ?? null,
    fraction: b.fraction,
  }));
}

/** Whether a row with the id is still stored. */
async function exists<T extends { id: number }>(entity: EntityClass<T>, id: number): Promise<boolean> {
  return (await countRows(await orm(), entity, { id } as FilterQuery<T>)) > 0;
}

describe('DayRemovalService.remove', () => {
  it('DAY-DEL-001 an undated day only closes the gap in the numbering', async () => {
    const { user } = createUser(testDb);
    const dateless = createTrip(testDb, user.id);
    const [a, b, c] = [createDay(testDb, dateless.id), createDay(testDb, dateless.id), createDay(testDb, dateless.id)];

    const result = await removal.remove(dateless.id, b.id, { userId: user.id });

    expect(await dayRows(dateless.id)).toEqual([
      { id: a.id, day_number: 1, date: null },
      { id: c.id, day_number: 2, date: null },
    ]);
    expect(result).toMatchObject({ dayId: b.id, orderedIds: [a.id, c.id], endDate: null, boundaries: null, stayIds: [] });

    // The extra day of a dated trip, the case the dialog was asked for: no date moves.
    const dated = await datedTrip('2026-03-01', '2026-03-02');
    const spare = createDay(testDb, dated.trip.id);
    const dinner = await booking(dated.trip.id, dated.rows[1].id, '2026-03-02T19:00');
    await removal.remove(dated.trip.id, spare.id, { userId: dated.user.id });
    expect(await dayRows(dated.trip.id)).toEqual(dated.rows);
    expect(await range(dated.trip.id)).toEqual({ start_date: '2026-03-01', end_date: '2026-03-02' });
    expect((await reservationRow(dinner))?.reservation_time).toBe('2026-03-02T19:00');
  });

  it('DAY-DEL-002 a dated day with a spare day after it: the dates stay on their slots and the bookings move along', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2, d3] = rows;
    const spare = createDay(testDb, trip.id);
    const flight = await booking(trip.id, d3.id, '2026-01-03T10:00', { endDayId: d3.id, endTime: '2026-01-03T12:00' });
    const leg = await insertRow(await orm(), ReservationEndpoints, {
      reservation: flight,
      role: 'from',
      sequence: 0,
      name: 'HEL',
      lat: 60.31,
      lng: 24.96,
      local_date: '2026-01-03',
    });

    const result = await removal.remove(trip.id, d2.id, { userId: user.id });

    expect(await dayRows(trip.id)).toEqual([
      { id: d1.id, day_number: 1, date: '2026-01-01' },
      { id: d3.id, day_number: 2, date: '2026-01-02' },
      { id: spare.id, day_number: 3, date: '2026-01-03' },
    ]);
    expect(await reservationRow(flight)).toMatchObject({ reservation_time: '2026-01-02T10:00', reservation_end_time: '2026-01-02T12:00' });
    expect((await findRow(await orm(), ReservationEndpoints, { id: leg }))?.local_date).toBe('2026-01-02');
    // The spare day took the last date, so the trip keeps its range.
    expect(await range(trip.id)).toEqual({ start_date: '2026-01-01', end_date: '2026-01-03' });
    expect(result.endDate).toBeNull();
  });

  it('DAY-DEL-003 a dated day with no spare day left: the last date goes and the trip ends a day earlier', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2, d3] = rows;

    const result = await removal.remove(trip.id, d1.id, { userId: user.id });

    expect(await dayRows(trip.id)).toEqual([
      { id: d2.id, day_number: 1, date: '2026-01-01' },
      { id: d3.id, day_number: 2, date: '2026-01-02' },
    ]);
    expect(await range(trip.id)).toEqual({ start_date: '2026-01-01', end_date: '2026-01-02' });
    expect(result.endDate).toBe('2026-01-02');
    // The trip in list shape for the trip header, without its feed credential.
    expect(result.trip).toMatchObject({ id: trip.id, end_date: '2026-01-02', day_count: 2, is_owner: 1, feed_token: null });
  });

  it('DAY-DEL-004 the last day of a trip stays, and nothing is written', async () => {
    const { user, trip, rows } = await datedTrip('2026-05-01', '2026-05-01');
    const night = await bookedNight(trip.id, rows[0].id, rows[0].id);

    await expect(removal.remove(trip.id, rows[0].id, { userId: user.id })).rejects.toThrow(new DayDeleteError(LAST_DAY_MESSAGE));
    expect(await dayRows(trip.id)).toEqual(rows);
    expect(await exists(DayAccommodations, night.stayId)).toBe(true);
    expect(await reservationRow(night.reservationId)).toBeDefined();
  });

  it('DAY-DEL-005 a stay checking in on the day is cancelled with its booking and that booking\'s expense', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const night = await bookedNight(trip.id, rows[1].id, rows[2].id);
    expect(night.stop.day_id).toBe(rows[1].id);

    const result = await removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect(await exists(DayAccommodations, night.stayId)).toBe(false);
    expect(await reservationRow(night.reservationId)).toBeUndefined();
    expect(await exists(BudgetItems, night.budgetId)).toBe(false);
    // The hotel itself is a place and stays on the list.
    expect(await exists(Places, night.place.id)).toBe(true);
    expect(result).toMatchObject({ stayIds: [night.stayId], reservationIds: [night.reservationId], budgetItemIds: [night.budgetId] });
    // Its stop sat on the deleted day, which day:deleted already covers.
    expect(result.mirrors[0].removed).toEqual([]);
  });

  it('DAY-DEL-006 a stay checking out on the day is cancelled too, and its stop on the check-in day goes with it', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const night = await bookedNight(trip.id, rows[0].id, rows[1].id);

    const result = await removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect(await exists(DayAccommodations, night.stayId)).toBe(false);
    expect(await reservationRow(night.reservationId)).toBeUndefined();
    expect(await exists(DayAssignments, night.stop.id)).toBe(false);
    expect(result.mirrors[0].removed).toEqual([{ id: night.stop.id, dayId: rows[0].id }]);
  });

  it('DAY-DEL-007 a stay that only runs across the day keeps standing', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const night = await bookedNight(trip.id, rows[0].id, rows[2].id);

    const result = await removal.remove(trip.id, rows[1].id, { userId: user.id });

    const stay = await findRow(await orm(), DayAccommodations, { id: night.stayId });
    expect({ start_day_id: stay?.start_day_id, end_day_id: stay?.end_day_id })
      .toEqual({ start_day_id: rows[0].id, end_day_id: rows[2].id });
    expect(await reservationRow(night.reservationId)).toBeDefined();
    expect(result.stayIds).toEqual([]);
  });

  it('DAY-DEL-008 bookings on the day are let go of, with their dates untouched', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2] = rows;
    const dinner = await booking(trip.id, d2.id, '2026-01-02T19:00');
    const car = await booking(trip.id, d1.id, '2026-01-01T09:00', { endDayId: d2.id, endTime: '2026-01-02T10:00' });

    await removal.remove(trip.id, d2.id, { userId: user.id });

    expect(await reservationRow(dinner)).toEqual({ day_id: null, end_day_id: null, reservation_time: '2026-01-02T19:00', reservation_end_time: null });
    expect(await reservationRow(car)).toEqual({ day_id: d1.id, end_day_id: null, reservation_time: '2026-01-01T09:00', reservation_end_time: '2026-01-02T10:00' });
  });

  it('DAY-DEL-009 the road trip boundaries after the day move up with their days', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-04');
    const place = createPlace(testDb, trip.id);
    const stops = rows.map(r => createDayAssignment(testDb, r.id, place.id));
    for (const [i] of rows.entries()) await boundary(trip.id, i + 1, stops[i].id);

    const result = await removal.remove(trip.id, rows[1].id, { userId: user.id });

    const expected = [
      { day_number: 1, from_assignment_id: stops[0].id, to_assignment_id: null, fraction: 1 },
      { day_number: 2, from_assignment_id: stops[2].id, to_assignment_id: null, fraction: 1 },
      { day_number: 3, from_assignment_id: stops[3].id, to_assignment_id: null, fraction: 1 },
    ];
    expect(await storedBoundaries(trip.id)).toEqual(expected);
    expect(result.boundaries).toEqual(expected);
  });

  it('DAY-DEL-010 deleting the day an insert slotted in gives back the trip as it was', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const train = await booking(trip.id, rows[2].id, '2026-01-03T08:00');
    const before = { rows: (await dayRows(trip.id)), range: (await range(trip.id)), train: (await reservationRow(train)) };

    const inserted = await days.insert(trip.id, 2);
    expect((await range(trip.id)).end_date).toBe('2026-01-04');
    await removal.remove(trip.id, inserted.id, { userId: user.id });

    expect({ rows: (await dayRows(trip.id)), range: (await range(trip.id)), train: (await reservationRow(train)) }).toEqual(before);
  });

  it('DAY-DEL-011 appending a day, moving it into a slot and deleting the day it pushed out keeps every date', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2, d3] = rows;
    const lunch = await booking(trip.id, d2.id, '2026-01-02T12:00');
    const tour = await booking(trip.id, d3.id, '2026-01-03T09:00');

    const appended = await days.create(trip.id);
    await days.reorder(trip.id, [d1.id, d2.id, appended.id, d3.id]);
    // The pushed-out day lost its date to the new one and sits at the end without one.
    expect((await dayRows(trip.id)).at(-1)).toEqual({ id: d3.id, day_number: 4, date: null });
    await removal.remove(trip.id, d3.id, { userId: user.id });

    expect(await dayRows(trip.id)).toEqual([
      { id: d1.id, day_number: 1, date: '2026-01-01' },
      { id: d2.id, day_number: 2, date: '2026-01-02' },
      { id: appended.id, day_number: 3, date: '2026-01-03' },
    ]);
    expect(await range(trip.id)).toEqual({ start_date: '2026-01-01', end_date: '2026-01-03' });
    expect((await reservationRow(lunch))?.reservation_time).toBe('2026-01-02T12:00');
    expect((await reservationRow(tour))?.reservation_time).toBe('2026-01-03T09:00');
  });

  it('DAY-DEL-012 a failure halfway rolls the whole delete back', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const night = await bookedNight(trip.id, rows[1].id, rows[2].id);
    vi.spyOn(days, 'restampReservationDates').mockImplementation(() => { throw new Error('disk full'); });

    await expect(removal.remove(trip.id, rows[1].id, { userId: user.id })).rejects.toThrow('disk full');

    expect(await dayRows(trip.id)).toEqual(rows);
    expect(await exists(DayAccommodations, night.stayId)).toBe(true);
    expect(await reservationRow(night.reservationId)).toBeDefined();
    expect(await exists(BudgetItems, night.budgetId)).toBe(true);
  });

  it('DAY-DEL-013 the journey catches up after the commit, and a failure there does not undo the delete', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-02');
    const reconcile = vi.spyOn(journey, 'reconcileTripSkeletons').mockImplementation(() => { throw new Error('journey down'); });

    const result = await removal.remove(trip.id, rows[0].id, { userId: user.id, socketId: 'sock-1' });

    expect(reconcile).toHaveBeenCalledWith(trip.id, 'sock-1');
    expect(result.orderedIds).toEqual([rows[1].id]);
    expect(await dayRows(trip.id)).toHaveLength(1);
  });

  it('DAY-DEL-015 a day of another trip is refused, and nothing is written', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-02');
    const other = await datedTrip('2026-02-01', '2026-02-02');

    await expect(removal.remove(trip.id, other.rows[0].id, { userId: user.id })).rejects.toThrow(new DayDeleteError('Day not found'));
    expect(await dayRows(trip.id)).toEqual(rows);
    expect(await dayRows(other.trip.id)).toEqual(other.rows);
  });

  it('DAY-DEL-016 dated days on a trip without a range move their dates but leave the trip alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createDay(testDb, trip.id, { date: '2026-04-01' });
    const b = createDay(testDb, trip.id, { date: '2026-04-02' });

    const result = await removal.remove(trip.id, a.id, { userId: user.id });

    expect(await dayRows(trip.id)).toEqual([{ id: b.id, day_number: 1, date: '2026-04-01' }]);
    expect(await range(trip.id)).toEqual({ start_date: null, end_date: null });
    expect(result.endDate).toBeNull();
  });

  it('DAY-DEL-018 a cancelled stay does not announce the deleted day: neither its stop there nor its roads', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const place = createPlace(testDb, trip.id);
    createDayAccommodation(testDb, trip.id, place.id, rows[1].id, rows[1].id);
    const stub = {
      deleteAccommodation: vi.fn(() => ({
        linkedReservationId: null, deletedBudgetItemId: null, linkedReservationIds: [], deletedBudgetItemIds: [],
        mirror: {
          created: null, moved: null, updated: [], stamped: null,
          removed: [{ id: 1, dayId: rows[1].id }, { id: 2, dayId: rows[0].id }],
          vias: [{ dayId: rows[1].id, vias: [] }, { dayId: rows[0].id, vias: [] }],
        },
      })),
    } as unknown as AccommodationsService;

    const result = await (await removalWith(stub)).remove(trip.id, rows[1].id, { userId: user.id });

    expect(result.mirrors).toEqual([{
      created: null, moved: null, updated: [], stamped: null,
      removed: [{ id: 2, dayId: rows[0].id }],
      vias: [{ dayId: rows[0].id, vias: [] }],
    }]);
  });

  it('DAY-DEL-019 a hole left in the numbering closes too, and the boundaries follow their own days into it', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-05');
    const place = createPlace(testDb, trip.id);
    const stops = rows.map(r => createDayAssignment(testDb, r.id, place.id));
    // Days 1, 2, 4 and 5: the third went through the old bare delete, which left
    // its number empty and one boundary on it. Another one sits past the last day.
    await boundary(trip.id, 2, stops[1].id);
    await boundary(trip.id, 3, stops[0].id);
    await boundary(trip.id, 4, stops[3].id);
    await boundary(trip.id, 5, stops[4].id);
    await boundary(trip.id, 7, stops[0].id);
    await deleteRows(await orm(), Days, { id: rows[2].id });

    const result = await removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect((await dayRows(trip.id)).map(r => [r.id, r.day_number])).toEqual([[rows[0].id, 1], [rows[3].id, 2], [rows[4].id, 3]]);
    const expected = [
      { day_number: 2, from_assignment_id: stops[3].id, to_assignment_id: null, fraction: 1 },
      { day_number: 3, from_assignment_id: stops[4].id, to_assignment_id: null, fraction: 1 },
      { day_number: 5, from_assignment_id: stops[0].id, to_assignment_id: null, fraction: 1 },
    ];
    expect(await storedBoundaries(trip.id)).toEqual(expected);
    expect(result.boundaries).toEqual(expected);
  });
});

describe('DayRemovalService.announce', () => {
  function recorder() {
    const sent: [string, string, unknown][] = [];
    const all: MirrorSender = (event, payload) => { sent.push(['all', event, payload]); };
    const others: MirrorSender = (event, payload) => { sent.push(['others', event, payload]); };
    return { sent, all, others };
  }

  it('DAY-DEL-014 fans out in one order: the day, the new order, the stays, their rows, the boundaries, the trip', async () => {
    const { user, trip, rows } = await datedTrip('2026-01-01', '2026-01-03');
    const night = await bookedNight(trip.id, rows[0].id, rows[1].id);
    const place = createPlace(testDb, trip.id);
    await boundary(trip.id, 3, createDayAssignment(testDb, rows[2].id, place.id).id);
    const result = await removal.remove(trip.id, rows[1].id, { userId: user.id, socketId: 'sock' });
    const mirror = vi.spyOn(accommodations, 'announceMirror');
    const { sent, all, others } = recorder();

    await removal.announce(trip.id, result, { all, others, socketId: 'sock' });

    expect(sent.map(([to, event]) => `${to} ${event}`)).toEqual([
      'others day:deleted',
      'others day:reordered',
      'all assignment:deleted',
      'all assignment:reordered',
      'all reservation:deleted',
      'all budget:deleted',
      'others accommodation:deleted',
      'all roadtripBoundary:changed',
      'others trip:updated',
    ]);
    expect(sent[0][2]).toEqual({ dayId: rows[1].id });
    expect(sent[1][2]).toEqual({ orderedIds: [rows[0].id, rows[2].id] });
    expect(sent[2][2]).toEqual({ assignmentId: night.stop.id, dayId: rows[0].id });
    expect(sent[4][2]).toEqual({ reservationId: night.reservationId });
    expect(sent[5][2]).toEqual({ itemId: night.budgetId });
    expect(sent[6][2]).toEqual({ accommodationId: night.stayId });
    expect(sent[7][2]).toEqual({ boundaries: [expect.objectContaining({ day_number: 2 })] });
    expect(sent[8][2]).toEqual({ trip: expect.objectContaining({ id: trip.id, end_date: '2026-01-02' }) });
    expect(mirror).toHaveBeenCalledWith(trip.id, result.mirrors[0], all, 'sock');
  });

  it('DAY-DEL-017 a plain delete announces the day and the new order, nothing else', async () => {
    const removed: DayRemoval = {
      dayId: 4, orderedIds: [3, 5], stayIds: [], reservationIds: [], budgetItemIds: [], mirrors: [],
      boundaries: null, endDate: null, trip: null,
    };
    const { sent, all, others } = recorder();

    await removal.announce(9, removed, { all, others });

    expect(sent).toEqual([
      ['others', 'day:deleted', { dayId: 4 }],
      ['others', 'day:reordered', { orderedIds: [3, 5] }],
    ]);
  });
});
