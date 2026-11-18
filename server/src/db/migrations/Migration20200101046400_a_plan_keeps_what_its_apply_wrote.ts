import { Migration } from '@mikro-orm/migrations';

/**
 * AI travel plans (China MVP), phase 3: an applied plan keeps the ids of the
 * rows its apply wrote.
 *
 * `apply_result_json` holds the mode, the target trip and the day / place /
 * assignment ids the write created. Nothing writes it before an explicit
 * apply; a `new_trip` undo reads it to delete the trip that apply created, and
 * an `existing_trip` apply reports the ids a person would have to remove by
 * hand. Nullable: every plan created before this phase, and every plan never
 * applied, has no result.
 */
export class Migration20200101046400_a_plan_keeps_what_its_apply_wrote extends Migration {
  override name = 'Migration20200101046400_a_plan_keeps_what_its_apply_wrote';

  override up(): void {
    this.addSql('ALTER TABLE ai_travel_plans ADD COLUMN apply_result_json TEXT');
  }
}
