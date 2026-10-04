import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 257 (`db/migrations.ts`).
 *
 * A place's e-mail and its own opening hours, typed in by hand (#2472): the
 * search fills in what it knows, and these are for everything it does not.
 */
export class Migration20200101041800_a_place_s_e_mail_and_its extends Migration {
  override name = 'Migration20200101041800_a_place_s_e_mail_and_its';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'email', `email TEXT`);
    await addColumnIfMissing(this, 'places', 'opening_hours', `opening_hours TEXT`);
  }
}
