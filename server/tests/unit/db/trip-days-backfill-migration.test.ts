/**
 * Boot migrations: days a trip lost past the old 365-day limit (#2403).
 *
 * generateDays used to clip the day rows while the trip kept its full end
 * date. The backfill migration appends the missing dated days to a trip whose
 * dated rows are still the unbroken run from its start date, keeps
 * content-bearing dateless days behind them, and leaves every other trip
 * alone. A second, separate migration rebuilds `roadtrip_day_boundaries` to
 * drop the day_number CHECK that mirrored the old limit.
 *
 * Task 0's triage flagged this as "likely PORT, confirm a single migration
 * covers both legacy steps 240 and 241 before porting" — it does NOT: they are
 * two separate numbered migrations. Ported off the legacy runner onto both:
 * `Migration20200101040000_trips_longer_than_a_year_lost_every` (step 240,
 * backfill) and `Migration20200101040100_the_road_trip_day_boundaries_carried_the`
 * (step 241, rebuild). Migrate to the step immediately before each, seed rows
 * with raw SQL, apply just that one migration, assert.
 */
import { Migration20200101040000_trips_longer_than_a_year_lost_every as BackfillMigration } from '../../../src/db/migrations/Migration20200101040000_trips_longer_than_a_year_lost_every';
import {
  createMigrationOrm,
  migrateTo,
  pendingNames,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, it, expect } from 'vitest';

const BACKFILL = 'Migration20200101040000_trips_longer_than_a_year_lost_every';
const REBUILD = 'Migration20200101040100_the_road_trip_day_boundaries_carried_the';

