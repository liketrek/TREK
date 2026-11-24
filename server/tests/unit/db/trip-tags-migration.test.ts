/**
 * `Migration20200101046440_a_trip_owns_its_tags`: a tag can belong to a trip.
 * Every tag from before stays a personal one, a trip's tag has to name a real
 * trip, and it goes with that trip, taking itself off the places that carried it.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046440_a_trip_owns_its_tags';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

describe('a trip owns its tags', () => {
  it('TRIPTAG-MIG-001: keeps every existing tag personal, on the places it was on', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Lisbon')");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (20, 10, 'Belem Tower')");
      await rawExec(orm, "INSERT INTO tags (id, user_id, name, color) VALUES (30, 1, 'hidden gem', '#ff0000')");
      await rawExec(orm, 'INSERT INTO place_tags (place_id, tag_id) VALUES (20, 30)');

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, 'SELECT id, user_id, trip_id, name, color FROM tags')).toEqual([
        { id: 30, user_id: 1, trip_id: null, name: 'hidden gem', color: '#ff0000' },
      ]);
      expect(await rawQuery(orm, 'SELECT place_id, tag_id FROM place_tags')).toEqual([{ place_id: 20, tag_id: 30 }]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIPTAG-MIG-002: a tag of a trip names a real trip and goes when the trip goes', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Lisbon'), (11, 1, 'Porto')");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (20, 10, 'Belem Tower'), (21, 11, 'Ribeira')");

      await migrateTo(orm, TARGET);

      await rawExec(orm, "INSERT INTO tags (id, user_id, trip_id, name) VALUES (30, 1, 10, 'Monument')");
      await rawExec(orm, "INSERT INTO tags (id, user_id, trip_id, name) VALUES (31, 1, 11, 'Zone')");
      await rawExec(orm, "INSERT INTO tags (id, user_id, name) VALUES (32, 1, 'personal')");
      await rawExec(orm, 'INSERT INTO place_tags (place_id, tag_id) VALUES (20, 30), (21, 31), (21, 32)');
      await expect(
        rawExec(orm, "INSERT INTO tags (user_id, trip_id, name) VALUES (1, 999, 'Nowhere')"),
      ).rejects.toThrow(/FOREIGN KEY/);

      await rawExec(orm, 'DELETE FROM trips WHERE id = 10');

      expect(await rawQuery(orm, 'SELECT id, trip_id FROM tags ORDER BY id')).toEqual([
        { id: 31, trip_id: 11 },
        { id: 32, trip_id: null },
      ]);
      expect(await rawQuery(orm, 'SELECT place_id, tag_id FROM place_tags ORDER BY tag_id')).toEqual([
        { place_id: 21, tag_id: 31 },
        { place_id: 21, tag_id: 32 },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIPTAG-MIG-003: the trip column is indexed, so deleting a trip does not scan every tag', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);
      const indexes = await rawQuery<{ name: string }>(orm, "SELECT name FROM pragma_index_list('tags')");
      expect(indexes.map((index) => index.name)).toContain('idx_tags_trip_id');
      expect(await rawQuery(orm, "SELECT name FROM pragma_index_info('idx_tags_trip_id')")).toEqual([
        { name: 'trip_id' },
      ]);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
