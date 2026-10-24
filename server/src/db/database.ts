import { readEnv } from '../app-config';
import { openDatabase } from './connection';
import { resolveDbPath } from './db-path';
import { applyDurabilityPragmas } from './durability';
import { readSchemaSnapshot } from './schema-snapshot';

import type Database from 'better-sqlite3';

let _db: Database.Database | null = null;
/**
 * Set by `closeDb()`, cleared by `openDb()`. A handle that was never opened is
 * opened on first use; one that was closed on purpose (a restore swapping the
 * file, the shutdown) stays closed until somebody reopens it, so nothing can
 * quietly reconnect to a file that is being replaced.
 */
let closedOnPurpose = false;

/**
 * Opens the connection and applies the pragmas. It deliberately does NOT build
 * the schema: migrations and seeding are MikroORM's job and run from
 * `db/orm.ts` when `DatabaseLifecycle.open()` (`nest/database/`) is called by
 * `buildApp()`, because the migrator is async.
 *
 * Nothing calls this at import any more. The first reader opens it: in
 * production that is the ORM's first connect inside `NestFactory.create()`,
 * which is still after `index.ts` ran a first-boot restore. Opening an open
 * connection is a no-op.
 *
 * In test mode there is no `buildApp()` for the handful of suites that use this
 * singleton directly, so those open a copy of a schema snapshot the vitest
 * global setup migrated once for the whole run.
 */
function openDb(): void {
  if (_db) return;
  // Resolved here rather than at import, so loading the module touches neither
  // the environment nor the data directory.
  const dbPath = resolveDbPath();
  const snapshot = readEnv().app.isTest ? readSchemaSnapshot() : null;
  const handle = openDatabase(snapshot ?? dbPath);
  // Ahead of the journal switch now: changing journal_mode needs an exclusive
  // lock, which a sibling process (reset-admin, the rotation script) may hold.
  handle.exec('PRAGMA busy_timeout = 5000');
  const durability = applyDurabilityPragmas(handle);
  handle.exec('PRAGMA foreign_keys = ON');
  _db = handle;
  closedOnPurpose = false;
  // Reported so an operator can see whether their setting took. The test DB is
  // :memory: and has no journal file, so there is nothing to report there.
  if (dbPath !== ':memory:') {
    console.log(`[DB] journal_mode=${durability.journalMode}, synchronous=${durability.synchronous}`);
  }
}

/** The open handle, opening it on first use. Throws while it is closed on purpose. */
function current(): Database.Database {
  if (!_db && !closedOnPurpose) openDb();
  if (!_db) throw new Error('Database connection is not available (restore in progress?)');
  return _db;
}

/**
 * The live better-sqlite3 handle, for the MikroORM dialect in `orm-driver.ts`.
 *
 * Deliberately not the `db` Proxy below: Kysely holds whatever it is given for
 * the life of its client, and a Proxy would hide the swap a restore performs.
 * The driver calls this on every connect so it always binds the current handle.
 */
function getRawConnection(): Database.Database {
  return current();
}

/**
 * Plan 4 Task 4 deleted `DatabaseService`/`DatabaseModule` and every `src/`
 * importer of this Proxy is gone — but the export itself stays, deliberately:
 * ~190 test files' `vi.mock('…/db/database', …)` factories return a
 * `{ db: <mock handle>, … }` shape (`buildDbMock`/the ad-hoc equivalents),
 * and their own `import { db as testDb } from '…/db/database'` line is typed
 * against THIS file's real exports, not the runtime mock — Vitest's
 * `vi.mock` swaps the module at runtime, but `tsc` resolves the import
 * statically regardless. Deleting this export makes every one of those
 * files fail `typecheck:tests` even though none of them use the exported
 * Proxy in production. That test-harness idiom is Track B's own territory
 * (5a/5b/5c's "e2e pattern"), not enumerated in this task's file set —
 * left for a follow-up that swaps the idiom, not deleted out from under it.
 * `src/` never imports it, so ESLint's `no-restricted-imports` shrink still
 * holds this file to its permanent allow-list entry (rule 4) regardless.
 */
