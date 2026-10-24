import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 27 (`db/migrations.ts`).
 */
export class Migration20200101002700_create_budget_item_members extends Migration {
  override name = 'Migration20200101002700_create_budget_item_members';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS budget_item_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_item_id INTEGER NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        paid INTEGER NOT NULL DEFAULT 0,
        UNIQUE(budget_item_id, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_budget_item_members_item ON budget_item_members(budget_item_id)`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_budget_item_members_user ON budget_item_members(user_id)`);
  }
}
