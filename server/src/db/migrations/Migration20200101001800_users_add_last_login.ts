import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 18 (`db/migrations.ts`).
 */
export class Migration20200101001800_users_add_last_login extends Migration {
  override name = 'Migration20200101001800_users_add_last_login';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'last_login', `last_login DATETIME`);
  }
}
