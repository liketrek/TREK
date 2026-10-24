/**
 * `Migration20200101042000_tours`: the Tours tables on a fresh install, and on
 * a test instance that already carries them from the pre-ORM Tours branch.
 *
 * Migrate to the step immediately before it, optionally lay down the
 * branch's own tables with rows in them, apply just this migration, assert.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101042000_tours';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function indexNames(orm: MikroORM, table: string): Promise<string[]> {
  const rows = await rawQuery<{ name: string }>(orm, `SELECT name FROM pragma_index_list('${table}') ORDER BY name`);
  return rows.map((r) => r.name);
}

async function seedTripWithPlace(orm: MikroORM): Promise<void> {
  await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')");
  await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
  await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (100, 10, 'Ridge walk')");
}

describe('Tours migration', () => {
  it('TOURMIG-001: a fresh install gets the three tables, the hike type and no redundant waypoint index', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);

      expect(
        await rawQuery(
          orm,
          'SELECT key, label_key, icon, color, routing_profile, is_sport, enabled, sort_order FROM tour_types',
        ),
      ).toEqual([
        {
          key: 'hike',
          label_key: 'tourTypes.hike',
          icon: 'Mountain',
          color: '#16a34a',
          routing_profile: 'pedestrian',
          is_sport: 1,
          enabled: 1,
          sort_order: 0,
        },
      ]);

      const tourColumns = await rawQuery<{ name: string; notnull: number; dflt_value: string | null; pk: number }>(
        orm,
        'SELECT name, "notnull", dflt_value, pk FROM pragma_table_info(\'tours\') ORDER BY cid',
      );
      expect(tourColumns.map((c) => c.name)).toEqual([
        'place_id',
        'tour_type',
        'distance',
        'elevation_gain',
        'elevation_loss',
        'duration',
        'difficulty',
        'wanderer_ref',
        'match_confidence',
        'tour_group_id',
        'created_at',
        'max_hiking_difficulty',
      ]);
      expect(tourColumns.find((c) => c.name === 'max_hiking_difficulty')).toMatchObject({
        notnull: 1,
        dflt_value: '2',
      });
      expect(tourColumns.find((c) => c.name === 'place_id')).toMatchObject({ pk: 1 });

      expect(await indexNames(orm, 'tours')).toContain('idx_tours_tour_type');
      expect(await indexNames(orm, 'tour_waypoints')).not.toContain('idx_tour_waypoints_place');

      const fks = await rawQuery<{ table: string; from: string; to: string; on_delete: string }>(
        orm,
        'SELECT "table", "from", "to", on_delete FROM pragma_foreign_key_list(\'tours\') UNION ALL SELECT "table", "from", "to", on_delete FROM pragma_foreign_key_list(\'tour_waypoints\') ORDER BY 1, 2',
      );
      expect(fks).toEqual([
        { table: 'places', from: 'place_id', to: 'id', on_delete: 'CASCADE' },
        { table: 'tour_types', from: 'tour_type', to: 'key', on_delete: 'NO ACTION' },
        { table: 'tours', from: 'place_id', to: 'place_id', on_delete: 'CASCADE' },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURMIG-002: the CHECKs refuse out-of-range values and a place delete cascades through tours to its waypoints', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);
      await rawExec(orm, 'PRAGMA foreign_keys = ON');
      await seedTripWithPlace(orm);

      await expect(
        rawExec(orm, "INSERT INTO tours (place_id, tour_type, max_hiking_difficulty) VALUES (100, 'hike', 7)"),
      ).rejects.toThrow(/CHECK/);
      await expect(rawExec(orm, "INSERT INTO tours (place_id, tour_type) VALUES (100, 'kayak')")).rejects.toThrow(
        /FOREIGN KEY/,
      );
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type) VALUES (100, 'hike')");
      expect(await rawQuery(orm, 'SELECT max_hiking_difficulty FROM tours')).toEqual([{ max_hiking_difficulty: 2 }]);

      await expect(
        rawExec(orm, "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (100, 91, 0, 'start', 0)"),
      ).rejects.toThrow(/CHECK/);
      await expect(
        rawExec(orm, "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (100, 0, 0, 'detour', 0)"),
      ).rejects.toThrow(/CHECK/);
      await rawExec(
        orm,
        "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (100, 47, 11, 'start', 0), (100, 47.1, 11.1, 'end', 1)",
      );
      await expect(
        rawExec(orm, "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (100, 47, 11, 'via', 1)"),
      ).rejects.toThrow(/UNIQUE/);

      await rawExec(orm, 'DELETE FROM places WHERE id = 100');
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM tours')).toEqual([{ n: 0 }]);
      expect(await rawQuery(orm, 'SELECT COUNT(*) AS n FROM tour_waypoints')).toEqual([{ n: 0 }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURMIG-003: on an instance that already has the pre-ORM Tours tables it keeps every row and drops only the redundant index', async () => {
    const orm = await ormBeforeTarget();
    try {
      // The pre-ORM branch's final shape, rows and all, with its custom hike row.
      await rawExec(
        orm,
        `CREATE TABLE tour_types (
        key TEXT PRIMARY KEY, label_key TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL, routing_profile TEXT,
        is_sport INTEGER NOT NULL DEFAULT 1, enabled INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0)`,
      );
      await rawExec(
        orm,
        "INSERT INTO tour_types (key, label_key, icon, color, routing_profile) VALUES ('hike', 'tourTypes.hike', 'Mountain', '#000000', 'pedestrian')",
      );
      await rawExec(
        orm,
        `CREATE TABLE tours (
        place_id INTEGER PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
        tour_type TEXT NOT NULL REFERENCES tour_types(key), distance REAL, elevation_gain REAL, elevation_loss REAL,
        duration REAL, difficulty TEXT, wanderer_ref TEXT, match_confidence REAL, tour_group_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        max_hiking_difficulty INTEGER NOT NULL DEFAULT 2 CHECK(max_hiking_difficulty BETWEEN 1 AND 6))`,
      );
      await rawExec(orm, 'CREATE INDEX idx_tours_tour_type ON tours(tour_type)');
      await rawExec(
        orm,
        `CREATE TABLE tour_waypoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id INTEGER NOT NULL REFERENCES tours(place_id) ON DELETE CASCADE,
        lat REAL NOT NULL CHECK(lat >= -90 AND lat <= 90), lng REAL NOT NULL CHECK(lng >= -180 AND lng <= 180),
        role TEXT NOT NULL CHECK(role IN ('start', 'via', 'end')), sequence INTEGER NOT NULL CHECK(sequence >= 0),
        UNIQUE(place_id, sequence))`,
      );
      await rawExec(orm, 'CREATE INDEX idx_tour_waypoints_place ON tour_waypoints(place_id, sequence)');
      await seedTripWithPlace(orm);
      await rawExec(
        orm,
        "INSERT INTO tours (place_id, tour_type, distance, max_hiking_difficulty) VALUES (100, 'hike', 12.5, 4)",
      );
      await rawExec(
        orm,
        "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (100, 47, 11, 'start', 0), (100, 47.1, 11.1, 'end', 1)",
      );

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT key, color FROM tour_types')).toEqual([{ key: 'hike', color: '#000000' }]);
      expect(await rawQuery(orm, 'SELECT place_id, tour_type, distance, max_hiking_difficulty FROM tours')).toEqual([
        { place_id: 100, tour_type: 'hike', distance: 12.5, max_hiking_difficulty: 4 },
      ]);
      expect(await rawQuery(orm, 'SELECT role, sequence FROM tour_waypoints ORDER BY sequence')).toEqual([
        { role: 'start', sequence: 0 },
        { role: 'end', sequence: 1 },
      ]);
      expect(await indexNames(orm, 'tours')).toContain('idx_tours_tour_type');
      expect(await indexNames(orm, 'tour_waypoints')).not.toContain('idx_tour_waypoints_place');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURMIG-004: a tours table from an earlier branch stage gains the difficulty cap and keeps its rows', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        `CREATE TABLE tour_types (
        key TEXT PRIMARY KEY, label_key TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL, routing_profile TEXT,
        is_sport INTEGER NOT NULL DEFAULT 1, enabled INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0)`,
      );
      await rawExec(
        orm,
        "INSERT INTO tour_types (key, label_key, icon, color, routing_profile) VALUES ('hike', 'tourTypes.hike', 'Mountain', '#16a34a', 'pedestrian')",
      );
      await rawExec(
        orm,
        `CREATE TABLE tours (
        place_id INTEGER PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
        tour_type TEXT NOT NULL REFERENCES tour_types(key), distance REAL, elevation_gain REAL, elevation_loss REAL,
        duration REAL, difficulty TEXT, wanderer_ref TEXT, match_confidence REAL, tour_group_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
      );
      await seedTripWithPlace(orm);
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type, distance) VALUES (100, 'hike', 8)");

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT place_id, distance, max_hiking_difficulty FROM tours')).toEqual([
        { place_id: 100, distance: 8, max_hiking_difficulty: 2 },
      ]);
      expect(
        await rawQuery(orm, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tour_waypoints'"),
      ).toEqual([{ name: 'tour_waypoints' }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
