/**
 * Unit tests for CalendarService. The cases moved 1:1 out of
 * tests/unit/nest/trips.service.test.ts together with the code they cover
 * (TRIP-SVC-001..002b, 020..027 and 048); the identifiers are unchanged so the
 * diff shows a move rather than a rewrite, and the assertions still pin the
 * emitted ICS byte for byte. Uses a real in-memory SQLite DB so the SQL runs.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
  };
    return mock;
});

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createPlace, createDay, createDayAssignment, createDayNote } from '../../helpers/factories';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { ReservationsReadService } from '../../../src/nest/reservations/reservations-read.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CalendarService, foldICS } from '../../../src/nest/calendar/calendar.service';
import { CalendarModule } from '../../../src/nest/calendar/calendar.module';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { notificationsStub } from '../../helpers/notifications';
import { accommodationsOver } from '../../helpers/accommodations-service';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestReservationsRepo, createTestReservationEndpointsRepo, createTestReservationTravelersRepo, createTestReservationDayPositionsRepo, createTestDayAccommodationsRepo, createTestDaysRepo, createTestDayNotesRepo, createTestPlacesRepo, createTestDayAssignmentsRepo, createTestTripMembersRepo, createTestUsersRepo, createTestTripsRepo } from '../../helpers/test-uow';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import { sharedTestOrm } from '../../helpers/test-uow';
import type { TestOrm } from '../../helpers/test-orm';
import { findRow, findRows, insertRow, insertRows, updateRows } from '../../helpers/factories/rows';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { ReservationEndpoints } from '../../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';

// Named `svc` so the moved cases below read exactly as they did on TripsService.
let budgetSvc: BudgetService;
let svc: CalendarService;
let orm: TestOrm;
beforeAll(async () => {
  budgetSvc = new BudgetService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new ExchangeRatesService(), new RealtimeService(), await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb)));
  svc = new CalendarService(
  new ReservationsService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), budgetSvc, new RealtimeService(), notificationsStub(), new ReservationsReadService(await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb)), await accommodationsOver(testDb), await createTestUnitOfWork(testDb), await createTestReservationsRepo(testDb), await createTestReservationEndpointsRepo(testDb), await createTestReservationTravelersRepo(testDb), await createTestReservationDayPositionsRepo(testDb), await createTestDayAccommodationsRepo(testDb), await createTestDaysRepo(testDb), await createTestPlacesRepo(testDb), await createTestDayAssignmentsRepo(testDb), await createTestTripMembersRepo(testDb), await createTestUsersRepo(testDb), await createTestTripsRepo(testDb), await createTestBudgetItemsRepo(testDb)),
  await createTestTripsRepo(testDb), await createTestDaysRepo(testDb), await createTestDayNotesRepo(testDb), await createTestReservationsRepo(testDb),
);
});

beforeEach(async () => {
  resetTestDb(testDb);
  orm = await sharedTestOrm(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('exportICS', () => {
  it('TRIP-SVC-001: returns VCALENDAR wrapper', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'My Vacation',
      start_date: '2025-06-01',
      end_date: '2025-06-07',
    });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('TRIP-SVC-002: trip with start_date + end_date includes all-day VEVENT', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Summer Holiday',
      start_date: '2025-06-01',
      end_date: '2025-06-07',
    });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20250601');
    // DTEND is exclusive — the day *after* the last day, or the trip loses a day.
    expect(ics).toContain('DTEND;VALUE=DATE:20250608');
    expect(ics).toContain('SUMMARY:Summer Holiday');
  });

  describe('#1453 all-day DTEND is timezone-independent', () => {
    const originalTz = process.env.TZ;

    afterAll(() => {
      process.env.TZ = originalTz;
    });

    // The old code did `new Date(date + 'T00:00:00')` — no Z, so parsed as *server-local*
    // midnight — then setDate(+1) and .toISOString(). East of Greenwich that round-trip
    // lands a day early, and since DTEND is exclusive the trip's last day was dropped.
    // Only invisible in CI because containers default to TZ=UTC.
    for (const tz of ['Europe/Berlin', 'Asia/Tokyo', 'Pacific/Kiritimati', 'America/New_York', 'UTC']) {
      it(`TRIP-SVC-002b: DTEND is the day after the last day under TZ=${tz}`, async () => {
        process.env.TZ = tz;
        const { user } = createUser(testDb);
        const trip = createTrip(testDb, user.id, {
          title: 'TZ Trip',
          start_date: '2026-03-28',
          end_date: '2026-03-30',
        });

        const { ics } = await svc.exportICS(trip.id);

        expect(ics).toContain('DTSTART;VALUE=DATE:20260328');
        expect(ics).toContain('DTEND;VALUE=DATE:20260331');
      });
    }

    it('TRIP-SVC-002c: a per-day all-day summary event has the same exclusive DTEND', async () => {
      process.env.TZ = 'Asia/Tokyo';
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, { title: 'Day Note Trip' });
      const day = createDay(testDb, trip.id, { date: '2026-03-30', day_number: 1 });
      createDayNote(testDb, day.id, trip.id, { text: 'Pack the bags' });

      const { ics } = await svc.exportICS(trip.id);

      expect(ics).toContain('DTSTART;VALUE=DATE:20260330');
      expect(ics).toContain('DTEND;VALUE=DATE:20260331');
    });
  });

  it('TRIP-SVC-003: reservation with full datetime (includes T) → DTSTART without VALUE=DATE', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Morning Flight',
      type: 'flight',
    });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T09:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART:20250602T090000');
    expect(ics).not.toContain('DTSTART;VALUE=DATE');
  });

  it('TRIP-SVC-004: reservation with date-only → DTSTART;VALUE=DATE', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Hotel Check-in',
      type: 'hotel',
    });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20250602');
  });

  it('TRIP-SVC-005: reservation metadata with flight info appears in DESCRIPTION', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'CDG to JFK',
      type: 'flight',
    });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T09:00', metadata: JSON.stringify({
          airline: 'Air Test',
          flight_number: 'AT100',
          departure_airport: 'CDG',
          arrival_airport: 'JFK',
        }) });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('Airline: Air Test');
    expect(ics).toContain('Flight: AT100');
  });

  it('TRIP-SVC-006: special characters in title are escaped', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip; First, Best' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('Trip\\; First\\, Best');
  });

  it('TRIP-SVC-007: throws NotFoundError for non-existent trip', async () => {
    await expect(svc.exportICS(99999)).rejects.toThrow();
  });

  it('TRIP-SVC-008: returns a filename derived from trip title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'My Trip 2025' });

    const { filename } = await svc.exportICS(trip.id);

    expect(filename).toMatch(/My.Trip.2025\.ics/);
  });

  // JS \s admitted U+3000 (and \v/\f) into the filename, and Node's header
  // validation then threw ERR_INVALID_CHAR on the export route (#2165).
  it('TRIP-SVC-008b: ideographic whitespace in the title folds to _ in the filename', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: '沖縄　4泊5日' });

    expect((await svc.exportICS(trip.id)).filename).toBe('___4_5_.ics');
  });

  it('TRIP-SVC-008c: vertical tab and form feed fold too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'A\vB\fC' });

    expect((await svc.exportICS(trip.id)).filename).toBe('A_B_C.ics');
  });

  it('TRIP-SVC-009: reservation with end time includes DTEND', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Afternoon Tour',
      type: 'activity',
    });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T14:00', reservation_end_time: '2025-06-02T16:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTEND:20250602T160000');
  });

  it('TRIP-SVC-024: flight with endpoint times but no reservation_time is included', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'CDG → JFK',
      type: 'flight',
    });
    // Confirmed flights store times per endpoint, never as reservation_time.
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null, reservation_end_time: null });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: 'Europe/Paris', local_time: '09:00', local_date: '2025-06-02' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'to', sequence: 1, name: 'New York JFK', code: 'JFK', lat: 40.6, lng: -73.8, timezone: 'America/New_York', local_time: '12:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:CDG → JFK');
    // Departure endpoint zone drives DTSTART, arrival zone drives DTEND, so the
    // subscriber sees TREK's zones instead of their own (#1453).
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('DTEND;TZID=America/New_York:20250602T120000');
    expect(ics).not.toContain('DTSTART:20250602T090000');
    // Each referenced zone gets a VTIMEZONE definition.
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:America/New_York');
    expect(ics).toContain('Route: CDG → JFK');
  });

  it('TRIP-SVC-024a: a flight that also carries reservation_time still uses per-side endpoint zones', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'CDG → JFK',
      type: 'flight',
    });
    // TransportModal stamps reservation_time/_end_time (departure/arrival) alongside
    // the endpoints. That branch's only zone is the linked place — a flight has none —
    // so it floated both ends in the subscribed feed; endpoints must win (#1453).
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T09:00', reservation_end_time: '2025-06-02T12:00' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: 'Europe/Paris', local_time: '09:00', local_date: '2025-06-02' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'to', sequence: 1, name: 'New York JFK', code: 'JFK', lat: 40.6, lng: -73.8, timezone: 'America/New_York', local_time: '12:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('DTEND;TZID=America/New_York:20250602T120000');
    // The bug was a floating DTSTART/DTEND (no TZID) from the reservation_time branch.
    expect(ics).not.toContain('DTSTART:20250602T090000');
    expect(ics).not.toContain('DTEND:20250602T120000');
  });

  it('TRIP-SVC-024c: a one-sided transport keeps the multi-day DTEND from reservation_end_time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rental Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Rental car', type: 'car_rental' });
    // An imported rental geocodes the pickup only, so there is no second endpoint
    // to carry the return. Before the endpoint branch took precedence, the return
    // came from reservation_end_time; it still has to.
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T10:00', reservation_end_time: '2025-06-09T10:00' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Berlin', code: null, lat: 52.5, lng: 13.4, timezone: 'Europe/Berlin', local_time: '10:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20250602T100000');
    expect(ics).toContain('DTEND;TZID=Europe/Berlin:20250609T100000');
  });

  it('TRIP-SVC-024d: an untimed arrival endpoint still takes its DTEND from reservation_end_time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Train Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'ICE 1234', type: 'train' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T08:00', reservation_end_time: '2025-06-02T14:30' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Berlin Hbf', code: null, lat: 52.5, lng: 13.4, timezone: 'Europe/Berlin', local_time: '08:00', local_date: '2025-06-02' });
    // The destination was added without a clock — the arrival time only exists
    // on the reservation itself.
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'to', sequence: 1, name: 'Wien Hbf', code: null, lat: 48.2, lng: 16.4, timezone: 'Europe/Vienna', local_time: null, local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20250602T080000');
    expect(ics).toContain('DTEND;TZID=Europe/Berlin:20250602T143000');
  });

  it('TRIP-SVC-024e: a lone timed endpoint without reservation_end_time stays a DTSTART', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Ferry Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Ferry', type: 'ferry' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T07:00', reservation_end_time: null });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Dover', code: null, lat: 51.1, lng: 1.3, timezone: 'Europe/London', local_time: '07:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/London:20250602T070000');
    // Nothing to end it with, so no DTEND may be invented (the trip's own all-day
    // DTEND is VALUE=DATE, hence the narrower match).
    expect(ics).not.toContain('DTEND;TZID=');
  });

  it('TRIP-SVC-024b: an invalid endpoint timezone degrades to floating time instead of crashing the export', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Bad TZ Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'CDG → JFK', type: 'flight' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null, reservation_end_time: null });
    // A stored/plugin-written timezone can be any string; it must never reach Intl.
    // The bogus zone takes precedence over the coordinates (first.timezone || resolveZone).
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: 'Not/AZone', local_time: '09:00', local_date: '2025-06-02' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'to', sequence: 1, name: 'New York JFK', code: 'JFK', lat: 40.6, lng: -73.8, timezone: 'garbage', local_time: '12:00', local_date: '2025-06-02' });

    const ics = (await svc.exportICS(trip.id)).ics;
    // Falls back to a floating local time (no TZID) and never emits a bogus VTIMEZONE.
    expect(ics).toContain('DTSTART:20250602T090000');
    expect(ics).not.toContain('TZID=Not/AZone');
    expect(ics).not.toContain('garbage');
  });

  it('TRIP-SVC-025: flight endpoint with no local_date is skipped (relative Day-N trips)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Relative Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Timeless Flight',
      type: 'flight',
    });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Origin', code: 'AAA', lat: 1.0, lng: 1.0, timezone: null, local_time: '09:00', local_date: null });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('SUMMARY:Timeless Flight');
  });

  it('TRIP-SVC-026: timed assignment gets a TZID derived from the place coordinates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Trip' });
    const day = createDay(testDb, trip.id, { date: '2025-06-02' });
    // Tokyo coordinates → Asia/Tokyo via tz-lookup.
    const place = createPlace(testDb, trip.id, { name: 'Senso-ji', lat: 35.7148, lng: 139.7967 });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { assignment_time: '09:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20250602T090000');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Asia/Tokyo');
    expect(ics).not.toContain('DTSTART:20250602T090000');
  });

  it('CAL-011: a reservation_time with seconds is kept as is and a date-only end time emits no DTEND', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Second Precision' });
    const reservation = createReservation(testDb, trip.id, { title: 'Guided Walk', type: 'activity' });
    // Importers write both shapes: "…T14:00" (padded to seconds) and "…T14:00:00"
    // (already 15 chars). Padding the second one again would produce a 17-char
    // value that no client parses.
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T14:00:00', reservation_end_time: '2025-06-03' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART:20250602T140000');
    // The end value carries no clock time, so it cannot be a DTEND for a timed
    // event; emitting the bare "20250603" would make the event span a nonsense
    // range instead of being left open.
    expect(ics).not.toContain('DTEND');
  });

  it('CAL-012: reservations with no placeable time are dropped instead of emitting a broken VEVENT', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Timeless' });
    // Relative "Day N" trips store a clock time without a date; there is nothing
    // to anchor it to, so the reservation must not reach the calendar at all.
    const timeOnly = createReservation(testDb, trip.id, { title: 'Floating Dinner', type: 'restaurant' });
    await updateRows(orm, Reservations, { id: timeOnly.id }, { reservation_time: '19:30' });
    // A transport row whose endpoints were never imported has no fallback time either.
    const noEndpoints = createReservation(testDb, trip.id, { title: 'Endpointless Train', type: 'transport' });
    await updateRows(orm, Reservations, { id: noEndpoints.id }, { reservation_time: null });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('SUMMARY:Floating Dinner');
    expect(ics).not.toContain('SUMMARY:Endpointless Train');
    // The trip itself has no dates and no days, so dropping both reservations
    // leaves an event-free calendar rather than a partially filled one.
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('CAL-013: endpoints without a stored timezone fall back to their coordinates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'No Stored Zone' });
    const reservation = createReservation(testDb, trip.id, { title: 'CDG to JFK', type: 'flight' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null });
    // Endpoints created before the importer learned to store IANA zones have only
    // coordinates. Without the lookup fallback both ends would go floating and the
    // subscriber would see the flight in their own zone (#1453).
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: null, local_time: '09:00', local_date: '2025-06-02' });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'to', sequence: 1, name: 'New York JFK', code: 'JFK', lat: 40.6, lng: -73.8, timezone: null, local_time: '12:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('DTEND;TZID=America/New_York:20250602T120000');
  });

  it('CAL-014: a single-endpoint transport emits DTSTART only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'One Way' });
    const reservation = createReservation(testDb, trip.id, { title: 'Airport Transfer', type: 'transport' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null });
    // Only the departure was imported. Using it for DTEND as well would emit a
    // zero-length event; leaving DTEND out lets clients apply their default duration.
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: 'Europe/Paris', local_time: '09:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).not.toContain('DTEND');
  });

  it('CAL-015: a timed assignment carries its notes and address into DESCRIPTION and LOCATION', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Guided Day' });
    const day = createDay(testDb, trip.id, { date: '2025-06-02' });
    const place = createPlace(testDb, trip.id, { name: 'Louvre', lat: 48.8606, lng: 2.3376 });
    await updateRows(orm, Places, { id: place.id }, { address: 'Rue de Rivoli' });
    const withNotes = createDayAssignment(testDb, day.id, place.id, { notes: 'meet the guide' });
    await updateRows(orm, DayAssignments, { id: withNotes.id }, { assignment_time: '09:00' });
    const withoutNotes = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: withoutNotes.id }, { assignment_time: '11:00' });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    // Notes come first and the address is appended on its own line; dropping the
    // separator would glue them into one unreadable run.
    expect(ics).toContain('DESCRIPTION:meet the guide\\nRue de Rivoli');
    // Without notes the address must start the description rather than a stray newline.
    expect(ics).toContain('DESCRIPTION:Rue de Rivoli\r\n');
    expect(ics).toContain('LOCATION:Rue de Rivoli');
  });

  it('CAL-016b: read in one go for all days, each day keeps its own stops and notes in their order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Two Days' });
    const first = createDay(testDb, trip.id, { date: '2025-06-02', title: 'First' });
    const second = createDay(testDb, trip.id, { date: '2025-06-03', title: 'Second' });
    const place = (name: string) => createPlace(testDb, trip.id, { name });
    createDayAssignment(testDb, first.id, place('Later').id, { order_index: 1 });
    createDayAssignment(testDb, first.id, place('Sooner').id, { order_index: 0 });
    createDayAssignment(testDb, second.id, place('Elsewhere').id, { order_index: 0 });
    createDayNote(testDb, first.id, trip.id, { text: 'second note', sort_order: 1 });
    createDayNote(testDb, first.id, trip.id, { text: 'first note', sort_order: 0 });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).toContain('SUMMARY:First\r\nDESCRIPTION:• Sooner\\n• Later\\n\\nNotes:\\n• first note\\n• second note\r\n');
    expect(ics).toContain('SUMMARY:Second\r\nDESCRIPTION:• Elsewhere\r\n');
  });

  it('CAL-016: a day without a date is skipped and a titled day uses its own title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Mixed Days' });
    // Days of a relative "Day N" trip have no date; they cannot be placed on a
    // calendar, and emitting them produced a VEVENT with an empty DTSTART.
    const ghost = createDay(testDb, trip.id, { title: 'Ghost Day' });
    createDayNote(testDb, ghost.id, trip.id, { text: 'never exported' });
    const named = createDay(testDb, trip.id, { date: '2025-06-02', title: 'Museum Day' });
    const place = createPlace(testDb, trip.id, { name: 'Bare Spot' });
    createDayAssignment(testDb, named.id, place.id);

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).not.toContain('Ghost Day');
    expect(ics).not.toContain('never exported');
    // A day with a title must not be renamed to "Day <n>".
    expect(ics).toContain('SUMMARY:Museum Day');
    // No address and no notes → the bullet stays bare, with no empty "()" or dash.
    expect(ics).toContain('DESCRIPTION:• Bare Spot\r\n');
  });

  it('CAL-017: a reservation with no type, metadata or notes emits no empty DESCRIPTION', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Bare' });
    const reservation = createReservation(testDb, trip.id, { title: 'Bare Booking', type: 'hotel' });
    // Rows imported before `type` became mandatory still exist in prod. An empty
    // DESCRIPTION line is invalid enough for some clients to reject the file.
    await updateRows(orm, Reservations, { id: reservation.id }, { type: null, reservation_time: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Bare Booking');
    expect(ics).not.toContain('DESCRIPTION');
  });

  it('CAL-017b: a booking whose metadata is not JSON still exports, without the metadata lines', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Broken' });
    const reservation = createReservation(testDb, trip.id, { title: 'Garbled Flight', type: 'flight' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2025-06-02T09:00', metadata: '{not json' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Garbled Flight');
    expect(ics).toContain('DESCRIPTION:Type: flight\r\n');
  });

  it('CAL-018: flight metadata with only one airport emits only that side of the route', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Half Routes' });
    const inbound = createReservation(testDb, trip.id, { title: 'Inbound', type: 'flight' });
    const outbound = createReservation(testDb, trip.id, { title: 'Outbound', type: 'flight' });
    // A hand-entered flight often has one airport only; the missing side must be
    // left out instead of printing "To: undefined".
    await updateRows(orm, Reservations, { id: inbound.id }, { reservation_time: '2025-06-02T09:00', metadata: JSON.stringify({ arrival_airport: 'JFK' }) });
    await updateRows(orm, Reservations, { id: outbound.id }, { reservation_time: '2025-06-09T09:00', metadata: JSON.stringify({ departure_airport: 'CDG' }) });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).toContain('DESCRIPTION:Type: flight\\nTo: JFK\r\n');
    expect(ics).toContain('DESCRIPTION:Type: flight\\nFrom: CDG\r\n');
  });

  it('CAL-019: legs and endpoints without names produce no Route line', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Nameless' });
    const legs = createReservation(testDb, trip.id, { title: 'Codeless Legs', type: 'flight' });
    // Multi-leg metadata whose legs carry no airports would otherwise render
    // "Route: " with nothing after it.
    await updateRows(orm, Reservations, { id: legs.id }, { reservation_time: '2025-06-02T09:00', metadata: JSON.stringify({ legs: [{}, {}] }) });
    const ferry = createReservation(testDb, trip.id, { title: 'Nameless Ferry', type: 'transport' });
    await updateRows(orm, Reservations, { id: ferry.id }, { reservation_time: null });
    // Same for endpoints with neither a code nor a name: the derived route would
    // collapse to a single arrow between two blanks.
    await insertRow(orm, ReservationEndpoints, { reservation: ferry.id, role: 'from', sequence: 0, name: '', code: null, lat: 1.0, lng: 1.0, timezone: null, local_time: null, local_date: '2025-06-03' });
    await insertRow(orm, ReservationEndpoints, { reservation: ferry.id, role: 'to', sequence: 1, name: '', code: null, lat: 1.1, lng: 1.1, timezone: null, local_time: null, local_date: '2025-06-03' });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).toContain('SUMMARY:Codeless Legs');
    expect(ics).toContain('SUMMARY:Nameless Ferry');
    expect(ics).not.toContain('Route:');
  });

  it('CAL-043: a segment with its own booking reference gets its own Confirmation line (#1943)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover' });
    const flight = createReservation(testDb, trip.id, { title: 'FRA to HND', type: 'flight' });
    await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2025-06-02T09:00', confirmation_number: 'BOOK1', metadata: JSON.stringify({ legs: [
        { from: 'FRA', to: 'BER', confirmation_number: 'ABC123' },
        { from: 'BER', to: 'HND', confirmation_number: 'XYZ789' },
      ] }) });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).toContain(
      'DESCRIPTION:Type: flight\\nConfirmation: BOOK1\\nRoute: FRA → BER → HND'
      + '\\nConfirmation FRA-BER: ABC123\\nConfirmation BER-HND: XYZ789\r\n'
    );
  });

  it('CAL-044: a multi-leg flight without per-segment references reads exactly as before', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover' });
    const flight = createReservation(testDb, trip.id, { title: 'FRA to HND', type: 'flight' });
    await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2025-06-02T09:00', confirmation_number: 'BOOK1', metadata: JSON.stringify({ legs: [{ from: 'FRA', to: 'BER' }, { from: 'BER', to: 'HND' }] }) });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    // Byte parity for every feed that exists today: the description ends after
    // the route line, so no subscriber sees a changed event.
    expect(ics).toContain('DESCRIPTION:Type: flight\\nConfirmation: BOOK1\\nRoute: FRA → BER → HND\r\n');
  });

  it('CAL-045: a connecting flight with times on every leg becomes one event per leg (#2389)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover' });
    const d1 = createDay(testDb, trip.id, { date: '2025-06-02' });
    const d2 = createDay(testDb, trip.id, { date: '2025-06-03' });
    const flight = createReservation(testDb, trip.id, { title: 'FRA to HND', type: 'flight' });
    await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2025-06-02T09:00', confirmation_number: 'BOOK1', metadata: JSON.stringify({ legs: [
        { from: 'FRA', to: 'BER', airline: 'LH', flight_number: '1', dep_day_id: d1.id, dep_time: '09:00', arr_day_id: d1.id, arr_time: '10:10' },
        { from: 'BER', to: 'HND', airline: 'LH', flight_number: '2', confirmation_number: 'SEG2', dep_day_id: d1.id, dep_time: '12:30', arr_day_id: d2.id, arr_time: '07:45' },
      ] }) });

    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).toContain(`UID:trek-res-leg1-${flight.id}@trek`);
    expect(ics).toContain(`UID:trek-res-leg2-${flight.id}@trek`);
    expect(ics).not.toContain(`UID:trek-res-${flight.id}@trek`);
    expect(ics).toContain('DTSTART:20250602T090000\r\nDTEND:20250602T101000\r\nSUMMARY:FRA to HND: FRA → BER');
    // The second leg lands the next morning, and its own reference rides along.
    expect(ics).toContain('DTSTART:20250602T123000\r\nDTEND:20250603T074500\r\nSUMMARY:FRA to HND: BER → HND');
    expect(ics).toContain('DESCRIPTION:LH 2\\nConfirmation: SEG2\\nLeg 2 of 2\\nType: flight');
    expect(ics).toContain('LOCATION:BER\r\n');
  });

  it('CAL-1807: a cruise with ports of call is one event per sailing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Baltic' });
    const d1 = createDay(testDb, trip.id, { date: '2025-06-02' });
    const d2 = createDay(testDb, trip.id, { date: '2025-06-03' });
    const cruise = createReservation(testDb, trip.id, { title: 'Baltic cruise', type: 'cruise' });
    await updateRows(orm, Reservations, { id: cruise.id }, { reservation_time: '2025-06-02T17:00', metadata: JSON.stringify({ legs: [
        { from: 'Kiel', to: 'Tallinn', dep_day_id: d1.id, dep_time: '17:00', arr_day_id: d2.id, arr_time: '09:00' },
        { from: 'Tallinn', to: 'Kiel', dep_day_id: d2.id, dep_time: '18:00', arr_day_id: d2.id, arr_time: '23:00' },
      ] }) });
    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');
    expect(ics).toContain('SUMMARY:Baltic cruise: Kiel → Tallinn');
    expect(ics).toContain('SUMMARY:Baltic cruise: Tallinn → Kiel');
    expect(ics).toContain(`UID:trek-res-leg2-${cruise.id}@trek`);
  });

  it('CAL-2389b: legs take their zones and names from one endpoint per airport (#2389)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover' });
    const d1 = createDay(testDb, trip.id, { date: '2025-06-02' });
    const flight = createReservation(testDb, trip.id, { title: 'Via Frankfurt', type: 'flight' });
    await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2025-06-02T09:00', metadata: JSON.stringify({ legs: [
        { dep_day_id: d1.id, dep_time: '09:00', arr_day_id: d1.id, arr_time: '10:00' },
        { dep_day_id: d1.id, dep_time: '12:00', arr_day_id: d1.id, arr_time: '15:00' },
      ] }) });
    await insertRow(orm, ReservationEndpoints, { reservation: flight.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: 'Europe/Paris', local_time: '09:00', local_date: '2025-06-02' });
    // No stored zone here: it is worked out from the coordinates.
    await insertRow(orm, ReservationEndpoints, { reservation: flight.id, role: 'stop', sequence: 1, name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.57, timezone: null, local_time: '12:00', local_date: '2025-06-02' });
    await insertRow(orm, ReservationEndpoints, { reservation: flight.id, role: 'to', sequence: 2, name: 'London LHR', code: 'LHR', lat: 51.47, lng: -0.45, timezone: 'Europe/London', local_time: '15:00', local_date: '2025-06-02' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('DTEND;TZID=Europe/Berlin:20250602T100000');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20250602T120000');
    expect(ics).toContain('DTEND;TZID=Europe/London:20250602T150000');
    expect(ics).toContain('SUMMARY:Via Frankfurt: CDG → FRA');
    expect(ics).toContain('SUMMARY:Via Frankfurt: FRA → LHR');
  });

  it('CAL-046: a leg without a departure clock keeps the single event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Layover' });
    const d1 = createDay(testDb, trip.id, { date: '2025-06-02' });
    const flight = createReservation(testDb, trip.id, { title: 'FRA to HND', type: 'flight' });
    await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2025-06-02T09:00', metadata: JSON.stringify({ legs: [
        { from: 'FRA', to: 'BER', dep_day_id: d1.id, dep_time: '09:00' },
        { from: 'BER', to: 'HND', dep_day_id: d1.id },
      ] }) });

    const ics = (await svc.exportICS(trip.id)).ics;
    expect(ics).toContain(`UID:trek-res-${flight.id}@trek`);
    expect(ics).not.toContain('res-leg');
  });

  it('CAL-020: an empty trip title falls back for SUMMARY, X-WR-CALNAME and the filename', async () => {
    const { user } = createUser(testDb);
    // The title is only NOT NULL, not non-empty; an empty one used to produce
    // "SUMMARY:" and a filename of ".ics".
    const trip = createTrip(testDb, user.id, { title: '', start_date: '2025-06-01', end_date: '2025-06-02' });

    const { ics, filename } = await svc.exportICS(trip.id);

    expect(ics).toContain('X-WR-CALNAME:TREK Trip');
    expect(ics).toContain('SUMMARY:Trip');
    expect(filename).toBe('trek-trip.ics');
  });

  it('CAL-021: a corrupt day date degrades the VTIMEZONE offset instead of throwing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Corrupt Date' });
    // days.date is free-form TEXT; a legacy/imported row can hold a date that no
    // parser accepts. The representative date reaches Intl through the VTIMEZONE
    // fallback, and Intl throws a RangeError on an invalid Date — which would take
    // the whole export (and the trip's slot in the all-trips feed) down with it.
    const day = createDay(testDb, trip.id, { date: '2025-13-45' });
    const place = createPlace(testDb, trip.id, { name: 'Senso-ji', lat: 35.7148, lng: 139.7967 });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { assignment_time: '09:00' });

    const ics = (await svc.exportICS(trip.id)).ics;

    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20251345T090000');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Asia/Tokyo');
    expect(ics).toContain('TZOFFSETFROM:+0000');
    expect(ics).toContain('TZOFFSETTO:+0000');
  });

  it('CAL-022: the timezone cache stays correct after it hits its 1000-entry bound', async () => {
    const { user } = createUser(testDb);
    const bulkTrip = createTrip(testDb, user.id, { title: 'Cache Filler' });
    const realTrip = createTrip(testDb, user.id, { title: 'After The Bound' });

    // Endpoint timezones are free-form strings written by importers and plugins, so
    // the validity cache is keyed by attacker-ish input and has to be bounded. Push
    // it past the bound in one export.
    const bulkIds = await insertRows(orm, Reservations, Array.from({ length: 1010 }, (_, i) => (
      { trip: bulkTrip.id, title: `Bulk ${i}`, type: 'transport', reservation_time: null }
    )));
    await insertRows(orm, ReservationEndpoints, bulkIds.map((resId, i) => ({
      reservation: resId, role: 'from', sequence: 0, name: `Stop ${i}`, code: null, lat: 49.0, lng: 2.5,
      timezone: `Bogus/Zone-${i}`, local_time: '09:00', local_date: '2025-06-02',
    })));

    const bulk = (await svc.exportICS(bulkTrip.id)).ics;
    // Every one of them has to reach the zone check — otherwise the bound is never
    // approached and this case would pass without exercising anything.
    expect(bulk).toContain('SUMMARY:Bulk 0');
    expect(bulk).toContain('SUMMARY:Bulk 1009');
    expect(bulk).toContain('DTSTART:20250602T090000');
    expect(bulk).not.toContain('TZID=Bogus/Zone-0:');

    const reservation = createReservation(testDb, realTrip.id, { title: 'CDG to JFK', type: 'flight' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null });
    await insertRow(orm, ReservationEndpoints, { reservation: reservation.id, role: 'from', sequence: 0, name: 'Paris CDG', code: 'CDG', lat: 49.0, lng: 2.5, timezone: 'Europe/Paris', local_time: '09:00', local_date: '2025-06-02' });

    // Clearing the cache must make later zones be re-checked. A regression that
    // evicted by writing `false` instead would silently strip the TZID from every
    // export after the thousandth distinct zone string.
    const { ics } = await svc.exportICS(realTrip.id);
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
  });

  it('CAL-032: an all-day booking with an end date spans the whole range', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Festival Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Music Festival', type: 'event' });
    // A date-only start/end pair is what the booking import writes for an all-day
    // multi-day event. Without a DTEND the RFC reads the event as a single day, so
    // the booking collapsed onto its first day (#1869).
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-08-26', reservation_end_time: '2026-08-30' });

    const { ics } = await svc.exportICS(trip.id);

    // DTEND is exclusive, so the day after the last day of the booking.
    expect(ics).toContain('DTSTART;VALUE=DATE:20260826\r\nDTEND;VALUE=DATE:20260831');
  });

  it('CAL-033: a timed end time on an all-day booking still yields a VALUE=DATE DTEND', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Mixed Precision' });
    const reservation = createReservation(testDb, trip.id, { title: 'Cottage', type: 'other' });
    // Mixing DTSTART;VALUE=DATE with a date-time DTEND violates RFC 5545 §3.8.2.2
    // (both ends must share a value type), so only the date part may be used.
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-08-26', reservation_end_time: '2026-08-30T11:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260826\r\nDTEND;VALUE=DATE:20260831');
    expect(ics).not.toContain('DTEND:20260830T110000');
  });

  it('CAL-034: an end date before the start date emits no DTEND', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Backwards' });
    const reservation = createReservation(testDb, trip.id, { title: 'Swapped Dates', type: 'event' });
    // Clients either drop an event whose DTEND precedes its DTSTART or render it
    // with zero duration; leaving the end out keeps the single-day fallback.
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-08-26', reservation_end_time: '2026-08-20' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260826');
    expect(ics).not.toContain('DTEND');
  });

  it('CAL-035: a clock-only end time on an all-day booking emits no DTEND', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Half Timed' });
    const reservation = createReservation(testDb, trip.id, { title: 'Workshop', type: 'other' });
    // Relative "Day N" trips store a bare clock time; there is no date to anchor it
    // to, so it cannot become the end of an all-day range.
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-08-26', reservation_end_time: '11:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260826');
    expect(ics).not.toContain('DTEND');
  });
});

// ── Accommodations in the feed (#1586) ───────────────────────────────────────

describe('accommodations', () => {
  /** A stay with its linked hotel reservation, the shape createAccommodation writes. */
  const createStay = async (
    tripId: number,
    opts: {
      start: string | null;
      end?: string | null;
      check_in?: string | null;
      check_in_end?: string | null;
      check_out?: string | null;
      title?: string;
      withReservation?: boolean;
      lat?: number;
      lng?: number;
      address?: string | null;
      confirmation?: string;
      notes?: string;
      location?: string;
    },
  ) => {
    const place = createPlace(testDb, tripId, {
      name: opts.title ?? 'Hotel Bellevue',
      lat: opts.lat ?? 48.8566,
      lng: opts.lng ?? 2.3522,
    });
    await updateRows(orm, Places, { id: place.id }, { address: opts.address === undefined ? '1 Rue de Rivoli' : opts.address });
    const startDay = createDay(testDb, tripId, { date: opts.start ?? undefined });
    const endDay = opts.end === undefined
      ? startDay
      : createDay(testDb, tripId, { date: opts.end ?? undefined });
    const stayId = (await insertRow(orm, DayAccommodations, { trip: tripId, place: place.id, startDay: startDay.id, endDay: endDay.id, check_in: opts.check_in ?? null, check_in_end: opts.check_in_end ?? null, check_out: opts.check_out ?? null })) as number;

    if (opts.withReservation !== false) {
      await insertRow(orm, Reservations, { trip: tripId, day: startDay.id, title: opts.title ?? 'Hotel Bellevue', reservation_time: opts.start, status: 'confirmed', type: 'hotel', accommodation_id: String(stayId), confirmation_number: opts.confirmation ?? null, notes: opts.notes ?? null, location: opts.location ?? null });
    }
    return { stayId, placeId: place.id };
  };

  it('CAL-025: a stay covers every night as one all-day event, not just the arrival day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12' });

    const { ics } = await svc.exportICS(trip.id);

    // DTEND is exclusive, so the day after checkout.
    expect(ics).toContain('DTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260713');
    expect(ics).toContain('SUMMARY:Hotel Bellevue');
  });

  it('CAL-025b: a stay that records both ends of its clock drops the all-day block (#2136)', async () => {
    // The two markers already say when to arrive and when to leave, which is the
    // part a subscriber can act on. Keeping the block as well buries the week
    // under a bar that repeats what the markers say.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '15:00', check_out: '11:00',
    });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('DTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260713');
    expect(ics).toContain('SUMMARY:Check-in: Hotel Bellevue');
    expect(ics).toContain('SUMMARY:Check-out: Hotel Bellevue');
    // With the block gone the markers are the booking's whole representation, so
    // they carry the hand-over default hour instead of being points.
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260707T160000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260712T120000');
  });

  it('CAL-025d: a second room on the same stay keeps its block, since no marker names it', async () => {
    // The markers are emitted once per stay and titled from its lowest-id
    // booking, so dropping every block would leave the second one with nothing.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    const { stayId } = (await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '15:00', check_out: '11:00',
    }));
    const [day] = await findRows(orm, Days, { trip: trip.id }, { id: 'asc' });
    await insertRow(orm, Reservations, { trip: trip.id, day: day.id, title: 'Bellevue second room', reservation_time: null, status: 'confirmed', type: 'hotel', accommodation_id: String(stayId) });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Bellevue second room');
    expect(ics).toContain('SUMMARY:Check-in: Hotel Bellevue');
  });

  it('CAL-025e: the markers of a fully timed stay carry what the dropped block said (#2136)', async () => {
    // Losing the block must not lose the confirmation number and the notes with
    // it, the same handover the split window bookings do (#2068).
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '15:00', check_out: '11:00',
      confirmation: 'HTL-77291', notes: 'Key box code 4711',
    });

    const { ics } = await svc.exportICS(trip.id);

    const unfolded = ics.replaceAll('\r\n ', '');
    const descriptions = unfolded.split('\r\n').filter(l => l.startsWith('DESCRIPTION:Type: hotel'));
    expect(descriptions).toHaveLength(2);
    expect(descriptions[0]).toContain('Confirmation: HTL-77291');
    expect(descriptions[0]).toContain('Key box code 4711');
  });

  it('CAL-025f: a stay whose place has no address takes the booking location instead', async () => {
    // place_id is nullable (ON DELETE SET NULL) and an address is optional, so
    // without the fallback the only two events left name no address at all.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '15:00', check_out: '11:00',
      address: null, location: '12 Hotel Street',
    });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics.match(/LOCATION:12 Hotel Street/g)).toHaveLength(2);
  });

  it('CAL-025g: a stay that keeps its block does not repeat the description on its markers', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '15:00', confirmation: 'HTL-77291',
    });

    const { ics } = await svc.exportICS(trip.id);

    // The block is still emitted and still says it; saying it a second time on
    // the check-in marker would change a feed that already went out.
    const unfolded = ics.replaceAll('\r\n ', '');
    expect(unfolded.split('\r\n').filter(l => l.startsWith('DESCRIPTION:Type: hotel'))).toHaveLength(1);
  });

  it('CAL-025c: knowing only one end keeps the block, since nothing else carries the other', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12', check_in: '15:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260713');
    expect(ics).toContain('SUMMARY:Check-in: Hotel Bellevue');
    expect(ics).not.toContain('SUMMARY:Check-out');
  });

  it('CAL-026: check-in and check-out become their own timed events in the stay zone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '15:00', check_in_end: '22:00', check_out: '11:00',
    });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Check-in: Hotel Bellevue');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T150000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260707T220000');
    expect(ics).toContain('SUMMARY:Check-out: Hotel Bellevue');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260712T110000');
    expect(ics).toContain('LOCATION:1 Rue de Rivoli');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
  });

  it('CAL-026z: a stay across the change to summer time spells out both offsets', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris in spring' });
    await createStay(trip.id, { start: '2026-03-27', end: '2026-04-02', check_in: '15:00', check_out: '11:00' });

    const { ics } = await svc.exportICS(trip.id);
    const vtz = ics.slice(ics.indexOf('BEGIN:VTIMEZONE'), ics.indexOf('END:VTIMEZONE'));

    // Winter until the last Sunday of March 2026, 02:00 local, then summer, then
    // winter again in October: a client that reads the block literally shows the
    // check-out at 11:00 summer time, not an hour off.
    expect(vtz).toContain('BEGIN:STANDARD\r\nDTSTART:19700101T000000\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0100');
    expect(vtz).toContain('BEGIN:DAYLIGHT\r\nDTSTART:20260329T020000\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200');
    expect(vtz).toContain('BEGIN:STANDARD\r\nDTSTART:20261025T030000\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100');
  });

  it('CAL-026b: a check-in without an until-clock reads as one hour, not a point (#2136)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12', check_in: '15:00' });

    const { ics } = await svc.exportICS(trip.id);

    // Reporter variant 2: the lone timed end becomes a one-hour slot AND the
    // all-day block stays, since it is the only carrier of the other end's date.
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T150000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260707T160000');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260713');
  });

  it('CAL-026c: the check-out marker carries the same default hour', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12', check_out: '11:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260712T110000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260712T120000');
  });

  it('CAL-026d: a late check-out rolls the DTEND over midnight', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12', check_out: '23:30' });

    const { ics } = await svc.exportICS(trip.id);

    // Without the day shift the DTEND would land before its DTSTART, and clients
    // drop an event whose end precedes its start.
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260712T233000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260713T003000');
  });

  it('CAL-026e: a check-in window that ends before it starts runs past midnight (#2136)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12',
      check_in: '22:00', check_in_end: '02:00', check_out: '11:00',
    });

    const { ics } = await svc.exportICS(trip.id);

    // A late-arrival window, and nothing on the way in (REST, MCP, plugin SDK)
    // orders the two clocks. Emitted as recorded the DTEND precedes the DTSTART,
    // clients drop the event, and since the block is gone the arrival is gone.
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T220000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260708T020000');
  });

  it('CAL-027: a stay without times emits the all-day range and nothing else', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('Check-in');
    expect(ics).not.toContain('Check-out');
  });

  it('CAL-028: a stay whose end day lost its date falls back to the arrival day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: null, check_out: '11:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260708');
    expect(ics).toContain('SUMMARY:Check-out: Hotel Bellevue');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T110000');
  });

  it('CAL-029: a stay with no reservation still contributes its check-in event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    await createStay(trip.id, { start: '2026-07-07', end: '2026-07-09', check_in: '15:00', withReservation: false });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Check-in: Hotel Bellevue');
    // No stay event without a reservation to carry it — the accommodation itself
    // has no title, notes or confirmation of its own to show.
    expect(ics).not.toContain('DTEND;VALUE=DATE:20260710');
  });

  it('CAL-030: a hotel reservation without a stay keeps its old single-day event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    const reservation = createReservation(testDb, trip.id, { title: 'Airbnb', type: 'hotel' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-07-07' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260707');
    expect(ics).not.toContain('DTEND;VALUE=DATE');
  });

  it('CAL-031: a dateless stay is skipped instead of emitting a broken event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Someday' });
    await createStay(trip.id, { start: null, end: null, check_in: '15:00', check_out: '11:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('Check-in');
    expect(ics).not.toContain('Check-out');
    expect(ics).not.toContain('DTSTART;VALUE=DATE:');
  });

  it('CAL-036: two bookings on one stay emit the check-in/check-out markers once', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    const { stayId } = (await createStay(trip.id, {
      start: '2026-07-07', end: '2026-07-12', check_in: '15:00', check_out: '11:00',
    }));
    // Nothing stops a second booking from pointing at the same accommodation. The
    // markers are keyed by the stay, so joining the reservations in fanned the stay
    // out into two VEVENTs carrying the same UID, and clients then show whichever
    // one they saw last (#1869).
    await insertRow(orm, Reservations, { trip: trip.id, title: 'Bellevue second room', reservation_time: null, status: 'confirmed', type: 'hotel', accommodation_id: String(stayId) });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics.match(/UID:trek-checkin-\d+@trek/g)).toHaveLength(1);
    expect(ics.match(/UID:trek-checkout-\d+@trek/g)).toHaveLength(1);
    // The lowest booking id names the markers, so the title cannot flip between
    // exports. The second booking keeps its own event (its UID is its own).
    expect(ics).toContain('SUMMARY:Check-in: Hotel Bellevue\r\n');
    expect(ics).not.toContain('Check-in: Bellevue second room');
    expect(ics).toContain('SUMMARY:Bellevue second room');
  });

  it('CAL-060: the stop a booking puts on its check-in day does not list the hotel a second time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris' });
    const { stayId, placeId } = await createStay(trip.id, { start: '2026-07-07', end: '2026-07-12' });
    const stay = (await findRow(orm, DayAccommodations, { id: stayId }))!;
    // The stop a booked night puts on its check-in day, so the route can reach
    // the hotel. It belongs to the stay, not to the day's plan, and the stay
    // block already carries the hotel.
    await insertRow(orm, DayAssignments, { day: stay.start_day_id, place: placeId, order_index: 0, accommodation_id: stayId });
    // A place the traveller planned by hand on the same day stays on it.
    const museum = createPlace(testDb, trip.id, { name: 'Louvre' });
    createDayAssignment(testDb, stay.start_day_id, museum.id);

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260713');
    expect(ics.match(/Hotel Bellevue/g)).toHaveLength(1);
    expect(ics).toContain('• Louvre');
    expect(ics).not.toContain('• Hotel Bellevue');
  });
});

