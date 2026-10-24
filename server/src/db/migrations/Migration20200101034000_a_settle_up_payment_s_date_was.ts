import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 220 (`db/migrations.ts`).
 *
 * A settle-up payment's date was silently `created_at` (when it was recorded),
 * not editable like a regular expense's `expense_date`. Add the same split:
 * settled_at is the calendar day the transfer actually happened, independent
 * of when someone got around to logging it. NULL on legacy rows and rows
 * whose caller didn't set it; the read side falls back to created_at's date.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101034000_a_settle_up_payment_s_date_was extends Migration {
  override name = 'Migration20200101034000_a_settle_up_payment_s_date_was';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_settlements', 'settled_at', `settled_at TEXT`);
  }
}
