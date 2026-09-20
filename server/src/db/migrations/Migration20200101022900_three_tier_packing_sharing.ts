import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 149 (`db/migrations.ts`).
 *
 * Three-tier packing sharing (#858 follow-up): an item is Common (is_private=0,
 * every existing item — non-breaking), Personal (is_private=1, owner only) or
 * Shared-with-people (is_private=1 + recipient rows). owner_id is the "bringer".
 * Contributors are extra people who said "I can bring that too" on a Common item
 * (status 'pending' until the owner accepts).
 */
export class Migration20200101022900_three_tier_packing_sharing extends Migration {
  override name = 'Migration20200101022900_three_tier_packing_sharing';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS packing_item_recipients (
        item_id INTEGER NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_packing_item_recipients_user ON packing_item_recipients(user_id)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS packing_item_contributors (
        item_id INTEGER NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'accepted',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (item_id, user_id)
      )
    `);
  }
}
