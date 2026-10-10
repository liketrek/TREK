import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 132 (`db/migrations.ts`).
 *
 * Costs rework (budget → "Costs", Tricount/Splitwise style). Adds, additively
 * and without touching existing rows:
 *  - per-expense currency + exchange_rate, so an expense can be entered in a
 *    foreign currency and converted to the trip base currency (NULL currency =
 *    base currency; rate 1.0). Closes the multi-currency request (#551).
 *  - budget_item_payers: several people can each have paid part of one expense
 *    (amounts in the expense currency), replacing the single paid_by_user_id.
 *  - budget_settlements: persisted "X paid Y" transfers so the settle-up history
 *    (with undo) is shared across all trip members.
 *
 * The equal-split participants stay in budget_item_members. The single legacy
 * payer is backfilled into budget_item_payers as one payer covering the total.
 */
export class Migration20200101021200_costs_rework extends Migration {
  override name = 'Migration20200101021200_costs_rework';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_items', 'currency', `currency TEXT`);
    await addColumnIfMissing(this, 'budget_items', 'exchange_rate', `exchange_rate REAL NOT NULL DEFAULT 1`);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS budget_item_payers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        budget_item_id INTEGER NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount REAL NOT NULL DEFAULT 0,
        UNIQUE(budget_item_id, user_id)
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_budget_item_payers_item ON budget_item_payers(budget_item_id)`);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS budget_settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by_user_id INTEGER REFERENCES users(id)
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_budget_settlements_trip ON budget_settlements(trip_id)`);

    // Backfill the legacy single payer: that person paid the full total of the
    // expense, in the (base) currency the existing amount was already stored in.
    // `paid_by_user_id` does not exist on every database — skip where it is absent.
    try {
      await this.execute(`
        INSERT OR IGNORE INTO budget_item_payers (budget_item_id, user_id, amount)
        SELECT id, paid_by_user_id, total_price
        FROM budget_items
        WHERE paid_by_user_id IS NOT NULL
      `);
    } catch (err: unknown) {
      if (!(err instanceof Error) || !err.message.includes('no such column')) throw err;
    }
  }
}
