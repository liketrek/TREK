/**
 * `Migration20200101042300_every_tour_type_the_contract_names`: `tour_types`
 * gets a row for every key the shared contract accepts, and the never-written
 * `tours.tour_group_id` column goes without touching the rows around it.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';
import { tourTypeKeySchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101042300_every_tour_type_the_contract_names';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

describe('Tour types migration', () => {
  it('TOURTYPEMIG-001: every contract key has a row, only hike enabled, and the group column is gone', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (100, 10, 'Ridge walk')");
      await rawExec(
        orm,
        "INSERT INTO tours (place_id, tour_type, distance, difficulty, wanderer_ref, tour_group_id, max_hiking_difficulty) VALUES (100, 'hike', 12.5, 'T3', 'w-1', 4, 3)",
      );

      await migrateTo(orm, TARGET);

      const types = await rawQuery<{ key: string; enabled: number; label_key: string }>(
        orm,
        'SELECT key, enabled, label_key FROM tour_types ORDER BY sort_order',
      );
      expect(types.map((t) => t.key)).toEqual([...tourTypeKeySchema.options]);
      expect(types.filter((t) => t.enabled === 1).map((t) => t.key)).toEqual(['hike']);
      for (const t of types) expect(t.label_key).toBe(`tourTypes.${t.key}`);

      const columns = await rawQuery<{ name: string }>(orm, "SELECT name FROM pragma_table_info('tours') ORDER BY cid");
      expect(columns.map((c) => c.name)).not.toContain('tour_group_id');
      expect(
        await rawQuery(orm, 'SELECT place_id, distance, difficulty, wanderer_ref, max_hiking_difficulty FROM tours'),
      ).toEqual([{ place_id: 100, distance: 12.5, difficulty: 'T3', wanderer_ref: 'w-1', max_hiking_difficulty: 3 }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURTYPEMIG-002: a type an instance already defined keeps its own values', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO tour_types (key, label_key, icon, color, routing_profile, enabled, sort_order) VALUES ('bike', 'tourTypes.bike', 'Bike', '#000000', 'bicycle', 1, 9)",
      );

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, "SELECT color, enabled, sort_order FROM tour_types WHERE key = 'bike'")).toEqual([
        { color: '#000000', enabled: 1, sort_order: 9 },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
