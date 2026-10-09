import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/** A Tour-owned manual total, separate from the route engine's duration. */
export class Migration20200101042700_tour_planned_total_duration extends Migration {
  override name = 'Migration20200101042700_tour_planned_total_duration';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'tours',
      'planned_duration_minutes',
      'planned_duration_minutes INTEGER CHECK(planned_duration_minutes BETWEEN 0 AND 1440)',
    );
  }
}
