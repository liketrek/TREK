import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 247 (`db/migrations.ts`).
 *
 * A stop kept on the day but left out of its route (#2532): shown as a pin, not
 * driven to. 0 routes it like every stop before this existed.
 */
export class Migration20200101040800_a_stop_kept_on_the_day_but extends Migration {
  override name = 'Migration20200101040800_a_stop_kept_on_the_day_but';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'route_excluded', `route_excluded INTEGER NOT NULL DEFAULT 0`);
  }
}
