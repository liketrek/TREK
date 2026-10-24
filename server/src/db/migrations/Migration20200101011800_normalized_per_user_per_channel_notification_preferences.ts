import { tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/** Old single-row-per-user columns → the event_type they become. */
const EVENT_COLUMNS: Record<string, string> = {
  trip_invite: 'notify_trip_invite',
  booking_change: 'notify_booking_change',
  trip_reminder: 'notify_trip_reminder',
  vacay_invite: 'notify_vacay_invite',
  photos_shared: 'notify_photos_shared',
  collab_message: 'notify_collab_message',
  packing_tagged: 'notify_packing_tagged',
};

/**
 * Legacy migration step 78 (`db/migrations.ts`).
 *
 * Migration 71: Normalized per-user per-channel notification preferences.
 *
 * Only the *disabled* combinations are written: a missing row means enabled, so
 * copying the defaults across would bloat the table for no change in behaviour.
 */
export class Migration20200101011800_normalized_per_user_per_channel_notification_preferences extends Migration {
  override name = 'Migration20200101011800_normalized_per_user_per_channel_notification_preferences';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS notification_channel_preferences (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        channel TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (user_id, event_type, channel)
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_ncp_user ON notification_channel_preferences(user_id)`);

    // The old table does not exist on fresh installs.
    const oldPrefs = (await tableExists(this, 'notification_preferences'))
      ? ((await this.execute(`SELECT * FROM notification_preferences`)) as Record<string, number>[])
      : [];

    for (const row of oldPrefs) {
      const userId = row.user_id;
      const webhookEnabled = row.notify_webhook ?? 0;
      for (const [eventType, col] of Object.entries(EVENT_COLUMNS)) {
        const emailEnabled = row[col] ?? 1;
        if (!emailEnabled) {
          await this.execute(
            `INSERT OR IGNORE INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)`,
            [userId, eventType, 'email', 0],
          );
        }
        if (!webhookEnabled) {
          await this.execute(
            `INSERT OR IGNORE INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, ?)`,
            [userId, eventType, 'webhook', 0],
          );
        }
      }
    }

    // Copy the existing single-channel setting to the new plural key.
    await this.execute(`
      INSERT OR IGNORE INTO app_settings (key, value)
        SELECT 'notification_channels', value FROM app_settings WHERE key = 'notification_channel'
    `);
  }
}
