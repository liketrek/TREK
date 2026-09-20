import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 239 (`db/migrations.ts`).
 *
 * Document providers: when TREK itself put a provider copy in the bin.
 *
 * A file deleted in TREK under the `trash` policy takes its provider copy with
 * it. Taken back out of TREK's trash, it has to go up again; a copy somebody
 * else deleted in the meantime must not. Both leave the same gap in a listing,
 * so the difference is written down when TREK acts rather than guessed at later.
 *
 * No backfill from the binding's current policy: that policy may not be the one
 * the deletion ran under, and reading it back is the retroactive mistake this
 * column exists to avoid. A row left NULL is treated like a copy somebody else
 * deleted, which flags it instead of uploading it.
 */
export class Migration20200101035900_document_providers_when_trek_itself_put_a extends Migration {
  override name = 'Migration20200101035900_document_providers_when_trek_itself_put_a';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'document_sync_items', 'remote_trashed_at', `remote_trashed_at TEXT`);
  }
}
