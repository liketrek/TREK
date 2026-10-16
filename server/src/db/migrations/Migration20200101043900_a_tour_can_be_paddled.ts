import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-01: a tour can be a paddle tour. The type is the `kayak` key that
 * `tour_types` has carried, disabled, since every contract type was seeded;
 * it is switched on here, and the app calls it a paddle tour. Its routing
 * profile stays NULL: a paddle tour is drawn by hand, leg by leg.
 *
 * The boat and the water are columns of the tour, NULL on every other type,
 * so no existing tour changes its meaning. `paddle_speed_kmh` is the speed the
 * paddler chose; NULL means the boat's suggested speed applies.
 */
export class Migration20200101043900_a_tour_can_be_paddled extends Migration {
  override name = 'Migration20200101043900_a_tour_can_be_paddled';

  override up(): void {
    this.addSql(
      "ALTER TABLE tours ADD COLUMN boat_type TEXT CHECK (boat_type IS NULL OR boat_type IN ('kayak', 'canoe', 'sup', 'other'))",
    );
    this.addSql(
      "ALTER TABLE tours ADD COLUMN water_context TEXT CHECK (water_context IS NULL OR water_context IN ('river', 'lake'))",
    );
    this.addSql('ALTER TABLE tours ADD COLUMN paddle_speed_kmh REAL');
    this.addSql("UPDATE tour_types SET enabled = 1, icon = 'Sailboat' WHERE key = 'kayak'");
  }
}
