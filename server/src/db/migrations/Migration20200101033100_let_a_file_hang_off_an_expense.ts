import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 211 (`db/migrations.ts`).
 *
 * Let a file hang off an expense, so a receipt or an invoice can be attached to
 * what it paid for.
 *
 * A column on `file_links` rather than a table of its own: the row already ties
 * one file to one thing, and every other attachment kind is a column here too.
 * The unique index stops the same receipt being linked twice; SQLite treats
 * NULLs as distinct, so the rows that exist today, which all carry a NULL here,
 * do not collide with each other.
 *
 * SET NULL rather than CASCADE, unlike the three columns beside it, because
 * those predate the shared row: one row can carry a place link AND a receipt
 * link for the same file, and a cascade would delete the whole row when the
 * expense goes, silently detaching the file from the place as well. Deleting the
 * expense drops the receipt link and nothing else; the budget service removes
 * the row afterwards when it carries no other link.
 */
export class Migration20200101033100_let_a_file_hang_off_an_expense extends Migration {
  override name = 'Migration20200101033100_let_a_file_hang_off_an_expense';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'file_links',
      'budget_item_id',
      `budget_item_id INTEGER REFERENCES budget_items(id) ON DELETE SET NULL`,
    );
    await this.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_file_links_file_budget ON file_links(file_id, budget_item_id)`,
    );
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_file_links_budget_item_id ON file_links(budget_item_id)`);
  }
}
