import { bestEffort, columnNames, execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 94 (`db/migrations.ts`).
 *
 * Migration 88: Journey photos — provider support (Immich/Synology).
 *
 * Every part of this step was swallowed on failure in the original, and it is
 * kept that way: the rebuild below assumes the integer-keyed `journey_photos`
 * shape, so on a database still carrying step 90's TEXT-keyed table the copy
 * fails and the later journey rebuild (step 93) is what actually fixes it.
 */
export class Migration20200101013400_journey_photos extends Migration {
  override name = 'Migration20200101013400_journey_photos';

  override async up(): Promise<void> {
    await execBestEffort(this, `ALTER TABLE journey_photos ADD COLUMN provider TEXT NOT NULL DEFAULT 'local'`);
    await execBestEffort(this, `ALTER TABLE journey_photos ADD COLUMN asset_id TEXT`);
    await execBestEffort(this, `ALTER TABLE journey_photos ADD COLUMN owner_id INTEGER REFERENCES users(id)`);
    await execBestEffort(this, `ALTER TABLE journey_photos ADD COLUMN shared INTEGER NOT NULL DEFAULT 1`);

    // file_path was NOT NULL — recreate the table to make it nullable.
    const names = await columnNames(this, 'journey_photos');
    if (!names.has('provider')) return;

    await bestEffort(async () => {
      await this.execute(`
        CREATE TABLE journey_photos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_id INTEGER NOT NULL,
          provider TEXT NOT NULL DEFAULT 'local',
          asset_id TEXT,
          owner_id INTEGER REFERENCES users(id),
          file_path TEXT,
          thumbnail_path TEXT,
          caption TEXT,
          sort_order INTEGER DEFAULT 0,
          width INTEGER,
          height INTEGER,
          shared INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (entry_id) REFERENCES journey_entries(id) ON DELETE CASCADE
        )
      `);
      await this.execute(
        `INSERT INTO journey_photos_new SELECT id, entry_id, provider, asset_id, owner_id, file_path, thumbnail_path, caption, sort_order, width, height, shared, created_at FROM journey_photos`,
      );
      await this.execute(`DROP TABLE journey_photos`);
      await this.execute(`ALTER TABLE journey_photos_new RENAME TO journey_photos`);
      await this.execute(`CREATE INDEX idx_journey_photos_entry ON journey_photos(entry_id)`);
    });
  }
}
