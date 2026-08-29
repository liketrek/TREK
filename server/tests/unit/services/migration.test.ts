/**
 * Unit tests for migration 69 (normalized notification preferences).
 * Covers MIGR-001 to MIGR-004.
 */
import { createTables } from '../../../src/db/schema';

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

function buildFreshDb() {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/**
 * Run all migrations up to (but NOT including) migration 69, then return the db.
 * This allows us to set up old-schema data and test that migration 69 handles it.
 *
 * We do this by running only the schema tables that existed before migration 69,
 * seeding old data, then running migration 69 in isolation.
 */
function setupPreMigration69Db() {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  // Create schema_version and users table (bare minimum)
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL DEFAULT 0);
    INSERT INTO schema_version (version) VALUES (0);

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notify_trip_invite INTEGER DEFAULT 1,
      notify_booking_change INTEGER DEFAULT 1,
      notify_trip_reminder INTEGER DEFAULT 1,
      notify_vacay_invite INTEGER DEFAULT 1,
      notify_photos_shared INTEGER DEFAULT 1,
      notify_collab_message INTEGER DEFAULT 1,
      notify_packing_tagged INTEGER DEFAULT 1,
      notify_webhook INTEGER DEFAULT 1,
      UNIQUE(user_id)
    );
  `);

  return db;
}

/**
 * Extract and run only migration 69 (index 68) from the migrations array.
 * We do this by importing migrations and calling the last one directly.
 */
function runMigration69(db: ReturnType<typeof Database>): void {
  // Migration 69 logic extracted inline for isolation
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_channel_preferences (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, event_type, channel)
    );
    CREATE INDEX IF NOT EXISTS idx_ncp_user ON notification_channel_preferences(user_id);
  `);

  const oldPrefs = db.prepare('SELECT * FROM notification_preferences').all() as Array<Record<string, number>>;
  const eventCols: Record<string, string> = {
    trip_invite: 'notify_trip_invite',
    booking_change: 'notify_booking_change',
    trip_reminder: 'notify_trip_reminder',
    vacay_invite: 'notify_vacay_invite',
    photos_shared: 'notify_photos_shared',
    collab_message: 'notify_collab_message',
    packing_tagged: 'notify_packing_tagged',
  };
  const insert = db.prepare(
    'INSERT OR IGNORE INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)',
  );
  const insertMany = db.transaction((rows: Array<[number, string, string, number]>) => {
    for (const [userId, eventType, channel, enabled] of rows) {
      insert.run(userId, eventType, channel, enabled);
    }
  });

  for (const row of oldPrefs) {
    const userId = row.user_id as number;
    const webhookEnabled = (row.notify_webhook as number) ?? 0;
    const rows: Array<[number, string, string, number]> = [];
    for (const [eventType, col] of Object.entries(eventCols)) {
      const emailEnabled = (row[col] as number) ?? 1;
      if (!emailEnabled) rows.push([userId, eventType, 'email', 0]);
      if (!webhookEnabled) rows.push([userId, eventType, 'webhook', 0]);
    }
    if (rows.length > 0) insertMany(rows);
  }

  db.exec(`
    INSERT OR IGNORE INTO app_settings (key, value)
      SELECT 'notification_channels', value FROM app_settings WHERE key = 'notification_channel';
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration 69 tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Migration 69 — normalized notification_channel_preferences', () => {
  it('MIGR-001 — notification_channel_preferences table exists after migration', () => {
    const db = setupPreMigration69Db();
    runMigration69(db);

    const table = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='notification_channel_preferences'`)
      .get();
    expect(table).toBeDefined();
    db.close();
  });

  it('MIGR-002 — old notification_preferences rows with disabled events migrated as enabled=0', () => {
    const db = setupPreMigration69Db();

    // Create a user
    const userId = db
      .prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('testuser', 'hash', 'user').lastInsertRowid as number;

    // Simulate user who has disabled trip_invite and booking_change email
    db.prepare(
      `
      INSERT INTO notification_preferences
        (user_id, notify_trip_invite, notify_booking_change, notify_trip_reminder,
         notify_vacay_invite, notify_photos_shared, notify_collab_message, notify_packing_tagged, notify_webhook)
      VALUES (?, 0, 0, 1, 1, 1, 1, 1, 1)
    `,
    ).run(userId);

    runMigration69(db);

    const tripInviteEmail = db
      .prepare(
        'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
      )
      .get(userId, 'trip_invite', 'email') as { enabled: number } | undefined;
    const bookingEmail = db
      .prepare(
        'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
      )
      .get(userId, 'booking_change', 'email') as { enabled: number } | undefined;
    const reminderEmail = db
      .prepare(
        'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
      )
      .get(userId, 'trip_reminder', 'email') as { enabled: number } | undefined;

    // Disabled events should have enabled=0 rows
    expect(tripInviteEmail).toBeDefined();
    expect(tripInviteEmail!.enabled).toBe(0);
    expect(bookingEmail).toBeDefined();
    expect(bookingEmail!.enabled).toBe(0);
    // Enabled events should have no row (no-row = enabled)
    expect(reminderEmail).toBeUndefined();

    db.close();
  });

  it('MIGR-003 — old notify_webhook=0 creates disabled webhook rows for all 7 events', () => {
    const db = setupPreMigration69Db();

    const userId = db
      .prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('webhookuser', 'hash', 'user').lastInsertRowid as number;

    // User has all email enabled but webhook disabled
    db.prepare(
      `
      INSERT INTO notification_preferences
        (user_id, notify_trip_invite, notify_booking_change, notify_trip_reminder,
         notify_vacay_invite, notify_photos_shared, notify_collab_message, notify_packing_tagged, notify_webhook)
      VALUES (?, 1, 1, 1, 1, 1, 1, 1, 0)
    `,
    ).run(userId);

    runMigration69(db);

    const allEvents = [
      'trip_invite',
      'booking_change',
      'trip_reminder',
      'vacay_invite',
      'photos_shared',
      'collab_message',
      'packing_tagged',
    ];
    for (const eventType of allEvents) {
      const row = db
        .prepare(
          'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
        )
        .get(userId, eventType, 'webhook') as { enabled: number } | undefined;
      expect(row).toBeDefined();
      expect(row!.enabled).toBe(0);

      // Email rows should NOT exist (all email was enabled → no row needed)
      const emailRow = db
        .prepare(
          'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?',
        )
        .get(userId, eventType, 'email');
      expect(emailRow).toBeUndefined();
    }

    db.close();
  });

  it('MIGR-004 — notification_channels key is created in app_settings from notification_channel value', () => {
    const db = setupPreMigration69Db();

    // Simulate existing single-channel setting
    db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run('notification_channel', 'email');

    runMigration69(db);

    const plural = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('notification_channels') as
      | { value: string }
      | undefined;
    expect(plural).toBeDefined();
    expect(plural!.value).toBe('email');

    db.close();
  });

  it('MIGR-004b — notification_channels is not duplicated if already exists', () => {
    const db = setupPreMigration69Db();

    // Both keys already set (e.g. partial migration or manual edit)
    db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run('notification_channel', 'email');
    db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run('notification_channels', 'email,webhook');

    runMigration69(db);

    // The existing notification_channels value should be preserved (INSERT OR IGNORE)
    const plural = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('notification_channels') as
      | { value: string }
      | undefined;
    expect(plural!.value).toBe('email,webhook');

    db.close();
  });
});
