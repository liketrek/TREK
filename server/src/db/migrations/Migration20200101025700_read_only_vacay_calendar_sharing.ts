import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 177 (`db/migrations.ts`).
 *
 * Read-only vacay calendar sharing (#444/#667): a user can let other users
 * view their vacation calendar without fusing plans. owner_id is the sharing
 * user, user_id the viewer; hidden lets the viewer hide the overlay without
 * removing the share. Follows the person, not the plan, so it survives
 * fusion and dissolution.
 */
export class Migration20200101025700_read_only_vacay_calendar_sharing extends Migration {
  override name = 'Migration20200101025700_read_only_vacay_calendar_sharing';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vacay_shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hidden INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (owner_id, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_vacay_shares_user ON vacay_shares (user_id)`);
  }
}
