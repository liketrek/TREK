import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 17 (`db/migrations.ts`).
 */
export class Migration20200101001700_users_add_oidc_issuer extends Migration {
  override name = 'Migration20200101001700_users_add_oidc_issuer';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'oidc_issuer', `oidc_issuer TEXT`);
  }
}
