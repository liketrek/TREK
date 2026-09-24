/**
 * Unit tests for the DI-native TripsService — TRIP-SVC-001 through TRIP-SVC-059
 * (001–038 moved 1:1 from the legacy tests/unit/services/tripService.test.ts;
 * the exportICS cases that duplicated the generateDays 010–012 numbering were
 * renumbered to 024–026 with the post-fold quirk-fix commit; 040–041 pinned
 * the deleted trips.bridge and died with it; 042–050 cover the folded
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

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createReservation, createPlace, createDay, createDayAssignment, createDayNote, addTripMember } from '../../helpers/factories';
import { MAX_TRIP_DAYS, resolveDayGridRange, tripSpanDays } from '@trek/shared';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { DaysService } from '../../../src/nest/days/days.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { ReservationsReadRepository } from '../../../src/nest/reservations/reservations-read.repository';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../../src/nest/trip-read-model/trip-read-model.service';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { accommodationsOver, makeAccommodationsService } from '../../helpers/accommodations-service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import fs from 'fs';
import path from 'path';
import { notificationsStub } from '../../helpers/notifications';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';

// Real sibling services over the same in-memory DB — updateTrip's date-shift
// resyncs and the summary/bundle aggregation run their actual SQL.
const dbs = () => new DatabaseService(testDb);
const budgetSvc = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());
const daysSvc = new DaysService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new QueryHelpersService(dbs()));
// Same collaborator set the container hands PlacesService (see places.service.test.ts).
// Only the read-model aggregation reaches into places here, but the photo cache,
// Unsplash and journey domain are real instances over the same in-memory DB
// rather than casts: the place hooks are fire-and-forget behind a catch, so a
// missing collaborator would look like a pass while swallowing a TypeError.
// One PlacePhotoCacheService for both PlacesService and MapsService, matching
// production, where the in-flight dedup only works on a shared instance.
const photoCache = new PlacePhotoCacheService(dbs(), makeStorageFixture('photos/google/').storage);
const coversFx = makeStorageFixture('covers/');
const placesSvc = new PlacesService(
  dbs(),
  new PermissionsService(dbs()),
  new RealtimeService(),
  new MapsService(dbs(), photoCache),
  new QueryHelpersService(dbs()),
  new UnsplashService(dbs(), new RuntimeEnvService(), coversFx.storage),
  photoCache,
  new JourneyDomainService(dbs(), new RealtimeService(), new TrekPhotosRepository(dbs())),
  makeStorageFixture('').storage,
  accommodationsOver(dbs()),
);
const accommodationsSvc = makeAccommodationsService(testDb);
const createAccommodation = accommodationsSvc.createAccommodation.bind(accommodationsSvc);

const svc = new TripsService(
  dbs(),
  new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService(), notificationsStub(), new ReservationsReadRepository(dbs()), accommodationsSvc),
  daysSvc,
  new PermissionsService(dbs()),
  budgetSvc,
  new VacayService(dbs(), new RealtimeService(), notificationsStub()),
  new RealtimeService(),
  undefined as never, // unsplash — not exercised here
  coversFx.storage,
  new SettingsService(dbs()),
);
const membersSvc = new TripMembersService(dbs(), budgetSvc, new UserCleanupService(dbs(), budgetSvc), new PermissionsService(dbs()), new RealtimeService(), notificationsStub());
const readModelSvc = new TripReadModelService(
  dbs(), membersSvc, daysSvc, accommodationsSvc, budgetSvc,
  new PackingService(dbs(), new PermissionsService(dbs()), new RealtimeService(), notificationsStub()),
  new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService(), notificationsStub(), new ReservationsReadRepository(dbs()), accommodationsSvc),
  new CollabService(dbs(), new PermissionsService(dbs()), new RealtimeService(), notificationsStub(), coversFx.storage, new RateLimitService()),
  placesSvc,
  new TodoService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new FilesService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new EphemeralTokenService(), coversFx.storage),
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

function addDaysIso(date: string, n: number) {
  return new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
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

  it('TRIP-SVC-062: a range longer than a year gets every one of its days (#2403)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-01-26', end_date: '2025-01-28' });
    // The reporter's range: 368 days, and the days used to stop at 365.
    svc.generateDays(trip.id, '2025-01-26', '2026-01-28');
    const days = getDays(trip.id);
    expect(days).toHaveLength(368);
    expect(days[364].date).toBe('2026-01-25');
    expect(days[367]).toMatchObject({ day_number: 368, date: '2026-01-28' });
  });

  it('TRIP-SVC-063: a dateless day_count is clamped to MAX_TRIP_DAYS', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    svc.generateDays(trip.id, null, null, MAX_TRIP_DAYS + 50);
    expect(getDays(trip.id)).toHaveLength(MAX_TRIP_DAYS);
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

  // ── generateDays carries out the shared planDayGrid plan ──────────────────
  // The trip dialog warns about lost days by the same plan, so the plan has to
  // be exactly what the rebuild did before it was written down in shared.

  function addUndatedDay(tripId: number) {
    const next = (testDb.prepare('SELECT COALESCE(MAX(day_number), 0) + 1 AS n FROM days WHERE trip_id = ?').get(tripId) as { n: number }).n;
    const id = Number(testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)').run(tripId, next).lastInsertRowid);
    return id;
  }

  function addStay(tripId: number, placeId: number, startDayId: number, endDayId: number) {
    return Number(testDb.prepare(
      'INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id) VALUES (?, ?, ?, ?)',
    ).run(tripId, placeId, startDayId, endDayId).lastInsertRowid);
  }

  const stayExists = (id: number) => !!testDb.prepare('SELECT 1 FROM day_accommodations WHERE id = ?').get(id);

  it('TRIP-SVC-070: a stay from a removed day to a spare day goes, and the spare day it left empty goes too', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' });
    const days = getDays(trip.id);
    const spare = addUndatedDay(trip.id);
    const place = createPlace(testDb, trip.id);
    const stay = addStay(trip.id, place.id, days[4].id, spare);

    const plan = svc.generateDays(trip.id, '2025-07-01', '2025-07-04');

    expect(plan.removed.map(r => [r.id, r.reason])).toEqual([[days[4].id, 'overflow'], [spare, 'spare']]);
    expect(stayExists(stay)).toBe(false);
    expect(getDays(trip.id).map(d => d.id)).toEqual(days.slice(0, 4).map(d => d.id));
  });

  it('TRIP-SVC-071: only moving the dates drops an empty spare day and keeps one with a note', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-03' });
    const empty = addUndatedDay(trip.id);
    const noted = addUndatedDay(trip.id);
    createDayNote(testDb, noted, trip.id, { text: 'Buffer' });

    const plan = svc.generateDays(trip.id, '2025-07-11', '2025-07-13');

    expect(plan.removed).toEqual([{ id: empty, day_number: 4, date: null, reason: 'spare' }]);
    const after = getDays(trip.id);
    expect(after.map(d => d.date)).toEqual(['2025-07-11', '2025-07-12', '2025-07-13', null]);
    expect(after[3]).toMatchObject({ id: noted, day_number: 4 });
    expect(getNotes(noted)).toHaveLength(1);
  });

  it('TRIP-SVC-072: without dates only empty days are trimmed, the highest numbers first', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const ids = Array.from({ length: 6 }, () => addUndatedDay(trip.id));
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, ids[1], place.id);
    createDayAssignment(testDb, ids[5], place.id);

    const plan = svc.generateDays(trip.id, null, null, 3);

    expect(plan.removed.map(r => r.id)).toEqual([ids[4], ids[3], ids[2]]);
    expect(getDays(trip.id).map(d => [d.id, d.day_number])).toEqual([[ids[0], 1], [ids[1], 2], [ids[5], 3]]);
  });

  it('TRIP-SVC-073: generateDays returns the plan it carried out', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-03' });
    const before = getDays(trip.id);
    const spare = addUndatedDay(trip.id);

    const plan = svc.generateDays(trip.id, '2025-07-01', '2025-07-06');

    const after = getDays(trip.id);
    expect(plan.removed).toEqual([]);
    expect(plan.rows.map(r => r.date)).toEqual(after.map(d => d.date));
    expect(plan.rows.slice(0, 4).map(r => r.id)).toEqual([...before.map(d => d.id), spare]);
    // New rows come back without an id and are the rows the insert created.
    expect(plan.rows.slice(4).map(r => r.id)).toEqual([null, null]);
    expect(after.slice(4).every(d => !before.some(b => b.id === d.id) && d.id !== spare)).toBe(true);

    const shrink = svc.generateDays(trip.id, '2025-07-01', '2025-07-02');
    expect(shrink.removed.map(r => r.id)).toEqual(after.slice(2).map(d => d.id));
    expect(getDays(trip.id).map(d => d.id)).toEqual(shrink.rows.map(r => r.id));
  });

  it('TRIP-SVC-074: fuzz, 300 random day grids end exactly where the rebuild before the shared plan left them', () => {
    // The rebuild as it stood before planDayGrid, kept here as the oracle.
    function legacyGenerateDays(tripId: number, startDate: string | null, endDate: string | null, dayCount?: number) {
      const existing = testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; day_number: number; date: string | null }[];
      const setDayNumber = testDb.prepare('UPDATE days SET day_number = ? WHERE id = ?');
      const renumber = (list: { id: number }[]) => {
        list.forEach((d, i) => setDayNumber.run(-(i + 1), d.id));
        list.forEach((d, i) => setDayNumber.run(i + 1, d.id));
      };
      if (!startDate || !endDate) {
        for (const d of existing.filter(d => d.date)) testDb.prepare('UPDATE days SET date = NULL WHERE id = ?').run(d.id);
        const all = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[];
        const target = Math.min(Math.max(dayCount ?? (all.length || 7), 1), MAX_TRIP_DAYS);
        const needed = target - all.length;
        if (needed > 0) {
          for (let i = 0; i < needed; i++) testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)').run(tripId, all.length + i + 1);
        } else if (needed < 0) {
          const candidates = testDb.prepare(
            `SELECT d.id FROM days d WHERE d.trip_id = ?
               AND NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = d.id)
               AND NOT EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = d.id)
               AND NOT EXISTS (SELECT 1 FROM day_accommodations dac WHERE dac.start_day_id = d.id OR dac.end_day_id = d.id)
             ORDER BY d.day_number DESC LIMIT ?`,
          ).all(tripId, -needed) as { id: number }[];
          for (const d of candidates) testDb.prepare('DELETE FROM days WHERE id = ?').run(d.id);
        }
        renumber(testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[]);
        return;
      }
      const numDays = tripSpanDays(startDate, endDate);
      const targetDates = Array.from({ length: Math.max(numDays, 0) }, (_, i) => addDaysIso(startDate, i));
      const dated = existing.filter(d => d.date).sort((a, b) => a.day_number - b.day_number);
      const dateless = existing.filter(d => !d.date).sort((a, b) => a.day_number - b.day_number);
      [...dated, ...dateless].forEach((d, i) => setDayNumber.run(-(i + 1), d.id));
      const assignDay = testDb.prepare('UPDATE days SET date = ?, day_number = ? WHERE id = ?');
      let datelessIdx = 0;
      targetDates.forEach((date, i) => {
        if (i < dated.length) assignDay.run(date, i + 1, dated[i].id);
        else if (datelessIdx < dateless.length) assignDay.run(date, i + 1, dateless[datelessIdx++].id);
        else testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)').run(tripId, i + 1, date);
      });
      for (let i = targetDates.length; i < dated.length; i++) testDb.prepare('DELETE FROM days WHERE id = ?').run(dated[i].id);
      const isEmpty = testDb.prepare(
        `SELECT NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = @id)
              AND NOT EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = @id)
              AND NOT EXISTS (SELECT 1 FROM day_accommodations dac WHERE dac.start_day_id = @id OR dac.end_day_id = @id) AS empty`,
      );
      const maxAssigned = Math.max(targetDates.length, dated.length);
      let kept = 0;
      for (let i = datelessIdx; i < dateless.length; i++) {
        if ((isEmpty.get({ id: dateless[i].id }) as { empty: number }).empty) testDb.prepare('DELETE FROM days WHERE id = ?').run(dateless[i].id);
        else setDayNumber.run(maxAssigned + ++kept, dateless[i].id);
      }
      renumber(testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[]);
    }

    // A seeded generator, so a failure names a grid that can be replayed.
    let seed = 20260923;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

    const snapshot = (tripId: number) => ({
      days: testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId),
      stays: testDb.prepare('SELECT id FROM day_accommodations WHERE trip_id = ? ORDER BY id').all(tripId),
      assignments: testDb.prepare(
        'SELECT da.id, da.day_id FROM day_assignments da JOIN days d ON d.id = da.day_id WHERE d.trip_id = ? ORDER BY da.id',
      ).all(tripId),
      notes: testDb.prepare('SELECT id, day_id FROM day_notes WHERE trip_id = ? ORDER BY id').all(tripId),
    });
    const ROLLBACK = new Error('rollback');

    const { user } = createUser(testDb);
    let removing = 0;
    for (let round = 0; round < 300; round++) {
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id);
      const dayIds: number[] = [];
      const count = int(0, 9);
      for (let n = 1; n <= count; n++) {
        const date = rand() < 0.7 ? addDaysIso('2026-03-20', int(0, 20)) : null;
        const id = Number(testDb.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)').run(trip.id, n, date).lastInsertRowid);
        dayIds.push(id);
        if (rand() < 0.3) createDayAssignment(testDb, id, place.id);
        if (rand() < 0.2) createDayNote(testDb, id, trip.id);
      }
      if (dayIds.length > 0) {
        for (let k = int(0, 3); k > 0; k--) addStay(trip.id, place.id, dayIds[int(0, dayIds.length - 1)], dayIds[int(0, dayIds.length - 1)]);
      }
      let range: [string | null, string | null, number | undefined];
      if (rand() < 0.25) {
        range = [null, null, rand() < 0.4 ? undefined : int(1, 12)];
      } else {
        const start = addDaysIso('2026-03-15', int(0, 20));
        range = [start, addDaysIso(start, int(0, 11)), rand() < 0.8 ? undefined : int(1, 12)];
      }

      const before = snapshot(trip.id);
      let expected: ReturnType<typeof snapshot> | undefined;
      try {
        testDb.transaction(() => {
          legacyGenerateDays(trip.id, ...range);
          expected = snapshot(trip.id);
          throw ROLLBACK;
        })();
      } catch (err) {
        if (err !== ROLLBACK) throw err;
      }
      expect(snapshot(trip.id), `round ${round}: the oracle must leave no trace`).toEqual(before);

      const plan = svc.generateDays(trip.id, ...range);
      const actual = snapshot(trip.id);
      expect(actual, `round ${round}: ${JSON.stringify({ range, before: before.days })}`).toEqual(expected);
      const survivors = new Set((actual.days as { id: number }[]).map(d => d.id));
      expect(plan.removed.map(r => r.id).sort((a, b) => a - b), `round ${round}: removed`)
        .toEqual((before.days as { id: number }[]).map(d => d.id).filter(id => !survivors.has(id)).sort((a, b) => a - b));
      if (plan.removed.length > 0) removing++;
    }
    // The grids are random, not easy: plenty of them lose days.
    expect(removing).toBeGreaterThan(60);
  });

  it('TRIP-SVC-075: resolveRange reads a range the way the shared resolveDayGridRange does, a day_count of 0 included', () => {
    const { user } = createUser(testDb);
    const dated = svc.getRaw(createTrip(testDb, user.id, { start_date: '2025-07-01', end_date: '2025-07-05' }).id)!;
    const undated = svc.getRaw(createTrip(testDb, user.id).id)!;
    const resolve = (trip: typeof dated, data: Parameters<typeof svc.updateTrip>[2]) => svc['resolveRange'](trip, data);
    const cases: [typeof dated, Parameters<typeof svc.updateTrip>[2]][] = [
      [dated, {}],
      [dated, { title: 'Renamed' }],
      [dated, { end_date: '2025-07-03' }],
      [dated, { start_date: '2025-07-03', end_date: '2025-07-05' }],
      [dated, { start_date: null, end_date: null }],
      [dated, { start_date: null, end_date: null, day_count: 3 }],
      [undated, { day_count: 0 }],
      [undated, { day_count: 4 }],
      [undated, { day_count: MAX_TRIP_DAYS + 1 }],
      [undated, { start_date: '2025-07-01', end_date: '2025-07-02' }],
    ];
    for (const [trip, data] of cases) expect(resolve(trip, data), JSON.stringify(data)).toEqual(resolveDayGridRange(trip, data));
    expect(resolve(undated, { day_count: 0 }).regenerate).toBe(false);
    // The refusals stay on the server side of the rule.
    expect(() => resolve(dated, { start_date: '2025-07-05', end_date: '2025-07-01' })).toThrow('End date must be after start date');
    expect(() => resolve(dated, { end_date: '2025-06-30' })).toThrow('End date must be after start date');
  });
});

// ── deleteOldCover — path containment ──────────────────────────────────────────

describe('deleteOldCover', () => {
  it('TRIP-SVC-COVER-001: never deletes outside the covers category for a crafted cover_image', async () => {
    // Attacker-controlled values aimed at auth-gated sibling upload dirs — the
    // basename + category addressing keeps every delete inside covers/.
    const filesDir = path.join(coversFx.root, 'files');
    const avatarsDir = path.join(coversFx.root, 'avatars');
    fs.mkdirSync(filesDir, { recursive: true });
    fs.mkdirSync(avatarsDir, { recursive: true });
    const secret = path.join(filesDir, 'secret.pdf');
    const someone = path.join(avatarsDir, 'someone.png');
    fs.writeFileSync(secret, 'pdf');
    fs.writeFileSync(someone, 'png');

    await svc.deleteOldCover('/uploads/files/secret.pdf');
    await svc.deleteOldCover('/uploads/covers/../files/secret.pdf');
    await svc.deleteOldCover('/uploads/avatars/someone.png');

    expect(fs.existsSync(secret)).toBe(true);
    expect(fs.existsSync(someone)).toBe(true);
  });

  it('TRIP-SVC-COVER-002: deletes a legitimate cover file', async () => {
    const coversDir = path.join(coversFx.root, 'covers');
    fs.mkdirSync(coversDir, { recursive: true });
    const cover = path.join(coversDir, 'abc123.jpg');
    fs.writeFileSync(cover, 'jpeg');

    await svc.deleteOldCover('/uploads/covers/abc123.jpg');
    expect(fs.existsSync(cover)).toBe(false);
  });

  it('TRIP-SVC-COVER-003: an external https cover URL is tolerated (no throw)', async () => {
    await expect(svc.deleteOldCover('https://example.com/some/pic.jpg')).resolves.toBeUndefined();
    await expect(svc.deleteOldCover(null)).resolves.toBeUndefined();
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
    const { accommodation: acc } = createAccommodation(tripId, {
      place_id: place.id, start_day_id: startDayId, end_day_id: endDayId,
    }) as { accommodation: { id: number } };
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

  it('TRIP-SVC-059: the day stop a booking wrote follows it when the trip is re-dated', () => {
    // Booking a night also puts its place on the check-in day. Re-dating the trip moves
    // the stay to whichever day row now carries its date, and the stop has to go with
    // it, or the route runs through a day the traveller is no longer staying on.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-10', end_date: '2025-06-14' });
    const { accId } = insertAccommodation(trip.id, dayFor(trip.id, '2025-06-11'), dayFor(trip.id, '2025-06-13'));
    const stopOf = () => testDb.prepare('SELECT day_id FROM day_assignments WHERE accommodation_id = ?').get(accId) as { day_id: number };
    expect(stopOf().day_id).toBe(dayFor(trip.id, '2025-06-11'));

    svc.updateTrip(trip.id, user.id, { start_date: '2025-06-09', end_date: '2025-06-14' }, 'user');

    expect(stopOf().day_id).toBe(getAcc(accId).start_day_id);
    expect(stopOf().day_id).toBe(dayFor(trip.id, '2025-06-11'));
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

  it('TRIP-SVC-069: create without a currency takes the display currency, admin default included, else EUR', () => {
    const { user } = createUser(testDb);
    const setUser = (value: string) =>
      testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'default_currency', ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value")
        .run(user.id, JSON.stringify(value));
    const setAdmin = (value: string) =>
      testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('default_user_setting_default_currency', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .run(JSON.stringify(value));
    const currencyOf = (data: Parameters<typeof svc.create>[1]) => (svc.create(user.id, data).trip as any).currency;

    expect(currencyOf({ title: 'Nothing set' })).toBe('EUR');
    // "Trip currency" in the settings stores an empty string, which counts as unset.
    setUser('');
    expect(currencyOf({ title: 'Cleared, no admin default' })).toBe('EUR');
    setUser('   ');
    expect(currencyOf({ title: 'Blank, no admin default' })).toBe('EUR');
    setUser('');
    setAdmin('CHF');
    expect(currencyOf({ title: 'Admin default' })).toBe('CHF');
    setUser('USD');
    expect(currencyOf({ title: 'Own display currency' })).toBe('USD');
    setUser('');
    expect(currencyOf({ title: 'Back on the admin default' })).toBe('CHF');
    // An explicit currency always wins.
    setUser('USD');
    expect(currencyOf({ title: 'Explicit', currency: 'JPY' })).toBe('JPY');
  });

  it('TRIP-SVC-064: create refuses a range past MAX_TRIP_DAYS and writes nothing', () => {
    const { user } = createUser(testDb);
    const before = (testDb.prepare('SELECT COUNT(*) AS n FROM trips').get() as { n: number }).n;
    expect(() => svc.create(user.id, { title: 'Decade', start_date: '2026-01-01', end_date: '2036-01-01' }))
      .toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
    expect((testDb.prepare('SELECT COUNT(*) AS n FROM trips').get() as { n: number }).n).toBe(before);
    // The longest allowed range goes through in full.
    const { tripId } = svc.create(user.id, { title: 'Longest', start_date: '2026-01-01', end_date: addDaysIso('2026-01-01', MAX_TRIP_DAYS - 1) });
    expect(getDays(tripId)).toHaveLength(MAX_TRIP_DAYS);
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

  it('TRIP-SVC-061: copy carries the road-trip shaping, not just the places', () => {
    // A via is the road the traveller chose over the one the router prefers, and
    // a day track is the line a day was fitted to. Leaving them behind gave back
    // a trip that looks complete and quietly drives somewhere else — noticed
    // only once somebody edits the copy, with nothing left to recover from.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Norway', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = getDays(trip.id);
    const stop = createPlace(testDb, trip.id, { name: 'Geiranger' });
    const track = createPlace(testDb, trip.id, { name: 'Scenic route' });
    testDb.prepare("UPDATE places SET stop_type = 'fuel' WHERE id = ?").run(stop.id);
    testDb.prepare("UPDATE places SET route_geometry = '[[1,2],[3,4]]' WHERE id = ?").run(track.id);
    createDayAssignment(testDb, days[0].id, stop.id);
    testDb.prepare(
      'INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, 0, 0, 62.1, 7.2), (?, 0, 1, 62.2, 7.3)',
    ).run(days[0].id, days[0].id);
    testDb.prepare('INSERT INTO roadtrip_day_tracks (day_id, place_id, stray_km) VALUES (?, ?, 1.5)')
      .run(days[0].id, track.id);

    const newTripId = svc.copy(trip.id, user.id, 'Clone');
    const newDays = getDays(newTripId);

    // The kind of stop each place is survives the copy.
    const copiedStop = testDb.prepare("SELECT stop_type FROM places WHERE trip_id = ? AND name = 'Geiranger'")
      .get(newTripId) as { stop_type: string | null };
    expect(copiedStop.stop_type).toBe('fuel');

    const vias = testDb.prepare('SELECT after_order_index, sequence, lat, lng FROM roadtrip_vias WHERE day_id = ? ORDER BY sequence')
      .all(newDays[0].id) as { after_order_index: number; sequence: number; lat: number; lng: number }[];
    expect(vias).toEqual([
      { after_order_index: 0, sequence: 0, lat: 62.1, lng: 7.2 },
      { after_order_index: 0, sequence: 1, lat: 62.2, lng: 7.3 },
    ]);

    // The track points at the COPY's place, never back at the original.
    const copiedTrack = testDb.prepare('SELECT place_id, stray_km FROM roadtrip_day_tracks WHERE day_id = ?')
      .get(newDays[0].id) as { place_id: number; stray_km: number };
    const copiedTrackPlace = testDb.prepare("SELECT id FROM places WHERE trip_id = ? AND name = 'Scenic route'")
      .get(newTripId) as { id: number };
    expect(copiedTrack.place_id).toBe(copiedTrackPlace.id);
    expect(copiedTrack.stray_km).toBe(1.5);

    // And the original keeps exactly what it had.
    expect(testDb.prepare('SELECT COUNT(*) c FROM roadtrip_vias WHERE day_id = ?').get(days[0].id)).toEqual({ c: 2 });
  });

  it('TRIP-SVC-060: copying a trip keeps a staged booking staged', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Origin', start_date: '2025-06-01', end_date: '2025-06-02' });
    testDb.prepare(`INSERT INTO reservations (trip_id, title, type, status, ingest_state)
      VALUES (?, 'Parked', 'flight', 'confirmed', 'staged')`).run(trip.id);
    testDb.prepare(`INSERT INTO reservations (trip_id, title, type, status)
      VALUES (?, 'Booked', 'flight', 'confirmed')`).run(trip.id);

    const newTripId = svc.copy(trip.id, user.id, 'Clone');

    // Without ingest_state on the duplicate INSERT the staged row falls back to
    // the column default and shows up in the copy's public feed.
    const rows = testDb.prepare('SELECT title, ingest_state FROM reservations WHERE trip_id = ? ORDER BY title')
      .all(newTripId) as any[];
    expect(rows).toEqual([
      { title: 'Booked', ingest_state: 'live' },
      { title: 'Parked', ingest_state: 'staged' },
    ]);
  });

  /**
   * Copying a trip used to take every packing row and re-insert it without
   * is_private/owner_id, so both fell back to the column defaults and another
   * member's Personal or Shared item reappeared in the copy as a Common item
   * that everyone on the new trip could read (GHSA-vh2h-288v-ggch).
   */
  it("TRIP-SVC-046b: copy leaves other members' restricted packing items behind", () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Origin', start_date: '2025-06-01', end_date: '2025-06-02' });
    const ins = testDb.prepare('INSERT INTO packing_items (trip_id, name, checked, is_private, owner_id) VALUES (?, ?, 0, ?, ?)');
    ins.run(trip.id, 'Shared tent', 0, null);            // Common
    ins.run(trip.id, "Owner's diary", 1, owner.id);      // the owner's Personal
    ins.run(trip.id, "Member's meds", 1, member.id);     // the copier's own Personal

    const newTripId = svc.copy(trip.id, member.id, 'Copy');
    const rows = testDb.prepare('SELECT name, is_private, owner_id FROM packing_items WHERE trip_id = ? ORDER BY name').all(newTripId) as any[];

    // The owner's private row is gone, not relabelled as Common.
    expect(rows.map(r => r.name)).toEqual(["Member's meds", 'Shared tent']);
    expect(rows.find(r => r.name === 'Shared tent')).toMatchObject({ is_private: 0, owner_id: null });
    // The copier's own item stays restricted and belongs to them in the copy.
    expect(rows.find(r => r.name === "Member's meds")).toMatchObject({ is_private: 1, owner_id: member.id });
  });

  it('TRIP-SVC-059: copy remaps cross-links and carries splits/participants (smoke-test I-01)', () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Linked', start_date: '2025-06-01', end_date: '2025-06-02' });
    const days = getDays(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Le Test' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    testDb.prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)').run(assignment.id, owner.id);

    const accomId = Number(testDb.prepare(`
      INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_out)
      VALUES (?, ?, ?, ?, '15:00', '11:00')
    `).run(trip.id, place.id, days[0].id, days[1].id).lastInsertRowid);

    const resId = Number(testDb.prepare(`
      INSERT INTO reservations (trip_id, day_id, assignment_id, accommodation_id, title, type, url)
      VALUES (?, ?, ?, ?, 'Hotel booking', 'hotel', 'https://example.test/booking')
    `).run(trip.id, days[0].id, assignment.id, accomId).lastInsertRowid);

    const itemId = Number(testDb.prepare(`
      INSERT INTO budget_items (trip_id, category, name, total_price, persons, reservation_id, currency, exchange_rate, expense_date)
      VALUES (?, 'Accommodation', 'Hotel', 240, 2, ?, 'JPY', 0.0062, '2025-06-01')
    `).run(trip.id, resId).lastInsertRowid);
    testDb.prepare('INSERT INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 1, 120)').run(itemId, owner.id);
    testDb.prepare('INSERT INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 0, 120)').run(itemId, friend.id);
    testDb.prepare('INSERT INTO budget_item_payers (budget_item_id, user_id, amount) VALUES (?, ?, 240)').run(itemId, owner.id);
    testDb.prepare("INSERT INTO todo_items (trip_id, name, checked) VALUES (?, 'Book transfer', 1)").run(trip.id);

    const newTripId = svc.copy(trip.id, owner.id, 'Linked copy');

    // Budget → reservation link points at the copied reservation, not null / not the old id.
    const newItem = testDb.prepare('SELECT * FROM budget_items WHERE trip_id = ?').get(newTripId) as any;
    const newRes = testDb.prepare('SELECT * FROM reservations WHERE trip_id = ?').get(newTripId) as any;
    expect(newRes.id).not.toBe(resId);
    expect(newItem.reservation_id).toBe(newRes.id);
    expect(newItem).toMatchObject({ currency: 'JPY', exchange_rate: 0.0062, expense_date: '2025-06-01' });

    // Reservation → accommodation resolves to the copied accommodation (accommodation_id is TEXT).
    const newAccom = testDb.prepare('SELECT * FROM day_accommodations WHERE trip_id = ?').get(newTripId) as any;
    expect(newAccom.id).not.toBe(accomId);
    expect(Number(newRes.accommodation_id)).toBe(newAccom.id);
    expect(newRes.url).toBe('https://example.test/booking');

    // Splits carried over with per-member paid flags and amounts.
    const members = testDb.prepare('SELECT user_id, paid, amount FROM budget_item_members WHERE budget_item_id = ? ORDER BY user_id').all(newItem.id) as any[];
    expect(members).toEqual([
      { user_id: owner.id, paid: 1, amount: 120 },
      { user_id: friend.id, paid: 0, amount: 120 },
    ]);
    const payers = testDb.prepare('SELECT user_id, amount FROM budget_item_payers WHERE budget_item_id = ?').all(newItem.id) as any[];
    expect(payers).toEqual([{ user_id: owner.id, amount: 240 }]);

    // Assignment participants copied onto the remapped assignment.
    const newAssignment = getAssignments(getDays(newTripId)[0].id)[0];
    const participants = testDb.prepare('SELECT user_id FROM assignment_participants WHERE assignment_id = ?').all(newAssignment.id) as any[];
    expect(participants).toEqual([{ user_id: owner.id }]);

    // To-dos come across but reset to unchecked (documented behaviour).
    const todos = testDb.prepare('SELECT name, checked FROM todo_items WHERE trip_id = ?').all(newTripId) as any[];
    expect(todos).toEqual([{ name: 'Book transfer', checked: 0 }]);
  });
});