function dayAfter(start: string, n: number) {
  return new Date(Date.parse(start + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
}

async function ormBefore(target: string): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(target);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

/** A trip the old code produced: `dated` day rows from start_date, whatever the end date says. */
async function seedClippedTrip(orm: MikroORM, id: number, start: string, end: string, dated: number): Promise<void> {
  await rawExec(orm, 'INSERT INTO trips (id, user_id, title, start_date, end_date) VALUES (?, 1, ?, ?, ?)', [
    id,
    `T${id}`,
    start,
    end,
  ]);
  const rows: string[] = [];
  const params: unknown[] = [];
  for (let i = 0; i < dated; i++) {
    rows.push('(?, ?, ?)');
    params.push(id, i + 1, dayAfter(start, i));
  }
  if (rows.length) await rawExec(orm, `INSERT INTO days (trip_id, day_number, date) VALUES ${rows.join(', ')}`, params);
}

async function days(orm: MikroORM, tripId: number) {
  return rawQuery<{ id: number; day_number: number; date: string | null }>(
    orm,
    'SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number',
    [tripId],
  );
}

async function seedOwner(orm: MikroORM): Promise<void> {
  await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')");
}

describe('trip days backfill migration (#2403)', () => {
  it('MIGRATE-DAYS-001: appends the days a clipped trip is missing, in order and dated', async () => {
    const orm = await ormBefore(BACKFILL);
    try {
      await seedOwner(orm);
      await seedClippedTrip(orm, 1, '2025-01-26', '2026-01-28', 365);
      const before = await days(orm, 1);

      await migrateTo(orm, BACKFILL);

      const after = await days(orm, 1);
      expect(after).toHaveLength(368);
      // The rows that were there keep their ids and numbers.
      expect(after.slice(0, 365).map((d) => d.id)).toEqual(before.map((d) => d.id));
      expect(after.map((d) => d.day_number)).toEqual(after.map((_, i) => i + 1));
      expect(after.slice(365).map((d) => d.date)).toEqual(['2026-01-26', '2026-01-27', '2026-01-28']);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGRATE-DAYS-002: content-bearing dateless days stay behind the dated ones', async () => {
    const orm = await ormBefore(BACKFILL);
    try {
      await seedOwner(orm);
      await seedClippedTrip(orm, 1, '2025-01-26', '2026-01-28', 365);
      await rawExec(orm, 'INSERT INTO days (trip_id, day_number, date) VALUES (1, 366, NULL)');
      const spareRow = await rawQuery<{ id: number }>(orm, 'SELECT last_insert_rowid() as id');
      const spare = spareRow[0].id;
      await rawExec(orm, "INSERT INTO day_notes (day_id, trip_id, text) VALUES (?, 1, 'keep me')", [spare]);

      await migrateTo(orm, BACKFILL);

      const after = await days(orm, 1);
      expect(after).toHaveLength(369);
      expect(after[367]).toMatchObject({ day_number: 368, date: '2026-01-28' });
      expect(after[368]).toMatchObject({ id: spare, day_number: 369, date: null });
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGRATE-DAYS-003: leaves trips alone that were never clipped, were re-dated by hand, or exceed the new limit', async () => {
    const orm = await ormBefore(BACKFILL);
    try {
      await seedOwner(orm);
      // Complete already.
      await seedClippedTrip(orm, 1, '2026-07-01', '2026-07-07', 7);
      // Longer than a year but its days no longer start on start_date.
      await seedClippedTrip(orm, 2, '2025-01-26', '2026-01-28', 365);
      await rawExec(orm, "UPDATE days SET date = '2024-12-31' WHERE trip_id = 2 AND day_number = 1");
      // Past the new limit: still refused, so still not extended.
      await seedClippedTrip(orm, 3, '2020-01-01', '2030-01-01', 365);
      // Dateless trip.
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (4, 1, 'no dates')");
      await rawExec(orm, 'INSERT INTO days (trip_id, day_number, date) VALUES (4, 1, NULL)');
      const snapshot = await Promise.all([1, 2, 3, 4].map((id) => days(orm, id)));

      await migrateTo(orm, BACKFILL);

      const after = await Promise.all([1, 2, 3, 4].map((id) => days(orm, id)));
      expect(after).toEqual(snapshot);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGRATE-DAYS-004: running it twice changes nothing more', async () => {
    const orm = await ormBefore(BACKFILL);
    try {
      await seedOwner(orm);
      await seedClippedTrip(orm, 1, '2025-01-26', '2026-01-28', 365);
      await migrateTo(orm, BACKFILL);
      const once = await days(orm, 1);
      // Replay: the migration class runs directly a second time, bypassing the
      // Migrator's own "already applied, skip" bookkeeping.
      await runMigrationDirect(orm, BackfillMigration);
      expect(await days(orm, 1)).toEqual(once);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});

describe('road-trip day boundary rebuild (#2403)', () => {
  it('MIGRATE-DAYS-005: keeps existing boundaries and accepts a day past the old 366 ceiling', async () => {
    const orm = await ormBefore(REBUILD);
    try {
      // At this point in the chain `roadtrip_day_boundaries` is still in the
      // shape migration 33800 created it in — the OLD CHECK (1..366) — exactly
      // "the table as every installation before this migration has it".
      await seedOwner(orm);
      await seedClippedTrip(orm, 1, '2025-01-01', '2027-06-30', 911);
      await rawExec(orm, 'INSERT INTO places (trip_id, name) VALUES (1, ?), (1, ?)', ['A', 'B']);
      await rawExec(orm, 'INSERT INTO day_assignments (day_id, place_id) VALUES (1, 1), (2, 2)');
      const insertBoundary = (dayNumber: number) =>
        rawExec(
          orm,
          'INSERT INTO roadtrip_day_boundaries (trip_id, day_number, from_assignment_id, to_assignment_id, fraction) VALUES (1, ?, 1, 2, 0.5)',
          [dayNumber],
        );
      await insertBoundary(2);
      await expect(insertBoundary(400)).rejects.toThrow(/CHECK/);

      await migrateTo(orm, REBUILD);

      await insertBoundary(400);
      const rows = await rawQuery(orm, 'SELECT day_number, fraction FROM roadtrip_day_boundaries ORDER BY day_number');
      expect(rows).toEqual([
        { day_number: 2, fraction: 0.5 },
        { day_number: 400, fraction: 0.5 },
      ]);
      await expect(insertBoundary(0)).rejects.toThrow(/CHECK/);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
