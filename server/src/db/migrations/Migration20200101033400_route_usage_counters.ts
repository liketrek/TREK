import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 214 (`db/migrations.ts`).
 *
 * Route usage counters — how much routing this instance really does.
 * Daily aggregates, not a log: one row per day, profile, surface and engine
 * kind, carrying totals. No query, no coordinate, no route, no user, no trip.
 * The question they answer is whether TREK could host a router itself, and
 * that needs volume, not itineraries.
 * The table is created regardless of the switch, like the shadow log above:
 * the switch decides whether rows are written, and a schema that appears only
 * when a feature is on is a schema that differs between installs.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101033400_route_usage_counters extends Migration {
  override name = 'Migration20200101033400_route_usage_counters';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS route_usage_daily (
        day TEXT NOT NULL,
        profile TEXT NOT NULL,
        surface TEXT NOT NULL,
        self_hosted INTEGER NOT NULL,
        requests INTEGER NOT NULL DEFAULT 0,
        waypoints INTEGER NOT NULL DEFAULT 0,
        km REAL NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (day, profile, surface, self_hosted)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_route_usage_day ON route_usage_daily(day)`);
  }
}
