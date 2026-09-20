import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 225 (`db/migrations.ts`).
 *
 * Where an Atlas country came from (#2279). Everything that exists today was
 * marked by hand, so 'manual' is the correct backfill rather than a guess;
 * countries confirmed out of a recording are written as 'dawarich' and the
 * Atlas can say so. Unmarking still deletes the row either way.
 */
export class Migration20200101034500_where_an_atlas_country_came_from extends Migration {
  override name = 'Migration20200101034500_where_an_atlas_country_came_from';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'visited_countries', 'source', `source TEXT NOT NULL DEFAULT 'manual'`);
  }
}
