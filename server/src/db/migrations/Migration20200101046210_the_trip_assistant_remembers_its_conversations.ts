import { Migration } from '@mikro-orm/migrations';

/**
 * The trip assistant's memory: one user's conversations about one trip.
 *
 * `assistant_threads` belong to a user and a trip and go with either.
 * `assistant_messages` keep each message's parts as the client renders them
 * (`parts`, JSON) and, for providers whose history has to be replayed as they
 * sent it, the provider's own items (`provider_state`, JSON).
 *
 * `assistant_tool_calls` are the changes the assistant proposed and the user
 * decides on. The key is our own id, not the provider's: a provider's call id
 * is only unique within its conversation (`UNIQUE(thread_id, provider_call_id)`).
 * The arguments are stored when the change is proposed and are what runs on
 * approval, never what a client sends back; `undo_until` is how long the
 * counterpart of an executed change may still be run.
 *
 * `assistant_usage` counts turns and tokens per user, UTC day and payer, which
 * is what the daily limit on the instance's connection is checked against.
 */
export class Migration20200101046210_the_trip_assistant_remembers_its_conversations extends Migration {
  override name = 'Migration20200101046210_the_trip_assistant_remembers_its_conversations';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS assistant_threads (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_assistant_threads_user_trip ON assistant_threads(user_id, trip_id, last_message_at)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_threads_trip ON assistant_threads(trip_id)');

    this.addSql(`
      CREATE TABLE IF NOT EXISTS assistant_messages (
        id INTEGER PRIMARY KEY,
        thread_id INTEGER NOT NULL REFERENCES assistant_threads(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        parts TEXT NOT NULL,
        provider_state TEXT,
        status TEXT NOT NULL DEFAULT 'complete' CHECK(status IN ('complete', 'awaiting_approval', 'aborted', 'error')),
        model TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread ON assistant_messages(thread_id, id)');

    this.addSql(`
      CREATE TABLE IF NOT EXISTS assistant_tool_calls (
        id TEXT PRIMARY KEY NOT NULL,
        thread_id INTEGER NOT NULL REFERENCES assistant_threads(id) ON DELETE CASCADE,
        message_id INTEGER NOT NULL REFERENCES assistant_messages(id) ON DELETE CASCADE,
        provider_call_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        args TEXT NOT NULL,
        preview TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'approval_requested'
          CHECK(state IN ('approval_requested', 'approved', 'rejected', 'executed', 'failed', 'expired', 'undone')),
        result TEXT,
        undo_until DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        decided_at DATETIME,
        UNIQUE(thread_id, provider_call_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_tool_calls_message ON assistant_tool_calls(message_id)');

    this.addSql(`
      CREATE TABLE IF NOT EXISTS assistant_usage (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        day TEXT NOT NULL,
        paid_by TEXT NOT NULL CHECK(paid_by IN ('instance', 'user')),
        turns INTEGER NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, day, paid_by)
      )
    `);
  }
}
