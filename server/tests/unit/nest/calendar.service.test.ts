/**
 * Unit tests for CalendarService. The cases moved 1:1 out of
 * tests/unit/nest/trips.service.test.ts together with the code they cover
 * (TRIP-SVC-001..002b, 020..027 and 048); the identifiers are unchanged so the
 * diff shows a move rather than a rewrite, and the assertions still pin the
 * emitted ICS byte for byte. Uses a real in-memory SQLite DB so the SQL runs.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createPlace, createDay, createDayAssignment, createDayNote } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CalendarService, foldICS } from '../../../src/nest/calendar/calendar.service';
import { CalendarModule } from '../../../src/nest/calendar/calendar.module';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { notificationsStub } from '../../helpers/notifications';

const dbs = () => new DatabaseService(testDb);
const budgetSvc = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());

// Named `svc` so the moved cases below read exactly as they did on TripsService.
const svc = new CalendarService(
  dbs(),
  new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService(), notificationsStub()),
);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('exportICS', () => {
  it('TRIP-SVC-001: returns VCALENDAR wrapper', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'My Vacation',
      start_date: '2025-06-01',
      end_date: '2025-06-07',
    });

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('TRIP-SVC-002: trip with start_date + end_date includes all-day VEVENT', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'Summer Holiday',
      start_date: '2025-06-01',
      end_date: '2025-06-07',
    });

    const { ics } = svc.exportICS(trip.id);

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
      it(`TRIP-SVC-002b: DTEND is the day after the last day under TZ=${tz}`, () => {
        process.env.TZ = tz;
        const { user } = createUser(testDb);
        const trip = createTrip(testDb, user.id, {
          title: 'TZ Trip',
          start_date: '2026-03-28',
          end_date: '2026-03-30',
        });

        const { ics } = svc.exportICS(trip.id);

        expect(ics).toContain('DTSTART;VALUE=DATE:20260328');
        expect(ics).toContain('DTEND;VALUE=DATE:20260331');
      });
    }

    it('TRIP-SVC-002c: a per-day all-day summary event has the same exclusive DTEND', () => {
      process.env.TZ = 'Asia/Tokyo';
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id, { title: 'Day Note Trip' });
      const day = createDay(testDb, trip.id, { date: '2026-03-30', day_number: 1 });
      createDayNote(testDb, day.id, trip.id, { text: 'Pack the bags' });

      const { ics } = svc.exportICS(trip.id);

      expect(ics).toContain('DTSTART;VALUE=DATE:20260330');
      expect(ics).toContain('DTEND;VALUE=DATE:20260331');
    });
  });

  it('TRIP-SVC-003: reservation with full datetime (includes T) → DTSTART without VALUE=DATE', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Morning Flight',
      type: 'flight',
    });
    testDb
      .prepare('UPDATE reservations SET reservation_time=? WHERE id=?')
      .run('2025-06-02T09:00', reservation.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART:20250602T090000');
    expect(ics).not.toContain('DTSTART;VALUE=DATE');
  });

  it('TRIP-SVC-004: reservation with date-only → DTSTART;VALUE=DATE', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Hotel Check-in',
      type: 'hotel',
    });
    testDb
      .prepare('UPDATE reservations SET reservation_time=? WHERE id=?')
      .run('2025-06-02', reservation.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20250602');
  });

  it('TRIP-SVC-005: reservation metadata with flight info appears in DESCRIPTION', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'CDG to JFK',
      type: 'flight',
    });
    testDb
      .prepare('UPDATE reservations SET reservation_time=?, metadata=? WHERE id=?')
      .run(
        '2025-06-02T09:00',
        JSON.stringify({
          airline: 'Air Test',
          flight_number: 'AT100',
          departure_airport: 'CDG',
          arrival_airport: 'JFK',
        }),
        reservation.id
      );

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('Airline: Air Test');
    expect(ics).toContain('Flight: AT100');
  });

  it('TRIP-SVC-006: special characters in title are escaped', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip; First, Best' });

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('Trip\\; First\\, Best');
  });

  it('TRIP-SVC-007: throws NotFoundError for non-existent trip', () => {
    expect(() => svc.exportICS(99999)).toThrow();
  });

  it('TRIP-SVC-008: returns a filename derived from trip title', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'My Trip 2025' });

    const { filename } = svc.exportICS(trip.id);

    expect(filename).toMatch(/My.Trip.2025\.ics/);
  });

  it('TRIP-SVC-009: reservation with end time includes DTEND', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Afternoon Tour',
      type: 'activity',
    });
    testDb
      .prepare('UPDATE reservations SET reservation_time=?, reservation_end_time=? WHERE id=?')
      .run('2025-06-02T14:00', '2025-06-02T16:00', reservation.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTEND:20250602T160000');
  });

  it('TRIP-SVC-024: flight with endpoint times but no reservation_time is included', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'CDG → JFK',
      type: 'flight',
    });
    // Confirmed flights store times per endpoint, never as reservation_time.
    testDb.prepare('UPDATE reservations SET reservation_time=NULL, reservation_end_time=NULL WHERE id=?').run(reservation.id);
    const insertEp = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertEp.run(reservation.id, 'from', 0, 'Paris CDG', 'CDG', 49.0, 2.5, 'Europe/Paris', '09:00', '2025-06-02');
    insertEp.run(reservation.id, 'to', 1, 'New York JFK', 'JFK', 40.6, -73.8, 'America/New_York', '12:00', '2025-06-02');

    const { ics } = svc.exportICS(trip.id);

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

  it('TRIP-SVC-024b: an invalid endpoint timezone degrades to floating time instead of crashing the export', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Bad TZ Trip' });
    const reservation = createReservation(testDb, trip.id, { title: 'CDG → JFK', type: 'flight' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL, reservation_end_time=NULL WHERE id=?').run(reservation.id);
    const insertEp = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // A stored/plugin-written timezone can be any string; it must never reach Intl.
    // The bogus zone takes precedence over the coordinates (first.timezone || resolveZone).
    insertEp.run(reservation.id, 'from', 0, 'Paris CDG', 'CDG', 49.0, 2.5, 'Not/AZone', '09:00', '2025-06-02');
    insertEp.run(reservation.id, 'to', 1, 'New York JFK', 'JFK', 40.6, -73.8, 'garbage', '12:00', '2025-06-02');

    let ics = '';
    expect(() => { ics = svc.exportICS(trip.id).ics; }).not.toThrow();
    // Falls back to a floating local time (no TZID) and never emits a bogus VTIMEZONE.
    expect(ics).toContain('DTSTART:20250602T090000');
    expect(ics).not.toContain('TZID=Not/AZone');
    expect(ics).not.toContain('garbage');
  });

  it('TRIP-SVC-025: flight endpoint with no local_date is skipped (relative Day-N trips)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Relative Trip' });
    const reservation = createReservation(testDb, trip.id, {
      title: 'Timeless Flight',
      type: 'flight',
    });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(reservation.id);
    testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(reservation.id, 'from', 0, 'Origin', 'AAA', 1.0, 1.0, null, '09:00', null);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).not.toContain('SUMMARY:Timeless Flight');
  });

  it('TRIP-SVC-026: timed assignment gets a TZID derived from the place coordinates', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Trip' });
    const day = createDay(testDb, trip.id, { date: '2025-06-02' });
    // Tokyo coordinates → Asia/Tokyo via tz-lookup.
    const place = createPlace(testDb, trip.id, { name: 'Senso-ji', lat: 35.7148, lng: 139.7967 });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    testDb
      .prepare('UPDATE day_assignments SET assignment_time=? WHERE id=?')
      .run('09:00', assignment.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20250602T090000');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Asia/Tokyo');
    expect(ics).not.toContain('DTSTART:20250602T090000');
  });

  it('CAL-011: a reservation_time with seconds is kept as is and a date-only end time emits no DTEND', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Second Precision' });
    const reservation = createReservation(testDb, trip.id, { title: 'Guided Walk', type: 'activity' });
    // Importers write both shapes: "…T14:00" (padded to seconds) and "…T14:00:00"
    // (already 15 chars). Padding the second one again would produce a 17-char
    // value that no client parses.
    testDb
      .prepare('UPDATE reservations SET reservation_time=?, reservation_end_time=? WHERE id=?')
      .run('2025-06-02T14:00:00', '2025-06-03', reservation.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART:20250602T140000');
    // The end value carries no clock time, so it cannot be a DTEND for a timed
    // event; emitting the bare "20250603" would make the event span a nonsense
    // range instead of being left open.
    expect(ics).not.toContain('DTEND');
  });

  it('CAL-012: reservations with no placeable time are dropped instead of emitting a broken VEVENT', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Timeless' });
    // Relative "Day N" trips store a clock time without a date; there is nothing
    // to anchor it to, so the reservation must not reach the calendar at all.
    const timeOnly = createReservation(testDb, trip.id, { title: 'Floating Dinner', type: 'restaurant' });
    testDb.prepare('UPDATE reservations SET reservation_time=? WHERE id=?').run('19:30', timeOnly.id);
    // A transport row whose endpoints were never imported has no fallback time either.
    const noEndpoints = createReservation(testDb, trip.id, { title: 'Endpointless Train', type: 'transport' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(noEndpoints.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).not.toContain('SUMMARY:Floating Dinner');
    expect(ics).not.toContain('SUMMARY:Endpointless Train');
    // The trip itself has no dates and no days, so dropping both reservations
    // leaves an event-free calendar rather than a partially filled one.
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('CAL-013: endpoints without a stored timezone fall back to their coordinates', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'No Stored Zone' });
    const reservation = createReservation(testDb, trip.id, { title: 'CDG to JFK', type: 'flight' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(reservation.id);
    const insertEp = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Endpoints created before the importer learned to store IANA zones have only
    // coordinates. Without the lookup fallback both ends would go floating and the
    // subscriber would see the flight in their own zone (#1453).
    insertEp.run(reservation.id, 'from', 0, 'Paris CDG', 'CDG', 49.0, 2.5, null, '09:00', '2025-06-02');
    insertEp.run(reservation.id, 'to', 1, 'New York JFK', 'JFK', 40.6, -73.8, null, '12:00', '2025-06-02');

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('DTEND;TZID=America/New_York:20250602T120000');
  });

  it('CAL-014: a single-endpoint transport emits DTSTART only', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'One Way' });
    const reservation = createReservation(testDb, trip.id, { title: 'Airport Transfer', type: 'transport' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(reservation.id);
    // Only the departure was imported. Using it for DTEND as well would emit a
    // zero-length event; leaving DTEND out lets clients apply their default duration.
    testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(reservation.id, 'from', 0, 'Paris CDG', 'CDG', 49.0, 2.5, 'Europe/Paris', '09:00', '2025-06-02');

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).not.toContain('DTEND');
  });

  it('CAL-015: a timed assignment carries its notes and address into DESCRIPTION and LOCATION', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Guided Day' });
    const day = createDay(testDb, trip.id, { date: '2025-06-02' });
    const place = createPlace(testDb, trip.id, { name: 'Louvre', lat: 48.8606, lng: 2.3376 });
    testDb.prepare("UPDATE places SET address = 'Rue de Rivoli' WHERE id = ?").run(place.id);
    const withNotes = createDayAssignment(testDb, day.id, place.id, { notes: 'meet the guide' });
    testDb.prepare('UPDATE day_assignments SET assignment_time=? WHERE id=?').run('09:00', withNotes.id);
    const withoutNotes = createDayAssignment(testDb, day.id, place.id);
    testDb.prepare('UPDATE day_assignments SET assignment_time=? WHERE id=?').run('11:00', withoutNotes.id);

    const ics = svc.exportICS(trip.id).ics.replace(/\r\n /g, '');

    // Notes come first and the address is appended on its own line; dropping the
    // separator would glue them into one unreadable run.
    expect(ics).toContain('DESCRIPTION:meet the guide\\nRue de Rivoli');
    // Without notes the address must start the description rather than a stray newline.
    expect(ics).toContain('DESCRIPTION:Rue de Rivoli\r\n');
    expect(ics).toContain('LOCATION:Rue de Rivoli');
  });

  it('CAL-016: a day without a date is skipped and a titled day uses its own title', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Mixed Days' });
    // Days of a relative "Day N" trip have no date; they cannot be placed on a
    // calendar, and emitting them produced a VEVENT with an empty DTSTART.
    const ghost = createDay(testDb, trip.id, { title: 'Ghost Day' });
    createDayNote(testDb, ghost.id, trip.id, { text: 'never exported' });
    const named = createDay(testDb, trip.id, { date: '2025-06-02', title: 'Museum Day' });
    const place = createPlace(testDb, trip.id, { name: 'Bare Spot' });
    createDayAssignment(testDb, named.id, place.id);

    const ics = svc.exportICS(trip.id).ics.replace(/\r\n /g, '');

    expect(ics).not.toContain('Ghost Day');
    expect(ics).not.toContain('never exported');
    // A day with a title must not be renamed to "Day <n>".
    expect(ics).toContain('SUMMARY:Museum Day');
    // No address and no notes → the bullet stays bare, with no empty "()" or dash.
    expect(ics).toContain('DESCRIPTION:• Bare Spot\r\n');
  });

  it('CAL-017: a reservation with no type, metadata or notes emits no empty DESCRIPTION', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Bare' });
    const reservation = createReservation(testDb, trip.id, { title: 'Bare Booking', type: 'hotel' });
    // Rows imported before `type` became mandatory still exist in prod. An empty
    // DESCRIPTION line is invalid enough for some clients to reject the file.
    testDb
      .prepare('UPDATE reservations SET type=NULL, reservation_time=? WHERE id=?')
      .run('2025-06-02', reservation.id);

    const { ics } = svc.exportICS(trip.id);

    expect(ics).toContain('SUMMARY:Bare Booking');
    expect(ics).not.toContain('DESCRIPTION');
  });

  it('CAL-018: flight metadata with only one airport emits only that side of the route', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Half Routes' });
    const inbound = createReservation(testDb, trip.id, { title: 'Inbound', type: 'flight' });
    const outbound = createReservation(testDb, trip.id, { title: 'Outbound', type: 'flight' });
    const setMeta = testDb.prepare('UPDATE reservations SET reservation_time=?, metadata=? WHERE id=?');
    // A hand-entered flight often has one airport only; the missing side must be
    // left out instead of printing "To: undefined".
    setMeta.run('2025-06-02T09:00', JSON.stringify({ arrival_airport: 'JFK' }), inbound.id);
    setMeta.run('2025-06-09T09:00', JSON.stringify({ departure_airport: 'CDG' }), outbound.id);

    const ics = svc.exportICS(trip.id).ics.replace(/\r\n /g, '');

    expect(ics).toContain('DESCRIPTION:Type: flight\\nTo: JFK\r\n');
    expect(ics).toContain('DESCRIPTION:Type: flight\\nFrom: CDG\r\n');
  });

  it('CAL-019: legs and endpoints without names produce no Route line', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Nameless' });
    const legs = createReservation(testDb, trip.id, { title: 'Codeless Legs', type: 'flight' });
    // Multi-leg metadata whose legs carry no airports would otherwise render
    // "Route: " with nothing after it.
    testDb.prepare('UPDATE reservations SET reservation_time=?, metadata=? WHERE id=?')
      .run('2025-06-02T09:00', JSON.stringify({ legs: [{}, {}] }), legs.id);
    const ferry = createReservation(testDb, trip.id, { title: 'Nameless Ferry', type: 'transport' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(ferry.id);
    const insertEp = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Same for endpoints with neither a code nor a name: the derived route would
    // collapse to a single arrow between two blanks.
    insertEp.run(ferry.id, 'from', 0, '', null, 1.0, 1.0, null, null, '2025-06-03');
    insertEp.run(ferry.id, 'to', 1, '', null, 1.1, 1.1, null, null, '2025-06-03');

    const ics = svc.exportICS(trip.id).ics.replace(/\r\n /g, '');

    expect(ics).toContain('SUMMARY:Codeless Legs');
    expect(ics).toContain('SUMMARY:Nameless Ferry');
    expect(ics).not.toContain('Route:');
  });

  it('CAL-020: an empty trip title falls back for SUMMARY, X-WR-CALNAME and the filename', () => {
    const { user } = createUser(testDb);
    // The title is only NOT NULL, not non-empty; an empty one used to produce
    // "SUMMARY:" and a filename of ".ics".
    const trip = createTrip(testDb, user.id, { title: '', start_date: '2025-06-01', end_date: '2025-06-02' });

    const { ics, filename } = svc.exportICS(trip.id);

    expect(ics).toContain('X-WR-CALNAME:TREK Trip');
    expect(ics).toContain('SUMMARY:Trip');
    expect(filename).toBe('trek-trip.ics');
  });

  it('CAL-021: a corrupt day date degrades the VTIMEZONE offset instead of throwing', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Corrupt Date' });
    // days.date is free-form TEXT; a legacy/imported row can hold a date that no
    // parser accepts. The representative date reaches Intl through the VTIMEZONE
    // fallback, and Intl throws a RangeError on an invalid Date — which would take
    // the whole export (and the trip's slot in the all-trips feed) down with it.
    const day = createDay(testDb, trip.id, { date: '2025-13-45' });
    const place = createPlace(testDb, trip.id, { name: 'Senso-ji', lat: 35.7148, lng: 139.7967 });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    testDb.prepare('UPDATE day_assignments SET assignment_time=? WHERE id=?').run('09:00', assignment.id);

    let ics = '';
    expect(() => { ics = svc.exportICS(trip.id).ics; }).not.toThrow();

    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20251345T090000');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Asia/Tokyo');
    expect(ics).toContain('TZOFFSETFROM:+0000');
    expect(ics).toContain('TZOFFSETTO:+0000');
  });

  it('CAL-022: the timezone cache stays correct after it hits its 1000-entry bound', () => {
    const { user } = createUser(testDb);
    const bulkTrip = createTrip(testDb, user.id, { title: 'Cache Filler' });
    const realTrip = createTrip(testDb, user.id, { title: 'After The Bound' });

    const insertRes = testDb.prepare('INSERT INTO reservations (trip_id, title, type, reservation_time) VALUES (?, ?, ?, NULL)');
    const insertEp = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Endpoint timezones are free-form strings written by importers and plugins, so
    // the validity cache is keyed by attacker-ish input and has to be bounded. Push
    // it past the bound in one export.
    testDb.transaction(() => {
      for (let i = 0; i < 1010; i++) {
        const resId = insertRes.run(bulkTrip.id, `Bulk ${i}`, 'transport').lastInsertRowid as number;
        insertEp.run(resId, 'from', 0, `Stop ${i}`, null, 49.0, 2.5, `Bogus/Zone-${i}`, '09:00', '2025-06-02');
      }
    })();

    const bulk = svc.exportICS(bulkTrip.id).ics;
    // Every one of them has to reach the zone check — otherwise the bound is never
    // approached and this case would pass without exercising anything.
    expect(bulk).toContain('SUMMARY:Bulk 0');
    expect(bulk).toContain('SUMMARY:Bulk 1009');
    expect(bulk).toContain('DTSTART:20250602T090000');
    expect(bulk).not.toContain('TZID=Bogus/Zone-0:');

    const reservation = createReservation(testDb, realTrip.id, { title: 'CDG to JFK', type: 'flight' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(reservation.id);
    insertEp.run(reservation.id, 'from', 0, 'Paris CDG', 'CDG', 49.0, 2.5, 'Europe/Paris', '09:00', '2025-06-02');

    // Clearing the cache must make later zones be re-checked. A regression that
    // evicted by writing `false` instead would silently strip the TZID from every
    // export after the thousandth distinct zone string.
    const { ics } = svc.exportICS(realTrip.id);
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20250602T090000');
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
  });
});

describe('folded quirk branches', () => {
  it('TRIP-SVC-048: exportICS renders untimed/notes all-day summaries, multi-leg routes, endpoint routes and train/location fields', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Branchy' });
    const day = createDay(testDb, trip.id, { date: '2025-06-02' });
    const place = createPlace(testDb, trip.id, { name: 'Untimed Spot' });
    testDb.prepare("UPDATE places SET address = '1 Rue Test' WHERE id = ?").run(place.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    testDb.prepare("UPDATE day_assignments SET notes = 'bring hat' WHERE id = ?").run(assignment.id);
    createDayNote(testDb, day.id, trip.id, { text: 'timed note', time: '10:00' });
    createDayNote(testDb, day.id, trip.id, { text: 'plain note' });

    // Multi-leg flight metadata → Route: A → B → C, plus train + notes + location.
    const flight = createReservation(testDb, trip.id, { title: 'Legs', type: 'flight' });
    testDb.prepare('UPDATE reservations SET reservation_time=?, metadata=?, notes=?, location=?, confirmation_number=? WHERE id=?').run(
      '2025-06-02T09:00',
      JSON.stringify({ legs: [{ from: 'FRA', to: 'BER' }, { to: 'HND' }], train_number: 'ICE 100' }),
      'window seat', 'Gate 4', 'ABC123', flight.id,
    );
    // Endpoint-derived route (no route metadata) with a date-only endpoint fallback.
    const transport = createReservation(testDb, trip.id, { title: 'Ferry', type: 'transport' });
    testDb.prepare('UPDATE reservations SET reservation_time=NULL WHERE id=?').run(transport.id);
    const insertEp = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, code, lat, lng, timezone, local_time, local_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insertEp.run(transport.id, 'from', 0, 'Pier A', null, 1.0, 1.0, null, null, '2025-06-03');
    insertEp.run(transport.id, 'to', 1, 'Pier B', 'PB', 1.1, 1.1, null, null, '2025-06-03');

    // Unfold the RFC 5545 75-octet folding so substring assertions see whole lines.
    const ics = svc.exportICS(trip.id).ics.replace(/\r\n /g, '');

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

  it('CAL-023: lines up to 75 octets are untouched and longer ones fold at 75 then 74', () => {
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

  it('CAL-024: a two-byte codepoint straddling the 75th octet is not split', () => {
    // The fold boundary lands inside "é": without the backoff the two halves are
    // decoded separately and the title arrives as U+FFFD in every client.
    const line = 'DESCRIPTION:' + 'é'.repeat(60);
    expect(octets(line)).toBeGreaterThan(75);

    const folded = foldICS(line);

    expect(folded).not.toContain('�');
    expect(unfold(folded)).toBe(line);
    for (const part of folded.split('\r\n')) expect(octets(part)).toBeLessThanOrEqual(75);
  });

  it('CAL-025: a four-byte codepoint backs the split off by more than one octet', () => {
    // An emoji needs the backoff to run several times before it reaches a lead
    // byte; stopping after a single step still cuts the sequence.
    const line = 'SUMMARY:' + '🎌'.repeat(40);

    const folded = foldICS(line);

    expect(folded).not.toContain('�');
    expect(unfold(folded)).toBe(line);
    for (const part of folded.split('\r\n')) expect(octets(part)).toBeLessThanOrEqual(75);
  });

  it('CAL-026: folding is applied per content line, so short lines around a long one survive', () => {
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
  it('CAL-010: a trip with a zoned assignment, a note day and a flight serialises byte for byte', () => {
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
    testDb.prepare('UPDATE day_assignments SET assignment_time=?, assignment_end_time=? WHERE id=?')
      .run('09:00', '10:30', assignment.id);
    createDayNote(testDb, day.id, trip.id, { text: 'Bring the tickets', time: '08:00' });
    createReservation(testDb, trip.id, { title: 'NH 203', type: 'flight' });

    // DTSTAMP is the wall clock and the UID numbers are autoincrement state shared
    // with every case above, so both are normalised: this pins the document, not
    // the minute it ran in or its position in the file.
    const ics = svc.exportICS(trip.id).ics
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
  it('CAL-001: the module registers the service, so injection cannot silently fail', () => {
    expectRegisteredProvider(CalendarModule, CalendarService);
    const exports = Reflect.getMetadata('exports', CalendarModule) as unknown[];
    expect(Array.isArray(exports)).toBe(true);
    expect(exports).toEqual(expect.arrayContaining([CalendarService]));
  });
});
