import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 105 (`db/migrations.ts`).
 *
 * Migration 104: Passphrase support for Synology shared-album links (#689)
 */
export class Migration20200101014500_passphrase_support_for_synology_shared_album_links extends Migration {
  override name = 'Migration20200101014500_passphrase_support_for_synology_shared_album_links';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trip_album_links', 'passphrase', `passphrase TEXT DEFAULT NULL`);

    await addColumnIfMissing(this, 'trek_photos', 'passphrase', `passphrase TEXT DEFAULT NULL`);
  }
}
