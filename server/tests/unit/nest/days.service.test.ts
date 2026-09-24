/**
 * Unit tests for the DI-native DaysService — DAY-SVC-001 through DAY-SVC-026
 * moved 1:1 from the legacy tests/unit/services/dayService.test.ts;
 * DAY-SVC-027 through DAY-SVC-032 pin the days.bridge delegation;
 * DAY-SVC-033 through DAY-SVC-036 pin the post-port defect fixes (update
 * presence sentinels, accommodation write atomicity, batched tag load);
 * DAY-SVC-037 through DAY-SVC-054 cover the reorder/re-date machinery that
 * stayed behind when the accommodation CRUD moved to accommodations/ — mostly
 * the SKIP paths (booking without a day, snapshot without a date, stay that
 * must not be re-anchored), which the happy-path integration test never walks.
 * DAY-SVC-091 through DAY-SVC-097 and DAY-SVC-099 cover the dated append.
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
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createDayAccommodation, createDayNote, createTag, createReservation } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { DaysService, DayReorderError, DayAppendError, NO_DATES_MESSAGE, addDays } from '../../../src/nest/days/days.service';
// Was days.bridge, deleted with the other three that had no consumer outside the
// container. The assertions stayed; they point at the service now.
const bridgeGetDay = (id: string | number, tripId: string | number) => svc.getDay(id, tripId);
const bridgeListDays = (tripId: string | number) => svc.list(tripId);
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { makeAccommodationsService } from '../../helpers/accommodations-service';
import type { Day } from '../../../src/types';

const svc = new DaysService(new DatabaseService(testDb), new PermissionsService(new DatabaseService(testDb)), new RealtimeService(), new QueryHelpersService(new DatabaseService(testDb)));
const accommodations = makeAccommodationsService(testDb);

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

  it('DAY-SVC-029 — a road-trip stop keeps its kind on both loaders', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Esso', lat: 53.8, lng: 10.4 }) as any;
    testDb.prepare('UPDATE places SET stop_type = ? WHERE id = ?').run('fuel', place.id);
    createDayAssignment(testDb, day.id, place.id, { order_index: 0 });

    // Both queries build the same place shape by hand, and only one of them used to
    // fetch the column — so the rail drew a petrol station as an ordinary numbered stop
    // while the database had known it was fuel all along.
    const single = svc.getAssignmentsForDay(day.id) as any[];
    expect(single[0].place.stop_type).toBe('fuel');

    const listed = svc.list(trip.id) as any;
    expect(listed.days[0].assignments[0].place.stop_type).toBe('fuel');
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

// DAY-SVC-015 pinned the bare delete this class used to own. Deleting a day moved
// to DayRemovalService with the renumbering and the stay cancellation around it;
// its cases are DAY-DEL-001 to DAY-DEL-018 in day-removal.service.test.ts.

describe('getTripForViewer', () => {
  it('DAY-SVC-098: reads the trip in list shape, ownership from the viewer, without the feed token', () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-02' });
    testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run('secret-feed', trip.id);

    expect(svc.getTripForViewer(trip.id, user.id)).toMatchObject({
      id: trip.id, end_date: '2026-06-02', day_count: 2, place_count: 0, is_owner: 1, feed_token: null,
    });
    expect(svc.getTripForViewer(trip.id, member.id)).toMatchObject({ id: trip.id, is_owner: 0 });
    expect(svc.getTripForViewer(99999, user.id)).toBeUndefined();
  });
});

// ── validateAccommodationRefs ─────────────────────────────────────────────────

// ── createAccommodation ───────────────────────────────────────────────────────

// ── getAccommodation ──────────────────────────────────────────────────────────

// ── updateAccommodation ───────────────────────────────────────────────────────

// ── deleteAccommodation ───────────────────────────────────────────────────────

// ── days.bridge delegation (out-of-container consumers) ───────────────────────
// The listAccommodations / restampReservationDates / resyncAccommodationDays /
// addDays bridge exports were pruned when their last outside-container
// consumer (legacy tripService) folded into the DI-native TripsService —
// 029/031/032 pin the same behavior on the service.

describe('DaysService — the surface the deleted bridge exposed', () => {
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
    // Typed as the domain Day, not as the factory's row shape: the variable is
    // rebound to what update() returns, and only Day carries `notes`.
    let day: Day = createDay(testDb, trip.id);
    day = svc.update(day.id, day, { notes: 'Walking day' });
    day = svc.update(day.id, day, { title: 'Arrival' });
    expect(day).toMatchObject({ title: 'Arrival', notes: 'Walking day' });
    day = svc.update(day.id, day, { notes: 'Museum day' });
    expect(day).toMatchObject({ title: 'Arrival', notes: 'Museum day' });
    // A present key still clears via the legacy falsy coercion.
    day = svc.update(day.id, day, { notes: '' });
    expect(day.notes).toBeNull();
    expect(day.title).toBe('Arrival');
  });

  // Asserted against AccommodationsService, which owns createAccommodation since
  // the days/accommodations split. It read `svc.createAccommodation` until then:
  // that is `undefined`, calling it throws, and `.toThrow()` was satisfied by the
  // TypeError rather than by the rollback. The invariant went unchecked for the
  // whole time the case reported green.
  it('DAY-SVC-034 — createAccommodation is atomic: a failed reservation insert leaves no orphan stay', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    testDb.exec("CREATE TRIGGER boom BEFORE INSERT ON reservations BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      expect(() => accommodations.createAccommodation(trip.id, {
        place_id: place.id, start_day_id: day.id, end_day_id: day.id,
      })).toThrow();
      expect(testDb.prepare('SELECT COUNT(*) as n FROM day_accommodations WHERE trip_id = ?').get(trip.id)).toMatchObject({ n: 0 });
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

// ── reorder / re-date machinery (#589) ────────────────────────────────────────
// The integration test walks the happy paths (permute, re-pin, extend). What is
// only reachable from here are the paths where something must NOT move: a
// booking the maps say nothing about, a stay whose old dates no longer resolve,
// a trip with no dates at all. Those are the branches a regression would take
// silently — the day list still looks right while a booking or a stay quietly
// jumps to the wrong day.

describe('restampReservationDates', () => {
  it('DAY-SVC-037 — leaves a booking alone when it has no day, no time, or its day did not move', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const stayer = createDay(testDb, trip.id, { date: '2026-01-01' });
    const unmapped = createDay(testDb, trip.id, { date: '2026-01-02' });
    const halfMapped = createDay(testDb, trip.id, { date: '2026-01-03' });

    const insert = testDb.prepare('INSERT INTO reservations (trip_id, day_id, title, reservation_time) VALUES (?, ?, ?, ?)');
    const unplaced = Number(insert.run(trip.id, null, 'Unplaced', '2026-01-01T09:00').lastInsertRowid);
    const untimed = Number(insert.run(trip.id, stayer.id, 'Untimed', null).lastInsertRowid);
    const parked = Number(insert.run(trip.id, stayer.id, 'Parked', '2026-01-01T19:00').lastInsertRowid);
    const offMap = Number(insert.run(trip.id, unmapped.id, 'Off map', '2026-01-02T12:00').lastInsertRowid);
    const halfOff = Number(insert.run(trip.id, halfMapped.id, 'Half off', '2026-01-03T12:00').lastInsertRowid);

    svc.restampReservationDates(
      trip.id,
      new Map([[stayer.id, '2026-01-01'], [halfMapped.id, '2026-01-03']]),
      // stayer keeps its date, unmapped is in neither map, halfMapped only in the old one.
      new Map([[stayer.id, '2026-01-01']]),
    );

    const times = Object.fromEntries(
      (testDb.prepare('SELECT id, reservation_time FROM reservations WHERE trip_id = ?').all(trip.id) as { id: number; reservation_time: string | null }[])
        .map(r => [r.id, r.reservation_time])
    );
    expect(times).toEqual({
      [unplaced]: '2026-01-01T09:00',
      [untimed]: null,
      [parked]: '2026-01-01T19:00',
      [offMap]: '2026-01-02T12:00',
      [halfOff]: '2026-01-03T12:00',
    });
  });

  it('DAY-SVC-038 — shifts every transport leg by the booking\'s day delta and skips a leg with no date', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2026-01-01' });
    const flight = Number(testDb.prepare(
      'INSERT INTO reservations (trip_id, day_id, title, type, reservation_time) VALUES (?, ?, ?, ?, ?)'
    ).run(trip.id, day.id, 'HEL-NRT', 'flight', '2026-01-01T08:00').lastInsertRowid);

    const endpoint = testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng, local_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const departure = Number(endpoint.run(flight, 'from', 0, 'HEL', 60.31, 24.96, '2026-01-01').lastInsertRowid);
    // The arrival sits a day after departure; the legs must keep that distance,
    // otherwise a moved overnight flight lands before it took off.
    const arrival = Number(endpoint.run(flight, 'to', 1, 'NRT', 35.76, 140.38, '2026-01-02').lastInsertRowid);
    const undated = Number(endpoint.run(flight, 'to', 2, 'Unknown', 0, 0, null).lastInsertRowid);

    svc.restampReservationDates(trip.id, new Map([[day.id, '2026-01-01']]), new Map([[day.id, '2026-01-04']]));

    const legs = Object.fromEntries(
      (testDb.prepare('SELECT id, local_date FROM reservation_endpoints WHERE reservation_id = ?').all(flight) as { id: number; local_date: string | null }[])
        .map(l => [l.id, l.local_date])
    );
    expect(legs).toEqual({ [departure]: '2026-01-04', [arrival]: '2026-01-05', [undated]: null });
  });

  it('DAY-SVC-039 — follows end_day_id and keeps a date-only end time date-only', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const start = createDay(testDb, trip.id, { date: '2026-01-01' });
    const end = createDay(testDb, trip.id, { date: '2026-01-03' });

    const insert = testDb.prepare(
      'INSERT INTO reservations (trip_id, day_id, end_day_id, title, reservation_time, reservation_end_time) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const spanning = Number(insert.run(trip.id, start.id, end.id, 'Sleeper train', '2026-01-01T15:00', '2026-01-03').lastInsertRowid);
    const openEnded = Number(insert.run(trip.id, null, end.id, 'Open ended', null, null).lastInsertRowid);

    svc.restampReservationDates(
      trip.id,
      new Map([[start.id, '2026-01-01'], [end.id, '2026-01-03']]),
      new Map([[start.id, '2026-01-02'], [end.id, '2026-01-05']]),
    );

    const moved = testDb.prepare('SELECT reservation_time, reservation_end_time FROM reservations WHERE id = ?').get(spanning) as
      { reservation_time: string; reservation_end_time: string };
    expect(moved.reservation_time).toBe('2026-01-02T15:00');
    // A date-only end time must not grow a time suffix from the new date string.
    expect(moved.reservation_end_time).toBe('2026-01-05');
    expect(testDb.prepare('SELECT reservation_end_time FROM reservations WHERE id = ?').get(openEnded))
      .toMatchObject({ reservation_end_time: null });
  });
});

describe('resyncAccommodationDays', () => {
  /** The hotel reservation accommodations/ auto-creates next to a stay. */
  const linkHotel = (tripId: number, accId: number, dayId: number | null, time: string | null) =>
    Number(testDb.prepare(
      "INSERT INTO reservations (trip_id, day_id, title, type, accommodation_id, reservation_time) VALUES (?, ?, 'Hotel', 'hotel', ?, ?)"
    ).run(tripId, dayId, accId, time).lastInsertRowid);

  it('DAY-SVC-040 — returns before touching a hotel booking when the trip has no stays', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2026-05-01' });
    const res = linkHotel(trip.id, 4242, null, null);

    svc.resyncAccommodationDays(trip.id, new Map([[day.id, '2026-04-01']]));

    // No stay owns this booking any more, so the restamp must not adopt it.
    expect(testDb.prepare('SELECT day_id FROM reservations WHERE id = ?').get(res)).toMatchObject({ day_id: null });
  });

  it('DAY-SVC-041 — leaves a stay glued to its rows when the snapshot has no date for them', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const stay = createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id);
    const res = linkHotel(trip.id, stay.id, d2.id, '2026-04-30T14:00');

    svc.resyncAccommodationDays(trip.id, new Map());

    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(stay.id))
      .toMatchObject({ start_day_id: d1.id, end_day_id: d2.id });
    // The linked booking still gets pulled back onto the stay's start day: its
    // reservation_time is a stale snapshot of that day's date, check-in time kept.
    expect(testDb.prepare('SELECT day_id, reservation_time FROM reservations WHERE id = ?').get(res))
      .toMatchObject({ day_id: d1.id, reservation_time: '2026-05-01T14:00' });
  });

  it('DAY-SVC-042 — does not rewrite a stay whose days already hold their old dates', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const stay = createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id);
    const res = linkHotel(trip.id, stay.id, d1.id, null);

    svc.resyncAccommodationDays(trip.id, new Map([[d1.id, '2026-05-01'], [d2.id, '2026-05-02']]));

    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(stay.id))
      .toMatchObject({ start_day_id: d1.id, end_day_id: d2.id });
    // A booking with no time at all takes the bare date, not date + empty suffix.
    expect(testDb.prepare('SELECT reservation_time FROM reservations WHERE id = ?').get(res))
      .toMatchObject({ reservation_time: '2026-05-01' });
  });

  it('DAY-SVC-043 — refuses to re-anchor a stay onto an inverted day pair', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const stay = createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id);

    // The range change swapped the two dates across the rows, so the day now
    // holding the old start date sits AFTER the one holding the old end date.
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-05-02', d1.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-05-01', d2.id);

    svc.resyncAccommodationDays(trip.id, new Map([[d1.id, '2026-05-01'], [d2.id, '2026-05-02']]));

    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(stay.id))
      .toMatchObject({ start_day_id: d1.id, end_day_id: d2.id });
  });

  it('DAY-SVC-044 — leaves a stay alone when one of its old dates is outside the new range', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const d3 = createDay(testDb, trip.id, { date: '2026-05-03' });
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    // d2's old date (2026-04-29) dropped out of the range: the first stay finds
    // no day for its end, the second finds none for its start.
    const endGone = createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id);
    const startGone = createDayAccommodation(testDb, trip.id, place.id, d2.id, d3.id);

    svc.resyncAccommodationDays(
      trip.id,
      new Map([[d1.id, '2026-05-01'], [d2.id, '2026-04-29'], [d3.id, '2026-05-03']]),
    );

    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(endGone.id))
      .toMatchObject({ start_day_id: d1.id, end_day_id: d2.id });
    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(startGone.id))
      .toMatchObject({ start_day_id: d2.id, end_day_id: d3.id });
  });

  it('DAY-SVC-045 — skips the linked-booking restamp when the start day has no date', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hostel' });
    const stay = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id);
    const res = linkHotel(trip.id, stay.id, null, null);

    svc.resyncAccommodationDays(trip.id, new Map([[day.id, null]]));

    // On a dateless trip there is no date to stamp; writing one would invent a
    // calendar the trip does not have.
    expect(testDb.prepare('SELECT day_id, reservation_time FROM reservations WHERE id = ?').get(res))
      .toMatchObject({ day_id: null, reservation_time: null });
  });

  // The stop a booking wrote goes along when the stay is carried to another day row.
  const stopsOn = (dayId: number) =>
    testDb.prepare('SELECT place_id, order_index, accommodation_id FROM day_assignments WHERE day_id = ? ORDER BY order_index').all(dayId) as
      { place_id: number; order_index: number; accommodation_id: number | null }[];
  const addVia = (dayId: number, afterOrderIndex: number) =>
    Number(testDb.prepare('INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, ?, 0, 48.1, 11.5)')
      .run(dayId, afterOrderIndex).lastInsertRowid);
  const viasOn = (dayId: number) =>
    testDb.prepare('SELECT id, after_order_index FROM roadtrip_vias WHERE day_id = ? ORDER BY id').all(dayId) as
      { id: number; after_order_index: number }[];

  it('DAY-SVC-055: the carried stop is seated by its check-in on its new day, and both days keep their roads in place', () => {
    // The trip gained a day at the front: d1 now holds the day before, d2 the stay's
    // date. The night used to be appended behind d2's unpinned stops, the very order
    // a night booked today no longer gets, and neither day's roads were re-pinned.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const [hotel, a, b, c, d] = ['Rostock', 'Aral', 'Hafen', 'Museum', 'Markt'].map(name => createPlace(testDb, trip.id, { name }));
    const { accommodation } = accommodations.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: d1.id, end_day_id: d1.id, check_in: '10:00' }) as any;
    createDayAssignment(testDb, d1.id, a.id);
    createDayAssignment(testDb, d1.id, b.id);
    createDayAssignment(testDb, d2.id, c.id);
    createDayAssignment(testDb, d2.id, d.id);
    expect(stopsOn(d1.id).map(s => s.place_id)).toEqual([hotel.id, a.id, b.id]);
    const outOfHotel = addVia(d1.id, 0);
    const outOfA = addVia(d1.id, 1);
    const outOfC = addVia(d2.id, 0);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-04-30', d1.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-05-01', d2.id);

    svc.resyncAccommodationDays(trip.id, new Map([[d1.id, '2026-05-01'], [d2.id, '2026-05-02']]));

    expect(testDb.prepare('SELECT start_day_id FROM day_accommodations WHERE id = ?').get(accommodation.id)).toMatchObject({ start_day_id: d2.id });
    expect(stopsOn(d2.id)).toEqual([
      { place_id: hotel.id, order_index: 0, accommodation_id: accommodation.id },
      { place_id: c.id, order_index: 1, accommodation_id: null },
      { place_id: d.id, order_index: 2, accommodation_id: null },
    ]);
    expect(stopsOn(d1.id).map(s => [s.place_id, s.order_index])).toEqual([[a.id, 0], [b.id, 1]]);
    // The hotel's road on d1 had no stop ahead to fall back on and goes; A's follows A
    // to leg zero. On d2 the road out of C is one number further on, behind C.
    expect(viasOn(d1.id)).toEqual([{ id: outOfA, after_order_index: 0 }]);
    expect(viasOn(d1.id).map(v => v.id)).not.toContain(outOfHotel);
    expect(viasOn(d2.id)).toEqual([{ id: outOfC, after_order_index: 1 }]);
  });

  it('DAY-SVC-056: a day that already holds the place by hand keeps that stop, and the booking rides along with it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const hotel = createPlace(testDb, trip.id, { name: 'Rostock' });
    const { accommodation } = accommodations.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: d1.id, end_day_id: d1.id }) as any;
    const own = createDayAssignment(testDb, d2.id, hotel.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-04-30', d1.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-05-01', d2.id);

    svc.resyncAccommodationDays(trip.id, new Map([[d1.id, '2026-05-01'], [d2.id, '2026-05-02']]));

    expect(testDb.prepare('SELECT start_day_id FROM day_accommodations WHERE id = ?').get(accommodation.id)).toMatchObject({ start_day_id: d2.id });
    expect(stopsOn(d1.id)).toEqual([]);
    expect(stopsOn(d2.id)).toEqual([{ place_id: hotel.id, order_index: own.order_index, accommodation_id: null }]);
  });

  it('DAY-SVC-057: a stay whose end alone moves leaves its stop where it is', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const d3 = createDay(testDb, trip.id, { date: '2026-05-03' });
    const [hotel, a] = ['Rostock', 'Aral'].map(name => createPlace(testDb, trip.id, { name }));
    const { accommodation } = accommodations.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: d1.id, end_day_id: d2.id, check_in: '10:00' }) as any;
    createDayAssignment(testDb, d1.id, a.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-05-03', d2.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-05-02', d3.id);

    svc.resyncAccommodationDays(trip.id, new Map([[d1.id, '2026-05-01'], [d2.id, '2026-05-02'], [d3.id, '2026-05-03']]));

    expect(testDb.prepare('SELECT start_day_id, end_day_id FROM day_accommodations WHERE id = ?').get(accommodation.id))
      .toMatchObject({ start_day_id: d1.id, end_day_id: d3.id });
    expect(stopsOn(d1.id).map(s => [s.place_id, s.order_index])).toEqual([[hotel.id, 0], [a.id, 1]]);
  });
});

