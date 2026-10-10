import { tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 123 (`db/migrations.ts`).
 *
 * Migration 121: Journey gallery refactor — decouple photo ownership from
 * entries. `journey_photos` becomes a per-journey gallery (one row per unique
 * photo per journey). A new junction table `journey_entry_photos` links gallery
 * photos to the entries that reference them, so the same photo can appear in
 * several entries without being duplicated. Synthetic wrapper entries
 * ('Gallery', '[Trip Photos]') created by the old model are removed — the
 * gallery table replaces them.
 */
export class Migration20200101020300_journey_gallery_refactor extends Migration {
  override name = 'Migration20200101020300_journey_gallery_refactor';

  override async up(): Promise<void> {
    const hasOld = await tableExists(this, 'journey_photos');
    const hasBackup = await tableExists(this, 'journey_photos_old');
    if (hasOld && !hasBackup) {
      await this.execute(`ALTER TABLE journey_photos RENAME TO journey_photos_old`);
    }

    await this.execute(`
      CREATE TABLE IF NOT EXISTS journey_photos (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id  INTEGER NOT NULL REFERENCES journeys(id)    ON DELETE CASCADE,
        photo_id    INTEGER NOT NULL REFERENCES trek_photos(id) ON DELETE CASCADE,
        caption     TEXT,
        shared      INTEGER DEFAULT 0,
        sort_order  INTEGER DEFAULT 0,
        provider    TEXT,
        asset_id    TEXT,
        owner_id    INTEGER,
        created_at  INTEGER NOT NULL,
        UNIQUE(journey_id, photo_id)
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS journey_entry_photos (
        entry_id          INTEGER NOT NULL REFERENCES journey_entries(id) ON DELETE CASCADE,
        journey_photo_id  INTEGER NOT NULL REFERENCES journey_photos(id)  ON DELETE CASCADE,
        sort_order        INTEGER DEFAULT 0,
        created_at        INTEGER NOT NULL,
        PRIMARY KEY(entry_id, journey_photo_id)
      )
    `);

    if (hasOld || hasBackup) {
      // Backfill the gallery: deduplicate by (journey_id, photo_id), keeping the
      // earliest row (MIN(id) = earliest created_at on AUTOINCREMENT).
      await this.execute(`
        INSERT OR IGNORE INTO journey_photos
          (journey_id, photo_id, caption, shared, sort_order, created_at)
        SELECT
          je.journey_id,
          jpo.photo_id,
          jpo.caption,
          jpo.shared,
          jpo.sort_order,
          jpo.created_at
        FROM journey_photos_old jpo
        JOIN journey_entries je ON je.id = jpo.entry_id
        WHERE jpo.id IN (
          SELECT MIN(jpo2.id)
          FROM journey_photos_old jpo2
          JOIN journey_entries je2 ON je2.id = jpo2.entry_id
          GROUP BY je2.journey_id, jpo2.photo_id
        )
      `);

      // Backfill the junction: one row per (entry_id, photo_id), resolved to the
      // new gallery ids.
      await this.execute(`
        INSERT OR IGNORE INTO journey_entry_photos
          (entry_id, journey_photo_id, sort_order, created_at)
        SELECT
          jpo.entry_id,
          jp.id,
          jpo.sort_order,
          jpo.created_at
        FROM journey_photos_old jpo
        JOIN journey_entries je ON je.id = jpo.entry_id
        JOIN journey_photos   jp
          ON jp.journey_id = je.journey_id
         AND jp.photo_id   = jpo.photo_id
      `);

      await this.execute(`DROP TABLE journey_photos_old`);
    }

    // Remove the synthetic wrapper entries the gallery model replaces. The
    // ON DELETE CASCADE on journey_entry_photos cleans up the junction rows.
    await this.execute(`DELETE FROM journey_entries WHERE title IN ('Gallery', '[Trip Photos]')`);

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_journey_photos_journey ON journey_photos(journey_id)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_journey_entry_photos_entry ON journey_entry_photos(entry_id)`);
    await this.execute(
      `CREATE INDEX IF NOT EXISTS idx_journey_entry_photos_photo ON journey_entry_photos(journey_photo_id)`,
    );
  }
}