// ── Car rental pickup/drop-off in the feed (#1721) ──────────────────────────

describe('car rentals', () => {
  const insertEndpoint = async (
    reservationId: number,
    role: string,
    sequence: number,
    name: string,
    lat: number,
    lng: number,
    timezone: string | null,
    local_time: string | null,
    local_date: string | null,
  ) => {
    await insertRow(orm, ReservationEndpoints, { reservation: reservationId, role, sequence, name, code: null, lat, lng, timezone, local_time, local_date });
  };

  it('CAL-037: a rental with from/to endpoints produces a pickup and a drop-off event at the right local times and zones', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Hertz Rental', type: 'car' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null, reservation_end_time: null, location: 'Hertz Downtown' });
    await insertEndpoint(reservation.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', '09:00', '2026-07-07');
    await insertEndpoint(reservation.id, 'to', 1, 'Berlin Office', 52.5, 13.4, 'Europe/Berlin', '10:30', '2026-07-14');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Pickup: Hertz Rental');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T090000');
    expect(ics).toContain('SUMMARY:Drop-off: Hertz Rental');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20260714T103000');
    expect(ics).toContain('LOCATION:Hertz Downtown');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin');
  });

  it('CAL-038: role-less endpoints fall back to first/last by sequence', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Avis Rental', type: 'car' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null, reservation_end_time: null });
    // Neither endpoint carries a from/to role — an older import shape.
    await insertEndpoint(reservation.id, 'stop', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', '09:00', '2026-07-07');
    await insertEndpoint(reservation.id, 'stop', 1, 'Berlin Office', 52.5, 13.4, 'Europe/Berlin', '10:30', '2026-07-14');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Pickup: Avis Rental');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T090000');
    expect(ics).toContain('SUMMARY:Drop-off: Avis Rental');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20260714T103000');
  });

  it('CAL-039: a rental with only reservation_time/reservation_end_time still produces both events', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const place = createPlace(testDb, trip.id, { name: 'Rental Desk', lat: 48.8566, lng: 2.3522 });
    const reservation = createReservation(testDb, trip.id, { title: 'Budget Rental', type: 'car' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-07-07T09:00', reservation_end_time: '2026-07-14T10:30', place: place.id });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Pickup: Budget Rental');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T090000');
    expect(ics).toContain('SUMMARY:Drop-off: Budget Rental');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260714T103000');
  });

  it('CAL-040: a rental with a single endpoint does not emit a bogus second event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Sixt Rental', type: 'car' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null, reservation_end_time: null });
    // Only the pickup was geocoded — the common shape for a partially-imported
    // booking. The lone endpoint must not be reused as the drop-off too.
    await insertEndpoint(reservation.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', '09:00', '2026-07-07');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Pickup: Sixt Rental');
    expect(ics).not.toContain('Drop-off');
  });

  it('CAL-041: a rental with no usable clock emits no window events and its existing behaviour is unchanged', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Untimed Rental', type: 'car' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: null, reservation_end_time: null });
    // A date but no clock — the pre-existing "untimed transport" all-day
    // fallback still applies and must be unaffected by the new marker events.
    await insertEndpoint(reservation.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', null, '2026-07-07');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('Pickup');
    expect(ics).not.toContain('Drop-off');
    expect(ics).toContain('SUMMARY:Untimed Rental');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260707');
  });

  it('CAL-042: a clock that already carries seconds keeps its zone', async () => {
    // The booking import stores what KItinerary hands it, which is "10:00:00".
    // fmtDateTime's time-only branch appended "00" regardless, so the value came
    // out 17 characters long, dtLine refused to attach the TZID and the event
    // went out floating — the #1453 regression by another route.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'Seconds Rental', type: 'car' });
    await updateRows(orm, Reservations, { id: reservation.id }, { reservation_time: '2026-07-07T09:00:00', reservation_end_time: '18:30:00' });
    await insertEndpoint(reservation.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', '09:00:00', '2026-07-07');
    await insertEndpoint(reservation.id, 'to', 1, 'Lyon Office', 45.764, 4.8357, 'Europe/Paris', '18:30:00', '2026-07-07');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T090000');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T183000');
    // No 17-character value anywhere: that is what silently drops the zone.
    expect(ics).not.toMatch(/DTSTART[^\r\n]*\d{8}T\d{8}/);
  });

  // ── Window bookings: two hand-overs, not one block (#2068) ─────────────────

  it('CAL-045: multi-day parking becomes a drop-off and a pick-up instead of one block', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const parking = createReservation(testDb, trip.id, { title: 'Airport P4', type: 'parking' });
    await updateRows(orm, Reservations, { id: parking.id }, { reservation_time: '2026-07-01T06:30', reservation_end_time: '2026-07-10T22:15' });

    const { ics } = await svc.exportICS(trip.id);

    // The two hand-overs, an hour each. Parking is dropped off first.
    expect(ics).toContain('SUMMARY:Drop-off: Airport P4');
    expect(ics).toContain('DTSTART:20260701T063000');
    expect(ics).toContain('DTEND:20260701T073000');
    expect(ics).toContain('SUMMARY:Pickup: Airport P4');
    expect(ics).toContain('DTSTART:20260710T221500');
    expect(ics).toContain('DTEND:20260710T231500');
    // And the block across the ten days in between is gone.
    expect(ics).not.toContain('SUMMARY:Airport P4\r\n');
    expect(ics).not.toContain('DTEND:20260710T221500');
  });

  it('CAL-046: a same-day parking is one sitting and keeps its single event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const parking = createReservation(testDb, trip.id, { title: 'Garage', type: 'parking' });
    await updateRows(orm, Reservations, { id: parking.id }, { reservation_time: '2026-07-01T08:00', reservation_end_time: '2026-07-01T18:30' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Garage\r\n');
    expect(ics).toContain('DTSTART:20260701T080000');
    expect(ics).toContain('DTEND:20260701T183000');
    expect(ics).not.toContain('Drop-off: Garage');
    expect(ics).not.toContain('Pickup: Garage');
  });

  it('CAL-047: a rental typed with days but no clock finally reaches the feed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const first = createDay(testDb, trip.id, { date: '2026-07-03' });
    const last = createDay(testDb, trip.id, { date: '2026-07-08' });
    const rental = createReservation(testDb, trip.id, { title: 'Sixt', type: 'car' });
    // The planner writes reservation_time = NULL when the optional time pickers
    // are left blank, which is what made this booking invisible.
    await updateRows(orm, Reservations, { id: rental.id }, { reservation_time: null, reservation_end_time: null, day: first.id, endDay: last.id });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Pickup: Sixt');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260703');
    expect(ics).toContain('SUMMARY:Drop-off: Sixt');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260708');
  });

  it('CAL-048: a split rental keeps its zones and everything the block used to say', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const rental = createReservation(testDb, trip.id, { title: 'Hertz', type: 'car' });
    await updateRows(orm, Reservations, { id: rental.id }, { reservation_time: null, reservation_end_time: null, confirmation_number: 'HZ-4471', location: 'Hertz Downtown' });
    await insertEndpoint(rental.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', '09:00', '2026-07-07');
    await insertEndpoint(rental.id, 'to', 1, 'Berlin Office', 52.5, 13.4, 'Europe/Berlin', '10:30', '2026-07-14');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T090000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20260707T100000');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20260714T103000');
    expect(ics).toContain('DTEND;TZID=Europe/Berlin:20260714T113000');
    // Dropping the block must not drop what it said: both hand-overs carry it.
    // Long lines are folded at 75 octets, so unfold before reading them.
    const unfolded = ics.replaceAll('\r\n ', '');
    const descriptions = unfolded.split('\r\n').filter(l => l.startsWith('DESCRIPTION:Type: car'));
    expect(descriptions).toHaveLength(2);
    expect(descriptions[0]).toContain('Confirmation: HZ-4471');
    expect(descriptions[0]).toContain('Route: Paris Office → Berlin Office');
  });

  // #1453 — the block is the only carrier of the return time when just one side
  // was geocoded, so a one-sided rental must keep it.
  it('CAL-049: a one-sided rental keeps its block rather than losing the return', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const place = createPlace(testDb, trip.id, { name: 'Rental Desk', lat: 48.8566, lng: 2.3522 });
    const rental = createReservation(testDb, trip.id, { title: 'Avis', type: 'car' });
    await updateRows(orm, Reservations, { id: rental.id }, { reservation_time: '2026-07-02T10:00', reservation_end_time: '2026-07-09T10:00', place: place.id });

    const { ics } = await svc.exportICS(trip.id);

    // Both sides resolve off reservation_time/-_end_time, so this one does split,
    // and the return keeps the pickup's zone instead of floating.
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260702T100000');
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260709T100000');
    expect(ics).not.toMatch(/DTSTART:20260709T100000/);
  });

  it('CAL-050: a rental with only a pickup endpoint is left exactly as it was', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const rental = createReservation(testDb, trip.id, { title: 'Solo', type: 'car' });
    await updateRows(orm, Reservations, { id: rental.id }, { reservation_time: null, reservation_end_time: null });
    await insertEndpoint(rental.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, 'Europe/Paris', '09:00', '2026-07-07');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Solo\r\n');
    expect(ics).toContain('SUMMARY:Pickup: Solo');
    expect(ics).not.toContain('Drop-off');
  });

  it('CAL-051: any transport pinned to days without a clock reaches the feed too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const first = createDay(testDb, trip.id, { date: '2026-07-03' });
    const last = createDay(testDb, trip.id, { date: '2026-07-04' });
    const bus = createReservation(testDb, trip.id, { title: 'Night Bus', type: 'bus' });
    await updateRows(orm, Reservations, { id: bus.id }, { reservation_time: null, reservation_end_time: null, day: first.id, endDay: last.id });

    const { ics } = await svc.exportICS(trip.id);

    // Not a window booking, so it stays one block — it just exists now.
    expect(ics).toContain('SUMMARY:Night Bus');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260703');
    expect(ics).toContain('DTEND;VALUE=DATE:20260705');
    expect(ics).not.toContain('Pickup: Night Bus');
  });

  it('CAL-052: a split rental whose endpoints carry no zone falls back to their coordinates', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const rental = createReservation(testDb, trip.id, { title: 'Europcar', type: 'car' });
    await updateRows(orm, Reservations, { id: rental.id }, { reservation_time: null, reservation_end_time: null });
    // An older import that geocoded both ends but stored no IANA zone.
    await insertEndpoint(rental.id, 'from', 0, 'Paris Office', 48.8566, 2.3522, null, '09:00', '2026-07-07');
    await insertEndpoint(rental.id, 'to', 1, 'Berlin Office', 52.5, 13.4, null, '10:30', '2026-07-14');

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20260707T090000');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20260714T103000');
  });

  // reservation_end_time is frequently a bare clock next to the booking's own
  // date, which puts both hand-overs on the same day — so it is one sitting.
  it('CAL-053: a bare end clock resolves against the start date rather than splitting', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const parking = createReservation(testDb, trip.id, { title: 'Street Bay', type: 'parking' });
    await updateRows(orm, Reservations, { id: parking.id }, { reservation_time: '2026-07-01T08:00', reservation_end_time: '18:30' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Street Bay\r\n');
    expect(ics).not.toContain('Drop-off: Street Bay');
    expect(ics).not.toContain('Pickup: Street Bay');
  });

  it('CAL-054: an unsplit rental with a day but no clock emits no hand-over of its own', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Road Trip' });
    const day = createDay(testDb, trip.id, { date: '2026-07-03' });
    const rental = createReservation(testDb, trip.id, { title: 'Dayless', type: 'car' });
    // A day but no end day and no clock: one side resolves, and it has no time,
    // so there is nothing to place — the all-day block carries it instead.
    await updateRows(orm, Reservations, { id: rental.id }, { reservation_time: null, reservation_end_time: null, day: day.id, endDay: null });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Dayless\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260703');
    expect(ics).not.toContain('Pickup: Dayless');
    expect(ics).not.toContain('Drop-off: Dayless');
  });
});

