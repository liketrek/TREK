import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 1 (`db/migrations.ts`).
 */
export class Migration20200101000100_users_add_unsplash_api_key extends Migration {
  override name = 'Migration20200101000100_users_add_unsplash_api_key';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'unsplash_api_key', `unsplash_api_key TEXT`);
  }
}
