import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 125 (`db/migrations.ts`).
 *
 * #846: make sort_order authoritative within a day. The previous ORDER BY put
 * entry_time before sort_order, silently ignoring reorder clicks when two
 * same-date entries had different times. The backfill renumbers using the old
 * effective key (entry_time ASC, id ASC) so existing journeys keep their
 * current visual order.
 */
export class Migration20200101020500_846_make_sort_order_authoritative_within_a extends Migration {
  override name = 'Migration20200101020500_846_make_sort_order_authoritative_within_a';

  override up(): void {
    this.addSql(`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY journey_id, entry_date
                 ORDER BY entry_time ASC, id ASC
               ) - 1 AS rn
        FROM journey_entries
      )
      UPDATE journey_entries
      SET sort_order = (SELECT rn FROM ranked WHERE ranked.id = journey_entries.id)
    `);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_journey_entries_order ON journey_entries(journey_id, entry_date, sort_order)`,
    );
  }
}
