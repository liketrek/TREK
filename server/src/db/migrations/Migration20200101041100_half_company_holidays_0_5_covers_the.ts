import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 250 (`db/migrations.ts`).
 *
 * Half company holidays (#2439): 0.5 covers the morning or afternoon and leaves
 * the other half open for a half vacation day. 1 is what every holiday was.
 */
export class Migration20200101041100_half_company_holidays_0_5_covers_the extends Migration {
  override name = 'Migration20200101041100_half_company_holidays_0_5_covers_the';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'vacay_company_holidays', 'fraction', `fraction REAL NOT NULL DEFAULT 1`);
  }
}
