/**
 * `Migration20200101046150_a_ski_tour_keeps_its_piste_router_options` gives a
 * tour one more column, `ski_options`: the JSON text of the piste router's
 * options and the build its legs ran on. Every tour that was there keeps its
 * columns and reads NULL in the new one; the column takes the server's JSON.
 * A tour kept in a collection gets the same column.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046150_a_ski_tour_keeps_its_piste_router_options';

describe('the ski options column', () => {
  it('TOURSKIOPT-001: adds a nullable column, leaves every tour as it was and takes the JSON the server writes', async () => {
    const orm = await createMigrationOrm();
    try {
      const names = await pendingNames(orm);
      const idx = names.indexOf(TARGET);
      expect(idx).toBeGreaterThan(0);
      await migrateTo(orm, names[idx - 1] as string);
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (100, 10, 'Valley run')");
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type, ski_discipline) VALUES (100, 'ski', 'alpine')");

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT tour_type, ski_discipline, ski_options FROM tours')).toEqual([
        { tour_type: 'ski', ski_discipline: 'alpine', ski_options: null },
      ]);
      const stored = JSON.stringify({ options: { max_difficulty: 'advanced' }, build: '2026-11-02' });
      await rawExec(orm, 'UPDATE tours SET ski_options = ? WHERE place_id = 100', [stored]);
      expect(await rawQuery(orm, 'SELECT ski_options FROM tours')).toEqual([{ ski_options: stored }]);
      // A tour kept in a collection keeps the same column, so its copies keep the options.
      const kept = "SELECT name FROM pragma_table_info('collection_tours') WHERE name = 'ski_options'";
      expect(await rawQuery(orm, kept)).toEqual([{ name: 'ski_options' }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
