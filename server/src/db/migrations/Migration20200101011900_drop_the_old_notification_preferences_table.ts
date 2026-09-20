import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 79 (`db/migrations.ts`).
 *
 * Migration 72: Drop the old notification_preferences table (data migrated to notification_channel_preferences in migration 71)
 */
export class Migration20200101011900_drop_the_old_notification_preferences_table extends Migration {
  override name = 'Migration20200101011900_drop_the_old_notification_preferences_table';

  override up(): void {
    this.addSql(`DROP TABLE IF EXISTS notification_preferences`);
  }
}
