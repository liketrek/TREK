/**
 * Unit tests for the DI-native ReservationsService — RESV-SVC-001+ (real-SQL
 * cases over the folded legacy services/reservationService.ts statements),
 * RES-TRAV-001..005 (moved 1:1 from tests/unit/services/reservationTravelers.test.ts)
 * and RESV-BRIDGE-001..009, which kept their assertions when the bridge went.
 * Uses a real in-memory SQLite DB so the SQL logic — falsy-coercion defaults,
 * COALESCE update semantics, day derivation, the accommodation/budget cascades
 * and the TEXT accommodation_id normalization — is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db, closeDb: () => {}, reinitialize: () => {}, getPlaceWithTags: () => null,
  };
    return mock;
});

const checkPermission = vi.fn(() => true);
const permissionsStub = { checkPermission } as unknown as PermissionsService;

// Constructor-injected since the budget fold (was a path mock of the deleted
// services/budgetService).
const budget = { createBudgetItem: vi.fn(), updateBudgetItem: vi.fn(), deleteBudgetItem: vi.fn(), linkBudgetItemToReservation: vi.fn(), freezeForeignRate: vi.fn() };

const { notif } = vi.hoisted(() => ({ notif: { send: vi.fn().mockResolvedValue(undefined) } }));

import { db as testDb } from '../../../src/db/database';
import { HttpException } from '@nestjs/common';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createBudgetItem, createPlace, createDay, createDayAccommodation, createDayAssignment, addTripMember } from '../../helpers/factories';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { ReservationsReadService } from '../../../src/nest/reservations/reservations-read.service';
import type { BudgetService } from '../../../src/nest/budget/budget.service';
// Was reservations.bridge, deleted along with the other three that had no
// consumer outside the container. The cases below kept their assertions and
// point at the service the bridge delegated to; only the delegation itself is
// gone, and there was nothing left to delegate for.
const bridge = {
  listReservations: (tripId: string | number) => svc.list(tripId),
  loadEndpointsByTrip: (tripId: string | number) => svc.loadEndpointsByTrip(tripId),
  resyncReservationDays: (tripId: string | number) => svc.resyncReservationDays(tripId),
  createReservation: (tripId: string | number, data: Parameters<ReservationsService['create']>[1]) => svc.create(tripId, data),
  getReservation: (id: string | number, tripId: string | number) => svc.getReservation(id, tripId),
  getReservationWithJoins: (id: string | number) => svc.getReservationWithJoins(id),
  updateReservation: (
    id: string | number,
    tripId: string | number,
    data: Parameters<ReservationsService['update']>[2],
    current: Parameters<ReservationsService['update']>[3],
  ) => svc.update(id, tripId, data, current),
  deleteReservation: (id: string | number, tripId: string | number) => svc.remove(id, tripId),
  notifyBookingChange: (...a: Parameters<ReservationsService['notifyBookingChange']>) => svc.notifyBookingChange(...a),
};
import { notificationsStub } from '../../helpers/notifications';
import { makeAccommodationsService } from '../../helpers/accommodations-service';
import { createTestUnitOfWork, createTestReservationsRepo, createTestReservationEndpointsRepo, createTestReservationTravelersRepo, createTestReservationDayPositionsRepo, createTestDayAccommodationsRepo, createTestDaysRepo, createTestPlacesRepo, createTestDayAssignmentsRepo, createTestTripMembersRepo, createTestUsersRepo, createTestTripsRepo } from '../../helpers/test-uow';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { sharedTestOrm } from '../../helpers/test-uow';
import type { TestOrm } from '../../helpers/test-orm';
import { countRows, deleteRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { ReservationDayPositions } from '../../../src/db/entities/ReservationDayPositions.entity';
import { ReservationEndpoints } from '../../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { FakeRealtimeService } from '../../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

let svc: ReservationsService;
let orm: TestOrm;
beforeAll(async () => {
  svc = new ReservationsService(permissionsStub, budget as unknown as BudgetService, realtime, notificationsStub(notif.send), new ReservationsReadService(await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb)), await makeAccommodationsService(testDb, realtime), await createTestUnitOfWork(testDb), await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb), await createTestReservationDayPositionsRepo(testDb), await createTestDayAccommodationsRepo(testDb), await createTestDaysRepo(testDb), await createTestPlacesRepo(testDb), await createTestDayAssignmentsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb), await createTestTripsRepo(testDb), await createTestBudgetItemsRepo(testDb));
});

beforeEach(async () => {
  resetTestDb(testDb);
  orm = await sharedTestOrm(testDb);
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => testDb.close());

/** Owner + trip helper for the common single-user cases. */
function ownerTrip(overrides: Parameters<typeof createTrip>[2] = {}) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id, overrides);
  return { user, trip };
}

