/**
 * Imported from inside `vi.mock('…/db/database')` factories, so it must stay a
 * leaf: anything under src/nest pulled in here would load `db/database` while
 * its mock is still being built and capture the real module.
 *
 * `tests/helpers/test-db.ts` used to define `createSnapshotTestDb`/`buildDbMock`
 * itself, but it also imports `AuthPublicController` (for `resetRateLimits`),
 * which drags in the whole auth graph — including `jwt-verify.ts`, which
 * imports `../../db/database`. A `vi.mock('../../src/db/database', async () =>
 * { const { createSnapshotTestDb, buildDbMock } = await import('../helpers/
 * test-db'); ... })` factory that re-enters `db/database` while building its
 * own mock for that exact module gets handed the REAL, unmocked module for
 * that one import — Vitest can't give a still-building mock to its own
 * re-entrant importer. The real module's test-mode singleton then opens its
 * OWN copy of the schema snapshot on first use (`openDb()` → `readSchemaSnapshot()`), so
 * whichever code path captured `db` this way sees a pristine, never-reset
 * database (the snapshot's seeded `admin@trek.local`) instead of the mock
 * `buildDbMock` builds — while everything that imports `db/database` AFTER
 * the factory returns gets the real mock. Which one a given guard/service
 * saw then depended on unrelated import order, not on anything the test
 * controls — e.g. a fresh `role: 'user'` account reading as `role: 'admin'`,
 * or a trip the caller owns coming back "not found".
 *
 * So this module only imports `better-sqlite3` and `schema-snapshot.ts`
 * (node builtins only) — nothing that could transitively import
 * `src/db/database.ts` again. Keep it that way.
 */
import { readSchemaSnapshot } from '../../src/db/schema-snapshot';

import Database from 'better-sqlite3';

/**
 * A copy of the migrated-and-seeded database the vitest global setup wrote
 * (`tests/global-setup.ts`), for suites that boot the app with `buildApp()`.
 * Those run the MikroORM migrator and seeders against the mocked connection,
 * which only works on a database the ORM's migration table already knows.
 * The legacy `createTestDb()` (in test-db.ts) stays for unit suites that never
 * boot the app.
 *
 * @returns a normalised copy: the snapshot's seeded first-run `admin` row and
 * the `users` autoincrement sequence have already been removed (see below), so
 * the first user any caller creates lands on id 1.
 */
export function createSnapshotTestDb(): Database.Database {
  const snapshot = readSchemaSnapshot();
  if (!snapshot) {
    throw new Error('No schema snapshot: run under vitest (tests/global-setup.ts writes it once per run).');
  }
  const db = new Database(snapshot);
  // No journal_mode PRAGMA here: this is a deserialised in-memory database, so
  // WAL mode (a disk-file concept) is a no-op on it.
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  // The snapshot carries the first-run seeded `admin` row (id 1); the legacy
  // createTestDb() started with no users at all, so the first user a test
  // created was always id 1. Normalise ONCE, here, rather than resetting the
  // sequence on every resetTestDb() call: ids then keep growing across tests
  // within a file exactly as they did under the legacy helper, which several
  // suites (oauth.test.ts's per-user client cap, mcp.test.ts's in-memory
  // session registry, memories-synology.test.ts's insert-once fixtures) rely
  // on to stay disjoint from one test to the next.
  db.exec('DELETE FROM users');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'users'");
  return db;
}

/**
 * Byte-for-byte the statement in src/db/database.ts.
 *
 * Exported because the same query is copied into ~90 test files, and every one
 * of those copies had dropped `t.currency` — so the budget domain, which reads
 * exactly that column off the access row, was only ever exercising its 'EUR'
 * fallback. Import this instead of retyping it.
 */
export const CAN_ACCESS_TRIP_SQL = `
        SELECT t.id, t.user_id, t.currency FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `;

/**
 * Returns the mock factory for vi.mock('../../src/db/database', ...).
 * The returned object mirrors the shape of database.ts exports.
 *
 * @example
 *   vi.mock('../../src/db/database', async () => {
 *     const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
 *     return buildDbMock(createSnapshotTestDb());
 *   });
 */
export function buildDbMock(testDb: Database.Database) {
  return {
    db: testDb,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: async (placeId: number | string) => {
      interface PlaceRow {
        id: number;
        category_id: number | null;
        category_name: string | null;
        category_color: string | null;
        category_icon: string | null;
        [key: string]: unknown;
      }
      const place = testDb
        .prepare(
          `
        SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM places p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        )
        .get(placeId) as PlaceRow | undefined;

      if (!place) return null;

      const tags = testDb
        .prepare(
          `
        SELECT t.* FROM tags t
        JOIN place_tags pt ON t.id = pt.tag_id
        WHERE pt.place_id = ?
      `,
        )
        .all(placeId);

      return {
        ...place,
        category: place.category_id
          ? {
              id: place.category_id,
              name: place.category_name,
              color: place.category_color,
              icon: place.category_icon,
            }
          : null,
        tags,
      };
    },
    canAccessTrip: async (tripId: number | string, userId: number) => {
      return testDb.prepare(CAN_ACCESS_TRIP_SQL).get(userId, tripId, userId);
    },
    isOwner: async (tripId: number | string, userId: number) => {
      return !!testDb.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId);
    },
    getRawConnection: () => testDb,
    openDb: () => {},
    registerReinitializeHook: () => {},
    runDemoSeed: () => {},
  };
}
