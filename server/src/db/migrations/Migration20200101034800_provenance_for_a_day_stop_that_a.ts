import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 228 (`db/migrations.ts`).
 *
 * Provenance for a day stop that a lodging booking put there rather than the
 * traveller: it carries the stay's id, so moving or deleting the booking can
 * move or delete exactly that stop and never one somebody placed by hand.
 * Every row that already exists stays NULL: those were planned by hand, and a
 * booking must not start claiming ownership of them. The step below adds the
 * missing stops instead, which is a different thing from claiming old ones.
 */
export class Migration20200101034800_provenance_for_a_day_stop_that_a extends Migration {
  override name = 'Migration20200101034800_provenance_for_a_day_stop_that_a';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'accommodation_id', `accommodation_id INTEGER`);
  }
}
