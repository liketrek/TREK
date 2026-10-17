import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 16 (`db/migrations.ts`).
 */
export class Migration20200101001600_users_add_oidc_sub extends Migration {
  override name = 'Migration20200101001600_users_add_oidc_sub';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'oidc_sub', `oidc_sub TEXT`);
  }
}
