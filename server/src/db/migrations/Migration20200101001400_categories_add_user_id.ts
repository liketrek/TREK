import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 14 (`db/migrations.ts`).
 */
export class Migration20200101001400_categories_add_user_id extends Migration {
  override name = 'Migration20200101001400_categories_add_user_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'categories', 'user_id', `user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  }
}
