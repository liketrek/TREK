import { Migration } from '@mikro-orm/migrations';

/** Keep tiny replay proofs after superseded original bodies are released. Existing chunks are upgraded lazily. */
export class Migration20200101046230_transfer_chunk_receipts extends Migration {
  override up(): void {
    this.addSql('ALTER TABLE travel_transfer_chunks ADD COLUMN digest TEXT');
  }
}