describe('staged bookings', () => {
  /** A stay plus, optionally, the bookings that point at it. */
  const stayWith = async (tripId: number, states: Array<{ state: string; title: string }>) => {
    const place = createPlace(testDb, tripId, { name: 'Hotel Bellevue', lat: 48.8566, lng: 2.3522 });
    const startDay = createDay(testDb, tripId, { date: '2026-09-01' });
    const endDay = createDay(testDb, tripId, { date: '2026-09-04' });
    const stayId = (await insertRow(orm, DayAccommodations, { trip: tripId, place: place.id, startDay: startDay.id, endDay: endDay.id, check_in: '15:00', check_out: '11:00' })) as number;

    for (const s of states) {
      await insertRow(orm, Reservations, { trip: tripId, day: startDay.id, title: s.title, reservation_time: '2026-09-01T15:00', status: 'confirmed', type: 'hotel', accommodation_id: String(stayId), ingest_state: s.state });
    }
    return { stayId, placeId: place.id };
  };

  it('CAL-055: a staged booking is left out of the calendar, confirmation number included', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Kyoto' });
    const day = createDay(testDb, trip.id, { date: '2026-09-01' });
    const staged = createReservation(testDb, trip.id, { title: 'Parked Flight', type: 'flight', day_id: day.id });
    await updateRows(orm, Reservations, { id: staged.id }, { ingest_state: 'staged', reservation_time: '2026-09-01T08:00', confirmation_number: 'ABC123' });
    const live = createReservation(testDb, trip.id, { title: 'Booked Flight', type: 'flight', day_id: day.id });
    await updateRows(orm, Reservations, { id: live.id }, { reservation_time: '2026-09-01T12:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Booked Flight');
    expect(ics).not.toContain('Parked Flight');
    // The number rides in the DESCRIPTION, not the SUMMARY, so search the whole document.
    expect(ics).not.toContain('ABC123');
  });

  it('CAL-056: a booking created before the column existed still exports', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Lisbon' });
    const day = createDay(testDb, trip.id, { date: '2026-09-02' });
    // No ingest_state named on the insert: exactly what every writer does today,
    // and what the ALTER backfilled onto every pre-existing row.
    const old = createReservation(testDb, trip.id, { title: 'Legacy Booking', type: 'flight', day_id: day.id });
    await updateRows(orm, Reservations, { id: old.id }, { reservation_time: '2026-09-02T09:00' });

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Legacy Booking');
  });

  it('CAL-057: an accommodation whose only booking is staged emits no stay, check-in or check-out', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Osaka' });
    await stayWith(trip.id, [{ state: 'staged', title: 'Parked Hotel' }]);

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).not.toContain('Parked Hotel');
    expect(ics).not.toMatch(/UID:trek-checkin-\d+@trek/);
    expect(ics).not.toMatch(/UID:trek-checkout-\d+@trek/);
  });

  it('CAL-058: an accommodation with no linked booking at all still emits its stay', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Nara' });
    // The regression this pins: a plain EXISTS(live) instead of
    // NOT EXISTS(any) OR EXISTS(live) would drop every hand-added hotel out of
    // trips that are shared today.
    await stayWith(trip.id, []);

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('Hotel Bellevue');
    expect(ics).toMatch(/UID:trek-checkin-\d+@trek/);
  });

  it('CAL-059: a stay with both a staged and a live booking takes its title from the live one', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Kobe' });
    // The staged row gets the lower id, so the subquery's ORDER BY r.id ASC
    // would pick it without the predicate.
    await stayWith(trip.id, [{ state: 'staged', title: 'Parked Name' }, { state: 'live', title: 'Real Name' }]);

    const { ics } = await svc.exportICS(trip.id);

    expect(ics).toContain('Real Name');
    expect(ics).not.toContain('Parked Name');
  });
});

