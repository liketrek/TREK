/**
 * Boot migration: per-trip road-trip preferences, seeded from whatever the trip
 * owner had set globally so an existing trip keeps behaving the way it did.
 *
 * Ported off the legacy runner (Task 0 triage: PORT) onto the real
 * `Migration20200101033900_create_roadtrip_preferences`: migrate to the step
 * immediately before it, seed rows with raw SQL, apply just that one migration,
 * assert. The replay case runs the migration class directly a second time
 * (bypassing the Migrator's own "already applied, skip" bookkeeping) to prove
 * the `INSERT OR IGNORE` is what keeps a later trip override from being
 * clobbered on a replay — exactly what the legacy test's schema_version rewind
 * was exercising.
 */
import { Migration20200101033900_create_roadtrip_preferences as TargetMigration } from '../../../src/db/migrations/Migration20200101033900_create_roadtrip_preferences';
import {
  createMigrationOrm,
  migrateTo,
  pendingNames,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101033900_create_roadtrip_preferences';

describe('trip driving preferences migration', () => {
  it('inherits owner values once, tolerates nulls and preserves trip overrides on replay', async () => {
    const orm = await createMigrationOrm();
    try {
      const names = await pendingNames(orm);
      const idx = names.indexOf(TARGET);
      expect(idx).toBeGreaterThan(0);
      await migrateTo(orm, names[idx - 1]);

      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x'), (2, 'member', 'member@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'First'), (11, 2, 'Second')");
      await rawExec(
        orm,
        "INSERT INTO settings (user_id, key, value) VALUES (1, 'roadtrip_range_km', '120'), (2, 'roadtrip_range_km', '300'), (1, 'roadtrip_day_start', '\"08:00\"'), (1, 'roadtrip_day_end', NULL), (1, 'routing_base_url', '\"https://private.test\"')",
      );

      await migrateTo(orm, TARGET);

      expect(
        await rawQuery(orm, 'SELECT key, value FROM roadtrip_preferences WHERE trip_id = 10 ORDER BY key'),
      ).toEqual([
        { key: 'roadtrip_day_start', value: '"08:00"' },
        { key: 'roadtrip_range_km', value: '120' },
      ]);
      expect((await rawQuery(orm, 'SELECT value FROM roadtrip_preferences WHERE trip_id = 11'))[0]).toEqual({
        value: '300',
      });

      await rawExec(
        orm,
        "UPDATE roadtrip_preferences SET value = '200' WHERE trip_id = 10 AND key = 'roadtrip_range_km'",
      );
      // Replay: the migration class runs directly a second time, bypassing the
      // Migrator's bookkeeping — INSERT OR IGNORE must leave the override alone.
      await runMigrationDirect(orm, TargetMigration);

      expect(
        (
          await rawQuery(orm, "SELECT value FROM roadtrip_preferences WHERE trip_id = 10 AND key = 'roadtrip_range_km'")
        )[0],
      ).toEqual({ value: '200' });
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
