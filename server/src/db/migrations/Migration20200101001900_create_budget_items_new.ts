import { tableSql } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 19 (`db/migrations.ts`).
 *
 * Drops the `NOT NULL DEFAULT 1` on `budget_items.persons`/`days` so an expense
 * can leave them unset. SQLite cannot alter a column default, hence the rebuild;
 * it only fires on databases whose stored DDL still carries the old constraint.
 *
 * The legacy step matched the bare string `NOT NULL DEFAULT 1` anywhere in the
 * table's DDL. That is narrowed here to the two columns it is actually about:
 * step 132 later adds `exchange_rate REAL NOT NULL DEFAULT 1`, so the loose test
 * reports true on a fully-migrated table and the 10-column rebuild below then
 * fails against its 17 columns. The legacy runner never hit that because
 * `schema_version` stopped the step re-running; nothing gates it here.
 */
export class Migration20200101001900_create_budget_items_new extends Migration {
  override name = 'Migration20200101001900_create_budget_items_new';

  override async up(): Promise<void> {
    const sql = await tableSql(this, 'budget_items');
    if (!sql || !/\bpersons\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+1/i.test(sql)) return;

    await this.execute(`
      CREATE TABLE budget_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        category TEXT NOT NULL DEFAULT 'Other',
        name TEXT NOT NULL,
        total_price REAL NOT NULL DEFAULT 0,
        persons INTEGER DEFAULT NULL,
        days INTEGER DEFAULT NULL,
        note TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.execute(`INSERT INTO budget_items_new SELECT * FROM budget_items`);
    await this.execute(`DROP TABLE budget_items`);
    await this.execute(`ALTER TABLE budget_items_new RENAME TO budget_items`);
  }
}
