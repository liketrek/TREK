import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 186 (`db/migrations.ts`).
 *
 * Free the `note` column on budget items for its actual purpose (#1658). The
 * costs UI stores an itemized receipt in it as `TICKETJSON:{...}`, which means an
 * expense split by receipt can never carry a written note, and saving an expense
 * any other way wipes whatever was typed in the budget table. The receipt moves
 * to its own column and note becomes text again.
 *
 * GLOB, not LIKE: LIKE is case-insensitive in SQLite, so a hand-written note
 * starting "ticketjson:" would be chopped up and its text dropped.
 */
export class Migration20200101030600_free_the_note_column_on_budget_items extends Migration {
  override name = 'Migration20200101030600_free_the_note_column_on_budget_items';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'budget_items', 'ticket_json', `ticket_json TEXT`);
    await this.execute(`
      UPDATE budget_items
         SET ticket_json = substr(note, 12), note = NULL
       WHERE note GLOB 'TICKETJSON:*'
    `);
  }
}
