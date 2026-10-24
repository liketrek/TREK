import { Migration } from '@mikro-orm/migrations';

/**
 * BIK-01: a tour can be a bike tour. The `bike` key has been in `tour_types`,
 * disabled, since every contract type was seeded; it is switched on here. The
 * profile it is ridden on (touring, road, gravel, mtb) is a column of the
 * tour, NULL on every other type, so no existing tour changes its meaning.
 */
export class Migration20200101045200_a_tour_can_be_ridden extends Migration {
  override name = 'Migration20200101045200_a_tour_can_be_ridden';

  override up(): void {
    this.addSql(
      "ALTER TABLE tours ADD COLUMN bike_profile TEXT CHECK (bike_profile IS NULL OR bike_profile IN ('touring', 'road', 'gravel', 'mtb'))",
    );
    this.addSql("UPDATE tour_types SET enabled = 1 WHERE key = 'bike'");
  }
}
