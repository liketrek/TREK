import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 201 (`db/migrations.ts`).
 *
 * `naver_list_import` was typed 'trip', but a trip addon is one that earns its
 * own tab inside a trip — this one has no tab (it is not in tripTabs.ts) and no
 * page. It calls an external service to pull places into the sidebar, which is
 * exactly what 'integration' means here.
 *
 * The type is presentational: only `type === 'global'` is read anywhere (client
 * navItems.ts), so this moves the tile between admin groups and changes nothing
 * about how the import behaves.
 */
export class Migration20200101032100_naver_list_import_was_typed_trip_but extends Migration {
  override name = 'Migration20200101032100_naver_list_import_was_typed_trip_but';

  override up(): void {
    this.addSql(`UPDATE addons SET type = 'integration' WHERE id = 'naver_list_import'`);
  }
}
