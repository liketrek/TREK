import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 73 (`db/migrations.ts`).
 */
export class Migration20200101011300_trip_photos_add_album_link_id extends Migration {
  override name = 'Migration20200101011300_trip_photos_add_album_link_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'trip_photos',
      'album_link_id',
      `album_link_id INTEGER REFERENCES trip_album_links(id) ON DELETE SET NULL DEFAULT NULL`,
    );

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_photos_album_link ON trip_photos(album_link_id)`);
  }
}
