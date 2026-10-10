import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 97 (`db/migrations.ts`).
 *
 * Migration 91: Journey share tokens
 */
export class Migration20200101013700_journey_share_tokens extends Migration {
  override name = 'Migration20200101013700_journey_share_tokens';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_share_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_by INTEGER NOT NULL,
        share_timeline INTEGER DEFAULT 1,
        share_gallery INTEGER DEFAULT 1,
        share_map INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_share_journey ON journey_share_tokens(journey_id)`);
  }
}
