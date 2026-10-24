import { Migration } from '@mikro-orm/migrations';

/**
 * What a photo's pixels say, measured once so the assistant can pick photos
 * for a TREK Studio book without looking at them: a perceptual hash (`phash`,
 * 64 bits as 16 hex digits) to find near duplicates, how sharp it is
 * (`sharpness`, the variance of a Laplacian over the grey image), its mean
 * brightness (`luma`, 0 to 1) and the share of its pixels that are burnt out
 * or crushed black (`clipped`, 0 to 1), and the original's size in pixels
 * (`orig_width`, `orig_height`) for the print check.
 *
 * `algo` is the version of the measurement a row was made with, so a better
 * one later measures again instead of mixing the two. A null signal is one
 * that could not be measured (a format TREK cannot decode, a photo too large to
 * read), which is an answer too: the photo is not measured again.
 *
 * One row per photo, `photo_id UNIQUE` beside its own id rather than the photo
 * id as key: a key that is also a foreign key maps to a one-to-one on both
 * entities (see `trip_journal_links`). The row goes with its photo.
 */
export class Migration20200101046240_a_photo_keeps_its_quality_signals extends Migration {
  override name = 'Migration20200101046240_a_photo_keeps_its_quality_signals';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trek_photo_signals (
        id INTEGER PRIMARY KEY,
        photo_id INTEGER NOT NULL UNIQUE REFERENCES trek_photos(id) ON DELETE CASCADE,
        algo INTEGER NOT NULL,
        phash TEXT,
        sharpness REAL,
        luma REAL,
        clipped REAL,
        orig_width INTEGER,
        orig_height INTEGER,
        computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
