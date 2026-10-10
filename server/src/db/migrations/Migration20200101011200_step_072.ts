import { columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 72 (`db/migrations.ts`).
 *
 * The Immich-only column names become provider-neutral ones. A database that
 * already went through step 67/68 is left alone.
 */
export class Migration20200101011200_step_072 extends Migration {
  override name = 'Migration20200101011200_step_072';

  override async up(): Promise<void> {
    const names = await columnNames(this, 'trip_photos');
    if (names.has('asset_id') && !names.has('immich_asset_id')) return;

    await this.execute('ALTER TABLE `trip_photos` RENAME COLUMN immich_asset_id TO asset_id');
    await this.execute('ALTER TABLE `trip_photos` ADD COLUMN provider TEXT NOT NULL DEFAULT "immich"');
    await this.execute('ALTER TABLE `trip_album_links` ADD COLUMN provider TEXT NOT NULL DEFAULT "immich"');
    await this.execute('ALTER TABLE `trip_album_links` RENAME COLUMN immich_album_id TO album_id');
  }
}
