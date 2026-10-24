/**
 * `Migration20200101043800_a_tour_records_where_it_came_from`: every tour gets
 * the way it came in. A wanderer reference makes it a wanderer snapshot; a
 * tour without stored waypoints, or one that keeps a recorded track, is a GPX
 * import; everything else was planned in TREK. No GPX file name is invented.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101043800_a_tour_records_where_it_came_from';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function seed(orm: MikroORM): Promise<void> {
  // 1 planned in TREK (waypoints), 2 a GPX import (none), 3 a wanderer snapshot,
  // 4 a GPX import planned over in place (waypoints and a kept track),
  // 5 a wanderer snapshot planned over in place.
  await rawExec(orm, `INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')`);
  await rawExec(orm, `INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'Alps')`);
  await rawExec(
    orm,
    `INSERT INTO places (id, trip_id, name) VALUES (1, 1, 'Planned'), (2, 1, 'Gpx'), (3, 1, 'Wanderer'), (4, 1, 'Gpx over'), (5, 1, 'Wanderer over')`,
  );
  await rawExec(
    orm,
    `INSERT INTO tours (place_id, tour_type, wanderer_ref, recorded_route_geometry) VALUES
       (1, 'hike', NULL, NULL),
       (2, 'hike', NULL, NULL),
       (3, 'hike', 'https://w.example#t1', NULL),
       (4, 'hike', NULL, '[[47,11],[47.1,11.1]]'),
       (5, 'hike', 'https://w.example#t2', '[[47,11],[47.1,11.1]]')`,
  );
  await rawExec(
    orm,
    `INSERT INTO tour_waypoints (place_id, lat, lng, role, sequence) VALUES
       (1, 47, 11, 'start', 0), (1, 47.1, 11.1, 'end', 1),
       (4, 47, 11, 'start', 0), (4, 47.1, 11.1, 'end', 1),
       (5, 47, 11, 'start', 0), (5, 47.1, 11.1, 'end', 1)`,
  );
}

const origins = (orm: MikroORM) =>
  rawQuery<{ place_id: number; origin: string; origin_file_name: string | null }>(
    orm,
    'SELECT place_id, origin, origin_file_name FROM tours ORDER BY place_id',
  );

const EXPECTED = [
  { place_id: 1, origin: 'trek', origin_file_name: null },
  { place_id: 2, origin: 'gpx', origin_file_name: null },
  { place_id: 3, origin: 'wanderer', origin_file_name: null },
  { place_id: 4, origin: 'gpx', origin_file_name: null },
  { place_id: 5, origin: 'wanderer', origin_file_name: null },
];

describe('tour origin migration (P2C-02)', () => {
  it('TOURORIGIN-MIG-001: each tour gets the way it came in, without a file name it never had', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      expect(await origins(orm)).toEqual(EXPECTED);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TOURORIGIN-MIG-002: a new tour defaults to planned in TREK, and an unknown origin is refused', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      await rawExec(orm, `INSERT INTO places (id, trip_id, name) VALUES (6, 1, 'Later')`);
      await rawExec(orm, `INSERT INTO tours (place_id, tour_type) VALUES (6, 'hike')`);
      expect((await origins(orm)).at(-1)).toEqual({ place_id: 6, origin: 'trek', origin_file_name: null });
      await expect(rawExec(orm, `UPDATE tours SET origin = 'komoot' WHERE place_id = 6`)).rejects.toThrow();
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