describe('ReservationsService (DI-native, real SQL)', () => {
  it('RESV-SVC-001: canEdit delegates to checkPermission with reservation_edit', async () => {
    await svc.canEdit({ user_id: 2 } as never, { id: 1, role: 'user' } as never);
    expect(checkPermission).toHaveBeenCalledWith('reservation_edit', 'user', 2, 1, true);
  });

  describe('create', () => {
    it('RESV-SVC-002: applies the legacy falsy-coercion defaults and re-selects the joined row', async () => {
      const { trip } = ownerTrip();
      const { reservation, accommodationCreated } = await svc.create(String(trip.id), { title: 'Dinner', location: '' } as never);
      expect(accommodationCreated).toBe(false);
      expect(reservation).toMatchObject({
        title: 'Dinner',
        type: 'other',        // type || 'other'
        status: 'pending',    // status || 'pending'
        location: null,       // '' || null
        accommodation_id: null,
        endpoints: [],
        travelers: [],
      });
    });

    it('RESV-SVC-003: derives day_id from reservation_time for non-hotel bookings', async () => {
      const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
      const day2 = await findRow(orm, Days, { trip: trip.id, date: '2030-05-02' }) as { id: number };
      const { reservation } = await svc.create(String(trip.id), { title: 'Tour', type: 'tour', reservation_time: '2030-05-02T10:00:00' });
      expect(reservation.day_id).toBe(day2.id);
      // Out-of-range time clamps to the nearest day (create path clamps).
      const day3 = await findRow(orm, Days, { trip: trip.id, date: '2030-05-03' }) as { id: number };
      const { reservation: clamped } = await svc.create(String(trip.id), { title: 'Late', type: 'tour', reservation_time: '2030-06-20T10:00:00' });
      expect(clamped.day_id).toBe(day3.id);
    });

    it('RESV-SVC-004: auto-creates the accommodation for a hotel with create_accommodation', async () => {
      const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
      const place = createPlace(testDb, trip.id);
      const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
      const { reservation, accommodationCreated } = await svc.create(String(trip.id), {
        title: 'Hotel', type: 'hotel',
        create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[2].id, check_in: '15:00' },
        confirmation_number: 'ABC123',
      });
      expect(accommodationCreated).toBe(true);
      const acc = await findRow(orm, DayAccommodations, { trip: trip.id }) as Record<string, unknown>;
      expect(acc).toMatchObject({ place_id: place.id, check_in: '15:00', confirmation: 'ABC123' });
      // TEXT accommodation_id column reads back normalized to an int.
      expect(reservation.accommodation_id).toBe(Number(acc.id));
      expect(reservation.accommodation_name).toBe(place.name);
    });

    it('RESV-SVC-005: saves endpoints, skipping null-coordinate rows; sequence defaults to the post-filter index', async () => {
      const { trip } = ownerTrip();
      const endpoints = [
        { role: 'from', name: 'A', code: 'AAA', lat: 1, lng: 2, timezone: null, local_time: null, local_date: null },
        { role: 'to', name: 'NoGeo', code: null, lat: null, lng: null, timezone: null, local_time: null, local_date: null },
        { role: 'to', name: 'B', code: 'BBB', lat: 3, lng: 4, timezone: null, local_time: null, local_date: null },
      ];
      const { reservation } = await svc.create(String(trip.id), { title: 'Bus', type: 'other', endpoints } as never);
      const rows = await findRows(orm, ReservationEndpoints, { reservation: reservation.id }, { sequence: 'asc' }) as { name: string; sequence: number }[];
      // The index fallback runs AFTER the null-coord filter, so 'B' (third on
      // the wire, second surviving row) gets sequence 1.
      expect(rows).toMatchObject([{ name: 'A', sequence: 0 }, { name: 'B', sequence: 1 }]);
    });

    it('RESV-SVC-006 (quirk fixed): metadata check-in sync keys off the resolved id, so an auto-created accommodation gets its times too', async () => {
      const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
      const place = createPlace(testDb, trip.id);
      const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
      await svc.create(String(trip.id), {
        title: 'Hotel', type: 'hotel',
        create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[1].id },
        metadata: { check_in_time: '16:00' },
      });
      // The legacy gate read the raw accommodation_id and left this NULL.
      const acc = await findRow(orm, DayAccommodations, { trip: trip.id }) as { check_in: string | null };
      expect(acc.check_in).toBe('16:00');
    });
  });

  describe('update', () => {
    it('RESV-SVC-007: an empty-string title silently keeps the old value (COALESCE + `|| null`)', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Old title' });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      const { reservation } = await svc.update(String(res.id), String(trip.id), { title: '', notes: 'updated' }, current);
      expect(reservation.title).toBe('Old title');
      expect(reservation.notes).toBe('updated');
    });

    it('RESV-SVC-008: switching to hotel forces reservation_time/reservation_end_time to null', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'X', type: 'tour' });
      await updateRows(orm, Reservations, { id: res.id }, { reservation_time: '2030-05-01T10:00:00' });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      const { reservation } = await svc.update(String(res.id), String(trip.id), { type: 'hotel' }, current);
      expect(reservation.reservation_time).toBeNull();
      expect(reservation.reservation_end_time).toBeNull();
    });

    it('RESV-SVC-009: a stale accommodation_id pointing at a deleted row is nulled out', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
      await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: '999' });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      const { reservation } = await svc.update(String(res.id), String(trip.id), { notes: 'n' }, current);
      expect(reservation.accommodation_id).toBeNull();
    });

    it('RESV-SVC-033: a metadata payload without `price` keeps the linked expense price (and currency) from the stored metadata', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
      const item = createBudgetItem(testDb, trip.id, { name: 'Flight', total_price: 2040 });
      await updateRows(orm, BudgetItems, { id: item.id }, { reservation: res.id });
      await updateRows(orm, Reservations, { id: res.id }, { metadata: JSON.stringify({ airline: 'CZ', seat: '72K', price: '2040', priceCurrency: 'CNY' }) });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      // What the booking form sends back: rebuilt from its fields, price not among them.
      const { reservation } = await svc.update(String(res.id), String(trip.id), { metadata: { airline: 'CZ', seat: '12A' } }, current);
      expect(JSON.parse(reservation.metadata as string)).toEqual({ airline: 'CZ', seat: '12A', price: '2040', priceCurrency: 'CNY' });
    });

    it('RESV-SVC-034: a payload that names `price` is taken at face value, set or cleared', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Linked', type: 'flight' });
      const item = createBudgetItem(testDb, trip.id, { name: 'Linked', total_price: 100 });
      await updateRows(orm, BudgetItems, { id: item.id }, { reservation: res.id });
      await updateRows(orm, Reservations, { id: res.id }, { metadata: JSON.stringify({ price: '100' }) });

      let current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      let { reservation } = await svc.update(String(res.id), String(trip.id), { metadata: { price: '150' } }, current);
      expect(JSON.parse(reservation.metadata as string)).toEqual({ price: '150' });

      // Naming the key with a null is how a caller removes the price on purpose;
      // it must not be read as "the form did not mention it".
      current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      ({ reservation } = await svc.update(String(res.id), String(trip.id), { metadata: { price: null, seat: '1A' } }, current));
      expect(JSON.parse(reservation.metadata as string)).toEqual({ price: null, seat: '1A' });
    });

    it('RESV-SVC-036: a price with no linked expense is kept too, because the importer stamps one either way', async () => {
      // booking-import writes metadata.price unconditionally but only creates the
      // linked cost when the Costs addon is on and the price is above zero, so an
      // instance with that addon off has bookings carrying a price and no budget
      // row at all. Keying the carry-over on a linked item would drop those.
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Imported', type: 'flight' });
      await updateRows(orm, Reservations, { id: res.id }, { metadata: JSON.stringify({ price: '999', priceCurrency: 'EUR' }) });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;

      const { reservation } = await svc.update(String(res.id), String(trip.id), { metadata: { seat: '1A' } }, current);
      expect(JSON.parse(reservation.metadata as string)).toEqual({ seat: '1A', price: '999', priceCurrency: 'EUR' });
    });

    it('RESV-SVC-035: metadata null still clears the stored metadata, linked expense or not', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
      const item = createBudgetItem(testDb, trip.id, { name: 'Flight', total_price: 50 });
      await updateRows(orm, BudgetItems, { id: item.id }, { reservation: res.id });
      await updateRows(orm, Reservations, { id: res.id }, { metadata: JSON.stringify({ price: '50' }) });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      const { reservation } = await svc.update(String(res.id), String(trip.id), { metadata: null }, current);
      expect(reservation.metadata).toBeNull();
    });

    it('RESV-SVC-043: a bus edit with an empty metadata object keeps the price, the same edit with null drops it (#2233)', async () => {
      // A bus, car, taxi or ferry has no metadata of its own, so the booking form
      // rebuilds it as {}. The phone used to send null instead, which this
      // service rightly reads as "clear the column", and the price went with it.
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Shuttle', type: 'bus' });
      await updateRows(orm, Reservations, { id: res.id }, { metadata: JSON.stringify({ price: '45', priceCurrency: 'EUR' }) });

      let current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      let { reservation } = await svc.update(String(res.id), String(trip.id), { metadata: {} }, current);
      expect(JSON.parse(reservation.metadata as string)).toEqual({ price: '45', priceCurrency: 'EUR' });

      current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      ({ reservation } = await svc.update(String(res.id), String(trip.id), { metadata: null }, current));
      expect(reservation.metadata).toBeNull();
    });

    it('RESV-SVC-010: endpoints [] wipes stored endpoints; an absent field leaves them alone', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Bus' });
      await insertRow(orm, ReservationEndpoints, { reservation: res.id, role: 'from', sequence: 0, name: 'A', lat: 1, lng: 2 });
      let current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      await svc.update(String(res.id), String(trip.id), { notes: 'no endpoints field' }, current);
      expect(({ c: await countRows(orm, ReservationEndpoints, { reservation: res.id }) })).toEqual({ c: 1 });
      current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      await svc.update(String(res.id), String(trip.id), { endpoints: [] }, current);
      expect(({ c: await countRows(orm, ReservationEndpoints, { reservation: res.id }) })).toEqual({ c: 0 });
    });
  });

  describe('remove', () => {
    it('RESV-SVC-011: cascades to the linked accommodation and budget item, reporting both', async () => {
      const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
      const place = createPlace(testDb, trip.id);
      const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
      const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
      const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
      await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id) });
      const item = createBudgetItem(testDb, trip.id);
      await updateRows(orm, BudgetItems, { id: item.id }, { reservation: res.id });

      const result = await svc.remove(String(res.id), String(trip.id));
      expect(result.deleted).toMatchObject({ id: res.id, title: 'Hotel', type: 'hotel' });
      expect(result.accommodationDeleted).toBe(true);
      expect(result.deletedBudgetItemId).toBe(item.id);
      expect(result.deletedBudgetItemIds).toEqual([item.id]);
      expect(({ c: await countRows(orm, Reservations, { id: res.id }) })).toEqual({ c: 0 });
      expect(({ c: await countRows(orm, DayAccommodations, { id: acc.id }) })).toEqual({ c: 0 });
      expect(({ c: await countRows(orm, BudgetItems, { id: item.id }) })).toEqual({ c: 0 });
    });

    it('RESV-SVC-012: returns the empty shape when the reservation is missing', async () => {
      const { trip } = ownerTrip();
      expect(await svc.remove('999', String(trip.id))).toEqual({ deleted: undefined, accommodationDeleted: false, deletedBudgetItemId: null, deletedBudgetItemIds: [] });
    });

    it('RESV-SVC-037: takes every linked expense with it and reports each one (#2084)', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
      const fare = createBudgetItem(testDb, trip.id, { name: 'Fare' });
      const luggage = createBudgetItem(testDb, trip.id, { name: 'Luggage' });
      const unlinked = createBudgetItem(testDb, trip.id, { name: 'Coffee' });
      await updateRows(orm, BudgetItems, { id: { $in: [fare.id, luggage.id] } }, { reservation: res.id });

      const result = await svc.remove(String(res.id), String(trip.id));

      expect(result.deletedBudgetItemIds).toEqual([fare.id, luggage.id]);
      // The single-id field stays for older readers, as the first of them.
      expect(result.deletedBudgetItemId).toBe(fare.id);
      expect(await findRows(orm, BudgetItems, { trip: trip.id }, { id: 'asc' })).toMatchObject([{ id: unlinked.id }]);
    });

    it('RESV-SVC-038: a booking without expenses reports none and deletes no expense', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id);
      const unlinked = createBudgetItem(testDb, trip.id);

      const result = await svc.remove(String(res.id), String(trip.id));

      expect(result).toMatchObject({ accommodationDeleted: false, deletedBudgetItemId: null, deletedBudgetItemIds: [] });
      expect(await findRow(orm, BudgetItems, { id: unlinked.id })).toMatchObject({ id: unlinked.id });
    });
  });

  describe('updatePositions', () => {
    it('RESV-SVC-013: without dayId updates the global day_plan_position (legacy branch)', async () => {
      const { trip } = ownerTrip();
      const r1 = createReservation(testDb, trip.id, { title: 'A' });
      const r2 = createReservation(testDb, trip.id, { title: 'B' });
      await svc.updatePositions(String(trip.id), [{ id: r2.id, day_plan_position: 0 }, { id: r1.id, day_plan_position: 1 }]);
      expect(await findRow(orm, Reservations, { id: r2.id })).toMatchObject({ day_plan_position: 0 });
      expect(await findRow(orm, Reservations, { id: r1.id })).toMatchObject({ day_plan_position: 1 });
    });

    it('RESV-SVC-014: with dayId upserts per-day positions into reservation_day_positions', async () => {
      const { trip } = ownerTrip();
      const day = createDay(testDb, trip.id, { date: '2030-05-01' });
      const r1 = createReservation(testDb, trip.id, { title: 'A' });
      await svc.updatePositions(String(trip.id), [{ id: r1.id, day_plan_position: 3 }], day.id);
      await svc.updatePositions(String(trip.id), [{ id: r1.id, day_plan_position: 5 }], day.id); // OR REPLACE
      expect(await findRow(orm, ReservationDayPositions, { reservation: r1.id, day: day.id })).toMatchObject({ position: 5 });
      expect(await findRow(orm, Reservations, { id: r1.id })).toMatchObject({ day_plan_position: null });
    });
  });

  describe('list / getReservationWithJoins', () => {
    it('RESV-SVC-015: attaches day_positions, endpoints, travelers and normalizes the TEXT accommodation_id', async () => {
      const { user, trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
      const place = createPlace(testDb, trip.id);
      const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
      const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
      const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
      // The TEXT column quirk: the FK reads back as a numeric string like "14.0".
      await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: `${acc.id}.0` });
      await insertRow(orm, ReservationDayPositions, { reservation: res.id, day: days[0].id, position: 2 });
      await svc.setReservationTravelers(res.id, trip.id, [user.id]);

      const [row] = await svc.list(String(trip.id));
      expect(row.accommodation_id).toBe(acc.id);
      expect(row.accommodation_name).toBe(place.name);
      expect(row.day_positions).toEqual({ [days[0].id]: 2 });
      expect(row.travelers).toHaveLength(1);

      const single = (await svc.getReservationWithJoins(res.id))!;
      expect(single.accommodation_id).toBe(acc.id);
      expect(single.travelers).toHaveLength(1);
    });

    it('RESV-SVC-016: getReservationWithJoins returns undefined for a missing id', async () => {
      expect(await svc.getReservationWithJoins(999)).toBeUndefined();
    });
  });

  describe('listUpcoming', () => {
    it('RESV-SVC-017: returns future reservations across owned + member trips, skipping cancelled', async () => {
      const { user, trip } = ownerTrip();
      const future = createReservation(testDb, trip.id, { title: 'Future' });
      await updateRows(orm, Reservations, { id: future.id }, { reservation_time: '2999-01-01T10:00:00' });
      const past = createReservation(testDb, trip.id, { title: 'Past' });
      await updateRows(orm, Reservations, { id: past.id }, { reservation_time: '2000-01-01T10:00:00' });
      const cancelled = createReservation(testDb, trip.id, { title: 'Cancelled' });
      await updateRows(orm, Reservations, { id: cancelled.id }, { reservation_time: '2999-01-02T10:00:00', status: 'cancelled' });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual(['Future']);
    });

    // #1934 — a stay covers a range, so it would hold a widget slot for its
    // whole span. Both ways a hotel can be dated are kept out.
    it('RESV-SVC-017b: leaves out a hotel dated through its own reservation_time', async () => {
      const { user, trip } = ownerTrip();
      const hotel = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
      await updateRows(orm, Reservations, { id: hotel.id }, { reservation_time: '2999-01-01T10:00:00' });
      const flight = createReservation(testDb, trip.id, { title: 'Flight' });
      await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2999-01-02T10:00:00' });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual(['Flight']);
    });

    it('RESV-SVC-017c: leaves out a hotel dated through its day', async () => {
      const { user, trip } = ownerTrip();
      const day = createDay(testDb, trip.id, { date: '2999-06-01' });
      createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel', day_id: day.id });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual([]);
    });

    // The type column defaults to 'other' but nothing stops a NULL, and a
    // NULL-unsafe `type != 'hotel'` would silently drop those rows.
    it('RESV-SVC-017d: a reservation with no type at all still shows', async () => {
      const { user, trip } = ownerTrip();
      const res = createReservation(testDb, trip.id, { title: 'Untyped' });
      await updateRows(orm, Reservations, { id: res.id }, { type: null, reservation_time: '2999-01-01T10:00:00' });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual(['Untyped']);
    });

    // The column holds two shapes: the booking form writes 'YYYY-MM-DDTHH:MM',
    // day-anchored rows hold a bare 'HH:MM'. Compared as strings against an ISO
    // timestamp, ':' sorts above '2', so a bare time was an arbitrary filter:
    // everything from 20:00 on passed and everything before it vanished (#1934).
    it('RESV-SVC-017e: a bare clock time falls back to its day instead of being read as a date', async () => {
      const { user, trip } = ownerTrip();
      const day = createDay(testDb, trip.id, { date: '2999-06-01' });
      const morning = createReservation(testDb, trip.id, { title: 'Ferry', day_id: day.id });
      await updateRows(orm, Reservations, { id: morning.id }, { reservation_time: '08:30' });
      const evening = createReservation(testDb, trip.id, { title: 'Show', day_id: day.id });
      await updateRows(orm, Reservations, { id: evening.id }, { reservation_time: '20:00' });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual(['Ferry', 'Show']);
    });

    it('RESV-SVC-017f: orders by the day and the clock, not by the raw column', async () => {
      const { user, trip } = ownerTrip();
      const early = createDay(testDb, trip.id, { date: '2999-06-01' });
      const late = createDay(testDb, trip.id, { date: '2999-06-02' });
      const bare = createReservation(testDb, trip.id, { title: 'Bare morning', day_id: early.id });
      await updateRows(orm, Reservations, { id: bare.id }, { reservation_time: '08:30' });
      const dated = createReservation(testDb, trip.id, { title: 'Dated day two' });
      await updateRows(orm, Reservations, { id: dated.id }, { reservation_time: '2999-06-02T09:00' });
      const later = createReservation(testDb, trip.id, { title: 'Bare evening', day_id: early.id });
      await updateRows(orm, Reservations, { id: later.id }, { reservation_time: '20:00' });
      const dayOnly = createReservation(testDb, trip.id, { title: 'No time', day_id: late.id });
      await updateRows(orm, Reservations, { id: dayOnly.id }, { reservation_time: null });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual(['Bare morning', 'Bare evening', 'No time', 'Dated day two']);
    });

    // The stay stays out, but arriving and leaving are moments, and they are the
    // two the traveller needs reminding of.
    it('RESV-SVC-017g: a stay contributes a check-in and a check-out named after its place', async () => {
      const { user, trip } = ownerTrip();
      const start = createDay(testDb, trip.id, { date: '2999-06-01' });
      const end = createDay(testDb, trip.id, { date: '2999-06-05' });
      const place = createPlace(testDb, trip.id, { name: 'The Plaza' });
      createDayAccommodation(testDb, trip.id, place.id, start.id, end.id, { check_in: '15:00', check_out: '11:00' });

      const rows = (await svc.listUpcoming(user.id)) as { title: string; type: string; day_date: string }[];
      expect(rows).toEqual([
        expect.objectContaining({ title: 'The Plaza', type: 'checkin', day_date: '2999-06-01' }),
        expect.objectContaining({ title: 'The Plaza', type: 'checkout', day_date: '2999-06-05' }),
      ]);
    });

    it('RESV-SVC-017h: the two moments sort among the bookings rather than after them', async () => {
      const { user, trip } = ownerTrip();
      const start = createDay(testDb, trip.id, { date: '2999-06-01' });
      const end = createDay(testDb, trip.id, { date: '2999-06-03' });
      const place = createPlace(testDb, trip.id, { name: 'Hostel' });
      createDayAccommodation(testDb, trip.id, place.id, start.id, end.id, { check_in: '15:00', check_out: '10:00' });
      const dinner = createReservation(testDb, trip.id, { title: 'Dinner' });
      await updateRows(orm, Reservations, { id: dinner.id }, { reservation_time: '2999-06-01T19:00' });
      const museum = createReservation(testDb, trip.id, { title: 'Museum' });
      await updateRows(orm, Reservations, { id: museum.id }, { reservation_time: '2999-06-02T09:00' });

      const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
      expect(rows.map(r => r.title)).toEqual(['Hostel', 'Dinner', 'Museum', 'Hostel']);
    });

    it('RESV-SVC-017i: a stay that is already over contributes nothing', async () => {
      const { user, trip } = ownerTrip();
      const start = createDay(testDb, trip.id, { date: '2000-06-01' });
      const end = createDay(testDb, trip.id, { date: '2000-06-05' });
      const place = createPlace(testDb, trip.id, { name: 'Old Inn' });
      createDayAccommodation(testDb, trip.id, place.id, start.id, end.id, { check_in: '15:00', check_out: '11:00' });

      expect(await svc.listUpcoming(user.id)).toEqual([]);
    });

    it('RESV-SVC-017j: a nameless stay falls back to its linked booking', async () => {
      const { user, trip } = ownerTrip();
      const start = createDay(testDb, trip.id, { date: '2999-06-01' });
      const end = createDay(testDb, trip.id, { date: '2999-06-02' });
      const acc = await insertRow(orm, DayAccommodations, { trip: trip.id, place: null, startDay: start.id, endDay: end.id, check_in: '15:00', check_out: '11:00' });
      const booking = createReservation(testDb, trip.id, { title: 'Hotel Ibis', type: 'hotel' });
      await updateRows(orm, Reservations, { id: booking.id }, { accommodation_id: String(acc) });

      const rows = (await svc.listUpcoming(user.id)) as { title: string; type: string }[];
      expect(rows.map(r => r.type + ':' + r.title)).toEqual(['checkin:Hotel Ibis', 'checkout:Hotel Ibis']);
    });
  });

  describe('resyncReservationDays', () => {
    it('RESV-SVC-018: re-anchors a dated booking to the day matching its time; out-of-range stays untouched', async () => {
      const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
      const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number; date: string }[];
      const res = createReservation(testDb, trip.id, { title: 'Tour', type: 'tour', day_id: days[0].id });
      await updateRows(orm, Reservations, { id: res.id }, { reservation_time: '2030-05-03T09:00:00' });
      const outside = createReservation(testDb, trip.id, { title: 'Outside', type: 'tour', day_id: days[0].id });
      await updateRows(orm, Reservations, { id: outside.id }, { reservation_time: '2031-01-01T09:00:00' });

      await svc.resyncReservationDays(String(trip.id));
      expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ day_id: days[2].id });
      expect(await findRow(orm, Reservations, { id: outside.id })).toMatchObject({ day_id: days[0].id });
    });
  });

  describe('setTravelers (controller-facing composition)', () => {
    it('returns null when the reservation is not on the trip (off-trip guard)', async () => {
      const { trip } = ownerTrip();
      expect(await svc.setTravelers('999', String(trip.id), [2])).toBeNull();
    });

    it('assigns travelers and returns the refreshed travelers + reservation', async () => {
      const { user, trip } = ownerTrip();
      const res = createReservation(testDb, trip.id);
      const result = (await svc.setTravelers(String(res.id), String(trip.id), [user.id]))!;
      expect(result.travelers).toHaveLength(1);
      expect(result.travelers[0]).toMatchObject({ user_id: user.id });
      expect(result.reservation).toMatchObject({ id: res.id });
    });
  });

  describe('syncBudgetOnCreate', () => {
    it('does nothing without a positive price', async () => {
      await svc.syncBudgetOnCreate('5', 9, 'Hotel', 'lodging', undefined, 'sock');
      await svc.syncBudgetOnCreate('5', 9, 'Hotel', 'lodging', { total_price: 0 }, 'sock');
      expect(budget.linkBudgetItemToReservation).not.toHaveBeenCalled();
    });

    it('links a budget item and broadcasts budget:created', async () => {
      budget.linkBudgetItemToReservation.mockReturnValue({ id: 7 });
      await svc.syncBudgetOnCreate('5', 9, 'Hotel', 'lodging', { total_price: 200, category: 'Lodging' }, 'sock');
      expect(budget.linkBudgetItemToReservation).toHaveBeenCalledWith('5', 9, { name: 'Hotel', category: 'Lodging', total_price: 200 });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 7 } }, 'sock');
    });

    it('falls back to "Other" for the category and lets a failing cost write reach the caller', async () => {
      budget.linkBudgetItemToReservation.mockImplementation(() => { throw new Error('boom'); });
      // createWithCost relies on the throw to roll the booking back with its cost.
      await expect(svc.syncBudgetOnCreate('5', 9, 'Hotel', undefined, { total_price: 50 }, 'sock')).rejects.toThrow('boom');
      expect(budget.linkBudgetItemToReservation).toHaveBeenCalledWith('5', 9, { name: 'Hotel', category: 'Other', total_price: 50 });
      expect(broadcast).not.toHaveBeenCalled();
    });

    // #2525: an imported booking quoted in dollars became a cost of that many euros.
    it('links the cost in the currency and at the rate it arrives with', async () => {
      budget.linkBudgetItemToReservation.mockReturnValue({ id: 7 });
      await svc.syncBudgetOnCreate('5', 9, 'Hotel', 'hotel', { total_price: 801.76, currency: 'USD', exchange_rate: 1.17 }, 'sock');
      expect(budget.linkBudgetItemToReservation).toHaveBeenCalledWith('5', 9, {
        name: 'Hotel', category: 'hotel', total_price: 801.76, currency: 'USD', exchange_rate: 1.17,
      });
    });
  });

  describe('withFrozenRate (#2525)', () => {
    it('keeps a quoted currency and freezes a rate for it', async () => {
      budget.freezeForeignRate.mockImplementation(async (_tripId: unknown, data: { exchange_rate?: number }) => { data.exchange_rate = 1.17; });
      expect(await svc.withFrozenRate('5', { total_price: 801.76, category: 'hotel', currency: ' usd ' })).toEqual({
        total_price: 801.76, category: 'hotel', currency: 'USD', exchange_rate: 1.17,
      });
      expect(budget.freezeForeignRate).toHaveBeenCalledWith('5', { currency: 'USD', exchange_rate: 1.17 });
    });

    it('leaves the rate off when none could be frozen, so the cost converts live', async () => {
      budget.freezeForeignRate.mockResolvedValue(undefined);
      expect(await svc.withFrozenRate('5', { total_price: 10, currency: 'EUR' })).toEqual({ total_price: 10, currency: 'EUR' });
    });

    it('drops a currency that is not a code, and never takes a rate from the caller', async () => {
      expect(await svc.withFrozenRate('5', { total_price: 10, currency: 'dollars', exchange_rate: 99 })).toEqual({ total_price: 10 });
      expect(await svc.withFrozenRate('5', { total_price: 10, exchange_rate: 99 })).toEqual({ total_price: 10 });
      expect(budget.freezeForeignRate).not.toHaveBeenCalled();
      expect(await svc.withFrozenRate('5', undefined)).toBeUndefined();
    });
  });

  describe('syncBudgetOnUpdate', () => {
    async function linkedItem(overrides: Parameters<typeof createBudgetItem>[2] = {}) {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id);
      const item = createBudgetItem(testDb, trip.id, overrides);
      await updateRows(orm, BudgetItems, { id: item.id }, { reservation: res.id });
      return { trip, res, item };
    }

    it('deletes the linked item when the price is explicitly cleared (total_price 0)', async () => {
      const { trip, res, item } = await linkedItem();
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'Hotel', 'lodging', 'Hotel', 'lodging', { total_price: 0 }, 'sock');
      expect(budget.deleteBudgetItem).toHaveBeenCalledWith(item.id, String(trip.id));
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:deleted', { itemId: item.id }, 'sock');
    });

    it('leaves the linked item alone when no budget entry is on the payload (no wipe)', async () => {
      const { trip, res } = await linkedItem();
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'Hotel', 'lodging', 'Hotel', 'lodging', undefined, 'sock');
      expect(budget.deleteBudgetItem).not.toHaveBeenCalled();
      expect(budget.updateBudgetItem).not.toHaveBeenCalled();
      expect(budget.createBudgetItem).not.toHaveBeenCalled();
    });

    it('syncs the linked expense category when the booking type changes', async () => {
      const { trip, res, item } = await linkedItem({ category: 'other' });
      budget.updateBudgetItem.mockReturnValue({ id: item.id, category: 'flights' });
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'other', undefined, 'sock');
      expect(budget.updateBudgetItem).toHaveBeenCalledWith(item.id, String(trip.id), { category: 'flights' });
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:updated', { item: { id: item.id, category: 'flights' } }, 'sock');
    });

    it('RESV-SVC-039: a type change re-files every linked expense still on the derived category, one broadcast each (#2084)', async () => {
      const { trip, res, item: fare } = await linkedItem({ name: 'Fare', category: 'transport' });
      const luggage = createBudgetItem(testDb, trip.id, { name: 'Luggage', category: 'transport' });
      const picked = createBudgetItem(testDb, trip.id, { name: 'Lounge', category: 'food' });
      await updateRows(orm, BudgetItems, { id: { $in: [luggage.id, picked.id] } }, { reservation: res.id });
      budget.updateBudgetItem.mockImplementation((id: number) => ({ id, category: 'flights' }));

      // train -> flight: transport -> flights.
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'train', undefined, 'sock');

      expect(budget.updateBudgetItem.mock.calls).toEqual([
        [fare.id, String(trip.id), { category: 'flights' }],
        [luggage.id, String(trip.id), { category: 'flights' }],
      ]);
      // The hand-picked category survives.
      expect(budget.updateBudgetItem).not.toHaveBeenCalledWith(picked.id, expect.anything(), expect.anything());
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:updated', { item: { id: fare.id, category: 'flights' } }, 'sock');
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:updated', { item: { id: luggage.id, category: 'flights' } }, 'sock');
      expect(broadcast).toHaveBeenCalledTimes(2);
    });

    it('RESV-SVC-041: with several expenses linked, the booking price field touches none of them (#2084)', async () => {
      const { trip, res, item: fare } = await linkedItem({ name: 'Fare', total_price: 100 });
      const seat = createBudgetItem(testDb, trip.id, { name: 'Seat', total_price: 20 });
      await updateRows(orm, BudgetItems, { id: seat.id }, { reservation: res.id });

      // A price speaks for one expense; with two there is no telling which, so
      // neither a new figure nor a clear may land on an arbitrary one of them.
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'flight', { total_price: 500 }, 'sock');
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'flight', { total_price: 0 }, 'sock');

      expect(budget.updateBudgetItem).not.toHaveBeenCalled();
      expect(budget.deleteBudgetItem).not.toHaveBeenCalled();
      expect(budget.createBudgetItem).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
      expect(await findRows(orm, BudgetItems, { reservation: res.id }, { id: 'asc' }))
        .toMatchObject([{ id: fare.id, total_price: 100 }, { id: seat.id, total_price: 20 }]);
    });

    it('RESV-SVC-042: the type-change re-file still runs when several expenses stop the price path', async () => {
      const { trip, res, item: fare } = await linkedItem({ name: 'Fare', category: 'transport' });
      const seat = createBudgetItem(testDb, trip.id, { name: 'Seat', category: 'transport' });
      await updateRows(orm, BudgetItems, { id: seat.id }, { reservation: res.id });
      budget.updateBudgetItem.mockImplementation((id: number) => ({ id, category: 'flights' }));

      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'train', { total_price: 500 }, 'sock');

      // Only the two category writes, never the price.
      expect(budget.updateBudgetItem.mock.calls).toEqual([
        [fare.id, String(trip.id), { category: 'flights' }],
        [seat.id, String(trip.id), { category: 'flights' }],
      ]);
      expect(budget.createBudgetItem).not.toHaveBeenCalled();
    });

    it('RESV-SVC-040: a type change that keeps the derived category touches no linked expense', async () => {
      const { trip, res } = await linkedItem({ category: 'transport' });
      // train -> bus: both file under transport.
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'bus', 'X', 'train', undefined, 'sock');
      expect(budget.updateBudgetItem).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('updates an existing linked item when a price is provided', async () => {
      const { trip, res, item } = await linkedItem();
      budget.updateBudgetItem.mockReturnValue({ id: item.id });
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'New', 'lodging', 'Old', 'lodging', { total_price: 80 }, 'sock');
      expect(budget.updateBudgetItem).toHaveBeenCalledWith(item.id, String(trip.id), { name: 'New', category: 'lodging', total_price: 80 });
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:updated', { item: { id: item.id } }, 'sock');
    });

    it('creates a new item linked on its insert when none exists, using the current title fallback', async () => {
      const { trip } = ownerTrip();
      const res = createReservation(testDb, trip.id);
      budget.linkBudgetItemToReservation.mockReturnValue({ id: 31, reservation_id: res.id });
      await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), '', undefined, 'Old title', 'flight', { total_price: 120 }, 'sock');
      // One statement carries the link: no unlinked insert followed by a separate
      // back-link that a swallowed failure inside updateWithCost could leave half done.
      expect(budget.linkBudgetItemToReservation).toHaveBeenCalledWith(String(trip.id), res.id, { name: 'Old title', category: 'flight', total_price: 120 });
      expect(budget.createBudgetItem).not.toHaveBeenCalled();
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:created', { item: { id: 31, reservation_id: res.id } }, 'sock');
    });

    it('RESV-TX-001: updateWithCost rolls the booking edit back when its cost write fails', async () => {
      const { trip, res } = await linkedItem({ category: 'other' });
      await updateRows(orm, Reservations, { id: res.id }, { title: 'Old', type: 'other' });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      budget.updateBudgetItem.mockRejectedValueOnce(new Error('boom'));

      // other -> flight re-files the linked expense, and that write throws.
      await expect(svc.updateWithCost(String(res.id), String(trip.id), { title: 'New', type: 'flight' } as never, current, undefined))
        .rejects.toThrow('boom');

      expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ title: 'Old', type: 'other' });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('RESV-TX-006: updateWithCost rolls the booking edit back when the new price cannot be written', async () => {
      const { trip, res, item } = await linkedItem({ total_price: 100 });
      await updateRows(orm, Reservations, { id: res.id }, { title: 'Old' });
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      budget.updateBudgetItem.mockRejectedValueOnce(new Error('boom'));

      // Same type, so only the price path writes, and that write throws.
      await expect(svc.updateWithCost(String(res.id), String(trip.id), { title: 'New' } as never, current, { total_price: 250 }))
        .rejects.toThrow('boom');

      expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ title: 'Old' });
      expect(await findRow(orm, BudgetItems, { id: item.id })).toMatchObject({ total_price: 100 });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('RESV-TX-002: updateWithCost hands the cost events back instead of sending them inside the write', async () => {
      const { trip, res, item } = await linkedItem();
      const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
      budget.updateBudgetItem.mockReturnValue({ id: item.id });

      const out = await svc.updateWithCost(String(res.id), String(trip.id), { title: 'New' } as never, current, { total_price: 80 });

      expect(out.costEvents).toEqual([{ event: 'budget:updated', payload: { item: { id: item.id } } }]);
      expect(broadcast).not.toHaveBeenCalledWith(String(trip.id), 'budget:updated', expect.anything(), expect.anything());
      svc.announceCost(String(trip.id), out.costEvents, 'sock');
      expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'budget:updated', { item: { id: item.id } }, 'sock');
    });
  });

  describe('createWithCost', () => {
    it('RESV-TX-003: links the cost inside the booking write and hands its event back', async () => {
      const { trip } = ownerTrip();
      budget.linkBudgetItemToReservation.mockReturnValue({ id: 7 });

      const out = await svc.createWithCost(String(trip.id), { title: 'Hotel', type: 'other' } as never, { total_price: 200 });

      expect(budget.linkBudgetItemToReservation).toHaveBeenCalledWith(String(trip.id), out.reservation.id, { name: 'Hotel', category: 'other', total_price: 200 });
      expect(out.costEvents).toEqual([{ event: 'budget:created', payload: { item: { id: 7 } } }]);
      expect(broadcast).not.toHaveBeenCalledWith(String(trip.id), 'budget:created', expect.anything(), expect.anything());
    });

    it('RESV-TX-004: a failing cost rolls the new booking back with it', async () => {
      const { trip } = ownerTrip();
      budget.linkBudgetItemToReservation.mockRejectedValueOnce(new Error('boom'));

      await expect(svc.createWithCost(String(trip.id), { title: 'Hotel', type: 'other' } as never, { total_price: 200 }))
        .rejects.toThrow('boom');

      expect(await countRows(orm, Reservations, { trip: trip.id })).toBe(0);
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('RESV-TX-005: without a price there is no cost and no event', async () => {
      const { trip } = ownerTrip();
      const out = await svc.createWithCost(String(trip.id), { title: 'Dinner' } as never, undefined);
      expect(out.costEvents).toEqual([]);
      expect(budget.linkBudgetItemToReservation).not.toHaveBeenCalled();
    });
  });

  describe('notifyBookingChange', () => {
    it('sends the booking_change notification with the legacy payload (fire-and-forget)', async () => {
      const { user, trip } = ownerTrip();
      await expect(svc.notifyBookingChange(String(trip.id), user.id, 'Hotel', 'lodging')).resolves.not.toThrow();
      await vi.waitFor(() => expect(notif.send).toHaveBeenCalled());
      expect(notif.send).toHaveBeenCalledWith({
        event: 'booking_change',
        actorId: user.id,
        scope: 'trip',
        targetId: trip.id,
        params: { trip: trip.title, actor: user.email, booking: 'Hotel', type: 'lodging', tripId: String(trip.id) },
      });
    });

    it('is a silent no-op when the actor does not exist', async () => {
      const { trip } = ownerTrip();
      await svc.notifyBookingChange(String(trip.id), 999, 'Hotel', '');
      await new Promise(r => setTimeout(r, 10));
      expect(notif.send).not.toHaveBeenCalled();
    });
  });
});

