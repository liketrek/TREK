/**
 * Reservations + accommodations module e2e — exercises both migrated mounts
 * through the real JwtAuthGuard against a temp SQLite db. Reservation SQL runs
 * for real (ReservationsService is DI-native, no mock — the temp db carries the
 * full, real migrated schema via createSnapshotTestDb), and so does the accommodation
 * SQL (the injected DaysService is DI-native too); the budget service and the
 * permission check stay mocked.
 */
// The budget-sync seam runs the real injected BudgetService (BudgetModule is
// imported by ReservationsModule since the budget fold) over the same temp db.
import { db } from '../../src/db/database';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { ReservationDayPositions } from '../../src/db/entities/ReservationDayPositions.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { Users } from '../../src/db/entities/Users.entity';
// Accommodations left reservations/ for a domain of their own; this container has
// to assemble both or the /accommodations cases below 404 while production serves them.
import { AccommodationsModule } from '../../src/nest/accommodations/accommodations.module';
import { ExchangeRatesService } from '../../src/nest/budget/exchange-rates.service';
import { legacyBoundIntegerText } from '../../src/nest/common/row-id';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { ReservationsModule } from '../../src/nest/reservations/reservations.module';
import {
  countRows,
  deleteRows,
  findRow,
  findRows,
  insertRow,
  insertRowIgnoringConflict,
} from '../helpers/factories/rows';
import { makeTrip, makeDay } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

// Task 9 fix wave (B-L11): `src/db/database.ts` no longer exports
// `canAccessTrip` (Plan 3c Task 0b moved it onto `TripsRepository` behind
// `TripAccessGuard`'s own `EntityManager`), so mocking it here was a dead
// no-op — the "404 when trip not accessible" cases below already delete/
// restore the real row instead (see their own comments).
vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    getPlaceWithTags: vi.fn(),
    closeDb: () => {},
    reinitialize: () => {},
  };
});
const { notificationSend } = vi.hoisted(() => ({ notificationSend: vi.fn().mockResolvedValue(undefined) }));

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

let orm: TestOrm;

/** The expense booked with the reservation, as total, currency and frozen rate. */
async function bookedExpense(reservationId: number) {
  const item = await findRow(orm, BudgetItems, { reservation: reservationId });
  return item
    ? { total_price: item.total_price, currency: item.currency, exchange_rate: item.exchange_rate }
    : undefined;
}

function seedReservation(
  tripId: number,
  title: string,
  type: string,
  extra: { reservation_time?: string; accommodation_id?: string } = {},
) {
  return insertRow(orm, Reservations, { trip: tripId, title, type, ...extra });
}

function seedPlace(tripId: number, name: string) {
  return insertRow(orm, Places, { trip: tripId, name });
}

async function seedDay(tripId: number, dayNumber: number, date: string) {
  return (await makeDay(orm, tripId, { day_number: dayNumber, date })).id;
}

