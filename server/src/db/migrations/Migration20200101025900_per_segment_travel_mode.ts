import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 179 (`db/migrations.ts`).
 *
 * Per-segment travel mode (#1281): the day-plan route can use a different
 * transport mode for each leg. leg_transport_mode on an assignment is the mode
 * of the leg LEAVING that stop (NULL = inherit the day default); days gains a
 * persisted default_transport_mode so the whole-day choice survives a reload.
 * Both nullable → existing itineraries keep today's single-mode behaviour.
 */
export class Migration20200101025900_per_segment_travel_mode extends Migration {
  override name = 'Migration20200101025900_per_segment_travel_mode';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'leg_transport_mode', `leg_transport_mode TEXT`);

    await addColumnIfMissing(this, 'days', 'default_transport_mode', `default_transport_mode TEXT`);
  }
}
