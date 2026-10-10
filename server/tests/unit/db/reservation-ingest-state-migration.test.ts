/**
 * Boot migration: reservations.ingest_state.
 *
 * The column gates the two anonymous exports (ICS feed, shared trip) so an
 * automated ingest can park a booking for review without publishing it. Every
 * row that exists before the ALTER has to come out 'live', or the migration
 * would empty a calendar subscription that works today.
 *
 * Ported off the legacy runner (Task 0 triage: PORT) onto the real
 * `Migration20200101031900_reservations_an_automated_ingest_parked_for_review`:
 * migrate to the step immediately before it, seed rows with raw SQL, apply
 * just that one migration, assert. The replay case runs the migration class
 * directly a second time (bypassing the Migrator's own "already applied, skip"
 * bookkeeping) to prove the `addColumnIfMissing` guard is what the legacy
 * test's schema_version rewind was really exercising.
 */
import { Migration20200101031900_reservations_an_automated_ingest_parked_for_review as TargetMigration } from '../../../src/db/migrations/Migration20200101031900_reservations_an_automated_ingest_parked_for_review';
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

const TARGET = 'Migration20200101031900_reservations_an_automated_ingest_parked_for_review';

async function ormWithSeededReservation(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@example.test', 'x')");
  await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')");
  await rawExec(orm, "INSERT INTO reservations (id, trip_id, title, type) VALUES (1, 1, 'Old Flight', 'flight')");
  return orm;
}

describe('reservations ingest_state migration', () => {
  it('MIGRATE-INGEST-001: every pre-existing row comes out live', async () => {
    const orm = await ormWithSeededReservation();
    try {
      await migrateTo(orm, TARGET);
      const rows = await rawQuery<{ ingest_state: string }>(orm, 'SELECT ingest_state FROM reservations WHERE id = 1');
      expect(rows[0].ingest_state).toBe('live');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGRATE-INGEST-002: running the migration twice is a no-op', async () => {
    const orm = await ormWithSeededReservation();
    try {
      await migrateTo(orm, TARGET);
      // Run the migration class directly a second time against a table that
      // already has the column. Without the pragma_table_info guard the ALTER
      // throws.
      await runMigrationDirect(orm, TargetMigration);

      const cols = await rawQuery(
        orm,
        "SELECT name FROM pragma_table_info('reservations') WHERE name = 'ingest_state'",
      );
      expect(cols).toHaveLength(1);
      const rows = await rawQuery<{ ingest_state: string }>(orm, 'SELECT ingest_state FROM reservations WHERE id = 1');
      expect(rows[0].ingest_state).toBe('live');
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