describe('Reservations + accommodations e2e (real auth guard + temp SQLite, real reservation SQL)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ReservationsModule,
        AccommodationsModule,
      ],
    })
      .overrideProvider(NotificationsService)
      .useValue({ send: notificationSend })
      // A price quoted in a foreign currency freezes the rate of the day; this is that
      // day's table, so no case ever reaches the network.
      .overrideProvider(ExchangeRatesService)
      .useValue({ getRates: async (base: string) => (base.toUpperCase() === 'EUR' ? { EUR: 1, USD: 1.17 } : null) })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // The temp db carries the real schema (password_hash NOT NULL), so seed the
    // auth user directly instead of via the trimmed-DDL seedUser helper.
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
    tripId = (await makeTrip(orm, 1, { title: 'E2E Trip' })).id;
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    checkPermission.mockReturnValue(true);
    notificationSend.mockClear();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a cookie (reservations)', async () => {
    expect((await request(server).get(`/api/trips/${tripId}/reservations`)).status).toBe(401);
  });

  it('200 list reservations (real SQL, joins attached)', async () => {
    const rid = await seedReservation(tripId, 'Hotel', 'hotel');
    const res = await request(server).get(`/api/trips/${tripId}/reservations`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    const row = res.body.reservations.find((r: { id: number }) => r.id === Number(rid));
    expect(row).toMatchObject({ title: 'Hotel', type: 'hotel', endpoints: [], travelers: [] });
  });

  it('401 without a cookie (upcoming feed)', async () => {
    expect((await request(server).get('/api/reservations/upcoming')).status).toBe(401);
  });

  it('200 cross-trip upcoming reservations feed, without the hotels (#1934)', async () => {
    await seedReservation(tripId, 'Flight', 'flight', { reservation_time: '2999-01-01T10:00:00' });
    await seedReservation(tripId, 'Stay', 'hotel', { reservation_time: '2999-01-01T09:00:00' });
    const res = await request(server).get('/api/reservations/upcoming').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    const titles = res.body.reservations.map((r: { title: string }) => r.title);
    expect(titles).toContain('Flight');
    expect(titles).not.toContain('Stay');
  });

  it('404 when trip not accessible (reservations)', async () => {
    // Plan 3c Task 0b: TripAccessGuard reads TripsRepository.findAccessible
    // directly now, a real query — `canAccessTrip.mockReturnValue(...)` no
    // longer intercepts it. The trip row is seeded once in `beforeAll` (not
    // re-seeded per test), so it is removed and restored around this one
    // assertion instead.
    await deleteRows(orm, Trips, { id: tripId });
    try {
      const res = await request(server).get(`/api/trips/${tripId}/reservations`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    } finally {
      await insertRow(orm, Trips, { id: tripId, user: 1, title: 'E2E Trip' });
    }
  });

  it('201 create keeps an imported price in the currency it was quoted in, at a frozen rate (#2525)', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/reservations`)
      .set('Cookie', sessionCookie(1))
      .send({
        title: 'Aparthotel Silver',
        type: 'hotel',
        metadata: { price: '801.76', priceCurrency: 'USD' },
        create_budget_entry: { total_price: 801.76, category: 'accommodation', currency: 'USD' },
      });
    expect(res.status).toBe(201);
    // It used to land as 801.76 with no currency, which is 801.76 of the trip's euros.
    const item = await bookedExpense(res.body.reservation.id);
    expect(item).toEqual({ total_price: 801.76, currency: 'USD', exchange_rate: 1.17 });
  });

  it('201 create leaves a price without a currency in the trip currency, as before', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/reservations`)
      .set('Cookie', sessionCookie(1))
      .send({ title: 'Museum', type: 'event', create_budget_entry: { total_price: 20, currency: 'not a code' } });
    expect(res.status).toBe(201);
    const item = await bookedExpense(res.body.reservation.id);
    expect(item).toEqual({ total_price: 20, currency: null, exchange_rate: 1 });
  });

  it('201 create reservation (real insert + booking notification), 400 without title', async () => {
    const ok = await request(server)
      .post(`/api/trips/${tripId}/reservations`)
      .set('Cookie', sessionCookie(1))
      .send({ title: 'Hotel' });
    expect(ok.status).toBe(201);
    expect(ok.body.reservation).toMatchObject({ title: 'Hotel', type: 'other', status: 'pending' });
    expect((await findRow(orm, Reservations, { id: ok.body.reservation.id }))!.title).toBe('Hotel');
    // The fire-and-forget booking notification reaches the (mocked) notification service.
    await vi.waitFor(() => expect(notificationSend).toHaveBeenCalled());
    expect(notificationSend).toHaveBeenCalledWith(expect.objectContaining({ event: 'booking_change', actorId: 1 }));

    const bad = await request(server)
      .post(`/api/trips/${tripId}/reservations`)
      .set('Cookie', sessionCookie(1))
      .send({});
    expect(bad.status).toBe(400);
    expect(bad.body.error).toContain('title');
  });

  // The reported repro (#2355): an id that resolves to nothing used to reach
  // the statement and come back as an unhandled SqliteError, i.e. a bare 500.
  it('400 on an update whose place_id exists nowhere, and the row is left alone', async () => {
    const rid = await seedReservation(tripId, 'Dinner', 'other');

    const res = await request(server)
      .put(`/api/trips/${tripId}/reservations/${rid}`)
      .set('Cookie', sessionCookie(1))
      .send({ title: 'Dinner, later', place_id: 999999 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown reference: place_id' });
    const dinner = (await findRow(orm, Reservations, { id: rid }))!;
    expect({ title: dinner.title, place_id: dinner.place_id }).toEqual({ title: 'Dinner', place_id: null });
  });

  it('400 on a create whose create_accommodation day exists nowhere, and no stay is written', async () => {
    const placeId = await seedPlace(tripId, 'Hotel Unknown');
    const dayId = await seedDay(tripId, 7, '2026-03-07');
    const before = await countRows(orm, DayAccommodations, { trip: tripId });

    const res = await request(server)
      .post(`/api/trips/${tripId}/reservations`)
      .set('Cookie', sessionCookie(1))
      .send({
        title: 'Stay',
        type: 'hotel',
        create_accommodation: { place_id: placeId, start_day_id: dayId, end_day_id: 999999 },
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Unknown reference: create_accommodation.end_day_id' });
    expect(await countRows(orm, DayAccommodations, { trip: tripId })).toBe(before);
  });

  // #522, which must survive all of the above: shortening a trip cascades the
  // stay away and leaves the booking pointing at a gap, and the booking still
  // has to be savable.
  it('200 on an update whose stored accommodation_id no longer resolves', async () => {
    const rid = await seedReservation(tripId, 'Stay', 'hotel', { accommodation_id: '999999' });

    const res = await request(server)
      .put(`/api/trips/${tripId}/reservations/${rid}`)
      .set('Cookie', sessionCookie(1))
      .send({ title: 'Stay, renamed', accommodation_id: 999999 });

    expect(res.status).toBe(200);
    const stay = (await findRow(orm, Reservations, { id: rid }))!;
    expect({ title: stay.title, accommodation_id: stay.accommodation_id }).toEqual({
      title: 'Stay, renamed',
      accommodation_id: null,
    });
  });

  it('200 list accommodations + 201 create (real insert + auto hotel reservation), 404 on bad refs', async () => {
    const placeId = await seedPlace(tripId, 'Grand Hotel');
    const dayId = await seedDay(tripId, 1, '2026-03-01');
    const create = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: placeId, start_day_id: dayId, end_day_id: dayId, check_in: '15:00' });
    expect(create.status).toBe(201);
    expect(create.body.accommodation).toMatchObject({
      place_id: placeId,
      start_day_id: dayId,
      end_day_id: dayId,
      place_name: 'Grand Hotel',
    });
    // The partner hotel reservation is auto-created by the real DaysService SQL.
    const linked = await findRow(orm, Reservations, {
      accommodation_id: legacyBoundIntegerText(create.body.accommodation.id),
    });
    expect(linked).toMatchObject({ type: 'hotel', status: 'confirmed' });
    const list = await request(server).get(`/api/trips/${tripId}/accommodations`).set('Cookie', sessionCookie(1));
    expect(list.status).toBe(200);
    expect(list.body.accommodations).toHaveLength(1);
    expect(list.body.accommodations[0]).toMatchObject({ id: create.body.accommodation.id, place_name: 'Grand Hotel' });
    const badRefs = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: 99999, start_day_id: dayId, end_day_id: dayId });
    expect(badRefs.status).toBe(404);
    expect(badRefs.body).toEqual({ error: 'Place not found' });
  });

  it('201 create also puts the place on its check-in day, and the delete takes that stop back', async () => {
    // The road-trip view builds its stops from day_assignments and only looks the stay
    // up afterwards, so a booking without one never reaches the route: the complaint
    // was having to enter the same hotel a second time as an ordinary place.
    const placeId = await seedPlace(tripId, 'Hotel Adlon');
    const dayId = await seedDay(tripId, 4, '2026-03-04');

    const create = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: placeId, start_day_id: dayId, end_day_id: dayId });
    expect(create.status).toBe(201);
    // In the answer, not only on the socket: the broadcast skips the sender.
    expect(create.body.assignment).toMatchObject({ day_id: dayId, place_id: placeId });
    expect(await findRow(orm, Places, { id: placeId })).toMatchObject({ stop_type: 'hotel' });

    const del = await request(server)
      .delete(`/api/trips/${tripId}/accommodations/${create.body.accommodation.id}`)
      .set('Cookie', sessionCookie(1));
    expect(del.status).toBe(200);
    expect(del.body.removedAssignments).toEqual([{ id: create.body.assignment.id, dayId }]);
    expect(await findRows(orm, DayAssignments, { day: dayId })).toEqual([]);
  });

  it('404 when trip not accessible (accommodations)', async () => {
    // See the reservations 404 case above for why this deletes/restores the
    // real row instead of mocking canAccessTrip.
    await deleteRows(orm, Trips, { id: tripId });
    try {
      const res = await request(server).get(`/api/trips/${tripId}/accommodations`).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    } finally {
      await insertRow(orm, Trips, { id: tripId, user: 1, title: 'E2E Trip' });
    }
  });

  it('400 accommodation create without refs', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: 2 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'place_id, start_day_id, and end_day_id are required' });
  });

  // The per-day branch of updatePositions used to bind the caller's ids straight
  // into reservation_day_positions without ever looking at the tripId it was
  // handed, so a request authorised on your own trip could rewrite the ordering
  // of someone else's. The legacy branch three lines below it always scoped by
  // trip_id — these pin that the two behave the same way now.
  describe('positions are confined to the trip in the URL', () => {
    let foreignTripId: number;
    let foreignReservationId: number;
    let foreignDayId: number;
    let ownDayId: number;
    // Days are unique per (trip_id, day_number) and this block seeds a fresh pair
    // for every case, so the numbers have to keep climbing.
    let dayNumber = 100;

    beforeEach(async () => {
      await insertRowIgnoringConflict(orm, Users, {
        id: 2,
        username: 'victim',
        email: 'victim@example.test',
        password_hash: 'x',
        role: 'user',
        password_version: 0,
      });
      foreignTripId = (await makeTrip(orm, 2, { title: 'Someone else' })).id;
      foreignReservationId = await seedReservation(foreignTripId, 'Secret', 'other');
      dayNumber += 1;
      foreignDayId = await seedDay(foreignTripId, dayNumber, '2026-05-01');
      ownDayId = await seedDay(tripId, dayNumber, '2026-05-01');
    });

    async function positionRow(reservationId: number, dayId: number) {
      const row = await findRow(orm, ReservationDayPositions, { reservation: reservationId, day: dayId });
      return row ? { position: row.position } : undefined;
    }

    it('writes nothing when both ids belong to another trip', async () => {
      const res = await request(server)
        .put(`/api/trips/${tripId}/reservations/positions`)
        .set('Cookie', sessionCookie(1))
        .send({ positions: [{ id: foreignReservationId, day_plan_position: 999 }], day_id: foreignDayId });
      expect(res.status).toBe(200);
      expect(await positionRow(foreignReservationId, foreignDayId)).toBeUndefined();
    });

    it('writes nothing when only the reservation is foreign', async () => {
      const res = await request(server)
        .put(`/api/trips/${tripId}/reservations/positions`)
        .set('Cookie', sessionCookie(1))
        .send({ positions: [{ id: foreignReservationId, day_plan_position: 5 }], day_id: ownDayId });
      expect(res.status).toBe(200);
      expect(await positionRow(foreignReservationId, ownDayId)).toBeUndefined();
    });

    it('writes nothing when only the day is foreign', async () => {
      const ownReservationId = await seedReservation(tripId, 'Mine', 'other');
      const res = await request(server)
        .put(`/api/trips/${tripId}/reservations/positions`)
        .set('Cookie', sessionCookie(1))
        .send({ positions: [{ id: ownReservationId, day_plan_position: 5 }], day_id: foreignDayId });
      expect(res.status).toBe(200);
      expect(await positionRow(ownReservationId, foreignDayId)).toBeUndefined();
    });

    it('still stores a position when both ids are on the trip', async () => {
      const ownReservationId = await seedReservation(tripId, 'Mine', 'other');
      const res = await request(server)
        .put(`/api/trips/${tripId}/reservations/positions`)
        .set('Cookie', sessionCookie(1))
        .send({ positions: [{ id: ownReservationId, day_plan_position: 3 }], day_id: ownDayId });
      expect(res.status).toBe(200);
      expect(await positionRow(ownReservationId, ownDayId)).toEqual({ position: 3 });
    });

    // An id that exists nowhere used to raise a foreign-key error, which the
    // exception filter turned into a 500 — telling the caller apart from the
    // 200 a real id returns, for any id on the instance.
    it('answers a nonexistent reservation the same way it answers a foreign one', async () => {
      const res = await request(server)
        .put(`/api/trips/${tripId}/reservations/positions`)
        .set('Cookie', sessionCookie(1))
        .send({ positions: [{ id: 999999, day_plan_position: 1 }], day_id: ownDayId });
      expect(res.status).toBe(200);
    });

    it('does not fall over when day_plan_position is omitted', async () => {
      const ownReservationId = await seedReservation(tripId, 'Mine', 'other');
      const res = await request(server)
        .put(`/api/trips/${tripId}/reservations/positions`)
        .set('Cookie', sessionCookie(1))
        .send({ positions: [{ id: ownReservationId }], day_id: ownDayId });
      expect(res.status).toBe(200);
    });
  });
});
