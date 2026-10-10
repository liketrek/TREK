import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 60 (`db/migrations.ts`).
 */
export class Migration20200101010000_trips_add_reminder_days extends Migration {
  override name = 'Migration20200101010000_trips_add_reminder_days';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trips', 'reminder_days', `reminder_days INTEGER DEFAULT 3`);
  }
}
