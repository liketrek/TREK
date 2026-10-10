import type { DB } from '../kysely/db';
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import type { SqlEntityManager } from '@mikro-orm/sql';

/**
 * The version the hand-written `db/migrations.ts` chain ended on — the highest
 * `Legacy migration step N` any migration names. A rollback to a release that
 * still runs that chain replays every step above this row, and the booked-night
 * reseat (step 242) must not run twice, so this moves whenever a step is ported.
 */
const LEGACY_SCHEMA_VERSION = 258;

/**
 * Pins the legacy `schema_version` marker.
 *
 * The table is the old runner's bookkeeping — migration state lives in
 * `mikro_orm_migrations` now — but it is still an entity and still carries the
 * row an installation upgraded from the hand-written chain would have.
 *
 * An insert that does nothing on conflict, like every other seeder here: seeding runs again whenever
 * the schema bootstrap does, and a backup restore re-runs it against a database
 * that already has this row.
 */
export class SchemaVersionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await (em as SqlEntityManager)
      .getKysely<Pick<DB, 'schema_version'>>()
      .insertInto('schema_version')
      .values({ id: 1, version: LEGACY_SCHEMA_VERSION })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
