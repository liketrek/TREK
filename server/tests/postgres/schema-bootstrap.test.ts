/**
 * PGBOOTLANE-001: a first boot on an empty Postgres database that fails while
 * it creates the schema (here a baseline statement the server refuses, as one
 * without ICU refuses the `nocase` collation) leaves the database as empty as
 * it found it, the migration history's table included. A table left behind
 * would make RESTORE_FROM_BACKUP take the database for one in use on the next
 * start and bring up an empty instance instead of the backup.
 *
 * The suite works on a scratch database of its own beside the lane's, created
 * and dropped here, since the lane's copy of the template already holds the
 * schema.
 */
import { CURRENT_SCHEMA_TABLES_SQL } from '../../src/db/dialect/catalog';
import { buildOrmConfig, resolveEngine } from '../../src/db/engine';
import { bootstrapPostgresSchema } from '../../src/db/engine/postgres/schema-bootstrap';
import { databaseUrl, withAdmin } from './databases';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const adminUrl = process.env.TREK_TEST_DB_URL as string;
const SCRATCH = `trek_test_boot_${process.pid}`;

let orm: MikroORM;

beforeAll(async () => {
  await withAdmin(adminUrl, async (run) => {
    await run(`DROP DATABASE IF EXISTS "${SCRATCH}" WITH (FORCE)`);
    await run(`CREATE DATABASE "${SCRATCH}"`);
  });
  const config = buildOrmConfig(resolveEngine());
  orm = await MikroORM.init({
    ...config,
    clientUrl: databaseUrl(adminUrl, SCRATCH),
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { ...config.migrations, silent: true },
    pool: { min: 0, max: 2 },
  });
}, 60_000);

afterAll(async () => {
  await orm?.close(true);
  await withAdmin(adminUrl, (run) => run(`DROP DATABASE IF EXISTS "${SCRATCH}" WITH (FORCE)`));
  // Dropping a database waits for a checkpoint, which takes seconds on a slow disk.
}, 60_000);

describe('a first boot that fails on Postgres', () => {
  it('PGBOOTLANE-001: leaves no table behind, not even the migration history', async () => {
    const first = 'Migration20200101000000_baseline_schema';
    await expect(
      bootstrapPostgresSchema(orm, {
        baseline: () => ({
          through: first,
          migrations: [first],
          statements: [
            'create table "boot_probe" ("id" bigserial primary key)',
            'create table "broken" ("a" no_such_type)',
          ],
        }),
        known: new Set([first]),
        safetyNet: { beforeMigrate: async () => undefined, restoreHint: async () => null },
        sqliteLeftBehind: () => null,
      }),
    ).rejects.toThrow(/no_such_type/);

    const tables = await orm.em.getConnection().execute<Array<{ table_name: string }>>(CURRENT_SCHEMA_TABLES_SQL);
    expect(tables.map((row) => row.table_name)).toEqual([]);
  });
});
