import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 253 (`db/migrations.ts`).
 *
 * A note on a settle-up payment (#2340), as expenses already have one: "paid
 * back in cash at the airport". Null on every existing payment.
 */
export class Migration20200101041400_a_note_on_a_settle_up_payment extends Migration {
  override name = 'Migration20200101041400_a_note_on_a_settle_up_payment';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_settlements', 'note', `note TEXT`);
  }
}
