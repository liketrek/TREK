import { Migration } from '@mikro-orm/migrations';

/**
 * HIK-01: a hike can carry a winter label, winter hiking or snowshoeing. It
 * is a column of the tour, NULL on every tour saved before and on every other
 * type, so no existing tour changes, and nothing routes or times by it.
 */
export class Migration20200101045500_a_hike_can_be_marked_as_a_winter_activity extends Migration {
  override name = 'Migration20200101045500_a_hike_can_be_marked_as_a_winter_activity';

  override up(): void {
    this.addSql(
      "ALTER TABLE tours ADD COLUMN winter_activity TEXT CHECK (winter_activity IS NULL OR winter_activity IN ('winter_hike', 'snowshoe'))",
    );
  }
}
