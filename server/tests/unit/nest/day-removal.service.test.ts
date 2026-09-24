/**
 * DayRemovalService: deleting one day, the way the reorder dialog, the MCP tool
 * and the plugin RPC all do it. DAY-DEL-001 to DAY-DEL-019.
 *
 * Real in-memory SQLite with the real accommodations and assignments services,
 * so the foreign key cascades and the stay cancellation are the ones production runs.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

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
    canAccessTrip: (tripId: number | string, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: number | string, userId: number) =>
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
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createDayAccommodation } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { DaysService } from '../../../src/nest/days/days.service';
import { DayRemovalService, DayDeleteError, LAST_DAY_MESSAGE, type DayRemoval } from '../../../src/nest/days/day-removal.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { AssignmentsService } from '../../../src/nest/assignments/assignments.service';
import { AccommodationsService, type MirrorSender } from '../../../src/nest/accommodations/accommodations.service';

const dbs = new DatabaseService(testDb);
const permissions = new PermissionsService(dbs);
const realtime = new RealtimeService();
const queryHelpers = new QueryHelpersService(dbs);
const days = new DaysService(dbs, permissions, realtime, queryHelpers);
const journey = new JourneyDomainService(dbs, realtime, new TrekPhotosRepository(dbs));
const assignments = new AssignmentsService(dbs, permissions, realtime, queryHelpers, journey);
const accommodations = new AccommodationsService(dbs, permissions, realtime, assignments);
const removal = new DayRemovalService(dbs, days, accommodations, assignments);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
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

const dayRows = (tripId: number): Row[] =>
  testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as Row[];

const range = (tripId: number) =>
  testDb.prepare('SELECT start_date, end_date FROM trips WHERE id = ?').get(tripId) as { start_date: string | null; end_date: string | null };

const reservationRow = (id: number) =>
  testDb.prepare('SELECT day_id, end_day_id, reservation_time, reservation_end_time FROM reservations WHERE id = ?').get(id) as
    { day_id: number | null; end_day_id: number | null; reservation_time: string | null; reservation_end_time: string | null } | undefined;

function booking(tripId: number, dayId: number | null, time: string | null, extra: { endDayId?: number; endTime?: string } = {}): number {
  return Number(testDb.prepare(
    'INSERT INTO reservations (trip_id, day_id, end_day_id, title, type, reservation_time, reservation_end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(tripId, dayId, extra.endDayId ?? null, 'Booking', 'restaurant', time, extra.endTime ?? null).lastInsertRowid);
}

/** A dated trip whose days the factory generated, one per date. */
function datedTrip(start: string, end: string) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id, { start_date: start, end_date: end });
  return { user, trip, rows: dayRows(trip.id) };
}

/** A booked night: the stay, its hotel booking, the stop on its check-in day and an expense. */
function bookedNight(tripId: number, startDayId: number, endDayId: number) {
  const place = createPlace(testDb, tripId, { name: 'Harbour Hotel' });
  const { accommodation } = accommodations.createAccommodation(tripId, { place_id: place.id, start_day_id: startDayId, end_day_id: endDayId });
  const stayId = (accommodation as { id: number }).id;
  const reservationId = (testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(stayId) as { id: number }).id;
  const budgetId = Number(testDb.prepare(
    'INSERT INTO budget_items (trip_id, name, category, total_price, reservation_id) VALUES (?, ?, ?, ?, ?)',
  ).run(tripId, 'Harbour Hotel', 'Accommodation', 240, reservationId).lastInsertRowid);
  const stop = testDb.prepare('SELECT id, day_id FROM day_assignments WHERE accommodation_id = ?').get(stayId) as { id: number; day_id: number };
  return { place, stayId, reservationId, budgetId, stop };
}

function boundary(tripId: number, dayNumber: number, fromAssignmentId: number) {
  testDb.prepare(
    'INSERT INTO roadtrip_day_boundaries (trip_id, day_number, from_assignment_id, to_assignment_id, fraction) VALUES (?, ?, ?, NULL, 1)',
  ).run(tripId, dayNumber, fromAssignmentId);
}