describe('setReservationTravelers / loadTravelers (#1517)', () => {
  /** Create a named guest user (no credentials) and add it to the trip. */
  async function addGuest(tripId: number, displayName: string) {
    const { user } = createUser(testDb);
    await updateRows(orm, Users, { id: user.id }, { is_guest: 1, display_name: displayName });
    addTripMember(testDb, tripId, user.id);
    return user;
  }

  it('RES-TRAV-001: assigns trip members and returns them via loadTravelers', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const res = createReservation(testDb, trip.id);

    await svc.setReservationTravelers(res.id, trip.id, [member.id]);

    const travelers = await svc.loadTravelers(res.id);
    expect(travelers).toHaveLength(1);
    expect(travelers[0]).toMatchObject({ user_id: member.id, username: member.username, is_guest: 0 });
  });

  it('RES-TRAV-002: silently drops a user id that is not on the trip (cross-trip guard)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const res = createReservation(testDb, trip.id);

    // An outsider who belongs to a different trip only.
    const { user: outsider } = createUser(testDb);
    const otherTrip = createTrip(testDb, outsider.id);
    addTripMember(testDb, otherTrip.id, outsider.id);

    await svc.setReservationTravelers(res.id, trip.id, [member.id, outsider.id]);

    const ids = (await svc.loadTravelers(res.id)).map(t => t.user_id);
    expect(ids).toEqual([member.id]);
    expect(ids).not.toContain(outsider.id);
  });

  it('RES-TRAV-003: assigns a named guest (users.is_guest = 1) joined via trip_members', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guest = await addGuest(trip.id, 'Grandma');
    const res = createReservation(testDb, trip.id);

    await svc.setReservationTravelers(res.id, trip.id, [guest.id]);

    const travelers = await svc.loadTravelers(res.id);
    expect(travelers).toHaveLength(1);
    expect(travelers[0]).toMatchObject({ user_id: guest.id, username: 'Grandma', is_guest: 1 });
  });

  it('RES-TRAV-004: re-setting replaces the previous set', async () => {
    const { user: owner } = createUser(testDb);
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, a.id);
    addTripMember(testDb, trip.id, b.id);
    const res = createReservation(testDb, trip.id);

    await svc.setReservationTravelers(res.id, trip.id, [a.id]);
    expect((await svc.loadTravelers(res.id)).map(t => t.user_id)).toEqual([a.id]);

    await svc.setReservationTravelers(res.id, trip.id, [b.id]);
    const ids = (await svc.loadTravelers(res.id)).map(t => t.user_id);
    expect(ids).toEqual([b.id]);
    expect(ids).not.toContain(a.id);

    // Clearing removes everyone.
    await svc.setReservationTravelers(res.id, trip.id, []);
    expect(await svc.loadTravelers(res.id)).toHaveLength(0);
  });

  it('RES-TRAV-005: list attaches travelers[] per reservation', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const withTravelers = createReservation(testDb, trip.id, { title: 'Flight' });
    const withoutTravelers = createReservation(testDb, trip.id, { title: 'Hotel' });

    await await svc.setReservationTravelers(withTravelers.id, trip.id, [member.id]);

    const list = await (await svc.list(trip.id));
    const assigned = list.find(r => r.id === withTravelers.id)!;
    const empty = list.find(r => r.id === withoutTravelers.id)!;

    expect(assigned.travelers).toHaveLength(1);
    expect(assigned.travelers![0]).toMatchObject({ user_id: member.id, username: member.username });
    expect(empty.travelers).toEqual([]);
  });
});

