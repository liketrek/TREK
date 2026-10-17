import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 233 (`db/migrations.ts`).
 *
 * Which of the optional entry fields a journey uses.
 *
 * Mood, weather and the pros/cons list are the three things that make the editor
 * feel like a form. Not everybody journals that way, and a journey kept by one
 * person for their family should be able to put them away without the fields
 * being taken from everybody else (discussion #2299).
 *
 * DEFAULT 1: every existing journey keeps all three, which is what it had.
 */
export class Migration20200101035300_which_of_the_optional_entry_fields_a extends Migration {
  override name = 'Migration20200101035300_which_of_the_optional_entry_fields_a';

  override async up(): Promise<void> {
    for (const column of ['show_verdict', 'show_mood', 'show_weather']) {
      await addColumnIfMissing(this, 'journeys', column, `${column} INTEGER NOT NULL DEFAULT 1`);
    }
  }
}
