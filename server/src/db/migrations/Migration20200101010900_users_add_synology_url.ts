import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 69 (`db/migrations.ts`).
 */
export class Migration20200101010900_users_add_synology_url extends Migration {
  override name = 'Migration20200101010900_users_add_synology_url';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'synology_url', `synology_url TEXT`);

    await addColumnIfMissing(this, 'users', 'synology_username', `synology_username TEXT`);

    await addColumnIfMissing(this, 'users', 'synology_password', `synology_password TEXT`);

    await addColumnIfMissing(this, 'users', 'synology_sid', `synology_sid TEXT`);
  }
}