describe('ReservationsService — the surface the deleted bridge exposed', () => {
  it('RESV-BRIDGE-001: listReservations delegates to ReservationsService.list', async () => {
    const { trip } = ownerTrip();
    createReservation(testDb, trip.id, { title: 'A' });
    expect((await bridge.listReservations(trip.id)).map(r => r.title)).toEqual(['A']);
  });

  it('RESV-BRIDGE-002: loadEndpointsByTrip groups endpoints per reservation', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id);
    await insertRow(orm, ReservationEndpoints, { reservation: res.id, role: 'from', sequence: 0, name: 'A', lat: 1, lng: 2 });
    const map = await bridge.loadEndpointsByTrip(trip.id);
    expect(map.get(res.id)).toHaveLength(1);
  });

  it('RESV-BRIDGE-003: resyncReservationDays re-anchors through the bridge', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const res = createReservation(testDb, trip.id, { title: 'T', type: 'tour', day_id: days[0].id });
    await updateRows(orm, Reservations, { id: res.id }, { reservation_time: '2030-05-02T09:00:00' });
    await bridge.resyncReservationDays(trip.id);
    expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ day_id: days[1].id });
  });

  it('RESV-BRIDGE-004: createReservation creates through the bridge', async () => {
    const { trip } = ownerTrip();
    const { reservation } = await bridge.createReservation(trip.id, { title: 'Bridge' });
    expect(reservation).toMatchObject({ title: 'Bridge', type: 'other' });
  });

  it('RESV-BRIDGE-005: getReservation is trip-scoped', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id);
    expect(await bridge.getReservation(res.id, trip.id)).toMatchObject({ id: res.id });
    expect(await bridge.getReservation(res.id, trip.id + 1)).toBeUndefined();
  });

  it('RESV-BRIDGE-006: getReservationWithJoins attaches endpoints + travelers', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id);
    expect(await bridge.getReservationWithJoins(res.id)).toMatchObject({ id: res.id, endpoints: [], travelers: [] });
  });

  it('RESV-BRIDGE-007: updateReservation updates through the bridge', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id, { title: 'Old' });
    const current = (await bridge.getReservation(res.id, trip.id))!;
    const { reservation } = await bridge.updateReservation(res.id, trip.id, { title: 'New' }, current);
    expect(reservation.title).toBe('New');
  });

  it('RESV-BRIDGE-008: deleteReservation deletes through the bridge', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id);
    const { deleted } = await bridge.deleteReservation(res.id, trip.id);
    expect(deleted).toMatchObject({ id: res.id });
    expect(await bridge.getReservation(res.id, trip.id)).toBeUndefined();
  });

  it('RESV-BRIDGE-009: notifyBookingChange fires the notification through the bridge', async () => {
    const { user, trip } = ownerTrip();
    await bridge.notifyBookingChange(trip.id, user.id, 'Bridge booking', 'other');
    await vi.waitFor(() => expect(notif.send).toHaveBeenCalled());
  });
});

