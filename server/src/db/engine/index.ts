import { readEnv } from '../../app-config';
import type { DbEngineSettings } from '../../app-config/db-settings';
import type { DbSettings } from '../../app-config/derive';
import { ALL_ENTITIES } from '../entities';
import { TrekCliMigrator } from '../legacy-baseline';
import { SharedSqliteDriver } from '../orm-driver';
import type { DatabaseEngine } from './engine';
import { PostgresEngine } from './postgres/postgres-engine';
import { SqliteEngine } from './sqlite/sqlite-engine';
import { defineConfig, type Options } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';

export type { DatabaseEngine } from './engine';

/**
 * The engine this process runs on, from `TREK_DB_URL` (`readEnv().db`): the
 * SQLite file unless the URL names a Postgres database. Read afresh on every
 * call, like everything `readEnv()` answers, so nothing caches a choice a test
 * or a restart changes.
 */
export function resolveEngine(db: DbEngineSettings = readEnv().db): DatabaseEngine {
  if (db.engine === 'postgres') return new PostgresEngine(db);
  return new SqliteEngine();
}

/**
 * The Postgres URL, the directory of its client tools and the pool's size,
 * when the settings name a Postgres database; null on SQLite. For the code
 * that drives pg_dump and pg_restore, which needs the first two, and the
 * plugin data stores, which share the pool, and must not read them from the
 * environment again.
 */
export function postgresTarget(db: DbSettings): { url: string; binDir: string | undefined; poolMax: number } | null {
  if (db.engine !== 'postgres') return null;
  return { url: db.url, binDir: db.pgBinDir, poolMax: db.poolMax };
}

/**
 * Refuses an ORM config that does not run on the SQLite engine, with
 * `refusal` as the error. For the code that exists only for SQLite (the test
 * schema snapshot), which must say so instead of starting a SQLite ORM on
 * another engine's options; the check on the driver stays here, in the
 * engine port, like every other question about the engine.
 */
export function assertSqliteOrmConfig(config: Options, refusal: string): void {
  if (config.driver !== SharedSqliteDriver) throw new Error(refusal);
}

/**
 * The MikroORM config for `engine`: what every engine shares (entities,
 * migrations, seeders) and what the engine adds. `src/mikro-orm.config.ts`
 * exports it for the CLI and the Nest container, so both reach the same
 * database.
 */
export function buildOrmConfig(engine: DatabaseEngine): Options {
  return defineConfig({
    entities: ALL_ENTITIES,
    extensions: [engine.id === 'sqlite' ? TrekCliMigrator : Migrator, SeedManager],
    migrations: {
      path: 'dist/db/migrations',
      pathTs: 'src/db/migrations',
      snapshot: false,
    },
    seeder: {
      path: 'dist/db/seeders',
      pathTs: 'src/db/seeders',
      defaultSeeder: 'DatabaseSeeder',
    },
    ...engine.ormOptions(),
  }) as Options;
}
