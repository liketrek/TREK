import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 126 (`db/migrations.ts`).
 *
 * Swap inverted start_day_id/end_day_id pairs in day_accommodations caused
 * by the old Math.min/Math.max picker bug (pre-8e05ba7) which used raw IDs
 * instead of positional order on trips with non-monotonic day ID layouts.
 */
export class Migration20200101020600_swap_inverted_start_day_id_end_day extends Migration {
  override name = 'Migration20200101020600_swap_inverted_start_day_id_end_day';

  override up(): void {
    this.addSql(`
      UPDATE day_accommodations
      SET start_day_id = end_day_id, end_day_id = start_day_id
      WHERE (SELECT day_number FROM days WHERE id = start_day_id)
          > (SELECT day_number FROM days WHERE id = end_day_id)
    `);
  }
}