describe('reorder', () => {
  const orderedDays = (tripId: number) =>
    testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as
      { id: number; day_number: number; date: string | null }[];

  it('DAY-SVC-046 — rejects a same-length list that contains a foreign day id', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    createDay(testDb, trip.id);

    // Same length as the trip's day list, so only the membership check can catch
    // it — without it the renumber would leave one day orphaned at a negative
    // day_number and drop another out of the itinerary.
    expect(() => svc.reorder(trip.id, [d1.id, 999999])).toThrow(DayReorderError);
    expect(orderedDays(trip.id).map(d => d.day_number)).toEqual([1, 2]);
  });

  it('DAY-SVC-047 — renumbers a dateless trip without inventing dates or touching bookings', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const d3 = createDay(testDb, trip.id);
    const res = Number(testDb.prepare(
      'INSERT INTO reservations (trip_id, day_id, title, reservation_time) VALUES (?, ?, ?, ?)'
    ).run(trip.id, d2.id, 'Dinner', '2026-02-02T19:00').lastInsertRowid);

    const result = svc.reorder(trip.id, [d3.id, d1.id, d2.id]);

    expect(result.days.map(d => d.id)).toEqual([d3.id, d1.id, d2.id]);
    expect(orderedDays(trip.id).map(d => d.date)).toEqual([null, null, null]);
    // A trip without dates has no slots to re-pin, so the re-stamp pass is
    // skipped entirely — a booking keeps whatever time it was given by hand.
    expect(testDb.prepare('SELECT reservation_time FROM reservations WHERE id = ?').get(res))
      .toMatchObject({ reservation_time: '2026-02-02T19:00' });
  });

  it('DAY-SVC-048 — pins the known dates to the leading slots and nulls the slots beyond them', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const dated = createDay(testDb, trip.id, { date: '2026-03-01' });
    const dateless = createDay(testDb, trip.id);

    svc.reorder(trip.id, [dateless.id, dated.id]);

    // The slot beyond the known dates must resolve to null: better-sqlite3
    // refuses to bind the `undefined` a bare index lookup would hand it.
    expect(orderedDays(trip.id)).toEqual([
      { id: dateless.id, day_number: 1, date: '2026-03-01' },
      { id: dated.id, day_number: 2, date: null },
    ]);
  });

  it('DAY-SVC-049 — allows a move that keeps a stay ordered and rolls back one that inverts it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { date: '2026-03-01' });
    const d2 = createDay(testDb, trip.id, { date: '2026-03-02' });
    const d3 = createDay(testDb, trip.id, { date: '2026-03-03' });
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id);

    // Stretching the stay over a third slot is legal — the guard only rejects
    // an end that lands before its start.
    svc.reorder(trip.id, [d1.id, d3.id, d2.id]);
    expect(orderedDays(trip.id).map(d => d.id)).toEqual([d1.id, d3.id, d2.id]);

    expect(() => svc.reorder(trip.id, [d2.id, d3.id, d1.id])).toThrow(DayReorderError);
    // The guard runs inside the transaction, so the rejected move leaves the
    // day numbers AND the re-pinned dates exactly as the legal move left them.
    expect(orderedDays(trip.id)).toEqual([
      { id: d1.id, day_number: 1, date: '2026-03-01' },
      { id: d3.id, day_number: 2, date: '2026-03-02' },
      { id: d2.id, day_number: 3, date: '2026-03-03' },
    ]);
  });
});

