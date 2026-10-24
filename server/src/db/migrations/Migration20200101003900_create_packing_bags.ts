import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 39 (`db/migrations.ts`).
 */
export class Migration20200101003900_create_packing_bags extends Migration {
  override name = 'Migration20200101003900_create_packing_bags';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS packing_bags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1',
        weight_limit_grams INTEGER,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await addColumnIfMissing(this, 'packing_items', 'weight_grams', `weight_grams INTEGER`);

    await addColumnIfMissing(
      this,
      'packing_items',
      'bag_id',
      `bag_id INTEGER REFERENCES packing_bags(id) ON DELETE SET NULL`,
    );
  }
}
