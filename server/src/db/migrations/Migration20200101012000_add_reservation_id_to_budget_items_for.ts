import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 80 (`db/migrations.ts`).
 *
 * Migration 73: Add reservation_id to budget_items for linking budget entries to reservations
 */
export class Migration20200101012000_add_reservation_id_to_budget_items_for extends Migration {
  override name = 'Migration20200101012000_add_reservation_id_to_budget_items_for';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'budget_items',
      'reservation_id',
      `reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL DEFAULT NULL`,
    );
  }
}
