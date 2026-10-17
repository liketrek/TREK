import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 184 (`db/migrations.ts`).
 *
 * Manual GPX track colour (#776): imported tracks all render in the same blue
 * because the importer never assigns a category, so several walks in the same
 * area are indistinguishable. NULL keeps the old behaviour (category colour,
 * then the #3b82f6 fallback) for every existing row.
 */
export class Migration20200101030400_manual_gpx_track_colour extends Migration {
  override name = 'Migration20200101030400_manual_gpx_track_colour';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'route_color', `route_color TEXT`);
  }
}
