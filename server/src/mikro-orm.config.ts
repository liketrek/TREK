import { resolveDbPath } from './db/db-path';
import { SharedSqliteDriver } from './db/orm-driver';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  extensions: [Migrator, SeedManager],
  // Reuses the connection db/database.ts owns rather than opening a second one.
  // See orm-driver.ts — with `:memory:` in tests, a second connection would be a
  // second, empty database.
  driver: SharedSqliteDriver,
  migrations: {
    path: 'dist/db/migrations',
    pathTs: 'src/db/migrations',
  },
  seeder: {
    path: 'dist/db/seeders',
    pathTs: 'src/db/seeders',
    defaultSeeder: 'DatabaseSeeder',
  },
  // Same resolution database.ts uses: `:memory:` under test, TREK_DB_FILE when
  // set, else data/travel.db. The driver above ignores it for the connection
  // itself, but the CLI and the migrator's logging still read it, and naming a
  // different file here than the one actually open is a trap.
  dbName: resolveDbPath(),
});
