/**
 * In-memory SQLite test database helper.
 *
 * Usage in a `buildApp()` integration test file — `createSnapshotTestDb`/
 * `buildDbMock` come through the `db-mock.ts` leaf module directly, not
 * through this file, so the mock factory doesn't re-enter `src/db/database`
 * while it is still being built (see db-mock.ts's header comment):
 *
 *   vi.mock('../../src/db/database', async () => {
 *     const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
 *     return buildDbMock(createSnapshotTestDb());
 *   });
 *
 *   import { db as testDb } from '../../src/db/database';
 *   import { resetTestDb, resetRateLimits } from '../helpers/test-db';
 *
 *   beforeEach(() => resetTestDb(testDb));
 *   afterAll(() => testDb.close());
 *
 * MikroORM's migrations are the only schema source, including for tests —
 * `createSnapshotTestDb()` above is the one way any suite gets a schema; the
 * legacy `createTestDb()` that built one by hand via `db/schema.ts` +
 * `db/migrations.ts` is gone along with those two files (Plan 4 Task 6).
 */
import { AuthPublicController } from '../../src/nest/auth/auth-public.controller';
import type { RateLimitService } from '../../src/nest/common/rate-limit.service';
import type { INestApplication } from '@nestjs/common';

import type Database from 'better-sqlite3';

// createSnapshotTestDb / buildDbMock / CAN_ACCESS_TRIP_SQL live in db-mock.ts, a
// leaf module with no src/nest imports — see its header comment for why. This
// file imports AuthPublicController (for resetRateLimits below), so a vi.mock
// factory MUST import from db-mock.ts directly, never from here, or it
// re-enters src/db/database while its own mock for that module is still being
// built and captures the real one.
export { CAN_ACCESS_TRIP_SQL, buildDbMock } from './db-mock';

/**
 * Tables `resetTestDb` must NOT clear: seed and config data every test assumes
 * is present (categories, addons, the provider catalogues) plus the two
 * migration bookkeeping tables. Everything else in the schema is user data and
 * is derived from `sqlite_master` at reset time — see `resetTestDb`.
 */
const KEEP_TABLES = new Set([
  // Seeded reference data (`seedDefaults` below re-seeds the first three).
  'categories',
  'addons',
  'photo_providers',
  'photo_provider_fields',
  'document_providers',
  'document_provider_fields',
  // Reference data the migration that creates it writes (`tours.tour_type`
  // has an FK on it); nothing re-seeds it, so a reset must keep it.
  'tour_types',
  // Migration bookkeeping: clearing these would make the next boot replay the
  // whole history over a schema that already has it.
  'schema_version',
  'migrations',
  'mikro_orm_migrations',
]);

const DEFAULT_CATEGORIES = [
  { name: 'Hotel', color: '#3b82f6', icon: '🏨' },
  { name: 'Restaurant', color: '#ef4444', icon: '🍽️' },
  { name: 'Attraction', color: '#8b5cf6', icon: '🏛️' },
  { name: 'Shopping', color: '#f59e0b', icon: '🛍️' },
  { name: 'Transport', color: '#6b7280', icon: '🚌' },
  { name: 'Activity', color: '#10b981', icon: '🎯' },
  { name: 'Bar/Cafe', color: '#f97316', icon: '☕' },
  { name: 'Beach', color: '#06b6d4', icon: '🏖️' },
  { name: 'Nature', color: '#84cc16', icon: '🌿' },
  { name: 'Other', color: '#6366f1', icon: '📍' },
];

const DEFAULT_ADDONS = [
  {
    id: 'packing',
    name: 'Packing List',
    description: 'Pack your bags',
    type: 'trip',
    icon: 'ListChecks',
    enabled: 1,
    sort_order: 0,
  },
  {
    id: 'budget',
    name: 'Costs',
    description: 'Track and split trip expenses',
    type: 'trip',
    icon: 'Wallet',
    enabled: 1,
    sort_order: 1,
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Manage travel documents',
    type: 'trip',
    icon: 'FileText',
    enabled: 1,
    sort_order: 2,
  },
  {
    id: 'vacay',
    name: 'Vacay',
    description: 'Vacation day planner',
    type: 'global',
    icon: 'CalendarDays',
    enabled: 1,
    sort_order: 10,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Visited countries map',
    type: 'global',
    icon: 'Globe',
    enabled: 1,
    sort_order: 11,
  },
  {
    id: 'mcp',
    name: 'MCP',
    description: 'AI assistant integration',
    type: 'integration',
    icon: 'Terminal',
    enabled: 0,
    sort_order: 12,
  },
  {
    id: 'naver_list_import',
    name: 'Naver List Import',
    description: 'Import places from shared Naver Maps lists',
    type: 'trip',
    icon: 'Link2',
    enabled: 0,
    sort_order: 13,
  },
  {
    id: 'collab',
    name: 'Collab',
    description: 'Notes, polls, live chat',
    type: 'trip',
    icon: 'Users',
    enabled: 1,
    sort_order: 6,
  },
];

