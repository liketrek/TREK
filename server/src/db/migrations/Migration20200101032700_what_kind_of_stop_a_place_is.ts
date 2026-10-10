import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 207 (`db/migrations.ts`).
 *
 * What kind of stop a place is on a drive — fuel, charging, rest area, campsite.
 * Deliberately NOT a `categories` row. Those are the traveller's own list, editable
 * and instance-wide (`categories.service.ts` selects them without a user filter), so
 * seeding four road-trip kinds there would push them into everyone's dropdown and hand
 * their colour to whoever edits the list first. A refuelling stop is not a taste; it is
 * a fact about the place, and the road-trip categories already own its icon and colour
 * (`poiCategories.ts`).
 * Free text rather than a CHECK constraint: the set grows with what the corridor
 * search can look for, and SQLite cannot alter a constraint without rebuilding the
 * table. NULL means an ordinary place, which is every row that exists today.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032700_what_kind_of_stop_a_place_is extends Migration {
  override name = 'Migration20200101032700_what_kind_of_stop_a_place_is';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'stop_type', `stop_type TEXT`);
  }
}
