import { Migration } from '@mikro-orm/migrations';

/** Bind portable identities to locally authorised rows, never to caller-supplied IDs. */
export class Migration20200101046220_transfer_native_mappings extends Migration {
  override up(): void {
    this.addSql(`CREATE TABLE travel_transfer_silent_tasks (
      todo_id INTEGER NOT NULL PRIMARY KEY REFERENCES todo_items(id) ON DELETE CASCADE
    )`);
    this.addSql("ALTER TABLE travel_transfer_graphs ADD COLUMN native_map TEXT NOT NULL DEFAULT '{}'");
    this.addSql(`CREATE TABLE travel_transfer_file_hashes (
      id TEXT NOT NULL PRIMARY KEY, stamp TEXT NOT NULL, size INTEGER NOT NULL, digest TEXT NOT NULL
    )`);
  }
}
