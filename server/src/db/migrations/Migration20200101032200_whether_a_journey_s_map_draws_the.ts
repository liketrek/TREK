import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 202 (`db/migrations.ts`).
 *
 * Whether a journey's map draws the GPX tracks of the trips behind it (#2194).
 * #1260 added those tracks unconditionally and with nothing to switch off,
 * on the reasoning that a route imported into a linked trip is part of the
 * journey's story. For a trip carrying a season of recorded drives it is
 * instead a map nobody asked for, drawn from places that never became an
 * entry — so it becomes a journey-level setting.
 * DEFAULT 0, i.e. off: the tracks are opt-in from here on. That is a
 * deliberate behaviour change rather than a preserved default — a journal
 * should show what its author put in it, and #1260's set is everything the
 * linked trips happen to contain. Owners who want them back have one
 * switch in Journey Settings.
 */
export class Migration20200101032200_whether_a_journey_s_map_draws_the extends Migration {
  override name = 'Migration20200101032200_whether_a_journey_s_map_draws_the';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journeys', 'show_trip_tracks', `show_trip_tracks INTEGER NOT NULL DEFAULT 0`);
  }
}
