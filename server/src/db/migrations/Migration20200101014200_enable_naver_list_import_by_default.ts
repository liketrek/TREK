import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 102 (`db/migrations.ts`).
 *
 * Migration 101: Enable naver_list_import by default.
 */
export class Migration20200101014200_enable_naver_list_import_by_default extends Migration {
  override name = 'Migration20200101014200_enable_naver_list_import_by_default';

  override up(): void {
    this.addSql(`UPDATE addons SET enabled = 1 WHERE id = 'naver_list_import'`);
  }
}
