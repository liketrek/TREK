import { attachStayStopsToCheckInDay } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 229 (`db/migrations.ts`).
 *
 * Give every stay booked before this release the day stop it would get today.
 *
 * Road trip mode builds its drive out of day_assignments alone, so a hotel
 * booked in Days mode was invisible there and the traveller had to add the same
 * place a second time by hand. New bookings get the stop as they are written;
 * without this step the fix would only ever apply to trips planned after the
 * upgrade, and the trips people already have would stay broken.
 *
 * Skipped on purpose: a stay whose place is gone (place_id is ON DELETE SET
 * NULL, and the booking form writes stays that never had one), and a place the
 * traveller already planned for that day, whose row stays theirs and unmarked.
 */
export class Migration20200101034900_give_every_stay_booked_before_this_release extends Migration {
  override name = 'Migration20200101034900_give_every_stay_booked_before_this_release';

  override async up(): Promise<void> {
    const placed = await attachStayStopsToCheckInDay(this);
    if (placed > 0) console.log(`[DB] Put ${placed} booked night(s) on their check-in day`);
  }
}
