import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 46 (`db/migrations.ts`).
 */
export class Migration20200101004600_budget_items_add_paid_by_user_id extends Migration {
  override name = 'Migration20200101004600_budget_items_add_paid_by_user_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_items', 'paid_by_user_id', `paid_by_user_id INTEGER REFERENCES users(id)`);
  }
}
