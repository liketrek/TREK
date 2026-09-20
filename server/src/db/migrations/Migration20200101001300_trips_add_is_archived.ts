import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 13 (`db/migrations.ts`).
 */
export class Migration20200101001300_trips_add_is_archived extends Migration {
  override name = 'Migration20200101001300_trips_add_is_archived';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trips', 'is_archived', `is_archived INTEGER DEFAULT 0`);
  }
}
