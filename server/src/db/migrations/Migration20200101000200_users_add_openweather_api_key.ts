import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 2 (`db/migrations.ts`).
 */
export class Migration20200101000200_users_add_openweather_api_key extends Migration {
  override name = 'Migration20200101000200_users_add_openweather_api_key';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'openweather_api_key', `openweather_api_key TEXT`);
  }
}
