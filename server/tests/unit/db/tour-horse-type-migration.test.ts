/**
 * `Migration20200101045600_a_tour_can_be_ridden_on_horseback` (HOR-01):
 * `tour_types` gains the enabled `horse` key with no routing profile, the
 * other types stay as they were, and an instance that already defined the key
 * keeps its own row.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101045600_a_tour_can_be_ridden_on_horseback';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

describe('Tour horse type migration', () => {
  it('TOURHORSEMIG-001: adds the enabled horse type without a routing profile and leaves the others alone', async () => {
    const orm = await ormBeforeTarget();
    try {
      const before = await rawQuery(orm, "SELECT key, enabled FROM tour_types WHERE key <> 'horse' ORDER BY key");
      expect(await rawQuery(orm, "SELECT key FROM tour_types WHERE key = 'horse'")).toEqual([]);

      await migrateTo(orm, TARGET);

      expect(
        await rawQuery(
          orm,
          "SELECT key, label_key, routing_profile, is_sport, enabled, sort_order FROM tour_types WHERE key = 'horse'",
        ),
      ).toEqual([
        {
          key: 'horse',
          label_key: 'tourTypes.horse',
          routing_profile: null,
          is_sport: 1,
          enabled: 1,
          sort_order: 7,
        },
      ]);
      expect(await rawQuery(orm, "SELECT key, enabled FROM tour_types WHERE key <> 'horse' ORDER BY key")).toEqual(
        before,
      );
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURHORSEMIG-002: a horse type an instance already defined keeps its own values', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO tour_types (key, label_key, icon, color, routing_profile, enabled, sort_order) VALUES ('horse', 'tourTypes.horse', 'Own', '#000000', NULL, 0, 9)",
      );

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, "SELECT icon, enabled, sort_order FROM tour_types WHERE key = 'horse'")).toEqual([
        { icon: 'Own', enabled: 0, sort_order: 9 },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
