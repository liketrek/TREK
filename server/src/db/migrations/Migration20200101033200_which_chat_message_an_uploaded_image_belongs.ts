import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 212 (`db/migrations.ts`).
 *
 * Which chat message an uploaded image belongs to.
 *
 * A column on `trip_files` rather than a link row, matching the two that predate
 * it: a chat image is uploaded for exactly one message and dies with it, so the
 * cascade is the whole relationship. Guarded through pragma_table_info like
 * every other column add here, not through a caught "duplicate column name":
 * that swallows the next error too.
 */
export class Migration20200101033200_which_chat_message_an_uploaded_image_belongs extends Migration {
  override name = 'Migration20200101033200_which_chat_message_an_uploaded_image_belongs';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'trip_files',
      'message_id',
      `message_id INTEGER REFERENCES collab_messages(id) ON DELETE CASCADE`,
    );
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_trip_files_message_id ON trip_files(message_id)`);
  }
}