describe('insert', () => {
  it('DAY-SVC-050 — appends at the end when no position is given and shifts nothing', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);

    const created = svc.insert(trip.id);

    expect(created).toMatchObject({ day_number: 3, date: null, assignments: [], notes_items: [] });
    const rows = testDb.prepare('SELECT id, day_number FROM days WHERE trip_id = ? ORDER BY day_number').all(trip.id) as
      { id: number; day_number: number }[];
    expect(rows).toEqual([
      { id: d1.id, day_number: 1 },
      { id: d2.id, day_number: 2 },
      { id: created.id, day_number: 3 },
    ]);
  });
});

// ── day shaping ───────────────────────────────────────────────────────────────

describe('setDefaultTransportMode', () => {
  it('DAY-SVC-051 — sets and clears the whole-day mode without disturbing notes or title', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { title: 'Arrival' });
    svc.update(day.id, day as never, { notes: 'Keep me' });

    const set = svc.setDefaultTransportMode(day.id, 'walk');
    expect(set).toMatchObject({ default_transport_mode: 'walk', title: 'Arrival', notes: 'Keep me' });

    // Its own endpoint exists precisely so clearing the mode cannot wipe the
    // day's text the way a general update would.
    const cleared = svc.setDefaultTransportMode(day.id, null);
    expect(cleared).toMatchObject({ default_transport_mode: null, title: 'Arrival', notes: 'Keep me' });
  });
});

