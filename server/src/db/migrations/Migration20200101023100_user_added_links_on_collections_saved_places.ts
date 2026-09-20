import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 151 (`db/migrations.ts`).
 *
 * Migration 151: user-added links on collections + saved places (JSON text)
 */
export class Migration20200101023100_user_added_links_on_collections_saved_places extends Migration {
  override name = 'Migration20200101023100_user_added_links_on_collections_saved_places';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'collections', 'links', `links TEXT`);

    await addColumnIfMissing(this, 'collection_places', 'links', `links TEXT`);
  }
}
