/**
 * `Migration20200101046360_a_new_install_starts_with_more_addons_on`: a new
 * install (no account yet) starts with Journey and Collections on; an existing
 * install keeps every addon exactly as it was.
 */
import { DEFAULT_ADDONS } from '../../../src/db/seeders/AddonSeeder';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046360_a_new_install_starts_with_more_addons_on';

interface AddonRow {
  id: string;
  enabled: number;
}

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

const addons = (orm: MikroORM) => rawQuery<AddonRow>(orm, 'SELECT id, enabled FROM addons ORDER BY id');

describe('a new install starts with more addons on', () => {
  it('ADDON-NEW-001: a new install has Journey and Collections switched on and nothing else touched', async () => {
    const orm = await ormBeforeTarget();
    try {
      const before = await addons(orm);
      expect(before).toContainEqual({ id: 'journey', enabled: 0 });
      expect(before).toContainEqual({ id: 'collections', enabled: 0 });

      await migrateTo(orm, TARGET);

      expect(await addons(orm)).toEqual(
        before.map((row) => (row.id === 'journey' || row.id === 'collections' ? { ...row, enabled: 1 } : row)),
      );
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('ADDON-NEW-002: an existing install keeps every addon as it was', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        `INSERT INTO users (id, username, email, password_hash) VALUES (1, 'admin', 'admin@test', 'x')`,
      );
      const before = await addons(orm);

      await migrateTo(orm, TARGET);

      expect(await addons(orm)).toEqual(before);
      expect(before).toContainEqual({ id: 'journey', enabled: 0 });
      expect(before).toContainEqual({ id: 'collections', enabled: 0 });
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('ADDON-NEW-004: the seeder writes every trip addon but Road trip, Journey, Collections, Atlas, Vacay and Naver on', () => {
    const enabled = (id: string) => DEFAULT_ADDONS.find((addon) => addon.id === id)?.enabled;
    for (const addon of DEFAULT_ADDONS.filter((a) => a.type === 'trip')) {
      expect([addon.id, addon.enabled]).toEqual([addon.id, addon.id === 'roadtrip' ? 0 : 1]);
    }
    for (const id of ['journey', 'collections', 'atlas', 'vacay', 'naver_list_import']) expect(enabled(id)).toBe(1);
  });
});
