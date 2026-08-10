/**
 * Unit tests for the DI-native TripsService — TRIP-SVC-001 through TRIP-SVC-058
 * (001–038 moved 1:1 from the legacy tests/unit/services/tripService.test.ts;
 * the exportICS cases that duplicated the generateDays 010–012 numbering were
 * renumbered to 024–026 with the post-fold quirk-fix commit; 040–041 pin the
 * trips.bridge delegation; 042–050 cover the folded
 * summary/list/create/delete/copy SQL; 051–053 pin the post-fold quirk fixes
 * (transactional deletes, owner display_name)). Uses a real in-memory SQLite
 * DB so SQL logic is exercised faithfully.
 *
 * The membership and read-aggregate cases now drive TripMembersService and
 * TripReadModelService, which is where that code went when the aggregate root
 * was split. They stayed in this file, over the same in-memory DB, so the diff
 * shows the move rather than a rewrite.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

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
// notifyInvite fires a notification via a dynamic import — keep it out of unit scope
vi.mock('../../../src/nest/notifications/notifications.bridge', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createPlace, createDay, createDayAssignment, createDayNote, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { DaysService } from '../../../src/nest/days/days.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { getTripOwner, listMembers as bridgeListMembers } from '../../../src/nest/trips/trips.bridge';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import fs from 'fs';

// Real sibling services over the same in-memory DB — updateTrip's date-shift
// resyncs and the summary/bundle aggregation run their actual SQL.
const dbs = () => new DatabaseService(testDb);
const budgetSvc = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());
const daysSvc = new DaysService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new QueryHelpersService(dbs()));
const placesSvc = new PlacesService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new MapsService(dbs()), new QueryHelpersService(dbs()));
const accommodationsSvc = new AccommodationsService(dbs(), new PermissionsService(dbs()), new RealtimeService());
const createAccommodation = accommodationsSvc.createAccommodation.bind(accommodationsSvc);

const svc = new TripsService(
  dbs(),
  new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService()),
  daysSvc,
  new PermissionsService(dbs()),
  budgetSvc,
  new VacayService(dbs(), new RealtimeService()),
  new RealtimeService(),
  undefined as never, // unsplash — not exercised here
);
const membersSvc = new TripMembersService(dbs(), budgetSvc, new UserCleanupService(dbs()), new PermissionsService(dbs()), new RealtimeService());
const readModelSvc = new TripReadModelService(
  dbs(), membersSvc, daysSvc, accommodationsSvc, budgetSvc,
  new PackingService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService()),
  new CollabService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  placesSvc,
  new TodoService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new FilesService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDays(tripId: number) {
  return testDb.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as {
    id: number; trip_id: number; day_number: number; date: string | null;
  }[];
}

function getAssignments(dayId: number) {
  return testDb.prepare('SELECT * FROM day_assignments WHERE day_id = ?').all(dayId) as { id: number; day_id: number }[];
}

function getNotes(dayId: number) {
  return testDb.prepare('SELECT * FROM day_notes WHERE day_id = ?').all(dayId) as { id: number; day_id: number }[];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateDays', () => {
  it('TRIP-SVC-010: full range shift preserves day assignments and notes positionally', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const daysBefore = getDays(trip.id);
    expect(daysBefore).toHaveLength(5);

    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, daysBefore[0].id, place.id);
    const note = createDayNote(testDb, daysBefore[1].id, trip.id, { text: 'packed' });

    // Shift forward 9 days — zero overlap with original dates
    svc.generateDays(trip.id, '2025-06-10', '2025-06-14');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-06-10', '2025-06-11', '2025-06-12', '2025-06-13', '2025-06-14',
    ]);

    // day_number 1 (formerly June 1) now has date June 10 — assignment still attached
    const day1 = daysAfter[0];
    const day2 = daysAfter[1];
    expect(getAssignments(day1.id)).toHaveLength(1);
    expect(getAssignments(day1.id)[0].id).toBe(assignment.id);
    expect(getNotes(day2.id)).toHaveLength(1);
    expect(getNotes(day2.id)[0].id).toBe(note.id);
  });

  it('TRIP-SVC-011: shrinking range deletes overflow days and their assignments (issue #909)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' });
    const daysBefore = getDays(trip.id);
    expect(daysBefore).toHaveLength(5);

    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, daysBefore[3].id, place.id);
    createDayAssignment(testDb, daysBefore[4].id, place.id);

    // Shrink from 5 to 3 days — surplus days and their content are removed
    svc.generateDays(trip.id, '2025-07-01', '2025-07-03');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(3);
    expect(daysAfter.map(d => d.date)).toEqual(['2025-07-01', '2025-07-02', '2025-07-03']);
  });

  it('TRIP-SVC-016: shrinking range deletes empty overflow days (issue #909)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-07' });
    expect(getDays(trip.id)).toHaveLength(7);

    // Shrink 7 → 5; days 6 and 7 have no content
    svc.generateDays(trip.id, '2025-07-01', '2025-07-05');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-07-01', '2025-07-02', '2025-07-03', '2025-07-04', '2025-07-05',
    ]);
  });

  it('TRIP-SVC-012: growing range keeps existing day content and appends new empty days', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-08-01', end_date: '2025-08-03' });
    const daysBefore = getDays(trip.id);
    expect(daysBefore).toHaveLength(3);

    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, daysBefore[0].id, place.id);

    // Grow to 5 days
    svc.generateDays(trip.id, '2025-08-01', '2025-08-05');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05',
    ]);

    // Existing day 1 retains its assignment
    expect(getAssignments(daysAfter[0].id)).toHaveLength(1);
    expect(getAssignments(daysAfter[0].id)[0].id).toBe(assignment.id);

    // New days 4 and 5 are empty
    expect(getAssignments(daysAfter[3].id)).toHaveLength(0);
    expect(getAssignments(daysAfter[4].id)).toHaveLength(0);
  });

  it('TRIP-SVC-013: clearing dates converts all days to dateless without destroying assignments', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-09-01', end_date: '2025-09-04' });
    const daysBefore = getDays(trip.id);
    expect(daysBefore).toHaveLength(4);

    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, daysBefore[1].id, place.id);

    // Clear both dates
    svc.generateDays(trip.id, null, null);

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(4);
    expect(daysAfter.every(d => d.date === null)).toBe(true);

    // The assignment on the former day 2 still exists
    const formerDay2 = daysAfter.find(d => d.id === daysBefore[1].id);
    expect(formerDay2).toBeDefined();
    expect(getAssignments(formerDay2!.id)).toHaveLength(1);
    expect(getAssignments(formerDay2!.id)[0].id).toBe(assignment.id);
  });

  it('TRIP-SVC-014: partial overlap shift remaps by position (day 1→3 kept, 4-5 overflow)', () => {
    // Original: Jun 1-5. New: Jun 3-7 (overlap on Jun 3-5, but we map by position)
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-10-01', end_date: '2025-10-05' });
    const daysBefore = getDays(trip.id);
    const place = createPlace(testDb, trip.id);
    // Assign to each of the 5 days
    for (const day of daysBefore) createDayAssignment(testDb, day.id, place.id);

    // Shift forward 2 days (partial overlap with original range)
    svc.generateDays(trip.id, '2025-10-03', '2025-10-07');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(5);
    expect(daysAfter.map(d => d.date)).toEqual([
      '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07',
    ]);

    // All 5 assignments survive
    for (const day of daysAfter) {
      expect(getAssignments(day.id)).toHaveLength(1);
    }
  });

  it('TRIP-SVC-015: growing into dateless days reuses them; leftover dateless renumber without UNIQUE collision', () => {
    // 3 dated days + 2 pre-existing dateless days. Resize to 4 dated days.
    // Main loop: dated[0..2] → positions 1-3, dateless[0] → position 4 (consumed).
    // Unused dateless: dateless[1] should land at position 5, NOT 4 (collision bug).
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-11-01', end_date: '2025-11-03' });

    // Insert 2 dateless days directly
    const daysBefore = getDays(trip.id);
    testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)').run(trip.id, 4);
    testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)').run(trip.id, 5);

    const allDays = getDays(trip.id);
    expect(allDays).toHaveLength(5);

    const place = createPlace(testDb, trip.id);
    // Put an assignment on the second dateless day (day_number=5) — it should survive
    const assignment = createDayAssignment(testDb, allDays[4].id, place.id);

    // Grow from 3 to 4 dated days — consumes dateless[0], leaves dateless[1] unused
    // This is the scenario that triggered the UNIQUE collision bug
    svc.generateDays(trip.id, '2025-11-01', '2025-11-04');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(5);

    const dated = daysAfter.filter(d => d.date !== null);
    const dateless = daysAfter.filter(d => d.date === null);
    expect(dated).toHaveLength(4);
    expect(dateless).toHaveLength(1);

    // The remaining dateless day still has its assignment
    expect(getAssignments(dateless[0].id)).toHaveLength(1);
    expect(getAssignments(dateless[0].id)[0].id).toBe(assignment.id);

    // All day_numbers are unique 1..5
    const nums = daysAfter.map(d => d.day_number).sort((a, b) => a - b);
    expect(nums).toEqual([1, 2, 3, 4, 5]);
  });

  it('TRIP-SVC-017: switching a dateless trip to a shorter dated range drops empty leftover days but keeps ones with content (#1083)', () => {
    const { user } = createUser(testDb);
    // A 7-day trip, then cleared to dateless placeholders (day_count = 7).
    const trip = createTrip(testDb, user.id, { start_date: '2025-12-01', end_date: '2025-12-07' });
    svc.generateDays(trip.id, null, null);
    const dateless = getDays(trip.id);
    expect(dateless).toHaveLength(7);
    expect(dateless.every(d => d.date === null)).toBe(true);

    // Give the LAST dateless day real content so it must be preserved.
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, dateless[6].id, place.id);

    // Now set an explicit 2-day range. The first two dateless days are reused for
    // the dates; the four empty leftovers must be removed, the one with content kept.
    svc.generateDays(trip.id, '2026-01-10', '2026-01-11');

    const daysAfter = getDays(trip.id);
    const dated = daysAfter.filter(d => d.date !== null);
    const stillDateless = daysAfter.filter(d => d.date === null);
    expect(dated.map(d => d.date)).toEqual(['2026-01-10', '2026-01-11']);
    // day_count is COUNT(*) FROM days: 2 dated + 1 content-bearing dateless = 3 (not the stale 7)
    expect(daysAfter).toHaveLength(3);
    expect(stillDateless).toHaveLength(1);
    expect(getAssignments(stillDateless[0].id)[0].id).toBe(assignment.id);
  });
});

// ── deleteOldCover — path containment ──────────────────────────────────────────

describe('deleteOldCover', () => {
  it('TRIP-SVC-COVER-001: never unlinks outside uploads/covers for a crafted cover_image', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    try {
      // Attacker-controlled values aimed at auth-gated sibling upload dirs.
      svc.deleteOldCover('/uploads/files/victim.pdf');
      svc.deleteOldCover('/uploads/covers/../files/secret.pdf');
      svc.deleteOldCover('/uploads/avatars/someone.png');

      for (const call of unlinkSpy.mock.calls) {
        const target = String(call[0]);
        expect(target).toMatch(/[\\/]uploads[\\/]covers[\\/]/); // stays in covers
        expect(target).not.toMatch(/[\\/]files[\\/]/);
        expect(target).not.toMatch(/[\\/]avatars[\\/]/);
      }
    } finally {
      existsSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });

  it('TRIP-SVC-COVER-002: deletes a legitimate cover file', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    try {
      svc.deleteOldCover('/uploads/covers/abc123.jpg');
      expect(unlinkSpy).toHaveBeenCalledTimes(1);
      expect(String(unlinkSpy.mock.calls[0][0])).toMatch(/[\\/]covers[\\/]abc123\.jpg$/);
    } finally {
      existsSpy.mockRestore();
      unlinkSpy.mockRestore();
    }
  });
});

describe('resyncReservationDays (#1288)', () => {
  const dayFor = (tripId: number, date: string) =>
    (testDb.prepare('SELECT id FROM days WHERE trip_id = ? AND date = ?').get(tripId, date) as { id: number }).id;
  const insertDatedReservation = (tripId: number, dayId: number, time: string) =>
    Number(testDb.prepare(
      "INSERT INTO reservations (trip_id, day_id, title, reservation_time, type, status) VALUES (?, ?, 'Dinner', ?, 'restaurant', 'pending')",
    ).run(tripId, dayId, time).lastInsertRowid);

  it('TRIP-SVC-018: changing the start date re-anchors a dated reservation to the day matching its time', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const resId = insertDatedReservation(trip.id, dayFor(trip.id, '2025-06-02'), '2025-06-02T19:00:00');
    // Shift the whole range one day forward (days become 2025-06-02..06).
    svc.updateTrip(trip.id, user.id, { start_date: '2025-06-02', end_date: '2025-06-06' }, 'user');
    const res = testDb.prepare('SELECT day_id FROM reservations WHERE id = ?').get(resId) as { day_id: number };
    // The booking stays on its absolute date (2025-06-02) instead of shifting with its old day row.
    expect(res.day_id).toBe(dayFor(trip.id, '2025-06-02'));
  });

  it('TRIP-SVC-019: a reservation whose date falls outside the new range keeps its day_id (not nulled)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const origDayId = dayFor(trip.id, '2025-06-02');
    const resId = insertDatedReservation(trip.id, origDayId, '2025-06-02T19:00:00');
    // Shift far forward so 2025-06-02 is no longer covered by any day.
    svc.updateTrip(trip.id, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' }, 'user');
    const res = testDb.prepare('SELECT day_id FROM reservations WHERE id = ?').get(resId) as { day_id: number };
    expect(res.day_id).toBe(origDayId);
  });
});

describe('resyncAccommodationDays (#1288)', () => {
  const dayFor = (tripId: number, date: string) =>
    (testDb.prepare('SELECT id FROM days WHERE trip_id = ? AND date = ?').get(tripId, date) as { id: number }).id;

  const insertAccommodation = (tripId: number, startDayId: number, endDayId: number) => {
    const place = createPlace(testDb, tripId, { name: 'Grand Hotel' });
    const acc = createAccommodation(tripId, {
      place_id: place.id, start_day_id: startDayId, end_day_id: endDayId,
    }) as { id: number };
    const linkedRes = testDb.prepare(
      'SELECT id FROM reservations WHERE accommodation_id = ?',
    ).get(acc.id) as { id: number };
    return { accId: acc.id, linkedResId: linkedRes.id };
  };

  const getAcc = (id: number) =>
    testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(id) as
      { start_day_id: number; end_day_id: number };
  const getRes = (id: number) =>
    testDb.prepare('SELECT day_id, reservation_time FROM reservations WHERE id = ?').get(id) as
      { day_id: number | null; reservation_time: string | null };

  it('TRIP-SVC-035: extending the start keeps an accommodation on its absolute dates', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' });
    const { accId, linkedResId } = insertAccommodation(trip.id, dayFor(trip.id, '2025-06-11'), dayFor(trip.id, '2025-06-13'));
    // Add a day at the start: days re-date positionally (old 06-11 row becomes 06-10, …).
    svc.updateTrip(trip.id, user.id, { start_date: '2025-06-09', end_date: '2025-06-14' }, 'user');
    const acc = getAcc(accId);
    expect(acc.start_day_id).toBe(dayFor(trip.id, '2025-06-11'));
    expect(acc.end_day_id).toBe(dayFor(trip.id, '2025-06-13'));
    const res = getRes(linkedResId);
    expect(res.day_id).toBe(acc.start_day_id);
    expect(res.reservation_time?.slice(0, 10)).toBe('2025-06-11');
  });

  it('TRIP-SVC-036: moving the whole trip out of the old range keeps the accommodation glued to its days', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const startDayId = dayFor(trip.id, '2025-06-02');
    const endDayId = dayFor(trip.id, '2025-06-03');
    const { accId, linkedResId } = insertAccommodation(trip.id, startDayId, endDayId);
    svc.updateTrip(trip.id, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' }, 'user');
    const acc = getAcc(accId);
    expect(acc.start_day_id).toBe(startDayId);
    expect(acc.end_day_id).toBe(endDayId);
    // The linked reservation follows the (re-dated) start day instead of keeping a stale date snapshot.
    const res = getRes(linkedResId);
    expect(res.day_id).toBe(startDayId);
    expect(res.reservation_time?.slice(0, 10)).toBe('2025-07-02');
  });

  it("TRIP-SVC-038: date_shift_mode 'shift_all' glues bookings to their days and restamps their times", () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const origDayId = dayFor(trip.id, '2025-06-02');
    const resId = Number(testDb.prepare(
      "INSERT INTO reservations (trip_id, day_id, title, reservation_time, type, status) VALUES (?, ?, 'Dinner', '2025-06-02T19:00:00', 'restaurant', 'pending')",
    ).run(trip.id, origDayId).lastInsertRowid);
    const { accId } = insertAccommodation(trip.id, origDayId, dayFor(trip.id, '2025-06-03'));
    svc.updateTrip(trip.id, user.id, { start_date: '2025-06-03', end_date: '2025-06-07', date_shift_mode: 'shift_all' }, 'user');
    // The booking stays on its day row (now 2025-06-04) and its time follows.
    const res = testDb.prepare('SELECT day_id, reservation_time FROM reservations WHERE id = ?').get(resId) as
      { day_id: number; reservation_time: string };
    expect(res.day_id).toBe(origDayId);
    expect(res.reservation_time).toBe('2025-06-04T19:00:00');
    // The accommodation stays glued to its (re-dated) day rows too.
    const acc = getAcc(accId);
    expect(acc.start_day_id).toBe(origDayId);
  });

  it('TRIP-SVC-037: a dated hotel reservation without a linked accommodation is re-anchored like other bookings', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-05' });
    const resId = Number(testDb.prepare(
      "INSERT INTO reservations (trip_id, day_id, title, reservation_time, type, status) VALUES (?, ?, 'Imported hotel', ?, 'hotel', 'pending')",
    ).run(trip.id, dayFor(trip.id, '2025-06-02'), '2025-06-02T15:00:00').lastInsertRowid);
    svc.updateTrip(trip.id, user.id, { start_date: '2025-06-02', end_date: '2025-06-06' }, 'user');
    const res = testDb.prepare('SELECT day_id FROM reservations WHERE id = ?').get(resId) as { day_id: number };
    expect(res.day_id).toBe(dayFor(trip.id, '2025-06-02'));
  });
});

describe('transferOwnership (#973)', () => {
  it('TRIP-SVC-020: hands the trip to a member and demotes the former owner to a member', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const result = membersSvc.transferOwnership(trip.id, member.id, owner.id);
    expect(result.toEmail).toBe(member.email);

    const updated = testDb.prepare('SELECT user_id FROM trips WHERE id = ?').get(trip.id) as { user_id: number };
    expect(updated.user_id).toBe(member.id);

    // New owner no longer sits in trip_members, former owner now does.
    const memberIds = (testDb.prepare('SELECT user_id FROM trip_members WHERE trip_id = ?').all(trip.id) as { user_id: number }[]).map(r => r.user_id);
    expect(memberIds).toContain(owner.id);
    expect(memberIds).not.toContain(member.id);
  });

  it('TRIP-SVC-021: rejects a transfer from a non-owner', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    // member (not the owner) attempts the transfer
    expect(() => membersSvc.transferOwnership(trip.id, member.id, member.id)).toThrow();
  });

  it('TRIP-SVC-022: rejects a transfer to someone who is not a member', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(() => membersSvc.transferOwnership(trip.id, stranger.id, owner.id)).toThrow('New owner must be a trip member');
  });

  it('TRIP-SVC-023: rejects transferring to yourself', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(() => membersSvc.transferOwnership(trip.id, owner.id, owner.id)).toThrow('You already own this trip');
  });
});

describe('guest members (#1362)', () => {
  it('TRIP-SVC-030: createGuest adds a credential-less user joined into the trip', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const { member } = membersSvc.createGuest(trip.id, '  Anna  ', owner.id);
    expect(member.username).toBe('Anna');
    expect(member.is_guest).toBe(true);

    const row = testDb.prepare('SELECT username, email, password_hash, is_guest, role FROM users WHERE id = ?').get(member.id) as any;
    expect(row.is_guest).toBe(1);
    expect(row.password_hash).toBe('');
    expect(row.email).toMatch(/@guests\.invalid$/);
    expect(row.role).toBe('user');

    // Joined as a trip member.
    const m = testDb.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, member.id);
    expect(m).toBeTruthy();

    // Surfaces in listMembers with is_guest=true and the typed display name.
    const { members } = membersSvc.listMembers(trip.id, owner.id) as any;
    const guest = members.find((x: any) => x.id === member.id);
    expect(guest.username).toBe('Anna');
    expect(guest.is_guest).toBe(true);
  });

  it('TRIP-SVC-031: the same guest name is allowed, not suffixed (#1446)', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const a = membersSvc.createGuest(trip.id, 'Sam', owner.id);
    const b = membersSvc.createGuest(trip.id, 'Sam', owner.id);
    // both keep the plain display name; only the internal (uuid) username differs
    expect(a.member.username).toBe('Sam');
    expect(b.member.username).toBe('Sam');
    expect(b.member.id).not.toBe(a.member.id);
    const usernames = testDb.prepare('SELECT username FROM users WHERE id IN (?, ?)').all(a.member.id, b.member.id) as { username: string }[];
    expect(usernames[0].username).not.toBe(usernames[1].username);
  });

  it('TRIP-SVC-032: renameGuest updates the display name (trip-scoped, guest-only)', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id);
    const trip = createTrip(testDb, owner.id);
    const { member } = membersSvc.createGuest(trip.id, 'Bob', owner.id);

    expect(membersSvc.renameGuest(trip.id, member.id, 'Robert')).toBe(true);
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(member.id) as any).display_name).toBe('Robert');

    // A real user cannot be renamed through the guest path…
    expect(membersSvc.renameGuest(trip.id, owner.id, 'Hacked')).toBe(false);
    // …and a guest cannot be renamed from a different trip.
    expect(membersSvc.renameGuest(otherTrip.id, member.id, 'Nope')).toBe(false);
  });

  it('TRIP-SVC-033: deleteGuest removes the user (cascading membership), guest-only + trip-scoped', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member } = membersSvc.createGuest(trip.id, 'Carol', owner.id);

    // Real members are not deletable via the guest path.
    expect(membersSvc.deleteGuest(trip.id, owner.id)).toBe(false);

    expect(membersSvc.deleteGuest(trip.id, member.id)).toBe(true);
    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(member.id)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM trip_members WHERE user_id = ?').get(member.id)).toBeUndefined();
  });

  it('TRIP-SVC-034: a guest is never invitable (addMember) nor a transfer target', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member } = membersSvc.createGuest(trip.id, 'Dora', owner.id);

    // The synthetic username/email must not resolve through the invite box.
    expect(() => membersSvc.addMember(trip.id, 'Dora', owner.id, owner.id)).toThrow('User not found');
    // Ownership can never be handed to a guest.
    expect(() => membersSvc.transferOwnership(trip.id, member.id, owner.id)).toThrow('Cannot transfer ownership to a guest');
  });
});

// ── trips.bridge delegation (coverage gate) ───────────────────────────────────

describe('trips.bridge delegation', () => {
  it('TRIP-SVC-040: getTripOwner delegates 1:1', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(getTripOwner(trip.id)).toEqual({ user_id: user.id });
    expect(getTripOwner(99999)).toBeUndefined();
  });

  it('TRIP-SVC-041: listMembers delegates 1:1', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const result = bridgeListMembers(trip.id, owner.id);
    expect(result.owner.id).toBe(owner.id);
    expect(result.members.map(m => m.id)).toEqual([member.id]);
  });
});

// ── Folded CRUD SQL (summary / list / create / delete / copy) ─────────────────

describe('folded trip CRUD', () => {
  it('TRIP-SVC-042: getTripSummary aggregates members, days, budget, packing and reservations', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { start_date: '2025-06-01', end_date: '2025-06-02' });
    addTripMember(testDb, trip.id, member.id);
    testDb.prepare("INSERT INTO budget_items (trip_id, category, name, total_price) VALUES (?, 'food', 'Dinner', 40)").run(trip.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, checked) VALUES (?, 'Socks', 1)").run(trip.id);

    const summary = readModelSvc.getTripSummary(trip.id, owner.id)!;
    expect(summary).toBeTruthy();
    expect((summary.trip as any).id).toBe(trip.id);
    expect(summary.members.owner.id).toBe(owner.id);
    expect(summary.members.collaborators.map((m: any) => m.id)).toEqual([member.id]);
    expect(summary.days).toHaveLength(2);
    expect(summary.budget.item_count).toBe(1);
    expect(summary.budget.total).toBe(40);
    expect(summary.packing.total).toBe(1);
    expect(summary.packing.checked).toBe(1);
    expect(summary.reservations).toEqual([]);
    expect(summary.collab_notes).toEqual([]);

    // Missing trips return null instead of throwing.
    expect(readModelSvc.getTripSummary(99999)).toBeNull();
  });

  it('TRIP-SVC-043: list returns owned + shared trips with is_owner, honoring the archived filter', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const own = createTrip(testDb, owner.id, { title: 'Mine' });
    const shared = createTrip(testDb, other.id, { title: 'Shared' });
    addTripMember(testDb, shared.id, owner.id);
    const archived = createTrip(testDb, owner.id, { title: 'Old' });
    testDb.prepare('UPDATE trips SET is_archived = 1 WHERE id = ?').run(archived.id);

    const active = svc.list(owner.id, 0) as any[];
    expect(active.map(t => t.id).sort()).toEqual([own.id, shared.id].sort());
    expect(active.find(t => t.id === own.id).is_owner).toBe(1);
    expect(active.find(t => t.id === shared.id).is_owner).toBe(0);

    const all = svc.list(owner.id, null) as any[];
    expect(all.map(t => t.id).sort()).toEqual([own.id, shared.id, archived.id].sort());
  });

  it('TRIP-SVC-044: create applies || defaults, clamps reminder_days and generates days', () => {
    const { user } = createUser(testDb);
    const { trip, tripId, reminderDays } = svc.create(user.id, {
      title: 'New Trip', start_date: '2025-06-01', end_date: '2025-06-03', reminder_days: 99,
    });
    expect(reminderDays).toBe(3); // out-of-range → default 3
    expect((trip as any).currency).toBe('EUR'); // no currency → 'EUR'
    expect(getDays(tripId)).toHaveLength(3);
  });

  it('TRIP-SVC-045: remove deletes the trip, cleans skeleton journey entries and detaches filled ones', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const journeyId = Number(testDb.prepare(
      "INSERT INTO journeys (user_id, title, created_at, updated_at) VALUES (?, 'J', 0, 0)",
    ).run(user.id).lastInsertRowid);
    testDb.prepare(
      "INSERT INTO journey_entries (journey_id, source_trip_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, ?, 'skeleton', 'S', '2025-06-01', 0, 0)",
    ).run(journeyId, trip.id, user.id);
    const filledId = Number(testDb.prepare(
      "INSERT INTO journey_entries (journey_id, source_trip_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, ?, 'story', 'F', '2025-06-01', 0, 0)",
    ).run(journeyId, trip.id, user.id).lastInsertRowid);

    const info = svc.remove(trip.id, user.id, 'user');
    expect(info).toMatchObject({ tripId: trip.id, ownerId: user.id, isAdminDelete: false });

    expect(testDb.prepare('SELECT id FROM trips WHERE id = ?').get(trip.id)).toBeUndefined();
    expect(testDb.prepare("SELECT id FROM journey_entries WHERE type = 'skeleton'").get()).toBeUndefined();
    const filled = testDb.prepare('SELECT source_trip_id FROM journey_entries WHERE id = ?').get(filledId) as any;
    expect(filled.source_trip_id).toBeNull();

    // Missing trips throw the byte-identical error.
    expect(() => svc.remove(99999, user.id, 'user')).toThrow('Trip not found');
  });

  it('TRIP-SVC-046: copy duplicates days/places/assignments and resets packing to unchecked', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Origin', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = getDays(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    createDayAssignment(testDb, days[0].id, place.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, checked) VALUES (?, 'Socks', 1)").run(trip.id);

    const newTripId = svc.copy(trip.id, user.id, 'Clone');

    const copied = testDb.prepare('SELECT title, is_archived FROM trips WHERE id = ?').get(newTripId) as any;
    expect(copied.title).toBe('Clone');
    expect(copied.is_archived).toBe(0);
    expect(getDays(newTripId)).toHaveLength(2);
    const newPlaces = testDb.prepare('SELECT id, name FROM places WHERE trip_id = ?').all(newTripId) as any[];
    expect(newPlaces.map(p => p.name)).toEqual(['Louvre']);
    expect(getAssignments(getDays(newTripId)[0].id)).toHaveLength(1);
    const packing = testDb.prepare('SELECT checked FROM packing_items WHERE trip_id = ?').all(newTripId) as any[];
    expect(packing).toEqual([{ checked: 0 }]);

    // No title → source title (|| fallback).
    const secondCopy = svc.copy(trip.id, user.id);
    expect((testDb.prepare('SELECT title FROM trips WHERE id = ?').get(secondCopy) as any).title).toBe('Origin');
  });
});

// ── Wrapper helpers (delegating members of the aggregate root) ────────────────

describe('TripsService wrapper helpers', () => {
  it('re-anchors the budget before the trip row leaves its old currency (#1543)', async () => {
    const order: string[] = [];
    const rebaseSpy = vi.spyOn(budgetSvc, 'rebaseTripCurrency').mockImplementation(async () => { order.push('rebase'); });
    const updateSpy = vi.spyOn(svc, 'updateTrip').mockImplementation(() => { order.push('update'); return {} as never; });
    try {
      await svc.update('9', 1, { currency: 'RUB' } as never, 'user');
      // The rebase reads the outgoing currency off the trip row, so it has to run first.
      expect(rebaseSpy).toHaveBeenCalledWith('9', 'RUB');
      expect(order).toEqual(['rebase', 'update']);
    } finally {
      rebaseSpy.mockRestore();
      updateSpy.mockRestore();
    }
  });

  it('canAccessTrip delegates to the db helper; can() delegates to checkPermission; broadcast forwards', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.canAccessTrip(String(trip.id), user.id)).toMatchObject({ user_id: user.id });

    expect(svc.can('trip_edit', 'user', user.id, user.id, false)).toBe(true);

    svc.broadcast('9', 'trip:updated', { a: 1 } as never, 'sock');
    expect(broadcast).toHaveBeenCalledWith('9', 'trip:updated', { a: 1 }, 'sock');
  });

  it('getCopiedTrip re-reads via the TRIP_SELECT query', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Copied' });
    const row = svc.getCopiedTrip(trip.id, user.id) as any;
    expect(row.id).toBe(trip.id);
    expect(row.is_owner).toBe(1);
  });

  it('bundle aggregates every sub-collection + the member list, scoping packing to the viewer (#858)', () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { start_date: '2025-06-01', end_date: '2025-06-02' });
    addTripMember(testDb, trip.id, viewer.id);
    // A personal item of the OWNER must stay out of the other member's bundle.
    testDb.prepare("INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, 'Secret', 1, ?)").run(trip.id, owner.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name) VALUES (?, 'Shared')").run(trip.id);

    const result = readModelSvc.bundle(String(trip.id), { user_id: owner.id }, viewer.id) as any;
    expect(result.days).toHaveLength(2);
    expect(result.members.map((m: any) => m.id).sort()).toEqual([owner.id, viewer.id].sort());
    expect(result.packingItems.map((p: any) => p.name)).toEqual(['Shared']);
  });

  it('notifyInvite is fire-and-forget (no throw)', () => {
    expect(() => membersSvc.notifyInvite('9', { id: 1, email: 'a@b.c' } as never, 2, 'T', 'b@x.y')).not.toThrow();
  });
});

// ── Branch coverage for the folded update/export/copy quirks ─────────────────

describe('folded quirk branches', () => {
  it('TRIP-SVC-047: updateTrip admin edit collects changes and the owner email; reminder 0 reads "none"', () => {
    const { user: owner } = createUser(testDb);
    const { user: admin } = createUser(testDb);
    testDb.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(admin.id);
    const trip = createTrip(testDb, owner.id, { title: 'Old' });

    const result = svc.updateTrip(trip.id, admin.id, { title: 'New', is_archived: true, reminder_days: 0 }, 'admin');

    expect(result.isAdminEdit).toBe(true);
    expect(result.ownerEmail).toBe(owner.email);
    expect(result.changes).toMatchObject({ title: 'New', archived: true, reminder_days: 'none' });
    expect(result.newTitle).toBe('New');
    // || coercion: an empty-string title falls back to the stored one.
    const kept = svc.updateTrip(trip.id, owner.id, { title: '' }, 'user');
    expect(kept.newTitle).toBe('New');
    // Missing trips throw the byte-identical error; invalid ranges reject.
    expect(() => svc.updateTrip(99999, owner.id, {}, 'user')).toThrow('Trip not found');
    expect(() => svc.updateTrip(trip.id, owner.id, { start_date: '2025-06-10', end_date: '2025-06-01' }, 'user')).toThrow('End date must be after start date');
  });

  it('TRIP-SVC-049: addMember inserts the membership and reports the trip title; removeMember deletes it', () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Joinable' });

    const result = membersSvc.addMember(trip.id, invitee.email, owner.id, owner.id);
    expect(result.member.id).toBe(invitee.id);
    expect(result.tripTitle).toBe('Joinable');
    expect(result.targetUserId).toBe(invitee.id);

    // Duplicate + owner + missing identifier reject with the byte-identical errors.
    expect(() => membersSvc.addMember(trip.id, invitee.email, owner.id, owner.id)).toThrow('User already has access');
    expect(() => membersSvc.addMember(trip.id, owner.email, owner.id, owner.id)).toThrow('Trip owner is already a member');
    expect(() => membersSvc.addMember(trip.id, '', owner.id, owner.id)).toThrow('Email or username required');

    membersSvc.removeMember(trip.id, invitee.id);
    expect(testDb.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, invitee.id)).toBeUndefined();
  });

  it('TRIP-SVC-050: copy remaps tags, accommodations, reservations, day notes, budget, bags and category order', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Deep', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = getDays(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Zed' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    const tagId = Number(testDb.prepare("INSERT INTO tags (name, user_id) VALUES ('beach', ?)").run(user.id).lastInsertRowid);
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tagId);
    const accomId = Number(testDb.prepare(
      "INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_out) VALUES (?, ?, ?, ?, '15:00', '11:00')",
    ).run(trip.id, place.id, days[0].id, days[1].id).lastInsertRowid);
    testDb.prepare(
      'INSERT INTO reservations (trip_id, day_id, end_day_id, place_id, assignment_id, accommodation_id, title, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(trip.id, days[0].id, days[1].id, place.id, assignment.id, accomId, 'Stay', 'hotel');
    testDb.prepare("INSERT INTO budget_items (trip_id, category, name, total_price) VALUES (?, 'stay', 'Hotel', 120)").run(trip.id);
    const bagId = Number(testDb.prepare("INSERT INTO packing_bags (trip_id, name) VALUES (?, 'Backpack')").run(trip.id).lastInsertRowid);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, checked, bag_id) VALUES (?, 'Towel', 1, ?)").run(trip.id, bagId);
    createDayNote(testDb, days[0].id, trip.id, { text: 'note' });
    testDb.prepare("INSERT INTO todo_items (trip_id, name, checked) VALUES (?, 'Book', 1)").run(trip.id);
    testDb.prepare("INSERT INTO budget_category_order (trip_id, category, sort_order) VALUES (?, 'stay', 2)").run(trip.id);

    const newTripId = svc.copy(trip.id, user.id);

    const newDays = getDays(newTripId);
    expect(newDays).toHaveLength(2);
    const newPlace = testDb.prepare('SELECT id FROM places WHERE trip_id = ?').get(newTripId) as { id: number };
    expect(testDb.prepare('SELECT tag_id FROM place_tags WHERE place_id = ?').get(newPlace.id)).toEqual({ tag_id: tagId });
    const newAccom = testDb.prepare('SELECT id, place_id, start_day_id, end_day_id FROM day_accommodations WHERE trip_id = ?').get(newTripId) as any;
    expect(newAccom.place_id).toBe(newPlace.id);
    expect(newAccom.start_day_id).toBe(newDays[0].id);
    const newRes = testDb.prepare('SELECT day_id, end_day_id, place_id, accommodation_id FROM reservations WHERE trip_id = ?').get(newTripId) as any;
    // Quirk preserved from the legacy copyTripById: reservations.accommodation_id
    // is a TEXT column, so the number-keyed accomMap lookup never matches and the
    // copied reservation loses its accommodation link (nulled, not remapped).
    expect(newRes).toEqual({ day_id: newDays[0].id, end_day_id: newDays[1].id, place_id: newPlace.id, accommodation_id: null });
    expect((testDb.prepare('SELECT COUNT(*) AS n FROM budget_items WHERE trip_id = ?').get(newTripId) as any).n).toBe(1);
    const newItem = testDb.prepare('SELECT checked, bag_id FROM packing_items WHERE trip_id = ?').get(newTripId) as any;
    expect(newItem.checked).toBe(0);
    expect(newItem.bag_id).not.toBeNull();
    expect((testDb.prepare('SELECT checked, assigned_user_id FROM todo_items WHERE trip_id = ?').get(newTripId) as any)).toEqual({ checked: 0, assigned_user_id: null });
    expect((testDb.prepare('SELECT sort_order FROM budget_category_order WHERE trip_id = ?').get(newTripId) as any).sort_order).toBe(2);
    expect((testDb.prepare('SELECT COUNT(*) AS n FROM day_notes WHERE trip_id = ?').get(newTripId) as any).n).toBe(1);

    // Missing source throws the byte-identical error.
    expect(() => svc.copy(99999, user.id)).toThrow('Trip not found');
  });
});

// ── Post-fold quirk fixes (transactions, owner display name) ─────────────────

describe('quirk fixes', () => {
  /** A TripsService whose connection throws when preparing SQL matching `match`. */
  function failingConnection(match: string) {
    const conn = new Proxy(testDb, {
      get(target, prop) {
        if (prop === 'prepare') {
          return (sql: string) => {
            if (sql.includes(match)) throw new Error('boom');
            return target.prepare(sql);
          };
        }
        const v = (target as any)[prop];
        return typeof v === 'function' ? v.bind(target) : v;
      },
    });
    return { connection: conn, canAccessTrip: dbMock.canAccessTrip, isOwner: dbMock.isOwner } as unknown as import('../../../src/nest/database/database.service').DatabaseService;
  }

  function failingTrips(match: string) {
    const fdbs = failingConnection(match);
    return new TripsService(
      fdbs,
      new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService()),
      daysSvc,
      new PermissionsService(dbs()),
      budgetSvc,
      new VacayService(dbs(), new RealtimeService()),
      new RealtimeService(),
      undefined as never,
    );
  }

  /** Same frozen connection, for the guest deletion that now lives on the roster. */
  function failingMembers(match: string) {
    return new TripMembersService(
      failingConnection(match), budgetSvc, new UserCleanupService(dbs()),
      new PermissionsService(dbs()), new RealtimeService(),
    );
  }

  it('TRIP-SVC-051: remove is atomic — a failed trip DELETE keeps the journey entries intact', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const journeyId = Number(testDb.prepare(
      "INSERT INTO journeys (user_id, title, created_at, updated_at) VALUES (?, 'J', 0, 0)",
    ).run(user.id).lastInsertRowid);
    testDb.prepare(
      "INSERT INTO journey_entries (journey_id, source_trip_id, author_id, type, title, entry_date, created_at, updated_at) VALUES (?, ?, ?, 'skeleton', 'S', '2025-06-01', 0, 0)",
    ).run(journeyId, trip.id, user.id);

    const broken = failingTrips('DELETE FROM trips WHERE id = ?');
    expect(() => broken.remove(trip.id, user.id, 'user')).toThrow('boom');

    // The skeleton cleanup rolled back with the failed delete.
    expect(testDb.prepare("SELECT id FROM journey_entries WHERE type = 'skeleton'").get()).toBeDefined();
    expect(testDb.prepare('SELECT id FROM trips WHERE id = ?').get(trip.id)).toBeDefined();
  });

  it('TRIP-SVC-052: deleteGuest is atomic — a failed user DELETE rolls the budget re-split back', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member: guest } = membersSvc.createGuest(trip.id, 'Gia', owner.id);
    const item = budgetSvc.createBudgetItem(trip.id, { name: 'Dinner', total_price: 80, member_ids: [owner.id, guest.id] });

    const broken = failingMembers('DELETE FROM users WHERE id = ? AND is_guest = 1');
    expect(() => broken.deleteGuest(trip.id, guest.id)).toThrow('boom');

    // Neither the guest nor their split membership was touched.
    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(guest.id)).toBeDefined();
    const row = testDb.prepare('SELECT persons FROM budget_items WHERE id = ?').get(item.id) as { persons: number | null };
    expect(row.persons).toBe(2);
  });

  it('TRIP-SVC-053: listMembers prefers the owner display_name over the raw username (quirk fix)', () => {
    const { user: owner } = createUser(testDb, { username: 'owner-handle' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Olive Displayed', owner.id);
    const trip = createTrip(testDb, owner.id);
    const { owner: row } = membersSvc.listMembers(trip.id, owner.id);
    expect(row.username).toBe('Olive Displayed');
  });
});

