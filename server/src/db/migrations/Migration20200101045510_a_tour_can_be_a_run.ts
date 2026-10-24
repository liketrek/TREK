import { Migration } from '@mikro-orm/migrations';

/**
 * RUN-01: a tour can be a run. The `run` key has been in `tour_types`,
 * disabled, since every contract type was seeded; it is switched on here. The
 * profile it is routed for and the pace the runner plans it at are columns of
 * the tour, NULL on every other type, so no existing tour changes its meaning.
 *
 * The profile list already holds trail running, which RUN-02 brings to the
 * contract: SQLite cannot widen a column's CHECK without rebuilding the table.
 * The pace is whole seconds per kilometre, from 2:00 to 20:00 min/km as the
 * contract takes it, NULL while the runner has entered none.
 */
export class Migration20200101045510_a_tour_can_be_a_run extends Migration {
  override name = 'Migration20200101045510_a_tour_can_be_a_run';

  override up(): void {
    this.addSql(
      "ALTER TABLE tours ADD COLUMN run_profile TEXT CHECK (run_profile IS NULL OR run_profile IN ('running', 'trail'))",
    );
    this.addSql(
      'ALTER TABLE tours ADD COLUMN run_pace_seconds_per_km INTEGER CHECK (run_pace_seconds_per_km IS NULL OR (run_pace_seconds_per_km >= 120 AND run_pace_seconds_per_km <= 1200))',
    );
    this.addSql("UPDATE tour_types SET enabled = 1 WHERE key = 'run'");
  }
}
