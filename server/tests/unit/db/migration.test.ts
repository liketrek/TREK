/**
 * Unit tests for migration 69/71 — normalized per-user per-channel
 * notification preferences. Covers MIGR-001 to MIGR-004b.
 *
 * Previously a hand-inlined reimplementation of the migration's SQL over a
 * bespoke minimal schema, entirely decoupled from both the legacy runner and
 * the real migration (its `createTables` import was unused dead code). Ported
 * (Task 0/Task 5c triage: PORT — a genuine numbered-migration equivalent
 * exists but had no dedicated test) onto the real
 * `Migration20200101011800_normalized_per_user_per_channel_notification_preferences`:
 * migrate to the step immediately before it, seed rows with raw SQL, apply
 * just that one migration, assert.
 */
import { describe, it, expect } from 'vitest';
import type { MikroORM } from '@mikro-orm/sqlite';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

const TARGET = 'Migration20200101011800_normalized_per_user_per_channel_notification_preferences';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function seedUser(orm: MikroORM, username: string): Promise<number> {
  await rawExec(orm, "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, 'x', 'user')", [
    username, `${username}@example.test`,
  ]);
  const rows = await rawQuery<{ id: number }>(orm, 'SELECT last_insert_rowid() as id');
  return rows[0].id;
}

describe('Migration 69/71 — normalized notification_channel_preferences', () => {
  it('MIGR-001 — notification_channel_preferences table exists after migration', async () => {
    const orm = await ormBeforeTarget();
    try {
      await migrateTo(orm, TARGET);
      const table = await rawQuery(orm, `SELECT name FROM sqlite_master WHERE type='table' AND name='notification_channel_preferences'`);
      expect(table[0]).toBeDefined();
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGR-002 — old notification_preferences rows with disabled events migrated as enabled=0', async () => {
    const orm = await ormBeforeTarget();
    try {
      const userId = await seedUser(orm, 'testuser');
      // Simulate user who has disabled trip_invite and booking_change email
      await rawExec(orm, `
        INSERT INTO notification_preferences
          (user_id, notify_trip_invite, notify_booking_change, notify_trip_reminder,
           notify_vacay_invite, notify_photos_shared, notify_collab_message, notify_packing_tagged, notify_webhook)
        VALUES (?, 0, 0, 1, 1, 1, 1, 1, 1)
      `, [userId]);

      await migrateTo(orm, TARGET);

      const read = (eventType: string) =>
        rawQuery<{ enabled: number }>(orm, 'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?', [userId, eventType, 'email']).then((r) => r[0]);
      const tripInviteEmail = await read('trip_invite');
      const bookingEmail = await read('booking_change');
      const reminderEmail = await read('trip_reminder');

      // Disabled events should have enabled=0 rows
      expect(tripInviteEmail).toBeDefined();
      expect(tripInviteEmail!.enabled).toBe(0);
      expect(bookingEmail).toBeDefined();
      expect(bookingEmail!.enabled).toBe(0);
      // Enabled events should have no row (no-row = enabled)
      expect(reminderEmail).toBeUndefined();
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGR-003 — old notify_webhook=0 creates disabled webhook rows for all 7 events', async () => {
    const orm = await ormBeforeTarget();
    try {
      const userId = await seedUser(orm, 'webhookuser');
      // User has all email enabled but webhook disabled
      await rawExec(orm, `
        INSERT INTO notification_preferences
          (user_id, notify_trip_invite, notify_booking_change, notify_trip_reminder,
           notify_vacay_invite, notify_photos_shared, notify_collab_message, notify_packing_tagged, notify_webhook)
        VALUES (?, 1, 1, 1, 1, 1, 1, 1, 0)
      `, [userId]);

      await migrateTo(orm, TARGET);

      const allEvents = ['trip_invite', 'booking_change', 'trip_reminder', 'vacay_invite', 'photos_shared', 'collab_message', 'packing_tagged'];
      for (const eventType of allEvents) {
        const row = (await rawQuery<{ enabled: number }>(orm, 'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?', [userId, eventType, 'webhook']))[0];
        expect(row).toBeDefined();
        expect(row!.enabled).toBe(0);

        // Email rows should NOT exist (all email was enabled → no row needed)
        const emailRow = (await rawQuery(orm, 'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?', [userId, eventType, 'email']))[0];
        expect(emailRow).toBeUndefined();
      }
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGR-004 — notification_channels key is created in app_settings from notification_channel value', async () => {
    const orm = await ormBeforeTarget();
    try {
      // Simulate existing single-channel setting
      await rawExec(orm, "INSERT INTO app_settings (key, value) VALUES (?, ?)", ['notification_channel', 'email']);

      await migrateTo(orm, TARGET);

      const plural = (await rawQuery<{ value: string }>(orm, 'SELECT value FROM app_settings WHERE key = ?', ['notification_channels']))[0];
      expect(plural).toBeDefined();
      expect(plural!.value).toBe('email');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('MIGR-004b — notification_channels is not duplicated if already exists', async () => {
    const orm = await ormBeforeTarget();
    try {
      // Both keys already set (e.g. partial migration or manual edit)
      await rawExec(orm, "INSERT INTO app_settings (key, value) VALUES (?, ?)", ['notification_channel', 'email']);
      await rawExec(orm, "INSERT INTO app_settings (key, value) VALUES (?, ?)", ['notification_channels', 'email,webhook']);

      await migrateTo(orm, TARGET);

      // The existing notification_channels value should be preserved (INSERT OR IGNORE)
      const plural = (await rawQuery<{ value: string }>(orm, 'SELECT value FROM app_settings WHERE key = ?', ['notification_channels']))[0];
      expect(plural!.value).toBe('email,webhook');
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
