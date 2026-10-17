import { Migration } from '@mikro-orm/migrations';

/**
 * A tour planned from an imported one (a GPX file or a wanderer snapshot,
 * re-routed through control points taken from its track) remembers which import
 * it came from, so the tour can say so. The import stays as it was; deleting it
 * leaves the derived tour standing and only forgets where it came from.
 */
export class Migration20200101043600_a_tour_remembers_the_import_it_was_derived_from extends Migration {
  override name = 'Migration20200101043600_a_tour_remembers_the_import_it_was_derived_from';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN derived_from_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_tours_derived_from_place_id ON tours(derived_from_place_id) WHERE derived_from_place_id IS NOT NULL',
    );
  }
}
