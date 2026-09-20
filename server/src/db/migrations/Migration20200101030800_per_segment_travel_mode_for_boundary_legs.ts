import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 188 (`db/migrations.ts`).
 *
 * Per-segment travel mode for boundary legs: a leg whose ORIGIN is not a place
 * (booking arrival, morning hotel) stores its mode on the DESTINATION stop.
 * NULL = inherit the day default. INERT whenever the previous timeline element
 * is itself a place (that place's outgoing leg_transport_mode wins).
 * Appended LAST: the array is index-addressed against schema_version, so a slot
 * inserted anywhere above this line is simply skipped on every existing database.
 */
export class Migration20200101030800_per_segment_travel_mode_for_boundary_legs extends Migration {
  override name = 'Migration20200101030800_per_segment_travel_mode_for_boundary_legs';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'day_assignments',
      'incoming_leg_transport_mode',
      `incoming_leg_transport_mode TEXT`,
    );
  }
}
