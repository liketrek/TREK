import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 139 (`db/migrations.ts`).
 */
export class Migration20200101021900_users_add_airtrail_write_enabled extends Migration {
  override name = 'Migration20200101021900_users_add_airtrail_write_enabled';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'airtrail_write_enabled', `airtrail_write_enabled INTEGER DEFAULT 0`);
  }
}
