import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-05A: the paddle obstacles TREK reads out of regional OpenStreetMap
 * extracts (Geofabrik), held per region.
 *
 * `paddle_regions` is one extract an admin chose: its Geofabrik id, its name
 * and boundary (the area the data covers, so a tour outside every region is
 * told so rather than shown as free of obstacles), the state of the last read
 * and the date of the data in it.
 *
 * `paddle_features` is one OSM object the read kept: its OSM reference
 * (`node/…`, `way/…`) within its region, what kind of obstacle or access it
 * is, the objects of one lock grouped under a shared key, its own geometry as
 * JSON (a weir across a river stays a line), the tags it was judged by and a
 * hash of them, so a later read can tell a changed object from an unchanged
 * one. The bounding box columns let a map view ask for its area without
 * reading the JSON. A region's rows go with it.
 */
export class Migration20200101044100_paddle_obstacles_from_openstreetmap extends Migration {
  override name = 'Migration20200101044100_paddle_obstacles_from_openstreetmap';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS paddle_regions (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        boundary TEXT,
        min_lat REAL,
        min_lng REAL,
        max_lat REAL,
        max_lng REAL,
        status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'importing', 'ready', 'failed')),
        source_timestamp TEXT,
        imported_at DATETIME,
        feature_count INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(`
      CREATE TABLE IF NOT EXISTS paddle_features (
        id INTEGER PRIMARY KEY,
        region_id TEXT NOT NULL REFERENCES paddle_regions(id) ON DELETE CASCADE,
        osm_ref TEXT NOT NULL,
        kind TEXT NOT NULL,
        group_key TEXT,
        name TEXT,
        geometry TEXT NOT NULL,
        tags TEXT NOT NULL,
        tag_hash TEXT NOT NULL,
        min_lat REAL NOT NULL,
        min_lng REAL NOT NULL,
        max_lat REAL NOT NULL,
        max_lng REAL NOT NULL
      )
    `);
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_paddle_features_region_ref ON paddle_features(region_id, osm_ref)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_paddle_features_box ON paddle_features(min_lat, max_lat, min_lng, max_lng)',
    );
  }
}
