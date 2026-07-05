/**
 * Unit tests for tripService — exportICS function (TRIP-SVC-001 through TRIP-SVC-009).
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
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
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createPlace, createDay, createDayAssignment, createDayNote, addTripMember } from '../../helpers/factories';
import { exportICS, generateDays, deleteOldCover, updateTrip, transferOwnership, createGuest, renameGuest, deleteGuest, listMembers, addMember } from '../../../src/services/tripService';
import fs from 'fs';

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
    generateDays(trip.id, '2025-06-10', '2025-06-14');

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
    generateDays(trip.id, '2025-07-01', '2025-07-03');

    const daysAfter = getDays(trip.id);
    expect(daysAfter).toHaveLength(3);
    expect(daysAfter.map(d => d.date)).toEqual(['2025-07-01', '2025-07-02', '2025-07-03']);
  });

  it('TRIP-SVC-016: shrinking range deletes empty overflow days (issue #909)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-07' });
    expect(getDays(trip.id)).toHaveLength(7);

    // Shrink 7 → 5; days 6 and 7 have no content
    generateDays(trip.id, '2025-07-01', '2025-07-05');

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
    generateDays(trip.id, '2025-08-01', '2025-08-05');

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
    generateDays(trip.id, null, null);

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
    generateDays(trip.id, '2025-10-03', '2025-10-07');

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
    generateDays(trip.id, '2025-11-01', '2025-11-04');

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
    generateDays(trip.id, null, null);
    const dateless = getDays(trip.id);
    expect(dateless).toHaveLength(7);
    expect(dateless.every(d => d.date === null)).toBe(true);

    // Give the LAST dateless day real content so it must be preserved.
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, dateless[6].id, place.id);

    // Now set an explicit 2-day range. The first two dateless days are reused for
    // the dates; the four empty leftovers must be removed, the one with content kept.
    generateDays(trip.id, '2026-01-10', '2026-01-11');

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

describe('exportICS', () => {
  it('TRIP-SVC-001: returns VCALENDAR wrapper', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, {
      title: 'My Vacation',
      start_date: '2025-06-01',
      end_date: '2025-06-07',
    });

    const { ics } = exportICS(trip.id);

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

    const { ics } = exportICS(trip.id);

    expect(ics).toContain('DTSTART;VALUE=DATE:20250601');
    expect(ics).toContain('SUMMARY:Summer Holiday');
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

    const { ics } = exportICS(trip.id);

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

    const { ics } = exportICS(trip.id);

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

    const { ics } = exportICS(trip.id);

    expect(ics).toContain('Airline: Air Test');
    expect(ics).toContain('Flight: AT100');
  });

  it('TRIP-SVC-006: special characters in title are escaped', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip; First, Best' });

    const { ics } = exportICS(trip.id);

    expect(ics).toContain('Trip\\; First\\, Best');
  });

  it('TRIP-SVC-007: throws NotFoundError for non-existent trip', () => {
    expect(() => exportICS(99999)).toThrow();
  });

  it('TRIP-SVC-008: returns a filename derived from trip title', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'My Trip 2025' });

    const { filename } = exportICS(trip.id);

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

    const { ics } = exportICS(trip.id);

    expect(ics).toContain('DTEND:20250602T160000');
  });

  it('TRIP-SVC-010: flight with endpoint times but no reservation_time is included', () => {
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

    const { ics } = exportICS(trip.id);

    expect(ics).toContain('SUMMARY:CDG → JFK');
    expect(ics).toContain('DTSTART:20250602T090000');
    expect(ics).toContain('DTEND:20250602T120000');
    expect(ics).toContain('Route: CDG → JFK');
  });

  it('TRIP-SVC-011: flight endpoint with no local_date is skipped (relative Day-N trips)', () => {
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

    const { ics } = exportICS(trip.id);

    expect(ics).not.toContain('SUMMARY:Timeless Flight');
  });
});

// ── deleteOldCover — path containment ──────────────────────────────────────────

describe('deleteOldCover', () => {
  it('TRIP-SVC-COVER-001: never unlinks outside uploads/covers for a crafted cover_image', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    try {
      // Attacker-controlled values aimed at auth-gated sibling upload dirs.
      deleteOldCover('/uploads/files/victim.pdf');
      deleteOldCover('/uploads/covers/../files/secret.pdf');
      deleteOldCover('/uploads/avatars/someone.png');

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
      deleteOldCover('/uploads/covers/abc123.jpg');
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
    updateTrip(trip.id, user.id, { start_date: '2025-06-02', end_date: '2025-06-06' }, 'user');
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
    updateTrip(trip.id, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' }, 'user');
    const res = testDb.prepare('SELECT day_id FROM reservations WHERE id = ?').get(resId) as { day_id: number };
    expect(res.day_id).toBe(origDayId);
  });
});

describe('transferOwnership (#973)', () => {
  it('TRIP-SVC-020: hands the trip to a member and demotes the former owner to a member', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const result = transferOwnership(trip.id, member.id, owner.id);
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
    expect(() => transferOwnership(trip.id, member.id, member.id)).toThrow();
  });

  it('TRIP-SVC-022: rejects a transfer to someone who is not a member', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(() => transferOwnership(trip.id, stranger.id, owner.id)).toThrow('New owner must be a trip member');
  });

  it('TRIP-SVC-023: rejects transferring to yourself', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(() => transferOwnership(trip.id, owner.id, owner.id)).toThrow('You already own this trip');
  });
});

describe('guest members (#1362)', () => {
  it('TRIP-SVC-030: createGuest adds a credential-less user joined into the trip', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const { member } = createGuest(trip.id, '  Anna  ', owner.id);
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
    const { members } = listMembers(trip.id, owner.id) as any;
    const guest = members.find((x: any) => x.id === member.id);
    expect(guest.username).toBe('Anna');
    expect(guest.is_guest).toBe(true);
  });

  it('TRIP-SVC-031: the same guest name is allowed, not suffixed (#1446)', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const a = createGuest(trip.id, 'Sam', owner.id);
    const b = createGuest(trip.id, 'Sam', owner.id);
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
    const { member } = createGuest(trip.id, 'Bob', owner.id);

    expect(renameGuest(trip.id, member.id, 'Robert')).toBe(true);
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(member.id) as any).display_name).toBe('Robert');

    // A real user cannot be renamed through the guest path…
    expect(renameGuest(trip.id, owner.id, 'Hacked')).toBe(false);
    // …and a guest cannot be renamed from a different trip.
    expect(renameGuest(otherTrip.id, member.id, 'Nope')).toBe(false);
  });

  it('TRIP-SVC-033: deleteGuest removes the user (cascading membership), guest-only + trip-scoped', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member } = createGuest(trip.id, 'Carol', owner.id);

    // Real members are not deletable via the guest path.
    expect(deleteGuest(trip.id, owner.id)).toBe(false);

    expect(deleteGuest(trip.id, member.id)).toBe(true);
    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(member.id)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM trip_members WHERE user_id = ?').get(member.id)).toBeUndefined();
  });

  it('TRIP-SVC-034: a guest is never invitable (addMember) nor a transfer target', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const { member } = createGuest(trip.id, 'Dora', owner.id);

    // The synthetic username/email must not resolve through the invite box.
    expect(() => addMember(trip.id, 'Dora', owner.id, owner.id)).toThrow('User not found');
    // Ownership can never be handed to a guest.
    expect(() => transferOwnership(trip.id, member.id, owner.id)).toThrow('Cannot transfer ownership to a guest');
  });
});
