/**
 * Boot migration: days a trip lost past the old 365-day limit (#2403).
 *
 * generateDays used to clip the day rows while the trip kept its full end
 * date. The migration appends the missing dated days to a trip whose dated
 * rows are still the unbroken run from its start date, keeps content-bearing
 * dateless days behind them, and leaves every other trip alone.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';

import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';

/** Positions of the two #2403 steps in the migration array (the number the boot log prints). */
const BACKFILL_VERSION = 240;
const REBUILD_VERSION = 241;

function dayAfter(start: string, n: number) {
  return new Date(Date.parse(start + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
}

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  runMigrations(db);
  db.prepare("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')").run();
  return db;
}

/** A trip the old code produced: `dated` day rows from start_date, whatever the end date says. */
function seedClippedTrip(db: Database.Database, id: number, start: string, end: string, dated: number) {
  db.prepare('INSERT INTO trips (id, user_id, title, start_date, end_date) VALUES (?, 1, ?, ?, ?)').run(
    id,
    `T${id}`,
    start,
    end,
  );
  const insert = db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)');
  for (let i = 0; i < dated; i++) insert.run(id, i + 1, dayAfter(start, i));
}

function days(db: Database.Database, tripId: number) {
  return db.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as {
    id: number;
    day_number: number;
    date: string | null;
  }[];
}

/** Rewind schema_version so the given step (and everything after it) replays. */
function replayFrom(db: Database.Database, version: number) {
  db.prepare('UPDATE schema_version SET version = ?').run(version - 1);
  runMigrations(db);
}

describe('trip days backfill migration (#2403)', () => {
  it('MIGRATE-DAYS-001: appends the days a clipped trip is missing, in order and dated', () => {
    const db = freshDb();
    try {
      seedClippedTrip(db, 1, '2025-01-26', '2026-01-28', 365);
      const before = days(db, 1);
      replayFrom(db, BACKFILL_VERSION);

      const after = days(db, 1);
      expect(after).toHaveLength(368);
      // The rows that were there keep their ids and numbers.
      expect(after.slice(0, 365).map((d) => d.id)).toEqual(before.map((d) => d.id));
      expect(after.map((d) => d.day_number)).toEqual(after.map((_, i) => i + 1));
      expect(after.slice(365).map((d) => d.date)).toEqual(['2026-01-26', '2026-01-27', '2026-01-28']);
    } finally {
      db.close();
    }
  });

  it('MIGRATE-DAYS-002: content-bearing dateless days stay behind the dated ones', () => {
    const db = freshDb();
    try {
      seedClippedTrip(db, 1, '2025-01-26', '2026-01-28', 365);
      const spare = Number(
        db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (1, 366, NULL)').run().lastInsertRowid,
      );
      db.prepare("INSERT INTO day_notes (day_id, trip_id, text) VALUES (?, 1, 'keep me')").run(spare);
      replayFrom(db, BACKFILL_VERSION);

      const after = days(db, 1);
      expect(after).toHaveLength(369);
      expect(after[367]).toMatchObject({ day_number: 368, date: '2026-01-28' });
      expect(after[368]).toMatchObject({ id: spare, day_number: 369, date: null });
    } finally {
      db.close();
    }
  });

  it('MIGRATE-DAYS-003: leaves trips alone that were never clipped, were re-dated by hand, or exceed the new limit', () => {
    const db = freshDb();
    try {
      // Complete already.
      seedClippedTrip(db, 1, '2026-07-01', '2026-07-07', 7);
      // Longer than a year but its days no longer start on start_date.
      seedClippedTrip(db, 2, '2025-01-26', '2026-01-28', 365);
      db.prepare("UPDATE days SET date = '2024-12-31' WHERE trip_id = 2 AND day_number = 1").run();
      // Past the new limit: still refused, so still not extended.
      seedClippedTrip(db, 3, '2020-01-01', '2030-01-01', 365);
      // Dateless trip.
      db.prepare("INSERT INTO trips (id, user_id, title) VALUES (4, 1, 'no dates')").run();
      db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (4, 1, NULL)').run();
      const snapshot = [1, 2, 3, 4].map((id) => days(db, id));
      replayFrom(db, BACKFILL_VERSION);
      expect([1, 2, 3, 4].map((id) => days(db, id))).toEqual(snapshot);
    } finally {
      db.close();
    }
  });

  it('MIGRATE-DAYS-004: running it twice changes nothing more', () => {
    const db = freshDb();
    try {
      seedClippedTrip(db, 1, '2025-01-26', '2026-01-28', 365);
      replayFrom(db, BACKFILL_VERSION);
      const once = days(db, 1);
      replayFrom(db, BACKFILL_VERSION);
      expect(days(db, 1)).toEqual(once);
    } finally {
      db.close();
    }
  });
});

describe('road-trip day boundary rebuild (#2403)', () => {
  it('MIGRATE-DAYS-005: keeps existing boundaries and accepts a day past the old 366 ceiling', () => {
    const db = freshDb();
    try {
      // The table as every installation before this migration has it.
      db.exec(`
        DROP TABLE roadtrip_day_boundaries;
        CREATE TABLE roadtrip_day_boundaries (
          trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 366),
          from_assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
          to_assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE,
          fraction REAL NOT NULL CHECK (fraction BETWEEN 0 AND 1),
          PRIMARY KEY (trip_id, day_number)
        )`);
      seedClippedTrip(db, 1, '2025-01-01', '2027-06-30', 911);
      db.prepare('INSERT INTO places (trip_id, name) VALUES (1, ?), (1, ?)').run('A', 'B');
      db.prepare('INSERT INTO day_assignments (day_id, place_id) VALUES (1, 1), (2, 2)').run();
      const boundary = db.prepare(
        'INSERT INTO roadtrip_day_boundaries (trip_id, day_number, from_assignment_id, to_assignment_id, fraction) VALUES (1, ?, 1, 2, 0.5)',
      );
      boundary.run(2);
      expect(() => boundary.run(400)).toThrow(/CHECK/);

      replayFrom(db, REBUILD_VERSION);

      boundary.run(400);
      const rows = db.prepare('SELECT day_number, fraction FROM roadtrip_day_boundaries ORDER BY day_number').all();
      expect(rows).toEqual([
        { day_number: 2, fraction: 0.5 },
        { day_number: 400, fraction: 0.5 },
      ]);
      expect(() => boundary.run(0)).toThrow(/CHECK/);
    } finally {
      db.close();
    }
  });
});
