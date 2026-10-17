import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 249 (`db/migrations.ts`).
 *
 * A bucket-list wish for one state or province rather than the whole country
 * (#1901). NULL keeps every existing wish a country wish.
 */
export class Migration20200101041000_a_bucket_list_wish_for_one_state extends Migration {
  override name = 'Migration20200101041000_a_bucket_list_wish_for_one_state';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'bucket_list', 'region_code', `region_code TEXT`);
  }
}
