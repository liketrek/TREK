import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 137 (`db/migrations.ts`).
 */
export class Migration20200101021700_users_add_airtrail_url extends Migration {
  override name = 'Migration20200101021700_users_add_airtrail_url';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'airtrail_url', `airtrail_url TEXT`);

    await addColumnIfMissing(this, 'users', 'airtrail_api_key', `airtrail_api_key TEXT`);

    await addColumnIfMissing(
      this,
      'users',
      'airtrail_allow_insecure_tls',
      `airtrail_allow_insecure_tls INTEGER DEFAULT 0`,
    );
  }
}
