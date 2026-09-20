import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 187 (`db/migrations.ts`).
 *
 * Note colours (#1629). A day note is a label as much as a reminder — "watch
 * out", "must see", "already booked" — and a wall of identical grey cards
 * makes that impossible to see at a glance. NULL keeps the neutral card
 * every existing note has today.
 */
export class Migration20200101030700_note_colours extends Migration {
  override name = 'Migration20200101030700_note_colours';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_notes', 'color', `color TEXT`);
  }
}
