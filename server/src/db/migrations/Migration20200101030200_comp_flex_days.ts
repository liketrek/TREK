import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 182 (`db/migrations.ts`).
 *
 * Comp/Flex days (#1074): a vacay entry is either a vacation day (counts toward
 * the entitlement) or a comp/flex day (kind='comp', costs 0 — flextime/overtime
 * offset). Orthogonal to fraction, so a half comp day is kind='comp' + fraction=0.5.
 */
export class Migration20200101030200_comp_flex_days extends Migration {
  override name = 'Migration20200101030200_comp_flex_days';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'vacay_entries', 'kind', `kind TEXT NOT NULL DEFAULT 'vacation'`);
  }
}
