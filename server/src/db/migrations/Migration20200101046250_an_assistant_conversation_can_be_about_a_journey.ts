import { Migration } from '@mikro-orm/migrations';

/**
 * An assistant conversation can be about a journey instead of a trip: the
 * Studio's chat works on a journey's book, and a journey need not belong to a
 * trip at all. `assistant_threads.trip_id` may now be NULL, `journey_id` names
 * the journey (and goes with it), and a CHECK holds every thread to exactly
 * one of the two. Every existing thread is a trip thread and stays one.
 *
 * SQLite cannot drop a NOT NULL in place, so the table is rebuilt. With
 * `foreign_keys = ON` a `DROP TABLE assistant_threads` runs an implicit
 * `DELETE FROM assistant_threads` first, and the `ON DELETE CASCADE` on
 * `assistant_messages` and `assistant_tool_calls` would empty both. So both
 * are rebuilt as well, pointing at the new tables, and the old ones go
 * children first: by the time the old threads table goes nothing references
 * it. Renaming each new table to its old name rewrites the foreign keys that
 * point at it. Every id is copied, so a thread, a message and a proposed
 * change keep theirs; the two child tables come back exactly as they were.
 *
 * The journey index leads with `journey_id` (a journey deleted finds its
 * threads by seeking) and the listing index mirrors the trip one.
 */
export class Migration20200101046250_an_assistant_conversation_can_be_about_a_journey extends Migration {
  override name = 'Migration20200101046250_an_assistant_conversation_can_be_about_a_journey';

  override up(): void {
    this.addSql(`
      CREATE TABLE assistant_threads_new (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        journey_id INTEGER REFERENCES journeys(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK((trip_id IS NULL) <> (journey_id IS NULL))
      )
    `);
    this.addSql(`
      INSERT INTO assistant_threads_new (id, user_id, trip_id, title, created_at, last_message_at)
      SELECT id, user_id, trip_id, title, created_at, last_message_at FROM assistant_threads
    `);

    this.addSql(`
      CREATE TABLE assistant_messages_new (
        id INTEGER PRIMARY KEY,
        thread_id INTEGER NOT NULL REFERENCES assistant_threads_new(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        parts TEXT NOT NULL,
        provider_state TEXT,
        status TEXT NOT NULL DEFAULT 'complete' CHECK(status IN ('complete', 'awaiting_approval', 'aborted', 'error')),
        model TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(`
      INSERT INTO assistant_messages_new (id, thread_id, role, parts, provider_state, status, model, created_at)
      SELECT id, thread_id, role, parts, provider_state, status, model, created_at FROM assistant_messages
    `);

    this.addSql(`
      CREATE TABLE assistant_tool_calls_new (
        id TEXT PRIMARY KEY NOT NULL,
        thread_id INTEGER NOT NULL REFERENCES assistant_threads_new(id) ON DELETE CASCADE,
        message_id INTEGER NOT NULL REFERENCES assistant_messages_new(id) ON DELETE CASCADE,
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
    this.addSql(`
      INSERT INTO assistant_tool_calls_new (
        id, thread_id, message_id, provider_call_id, tool_name, args, preview, state, result, undo_until, created_at,
        decided_at
      )
      SELECT
        id, thread_id, message_id, provider_call_id, tool_name, args, preview, state, result, undo_until, created_at,
        decided_at
      FROM assistant_tool_calls
    `);

    this.addSql('DROP TABLE assistant_tool_calls');
    this.addSql('DROP TABLE assistant_messages');
    this.addSql('DROP TABLE assistant_threads');
    this.addSql('ALTER TABLE assistant_threads_new RENAME TO assistant_threads');
    this.addSql('ALTER TABLE assistant_messages_new RENAME TO assistant_messages');
    this.addSql('ALTER TABLE assistant_tool_calls_new RENAME TO assistant_tool_calls');

    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_assistant_threads_user_journey ON assistant_threads(user_id, journey_id, last_message_at)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_threads_journey ON assistant_threads(journey_id)');
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_assistant_threads_user_trip ON assistant_threads(user_id, trip_id, last_message_at)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_threads_trip ON assistant_threads(trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_messages_thread ON assistant_messages(thread_id, id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_assistant_tool_calls_message ON assistant_tool_calls(message_id)');
  }
}
