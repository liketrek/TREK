import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 196 (`db/migrations.ts`).
 *
 * Storage slice 2 — collab note attachments historically stored 'files/<name>'
 * in trip_files.filename while the file manager stored bare names in the same
 * column; the storage layer addresses objects as category + bare name, so
 * normalize the legacy rows. substr is 1-indexed: 7 drops the six chars of
 * 'files/'. The LIKE guard makes it a no-op on already-bare rows.
 * Appended LAST again, and for the same reason as the note this replaces:
 * the array is index-addressed against schema_version, so a slot that has
 * shipped in dev keeps the index it shipped with and anything from this
 * branch goes after it. A database that already ran this migration at its
 * pre-merge index replays it harmlessly (the LIKE guard) but skips whatever
 * now occupies that index. Acceptable only because this branch has never
 * been published; never do this with a released slot.
 */
export class Migration20200101031600_storage_slice_2 extends Migration {
  override name = 'Migration20200101031600_storage_slice_2';

  override up(): void {
    this.addSql(`UPDATE trip_files SET filename = substr(filename, 7) WHERE filename LIKE 'files/%'`);
  }
}
