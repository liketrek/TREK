import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 189 (`db/migrations.ts`).
 *
 * #1298 — an expense can hang off a place, exactly as it already hangs off a
 * reservation. Same nullable FK, same ON DELETE SET NULL: the delete paths
 * take the linked expense with the place themselves, so the constraint is a
 * backstop for anything that removes a place without going through them.
 * Appended LAST: the array is index-addressed against schema_version, so a
 * slot inserted above this line never runs on an existing database.
 */
export class Migration20200101030900_1298 extends Migration {
  override name = 'Migration20200101030900_1298';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'budget_items',
      'place_id',
      `place_id INTEGER REFERENCES places(id) ON DELETE SET NULL DEFAULT NULL`,
    );
  }
}
