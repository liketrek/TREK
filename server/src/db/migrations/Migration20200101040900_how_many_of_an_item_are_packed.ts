import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 248 (`db/migrations.ts`).
 *
 * How many of an item are packed so far (#2296), for "7 of 10 shirts". NULL is
 * the plain checkbox every item has had, and `checked` stays the answer to
 * "done?".
 */
export class Migration20200101040900_how_many_of_an_item_are_packed extends Migration {
  override name = 'Migration20200101040900_how_many_of_an_item_are_packed';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'packing_items', 'packed_quantity', `packed_quantity INTEGER`);
  }
}
