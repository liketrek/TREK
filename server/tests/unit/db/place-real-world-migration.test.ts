/**
 * `Migration20200101046350_a_place_lies_on_the_real_world`: a longitude saved
 * from a repeated world copy (274.9 for -85.1, #2976) is moved back onto the
 * real world in places, reservation endpoints, collection places and the
 * places-index contribution outbox. Rows
 * already in range, and places without coordinates, keep exactly what they had,
 * and a second run changes nothing.
 */
import { Migration20200101046350_a_place_lies_on_the_real_world } from '../../../src/db/migrations/Migration20200101046350_a_place_lies_on_the_real_world';
import {
  createMigrationOrm,
  migrateTo,
  pendingNames,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046350_a_place_lies_on_the_real_world';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function seed(orm: MikroORM): Promise<void> {
  await rawExec(orm, `INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')`);
  await rawExec(orm, `INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'Pacific')`);
  await rawExec(
    orm,
    `INSERT INTO places (id, trip_id, name, lat, lng) VALUES
       (1, 1, 'right-hand copy', 10.14, 274.921875),
       (2, 1, 'left-hand copy', 35.68, -220.3),
       (3, 1, 'two copies away', 35.68, 859.7),
       (4, 1, 'real world', 34.01, -118.5),
       (5, 1, 'date line', -17.7, 180),
       (6, 1, 'no coordinates', NULL, NULL)`,
  );
  await rawExec(orm, `INSERT INTO reservations (id, trip_id, title) VALUES (1, 1, 'LAX to AKL')`);
  await rawExec(
    orm,
    `INSERT INTO reservation_endpoints (id, reservation_id, role, sequence, name, lat, lng) VALUES
       (1, 1, 'from', 0, 'LAX', 33.94, -118.41),
       (2, 1, 'to', 1, 'AKL', -37.01, -185.215)`,
  );
  await rawExec(orm, `INSERT INTO collections (id, owner_id, name) VALUES (1, 1, 'Saved')`);
  await rawExec(
    orm,
    `INSERT INTO collection_places (id, collection_id, owner_id, name, lat, lng) VALUES
       (1, 1, 1, 'saved on a copy', 48.85, 362.35),
       (2, 1, 1, 'saved at home', 48.85, 2.35)`,
  );
  await rawExec(
    orm,
    `INSERT INTO place_contrib_outbox (id, contrib_key, field, value, place_id, place_name, lat, lng, cid, eligible_at, next_attempt_at)
     VALUES (1, 'k1', 'website', 'x', 1, 'right-hand copy', 10.14, 274.921875, 'c1', '2026-01-01', '2026-01-01')`,
  );
}

const lngs = async (orm: MikroORM, table: string) =>
  (await rawQuery<{ id: number; lng: number | null }>(orm, `SELECT id, lng FROM ${table} ORDER BY id`)).map((r) => [
    r.id,
    r.lng === null ? null : Math.round(r.lng * 1e6) / 1e6,
  ]);

async function expectWrapped(orm: MikroORM): Promise<void> {
  expect(await lngs(orm, 'places')).toEqual([
    [1, -85.078125],
    [2, 139.7],
    [3, 139.7],
    [4, -118.5],
    [5, 180],
    [6, null],
  ]);
  expect(await lngs(orm, 'reservation_endpoints')).toEqual([
    [1, -118.41],
    [2, 174.785],
  ]);
  expect(await lngs(orm, 'collection_places')).toEqual([
    [1, 2.35],
    [2, 2.35],
  ]);
  expect(await lngs(orm, 'place_contrib_outbox')).toEqual([[1, -85.078125]]);
}

describe('a place lies on the real world migration', () => {
  it('REALWORLD-MIG-001: moves longitudes from a world copy back, leaves the rest alone', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      await expectWrapped(orm);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('REALWORLD-MIG-002: running it again changes nothing', async () => {
    const orm = await ormBeforeTarget();
    try {
      await seed(orm);
      await migrateTo(orm, TARGET);
      await runMigrationDirect(orm, Migration20200101046350_a_place_lies_on_the_real_world);
      await expectWrapped(orm);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
