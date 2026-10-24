import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 75 (`db/migrations.ts`).
 */
export class Migration20200101011500_backfill_addons extends Migration {
  override name = 'Migration20200101011500_backfill_addons';

  override async up(): Promise<void> {
    await execBestEffort(this, `UPDATE addons SET enabled = 0 WHERE id = 'memories'`);
  }
}
