import type { MailIngestAddresses } from '../entities/MailIngestAddresses.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** One `mail_ingest_addresses` row as stored. */
export interface MailIngestAddressRow {
  id: number;
  token_hash: string;
  token_enc: string;
  user_id: number;
  trip_id: number | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
}

const _mailIngestAddressRowKeys: AssertRowKeys<MailIngestAddressRow, MailIngestAddresses> = true;

/** A new address: whose it is, for which trip (null for the person's own), and its token in both forms. */
interface MailIngestAddressInsert {
  userId: number;
  tripId: number | null;
  tokenHash: string;
  tokenEnc: string;
  createdAt: DbTimestamp;
}

type AddressesKyselyDB = Pick<DB, 'mail_ingest_addresses'>;

/**
 * `mail_ingest_addresses`: the forwarding addresses. A person has at most one
 * live address of their own and one per trip; renewing one revokes the old row
 * instead of deleting it, so a mail that still reaches the old token is
 * recognised and refused rather than taken for a stranger's.
 */
export class MailIngestAddressesRepository extends TrekRepository<MailIngestAddresses> {
  private db() {
    return this.kysely<AddressesKyselyDB>();
  }

  async insertAddress(row: MailIngestAddressInsert): Promise<number> {
    const inserted = await this.db()
      .insertInto('mail_ingest_addresses')
      .values({
        user_id: row.userId,
        trip_id: row.tripId,
        token_hash: row.tokenHash,
        token_enc: row.tokenEnc,
        created_at: row.createdAt,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  /** The person's live address for the trip, or their own one with `tripId` null. */
  async findLive(userId: number, tripId: number | null): Promise<MailIngestAddressRow | null> {
    let query = this.db()
      .selectFrom('mail_ingest_addresses')
      .selectAll()
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null);
    query = tripId === null ? query.where('trip_id', 'is', null) : query.where('trip_id', '=', tripId);
    const row = await query.orderBy('id', 'desc').executeTakeFirst();
    return row ?? null;
  }

  /** The address a token names, revoked or not. */
  async findByTokenHash(tokenHash: string): Promise<MailIngestAddressRow | null> {
    const row = await this.db()
      .selectFrom('mail_ingest_addresses')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .executeTakeFirst();
    return row ?? null;
  }

  async findById(id: number): Promise<MailIngestAddressRow | null> {
    const row = await this.db().selectFrom('mail_ingest_addresses').selectAll().where('id', '=', id).executeTakeFirst();
    return row ?? null;
  }

  /** Revokes the person's live address for the trip (their own with `tripId` null); answers how many went. */
  async revokeLive(userId: number, tripId: number | null, at: DbTimestamp): Promise<number> {
    let query = this.db()
      .updateTable('mail_ingest_addresses')
      .set({ revoked_at: at })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null);
    query = tripId === null ? query.where('trip_id', 'is', null) : query.where('trip_id', '=', tripId);
    const result = await query.executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  /** Notes that a mail came in on the address. */
  async touchUsed(id: number, at: DbTimestamp): Promise<void> {
    await this.db().updateTable('mail_ingest_addresses').set({ last_used_at: at }).where('id', '=', id).execute();
  }
}
