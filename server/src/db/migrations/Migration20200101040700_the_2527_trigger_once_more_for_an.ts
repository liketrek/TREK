import { createPlaceRegionsFollowPlaceTrigger } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 246 (`db/migrations.ts`).
 *
 * The #2527 trigger once more (step 244, `Migration20200101040500`), for an
 * instance that ran Web Push at 244 before the trigger took that slot. Such an
 * instance never runs 244 again, so it gets the trigger here. Everywhere else it
 * already exists and this is a no-op.
 */
export class Migration20200101040700_the_2527_trigger_once_more_for_an extends Migration {
  override name = 'Migration20200101040700_the_2527_trigger_once_more_for_an';

  override async up(): Promise<void> {
    await createPlaceRegionsFollowPlaceTrigger(this);
  }
}
