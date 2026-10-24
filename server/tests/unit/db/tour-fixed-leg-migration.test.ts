/**
 * `Migration20200101043300_a_tour_leg_can_follow_a_via_ferrata`: tour
 * waypoints gain a nullable `fixed_leg`, and every waypoint already saved
 * keeps its routed leg.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101043300_a_tour_leg_can_follow_a_via_ferrata';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

const fixedLegColumn = (orm: MikroORM) =>
  rawQuery<{ name: string; type: string; notnull: number }>(
    orm,
    "SELECT name, type, \"notnull\" FROM pragma_table_info('tour_waypoints') WHERE name = 'fixed_leg'",
  );

describe('Tour fixed leg migration', () => {
  it('TOURLEGMIG-001: adds a nullable fixed_leg text column, and existing waypoints keep a routed leg', async () => {
    const orm = await ormBeforeTarget();
    try {
      expect(await fixedLegColumn(orm)).toEqual([]);
      await rawExec(orm, "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u', 'u@x.y', 'h')");
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (1, 1, 'Tour')");
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type) VALUES (1, 'hike')");
      await rawExec(
        orm,
        "INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES (1, 47, 11, 'start', 0)",
      );

      await migrateTo(orm, TARGET);

      expect(await fixedLegColumn(orm)).toEqual([{ name: 'fixed_leg', type: 'TEXT', notnull: 0 }]);
      expect(await rawQuery(orm, 'SELECT fixed_leg FROM tour_waypoints')).toEqual([{ fixed_leg: null }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
