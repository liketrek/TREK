/**
 * `Migration20200101043200_via_ferrata_tiles_outlive_a_restart`: the table
 * that keeps the via ferrata grid cells exists only from this step on, keyed
 * by the cell, with every column required.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101043200_via_ferrata_tiles_outlive_a_restart';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

const tables = (orm: MikroORM) =>
  rawQuery<{ name: string }>(orm, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ferrata_tiles'");

describe('Via ferrata tiles migration', () => {
  it('FERTILEMIG-001: creates ferrata_tiles with a required key, payload and fetch time', async () => {
    const orm = await ormBeforeTarget();
    try {
      expect(await tables(orm)).toEqual([]);

      await migrateTo(orm, TARGET);

      expect(await tables(orm)).toEqual([{ name: 'ferrata_tiles' }]);
      const columns = await rawQuery<{ name: string; type: string; notnull: number; pk: number }>(
        orm,
        'SELECT name, type, "notnull", pk FROM pragma_table_info(\'ferrata_tiles\') ORDER BY cid',
      );
      expect(columns).toEqual([
        { name: 'tile_key', type: 'TEXT', notnull: 1, pk: 1 },
        { name: 'payload', type: 'TEXT', notnull: 1, pk: 0 },
        { name: 'fetched_at', type: 'INTEGER', notnull: 1, pk: 0 },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('FERTILEMIG-002: holds one row per cell and refuses a row without a payload', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);

      await rawExec(orm, "INSERT INTO ferrata_tiles (tile_key, payload, fetched_at) VALUES ('942,224', '{}', 1)");
      await expect(
        rawExec(orm, "INSERT INTO ferrata_tiles (tile_key, payload, fetched_at) VALUES ('942,224', '{}', 2)"),
      ).rejects.toThrow(/UNIQUE|PRIMARY KEY/);
      await expect(
        rawExec(orm, "INSERT INTO ferrata_tiles (tile_key, payload, fetched_at) VALUES ('942,225', NULL, 2)"),
      ).rejects.toThrow(/NOT NULL/);
      await expect(
        rawExec(orm, "INSERT INTO ferrata_tiles (tile_key, payload, fetched_at) VALUES (NULL, '{}', 2)"),
      ).rejects.toThrow(/NOT NULL/);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
