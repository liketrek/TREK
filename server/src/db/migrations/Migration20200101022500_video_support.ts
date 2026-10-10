import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 145 (`db/migrations.ts`).
 *
 * Video support (#823): the trek_photos registry held only images. media_type
 * discriminates image vs video so the gallery, lightbox and provider proxy can
 * branch; duration_ms is optional metadata for the player. Additive — existing
 * rows default to 'image'.
 */
export class Migration20200101022500_video_support extends Migration {
  override name = 'Migration20200101022500_video_support';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trek_photos', 'media_type', `media_type TEXT NOT NULL DEFAULT 'image'`);
    await addColumnIfMissing(this, 'trek_photos', 'duration_ms', `duration_ms INTEGER`);
  }
}
