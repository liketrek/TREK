import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 24 (`db/migrations.ts`).
 */
export class Migration20200101002400_create_assignment_participants extends Migration {
  override name = 'Migration20200101002400_create_assignment_participants';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS assignment_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(assignment_id, user_id)
      )
    `);
  }
}
