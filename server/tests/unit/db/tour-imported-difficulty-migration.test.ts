/**
 * `Migration20200101043100_an_imported_tour_has_no_hiking_difficulty`:
 * `tours.max_hiking_difficulty` turns nullable through a rebuild of `tours`
 * and `tour_waypoints`, without losing a row of either, and the constraints
 * around it still hold.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101043100_an_imported_tour_has_no_hiking_difficulty';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

async function seedTripWithPlaces(orm: MikroORM, placeIds: number[]): Promise<void> {
  await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')");
  await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
  const rows = placeIds.map((id) => `(${id}, 10, 'Place ${id}')`).join(', ');
  await rawExec(orm, `INSERT INTO places (id, trip_id, name) VALUES ${rows}`);
}

describe('Imported tour hiking difficulty migration', () => {
  it('TOURDIFFMIG-001: keeps every tour and waypoint while the difficulty becomes optional', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedTripWithPlaces(orm, [100, 101]);
      await rawExec(
        orm,
        `INSERT INTO tours (place_id, tour_type, distance, difficulty, wanderer_ref, match_confidence, created_at,
           max_hiking_difficulty, planned_duration_minutes, break_additional_minutes)
         VALUES (100, 'hike', 12.5, 'T3', 'w-1', 0.3, '2026-01-02 10:00:00', 4, 125, 35)`,
      );
      await rawExec(
        orm,
        `INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence)
         VALUES (100, 47, 11, 'start', 0), (100, 47.1, 11.1, 'end', 1)`,
      );

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT * FROM tours')).toEqual([
        {
          place_id: 100,
          tour_type: 'hike',
          distance: 12.5,
          elevation_gain: null,
          elevation_loss: null,
          duration: null,
          difficulty: 'T3',
          wanderer_ref: 'w-1',
          match_confidence: 0.3,
          created_at: '2026-01-02 10:00:00',
          max_hiking_difficulty: 4,
          planned_duration_minutes: 125,
          break_additional_minutes: 35,
        },
      ]);
      expect(await rawQuery(orm, 'SELECT id, place_id, role, sequence FROM tour_waypoints ORDER BY id')).toEqual([
        { id: 1, place_id: 100, role: 'start', sequence: 0 },
        { id: 2, place_id: 100, role: 'end', sequence: 1 },
      ]);

      const column = await rawQuery<{ notnull: number; dflt_value: string | null }>(
        orm,
        "SELECT \"notnull\", dflt_value FROM pragma_table_info('tours') WHERE name = 'max_hiking_difficulty'",
      );
      expect(column).toEqual([{ notnull: 0, dflt_value: '2' }]);

      await rawExec(orm, "INSERT INTO tours (place_id, tour_type, max_hiking_difficulty) VALUES (101, 'hike', NULL)");
      expect(await rawQuery(orm, 'SELECT max_hiking_difficulty FROM tours WHERE place_id = 101')).toEqual([
        { max_hiking_difficulty: null },
      ]);
      await expect(rawExec(orm, 'UPDATE tours SET max_hiking_difficulty = 7 WHERE place_id = 101')).rejects.toThrow(
        /CHECK/,
      );
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURDIFFMIG-002: a drawn tour still defaults to 2 and the cascades and index survive the rebuild', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seedTripWithPlaces(orm, [100]);

      await migrateTo(orm, TARGET);

      await rawExec(orm, "INSERT INTO tours (place_id, tour_type) VALUES (100, 'hike')");
      await rawExec(
        orm,
        "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (100, 47, 11, 'start', 0)",
      );
      expect(await rawQuery(orm, 'SELECT max_hiking_difficulty FROM tours')).toEqual([{ max_hiking_difficulty: 2 }]);

      await expect(
        rawExec(orm, "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (999, 47, 11, 'end', 1)"),
      ).rejects.toThrow(/FOREIGN KEY/);

      const indexes = await rawQuery<{ name: string }>(
        orm,
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'tours' AND name = 'idx_tours_tour_type'",
      );
      expect(indexes).toEqual([{ name: 'idx_tours_tour_type' }]);

      await rawExec(orm, 'DELETE FROM places WHERE id = 100');
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM tours')).toEqual([{ n: 0 }]);
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM tour_waypoints')).toEqual([{ n: 0 }]);
      expect(await rawQuery(orm, 'SELECT * FROM pragma_foreign_key_check')).toEqual([]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
