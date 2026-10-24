import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 91 (`db/migrations.ts`).
 *
 * Migration 85: Journal — richer entry fields for magazine-style design
 */
export class Migration20200101013100_journal extends Migration {
  override name = 'Migration20200101013100_journal';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'highlight_tags', `highlight_tags TEXT`);

    await addColumnIfMissing(this, 'journey_entries', 'visibility', `visibility TEXT NOT NULL DEFAULT 'private'`);

    await addColumnIfMissing(this, 'journey_entries', 'hero_photo_id', `hero_photo_id TEXT`);

    await addColumnIfMissing(this, 'journey_entries', 'color_accent', `color_accent TEXT`);

    await addColumnIfMissing(this, 'journey_entries', 'place_name', `place_name TEXT`);

    await addColumnIfMissing(
      this,
      'journey_entries',
      'place_id',
      `place_id INTEGER REFERENCES places(id) ON DELETE SET NULL`,
    );

    await addColumnIfMissing(this, 'journey_entries', 'lat', `lat REAL`);

    await addColumnIfMissing(this, 'journey_entries', 'lng', `lng REAL`);

    await addColumnIfMissing(this, 'journey_checkins', 'photo_id', `photo_id TEXT`);

    await addColumnIfMissing(this, 'journey_photos', 'width', `width INTEGER`);

    await addColumnIfMissing(this, 'journey_photos', 'height', `height INTEGER`);
  }
}