/**
 * activeTrip powers the startup redirect, so its order has to stay identical to
 * the dashboard's sortTrips (client/src/pages/dashboard/dashboardModel.ts):
 * running today → next one starting (earliest first) → most recently started →
 * undated last. If these drift, "open my trip" and the hero show different trips.
 */
describe('activeTrip (startup destination)', () => {
  const TODAY = '2026-08-08';

  it('TRIP-SVC-054: prefers the trip running today over anything upcoming', () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'soon', start_date: '2026-08-20', end_date: '2026-08-25' });
    createTrip(testDb, user.id, { title: 'running', start_date: '2026-08-05', end_date: '2026-08-12' });
    expect(svc.activeTrip(user.id, TODAY)?.title).toBe('running');
  });

  it('TRIP-SVC-055: without a running trip it takes the next one starting, earliest first', () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'late', start_date: '2026-12-01', end_date: '2026-12-10' });
    createTrip(testDb, user.id, { title: 'soon', start_date: '2026-09-01', end_date: '2026-09-10' });
    expect(svc.activeTrip(user.id, TODAY)?.title).toBe('soon');
  });

  it('TRIP-SVC-056: falls back to the most recently started trip, undated ones last', () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'undated' });
    createTrip(testDb, user.id, { title: 'old', start_date: '2020-01-01', end_date: '2020-01-10' });
    createTrip(testDb, user.id, { title: 'recent', start_date: '2026-07-01', end_date: '2026-07-10' });
    expect(svc.activeTrip(user.id, TODAY)?.title).toBe('recent');
  });

  it('TRIP-SVC-057: skips archived trips and returns undefined when nothing is left', () => {
    const { user } = createUser(testDb);
    const archived = createTrip(testDb, user.id, { title: 'archived', start_date: '2026-08-05', end_date: '2026-08-12' });
    testDb.prepare('UPDATE trips SET is_archived = 1 WHERE id = ?').run(archived.id);
    expect(svc.activeTrip(user.id, TODAY)).toBeUndefined();
  });

  it('TRIP-SVC-058: sees shared trips but never another user\'s private ones', () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    createTrip(testDb, owner.id, { title: 'private', start_date: '2026-08-05', end_date: '2026-08-12' });
    const shared = createTrip(testDb, owner.id, { title: 'shared', start_date: '2026-09-01', end_date: '2026-09-10' });
    addTripMember(testDb, shared.id, guest.id);
    expect(svc.activeTrip(guest.id, TODAY)?.title).toBe('shared');
  });
});