describe('folded quirk branches', () => {
  it('TRIP-SVC-048: exportICS renders untimed/notes all-day summaries, multi-leg routes, endpoint routes and train/location fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Branchy' });
    const day = createDay(testDb, trip.id, { date: '2025-06-02' });
    const place = createPlace(testDb, trip.id, { name: 'Untimed Spot' });
    await updateRows(orm, Places, { id: place.id }, { address: '1 Rue Test' });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { notes: 'bring hat' });
    createDayNote(testDb, day.id, trip.id, { text: 'timed note', time: '10:00' });
    createDayNote(testDb, day.id, trip.id, { text: 'plain note' });

    // Multi-leg flight metadata → Route: A → B → C, plus train + notes + location.
    const flight = createReservation(testDb, trip.id, { title: 'Legs', type: 'flight' });
    await updateRows(orm, Reservations, { id: flight.id }, { reservation_time: '2025-06-02T09:00', metadata: JSON.stringify({ legs: [{ from: 'FRA', to: 'BER' }, { to: 'HND' }], train_number: 'ICE 100' }), notes: 'window seat', location: 'Gate 4', confirmation_number: 'ABC123' });
    // Endpoint-derived route (no route metadata) with a date-only endpoint fallback.
    const transport = createReservation(testDb, trip.id, { title: 'Ferry', type: 'transport' });
    await updateRows(orm, Reservations, { id: transport.id }, { reservation_time: null });
    await insertRow(orm, ReservationEndpoints, { reservation: transport.id, role: 'from', sequence: 0, name: 'Pier A', code: null, lat: 1.0, lng: 1.0, timezone: null, local_time: null, local_date: '2025-06-03' });
    await insertRow(orm, ReservationEndpoints, { reservation: transport.id, role: 'to', sequence: 1, name: 'Pier B', code: 'PB', lat: 1.1, lng: 1.1, timezone: null, local_time: null, local_date: '2025-06-03' });

    // Unfold the RFC 5545 75-octet folding so substring assertions see whole lines.
    const ics = (await svc.exportICS(trip.id)).ics.replace(/\r\n /g, '');

    expect(ics).toContain('SUMMARY:Day 1');
    expect(ics).toContain('• Untimed Spot (1 Rue Test) — bring hat');
    expect(ics).toContain('Notes:\\n10:00 — timed note\\n• plain note');
    expect(ics).toContain('Route: FRA → BER → HND');
    expect(ics).toContain('Train: ICE 100');
    expect(ics).toContain('Confirmation: ABC123');
    expect(ics).toContain('window seat');
    expect(ics).toContain('LOCATION:Gate 4');
    // Date-only endpoint → all-day DTSTART for the transport.
    expect(ics).toContain('SUMMARY:Ferry');
    expect(ics).toContain('DTSTART;VALUE=DATE:20250603');
  });
});

