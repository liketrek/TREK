import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 59 (`db/migrations.ts`).
 */
export class Migration20200101005900_users_add_must_change_password extends Migration {
  override name = 'Migration20200101005900_users_add_must_change_password';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'must_change_password', `must_change_password INTEGER DEFAULT 0`);
  }
}
