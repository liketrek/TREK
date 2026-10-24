import { Migration } from '@mikro-orm/migrations';

/**
 * MDT-02: a day of the plan can hold one stage of a multi-day tour instead of
 * the whole tour, named by the key of the stop the stage starts at (the key a
 * save keeps for every point of a tour). NULL, as on every assignment made
 * before, is the whole tour or an ordinary place. The index finds the day a
 * stage is on, and the stages a changed tour no longer has.
 */
export class Migration20200101046010_a_day_can_hold_one_stage_of_a_tour extends Migration {
  override name = 'Migration20200101046010_a_day_can_hold_one_stage_of_a_tour';

  override up(): void {
    this.addSql(`ALTER TABLE day_assignments ADD COLUMN tour_stage_key TEXT`);
    this.addSql(
      `CREATE INDEX idx_day_assignments_tour_stage ON day_assignments (place_id, tour_stage_key) WHERE tour_stage_key IS NOT NULL`,
    );
  }
}
