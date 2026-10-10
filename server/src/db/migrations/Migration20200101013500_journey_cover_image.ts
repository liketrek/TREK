import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 95 (`db/migrations.ts`).
 *
 * Migration 89: Journey cover image
 */
export class Migration20200101013500_journey_cover_image extends Migration {
  override name = 'Migration20200101013500_journey_cover_image';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journeys', 'cover_image', `cover_image TEXT`);
  }
}