describe('day shaping', () => {
  it('DAY-SVC-052 — getAssignmentsForDay reports a null category for an uncategorised place', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const placeId = Number(testDb.prepare('INSERT INTO places (trip_id, name, category_id) VALUES (?, ?, NULL)')
      .run(trip.id, 'Uncategorised').lastInsertRowid);
    createDayAssignment(testDb, day.id, placeId);

    // The LEFT JOIN yields category_name/color/icon as NULL, which must collapse
    // to a null category instead of an object of nulls the client would render.
    expect(svc.getAssignmentsForDay(day.id)[0].place.category).toBeNull();
  });

  it('DAY-SVC-053 — list groups assignments, tags, participants and notes onto their own day', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const busy = createDay(testDb, trip.id);
    const empty = createDay(testDb, trip.id);
    const tagged = createPlace(testDb, trip.id, { name: 'Louvre' });
    const plain = createPlace(testDb, trip.id, { name: 'Pont Neuf' });
    const shared = createDayAssignment(testDb, busy.id, tagged.id, { order_index: 0 });
    createDayAssignment(testDb, busy.id, plain.id, { order_index: 1 });
    const tag = createTag(testDb, user.id, { name: 'Museum' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(tagged.id, tag.id);
    testDb.prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)').run(shared.id, user.id);
    createDayNote(testDb, busy.id, trip.id, { text: 'Breakfast', sort_order: 1 });
    createDayNote(testDb, busy.id, trip.id, { text: 'Dinner', sort_order: 2 });

    const { days } = svc.list(trip.id);

    expect(days[0].assignments.map(a => a.place.name)).toEqual(['Louvre', 'Pont Neuf']);
    expect(days[0].assignments[0].place.tags.map(t => t.name)).toEqual(['Museum']);
    expect(days[0].assignments[0].participants.map(p => p.user_id)).toEqual([user.id]);
    // The batch loaders return nothing for the untagged place and the assignment
    // nobody joined; both have to fall back to [] rather than undefined.
    expect(days[0].assignments[1].place.tags).toEqual([]);
    expect(days[0].assignments[1].participants).toEqual([]);
    expect(days[0].notes_items.map(n => n.text)).toEqual(['Breakfast', 'Dinner']);
    // A day nobody planned anything on still ships both collections.
    expect(days[1]).toMatchObject({ id: empty.id, assignments: [], notes_items: [] });
  });

  it('DAY-SVC-054 — create keeps an explicit date and notes, update clears a title sent as null', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const day = svc.create(trip.id, '2026-09-14', 'Ferry to the island');
    expect(day).toMatchObject({ date: '2026-09-14', notes: 'Ferry to the island' });

    // The MCP update_day tool clears a title by sending null, which must reach
    // the column instead of being treated as "key absent, keep the old title".
    const titled = svc.update(day.id, day as never, { title: 'Crossing' });
    expect(svc.update(day.id, titled as never, { title: null })).toMatchObject({ title: null, notes: 'Ferry to the island' });
  });
});

