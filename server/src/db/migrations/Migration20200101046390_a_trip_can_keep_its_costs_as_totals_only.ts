import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A trip can keep its costs as totals only (#1714): who paid, the shares and
 * settling up are left out of Costs, for travellers who track what a trip costs
 * but never split it.
 *
 * `costs_mode` is 'split' (what every trip did so far) or 'totals'. 'split' as
 * the default keeps this from being a breaking change: SQLite fills every
 * existing row with it on the ALTER, so every trip looks as it did before.
 */
export class Migration20200101046390_a_trip_can_keep_its_costs_as_totals_only extends Migration {
  override name = 'Migration20200101046390_a_trip_can_keep_its_costs_as_totals_only';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'trips',
      'costs_mode',
      `costs_mode TEXT NOT NULL DEFAULT 'split' CHECK (costs_mode IN ('split', 'totals'))`,
    );
  }
}
