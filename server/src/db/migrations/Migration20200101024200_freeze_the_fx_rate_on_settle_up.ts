import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 162 (`db/migrations.ts`).
 *
 * Freeze the FX rate on settle-up transfers too (#1445). budget_settlements
 * stored only a bare `amount` in whatever display currency the payer was
 * viewing, so a later live-rate drift re-opened an already-settled position
 * with a few-cent residual. Capture the display `currency` and the rate frozen
 * at settle time (units of that currency per 1 trip currency), mirroring the
 * budget_items columns. Legacy rows keep currency = NULL / rate = 1 and stay on
 * live rates until re-edited.
 */
export class Migration20200101024200_freeze_the_fx_rate_on_settle_up extends Migration {
  override name = 'Migration20200101024200_freeze_the_fx_rate_on_settle_up';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_settlements', 'currency', `currency TEXT`);

    await addColumnIfMissing(this, 'budget_settlements', 'exchange_rate', `exchange_rate REAL NOT NULL DEFAULT 1`);
  }
}
