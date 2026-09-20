import { attachStayStopsToCheckInDay } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 230 (`db/migrations.ts`).
 *
 * The same sweep once more, for the nights the first one could not have seen.
 *
 * A migration runs while the old container is still answering: a booking written
 * in those seconds is written by code that knows nothing about the day stop, and
 * lands behind the sweep that would have given it one. One did, on the test
 * instance, out of ten. There is nothing to be done about that window, but there
 * is something to be done about what falls into it, and a booking that never got
 * its stop is invisible to the drive with no way back short of saving it again.
 *
 * Safe to repeat: the same NOT EXISTS decides it, so a stay that already has its
 * stop is passed over, and one whose place the traveller planned by hand keeps
 * that row unclaimed.
 */
export class Migration20200101035000_the_same_sweep_once_more_for_the extends Migration {
  override name = 'Migration20200101035000_the_same_sweep_once_more_for_the';

  override async up(): Promise<void> {
    const placed = await attachStayStopsToCheckInDay(this);
    if (placed > 0) console.log(`[DB] Caught up ${placed} booked night(s) missed during the upgrade`);
  }
}
