import { readEnv } from '../app-config';
import { Place, Tag } from '../types';
import { resolveDbPath } from './db-path';
import { applyDurabilityPragmas } from './durability';
import { readSchemaSnapshot } from './schema-snapshot';

import Database from 'better-sqlite3';

// In test mode each vitest worker gets an isolated in-memory DB so that
// parallel forks can't race on the same file or share migration state.
const isTest = readEnv().app.isTest;
const dbPath = resolveDbPath();

let _db: Database.Database | null = null;

/**
 * Opens the connection and applies the pragmas. It deliberately does NOT build
 * the schema: migrations and seeding are MikroORM's job now and run from
 * `db/orm.ts` during `buildApp()`, because the migrator is async and this
 * function is called at module load.
 *
 * The one exception is test mode, where there is no `buildApp()` to hook into
 * for the handful of suites that use this singleton directly. Those open a copy
 * of a schema snapshot the vitest global setup migrated once for the whole run.
 */
function initDb(): void {
  if (_db) {
    try {
      _db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) {}
    try {
      _db.close();
    } catch (e) {}
    _db = null;
  }

  const snapshot = isTest ? readSchemaSnapshot() : null;
  _db = snapshot ? new Database(snapshot) : new Database(dbPath);
  // Ahead of the journal switch now: changing journal_mode needs an exclusive
  // lock, which a sibling process (reset-admin, the rotation script) may hold.
  _db.exec('PRAGMA busy_timeout = 5000');
  const durability = applyDurabilityPragmas(_db);
  _db.exec('PRAGMA foreign_keys = ON');
  // Reported so an operator can see whether their setting took — the test DB is
  // :memory: and has no journal file, so there is nothing to report there.
  if (dbPath !== ':memory:') {
    console.log(`[DB] journal_mode=${durability.journalMode}, synchronous=${durability.synchronous}`);
  }
}

initDb();

/**
 * The live better-sqlite3 handle, for the MikroORM dialect in `orm-driver.ts`.
 *
 * Deliberately not the `db` Proxy below: Kysely holds whatever it is given for
 * the life of its client, and a Proxy would hide the swap a restore performs.
 * The driver calls this on every connect so it always binds the current handle.
 */
function getRawConnection(): Database.Database {
  if (!_db) throw new Error('Database connection is not available (restore in progress?)');
  return _db;
}

const db = new Proxy({} as Database.Database, {
  get(_, prop: string | symbol) {
    if (!_db) throw new Error('Database connection is not available (restore in progress?)');
    const val = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(_db) : val;
  },
  set(_, prop: string | symbol, val: unknown) {
    (_db as unknown as Record<string | symbol, unknown>)[prop] = val;
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
function runDemoSeed(): void {
  if (!readEnv().demo.enabled) return;
  try {
    const { seedDemoData } = require('../demo/demo-seed');
    seedDemoData(_db);
  } catch (err: unknown) {
    console.error('[Demo] Seed error:', err instanceof Error ? err.message : err);
  }
}

/**
 * Lets `db/orm.ts` rebuild the ORM's connection when this module swaps handles,
 * without this module importing the ORM (which imports this module back).
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
    console.log('[DB] Database connection closed');
  }
}

/**
 * Reopens the connection after a restore has swapped the file underneath us.
 *
 * Async now, because bringing a restored backup up to date means running the
 * migrations, and the hook also has to rebuild the ORM's Kysely client — it
 * cached the handle this function is about to replace.
 */
async function reinitialize(): Promise<void> {
  console.log('[DB] Reinitializing database connection after restore...');
  if (_db) closeDb();
  initDb();
  if (onReinitialize) await onReinitialize();
  console.log('[DB] Database reinitialized successfully');
}

interface PlaceWithCategory extends Place {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
}

interface PlaceWithTags extends Place {
  category: { id: number; name: string; color: string; icon: string } | null;
  tags: Tag[];
  ratings: { user_id: number; username: string; avatar: string | null; rating: number }[];
  rating_avg: number | null;
  rating_count: number;
}

function getPlaceWithTags(placeId: number | string): PlaceWithTags | null {
  const place = db
    .prepare(
      `
    SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM places p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `,
    )
    .get(placeId) as PlaceWithCategory | undefined;

  if (!place) return null;

  const tags = db
    .prepare(
      `
    SELECT t.* FROM tags t
    JOIN place_tags pt ON t.id = pt.tag_id
    WHERE pt.place_id = ?
  `,
    )
    .all(placeId) as Tag[];

  // Collaborative ratings (#1435): every voter with username/avatar for the
  // who-voted tooltip; the displayed value is the average.
  const ratings = db
    .prepare(
      `
    SELECT pr.user_id, u.username, u.avatar, pr.rating FROM place_ratings pr
    JOIN users u ON pr.user_id = u.id
    WHERE pr.place_id = ? ORDER BY pr.created_at
  `,
    )
    .all(placeId) as { user_id: number; username: string; avatar: string | null; rating: number }[];

  return {
    ...place,
    category: place.category_id
      ? {
          id: place.category_id,
          name: place.category_name!,
          color: place.category_color!,
          icon: place.category_icon!,
        }
      : null,
    tags,
    ratings,
    rating_avg: ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null,
    rating_count: ratings.length,
  };
}

interface TripAccess {
  id: number;
  user_id: number;
  currency: string | null;
}

function canAccessTrip(tripId: number | string, userId: number): TripAccess | undefined {
  return db
    .prepare(
      `
    SELECT t.id, t.user_id, t.currency FROM trips t
    LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
    WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
  `,
    )
    .get(userId, tripId, userId) as TripAccess | undefined;
}

function isOwner(tripId: number | string, userId: number): boolean {
  return !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId);
}

export {
  db,
  closeDb,
  reinitialize,
  getPlaceWithTags,
  canAccessTrip,
  isOwner,
  getRawConnection,
  registerReinitializeHook,
  runDemoSeed,
};
export type { TripAccess, PlaceWithTags };
