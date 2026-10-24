import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 81 (`db/migrations.ts`).
 *
 * Migration 74: Add quantity to packing_items + user_id to packing_bags +
 * bag_members table. The single `user_id` becomes the first row of the new
 * membership table; the column itself stays for the steps that still read it.
 */
export class Migration20200101012100_add_quantity_to_packing_items_user_id extends Migration {
  override name = 'Migration20200101012100_add_quantity_to_packing_items_user_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'packing_items', 'quantity', `quantity INTEGER NOT NULL DEFAULT 1`);
    await addColumnIfMissing(
      this,
      'packing_bags',
      'user_id',
      `user_id INTEGER REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL`,
    );

    await this.execute(`
      CREATE TABLE IF NOT EXISTS packing_bag_members (
        bag_id INTEGER NOT NULL REFERENCES packing_bags(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (bag_id, user_id)
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_packing_bag_members_bag ON packing_bag_members(bag_id)`);

    const bagsWithUser = (await this.execute(`SELECT id, user_id FROM packing_bags WHERE user_id IS NOT NULL`)) as {
      id: number;
      user_id: number;
    }[];
    for (const bag of bagsWithUser) {
      await this.execute(`INSERT OR IGNORE INTO packing_bag_members (bag_id, user_id) VALUES (?, ?)`, [
        bag.id,
        bag.user_id,
      ]);
    }
  }
}