const DEFAULT_PHOTO_PROVIDERS = [
  { id: 'immich', name: 'Immich', enabled: 1 },
  { id: 'synologyphotos', name: 'Synology Photos', enabled: 1 },
];

/**
 * Flip an addon in the test DB.
 *
 * The MCP `when:` gates used to be mocked at the module boundary
 * (`vi.mock('addons.bridge')`), which worked only because the gate closed over
 * a module-level singleton. They read their controller's injected AddonsService
 * now, so a test toggles the same row the admin panel writes — which also means
 * these cases exercise the real read instead of a stub of it.
 *
 * `resetTestDb` deliberately leaves the addons table alone, so a toggle
 * survives into the next case: set what a case needs rather than assuming the
 * seeded default.
 */
export function setAddonEnabled(db: Database.Database, addonId: string, enabled: boolean): void {
  db.prepare(
    'INSERT INTO addons (id, name, type, enabled) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled',
  ).run(addonId, addonId, 'global', enabled ? 1 : 0);
}

/** Collab's sub-feature flags are opt-out app_settings, not addon rows. */
export function setCollabFeature(
  db: Database.Database,
  feature: 'chat' | 'notes' | 'polls' | 'whatsnext',
  enabled: boolean,
): void {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(
    `collab_${feature}_enabled`,
    enabled ? 'true' : 'false',
  );
}

function seedDefaults(db: Database.Database): void {
  // Not INSERT OR IGNORE: categories.name has no unique constraint, and the
  // migrated snapshot (createSnapshotTestDb) already holds the same ten rows —
  // IGNORE only dedupes on a conflicting constraint, so it would insert a
  // second copy of each. Absence-of-name is what both callers actually want.
  const insertCat = db.prepare(
    'INSERT INTO categories (name, color, icon) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)',
  );
  for (const cat of DEFAULT_CATEGORIES) insertCat.run(cat.name, cat.color, cat.icon, cat.name);

  const insertAddon = db.prepare(
    'INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  for (const a of DEFAULT_ADDONS) insertAddon.run(a.id, a.name, a.description, a.type, a.icon, a.enabled, a.sort_order);

  try {
    const insertProvider = db.prepare(
      'INSERT OR IGNORE INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const p of DEFAULT_PHOTO_PROVIDERS) insertProvider.run(p.id, p.name, p.id, 'Image', p.enabled, 0);
  } catch {
    /* table may not exist in very old schemas */
  }
}

/**
 * Clears all user-generated data from the test DB and re-seeds defaults.
 * Call in beforeEach() for test isolation within a file.
 */
export function resetTestDb(db: Database.Database): void {
  db.exec('PRAGMA foreign_keys = OFF');
  // Derived from the live schema, not from a list. This used to be a
  // hand-mirrored `RESET_TABLES` array kept "in sync with schema.ts +
  // migrations.ts" — by the time it was replaced it had drifted by ~51 tables
  // (collections, oauth, plugins, settlements, …), every one of which leaked
  // its rows from one test into the next. Deletion order does not matter:
  // foreign_keys is OFF for the duration.
  // test-sql-allow: the table list comes from sqlite_master, which no entity or repository maps.
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[])
    .map((r) => r.name)
    // sqlite_* are SQLite's own (sqlite_sequence, sqlite_stat1) — never ours.
    .filter((name) => !name.startsWith('sqlite_') && !KEEP_TABLES.has(name));
  for (const table of tables) {
    db.exec(`DELETE FROM "${table}"`);
  }
  // No sqlite_sequence reset here, on purpose: the legacy helper never reset
  // sequences either, so ids keep growing across tests within a file. Several
  // suites (oauth.test.ts's per-user client cap, mcp.test.ts's in-memory
  // session registry keyed by user id, memories-synology.test.ts's
  // insert-once fixtures) rely on that to stay disjoint from one test to the
  // next. The snapshot's one seeded row (the first-run `admin` user) is
  // normalised away once, in createSnapshotTestDb() (db-mock.ts), not here.
  db.exec('PRAGMA foreign_keys = ON');
  seedDefaults(db);
}

/**
 * Resets the Nest per-IP rate-limit buckets between tests — the buildApp() drop-in
 * for the legacy `loginAttempts.clear(); mfaAttempts.clear()`.
 *
 * The Nest auth path keeps its rate-limit state in a RateLimitService instance that
 * lives inside the AuthModule injector (shared by AuthPublicController/AuthController
 * for the login/mfa/forgot buckets). The same class is ALSO provided separately in
 * OauthModule (its own instance, distinct oauth_* buckets), so a plain
 * app.get(RateLimitService) is ambiguous and may hand back the wrong instance — we
 * resolve the auth controller and clear the limiter it actually uses.
 */
export function resetRateLimits(app: INestApplication): Promise<void> {
  const ctrl = app.get(AuthPublicController, { strict: false }) as unknown as { rl: RateLimitService };
  return ctrl.rl.reset();
}
