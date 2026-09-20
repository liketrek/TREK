import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 235 (`db/migrations.ts`).
 *
 * A journal skeleton belongs to a day, not just to a place (#2329).
 *
 * The sync engine keyed a skeleton by `source_place_id` alone, so the same place
 * standing on two days — the city you land in at dusk and walk through the next
 * morning, the hotel you sleep in three nights — produced one entry on the first
 * of them and nothing on the rest. There was nowhere to put the second evening's
 * photographs but the first evening's entry.
 *
 * The assignment row, not the day, is the missing half of that key: moving a
 * stop to another day updates `day_assignments.day_id` in place, so keying on
 * the assignment lets an entry follow the move the way it always has, while
 * still telling two days of the same place apart.
 *
 * Deliberately no REFERENCES clause. Unassigning a stop has to leave the id
 * stale rather than NULL, because reconciliation reads a key that no longer
 * matches as "this stop left the plan" — which is what happened — and a NULL
 * would be indistinguishable from a row this migration could not resolve. The id
 * is safe to dangle: `day_assignments.id` is AUTOINCREMENT, so it is never
 * handed out twice.
 *
 * Existing rows are backfilled to the place's earliest assignment, which is the
 * one the old engine would have picked, so reconciliation matches what is
 * already there instead of writing a duplicate beside it.
 */
export class Migration20200101035500_a_journal_skeleton_belongs_to_a_day extends Migration {
  override name = 'Migration20200101035500_a_journal_skeleton_belongs_to_a_day';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journey_entries', 'source_assignment_id', `source_assignment_id INTEGER`);

    // `source_assignment_id IS NULL` keeps the replay from re-resolving a row
    // that has since followed its stop to another day.
    await this.execute(`
      UPDATE journey_entries
         SET source_assignment_id = (
           SELECT da.id
             FROM day_assignments da
             JOIN days d ON d.id = da.day_id
            WHERE da.place_id = journey_entries.source_place_id
            ORDER BY d.day_number ASC, d.date ASC, da.order_index ASC, da.id ASC
            LIMIT 1
         )
       WHERE source_place_id IS NOT NULL AND source_assignment_id IS NULL
    `);
    await this.execute(
      `CREATE INDEX IF NOT EXISTS idx_journey_entries_source_assignment ON journey_entries(source_place_id, source_assignment_id)`,
    );
  }
}
