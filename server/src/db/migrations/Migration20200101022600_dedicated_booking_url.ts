import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 146 (`db/migrations.ts`).
 *
 * Dedicated booking URL (#935) — users previously stuffed links into notes.
 * Additive nullable TEXT; existing rows default to NULL.
 */
export class Migration20200101022600_dedicated_booking_url extends Migration {
  override name = 'Migration20200101022600_dedicated_booking_url';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'url', `url TEXT`);
  }
}
