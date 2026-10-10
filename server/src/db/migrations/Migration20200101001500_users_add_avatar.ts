import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 15 (`db/migrations.ts`).
 */
export class Migration20200101001500_users_add_avatar extends Migration {
  override name = 'Migration20200101001500_users_add_avatar';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'avatar', `avatar TEXT`);
  }
}
