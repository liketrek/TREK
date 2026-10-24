import { Migration } from '@mikro-orm/migrations';

/**
 * MDT-01: a stop of a tour can end a stage, so one route planned whole splits
 * into the days of a multi-day tour, each stage running from one such stop to
 * the next. 0 or 1; every waypoint saved before ends none, and a tour without
 * one stays a day tour, as it was.
 */
export class Migration20200101046000_a_tour_waypoint_can_end_a_stage extends Migration {
  override name = 'Migration20200101046000_a_tour_waypoint_can_end_a_stage';

  override up(): void {
    this.addSql(
      `ALTER TABLE tour_waypoints ADD COLUMN stage_end INTEGER NOT NULL DEFAULT 0 CHECK (stage_end IN (0, 1))`,
    );
  }
}
