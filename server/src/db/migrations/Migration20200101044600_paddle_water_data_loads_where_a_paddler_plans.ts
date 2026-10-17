import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-11C: TREK fetches the water data of a place a paddler plans in by
 * itself. `paddle_regions.origin` says who added a region: an admin by hand
 * (`admin`, every region before this) or TREK for a paddler (`auto`), which
 * also counts against the few a day it may add.
 *
 * `paddle_region_requests` holds a region that waits for an admin instead:
 * the mode asks for it, it is larger than allowed or the day's few are used
 * up (`reason`). It keeps the size Geofabrik announced, the name of whoever
 * asked (as it read then; no link to the account, a request outlives it) and
 * when, and whether an admin declined it (then it is not asked for again). A
 * request goes once its region is added.
 */
export class Migration20200101044600_paddle_water_data_loads_where_a_paddler_plans extends Migration {
  override name = 'Migration20200101044600_paddle_water_data_loads_where_a_paddler_plans';

  override up(): void {
    this.addSql(
      `ALTER TABLE paddle_regions ADD COLUMN origin TEXT NOT NULL DEFAULT 'admin' CHECK (origin IN ('admin', 'auto'))`,
    );
    this.addSql(`
      CREATE TABLE IF NOT EXISTS paddle_region_requests (
        region_id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        reason TEXT NOT NULL CHECK (reason IN ('ask', 'too_large', 'limit')),
        bytes INTEGER,
        requested_by TEXT,
        requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        declined_at DATETIME
      )
    `);
  }
}
