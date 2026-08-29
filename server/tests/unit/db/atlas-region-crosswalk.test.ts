/**
 * Unit test for the Atlas region-code reconciliation migration (#1119).
 *
 * After Atlas swapped Natural Earth for geoBoundaries, manually-marked regions
 * (`visited_regions`) held the old Natural Earth ISO-3166-2 codes. The final migration
 * reconciles each row against the shipped admin-1 bundle: valid codes are kept, codes
 * whose region NAME still matches are re-coded, renamed-merge cases use a curated
 * crosswalk, and anything else is left untouched. We exercise the real migration by
 * running all migrations, seeding rows, rewinding schema_version by one, and re-running
 * so only the last (reconciliation) migration fires.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { createUser } from '../../helpers/factories';

import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';

function freshDb() {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  runMigrations(db);
  return db;
}

function mark(db: Database.Database, userId: number, code: string, name: string, country = 'NO') {
  db.prepare('INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)').run(
    userId,
    code,
    name,
    country,
  );
}

// The visited_regions reconciliation (#1119) is pinned at schema version 135.
// Migrations added afterwards are appended AFTER it (append-only), so it is no
// longer the last migration. Rewind to just before the reconciliation and
// re-run: the later migrations are idempotent, so only the reconciliation has
// any effect on the seeded rows here.
const RECONCILIATION_VERSION = 135;
function rerunLastMigration(db: Database.Database) {
  db.prepare('UPDATE schema_version SET version = ?').run(RECONCILIATION_VERSION - 1);
  runMigrations(db);
}

describe('Atlas region-code reconciliation migration', () => {
  it('CROSSWALK-001: remaps a renamed-merge county via the curated crosswalk', () => {
    const db = freshDb();
    const { user } = createUser(db);
    mark(db, user.id, 'NO-05', 'Oppland'); // merged into Innlandet, name changed

    rerunLastMigration(db);

    const rows = db.prepare('SELECT region_code, region_name FROM visited_regions WHERE user_id = ?').all(user.id);
    expect(rows).toEqual([{ region_code: 'NO-34', region_name: 'Innlandet' }]);
    db.close();
  });

  it('CROSSWALK-002: merges two old counties that map to the same new region (no UNIQUE clash)', () => {
    const db = freshDb();
    const { user } = createUser(db);
    mark(db, user.id, 'NO-04', 'Hedmark'); // → Innlandet
    mark(db, user.id, 'NO-05', 'Oppland'); // → Innlandet

    rerunLastMigration(db);

    const rows = db.prepare('SELECT region_code FROM visited_regions WHERE user_id = ?').all(user.id);
    expect(rows).toEqual([{ region_code: 'NO-34' }]);
    db.close();
  });

  it('CROSSWALK-003: leaves a still-valid code untouched', () => {
    const db = freshDb();
    const { user } = createUser(db);
    mark(db, user.id, 'NO-03', 'Oslo'); // present in the new bundle

    rerunLastMigration(db);

    const rows = db.prepare('SELECT region_code, region_name FROM visited_regions WHERE user_id = ?').all(user.id);
    expect(rows).toEqual([{ region_code: 'NO-03', region_name: 'Oslo' }]);
    db.close();
  });

  it('CROSSWALK-004: re-codes a stale code whose region NAME still matches the bundle', () => {
    // Not in any crosswalk: a bogus code but a name ("Oslo") that the bundle still carries
    // for NO → reconciled to the bundle's code for that name (NO-03) by the name-match path.
    const db = freshDb();
    const { user } = createUser(db);
    mark(db, user.id, 'NO-99', 'Oslo');

    rerunLastMigration(db);

    const rows = db.prepare('SELECT region_code, region_name FROM visited_regions WHERE user_id = ?').all(user.id);
    expect(rows).toEqual([{ region_code: 'NO-03', region_name: 'Oslo' }]);
    db.close();
  });

  it('CROSSWALK-005: leaves an unresolvable row as-is (no code, no name, no crosswalk match)', () => {
    const db = freshDb();
    const { user } = createUser(db);
    mark(db, user.id, 'ZZ-99', 'Nowhere', 'ZZ');

    rerunLastMigration(db);

    const rows = db.prepare('SELECT region_code, region_name FROM visited_regions WHERE user_id = ?').all(user.id);
    expect(rows).toEqual([{ region_code: 'ZZ-99', region_name: 'Nowhere' }]);
    db.close();
  });

  it('CROSSWALK-006: does not touch bucket_list or visited_countries (no region identifier there)', () => {
    const db = freshDb();
    const { user } = createUser(db);
    db.prepare('INSERT INTO bucket_list (user_id, name, country_code) VALUES (?, ?, ?)').run(user.id, 'Oppland', 'NO');
    db.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'NO');
    mark(db, user.id, 'NO-05', 'Oppland'); // ensure the migration actually runs its body

    rerunLastMigration(db);

    const bucket = db.prepare('SELECT name, country_code FROM bucket_list WHERE user_id = ?').all(user.id);
    expect(bucket).toEqual([{ name: 'Oppland', country_code: 'NO' }]); // free-text name untouched
    const countries = db.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').all(user.id);
    expect(countries).toEqual([{ country_code: 'NO' }]);
    db.close();
  });
});
