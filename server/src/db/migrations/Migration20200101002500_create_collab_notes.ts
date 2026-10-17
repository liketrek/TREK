import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 25 (`db/migrations.ts`).
 *
 * The Collab addon: shared notes, polls and trip chat.
 */
export class Migration20200101002500_create_collab_notes extends Migration {
  override name = 'Migration20200101002500_create_collab_notes';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS collab_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT DEFAULT 'General',
        title TEXT NOT NULL,
        content TEXT,
        color TEXT DEFAULT '#6366f1',
        pinned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.execute(`
      CREATE TABLE IF NOT EXISTS collab_polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        multiple INTEGER DEFAULT 0,
        closed INTEGER DEFAULT 0,
        deadline TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.execute(`
      CREATE TABLE IF NOT EXISTS collab_poll_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id INTEGER NOT NULL REFERENCES collab_polls(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        option_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(poll_id, user_id, option_index)
      )
    `);
    await this.execute(`
      CREATE TABLE IF NOT EXISTS collab_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        reply_to INTEGER REFERENCES collab_messages(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_collab_notes_trip ON collab_notes(trip_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_collab_polls_trip ON collab_polls(trip_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_collab_messages_trip ON collab_messages(trip_id)`);

    await execBestEffort(
      this,
      `INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES ('collab', 'Collab', 'Notes, polls, and live chat for trip collaboration', 'trip', 'Users', 1, 6)`,
    );
  }
}
