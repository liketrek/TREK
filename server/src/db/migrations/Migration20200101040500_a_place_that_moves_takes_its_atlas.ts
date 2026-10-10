import { createPlaceRegionsFollowPlaceTrigger } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 244 (`db/migrations.ts`).
 *
 * A place that moves takes its Atlas country with it (#2527).
 *
 * place_regions caches the country and region Atlas resolved from a place's
 * coordinates and address, and nothing re-derives a row that is already there.
 * Correcting a place's location left the old row in charge, so Atlas, the
 * dashboard stats and the journey stats kept counting the country the place had
 * just left.
 *
 * A trigger rather than a delete in the places code, because the row is derived
 * from the place and every writer of lat, lng or address has to let go of it:
 * the place editor, update_place, the plugin RPC, the import enrichment and its
 * address backfill, and whatever comes next. The WHEN clause matters because
 * every place edit writes lat, lng and address back whether they changed or
 * not, and renaming a place must not throw away a good row. The next Atlas load
 * resolves the place where it is now.
 *
 * This is 244 on main (4.3.3) as well, so it sits here, ahead of Web Push.
 * Step 246 (`Migration20200101040700`) creates the same trigger once more.
 */
export class Migration20200101040500_a_place_that_moves_takes_its_atlas extends Migration {
  override name = 'Migration20200101040500_a_place_that_moves_takes_its_atlas';

  override async up(): Promise<void> {
    await createPlaceRegionsFollowPlaceTrigger(this);
  }
}
