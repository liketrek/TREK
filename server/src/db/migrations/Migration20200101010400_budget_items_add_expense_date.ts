import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 64 (`db/migrations.ts`).
 */
export class Migration20200101010400_budget_items_add_expense_date extends Migration {
  override name = 'Migration20200101010400_budget_items_add_expense_date';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_items', 'expense_date', `expense_date TEXT DEFAULT NULL`);
  }
}
