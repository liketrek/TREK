import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 252 (`db/migrations.ts`).
 *
 * Two narrower ways to share a trip (#1712): only the travel (flights, trains,
 * stays) without the day's activities, and without the place photos. Both off
 * keeps every existing link exactly as it was.
 */
export class Migration20200101041300_two_narrower_ways_to_share_a_trip extends Migration {
  override name = 'Migration20200101041300_two_narrower_ways_to_share_a_trip';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'share_tokens', 'share_travel_only', `share_travel_only INTEGER NOT NULL DEFAULT 0`);
    await addColumnIfMissing(this, 'share_tokens', 'share_hide_images', `share_hide_images INTEGER NOT NULL DEFAULT 0`);
  }
}
