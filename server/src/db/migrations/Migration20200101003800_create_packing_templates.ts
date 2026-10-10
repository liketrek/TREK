import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 38 (`db/migrations.ts`).
 */
export class Migration20200101003800_create_packing_templates extends Migration {
  override name = 'Migration20200101003800_create_packing_templates';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS packing_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS packing_template_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL REFERENCES packing_templates(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);

    await execBestEffort(this, `DROP TABLE IF EXISTS packing_template_items`);

    await this.execute(`
      CREATE TABLE packing_template_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES packing_template_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
  }
}
