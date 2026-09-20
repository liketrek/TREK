import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 83 (`db/migrations.ts`).
 *
 * Budget category ordering. Existing categories are seeded in alphabetical order
 * per trip, which is the order they were displayed in before this table existed.
 */
export class Migration20200101012300_budget_category_ordering extends Migration {
  override name = 'Migration20200101012300_budget_category_ordering';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS budget_category_order (
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (trip_id, category)
      )
    `);

    const rows = (await this.execute(
      `SELECT DISTINCT trip_id, category FROM budget_items ORDER BY trip_id, category`,
    )) as { trip_id: number; category: string }[];

    let lastTripId = -1;
    let index = 0;
    for (const row of rows) {
      if (row.trip_id !== lastTripId) {
        lastTripId = row.trip_id;
        index = 0;
      }
      await this.execute(
        `INSERT OR IGNORE INTO budget_category_order (trip_id, category, sort_order) VALUES (?, ?, ?)`,
        [row.trip_id, row.category, index++],
      );
    }
  }
}
