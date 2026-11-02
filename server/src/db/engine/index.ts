import { readEnv } from '../../app-config';
import { ALL_ENTITIES } from '../entities';
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
export function resolveEngine(db: ReturnType<typeof readEnv>['db'] = readEnv().db): DatabaseEngine {
  if (db.engine === 'postgres' && db.url) return new PostgresEngine({ url: db.url, poolMax: db.poolMax });
  return new SqliteEngine();
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
    extensions: [Migrator, SeedManager],
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
