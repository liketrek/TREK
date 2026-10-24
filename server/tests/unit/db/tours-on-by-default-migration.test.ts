/**
 * Tours is on for every install from v5 on: the migration switches an existing
 * install's Tours row on once and touches no other addon, and the seeder writes
 * Tours enabled on a fresh install.
 */
import { DEFAULT_ADDONS } from '../../../src/db/seeders/AddonSeeder';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046140_tours_are_on_for_every_install';

interface AddonRow {
  id: string;
  enabled: number;
}

describe('tours on by default', () => {
  it('ADDON-TOURS-001: an existing install has Tours switched on once, the other addons stay as they were', async () => {
    const orm = await createMigrationOrm();
    try {
      const names = await pendingNames(orm);
      const idx = names.indexOf(TARGET);
      expect(idx).toBeGreaterThan(0);
      await migrateTo(orm, names[idx - 1]);
      await rawExec(
        orm,
        "INSERT INTO addons (id, name, type, enabled, sort_order) VALUES ('tours', 'Tours', 'trip', 0, 8), ('roadtrip', 'Road trip', 'trip', 0, 7)",
      );

      const before = await rawQuery<AddonRow>(orm, 'SELECT id, enabled FROM addons ORDER BY id');
      expect(before).toContainEqual({ id: 'roadtrip', enabled: 0 });
      expect(before).toContainEqual({ id: 'tours', enabled: 0 });

      await migrateTo(orm, TARGET);

      const after = await rawQuery<AddonRow>(orm, 'SELECT id, enabled FROM addons ORDER BY id');
      expect(after).toEqual(before.map((row) => (row.id === 'tours' ? { ...row, enabled: 1 } : row)));
      expect(after).toContainEqual({ id: 'roadtrip', enabled: 0 });
    } finally {
      await orm.close(true);
    }
  });

  it('ADDON-TOURS-002: the seeder writes Tours enabled for a fresh install', () => {
    expect(DEFAULT_ADDONS.find((addon) => addon.id === 'tours')?.enabled).toBe(1);
  });
});
