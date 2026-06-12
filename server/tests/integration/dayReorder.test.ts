/**
 * Day reorder + insert integration tests (#589) — exercises the real
 * dayService against the real schema. Covers: position renumber, dates pinned
 * to slots while content rides along by id, booking-date re-stamp, permutation
 * validation, the accommodation-inversion guard, and insert (dated + dateless).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: vi.fn() } };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  DEFAULT_LANGUAGE: 'en',
}));

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb } from '../helpers/test-db';
import { createUser, createTrip, createPlace, createDay, createDayAssignment, createReservation, createDayAccommodation } from '../helpers/factories';
import { reorderDays, insertDay, DayReorderError } from '../../src/services/dayService';

let userId: number;

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  userId = createUser(testDb).user.id;
});

afterAll(() => testDb.close());

const orderedDays = (tripId: number) =>
  testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as
    { id: number; day_number: number; date: string | null }[];

describe('reorderDays', () => {
  it('permutes positions, pins dates to slots, and content rides along by id', () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = orderedDays(trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, d2.id, place.id); // place sits on day 2

    // Move day 2 to the front: [d2, d1, d3]
    reorderDays(trip.id, [d2.id, d1.id, d3.id]);

    const after = orderedDays(trip.id);
    expect(after.map(d => d.id)).toEqual([d2.id, d1.id, d3.id]);
    // Dates stay pinned to their calendar slots
    expect(after.map(d => d.date)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
    // The place rides along with its day row (still attached to d2.id, now at slot 1)
    const onD2 = testDb.prepare('SELECT * FROM day_assignments WHERE day_id = ?').all(d2.id);
    expect(onD2).toHaveLength(1);
  });

  it('re-stamps a booking\'s date onto its day\'s new date, keeping the time', () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = orderedDays(trip.id);
    const res = createReservation(testDb, trip.id, { day_id: d2.id, type: 'restaurant' });
    testDb.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?').run('2026-03-02T19:00', res.id);

    reorderDays(trip.id, [d2.id, d1.id, d3.id]); // d2 moves to the 2026-03-01 slot

    const r = testDb.prepare('SELECT reservation_time FROM reservations WHERE id = ?').get(res.id) as { reservation_time: string };
    expect(r.reservation_time).toBe('2026-03-01T19:00');
  });

  it('rejects an orderedIds list that is not a permutation of the trip days', () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2] = orderedDays(trip.id);
    expect(() => reorderDays(trip.id, [d1.id, d2.id])).toThrow(DayReorderError);
  });

  it('blocks a move that would make an accommodation end before it starts, and rolls back', () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = orderedDays(trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAccommodation(testDb, trip.id, place.id, d1.id, d2.id); // stay spans day 1 -> day 2

    // Put the start day (d1) after the end day (d2): [d2, d3, d1]
    expect(() => reorderDays(trip.id, [d2.id, d3.id, d1.id])).toThrow(DayReorderError);

    // Transaction rolled back: original order intact
    expect(orderedDays(trip.id).map(d => d.id)).toEqual([d1.id, d2.id, d3.id]);
  });
});

describe('insertDay', () => {
  it('inserts an empty day at a position on a dateless trip and shifts the rest', () => {
    const trip = createTrip(testDb, userId);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const d3 = createDay(testDb, trip.id);

    const created = insertDay(trip.id, 1);

    const after = orderedDays(trip.id);
    expect(after).toHaveLength(4);
    expect(after[0].id).toBe(created.id);
    expect(after[0].date).toBeNull();
    expect(after.slice(1).map(d => d.id)).toEqual([d1.id, d2.id, d3.id]);
  });

  it('inserts at the front of a dated trip: dates stay contiguous and the trip extends', () => {
    const trip = createTrip(testDb, userId, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [d1, d2, d3] = orderedDays(trip.id);

    const created = insertDay(trip.id, 1);

    const after = orderedDays(trip.id);
    expect(after).toHaveLength(4);
    expect(after[0].id).toBe(created.id);
    expect(after.map(d => d.date)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04']);
    // Old content shifted down a slot
    expect(after.slice(1).map(d => d.id)).toEqual([d1.id, d2.id, d3.id]);
    // Trip range extended by one day
    const t = testDb.prepare('SELECT end_date FROM trips WHERE id = ?').get(trip.id) as { end_date: string };
    expect(t.end_date).toBe('2026-03-04');
  });
});
