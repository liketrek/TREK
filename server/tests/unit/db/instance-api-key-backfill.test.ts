/**
 * Unit test for the instance API-key backfill migration (#1939).
 *
 * The Places/Unsplash credential moved from "whichever admin row the resolver
 * happened to find" to an instance-wide app_settings row. An install that
 * upgrades must keep searching with the key it already had, so the migration
 * copies the value the old resolver would have handed out — the lowest-id admin
 * who has one — and leaves the users columns alone. It only does so where that
 * value was the whole install's key: as soon as a second row holds one, the
 * promotion is skipped, because the instance row outranks everybody's own
 * column and nobody may be moved onto a stranger's key by an upgrade.
 *
 * Seeded before runMigrations rather than by rewinding schema_version
 * afterwards: createTables already brings users.role and both key columns, so
 * the backfill fires on its normal pass and finds the rows. That keeps this
 * file independent of where the entry sits in the append-only array, so
 * appending the next migration does not drag it along. The one guard that does
 * have to track the tail is tests/integration/leg-mode-incoming.test.ts, which
 * says so in place.
 */
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';

function freshDb() {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  return db;
}

function seedUser(
  db: Database.Database,
  id: number,
  role: 'admin' | 'user',
  keys: { maps?: string; unsplash?: string } = {},
) {
  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, role, maps_api_key, unsplash_api_key)
     VALUES (?, ?, ?, 'x', ?, ?, ?)`
  ).run(id, `u${id}`, `u${id}@test.local`, role, keys.maps ?? null, keys.unsplash ?? null);
}

const setting = (db: Database.Database, key: string) =>
  (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;

describe('instance API-key backfill migration', () => {
  it('KEYFILL-001: copies the one key the install was searching with and keeps the column', () => {
    const db = freshDb();
    seedUser(db, 1, 'admin', { maps: 'the-admin-google', unsplash: 'the-admin-unsplash' });
    seedUser(db, 2, 'user');

    runMigrations(db);

    expect(setting(db, 'maps_api_key')).toBe('the-admin-google');
    expect(setting(db, 'unsplash_api_key')).toBe('the-admin-unsplash');
    // Nothing is taken away: the columns are still the per-user fallback.
    const row = db.prepare('SELECT maps_api_key FROM users WHERE id = 1').get() as { maps_api_key: string };
    expect(row.maps_api_key).toBe('the-admin-google');
    db.close();
  });

  it('KEYFILL-002: skips an admin whose column is empty and takes the next one', () => {
    const db = freshDb();
    seedUser(db, 1, 'admin', { maps: '' });
    seedUser(db, 2, 'admin', { maps: 'the-only-real-key' });

    runMigrations(db);

    expect(setting(db, 'maps_api_key')).toBe('the-only-real-key');
    db.close();
  });

  it('KEYFILL-003: never overwrites a value the admin has already saved instance-wide', () => {
    const db = freshDb();
    seedUser(db, 1, 'admin', { maps: 'old-column-key' });
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'already-instance-wide')").run();

    runMigrations(db);

    expect(setting(db, 'maps_api_key')).toBe('already-instance-wide');
    db.close();
  });

  it('KEYFILL-004: ignores a non-admin key and writes no row at all', () => {
    const db = freshDb();
    seedUser(db, 1, 'user', { maps: 'members-own-key' });

    runMigrations(db);

    // A member's key stays theirs — the resolver still finds it for them, and
    // promoting it would hand their billing to the whole instance.
    expect(setting(db, 'maps_api_key')).toBeUndefined();
    db.close();
  });

  it('KEYFILL-005: writes nothing on an install that never had a key', () => {
    const db = freshDb();
    seedUser(db, 1, 'admin');

    runMigrations(db);

    expect(setting(db, 'maps_api_key')).toBeUndefined();
    expect(setting(db, 'unsplash_api_key')).toBeUndefined();
    db.close();
  });

  it('KEYFILL-006: leaves a column alone once a member holds a key of their own', () => {
    const db = freshDb();
    seedUser(db, 1, 'admin', { maps: 'admins-own-google', unsplash: 'admins-own-unsplash' });
    seedUser(db, 7, 'user', { maps: 'members-own-google' });

    runMigrations(db);

    // Member 7 pays for their own Google key. Promoting the admin's would put
    // every one of their searches on his key and his bill, because the instance
    // row is resolved before their own column.
    expect(setting(db, 'maps_api_key')).toBeUndefined();
    // Decided per column: nobody else has an Unsplash key, so that one really
    // was the whole install's and stays it.
    expect(setting(db, 'unsplash_api_key')).toBe('admins-own-unsplash');
    const row = db.prepare('SELECT maps_api_key FROM users WHERE id = 7').get() as { maps_api_key: string };
    expect(row.maps_api_key).toBe('members-own-google');
    db.close();
  });

  it('KEYFILL-007: two admins with their own keys both keep them', () => {
    const db = freshDb();
    seedUser(db, 1, 'admin', { maps: 'first-admin-google' });
    seedUser(db, 2, 'admin', { maps: 'second-admin-google' });

    runMigrations(db);

    expect(setting(db, 'maps_api_key')).toBeUndefined();
    const rows = db.prepare('SELECT maps_api_key FROM users ORDER BY id').all() as { maps_api_key: string }[];
    expect(rows.map((r) => r.maps_api_key)).toEqual(['first-admin-google', 'second-admin-google']);
    db.close();
  });
});
