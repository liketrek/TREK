import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

// The preferences table and its one-time inheritance are pinned at schema
// version 219. Anything added later is appended after it (append-only), so it
// stops being the last migration as soon as the next one lands. Rewind to just
// before it and re-run: the steps after it are idempotent, so only this one
// touches the rows seeded here.
const PREFERENCES_VERSION = 219;

describe('trip driving preferences migration', () => {
  it('inherits owner values once, tolerates nulls and preserves trip overrides on replay', () => {
    const db = new Database(':memory:');
    try {
      createTables(db);
      runMigrations(db);
      db.exec(
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x'), (2, 'member', 'member@test', 'x')",
      );
      db.exec("INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'First'), (11, 2, 'Second')");
      db.exec(
        "INSERT INTO settings (user_id, key, value) VALUES (1, 'roadtrip_range_km', '120'), (2, 'roadtrip_range_km', '300'), (1, 'roadtrip_day_start', '\"08:00\"'), (1, 'roadtrip_day_end', NULL), (1, 'routing_base_url', '\"https://private.test\"')",
      );
      db.prepare('UPDATE schema_version SET version = ?').run(PREFERENCES_VERSION - 1);
      runMigrations(db);
      expect(db.prepare('SELECT key, value FROM roadtrip_preferences WHERE trip_id = 10 ORDER BY key').all()).toEqual([
        { key: 'roadtrip_day_start', value: '"08:00"' },
        { key: 'roadtrip_range_km', value: '120' },
      ]);
      expect(db.prepare('SELECT value FROM roadtrip_preferences WHERE trip_id = 11').get()).toEqual({ value: '300' });
      db.exec("UPDATE roadtrip_preferences SET value = '200' WHERE trip_id = 10 AND key = 'roadtrip_range_km'");
      db.prepare('UPDATE schema_version SET version = ?').run(PREFERENCES_VERSION - 1);
      runMigrations(db);
      expect(
        db.prepare("SELECT value FROM roadtrip_preferences WHERE trip_id = 10 AND key = 'roadtrip_range_km'").get(),
      ).toEqual({ value: '200' });
    } finally {
      db.close();
    }
  });
});