describe('ReservationsService — legacy branch parity (coverage of the folded conditionals)', () => {
  it('RESV-SVC-019: create with a linked accommodation_id syncs metadata times + confirmation onto it', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const place = createPlace(testDb, trip.id);
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    await svc.create(String(trip.id), {
      title: 'Hotel', type: 'hotel', accommodation_id: acc.id,
      metadata: { check_in_time: '15:00', check_out_time: '11:00' },
      confirmation_number: 'CN-1',
    });
    const row = await findRow(orm, DayAccommodations, { id: acc.id });
    expect(row).toMatchObject({ check_in: '15:00', check_out: '11:00', confirmation: 'CN-1' });
  });

  it('RESV-SVC-020: create with a malformed reservation_time derives no day', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const { reservation } = await svc.create(String(trip.id), { title: 'X', type: 'tour', reservation_time: 'not-a-date' });
    expect(reservation.day_id).toBeNull();
  });

  it('RESV-SVC-021: hotel update with create_accommodation updates the linked accommodation in place', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
    const place = createPlace(testDb, trip.id);
    const place2 = createPlace(testDb, trip.id, { name: 'Other Hotel' });
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id) });
    const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    const { accommodationChanged } = await svc.update(String(res.id), String(trip.id), {
      type: 'hotel',
      create_accommodation: { place_id: place2.id, start_day_id: days[1].id, end_day_id: days[2].id, check_in: '14:00' },
      confirmation_number: 'CN-2',
    }, current);
    expect(accommodationChanged).toBe(true);
    const row = await findRow(orm, DayAccommodations, { id: acc.id });
    expect(row).toMatchObject({ place_id: place2.id, start_day_id: days[1].id, end_day_id: days[2].id, check_in: '14:00', confirmation: 'CN-2' });
  });

  it('RESV-SVC-022: hotel update inserts a new accommodation when none is linked and a place is given', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const place = createPlace(testDb, trip.id);
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    const { reservation, accommodationChanged } = await svc.update(String(res.id), String(trip.id), {
      type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[1].id },
    }, current);
    expect(accommodationChanged).toBe(true);
    expect(reservation.accommodation_id).not.toBeNull();
    expect(({ c: await countRows(orm, DayAccommodations, { trip: trip.id }) })).toEqual({ c: 1 });
  });

  it('RESV-SVC-023: explicit update fields bind their values; empty strings null; absent fields keep current', async () => {
    const { trip } = ownerTrip();
    const place = createPlace(testDb, trip.id);
    const res = createReservation(testDb, trip.id, { title: 'T', type: 'tour' });
    await updateRows(orm, Reservations, { id: res.id }, { location: 'Loc', notes: 'N', url: 'U', confirmation_number: 'C' });
    let current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    let { reservation } = await svc.update(String(res.id), String(trip.id), {
      location: 'NewLoc', notes: '', url: 'https://x', confirmation_number: 'NEW',
      status: 'confirmed', needs_review: true, metadata: { a: 1 }, place_id: place.id,
    }, current);
    expect(reservation).toMatchObject({
      location: 'NewLoc', notes: null, url: 'https://x', confirmation_number: 'NEW',
      status: 'confirmed', needs_review: 1, metadata: JSON.stringify({ a: 1 }), place_id: place.id,
    });
    current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    ({ reservation } = await svc.update(String(res.id), String(trip.id), { title: 'T2' }, current));
    expect(reservation).toMatchObject({ title: 'T2', location: 'NewLoc', url: 'https://x', place_id: place.id });
  });

  it('RESV-SVC-024: explicit day_id / end_day_id updates win over derivation; explicit null end clears', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const res = createReservation(testDb, trip.id, { title: 'T', type: 'tour' });
    let current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    let { reservation } = await svc.update(String(res.id), String(trip.id), { day_id: days[1].id, end_day_id: days[2].id }, current);
    expect(reservation).toMatchObject({ day_id: days[1].id, end_day_id: days[2].id });
    current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    ({ reservation } = await svc.update(String(res.id), String(trip.id), { end_day_id: null, reservation_end_time: '2030-05-02T18:00:00' }, current));
    // explicit end_day_id null wins over the end-time derivation
    expect(reservation.end_day_id).toBeNull();
    current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    ({ reservation } = await svc.update(String(res.id), String(trip.id), { reservation_end_time: '2030-05-02T18:00:00' }, current));
    // no explicit end day + an end time -> derived
    expect(reservation.end_day_id).toBe(days[1].id);
  });

  it('RESV-SVC-025: with metadata absent, the stored metadata JSON drives the accommodation sync (confirmation falls back to current)', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const place = createPlace(testDb, trip.id);
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id);
    const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id), metadata: JSON.stringify({ check_in_time: '16:00' }), confirmation_number: 'KEEP' });
    const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    await svc.update(String(res.id), String(trip.id), { notes: 'touch' }, current);
    const row = await findRow(orm, DayAccommodations, { id: acc.id });
    expect(row).toMatchObject({ check_in: '16:00', confirmation: 'KEEP' });
  });

  it('H1 (Plan 3h Task 7 review) — patchTimes: updating a linked reservation OVERRIDES the stay\'s existing non-null check-in/end/out — the new value wins, matching legacy COALESCE(?, col)', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const place = createPlace(testDb, trip.id);
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    // The stay already holds a DIFFERENT, non-null value on every column the
    // sync touches — if `coalesceParam`'s (existing-wins) direction were used
    // instead of `coalesceOverride`'s (new-wins), the stay would keep these.
    const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id, {
      check_in: '14:00', check_out: '10:00',
    });
    await updateRows(orm, DayAccommodations, { id: acc.id }, { check_in_end: '10:00' });
    const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id), metadata: JSON.stringify({ check_in_time: '16:30', check_in_end_time: '11:15', check_out_time: '09:00' }) });
    const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    // Touch an unrelated field so the metadata sync runs off the stored
    // (already new) metadata, same shape as RESV-SVC-025.
    await svc.update(String(res.id), String(trip.id), { notes: 'touch' }, current);
    const row = await findRow(orm, DayAccommodations, { id: acc.id });
    expect(row).toMatchObject({ check_in: '16:30', check_in_end: '11:15', check_out: '09:00' });
  });

  it('H1 (Plan 3h Task 7 review) — patchConfirmation: updating a linked reservation OVERRIDES the stay\'s existing non-null confirmation — the new value wins, matching legacy COALESCE(?, confirmation)', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const place = createPlace(testDb, trip.id);
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    // The stay already holds a DIFFERENT, non-null confirmation — if
    // `coalesceParam`'s (existing-wins) direction were used instead of
    // `coalesceOverride`'s (new-wins), the stay would keep it.
    const acc = createDayAccommodation(testDb, trip.id, place.id, days[0].id, days[1].id, { confirmation: 'ACC-OLD' });
    const res = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id), metadata: JSON.stringify({}), confirmation_number: 'RES-NEW' });
    const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    await svc.update(String(res.id), String(trip.id), { notes: 'touch' }, current);
    const row = await findRow(orm, DayAccommodations, { id: acc.id });
    expect(row).toMatchObject({ confirmation: 'RES-NEW' });
  });

  it('RESV-SVC-026: resync derives the end day too, keeping the stored one when the end time is out of range', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    const res = createReservation(testDb, trip.id, { title: 'T', type: 'tour', day_id: days[0].id });
    await updateRows(orm, Reservations, { id: res.id }, { reservation_time: '2030-05-02T09:00:00', reservation_end_time: '2031-01-01T09:00:00', endDay: days[0].id });
    await svc.resyncReservationDays(String(trip.id));
    // start re-anchored to day 2; out-of-range end time keeps the stored end day
    expect(await findRow(orm, Reservations, { id: res.id }))
      .toMatchObject({ day_id: days[1].id, end_day_id: days[0].id });
    // A booking already on the right day is left untouched (no-change skip).
    await svc.resyncReservationDays(String(trip.id));
    expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ day_id: days[1].id });
  });

  it('RESV-SVC-027: listUpcoming includes a timeless reservation whose day is in the future', async () => {
    const { user, trip } = ownerTrip();
    const day = createDay(testDb, trip.id, { date: '2999-06-01' });
    createReservation(testDb, trip.id, { title: 'Timeless', day_id: day.id });
    const rows = (await svc.listUpcoming(user.id)) as { title: string }[];
    expect(rows.map(r => r.title)).toContain('Timeless');
  });

  it('RESV-SVC-028: list merges multiple per-day positions for one reservation', async () => {
    const { trip } = ownerTrip();
    const d1 = createDay(testDb, trip.id, { date: '2030-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2030-05-02' });
    const res = createReservation(testDb, trip.id);
    await insertRow(orm, ReservationDayPositions, { reservation: res.id, day: d1.id, position: 0 });
    await insertRow(orm, ReservationDayPositions, { reservation: res.id, day: d2.id, position: 3 });
    const [row] = await svc.list(String(trip.id));
    expect(row.day_positions).toEqual({ [d1.id]: 0, [d2.id]: 3 });
  });

  it('RESV-SVC-029: notifyBookingChange falls back to "Untitled" and type "booking"', async () => {
    const { user } = createUser(testDb);
    await svc.notifyBookingChange('424242', user.id, 'B', '');
    await vi.waitFor(() => expect(notif.send).toHaveBeenCalled());
    expect(notif.send).toHaveBeenCalledWith(expect.objectContaining({
      params: expect.objectContaining({ trip: 'Untitled', type: 'booking' }),
    }));
  });

  it('RESV-SVC-030: syncBudgetOnUpdate type-change sync is a no-op without a linked item or when the category was hand-picked', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id);
    // no linked item at all
    await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'other', undefined, undefined);
    expect(budget.updateBudgetItem).not.toHaveBeenCalled();
    // linked item whose category no longer matches the auto-derived one
    const item = createBudgetItem(testDb, trip.id, { category: 'Hand picked' });
    await updateRows(orm, BudgetItems, { id: item.id }, { reservation: res.id });
    await svc.syncBudgetOnUpdate(String(trip.id), String(res.id), 'X', 'flight', 'X', 'other', undefined, undefined);
    expect(budget.updateBudgetItem).not.toHaveBeenCalled();
    // explicit clear with no linked item deletes nothing
    await svc.syncBudgetOnUpdate(String(trip.id), '999999', 'X', 'flight', 'X', 'flight', { total_price: 0 }, undefined);
    expect(budget.deleteBudgetItem).not.toHaveBeenCalled();
  });

  it('RESV-SVC-031: list returns staged bookings, the staging inbox has to see its own rows', async () => {
    const { trip } = ownerTrip();
    createReservation(testDb, trip.id, { title: 'Live One' });
    const staged = createReservation(testDb, trip.id, { title: 'Parked One' });
    await updateRows(orm, Reservations, { id: staged.id }, { ingest_state: 'staged' });

    // The visibility predicate belongs to the anonymous exports (ICS feed,
    // shared trip) and must never be pulled into the authenticated list, or
    // nobody can confirm what the ingest parked.
    expect((await svc.list(String(trip.id))).map((r: any) => r.title).sort()).toEqual(['Live One', 'Parked One']);
  });
});

