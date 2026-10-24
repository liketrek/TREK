import { Migration } from '@mikro-orm/migrations';

/**
 * LIB-03: a collection keeps whole tours beside its places. Each row is an
 * independent snapshot of a tour as it was saved: the line, the type, every
 * measure and setting of the `tours` facet, and its control points as one
 * JSON array in route order. Nothing points back at the tour it came from;
 * the trip's title and the tour's name are kept as text, as written then,
 * because the trip may be deleted, renamed or out of a member's reach later.
 * `saved_by` names who kept it and turns unknown when that account goes. The
 * rows go with their collection.
 */
export class Migration20200101046100_a_collection_keeps_whole_tours extends Migration {
  override name = 'Migration20200101046100_a_collection_keeps_whole_tours';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_tours (
        id INTEGER PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        saved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT,
        website TEXT,
        route_geometry TEXT,
        waypoints TEXT NOT NULL,
        tour_type TEXT NOT NULL REFERENCES tour_types(key),
        distance REAL,
        elevation_gain REAL,
        elevation_loss REAL,
        duration REAL,
        planned_duration_minutes INTEGER,
        break_additional_minutes INTEGER,
        difficulty TEXT,
        wanderer_ref TEXT,
        match_confidence REAL,
        max_hiking_difficulty INTEGER,
        bike_profile TEXT,
        winter_activity TEXT,
        run_profile TEXT,
        run_pace_seconds_per_km INTEGER,
        ski_discipline TEXT,
        ski_technique TEXT,
        boat_type TEXT,
        water_context TEXT,
        paddle_speed_kmh REAL,
        portage_speed_kmh REAL,
        paddle_lake_style TEXT,
        track_marks TEXT,
        hiking_preferences TEXT,
        origin TEXT NOT NULL,
        origin_file_name TEXT,
        track_started_at DATETIME,
        track_ended_at DATETIME,
        source_trip_title TEXT NOT NULL,
        source_tour_name TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_tours_collection ON collection_tours(collection_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_tours_saved_by ON collection_tours(saved_by)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_collection_tours_tour_type ON collection_tours(tour_type)');
  }
}
