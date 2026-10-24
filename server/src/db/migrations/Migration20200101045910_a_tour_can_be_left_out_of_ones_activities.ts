import { Migration } from '@mikro-orm/migrations';

/**
 * STA-02: a user can leave a tour out of their own activity sums in the Atlas,
 * a tour that fell through, without touching the tour: its line, its days and
 * its measures stay as they are, and nobody else's sums change. One row per
 * user and tour (`UNIQUE(user_id, place_id)`); deleting either takes the row
 * with it.
 */
export class Migration20200101045910_a_tour_can_be_left_out_of_ones_activities extends Migration {
  override name = 'Migration20200101045910_a_tour_can_be_left_out_of_ones_activities';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_activity_exclusions (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        place_id INTEGER NOT NULL REFERENCES tours(place_id) ON DELETE CASCADE,
        excluded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, place_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_activity_exclusions_place ON tour_activity_exclusions(place_id)');
  }
}