// foldICS is the last thing that touches the bytes of both the download and the
// feed, and it is exported, so it is pinned directly instead of through a trip.
describe('foldICS', () => {
  // Physical lines are measured in octets, so the split points below are byte
  // offsets, not character offsets.
  const octets = (s: string) => Buffer.from(s, 'utf8').length;
  const unfold = (s: string) => s.replace(/\r\n /g, '');

  it('CAL-023: lines up to 75 octets are untouched and longer ones fold at 75 then 74', async () => {
    const short = 'SUMMARY:' + 'a'.repeat(67); // exactly 75 octets
    expect(foldICS(short)).toBe(short);

    const long = 'SUMMARY:' + 'a'.repeat(200);
    const physical = foldICS(long).split('\r\n');
    expect(physical[0]).toHaveLength(75);
    // Continuation lines spend one octet on the leading space, so they carry 74
    // payload octets — budgeting 75 there produces 76-octet lines that strict
    // validators reject.
    expect(physical[1].startsWith(' ')).toBe(true);
    expect(physical[1]).toHaveLength(75);
    expect(unfold(foldICS(long))).toBe(long);
  });

  it('CAL-024: a two-byte codepoint straddling the 75th octet is not split', async () => {
    // The fold boundary lands inside "é": without the backoff the two halves are
    // decoded separately and the title arrives as U+FFFD in every client.
    const line = 'DESCRIPTION:' + 'é'.repeat(60);
    expect(octets(line)).toBeGreaterThan(75);

    const folded = foldICS(line);

    expect(folded).not.toContain('\uFFFD');
    expect(unfold(folded)).toBe(line);
    for (const part of folded.split('\r\n')) expect(octets(part)).toBeLessThanOrEqual(75);
  });

  it('CAL-025: a four-byte codepoint backs the split off by more than one octet', async () => {
    // An emoji needs the backoff to run several times before it reaches a lead
    // byte; stopping after a single step still cuts the sequence.
    const line = 'SUMMARY:' + '🎌'.repeat(40);

    const folded = foldICS(line);

    expect(folded).not.toContain('\uFFFD');
    expect(unfold(folded)).toBe(line);
    for (const part of folded.split('\r\n')) expect(octets(part)).toBeLessThanOrEqual(75);
  });

  it('CAL-026: folding is applied per content line, so short lines around a long one survive', async () => {
    const ics = 'BEGIN:VEVENT\r\nSUMMARY:' + 'ü'.repeat(80) + '\r\nEND:VEVENT';

    const folded = foldICS(ics);

    expect(folded.startsWith('BEGIN:VEVENT\r\n')).toBe(true);
    expect(folded.endsWith('\r\nEND:VEVENT')).toBe(true);
    expect(unfold(folded)).toBe(ics);
  });
});

