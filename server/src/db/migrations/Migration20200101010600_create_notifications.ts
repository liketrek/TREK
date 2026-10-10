import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 66 (`db/migrations.ts`).
 */
export class Migration20200101010600_create_notifications extends Migration {
  override name = 'Migration20200101010600_create_notifications';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('simple', 'boolean', 'navigate')),
        scope TEXT NOT NULL CHECK(scope IN ('trip', 'user', 'admin')),
        target INTEGER NOT NULL,
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title_key TEXT NOT NULL,
        title_params TEXT DEFAULT '{}',
        text_key TEXT NOT NULL,
        text_params TEXT DEFAULT '{}',
        positive_text_key TEXT,
        negative_text_key TEXT,
        positive_callback TEXT,
        negative_callback TEXT,
        response TEXT CHECK(response IN ('positive', 'negative')),
        navigate_text_key TEXT,
        navigate_target TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC)`,
    );

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC)`,
    );
  }
}