const db = new Proxy({} as Database.Database, {
  get(_, prop: string | symbol) {
    const handle = current();
    const val = (handle as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(handle) : val;
  },
  set(_, prop: string | symbol, val: unknown) {
    (current() as unknown as Record<string | symbol, unknown>)[prop] = val;
    return true;
  },
});

/**
 * Demo seeding, which used to run here at module load.
 *
 * It has to follow the schema now: `demo-seed.ts` inserts places against
 * hard-coded category ids 1-9, and with `foreign_keys = ON` those rows only
 * resolve once the category seeder has run. Called from the schema bootstrap in
 * `db/orm.ts`, immediately after the seeders.
 */
// Plan 3i Task 3: `seedDemoData` converted onto `DemoRepository` (an
// EntityManager-backed repository), so it is `async` now and no longer takes
// the raw `db` handle — it resolves its EntityManager itself via
// `RequestContext.getEntityManager()`, which `runSchemaBootstrap`'s existing
// `withRequestContext(orm, () => runDemoSeed())` wrap (`db/orm.ts:59`)
// already populates by the time this runs. `runDemoSeed` awaits it now too:
// previously both were fully synchronous, so the try/catch below already
// caught everything before this function returned; without the `await` a
// rejected promise from `seedDemoData` would become an unhandled rejection
// instead of the `[Demo] Seed error:` log line this catch has always produced.
async function runDemoSeed(): Promise<void> {
  if (!readEnv().demo.enabled) return;
  try {
    const { seedDemoData } = require('../demo/demo-seed');
    await seedDemoData();
  } catch (err: unknown) {
    console.error('[Demo] Seed error:', err instanceof Error ? err.message : err);
  }
}

/**
 * Lets `DatabaseLifecycle` (`nest/database/`) rebuild the ORM's connection when
 * this module swaps handles, without this module importing the ORM (which
 * imports this module back).
 */
let onReinitialize: (() => Promise<void>) | null = null;
function registerReinitializeHook(hook: () => Promise<void>): void {
  onReinitialize = hook;
}

function closeDb(): void {
  if (_db) {
    try {
      _db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) {}
    try {
      _db.close();
    } catch (e) {}
    _db = null;
    closedOnPurpose = true;
    console.log('[DB] Database connection closed');
  }
}

/**
 * Reopens the connection after a restore has swapped the file underneath us.
 *
 * Async now, because bringing a restored backup up to date means running the
 * migrations, and the hook also has to rebuild the ORM's Kysely client: it
 * cached the handle this function is about to replace.
 *
 * Production code reaches this through `DatabaseLifecycle.reopen()`; the export
 * stays for the suites that drive the swap directly and for the mock factories
 * that stub it.
 */
async function reinitialize(): Promise<void> {
  console.log('[DB] Reinitializing database connection after restore...');
  if (_db) closeDb();
  openDb();
  if (onReinitialize) await onReinitialize();
  console.log('[DB] Database reinitialized successfully');
}

// getPlaceWithTags/canAccessTrip/isOwner and the TripAccess/PlaceWithTags
// interfaces lived here through Plan 3c Task 0a's async sweep. Task 0b moved
// their bodies onto TripsRepository.findAccessible/isOwner and
// PlacesRepository.findWithTagsAndRatings — db/repositories/Trips.repository.ts's
// TripAccess is now the single source. Plan 4 Task 4 deleted `DatabaseService`
// (its last `src/` consumer) once every caller moved onto a repository, the
// `UnitOfWork`, or (for the two whole-database-file statements no
// entity/repository call can express) `MaintenanceRepository`/
// `DemoRepository`'s own `connection.execute()`. The `db` Proxy itself stays
// exported — see its own docstring above for why (~190 test files' static
// typecheck, not a production `src/` need).

export { db, openDb, closeDb, reinitialize, getRawConnection, registerReinitializeHook, runDemoSeed };
