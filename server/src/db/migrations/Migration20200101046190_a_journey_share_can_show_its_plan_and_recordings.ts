import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * JRN-04: a journey's public link can also show the trips' plan and the
 * recorded days on its map.
 *
 * `share_plan` puts the places of the linked trips (and their GPX tracks) on
 * the public map, `share_recordings` the days of route the journey keeps.
 * Both are off by default, so a journey that is public already shows exactly
 * what it showed before this step, and neither shows anything while the map
 * itself is not shared.
 */
export class Migration20200101046190_a_journey_share_can_show_its_plan_and_recordings extends Migration {
  override name = 'Migration20200101046190_a_journey_share_can_show_its_plan_and_recordings';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_share_tokens', 'share_plan', 'share_plan INTEGER NOT NULL DEFAULT 0');
    await addColumnIfMissing(
      this,
      'journey_share_tokens',
      'share_recordings',
      'share_recordings INTEGER NOT NULL DEFAULT 0',
    );
  }
}
