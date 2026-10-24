import { Migration } from '@mikro-orm/migrations';

/**
 * P2D-XD-01: a tour points at the packing list of its trip, as a whole or at
 * one of its categories. The row only names what it points at: `category` is
 * NULL for the whole list, otherwise the category as its items carry it. The
 * items stay Packing's, so nothing here copies, owns or deletes one, and
 * removing the row leaves the list as it was. One link per tour, gone with
 * the tour; `linked_by` turns unknown when that account goes.
 */
export class Migration20200101046110_a_tour_points_at_its_packing_list extends Migration {
  override name = 'Migration20200101046110_a_tour_points_at_its_packing_list';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_packing_links (
        place_id INTEGER PRIMARY KEY REFERENCES tours(place_id) ON DELETE CASCADE,
        category TEXT,
        linked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        linked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_packing_links_linked_by ON tour_packing_links(linked_by)');
  }
}