describe('DayRemovalService.remove', () => {
  it('DAY-DEL-001 an undated day only closes the gap in the numbering', () => {
    const { user } = createUser(testDb);
    const dateless = createTrip(testDb, user.id);
    const [a, b, c] = [createDay(testDb, dateless.id), createDay(testDb, dateless.id), createDay(testDb, dateless.id)];

    const result = removal.remove(dateless.id, b.id, { userId: user.id });

    expect(dayRows(dateless.id)).toEqual([
      { id: a.id, day_number: 1, date: null },
      { id: c.id, day_number: 2, date: null },
    ]);
    expect(result).toMatchObject({ dayId: b.id, orderedIds: [a.id, c.id], endDate: null, boundaries: null, stayIds: [] });

    // The extra day of a dated trip, the case the dialog was asked for: no date moves.
    const dated = datedTrip('2026-03-01', '2026-03-02');
    const spare = createDay(testDb, dated.trip.id);
    const dinner = booking(dated.trip.id, dated.rows[1].id, '2026-03-02T19:00');
    removal.remove(dated.trip.id, spare.id, { userId: dated.user.id });
    expect(dayRows(dated.trip.id)).toEqual(dated.rows);
    expect(range(dated.trip.id)).toEqual({ start_date: '2026-03-01', end_date: '2026-03-02' });
    expect(reservationRow(dinner)?.reservation_time).toBe('2026-03-02T19:00');
  });

  it('DAY-DEL-002 a dated day with a spare day after it: the dates stay on their slots and the bookings move along', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2, d3] = rows;
    const spare = createDay(testDb, trip.id);
    const flight = booking(trip.id, d3.id, '2026-01-03T10:00', { endDayId: d3.id, endTime: '2026-01-03T12:00' });
    const leg = Number(testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng, local_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(flight, 'from', 0, 'HEL', 60.31, 24.96, '2026-01-03').lastInsertRowid);

    const result = removal.remove(trip.id, d2.id, { userId: user.id });

    expect(dayRows(trip.id)).toEqual([
      { id: d1.id, day_number: 1, date: '2026-01-01' },
      { id: d3.id, day_number: 2, date: '2026-01-02' },
      { id: spare.id, day_number: 3, date: '2026-01-03' },
    ]);
    expect(reservationRow(flight)).toMatchObject({ reservation_time: '2026-01-02T10:00', reservation_end_time: '2026-01-02T12:00' });
    expect(testDb.prepare('SELECT local_date FROM reservation_endpoints WHERE id = ?').get(leg)).toEqual({ local_date: '2026-01-02' });
    // The spare day took the last date, so the trip keeps its range.
    expect(range(trip.id)).toEqual({ start_date: '2026-01-01', end_date: '2026-01-03' });
    expect(result.endDate).toBeNull();
  });

  it('DAY-DEL-003 a dated day with no spare day left: the last date goes and the trip ends a day earlier', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2, d3] = rows;

    const result = removal.remove(trip.id, d1.id, { userId: user.id });

    expect(dayRows(trip.id)).toEqual([
      { id: d2.id, day_number: 1, date: '2026-01-01' },
      { id: d3.id, day_number: 2, date: '2026-01-02' },
    ]);
    expect(range(trip.id)).toEqual({ start_date: '2026-01-01', end_date: '2026-01-02' });
    expect(result.endDate).toBe('2026-01-02');
    // The trip in list shape for the trip header, without its feed credential.
    expect(result.trip).toMatchObject({ id: trip.id, end_date: '2026-01-02', day_count: 2, is_owner: 1, feed_token: null });
  });

  it('DAY-DEL-004 the last day of a trip stays, and nothing is written', () => {
    const { user, trip, rows } = datedTrip('2026-05-01', '2026-05-01');
    const night = bookedNight(trip.id, rows[0].id, rows[0].id);

    expect(() => removal.remove(trip.id, rows[0].id, { userId: user.id })).toThrow(new DayDeleteError(LAST_DAY_MESSAGE));
    expect(dayRows(trip.id)).toEqual(rows);
    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(night.stayId)).toBeDefined();
    expect(reservationRow(night.reservationId)).toBeDefined();
  });

  it('DAY-DEL-005 a stay checking in on the day is cancelled with its booking and that booking\'s expense', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const night = bookedNight(trip.id, rows[1].id, rows[2].id);
    expect(night.stop.day_id).toBe(rows[1].id);

    const result = removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(night.stayId)).toBeUndefined();
    expect(reservationRow(night.reservationId)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(night.budgetId)).toBeUndefined();
    // The hotel itself is a place and stays on the list.
    expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(night.place.id)).toBeDefined();
    expect(result).toMatchObject({ stayIds: [night.stayId], reservationIds: [night.reservationId], budgetItemIds: [night.budgetId] });
    // Its stop sat on the deleted day, which day:deleted already covers.
    expect(result.mirrors[0].removed).toEqual([]);
  });

  it('DAY-DEL-006 a stay checking out on the day is cancelled too, and its stop on the check-in day goes with it', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const night = bookedNight(trip.id, rows[0].id, rows[1].id);

    const result = removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(night.stayId)).toBeUndefined();
    expect(reservationRow(night.reservationId)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM day_assignments WHERE id = ?').get(night.stop.id)).toBeUndefined();
    expect(result.mirrors[0].removed).toEqual([{ id: night.stop.id, dayId: rows[0].id }]);
  });

  it('DAY-DEL-007 a stay that only runs across the day keeps standing', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const night = bookedNight(trip.id, rows[0].id, rows[2].id);

    const result = removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(night.stayId))
      .toEqual({ start_day_id: rows[0].id, end_day_id: rows[2].id });
    expect(reservationRow(night.reservationId)).toBeDefined();
    expect(result.stayIds).toEqual([]);
  });

  it('DAY-DEL-008 bookings on the day are let go of, with their dates untouched', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2] = rows;
    const dinner = booking(trip.id, d2.id, '2026-01-02T19:00');
    const car = booking(trip.id, d1.id, '2026-01-01T09:00', { endDayId: d2.id, endTime: '2026-01-02T10:00' });

    removal.remove(trip.id, d2.id, { userId: user.id });

    expect(reservationRow(dinner)).toEqual({ day_id: null, end_day_id: null, reservation_time: '2026-01-02T19:00', reservation_end_time: null });
    expect(reservationRow(car)).toEqual({ day_id: d1.id, end_day_id: null, reservation_time: '2026-01-01T09:00', reservation_end_time: '2026-01-02T10:00' });
  });

  it('DAY-DEL-009 the road trip boundaries after the day move up with their days', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-04');
    const place = createPlace(testDb, trip.id);
    const stops = rows.map(r => createDayAssignment(testDb, r.id, place.id));
    rows.forEach((_, i) => boundary(trip.id, i + 1, stops[i].id));

    const result = removal.remove(trip.id, rows[1].id, { userId: user.id });

    const expected = [
      { day_number: 1, from_assignment_id: stops[0].id, to_assignment_id: null, fraction: 1 },
      { day_number: 2, from_assignment_id: stops[2].id, to_assignment_id: null, fraction: 1 },
      { day_number: 3, from_assignment_id: stops[3].id, to_assignment_id: null, fraction: 1 },
    ];
    expect(testDb.prepare('SELECT day_number, from_assignment_id, to_assignment_id, fraction FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number').all(trip.id))
      .toEqual(expected);
    expect(result.boundaries).toEqual(expected);
  });

  it('DAY-DEL-010 deleting the day an insert slotted in gives back the trip as it was', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const train = booking(trip.id, rows[2].id, '2026-01-03T08:00');
    const before = { rows: dayRows(trip.id), range: range(trip.id), train: reservationRow(train) };

    const inserted = days.insert(trip.id, 2);
    expect(range(trip.id).end_date).toBe('2026-01-04');
    removal.remove(trip.id, inserted.id, { userId: user.id });

    expect({ rows: dayRows(trip.id), range: range(trip.id), train: reservationRow(train) }).toEqual(before);
  });

  it('DAY-DEL-011 appending a day, moving it into a slot and deleting the day it pushed out keeps every date', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const [d1, d2, d3] = rows;
    const lunch = booking(trip.id, d2.id, '2026-01-02T12:00');
    const tour = booking(trip.id, d3.id, '2026-01-03T09:00');

    const appended = days.create(trip.id);
    days.reorder(trip.id, [d1.id, d2.id, appended.id, d3.id]);
    // The pushed-out day lost its date to the new one and sits at the end without one.
    expect(dayRows(trip.id).at(-1)).toEqual({ id: d3.id, day_number: 4, date: null });
    removal.remove(trip.id, d3.id, { userId: user.id });

    expect(dayRows(trip.id)).toEqual([
      { id: d1.id, day_number: 1, date: '2026-01-01' },
      { id: d2.id, day_number: 2, date: '2026-01-02' },
      { id: appended.id, day_number: 3, date: '2026-01-03' },
    ]);
    expect(range(trip.id)).toEqual({ start_date: '2026-01-01', end_date: '2026-01-03' });
    expect(reservationRow(lunch)?.reservation_time).toBe('2026-01-02T12:00');
    expect(reservationRow(tour)?.reservation_time).toBe('2026-01-03T09:00');
  });

  it('DAY-DEL-012 a failure halfway rolls the whole delete back', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const night = bookedNight(trip.id, rows[1].id, rows[2].id);
    vi.spyOn(days, 'restampReservationDates').mockImplementation(() => { throw new Error('disk full'); });

    expect(() => removal.remove(trip.id, rows[1].id, { userId: user.id })).toThrow('disk full');

    expect(dayRows(trip.id)).toEqual(rows);
    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(night.stayId)).toBeDefined();
    expect(reservationRow(night.reservationId)).toBeDefined();
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(night.budgetId)).toBeDefined();
  });

  it('DAY-DEL-013 the journey catches up after the commit, and a failure there does not undo the delete', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-02');
    const reconcile = vi.spyOn(journey, 'reconcileTripSkeletons').mockImplementation(() => { throw new Error('journey down'); });

    const result = removal.remove(trip.id, rows[0].id, { userId: user.id, socketId: 'sock-1' });

    expect(reconcile).toHaveBeenCalledWith(trip.id, 'sock-1');
    expect(result.orderedIds).toEqual([rows[1].id]);
    expect(dayRows(trip.id)).toHaveLength(1);
  });

  it('DAY-DEL-015 a day of another trip is refused, and nothing is written', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-02');
    const other = datedTrip('2026-02-01', '2026-02-02');

    expect(() => removal.remove(trip.id, other.rows[0].id, { userId: user.id })).toThrow(new DayDeleteError('Day not found'));
    expect(dayRows(trip.id)).toEqual(rows);
    expect(dayRows(other.trip.id)).toEqual(other.rows);
  });

  it('DAY-DEL-016 dated days on a trip without a range move their dates but leave the trip alone', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createDay(testDb, trip.id, { date: '2026-04-01' });
    const b = createDay(testDb, trip.id, { date: '2026-04-02' });

    const result = removal.remove(trip.id, a.id, { userId: user.id });

    expect(dayRows(trip.id)).toEqual([{ id: b.id, day_number: 1, date: '2026-04-01' }]);
    expect(range(trip.id)).toEqual({ start_date: null, end_date: null });
    expect(result.endDate).toBeNull();
  });

  it('DAY-DEL-018 a cancelled stay does not announce the deleted day: neither its stop there nor its roads', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
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

    const result = new DayRemovalService(dbs, days, stub, assignments).remove(trip.id, rows[1].id, { userId: user.id });

    expect(result.mirrors).toEqual([{
      created: null, moved: null, updated: [], stamped: null,
      removed: [{ id: 2, dayId: rows[0].id }],
      vias: [{ dayId: rows[0].id, vias: [] }],
    }]);
  });

  it('DAY-DEL-019 a hole left in the numbering closes too, and the boundaries follow their own days into it', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-05');
    const place = createPlace(testDb, trip.id);
    const stops = rows.map(r => createDayAssignment(testDb, r.id, place.id));
    // Days 1, 2, 4 and 5: the third went through the old bare delete, which left
    // its number empty and one boundary on it. Another one sits past the last day.
    boundary(trip.id, 2, stops[1].id);
    boundary(trip.id, 3, stops[0].id);
    boundary(trip.id, 4, stops[3].id);
    boundary(trip.id, 5, stops[4].id);
    boundary(trip.id, 7, stops[0].id);
    testDb.prepare('DELETE FROM days WHERE id = ?').run(rows[2].id);

    const result = removal.remove(trip.id, rows[1].id, { userId: user.id });

    expect(dayRows(trip.id).map(r => [r.id, r.day_number])).toEqual([[rows[0].id, 1], [rows[3].id, 2], [rows[4].id, 3]]);
    const expected = [
      { day_number: 2, from_assignment_id: stops[3].id, to_assignment_id: null, fraction: 1 },
      { day_number: 3, from_assignment_id: stops[4].id, to_assignment_id: null, fraction: 1 },
      { day_number: 5, from_assignment_id: stops[0].id, to_assignment_id: null, fraction: 1 },
    ];
    expect(testDb.prepare('SELECT day_number, from_assignment_id, to_assignment_id, fraction FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number').all(trip.id))
      .toEqual(expected);
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

  it('DAY-DEL-014 fans out in one order: the day, the new order, the stays, their rows, the boundaries, the trip', () => {
    const { user, trip, rows } = datedTrip('2026-01-01', '2026-01-03');
    const night = bookedNight(trip.id, rows[0].id, rows[1].id);
    const place = createPlace(testDb, trip.id);
    boundary(trip.id, 3, createDayAssignment(testDb, rows[2].id, place.id).id);
    const result = removal.remove(trip.id, rows[1].id, { userId: user.id, socketId: 'sock' });
    const mirror = vi.spyOn(accommodations, 'announceMirror');
    const { sent, all, others } = recorder();

    removal.announce(trip.id, result, { all, others, socketId: 'sock' });

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

  it('DAY-DEL-017 a plain delete announces the day and the new order, nothing else', () => {
    const removed: DayRemoval = {
      dayId: 4, orderedIds: [3, 5], stayIds: [], reservationIds: [], budgetItemIds: [], mirrors: [],
      boundaries: null, endDate: null, trip: null,
    };
    const { sent, all, others } = recorder();

    removal.announce(9, removed, { all, others });

    expect(sent).toEqual([
      ['others', 'day:deleted', { dayId: 4 }],
      ['others', 'day:reordered', { orderedIds: [3, 5] }],
    ]);
  });
});
