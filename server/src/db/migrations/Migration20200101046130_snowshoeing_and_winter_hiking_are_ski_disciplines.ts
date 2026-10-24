import { columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * SKI-02: snowshoeing and winter hiking are disciplines of a ski and winter
 * tour, no longer a winter label on a hike. A hike is summer only.
 *
 * `tours.winter_activity` (045500) and `collection_tours.winter_activity`
 * (046100) go. A hike that carried the label stays a hike, without it:
 * turning it into a ski tour would drop its routed legs, and nothing routes
 * or times by the label.
 *
 * `tours.ski_discipline` (045520) takes the six disciplines. SQLite cannot
 * change a CHECK in place, and rebuilding `tours` would mean rebuilding every
 * table that references it, so the column is added again instead: its values
 * wait in a plain helper column, the old column goes, the new one comes with
 * the new CHECK and takes them back. Nothing indexes the column or names it in
 * another constraint, so the drop is allowed. The column now sits last in the
 * table, which the generated entity and table types follow.
 */
export class Migration20200101046130_snowshoeing_and_winter_hiking_are_ski_disciplines extends Migration {
  override name = 'Migration20200101046130_snowshoeing_and_winter_hiking_are_ski_disciplines';

  override async up(): Promise<void> {
    if ((await columnNames(this, 'tours')).has('winter_activity')) {
      this.addSql('ALTER TABLE tours DROP COLUMN winter_activity');
    }
    if ((await columnNames(this, 'collection_tours')).has('winter_activity')) {
      this.addSql('ALTER TABLE collection_tours DROP COLUMN winter_activity');
    }

    this.addSql('ALTER TABLE tours ADD COLUMN ski_discipline_kept TEXT');
    this.addSql('UPDATE tours SET ski_discipline_kept = ski_discipline');
    this.addSql('ALTER TABLE tours DROP COLUMN ski_discipline');
    this.addSql(
      "ALTER TABLE tours ADD COLUMN ski_discipline TEXT CHECK (ski_discipline IS NULL OR ski_discipline IN ('alpine', 'snowboard', 'cross_country', 'touring', 'snowshoe', 'winter_hike'))",
    );
    this.addSql('UPDATE tours SET ski_discipline = ski_discipline_kept');
    this.addSql('ALTER TABLE tours DROP COLUMN ski_discipline_kept');
  }
}
