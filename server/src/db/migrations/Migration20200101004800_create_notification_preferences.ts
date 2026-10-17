import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 48 (`db/migrations.ts`).
 */
export class Migration20200101004800_create_notification_preferences extends Migration {
  override name = 'Migration20200101004800_create_notification_preferences';

  override up(): void {
    this.addSql(`
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
        notify_webhook INTEGER DEFAULT 0,
        UNIQUE(user_id)
      )
    `);
  }
}