/**
 * canEdit is MCP-only now: the HTTP path checks the same right through
 * TripAccessGuard's @RequirePermission('day_edit'), so nothing in a controller test
 * reaches this method any more. It stays because the *.mcp.ts tools never pass through
 * an HTTP guard, and it is tested directly here for the same reason.
 */
describe('DaysService.canEdit', () => {
  it('DAY-SVC-090 asks for day_edit and flags a non-owner as shared', () => {
    const checkPermission = vi.fn(() => true);
    const permissions = { checkPermission } as unknown as PermissionsService;
    const withStub = new DaysService(new DatabaseService(testDb), permissions, new RealtimeService(), new QueryHelpersService(new DatabaseService(testDb)));
    const trip = { id: 1, user_id: 1 } as never;

    expect(withStub.canEdit(trip, { id: 1, role: 'user' } as never)).toBe(true);
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 1, 1, false);

    withStub.canEdit(trip, { id: 2, role: 'user' } as never);
    // The shared flag is what the guard has to reproduce; getting it wrong would give a
    // member the owner's rights on somebody else's trip.
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 1, 2, true);

    checkPermission.mockReturnValue(false);
    expect(withStub.canEdit(trip, { id: 2, role: 'user' } as never)).toBe(false);
  });
});

/**
 * appendDated: "Add day with date" in the reorder dialog, create_day with `dated`
 * and the plugin RPC. The new day takes the calendar day after the last date of
 * the trip and goes right behind the last dated day; nothing already there moves date.
 */
