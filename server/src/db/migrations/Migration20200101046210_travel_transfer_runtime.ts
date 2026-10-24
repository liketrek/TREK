import { Migration } from '@mikro-orm/migrations';

/** Transfer staging is private database data, never a public upload URL. */
export class Migration20200101046210_travel_transfer_runtime extends Migration {
  override up(): void {
    this.addSql(`CREATE TABLE travel_transfer_operations (
      id TEXT NOT NULL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL, operation_id TEXT NOT NULL,
      target_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
      include_private INTEGER NOT NULL, payload_digest TEXT, receipt TEXT,
      created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
      UNIQUE(user_id, client_id, operation_id)
    )`);
    this.addSql(`CREATE TABLE travel_transfer_objects (
      id TEXT NOT NULL PRIMARY KEY, operation_id TEXT NOT NULL REFERENCES travel_transfer_operations(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL, digest TEXT NOT NULL, size INTEGER NOT NULL,
      received INTEGER NOT NULL DEFAULT 0, verified INTEGER NOT NULL DEFAULT 0,
      UNIQUE(operation_id, source_id)
    )`);
    this.addSql(`CREATE TABLE travel_transfer_chunks (
      id TEXT NOT NULL PRIMARY KEY, object_id TEXT NOT NULL REFERENCES travel_transfer_objects(id) ON DELETE CASCADE,
      offset INTEGER NOT NULL, data TEXT NOT NULL, UNIQUE(object_id, offset)
    )`);
    this.addSql(`CREATE TABLE travel_transfer_graphs (
      trip_id INTEGER NOT NULL PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      graph TEXT NOT NULL, originals TEXT NOT NULL
    )`);
    this.addSql('CREATE INDEX idx_transfer_target ON travel_transfer_operations(target_id)');
    this.addSql('CREATE INDEX idx_transfer_graph_user ON travel_transfer_graphs(user_id)');
    this.addSql('CREATE INDEX idx_transfer_expiry ON travel_transfer_operations(expires_at)');
    this.addSql('CREATE INDEX idx_transfer_user ON travel_transfer_operations(user_id)');
  }
}
