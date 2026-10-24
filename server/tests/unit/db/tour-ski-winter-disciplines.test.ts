/**
 * SKI-02: `Migration20200101046130_snowshoeing_and_winter_hiking_are_ski_disciplines`
 * moves snowshoeing and winter hiking from the hike's winter label to the ski
 * tour's discipline. A database that ran the earlier migrations as they
 * shipped (045500 with the label, 045520 with four disciplines) ends with the
 * same schema as a fresh one: no winter label anywhere, six disciplines, and
 * every discipline a ski tour held before kept.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046130_snowshoeing_and_winter_hiking_are_ski_disciplines';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function columnsOf(orm: MikroORM, table: string): Promise<string[]> {
  const rows = await rawQuery<{ name: string }>(orm, 'SELECT name FROM pragma_table_info(?)', [table]);
  return rows.map((r) => r.name);
}

describe('snowshoeing and winter hiking become ski disciplines', () => {
  it('TOURSKIWINTER-001: drops the winter label, keeps every discipline and takes the two new ones', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
      await rawExec(
        orm,
        "INSERT INTO places (id, trip_id, name) VALUES (100, 10, 'Snowy ridge'), (101, 10, 'Piste day'), (102, 10, 'Summer walk')",
      );
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type, winter_activity) VALUES (100, 'hike', 'snowshoe')");
      await rawExec(
        orm,
        "INSERT INTO tours (place_id, tour_type, ski_discipline, ski_technique) VALUES (101, 'ski', 'cross_country', 'skating')",
      );
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type) VALUES (102, 'hike')");
      // The shipped CHECK of 045520 still refuses the two new disciplines here.
      await expect(rawExec(orm, "UPDATE tours SET ski_discipline = 'snowshoe' WHERE place_id = 101")).rejects.toThrow(
        /CHECK/,
      );

      await migrateTo(orm, TARGET);

      expect(await columnsOf(orm, 'tours')).not.toContain('winter_activity');
      expect(await columnsOf(orm, 'tours')).not.toContain('ski_discipline_kept');
      expect(await columnsOf(orm, 'collection_tours')).not.toContain('winter_activity');
      expect(await columnsOf(orm, 'collection_tours')).toContain('ski_discipline');

      // A hike that carried the label stays a hike; the ski tour keeps its discipline.
      const rows = await rawQuery(
        orm,
        'SELECT place_id, tour_type, ski_discipline, ski_technique FROM tours ORDER BY place_id',
      );
      expect(rows).toEqual([
        { place_id: 100, tour_type: 'hike', ski_discipline: null, ski_technique: null },
        { place_id: 101, tour_type: 'ski', ski_discipline: 'cross_country', ski_technique: 'skating' },
        { place_id: 102, tour_type: 'hike', ski_discipline: null, ski_technique: null },
      ]);

      await rawExec(orm, "UPDATE tours SET ski_discipline = 'snowshoe', ski_technique = NULL WHERE place_id = 101");
      await rawExec(orm, "UPDATE tours SET ski_discipline = 'winter_hike' WHERE place_id = 101");
      await expect(rawExec(orm, "UPDATE tours SET ski_discipline = 'freeride' WHERE place_id = 101")).rejects.toThrow(
        /CHECK/,
      );
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