// The snapshot below was taken from the implementation as it stood when the code
// moved out of TripsService, before the calendar grew a structured model. It is
// the parity net for any change to how the calendar is assembled: the 20 cases
// above pin individual lines, this one pins the whole document including the
// order of the VTIMEZONE blocks and the folding.
describe('serialised output', () => {
  it('CAL-010: a trip with a zoned assignment, a note day and a flight serialises byte for byte', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Golden Trip',
      description: 'Line one',
      start_date: '2026-05-01',
      end_date: '2026-05-01',
    });
    const day = createDay(testDb, trip.id, { date: '2026-05-01' });
    // The factories insert only the columns they model; every other column is set
    // afterwards with an explicit UPDATE, the way the cases above do it. This case
    // sets none, so the place has no address and the flight no reservation_time,
    // and the snapshot was recorded from exactly that data: the assignment carries
    // no LOCATION, and the flight is dropped from the export for having no
    // placeable time.
    const place = createPlace(testDb, trip.id, { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { assignment_time: '09:00', assignment_end_time: '10:30' });
    createDayNote(testDb, day.id, trip.id, { text: 'Bring the tickets', time: '08:00' });
    createReservation(testDb, trip.id, { title: 'NH 203', type: 'flight' });

    // DTSTAMP is the wall clock and the UID numbers are autoincrement state shared
    // with every case above, so both are normalised: this pins the document, not
    // the minute it ran in or its position in the file.
    const ics = (await svc.exportICS(trip.id)).ics
      .replace(/DTSTAMP:\d{8}T\d{6}Z/g, 'DTSTAMP:<stamp>')
      .replace(/UID:trek-([a-z]+)-\d+@trek/g, 'UID:trek-$1-<n>@trek');

    expect(ics).toMatchInlineSnapshot(`
      "BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//TREK//Travel Planner//EN
      CALSCALE:GREGORIAN
      METHOD:PUBLISH
      X-WR-CALNAME:Golden Trip
      BEGIN:VTIMEZONE
      TZID:Asia/Tokyo
      BEGIN:STANDARD
      DTSTART:19700101T000000
      TZOFFSETFROM:+0900
      TZOFFSETTO:+0900
      TZNAME:Asia/Tokyo
      END:STANDARD
      END:VTIMEZONE
      BEGIN:VEVENT
      UID:trek-trip-<n>@trek
      DTSTAMP:<stamp>
      DTSTART;VALUE=DATE:20260501
      DTEND;VALUE=DATE:20260502
      SUMMARY:Golden Trip
      DESCRIPTION:Line one
      END:VEVENT
      BEGIN:VEVENT
      UID:trek-assign-<n>@trek
      DTSTAMP:<stamp>
      DTSTART;TZID=Asia/Tokyo:20260501T090000
      DTEND;TZID=Asia/Tokyo:20260501T103000
      SUMMARY:Tokyo Tower
      END:VEVENT
      BEGIN:VEVENT
      UID:trek-day-<n>@trek
      DTSTAMP:<stamp>
      DTSTART;VALUE=DATE:20260501
      DTEND;VALUE=DATE:20260502
      SUMMARY:Day 2
      DESCRIPTION:Notes:\\n08:00 — Bring the tickets
      END:VEVENT
      END:VCALENDAR
      "
    `);
  });
});

describe('CalendarService wiring', () => {
  it('CAL-001: the module registers the service, so injection cannot silently fail', async () => {
    expectRegisteredProvider(CalendarModule, CalendarService);
    const exports = Reflect.getMetadata('exports', CalendarModule) as unknown[];
    expect(Array.isArray(exports)).toBe(true);
    expect(exports).toEqual(expect.arrayContaining([CalendarService]));
  });
});
