/**
 * Unit tests for the DI-native DaysService — DAY-SVC-001 through DAY-SVC-026
 * moved 1:1 from the legacy tests/unit/services/dayService.test.ts;
 * DAY-SVC-027 through DAY-SVC-032 pin the days.bridge delegation;
 * DAY-SVC-033 through DAY-SVC-036 pin the post-port defect fixes (update
 * presence sentinels, accommodation write atomicity, batched tag load).
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
    getPlaceWithTags: (placeId: any) => {
      const place: any = db.prepare(`
        SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
      `).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
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
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createDayAccommodation } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { DaysService, addDays } from '../../../src/nest/days/days.service';
import { getDay as bridgeGetDay, listDays as bridgeListDays } from '../../../src/nest/days/days.bridge';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';

const svc = new DaysService(new DatabaseService(testDb), new PermissionsService(new DatabaseService(testDb)), new RealtimeService());

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

// ── verifyTripAccess ──────────────────────────────────────────────────────────

describe('verifyTripAccess', () => {
  it('DAY-SVC-001 — returns trip row for owner', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = svc.verifyTripAccess(trip.id, user.id) as any;
    expect(result).toBeDefined();
    expect(result.id).toBe(trip.id);
  });

  it('DAY-SVC-002 — returns falsy for non-member', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });
});

// ── getAssignmentsForDay ──────────────────────────────────────────────────────

describe('getAssignmentsForDay', () => {
  it('DAY-SVC-003 — returns empty array when day has no assignments', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    expect(svc.getAssignmentsForDay(day.id)).toEqual([]);
  });

  it('DAY-SVC-004 — returns assignments with nested place object', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower', lat: 48.8, lng: 2.3 }) as any;
    createDayAssignment(testDb, day.id, place.id, { order_index: 0 });

    const assignments = svc.getAssignmentsForDay(day.id) as any[];
    expect(assignments).toHaveLength(1);
    expect(assignments[0].place).toBeDefined();
    expect(assignments[0].place.name).toBe('Eiffel Tower');
    expect(assignments[0].place.lat).toBe(48.8);
  });

  it('DAY-SVC-005 — assignment includes tags array (empty when place has none)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'No Tags' }) as any;
    createDayAssignment(testDb, day.id, place.id);

    const assignments = svc.getAssignmentsForDay(day.id) as any[];
    expect(Array.isArray(assignments[0].place.tags)).toBe(true);
  });

  it('DAY-SVC-006 — assignments are ordered by order_index ASC', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const p1 = createPlace(testDb, trip.id, { name: 'Second' }) as any;
    const p2 = createPlace(testDb, trip.id, { name: 'First' }) as any;
    createDayAssignment(testDb, day.id, p1.id, { order_index: 2 });
    createDayAssignment(testDb, day.id, p2.id, { order_index: 1 });

    const assignments = svc.getAssignmentsForDay(day.id) as any[];
    expect(assignments[0].place.name).toBe('First');
    expect(assignments[1].place.name).toBe('Second');
  });
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('DAY-SVC-007 — returns { days: [] } for trip with no days', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = svc.list(trip.id) as any;
    expect(result.days).toEqual([]);
  });

  it('DAY-SVC-008 — returns days with assignments nested', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);
    const result = svc.list(trip.id) as any;
    expect(result.days).toHaveLength(1);
    expect(Array.isArray(result.days[0].assignments)).toBe(true);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create (service)', () => {
  it('DAY-SVC-009 — creates a day with auto-incremented day_number', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = svc.create(trip.id) as any;
    const d2 = svc.create(trip.id) as any;
    expect(d1.day_number).toBe(1);
    expect(d2.day_number).toBe(2);
  });

  it('DAY-SVC-010 — returns day with empty assignments array', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = svc.create(trip.id) as any;
    expect(Array.isArray(day.assignments)).toBe(true);
    expect(day.assignments).toHaveLength(0);
  });
});

// ── getDay / update / remove ──────────────────────────────────────────────────

describe('getDay', () => {
  it('DAY-SVC-011 — returns day when id and tripId match', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const found = svc.getDay(day.id, trip.id) as any;
    expect(found).toBeDefined();
    expect(found.id).toBe(day.id);
  });

  it('DAY-SVC-012 — returns undefined for non-existent day', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.getDay(99999, trip.id)).toBeUndefined();
  });
});

describe('update', () => {
  it('DAY-SVC-013 — updates notes and returns updated day with assignments', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const updated = svc.update(day.id, day, { notes: 'Updated notes' }) as any;
    expect(updated.notes).toBe('Updated notes');
    expect(Array.isArray(updated.assignments)).toBe(true);
  });

  it('DAY-SVC-014 — updates title', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const updated = svc.update(day.id, day, { title: 'Day 1 - City Tour' }) as any;
    expect(updated.title).toBe('Day 1 - City Tour');
  });
});

describe('remove', () => {
  it('DAY-SVC-015 — deletes the day', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    svc.remove(day.id);
    expect(svc.getDay(day.id, trip.id)).toBeUndefined();
  });
});

// ── validateAccommodationRefs ─────────────────────────────────────────────────

describe('validateAccommodationRefs', () => {
  it('DAY-SVC-016 — returns no errors when all refs are valid', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const errors = svc.validateAccommodationRefs(trip.id, place.id, day.id, day.id);
    expect(errors).toHaveLength(0);
  });

  it('DAY-SVC-017 — returns error when place does not exist in trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const errors = svc.validateAccommodationRefs(trip.id, 99999, day.id, day.id);
    expect(errors.some((e: any) => e.field === 'place_id')).toBe(true);
  });

  it('DAY-SVC-018 — returns error when start_day_id is invalid', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const errors = svc.validateAccommodationRefs(trip.id, place.id, 99999, day.id);
    expect(errors.some((e: any) => e.field === 'start_day_id')).toBe(true);
  });
});

// ── createAccommodation ───────────────────────────────────────────────────────

describe('createAccommodation', () => {
  it('DAY-SVC-019 — creates accommodation and returns it with place info', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Grand Hotel' }) as any;

    const accom = svc.createAccommodation(trip.id, {
      place_id: place.id,
      start_day_id: day.id,
      end_day_id: day.id,
      check_in: '15:00',
      check_out: '11:00',
    }) as any;

    expect(accom).toBeDefined();
    expect(accom.place_name).toBe('Grand Hotel');
  });

  it('DAY-SVC-020 — auto-creates a linked reservation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'City Hotel' }) as any;

    const accom = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const reservation = testDb.prepare('SELECT * FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(reservation).toBeDefined();
    expect(reservation.type).toBe('hotel');
    expect(reservation.status).toBe('confirmed');
  });
});

// ── getAccommodation ──────────────────────────────────────────────────────────

describe('getAccommodation', () => {
  it('DAY-SVC-021 — returns accommodation for valid id and trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id) as any;
    const found = svc.getAccommodation(accom.id, trip.id) as any;
    expect(found).toBeDefined();
    expect(found.id).toBe(accom.id);
  });

  it('DAY-SVC-022 — returns undefined for non-existent accommodation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.getAccommodation(99999, trip.id)).toBeUndefined();
  });
});

// ── updateAccommodation ───────────────────────────────────────────────────────

describe('updateAccommodation', () => {
  it('DAY-SVC-023 — updates check-in and check-out times', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    const updated = svc.updateAccommodation(accom.id, existing as any, { check_in: '16:00', check_out: '12:00' }) as any;
    expect(updated).toBeDefined();

    // Verify linked reservation metadata was synced
    const reservation = testDb.prepare('SELECT * FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(reservation).toBeDefined();
    const meta = JSON.parse(reservation.metadata || '{}');
    expect(meta.check_in_time).toBe('16:00');
    expect(meta.check_out_time).toBe('12:00');
  });

  it('DAY-SVC-024 — preserves existing fields when not updated', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
      confirmation: 'ABC123',
    }) as any;

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    svc.updateAccommodation(accom.id, existing as any, { check_in: '14:00' });

    const row = svc.getAccommodation(accom.id, trip.id) as any;
    expect(row.confirmation).toBe('ABC123');
  });
});

// ── deleteAccommodation ───────────────────────────────────────────────────────

describe('deleteAccommodation', () => {
  it('DAY-SVC-025 — deletes accommodation and its linked reservation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const reservation = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;

    const result = svc.deleteAccommodation(accom.id);
    expect(result.linkedReservationId).toBe(reservation.id);

    // Accommodation is gone
    expect(svc.getAccommodation(accom.id, trip.id)).toBeUndefined();

    // Reservation is gone
    const deletedRes = testDb.prepare('SELECT id FROM reservations WHERE id = ?').get(reservation.id);
    expect(deletedRes).toBeUndefined();
  });

  it('DAY-SVC-026 — returns null linkedReservationId when no reservation was linked', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id) as any;

    // Remove the auto-created reservation so there's no linked one
    testDb.prepare('DELETE FROM reservations WHERE accommodation_id = ?').run(accom.id);

    const result = svc.deleteAccommodation(accom.id);
    expect(result.linkedReservationId).toBeNull();
  });
});

// ── days.bridge delegation (out-of-container consumers) ───────────────────────
// The listAccommodations / restampReservationDates / resyncAccommodationDays /
// addDays bridge exports were pruned when their last outside-container
// consumer (legacy tripService) folded into the DI-native TripsService —
// 029/031/032 pin the same behavior on the service.

describe('days.bridge', () => {
  it('DAY-SVC-027 — getDay delegates to DaysService.getDay', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    expect(bridgeGetDay(day.id, trip.id)!.id).toBe(day.id);
    expect(bridgeGetDay(99999, trip.id)).toBeUndefined();
  });

  it('DAY-SVC-028 — listDays delegates to DaysService.list', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);
    const result = bridgeListDays(trip.id);
    expect(result.days).toHaveLength(1);
    expect(Array.isArray(result.days[0].assignments)).toBe(true);
  });

  it('DAY-SVC-029 — listAccommodations returns the hydrated stays', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Ryokan' });
    createDayAccommodation(testDb, trip.id, place.id, day.id, day.id);
    const rows = svc.listAccommodations(trip.id) as { place_name: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].place_name).toBe('Ryokan');
  });

  it('DAY-SVC-030 — addDays stays UTC-only across month and year rollovers', () => {
    expect(addDays('2026-02-27', 3)).toBe('2026-03-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-06-07', -7)).toBe('2026-05-31');
  });

  it('DAY-SVC-031 — restampReservationDates re-stamps a booking onto its day\'s new date', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2026-01-01' });
    testDb.prepare(
      'INSERT INTO reservations (trip_id, day_id, title, reservation_time) VALUES (?, ?, ?, ?)'
    ).run(trip.id, day.id, 'Dinner', '2026-01-01T19:00');

    svc.restampReservationDates(
      trip.id,
      new Map([[day.id, '2026-01-01']]),
      new Map([[day.id, '2026-01-05']]),
    );

    const row = testDb.prepare('SELECT reservation_time FROM reservations WHERE trip_id = ?').get(trip.id) as { reservation_time: string };
    expect(row.reservation_time).toBe('2026-01-05T19:00');
  });

  it('DAY-SVC-032 — resyncAccommodationDays re-anchors a stay to the day holding its old date', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-01-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-01-02' });
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const accom = createDayAccommodation(testDb, trip.id, place.id, d1.id, d1.id);

    // The trip's range shifted: d1 now holds 01-02 and d2 holds 01-03; the day
    // holding the stay's old date (01-01) no longer exists → the stay stays
    // glued to its rows, but a range where d2 takes over 01-01 re-anchors it.
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-01-02', d1.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-01-01', d2.id);
    testDb.prepare('UPDATE days SET day_number = 0 WHERE id = ?').run(d2.id);

    svc.resyncAccommodationDays(trip.id, new Map([[d1.id, '2026-01-01'], [d2.id, '2026-01-02']]));

    const row = testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(accom.id) as { start_day_id: number; end_day_id: number };
    expect(row.start_day_id).toBe(d2.id);
    expect(row.end_day_id).toBe(d2.id);
  });
});

// ── post-port defect fixes ────────────────────────────────────────────────────

describe('quirk fixes', () => {
  it('DAY-SVC-033 — update preserves the omitted column (title-only keeps notes, notes-only keeps title)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    let day = createDay(testDb, trip.id);
    day = svc.update(day.id, day, { notes: 'Walking day' }) as never;
    day = svc.update(day.id, day, { title: 'Arrival' }) as never;
    expect(day).toMatchObject({ title: 'Arrival', notes: 'Walking day' });
    day = svc.update(day.id, day, { notes: 'Museum day' }) as never;
    expect(day).toMatchObject({ title: 'Arrival', notes: 'Museum day' });
    // A present key still clears via the legacy falsy coercion.
    day = svc.update(day.id, day, { notes: '' }) as never;
    expect(day.notes).toBeNull();
    expect(day.title).toBe('Arrival');
  });

  it('DAY-SVC-034 — createAccommodation is atomic: a failed reservation insert leaves no orphan stay', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    testDb.exec("CREATE TRIGGER boom BEFORE INSERT ON reservations BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      expect(() => svc.createAccommodation(trip.id, {
        place_id: place.id, start_day_id: day.id, end_day_id: day.id,
      })).toThrow();
      expect(testDb.prepare('SELECT COUNT(*) as n FROM day_accommodations WHERE trip_id = ?').get(trip.id)).toMatchObject({ n: 0 });
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }
  });

  it('DAY-SVC-035 — deleteAccommodation is atomic: a failed stay delete keeps the linked reservation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const accom = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as { id: number };
    testDb.exec("CREATE TRIGGER boom BEFORE DELETE ON day_accommodations BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      expect(() => svc.deleteAccommodation(accom.id)).toThrow();
      // The earlier reservation delete inside the transaction rolled back.
      expect(testDb.prepare('SELECT COUNT(*) as n FROM reservations WHERE accommodation_id = ?').get(accom.id)).toMatchObject({ n: 1 });
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }
  });

  it('DAY-SVC-036 — getAssignmentsForDay returns full tag rows from the batched load', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Tagged' });
    createDayAssignment(testDb, day.id, place.id);
    const tagId = Number(testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(user.id, 'Food', '#ff0000').lastInsertRowid);
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tagId);

    const assignments = svc.getAssignmentsForDay(day.id);
    expect(assignments[0].place.tags).toHaveLength(1);
    expect(assignments[0].place.tags[0]).toMatchObject({ id: tagId, name: 'Food', color: '#ff0000' });
  });
});
