import { Migration } from '@mikro-orm/migrations';

/**
 * An assistant conversation can be about no one trip or journey: the home
 * chat on the dashboard, Vacay, Atlas, the collections and the settings
 * knows all of the user's trips and works on what belongs to none of them.
 * Such a thread names neither `trip_id` nor `journey_id`, so the CHECK that
 * held every thread to exactly one of the two now only keeps a thread from
 * naming both. Every existing thread names one of them and stays as it is.
 *
 * SQLite cannot change a CHECK in place, so the table is rebuilt the way
 * Migration20200101046250 rebuilt it: with `foreign_keys = ON` a
 * `DROP TABLE assistant_threads` runs an implicit `DELETE FROM
 * assistant_threads` first, and the `ON DELETE CASCADE` on
 * `assistant_messages` and `assistant_tool_calls` would empty both. So both
 * are rebuilt as well, pointing at the new tables, and the old ones go
 * children first. Renaming each new table to its old name rewrites the
 * foreign keys that point at it. Every id is copied, so a thread, a message
 * and a proposed change keep theirs, and the indexes come back as they were.
 *
 * The home threads of a user are found through the user's trip index
 * (`user_id` first, then `trip_id` IS NULL); there are few of them.
 */
/** The three tables rebuilt, children first. */
const REBUILT = ['assistant_tool_calls', 'assistant_messages', 'assistant_threads'] as const;

/** The indexes of the three tables, as they were before the rebuild. */
const INDEXES = [
  'idx_assistant_threads_user_journey ON assistant_threads(user_id, journey_id, last_message_at)',
  'idx_assistant_threads_journey ON assistant_threads(journey_id)',
  'idx_assistant_threads_user_trip ON assistant_threads(user_id, trip_id, last_message_at)',
  'idx_assistant_threads_trip ON assistant_threads(trip_id)',
  'idx_assistant_messages_thread ON assistant_messages(thread_id, id)',
  'idx_assistant_tool_calls_message ON assistant_tool_calls(message_id)',
] as const;

export class Migration20200101046280_an_assistant_conversation_can_be_about_no_one_trip extends Migration {
  override name = 'Migration20200101046280_an_assistant_conversation_can_be_about_no_one_trip';

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
        CHECK(trip_id IS NULL OR journey_id IS NULL)
      )
    `);
    this.addSql(`
      INSERT INTO assistant_threads_new (id, user_id, trip_id, journey_id, title, created_at, last_message_at)
      SELECT id, user_id, trip_id, journey_id, title, created_at, last_message_at FROM assistant_threads
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

    // Children first, so no old table is referenced when it goes; then each new one takes its old name.
    for (const table of REBUILT) this.addSql(`DROP TABLE ${table}`);
    for (const table of [...REBUILT].reverse()) this.addSql(`ALTER TABLE ${table}_new RENAME TO ${table}`);
    for (const index of INDEXES) this.addSql(`CREATE INDEX IF NOT EXISTS ${index}`);
  }
}
