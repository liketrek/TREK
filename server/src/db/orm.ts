import mikroOrmConfig from '../mikro-orm.config';
import { registerReinitializeHook, runDemoSeed } from './database';
import type { AnyEntity, EntityClass, EntityManager, EntitySchema, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';

/**
 * Schema ownership at startup.
 *
 * This replaces `createTables()` → `runMigrations()` → `runSeeds()`, which used
 * to run synchronously inside `database.ts::initDb()` at module load. The
 * migrator is async, so the work moved to `buildApp()`, which is the first place
 * in the boot with an await and still runs before anything reads the database
 * (`bootstrap.ts` resolves SettingsService right after).
 */

/**
 * Whatever MikroORM instance this process holds.
 *
 * Widened on the entity list because Nest's `MikroORM` token resolves to the
 * class's own `readonly` form while a direct `init()` yields the mutable one;
 * nothing here reads that parameter.
 */
type AnyOrm = MikroORM<
  IDatabaseDriver,
  EntityManager<IDatabaseDriver>,
  readonly (string | EntityClass<AnyEntity> | EntitySchema)[]
>;

/** Migrate to head, then seed. Safe to call again — both halves are idempotent. */
export async function runSchemaBootstrap(orm: AnyOrm): Promise<void> {
  const migrator = orm.config.getExtension('@mikro-orm/migrator') as Migrator;
  const pending = await migrator.getPending();
  if (pending.length > 0) {
    console.log(`[DB] Applying ${pending.length} pending migration(s)`);
    await migrator.up();
  }

  const defaultSeeder = orm.config.get('seeder').defaultSeeder;
  if (defaultSeeder) await orm.seeder.seedString(defaultSeeder);

  // Demo data depends on the seeded categories (hard-coded ids under an FK), so
  // it can only run once the seeders above have.
  runDemoSeed();
}

/**
 * Binds the ORM to this process's connection lifecycle.
 *
 * A restore swaps the SQLite file and reopens the raw handle; Kysely caches
 * whatever handle it was given, so without this the ORM would keep talking to a
 * closed connection. Closing and reconnecting sends the driver back through
 * `createKyselyDialect()`, which picks up the new handle — and the restored file
 * may be an older backup, so it gets migrated forward too.
 */
export function attachOrm(orm: AnyOrm): void {
  registerReinitializeHook(async () => {
    const connection = orm.em.getConnection();
    // The old handle is already closed by this point; better-sqlite3's close()
    // is idempotent, so letting Kysely destroy it again is harmless.
    await connection.close(true);
    await connection.connect();
    await runSchemaBootstrap(orm);
  });
}

/**
 * An ORM instance outside Nest, for the vitest global setup that builds the
 * schema snapshot. Production uses the container-owned one from
 * `MikroOrmModule.forRoot()` instead of creating a second.
 */
export function createStandaloneOrm(): Promise<AnyOrm> {
  return SqliteMikroORM.init({
    ...mikroOrmConfig,
    // Entity discovery is skipped deliberately. Migrations and seeders are raw
    // SQL and need no metadata, and the global setup that calls this runs as ESM
    // in vitest's main process, where discovering `*.entity.ts` fails on Node's
    // extensionless import resolution.
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
  });
}
