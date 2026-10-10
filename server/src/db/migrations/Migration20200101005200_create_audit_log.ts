import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 52 (`db/migrations.ts`).
 */
export class Migration20200101005200_create_audit_log extends Migration {
  override name = 'Migration20200101005200_create_audit_log';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource TEXT,
        details TEXT,
        ip TEXT
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC)`);
  }
}