describe('ReservationsService — quirk fixes (post-fold)', () => {
  it('RESV-FIX-001: create is atomic — a failing endpoint save rolls back the reservation AND the auto-created accommodation', async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-02' });
    const place = createPlace(testDb, trip.id);
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    // Plan 3d Task 2 (§15a): `sequence: {}` (an unbindable object) no longer
    // throws once RS17 goes through `em.insert()` — MikroORM serialises it
    // instead of handing it to a raw bind. A repository-level spy
    // reproduces the same "the write mid-transaction fails" shape the fault
    // injection existed to prove, still inside the SAME `uow.transactional`
    // this test's rollback assertion depends on.
    const endpointsRepo = await createTestReservationEndpointsRepo(testDb);
    const spy = vi.spyOn(endpointsRepo, 'insertEndpoint').mockRejectedValueOnce(new Error('boom'));
    const badEndpoints = [{ role: 'from', name: 'A', code: null, lat: 1, lng: 2, timezone: null, local_time: null, local_date: null }];
    await expect(svc.create(String(trip.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[1].id },
      endpoints: badEndpoints,
    } as never)).rejects.toThrow();
    expect(({ c: await countRows(orm, Reservations, { trip: trip.id }) })).toEqual({ c: 0 });
    expect(({ c: await countRows(orm, DayAccommodations, { trip: trip.id }) })).toEqual({ c: 0 });
    spy.mockRestore();
  });

  it('RESV-FIX-002: update is atomic — a failing endpoint save rolls back the field update', async () => {
    const { trip } = ownerTrip();
    const res = createReservation(testDb, trip.id, { title: 'Old' });
    const current = (await svc.getReservation(String(res.id), String(trip.id)))!;
    const endpointsRepo = await createTestReservationEndpointsRepo(testDb);
    const spy = vi.spyOn(endpointsRepo, 'insertEndpoint').mockRejectedValueOnce(new Error('boom'));
    const badEndpoints = [{ role: 'from', name: 'A', code: null, lat: 1, lng: 2, timezone: null, local_time: null, local_date: null }];
    await expect(svc.update(String(res.id), String(trip.id), { title: 'New', endpoints: badEndpoints } as never, current)).rejects.toThrow();
    expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ title: 'Old' });
    spy.mockRestore();
  });
});

