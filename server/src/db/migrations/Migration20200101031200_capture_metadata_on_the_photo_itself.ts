import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 192 (`db/migrations.ts`).
 *
 * Capture metadata on the photo itself (#1614): when it was taken and where.
 * Both are needed before photos can sit on the Journey map by their own
 * coordinates, and before a gallery can be ordered by when a picture was taken
 * rather than when it happened to be added. Nullable throughout — most providers
 * answer with neither, and a photo without them is normal.
 */
export class Migration20200101031200_capture_metadata_on_the_photo_itself extends Migration {
  override name = 'Migration20200101031200_capture_metadata_on_the_photo_itself';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trek_photos', 'taken_at', `taken_at TEXT`);
    await addColumnIfMissing(this, 'trek_photos', 'lat', `lat REAL`);
    await addColumnIfMissing(this, 'trek_photos', 'lng', `lng REAL`);

    // Answering "which photos of this journey have coordinates" without a scan.
    await this.execute(
      `CREATE INDEX IF NOT EXISTS idx_trek_photos_geo ON trek_photos(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL`,
    );
  }
}
