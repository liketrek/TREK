import { Migration } from '@mikro-orm/migrations';

/**
 * P2C-03: the technical revision of a saved tour, raised by every write that
 * changes it. A write that names the revision it was based on is refused
 * while the tour has moved on, so a stale draft never overwrites a newer one
 * unseen. Every tour there is starts at 1; it is not the version of a source
 * a tour was imported from, which `tour_sources` keeps apart.
 */
export class Migration20200101044800_a_tour_counts_its_revisions extends Migration {
  override name = 'Migration20200101044800_a_tour_counts_its_revisions';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)');
  }
}
