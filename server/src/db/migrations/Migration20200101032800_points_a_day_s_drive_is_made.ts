import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 208 (`db/migrations.ts`).
 *
 * Points a day's drive is made to pass through, without being stops (#1797).
 * The difference is the whole point: a stop is somewhere you go, and it takes a
 * number in the chain, a place row, an arrival time and a line in the itinerary. A
 * via is none of that — it only bends the route, which is what "take the coast road
 * instead" means. Storing one as a place was the alternative, and it would have put a
 * numbered stop in the middle of the day for a spot nobody stops at.
 * Anchored to `after_order_index` rather than to an assignment id: a stop added
 * mid-day is written with a temporary negative id and swapped for the real one moments
 * later, so a foreign key to it would dangle. The index is what the routing request is
 * built from anyway.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032800_points_a_day_s_drive_is_made extends Migration {
  override name = 'Migration20200101032800_points_a_day_s_drive_is_made';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS roadtrip_vias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        after_order_index INTEGER NOT NULL,
        sequence INTEGER NOT NULL DEFAULT 0,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_roadtrip_vias_day ON roadtrip_vias(day_id, after_order_index, sequence)`,
    );
  }
}
