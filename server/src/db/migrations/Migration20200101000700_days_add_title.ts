import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 7 (`db/migrations.ts`).
 */
export class Migration20200101000700_days_add_title extends Migration {
  override name = 'Migration20200101000700_days_add_title';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'days', 'title', `title TEXT`);
  }
}
