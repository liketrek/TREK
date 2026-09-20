import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 215 (`db/migrations.ts`).
 *
 * How full THIS stop fills the tank, 1 to 100 (#1797).
 * Beside stop_type rather than in the traveller's settings, because it is a property
 * of the stop and not of the person: a motorway rapid charger gets 80 % because the
 * last fifth would cost as long again, while the one at the hotel gets 100 % because
 * the car stands there all night. One figure for the whole trip cannot say both, and
 * the difference between them is a leg.
 * NULL means "whatever the traveller's own setting says", which is every row that
 * exists today and every stop nobody has an opinion about.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101033500_how_full_this_stop_fills_the_tank extends Migration {
  override name = 'Migration20200101033500_how_full_this_stop_fills_the_tank';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'fill_percent', `fill_percent INTEGER`);
  }
}
