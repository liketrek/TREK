import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 28 (`db/migrations.ts`).
 */
export class Migration20200101002800_create_collab_message_reactions extends Migration {
  override name = 'Migration20200101002800_create_collab_message_reactions';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS collab_message_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL REFERENCES collab_messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id, emoji)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collab_reactions_msg ON collab_message_reactions(message_id)`);
  }
}
