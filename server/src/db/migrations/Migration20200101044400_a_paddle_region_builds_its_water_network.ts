import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-11: the water network a paddle region builds for routing, from the same
 * read as its obstacles. The network itself is a file in the data folder
 * (`file`, named after its revision `rev`, the first hex digits of its
 * hash); the row says where it is, how big it came out, when it was built,
 * what it holds (`stats`, JSON: kilometres of water, lakes, portages, gaps,
 * locks) and the box it covers, so a point finds its network without reading
 * the region. One row per region, gone with the region.
 */
export class Migration20200101044400_a_paddle_region_builds_its_water_network extends Migration {
  override name = 'Migration20200101044400_a_paddle_region_builds_its_water_network';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS paddle_water_graphs (
        region_id TEXT PRIMARY KEY REFERENCES paddle_regions(id) ON DELETE CASCADE,
        file TEXT NOT NULL,
        rev TEXT NOT NULL,
        bytes INTEGER NOT NULL,
        built_at DATETIME NOT NULL,
        stats TEXT NOT NULL,
        min_lat REAL NOT NULL,
        min_lng REAL NOT NULL,
        max_lat REAL NOT NULL,
        max_lng REAL NOT NULL
      )
    `);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_paddle_water_graphs_box ON paddle_water_graphs (min_lat, max_lat, min_lng, max_lng)`,
    );
  }
}
