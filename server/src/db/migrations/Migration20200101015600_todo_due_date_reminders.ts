import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 116 (`db/migrations.ts`).
 *
 * Migration: todo due-date reminders — track when we last sent a
 * reminder for each todo so we don't spam the same notification
 * every day the scheduler runs.
 */
export class Migration20200101015600_todo_due_date_reminders extends Migration {
  override name = 'Migration20200101015600_todo_due_date_reminders';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'todo_items', 'reminded_at', `reminded_at DATETIME`);
  }
}