describe('ReservationsService — referenced ids stay inside the trip', () => {
  /** Attacker's trip and a victim trip they are not a member of. */
  function twoTrips() {
    const { user: attacker } = createUser(testDb);
    const { user: victim } = createUser(testDb, { email: 'victim@example.test' });
    const mine = createTrip(testDb, attacker.id, { start_date: '2030-05-01', end_date: '2030-05-03' });
    const theirs = createTrip(testDb, victim.id, { start_date: '2030-05-01', end_date: '2030-05-03' });
    return { mine, theirs };
  }

  it('RESV-SCOPE-001: names every foreign id in the body', async () => {
    const { mine, theirs } = twoTrips();
    const foreignPlace = createPlace(testDb, theirs.id);
    const foreignDay = await findRow(orm, Days, { trip: theirs.id }) as { id: number };
    const foreignAcc = createDayAccommodation(testDb, theirs.id, foreignPlace.id, foreignDay.id, foreignDay.id);

    expect(await svc.referencesOutsideTrip(String(mine.id), {
      title: 'x', day_id: foreignDay.id, place_id: foreignPlace.id, accommodation_id: foreignAcc.id,
    })).toEqual(['day_id', 'place_id', 'accommodation_id']);
  });

  it('RESV-SCOPE-005: a dangling id is not an offender, so the booking stays editable', async () => {
    const { mine } = twoTrips();
    const place = createPlace(testDb, mine.id);
    const day = await findRow(orm, Days, { trip: mine.id }) as { id: number };
    const acc = createDayAccommodation(testDb, mine.id, place.id, day.id, day.id);
    const res = createReservation(testDb, mine.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id) });
    // What shortening the trip's date range does: the day goes, the cascade
    // takes the accommodation with it, and the reservation keeps the id.
    await deleteRows(orm, DayAccommodations, { id: acc.id });

    expect(await svc.referencesOutsideTrip(String(mine.id), { title: 'x', accommodation_id: acc.id })).toEqual([]);

    const current = (await svc.getReservation(String(res.id), String(mine.id)))!;
    await svc.update(String(res.id), String(mine.id), { accommodation_id: acc.id, title: 'Hotel renamed' } as never, current);
    expect(await findRow(orm, Reservations, { id: res.id }))
      .toMatchObject({ title: 'Hotel renamed', accommodation_id: null });
  });

  it('RESV-SCOPE-002: passes a body whose ids all live in the trip', async () => {
    const { mine } = twoTrips();
    const place = createPlace(testDb, mine.id);
    const day = await findRow(orm, Days, { trip: mine.id }) as { id: number };

    expect(await svc.referencesOutsideTrip(String(mine.id), { title: 'x', day_id: day.id, place_id: place.id })).toEqual([]);
    expect(await svc.referencesOutsideTrip(String(mine.id), { title: 'x' })).toEqual([]);
  });

  it('RESV-SCOPE-003: a stored foreign accommodation_id is not deleted with the reservation', async () => {
    const { mine, theirs } = twoTrips();
    const foreignPlace = createPlace(testDb, theirs.id);
    const foreignDay = await findRow(orm, Days, { trip: theirs.id }) as { id: number };
    const foreignAcc = createDayAccommodation(testDb, theirs.id, foreignPlace.id, foreignDay.id, foreignDay.id);
    // A row from before the check existed: it already carries the foreign id.
    const res = createReservation(testDb, mine.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(foreignAcc.id) });

    const { accommodationDeleted } = await svc.remove(String(res.id), String(mine.id));

    expect(accommodationDeleted).toBe(false);
    expect(await findRow(orm, DayAccommodations, { id: foreignAcc.id })).toBeTruthy();
  });

  it('RESV-SCOPE-004: an update carrying a foreign accommodation_id does not write through to it', async () => {
    const { mine, theirs } = twoTrips();
    const foreignPlace = createPlace(testDb, theirs.id);
    const foreignDay = await findRow(orm, Days, { trip: theirs.id }) as { id: number };
    const foreignAcc = createDayAccommodation(testDb, theirs.id, foreignPlace.id, foreignDay.id, foreignDay.id, { check_in: '14:00' });
    const res = createReservation(testDb, mine.id, { title: 'Hotel', type: 'hotel' });
    const current = (await svc.getReservation(String(res.id), String(mine.id)))!;

    await svc.update(String(res.id), String(mine.id), {
      accommodation_id: foreignAcc.id, metadata: { check_in_time: '23:00' },
    } as never, current);

    expect(await findRow(orm, DayAccommodations, { id: foreignAcc.id })).toMatchObject({ check_in: '14:00' });
    expect(await findRow(orm, Reservations, { id: res.id })).toMatchObject({ accommodation_id: null });
  });

  /** A row from before the foreign keys, or from a window where they were off:
   *  the only way to plant one today is the way it got there. */
  function withForeignKeysOff(plant: () => void) {
    testDb.exec('PRAGMA foreign_keys = OFF');
    try { plant(); } finally { testDb.exec('PRAGMA foreign_keys = ON'); }
  }

  it('RESV-SCOPE-006: an id that resolves to nothing is named too, accommodation_id excepted', async () => {
    const { mine } = twoTrips();
    const gone = 999999;

    expect(await svc.unresolvedReferences(String(mine.id), {
      title: 'x', type: 'hotel',
      day_id: gone, end_day_id: gone, place_id: gone, assignment_id: gone, accommodation_id: gone,
      create_accommodation: { place_id: gone, start_day_id: gone, end_day_id: gone },
    })).toEqual([
      'day_id', 'end_day_id', 'place_id', 'assignment_id',
      'create_accommodation.place_id', 'create_accommodation.start_day_id', 'create_accommodation.end_day_id',
    ]);
  });

  it('RESV-SCOPE-007: ids on the trip pass, and a falsy one is not a reference at all', async () => {
    const { mine } = twoTrips();
    const place = createPlace(testDb, mine.id);
    const day = await findRow(orm, Days, { trip: mine.id }) as { id: number };
    const assignment = createDayAssignment(testDb, day.id, place.id);

    expect(await svc.unresolvedReferences(String(mine.id), {
      title: 'x', type: 'hotel',
      day_id: day.id, end_day_id: day.id, place_id: place.id, assignment_id: assignment.id,
      create_accommodation: { place_id: place.id, start_day_id: day.id, end_day_id: day.id },
    })).toEqual([]);
    // The write paths coerce these to NULL before they reach SQL, so naming
    // them would 400 a body that stores a null today.
    expect(await svc.unresolvedReferences(String(mine.id), { title: 'x', day_id: 0, end_day_id: 0, place_id: 0, assignment_id: 0 })).toEqual([]);
    // Only a hotel booking writes the stay row.
    expect(await svc.unresolvedReferences(String(mine.id), {
      title: 'x', type: 'flight', create_accommodation: { place_id: 999999, start_day_id: 999999, end_day_id: 999999 },
    })).toEqual([]);
    // A stay without a place is a state the booking form writes.
    expect(await svc.unresolvedReferences(String(mine.id), {
      title: 'x', type: 'hotel', create_accommodation: { start_day_id: day.id, end_day_id: day.id },
    })).toEqual([]);
  });

  it('RESV-SCOPE-008: an id from another trip is named by both guards, so the older one answers first', async () => {
    const { mine, theirs } = twoTrips();
    const foreignPlace = createPlace(testDb, theirs.id);
    const body = { title: 'x', place_id: foreignPlace.id };

    expect(await svc.referencesOutsideTrip(String(mine.id), body)).toEqual(['place_id']);
    expect(await svc.unresolvedReferences(String(mine.id), body)).toEqual(['place_id']);
  });

  it('RESV-SCOPE-009: an update heals the stored ids whose rows are gone instead of failing on them', async () => {
    const { mine } = twoTrips();
    const res = createReservation(testDb, mine.id, { title: 'Dinner' });
    withForeignKeysOff(() => {
      // test-sql-allow: plants dangling references inside the synchronous foreign_keys = OFF window, which an async ORM write would outlive.
      testDb.prepare('UPDATE reservations SET day_id = ?, end_day_id = ?, place_id = ?, assignment_id = ? WHERE id = ?')
        .run(999999, 999998, 999997, 999996, res.id);
    });
    const current = (await svc.getReservation(String(res.id), String(mine.id)))!;

    // The body names none of them, so the statement rebinds what the row holds.
    await svc.update(String(res.id), String(mine.id), { title: 'Dinner, later' }, current);

    expect(await findRow(orm, Reservations, { id: res.id }))
      .toMatchObject({ title: 'Dinner, later', day_id: null, end_day_id: null, place_id: null, assignment_id: null });
  });

  it('RESV-SCOPE-010: a supplied id that resolves to nothing is stored as NULL, on create and on update', async () => {
    const { mine } = twoTrips();
    const { reservation } = await svc.create(String(mine.id), {
      title: 'Dinner', day_id: 999999, end_day_id: 999998, place_id: 999997, assignment_id: 999996,
    });
    expect(await findRow(orm, Reservations, { id: reservation.id }))
      .toMatchObject({ day_id: null, end_day_id: null, place_id: null, assignment_id: null });

    const current = (await svc.getReservation(String(reservation.id), String(mine.id)))!;
    await svc.update(String(reservation.id), String(mine.id), { place_id: 999997 }, current);
    expect(await findRow(orm, Reservations, { id: reservation.id })).toMatchObject({ place_id: null });
  });

  it('RESV-SCOPE-011: a stay whose refs resolve to nothing is refused, never written and never dropped in silence', async () => {
    const { mine } = twoTrips();
    const place = createPlace(testDb, mine.id);
    const days = await findRows(orm, Days, { trip: mine.id }, { day_number: 'asc' }) as { id: number }[];

    await expect(svc.create(String(mine.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { place_id: 999999, start_day_id: 999998, end_day_id: 999997 },
    })).rejects.toThrow('Unknown reference: create_accommodation.place_id, create_accommodation.start_day_id, create_accommodation.end_day_id');
    expect(({ c: await countRows(orm, DayAccommodations, { trip: mine.id }) })).toEqual({ c: 0 });
    expect(({ c: await countRows(orm, Reservations, { trip: mine.id }) })).toEqual({ c: 0 });

    // On an existing stay the edit is refused rather than skipped: dropping it
    // would leave the caller with a 200 and the old dates.
    const acc = createDayAccommodation(testDb, mine.id, place.id, days[0].id, days[1].id);
    const res = createReservation(testDb, mine.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(acc.id) });
    const current = (await svc.getReservation(String(res.id), String(mine.id)))!;

    await expect(svc.update(String(res.id), String(mine.id), {
      type: 'hotel', create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: 999999 },
    }, current)).rejects.toThrow('Unknown reference: create_accommodation.end_day_id');
    expect(await findRow(orm, DayAccommodations, { id: acc.id })).toMatchObject({ end_day_id: days[1].id });
  });

  it('RESV-SCOPE-012: a stay booked without a place is still written', async () => {
    const { mine } = twoTrips();
    const days = await findRows(orm, Days, { trip: mine.id }, { day_number: 'asc' }) as { id: number }[];

    const { reservation, accommodationCreated } = await svc.create(String(mine.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { start_day_id: days[0].id, end_day_id: days[1].id, check_in: '15:00' },
    });

    expect(accommodationCreated).toBe(true);
    expect(await findRow(orm, DayAccommodations, { id: Number(reservation.accommodation_id) }))
      .toMatchObject({ place_id: null, start_day_id: days[0].id });
  });

  it('RESV-SCOPE-013: the refusal carries the 400 the write surfaces send, not a status the filter has to guess', async () => {
    const { mine } = twoTrips();

    // The write surfaces name the field before the service ever sees it, so the
    // class only matters to whoever reaches this floor without one. It answers
    // as they do — the filter passes a 400 through and keeps the message, where
    // a class it cannot place would become 'Internal server error' (#2355).
    let thrown: unknown;
    try {
      await svc.create(String(mine.id), {
        title: 'Hotel', type: 'hotel',
        create_accommodation: { start_day_id: 999998, end_day_id: 999997 },
      });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(400);
    expect((thrown as HttpException).message)
      .toBe('Unknown reference: create_accommodation.start_day_id, create_accommodation.end_day_id');
  });
});

