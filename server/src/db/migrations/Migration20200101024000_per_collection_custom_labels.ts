import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 160 (`db/migrations.ts`).
 *
 * Migration 160: per-collection custom labels (#collections). Each list owns
 * its own label set (unlike the instance-wide `tags` table), and a place can
 * carry several labels. Used for grouping + filtering places within a list.
 */
export class Migration20200101024000_per_collection_custom_labels extends Migration {
  override name = 'Migration20200101024000_per_collection_custom_labels';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_labels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6366f1',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_place_labels (
        collection_place_id INTEGER NOT NULL REFERENCES collection_places(id) ON DELETE CASCADE,
        label_id INTEGER NOT NULL REFERENCES collection_labels(id) ON DELETE CASCADE,
        PRIMARY KEY (collection_place_id, label_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collection_labels_collection ON collection_labels(collection_id)`);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_collection_place_labels_place ON collection_place_labels(collection_place_id)`,
    );

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collection_place_labels_label ON collection_place_labels(label_id)`);
  }
}
