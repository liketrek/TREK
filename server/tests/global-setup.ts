import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Runs ONCE per `vitest run`, before any worker starts.
 *
 * `src/db/database.ts` used to build the schema itself at module load, so merely
 * importing it handed a suite a migrated database. That is MikroORM's job now
 * and its migrator is async, which the synchronous `initDb()` cannot await. This
 * is the only hook in the test lifecycle that can: setup files are side-effect
 * imports and every other hook is per-file.
 *
 * So one database is migrated here and serialised; each worker opens a copy.
 * `better-sqlite3` deserialises the ~1.5 MiB snapshot in well under a
 * millisecond, against ~800ms to replay 242 migrations, which is also what keeps
 * the suite fast.
 *
 * Most suites never touch it — they mock `db/database` or build their own
 * database with `createTables`/`runMigrations`. It is there for the handful that
 * use the singleton directly.
 */
export async function setup(): Promise<void> {
  const script = path.join(__dirname, 'build-schema-snapshot.ts');
  // A child process under tsx, rather than importing the builder: globalSetup
  // runs outside vitest's transform pipeline, and Node's own resolver cannot
  // load these CommonJS-target modules' extensionless imports.
  execFileSync(process.execPath, ['--import', 'tsx', script], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      // The same fixed values tests/setup.ts pins, for the same reasons: the
      // seeders encrypt with ENCRYPTION_KEY, and the migrations are chatty.
      ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
      LOG_LEVEL: 'error',
    },
  });
}
