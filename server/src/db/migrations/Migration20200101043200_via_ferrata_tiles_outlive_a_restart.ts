import { Migration } from '@mikro-orm/migrations';

/**
 * `ferrata_tiles` keeps what Overpass answered for one cell of the via
 * ferrata grid (0.05 degrees a side), so a restart does not send every map
 * pan back to the public mirrors.
 *
 * `tile_key` names the cell by its grid indices (`"<lat index>,<lng index>"`),
 * `payload` is the JSON of the cell's ferratas and whether the answer was cut,
 * and `fetched_at` is the epoch of that answer in seconds (not ms, so it fits
 * the 32-bit integer this column is on Postgres). Nothing references the
 * table and nothing deletes from it: an old cell is served and refreshed, not
 * dropped.
 */
export class Migration20200101043200_via_ferrata_tiles_outlive_a_restart extends Migration {
  override name = 'Migration20200101043200_via_ferrata_tiles_outlive_a_restart';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS ferrata_tiles (
        tile_key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        fetched_at INTEGER NOT NULL
      )
    `);
  }
}