// ── Wrapper helpers (delegating members of the aggregate root) ────────────────

describe('TripsService wrapper helpers', () => {
  it('re-anchors the budget before the trip row leaves its old currency (#1543)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const order: string[] = [];
    const rebaseSpy = vi.spyOn(budgetSvc, 'rebaseTripCurrency').mockImplementation(async () => { order.push('rebase'); });
    const updateSpy = vi.spyOn(svc, 'updateTrip').mockImplementation(() => { order.push('update'); return {} as never; });
    try {
      await svc.update(trip.id, user.id, { currency: 'RUB' } as never, 'user');
      // The rebase reads the outgoing currency off the trip row, so it has to run first.
      expect(rebaseSpy).toHaveBeenCalledWith(trip.id, 'RUB');
      expect(order).toEqual(['rebase', 'update']);
    } finally {
      rebaseSpy.mockRestore();
      updateSpy.mockRestore();
    }
  });

  it('TRIP-SVC-068: update refuses a bad range before the budget is rebased (#2403)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-07' });
    const rebaseSpy = vi.spyOn(budgetSvc, 'rebaseTripCurrency').mockResolvedValue();
    try {
      await expect(svc.update(trip.id, user.id, { currency: 'USD', end_date: '2036-07-01' }, 'user'))
        .rejects.toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
      await expect(svc.update(trip.id, user.id, { currency: 'USD', start_date: '2026-07-10' }, 'user'))
        .rejects.toThrow('End date must be after start date');
      expect(rebaseSpy).not.toHaveBeenCalled();
      await expect(svc.update(99999, user.id, { currency: 'USD' }, 'user')).rejects.toThrow('Trip not found');
    } finally {
      rebaseSpy.mockRestore();
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

  it('TRIP-SVC-065: updateTrip refuses a range past MAX_TRIP_DAYS before touching the row', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Week', start_date: '2026-07-01', end_date: '2026-07-07' });
    expect(() => svc.updateTrip(trip.id, user.id, { title: 'Decade', end_date: '2036-07-01' }, 'user'))
      .toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
    expect(testDb.prepare('SELECT title, end_date FROM trips WHERE id = ?').get(trip.id)).toEqual({ title: 'Week', end_date: '2026-07-07' });
    expect(getDays(trip.id)).toHaveLength(7);
    // Moving only the start keeps the stored end and is measured against it.
    expect(() => svc.updateTrip(trip.id, user.id, { start_date: '2020-01-01' }, 'user'))
      .toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
  });

  it('TRIP-SVC-066: a trip whose stored range already exceeds the limit can still be renamed', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Legacy' });
    testDb.prepare("UPDATE trips SET start_date = '2020-01-01', end_date = '2030-01-01' WHERE id = ?").run(trip.id);
    const result = svc.updateTrip(trip.id, user.id, { title: 'Renamed' }, 'user');
    expect(result.newTitle).toBe('Renamed');
    expect(result.changes).toEqual({ title: 'Renamed' });
    // A day_count would rebuild the grid over the whole stored range, so it is held to the limit too.
    expect(() => svc.updateTrip(trip.id, user.id, { day_count: 5 }, 'user'))
      .toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
    expect(getDays(trip.id)).toHaveLength(0);
  });

  it('TRIP-SVC-067: a start date moved past the stored end is refused instead of emptying the trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Week', start_date: '2026-07-01', end_date: '2026-07-07' });
    expect(() => svc.updateTrip(trip.id, user.id, { start_date: '2026-07-10' }, 'user'))
      .toThrow('End date must be after start date');
    expect(testDb.prepare('SELECT start_date FROM trips WHERE id = ?').get(trip.id)).toEqual({ start_date: '2026-07-01' });
    expect(getDays(trip.id)).toHaveLength(7);
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
    // The legacy copyTripById nulled this link (TEXT column vs number-keyed map);
    // fixed with smoke-test I-01 — the copy now coerces and remaps it.
    expect(newRes.day_id).toBe(newDays[0].id);
    expect(newRes.end_day_id).toBe(newDays[1].id);
    expect(newRes.place_id).toBe(newPlace.id);
    expect(Number(newRes.accommodation_id)).toBe(newAccom.id);
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
      new ReservationsService(dbs(), new PermissionsService(dbs()), budgetSvc, new RealtimeService(), notificationsStub(), new ReservationsReadRepository(dbs()), accommodationsSvc),
      daysSvc,
      new PermissionsService(dbs()),
      budgetSvc,
      new VacayService(dbs(), new RealtimeService(), notificationsStub()),
      new RealtimeService(),
      undefined as never,
      coversFx.storage,
      new SettingsService(dbs()),
    );
  }

  /** Same frozen connection, for the guest deletion that now lives on the roster. */
  function failingMembers(match: string) {
    return new TripMembersService(
      failingConnection(match), budgetSvc, new UserCleanupService(dbs(), budgetSvc),
      new PermissionsService(dbs()), new RealtimeService(),
      notificationsStub(),
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
