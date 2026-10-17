import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 47 (`db/migrations.ts`).
 */
export class Migration20200101004700_bucket_list_add_target_date extends Migration {
  override name = 'Migration20200101004700_bucket_list_add_target_date';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'bucket_list', 'target_date', `target_date TEXT DEFAULT NULL`);
  }
}
