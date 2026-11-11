import { Migration } from '@mikro-orm/migrations';

/**
 * A chat message deleted before this release kept its text in the row; only the
 * client hid it. Deleting now blanks the text with the flag
 * (`CollabMessagesRepository.softDelete`), and this clears what older deletes
 * left behind. The row itself stays for the "message deleted" placeholder.
 */
export class Migration20200101046370_a_deleted_chat_message_keeps_no_text extends Migration {
  override name = 'Migration20200101046370_a_deleted_chat_message_keeps_no_text';

  override up(): void {
    this.addSql("UPDATE collab_messages SET text = '' WHERE deleted = 1 AND text != ''");
  }
}