describe('DaysService.appendDated', () => {
  type Row = { id: number; day_number: number; date: string | null };
  const rows = (tripId: number): Row[] =>
    testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as Row[];
  const endDate = (tripId: number) =>
    (testDb.prepare('SELECT end_date FROM trips WHERE id = ?').get(tripId) as { end_date: string | null }).end_date;
  const boundaries = (tripId: number) =>
    testDb.prepare('SELECT day_number, from_assignment_id FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number').all(tripId);

  it('DAY-SVC-091 appends the day after the end date, with its notes, and moves the end date to it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-10-10', end_date: '2026-10-12' });
    const before = rows(trip.id);

    const result = svc.appendDated(trip.id, user.id, 'Late checkout');

    expect(result.day).toMatchObject({ trip_id: trip.id, day_number: 4, date: '2026-10-13', notes: 'Late checkout', assignments: [], notes_items: [] });
    expect(result.endDate).toBe('2026-10-13');
    expect(result.boundaries).toBeNull();
    expect(result.trip).toMatchObject({ id: trip.id, end_date: '2026-10-13', day_count: 4, is_owner: 1, feed_token: null });
    expect(rows(trip.id)).toEqual([...before, { id: result.day.id, day_number: 4, date: '2026-10-13' }]);
    expect(endDate(trip.id)).toBe('2026-10-13');
  });

  it('DAY-SVC-092 puts the new day in front of the days without a date, which keep their content and stay undated', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-10-10', end_date: '2026-10-11' });
    const [d1, d2] = rows(trip.id);
    const spare = createDay(testDb, trip.id, { title: 'Buffer day' });
    const other = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const stop = createDayAssignment(testDb, spare.id, place.id);

    const { day } = svc.appendDated(trip.id, user.id);

    expect(rows(trip.id)).toEqual([
      d1, d2,
      { id: day.id, day_number: 3, date: '2026-10-12' },
      { id: spare.id, day_number: 4, date: null },
      { id: other.id, day_number: 5, date: null },
    ]);
    expect(testDb.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(stop.id)).toEqual({ day_id: spare.id });
    expect(svc.getDay(spare.id, trip.id)).toMatchObject({ title: 'Buffer day' });
  });

  it('DAY-SVC-093 anchors on a day dated past the end date, so no date is given twice', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-10-10', end_date: '2026-10-11' });
    const [, d2] = rows(trip.id);
    testDb.prepare('UPDATE days SET date = ? WHERE id = ?').run('2026-10-14', d2.id);

    const result = svc.appendDated(trip.id, user.id);

    expect(result.day.date).toBe('2026-10-15');
    expect(endDate(trip.id)).toBe('2026-10-15');
  });

  it('DAY-SVC-094 refuses a trip without dates and writes nothing', () => {
    const { user } = createUser(testDb);
    const dateless = createTrip(testDb, user.id);
    createDay(testDb, dateless.id);
    const halfDated = createTrip(testDb, user.id);
    testDb.prepare('UPDATE trips SET start_date = ? WHERE id = ?').run('2026-10-10', halfDated.id);

    for (const trip of [dateless, halfDated]) {
      const before = rows(trip.id);
      expect(() => svc.appendDated(trip.id, user.id)).toThrow(new DayAppendError(NO_DATES_MESSAGE));
      expect(rows(trip.id)).toEqual(before);
      expect(endDate(trip.id)).toBeNull();
    }
  });

  it('DAY-SVC-095 refuses a day past the day limit and writes nothing', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // A full-length range without its 999 rows: the limit reads the range, not the rows.
    testDb.prepare('UPDATE trips SET start_date = ?, end_date = ? WHERE id = ?').run('2026-01-01', addDays('2026-01-01', 998), trip.id);
    createDay(testDb, trip.id, { date: '2026-01-01' });
    const before = rows(trip.id);

    expect(() => svc.appendDated(trip.id, user.id)).toThrow(new DayAppendError('A trip can span at most 999 days'));
    expect(rows(trip.id)).toEqual(before);
    expect(endDate(trip.id)).toBe(addDays('2026-01-01', 998));
  });

  it('DAY-SVC-096 moves the road trip boundaries of the days behind it back by one, the last one first', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-10-10', end_date: '2026-10-11' });
    const [d1] = rows(trip.id);
    const spareA = createDay(testDb, trip.id);
    const spareB = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const stops = [d1, spareA, spareB].map(d => createDayAssignment(testDb, d.id, place.id));
    const boundary = testDb.prepare(
      'INSERT INTO roadtrip_day_boundaries (trip_id, day_number, from_assignment_id, to_assignment_id, fraction) VALUES (?, ?, ?, NULL, 1)',
    );
    boundary.run(trip.id, 1, stops[0].id);
    boundary.run(trip.id, 3, stops[1].id);
    boundary.run(trip.id, 4, stops[2].id);

    const result = svc.appendDated(trip.id, user.id);

    const moved = [
      { day_number: 1, from_assignment_id: stops[0].id },
      { day_number: 4, from_assignment_id: stops[1].id },
      { day_number: 5, from_assignment_id: stops[2].id },
    ];
    expect(boundaries(trip.id)).toEqual(moved);
    expect(result.boundaries?.map(b => ({ day_number: b.day_number, from_assignment_id: b.from_assignment_id }))).toEqual(moved);
  });

  it('DAY-SVC-097 moves no booking, while insert() still dates the days without one', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-10-10', end_date: '2026-10-11' });
    const [, d2] = rows(trip.id);
    const reservation = createReservation(testDb, trip.id, { day_id: d2.id });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2026-10-11T19:30', reservation.id);
    const spare = createDay(testDb, trip.id);

    svc.appendDated(trip.id, user.id);
    expect(testDb.prepare('SELECT day_id, reservation_time FROM reservations WHERE id = ?').get(reservation.id))
      .toEqual({ day_id: d2.id, reservation_time: '2026-10-11T19:30' });
    expect(rows(trip.id).find(r => r.id === spare.id)).toMatchObject({ day_number: 4, date: null });

    // The older path is untouched: an insert re-dates every row, the spare day included.
    const inserted = svc.insert(trip.id);
    expect(rows(trip.id).find(r => r.id === spare.id)).toMatchObject({ date: '2026-10-13' });
    expect(inserted).toMatchObject({ day_number: 5, date: '2026-10-14' });
  });

  it('DAY-SVC-099 announces the day to the others, moved boundaries to everyone and the trip to the others', () => {
    const all = vi.fn();
    const others = vi.fn();
    const day = { id: 7, trip_id: 1, day_number: 3, date: '2026-10-12', assignments: [], notes_items: [] } as never;
    const moved = [{ day_number: 4, from_assignment_id: 2, to_assignment_id: null, fraction: 1 }];

    svc.announceDatedAppend({ day, endDate: '2026-10-12', boundaries: moved, trip: { id: 1 } }, { all, others });
    expect(others.mock.calls).toEqual([
      ['day:reordered', { day }],
      ['trip:updated', { trip: { id: 1 } }],
    ]);
    expect(all.mock.calls).toEqual([['roadtripBoundary:changed', { boundaries: moved }]]);

    all.mockClear();
    others.mockClear();
    svc.announceDatedAppend({ day, endDate: '2026-10-12', boundaries: null, trip: undefined }, { all, others });
    expect(others.mock.calls).toEqual([['day:reordered', { day }]]);
    expect(all).not.toHaveBeenCalled();
  });
});
