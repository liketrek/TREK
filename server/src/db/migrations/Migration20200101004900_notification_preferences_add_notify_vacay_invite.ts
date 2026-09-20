import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 49 (`db/migrations.ts`).
 */
export class Migration20200101004900_notification_preferences_add_notify_vacay_invite extends Migration {
  override name = 'Migration20200101004900_notification_preferences_add_notify_vacay_invite';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'notification_preferences',
      'notify_vacay_invite',
      `notify_vacay_invite INTEGER DEFAULT 1`,
    );

    await addColumnIfMissing(
      this,
      'notification_preferences',
      'notify_photos_shared',
      `notify_photos_shared INTEGER DEFAULT 1`,
    );

    await addColumnIfMissing(
      this,
      'notification_preferences',
      'notify_collab_message',
      `notify_collab_message INTEGER DEFAULT 1`,
    );

    await addColumnIfMissing(
      this,
      'notification_preferences',
      'notify_packing_tagged',
      `notify_packing_tagged INTEGER DEFAULT 1`,
    );
  }
}
