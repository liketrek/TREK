import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * #3092: how long the drive stands at a stop belongs to the visit, not to the
 * place. A place planned twice on one road trip day (once to stop, once only to
 * steer the route past it) could not be given two different stays, because the
 * only value was `places.duration_minutes`.
 *
 * `stay_minutes` is the visit's own length. It stays null on every existing row,
 * and a null visit keeps reading the place's `duration_minutes`, so a trip
 * planned before this step drives exactly as it did.
 */
export class Migration20200101046420_a_visit_keeps_its_own_stay extends Migration {
  override name = 'Migration20200101046420_a_visit_keeps_its_own_stay';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'stay_minutes', 'stay_minutes INTEGER');
  }
}
