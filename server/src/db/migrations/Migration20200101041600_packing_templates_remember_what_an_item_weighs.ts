import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 255 (`db/migrations.ts`).
 *
 * Packing templates remember what an item weighs, how many of it go along and
 * which bag it lives in (#1131), so applying one does not mean typing all of
 * that in again. The bag is kept by name: bags belong to a trip.
 */
export class Migration20200101041600_packing_templates_remember_what_an_item_weighs extends Migration {
  override name = 'Migration20200101041600_packing_templates_remember_what_an_item_weighs';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'packing_template_items', 'weight_grams', `weight_grams INTEGER`);
    await addColumnIfMissing(this, 'packing_template_items', 'quantity', `quantity INTEGER NOT NULL DEFAULT 1`);
    await addColumnIfMissing(this, 'packing_template_items', 'bag_name', `bag_name TEXT`);
  }
}
