import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

/** The version the hand-written `db/migrations.ts` chain ended on. */
const LEGACY_SCHEMA_VERSION = 241;

/**
 * Pins the legacy `schema_version` marker.
 *
 * The table is the old runner's bookkeeping — migration state lives in
 * `mikro_orm_migrations` now — but it is still an entity and still carries the
 * row an installation upgraded from the hand-written chain would have.
 *
 * `INSERT OR IGNORE`, like every other seeder here: seeding runs again whenever
 * the schema bootstrap does, and a backup restore re-runs it against a database
 * that already has this row.
 */
export class SchemaVersionSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const connection = em.getConnection();

    await connection.execute('INSERT OR IGNORE INTO schema_version (id, version) VALUES (?, ?)', [
      1,
      LEGACY_SCHEMA_VERSION,
    ]);
  }
}
