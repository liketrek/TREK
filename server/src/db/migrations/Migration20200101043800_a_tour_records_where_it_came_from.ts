import { Migration } from '@mikro-orm/migrations';

/**
 * Where a tour came from, recorded instead of read off its shape: planned in
 * TREK, imported from a GPX file (with the file's name) or copied in from
 * wanderer. Until now a list told a GPX import from a planned tour by whether it
 * had waypoints, which an import planned over in place no longer holds.
 *
 * The backfill is exact for every tour that can exist before this step: a
 * wanderer reference only comes from the wanderer import, and a tour without
 * stored waypoints, or one that keeps a recorded track, only from an import.
 * A GPX import's file name was never stored, so it stays unknown (NULL).
 */
export class Migration20200101043800_a_tour_records_where_it_came_from extends Migration {
  override name = 'Migration20200101043800_a_tour_records_where_it_came_from';

  override up(): void {
    this.addSql(
      "ALTER TABLE tours ADD COLUMN origin TEXT NOT NULL DEFAULT 'trek' CHECK (origin IN ('trek', 'gpx', 'wanderer'))",
    );
    this.addSql('ALTER TABLE tours ADD COLUMN origin_file_name TEXT');
    this.addSql("UPDATE tours SET origin = 'wanderer' WHERE wanderer_ref IS NOT NULL");
    this.addSql(
      "UPDATE tours SET origin = 'gpx' WHERE origin = 'trek' AND (recorded_route_geometry IS NOT NULL OR NOT EXISTS (SELECT 1 FROM tour_waypoints w WHERE w.place_id = tours.place_id))",
    );
  }
}
