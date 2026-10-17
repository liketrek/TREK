import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 53 (`db/migrations.ts`).
 */
export class Migration20200101005300_users_add_mfa_backup_codes extends Migration {
  override name = 'Migration20200101005300_users_add_mfa_backup_codes';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'mfa_backup_codes', `mfa_backup_codes TEXT`);
  }
}
