import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 142 (`db/migrations.ts`).
 */
export class Migration20200101022200_budget_item_members_add_amount extends Migration {
  override name = 'Migration20200101022200_budget_item_members_add_amount';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_item_members', 'amount', `amount REAL`);
  }
}
