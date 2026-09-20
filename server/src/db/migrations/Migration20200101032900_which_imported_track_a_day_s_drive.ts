import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 209 (`db/migrations.ts`).
 *
 * Which imported track a day's drive was fitted to.
 * The vias alone already make the day follow it, so this stores nothing the drive
 * needs — it stores what the traveller needs: the name of the road they chose, still
 * on the day after a reload, and something to re-fit against when the stops change.
 * One row per day, hence `day_id` as the key: a day follows one road or none. The
 * cascade on `place_id` is the point of the foreign key — delete the imported track
 * and the label goes with it, rather than leaving a day claiming to follow a line
 * nobody can see any more. The vias it laid down stay, because they are the drive.
 * `stray_km` is how far the fitted route still ran from the track at its worst point,
 * kept so the day can say how good a fit it is without routing again.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032900_which_imported_track_a_day_s_drive extends Migration {
  override name = 'Migration20200101032900_which_imported_track_a_day_s_drive';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS roadtrip_day_tracks (
        day_id INTEGER PRIMARY KEY REFERENCES days(id) ON DELETE CASCADE,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        stray_km REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_roadtrip_day_tracks_place ON roadtrip_day_tracks(place_id)`);
  }
}