describe('the day stop a hotel booking implies', () => {
  // Booking a night on this form is booking a night: it shows in the day header
  // exactly like one entered under Days, and road trip mode draws the same booking
  // as a service stop instead. Before this the booking form was the one door that
  // wrote the stay without the stop, so a hotel entered here was invisible to the
  // drive and had to be added a second time as an ordinary place.
  const stopsOn = async (dayId: number) =>
    (await findRows(orm, DayAssignments, { day: dayId }, { order_index: 'asc' }))
      .map(({ id, place_id, accommodation_id }) => ({ id, place_id, accommodation_id: accommodation_id ?? null }));
  const tripWithDays = async () => {
    const { trip } = ownerTrip({ start_date: '2030-05-01', end_date: '2030-05-03' });
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' }) as { id: number }[];
    return { trip, days };
  };

  it('RESV-STAY-001: a hotel booked on the form lands on its check-in day', async () => {
    const { trip, days } = await tripWithDays();
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });

    const { reservation } = await svc.create(String(trip.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[2].id },
    });

    expect(await stopsOn(days[0].id)).toEqual([expect.objectContaining({ place_id: place.id, accommodation_id: Number(reservation.accommodation_id) })]);
    // Typed as lodging, so the road trip draws it as the service stop it is.
    expect(await findRow(orm, Places, { id: place.id })).toMatchObject({ stop_type: 'hotel' });
    // Only the check-in day, the same as every other door.
    expect(await stopsOn(days[2].id)).toEqual([]);
  });

  it('RESV-STAY-002: a booking that is not a hotel puts nothing on the plan', async () => {
    const { trip, days } = await tripWithDays();
    await svc.create(String(trip.id), { title: 'Museum tour', type: 'tour', day_id: days[0].id });
    expect(await stopsOn(days[0].id)).toEqual([]);
  });

  it('RESV-STAY-003: moving the booking to another day takes its stop along', async () => {
    const { trip, days } = await tripWithDays();
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { reservation } = await svc.create(String(trip.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[0].id },
    });
    const current = (await svc.getReservation(String(reservation.id), String(trip.id)))!;

    await svc.update(String(reservation.id), String(trip.id), {
      type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[1].id, end_day_id: days[2].id },
    } as never, current);

    // Left behind it would sit on a day nobody sleeps there, hidden from the day
    // list because it still carries this booking's id.
    expect(await stopsOn(days[0].id)).toEqual([]);
    expect(await stopsOn(days[1].id)).toEqual([expect.objectContaining({ place_id: place.id, accommodation_id: Number(reservation.accommodation_id) })]);
  });

  it('RESV-STAY-004: an edit that first creates the stay writes the stop too', async () => {
    // A booking saved without a date range, then given one. resolvedAccId is null on
    // the way in, so this takes the insert branch rather than the update branch.
    const { trip, days } = await tripWithDays();
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { reservation } = await svc.create(String(trip.id), { title: 'Hotel', type: 'hotel' });
    const current = (await svc.getReservation(String(reservation.id), String(trip.id)))!;

    await svc.update(String(reservation.id), String(trip.id), {
      type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[1].id, end_day_id: days[1].id },
    } as never, current);

    const stay = await findRow(orm, DayAccommodations, { trip: trip.id }) as { id: number };
    expect(await stopsOn(days[1].id)).toEqual([expect.objectContaining({ place_id: place.id, accommodation_id: stay.id })]);
  });

  it('RESV-STAY-005: deleting the booking takes the stop with the stay', async () => {
    const { trip, days } = await tripWithDays();
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { reservation } = await svc.create(String(trip.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[0].id },
    });

    const { accommodationDeleted } = await svc.remove(String(reservation.id), String(trip.id));

    expect(accommodationDeleted).toBe(true);
    // A stop still carrying a dead booking's id is one the day list hides and
    // nobody can reach to remove.
    expect(await stopsOn(days[0].id)).toEqual([]);
  });

  it('RESV-STAY-006: a place the traveller already planned that day keeps its own row', async () => {
    const { trip, days } = await tripWithDays();
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const own = await insertRow(orm, DayAssignments, { day: days[0].id, place: place.id, order_index: 0 });

    const { reservation } = await svc.create(String(trip.id), {
      title: 'Hotel', type: 'hotel',
      create_accommodation: { place_id: place.id, start_day_id: days[0].id, end_day_id: days[0].id },
    });

    // No second row, and the booking claims neither: cancelling it must not delete
    // a stop the traveller placed.
    expect(await stopsOn(days[0].id)).toEqual([{ id: own, place_id: place.id, accommodation_id: null }]);
    await svc.remove(String(reservation.id), String(trip.id));
    expect(await stopsOn(days[0].id)).toHaveLength(1);
  });

  it('RESV-STAY-008: a save from the booking form re-seats the night only when its check-in changed', async () => {
    // The form sends the whole stay on every save, check-in included, so this is the
    // door a title edit on a hotel booking comes through. Its own reading of "the
    // check-in changed" (the prior row, read before the write) decides whether a night
    // the traveller dragged is left alone or seated afresh, the way ACC-022g pins it
    // for the stay route.
    const { trip, days } = await tripWithDays();
    const [harbour, market, hotel] = ['Hafen', 'Markt', 'Rostock'].map(name => createPlace(testDb, trip.id, { name }));
    createDayAssignment(testDb, days[0].id, harbour.id);
    createDayAssignment(testDb, days[0].id, market.id);
    const stay = (check_in: string) => ({ place_id: hotel.id, start_day_id: days[0].id, end_day_id: days[0].id, check_in });
    const { reservation } = await svc.create(String(trip.id), { title: 'Hotel', type: 'hotel', create_accommodation: stay('15:00') });
    const order = async () => (await stopsOn(days[0].id)).map(s => s.place_id);
    expect(await order()).toEqual([hotel.id, harbour.id, market.id]);

    // Dragged to the end of the day by hand.
    const own = (await stopsOn(days[0].id)).find(s => s.place_id === hotel.id)!;
    for (const s of await findRows(orm, DayAssignments, { day: days[0].id, order_index: { $gt: 0 } })) {
      await updateRows(orm, DayAssignments, { id: s.id }, { order_index: s.order_index - 1 });
    }
    await updateRows(orm, DayAssignments, { id: own.id }, { order_index: 2 });
    expect(await order()).toEqual([harbour.id, market.id, hotel.id]);

    vi.clearAllMocks();
    let current = (await svc.getReservation(String(reservation.id), String(trip.id)))!;
    await svc.update(String(reservation.id), String(trip.id), { title: 'Hotel, late arrival', type: 'hotel', create_accommodation: stay('15:00') } as never, current);
    expect(await order()).toEqual([harbour.id, market.id, hotel.id]);
    expect(broadcast).not.toHaveBeenCalledWith(String(trip.id), 'assignment:moved', expect.anything());

    current = (await svc.getReservation(String(reservation.id), String(trip.id)))!;
    await svc.update(String(reservation.id), String(trip.id), { type: 'hotel', create_accommodation: stay('10:00') } as never, current);
    expect(await order()).toEqual([hotel.id, harbour.id, market.id]);
    expect((await stopsOn(days[0].id)).map(s => s.id)).toContain(own.id);
    expect(broadcast).toHaveBeenCalledWith(String(trip.id), 'assignment:moved', expect.objectContaining({ assignment: expect.objectContaining({ id: own.id }) }));
  });

  it('RESV-STAY-007: a foreign accommodation_id reaches no stop on the other trip', async () => {
    // The trip_id guard on the stay delete is what denies that reach; the stops go
    // by accommodation id alone and would otherwise follow it straight over.
    const { user: attacker } = createUser(testDb);
    const { user: victim } = createUser(testDb, { email: 'victim@example.test' });
    const mine = createTrip(testDb, attacker.id, { start_date: '2030-05-01', end_date: '2030-05-03' });
    const theirs = createTrip(testDb, victim.id, { start_date: '2030-05-01', end_date: '2030-05-03' });
    const foreignPlace = createPlace(testDb, theirs.id, { name: 'Their hotel' });
    const foreignDay = await findRow(orm, Days, { trip: theirs.id }) as { id: number };
    const foreignAcc = createDayAccommodation(testDb, theirs.id, foreignPlace.id, foreignDay.id, foreignDay.id);
    const theirStop = await insertRow(orm, DayAssignments, { day: foreignDay.id, place: foreignPlace.id, order_index: 0, accommodation_id: foreignAcc.id });
    const res = createReservation(testDb, mine.id, { title: 'Hotel', type: 'hotel' });
    await updateRows(orm, Reservations, { id: res.id }, { accommodation_id: String(foreignAcc.id) });

    await svc.remove(String(res.id), String(mine.id));

    expect(await findRow(orm, DayAssignments, { id: theirStop })).toBeTruthy();
  });
});
