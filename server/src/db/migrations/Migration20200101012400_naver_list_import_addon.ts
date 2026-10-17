import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 84 (`db/migrations.ts`).
 *
 * Naver list import addon (default off).
 */
export class Migration20200101012400_naver_list_import_addon extends Migration {
  override name = 'Migration20200101012400_naver_list_import_addon';

  override async up(): Promise<void> {
    await execBestEffort(
      this,
      `INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['naver_list_import', 'Naver List Import', 'Import places from shared Naver Maps lists', 'trip', 'Link2', 0, 13],
    );
  }
}
