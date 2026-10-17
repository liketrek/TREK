import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 36 (`db/migrations.ts`).
 */
export class Migration20200101003600_users_add_mfa_enabled extends Migration {
  override name = 'Migration20200101003600_users_add_mfa_enabled';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'mfa_enabled', `mfa_enabled INTEGER DEFAULT 0`);

    await addColumnIfMissing(this, 'users', 'mfa_secret', `mfa_secret TEXT`);
  }
}
