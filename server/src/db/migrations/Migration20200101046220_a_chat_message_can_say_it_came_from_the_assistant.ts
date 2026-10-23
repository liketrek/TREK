import { Migration } from '@mikro-orm/migrations';

/**
 * A trip chat message can say where it came from when nobody typed it in the
 * chat: `'assistant'` for an answer of the trip assistant a member shared,
 * which the chat marks as such in each reader's language. NULL, as on every
 * message before, is one typed in the chat. Only the assistant's share sets
 * it; the chat's own routes and tools never do.
 */
export class Migration20200101046220_a_chat_message_can_say_it_came_from_the_assistant extends Migration {
  override name = 'Migration20200101046220_a_chat_message_can_say_it_came_from_the_assistant';

  override up(): void {
    this.addSql(`ALTER TABLE collab_messages ADD COLUMN origin TEXT`);
  }
}
