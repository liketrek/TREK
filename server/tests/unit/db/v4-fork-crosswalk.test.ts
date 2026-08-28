import { runMigrations } from '../../../src/db/migrations';
import { createTestDb } from '../../helpers/test-db';

import type Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

describe('v4 fork migration crosswalk', () => {
  let db: Database.Database | null = null;
  afterEach(() => {
    db?.close();
    db = null;
  });

  const removeOfficial176To180Artifacts = (target: Database.Database) => {
    for (const table of ['vacay_shares', 'place_ratings', 'collection_place_ratings']) {
      target.exec(`DROP TABLE ${table}`);
    }
    target.exec('ALTER TABLE vacay_entries DROP COLUMN fraction');
    target.exec('ALTER TABLE day_assignments DROP COLUMN leg_transport_mode');
    target.exec('ALTER TABLE days DROP COLUMN default_transport_mode');
    target.exec('ALTER TABLE vacay_plans DROP COLUMN school_holidays_enabled');
    target.exec('ALTER TABLE vacay_holiday_calendars DROP COLUMN type');
  };

  const expectOfficial176To180Artifacts = (target: Database.Database) => {
    for (const [table, column] of [
      ['vacay_entries', 'fraction'],
      ['day_assignments', 'leg_transport_mode'],
      ['days', 'default_transport_mode'],
      ['vacay_plans', 'school_holidays_enabled'],
      ['vacay_holiday_calendars', 'type'],
    ]) {
      expect(target.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name = ?`).get(table, column)).toBeTruthy();
    }
    for (const table of ['vacay_shares', 'place_ratings', 'collection_place_ratings']) {
      expect(target.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)).toBeTruthy();
    }
  };

  it.each([175, 176, 177, 178, 179, 180])(
    'upgrades a version %i clean/custom baseline and is idempotent',
    (version) => {
      db = createTestDb();
      removeOfficial176To180Artifacts(db);
      db.prepare('UPDATE schema_version SET version = ?').run(version);

      runMigrations(db);
      expectOfficial176To180Artifacts(db);
      expect(db.prepare('SELECT version FROM schema_version').get()).toEqual({ version: 202 });

      const before = {
        migrations: (db.prepare('SELECT COUNT(*) AS count FROM migrations').get() as { count: number }).count,
        users: (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count,
      };
      runMigrations(db);
      expectOfficial176To180Artifacts(db);
      expect(db.prepare('SELECT version FROM schema_version').get()).toEqual({ version: 202 });
      expect({
        migrations: (db.prepare('SELECT COUNT(*) AS count FROM migrations').get() as { count: number }).count,
        users: (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count,
      }).toEqual(before);
      expect(db.pragma('integrity_check')).toEqual([{ integrity_check: 'ok' }]);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    },
  );

  it('repairs official 176-180 artifacts after a customized database skipped them', () => {
    db = createTestDb();
    db.prepare(
      "INSERT INTO users (username,email,password_hash,role) VALUES ('owner','owner@example.test','x','admin')",
    ).run();
    const admin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get() as { id: number };
    const tripId = Number(
      db.prepare("INSERT INTO trips (user_id,title,currency) VALUES (?, 'Preserved','EUR')").run(admin.id)
        .lastInsertRowid,
    );
    db.prepare(
      `INSERT INTO trip_exchange_rates
         (trip_id,currency,exchange_rate,source_version,set_by_user_id,note)
       VALUES (?, 'USD', 1.2, 'custom:before-v4', ?, 'keep me')`,
    ).run(tripId, admin.id);

    // State reached after a custom-180 database has run official 181-198:
    // numeric history says 198, but the five upstream artifacts are absent.
    removeOfficial176To180Artifacts(db);
    db.prepare('UPDATE schema_version SET version = 198').run();

    runMigrations(db);

    expect(db.prepare('SELECT version FROM schema_version').get()).toEqual({ version: 202 });
    expectOfficial176To180Artifacts(db);
    expect(
      db
        .prepare('SELECT exchange_rate,source_version,note FROM trip_exchange_rates WHERE trip_id=? AND currency=?')
        .get(tripId, 'USD'),
    ).toEqual({ exchange_rate: 1.2, source_version: 'custom:before-v4', note: 'keep me' });
    expect(db.pragma('integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(db.pragma('foreign_key_check')).toEqual([]);
  });
});
