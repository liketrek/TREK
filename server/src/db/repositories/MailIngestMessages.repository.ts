import type { MailIngestMessages } from '../entities/MailIngestMessages.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** One `mail_ingest_messages` row as stored, the encrypted mail included. */
export interface MailIngestMessageRow {
  id: number;
  transport: string;
  message_id_hdr: string | null;
  dedupe_hash: string;
  address_id: number | null;
  user_id: number;
  trip_id: number | null;
  from_addr: string | null;
  from_verified: number;
  auth_results: string | null;
  subject: string | null;
  received_at: string;
  size: number;
  raw_eml_enc: string | null;
  raw_purged_at: string | null;
  status: string;
  reason: string | null;
  hints: string | null;
  attachments: string | null;
  forwarding_code: string | null;
  attempts: number;
  next_attempt_at: string;
  lease_until: string | null;
  ai_used: number;
  processed_at: string | null;
}

const _mailIngestMessageRowKeys: AssertRowKeys<MailIngestMessageRow, MailIngestMessages> = true;

/** A mail as the inbox lists it: everything but the stored mail and its sender's signature data. */
export type MailIngestMessageHead = Omit<MailIngestMessageRow, 'raw_eml_enc' | 'auth_results'>;

/** A mail as a transport hands it in, before anything has read it. */
interface MailIngestMessageInsert {
  transport: string;
  messageIdHdr: string | null;
  dedupeHash: string;
  addressId: number;
  userId: number;
  tripId: number | null;
  size: number;
  rawEnc: string;
  receivedAt: DbTimestamp;
}

/** What the pipeline made of a mail, written once it is done with it. */
export interface MailIngestMessageOutcome {
  status: 'processed' | 'discarded' | 'failed';
  reason: string | null;
  subject: string | null;
  fromAddr: string | null;
  fromVerified: boolean;
  authResults: string | null;
  hints: string | null;
  attachments: string | null;
  forwardingCode: string | null;
  aiUsed: boolean;
  processedAt: DbTimestamp;
}

type MessagesKyselyDB = Pick<DB, 'mail_ingest_messages' | 'mail_ingest_candidates'>;

/**
 * `mail_ingest_messages`: every forwarded mail, from its arrival to its
 * purge. A transport only ever inserts (idempotently, by `dedupe_hash`); the
 * pipeline claims due rows one by one with a conditional update, so a mail is
 * read by one run at a time, and a run that died lets its claim run out.
 */
export class MailIngestMessagesRepository extends TrekRepository<MailIngestMessages> {
  private db() {
    return this.kysely<MessagesKyselyDB>();
  }

  /** Stores a new mail, queued for now; null when the same mail is in already. */
  async insertIfNew(row: MailIngestMessageInsert): Promise<number | null> {
    const inserted = await this.db()
      .insertInto('mail_ingest_messages')
      .values({
        transport: row.transport,
        message_id_hdr: row.messageIdHdr,
        dedupe_hash: row.dedupeHash,
        address_id: row.addressId,
        user_id: row.userId,
        trip_id: row.tripId,
        size: row.size,
        raw_eml_enc: row.rawEnc,
        received_at: row.receivedAt,
        next_attempt_at: row.receivedAt,
      })
      .onConflict((oc) => oc.column('dedupe_hash').doNothing())
      .returning('id')
      .executeTakeFirst();
    return inserted?.id ?? null;
  }

  async findIdByDedupeHash(dedupeHash: string): Promise<number | null> {
    const row = await this.db()
      .selectFrom('mail_ingest_messages')
      .select('id')
      .where('dedupe_hash', '=', dedupeHash)
      .executeTakeFirst();
    return row?.id ?? null;
  }

  async findById(id: number): Promise<MailIngestMessageRow | null> {
    const row = await this.db().selectFrom('mail_ingest_messages').selectAll().where('id', '=', id).executeTakeFirst();
    return row ?? null;
  }

  /** These mails without their content, for the inbox rows that name them. */
  async listHeads(ids: readonly number[]): Promise<MailIngestMessageHead[]> {
    if (ids.length === 0) return [];
    return this.db()
      .selectFrom('mail_ingest_messages')
      .select([
        'id',
        'transport',
        'message_id_hdr',
        'dedupe_hash',
        'address_id',
        'user_id',
        'trip_id',
        'from_addr',
        'from_verified',
        'subject',
        'received_at',
        'size',
        'raw_purged_at',
        'status',
        'reason',
        'hints',
        'attachments',
        'forwarding_code',
        'attempts',
        'next_attempt_at',
        'lease_until',
        'ai_used',
        'processed_at',
      ])
      .where('id', 'in', [...ids])
      .execute();
  }

  /** The mails that came in since `since`, counted by status and reason, for the admin's status card. */
  async tallySince(since: DbTimestamp): Promise<Array<{ status: string; reason: string | null; n: number }>> {
    const rows = await this.db()
      .selectFrom('mail_ingest_messages')
      .select((eb) => ['status', 'reason', eb.fn.countAll<number>().as('n')])
      .where('received_at', '>=', since)
      .groupBy(['status', 'reason'])
      .execute();
    return rows.map((row) => ({ status: row.status, reason: row.reason, n: Number(row.n) }));
  }

  /** How many mails, of everyone, an AI read since `since`. */
  async countAllAiReadSince(since: DbTimestamp): Promise<number> {
    const row = await this.db()
      .selectFrom('mail_ingest_messages')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('ai_used', '=', 1)
      .where('received_at', '>=', since)
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }

  /** How many mails came in on the address since `since`, for its daily limit. */
  async countForAddressSince(addressId: number, since: DbTimestamp): Promise<number> {
    const row = await this.db()
      .selectFrom('mail_ingest_messages')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('address_id', '=', addressId)
      .where('received_at', '>=', since)
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }

  /** How many of the person's mails an AI read since `since`, for their daily limit. */
  async countAiReadSince(userId: number, since: DbTimestamp): Promise<number> {
    const row = await this.db()
      .selectFrom('mail_ingest_messages')
      .select((eb) => eb.fn.countAll<number>().as('n'))
      .where('user_id', '=', userId)
      .where('ai_used', '=', 1)
      .where('received_at', '>=', since)
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }

  /**
   * Claims up to `limit` mails that are due: queued and past their next try,
   * or claimed by a run whose lease ran out. Each claim is one conditional
   * update, so a mail another run took in between is skipped, never read twice.
   *
   * @txIndependent one claim per mail on purpose: each is complete on its own,
   * and a mail claimed stays claimed even when the next one is taken first by
   * another run.
   */
  async claimDue(now: DbTimestamp, leaseUntil: DbTimestamp, limit: number): Promise<number[]> {
    const due = await this.db()
      .selectFrom('mail_ingest_messages')
      .select('id')
      .where((eb) =>
        eb.or([
          eb.and([eb('status', '=', 'queued'), eb('next_attempt_at', '<=', now)]),
          eb.and([eb('status', '=', 'processing'), eb('lease_until', '<', now)]),
        ]),
      )
      .orderBy('next_attempt_at', 'asc')
      .orderBy('id', 'asc')
      .limit(limit)
      .execute();
    const won = await Promise.all(due.map(({ id }) => this.claim(id, now, leaseUntil)));
    return due.flatMap(({ id }, i) => (won[i] ? [id] : []));
  }

  /** One mail's claim: it is still queued, or its last claim ran out at `now`. */
  private async claim(id: number, now: DbTimestamp, leaseUntil: DbTimestamp): Promise<boolean> {
    const result = await this.db()
      .updateTable('mail_ingest_messages')
      .set((eb) => ({ status: 'processing', lease_until: leaseUntil, attempts: eb('attempts', '+', 1) }))
      .where('id', '=', id)
      .where((eb) =>
        eb.or([eb('status', '=', 'queued'), eb.and([eb('status', '=', 'processing'), eb('lease_until', '<', now)])]),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /** Writes what the pipeline made of the mail and lets go of its claim. */
  async finish(id: number, outcome: MailIngestMessageOutcome): Promise<void> {
    await this.db()
      .updateTable('mail_ingest_messages')
      .set({
        status: outcome.status,
        reason: outcome.reason,
        subject: outcome.subject,
        from_addr: outcome.fromAddr,
        from_verified: outcome.fromVerified ? 1 : 0,
        auth_results: outcome.authResults,
        hints: outcome.hints,
        attachments: outcome.attachments,
        forwarding_code: outcome.forwardingCode,
        ai_used: outcome.aiUsed ? 1 : 0,
        processed_at: outcome.processedAt,
        lease_until: null,
      })
      .where('id', '=', id)
      .execute();
  }

  /** Puts a mail whose reading failed back in the queue, to be tried again at `nextAttemptAt`. */
  async retryLater(id: number, nextAttemptAt: DbTimestamp): Promise<void> {
    await this.db()
      .updateTable('mail_ingest_messages')
      .set({ status: 'queued', next_attempt_at: nextAttemptAt, lease_until: null })
      .where('id', '=', id)
      .execute();
  }

  /**
   * Drops the stored mail of every message that no longer needs it: one that
   * came in before `hardCutoff`, or one done before `doneCutoff` that has no
   * entry left waiting in the inbox (the ways out read the mail). Answers how
   * many were purged.
   */
  async purgeRaw(doneCutoff: DbTimestamp, hardCutoff: DbTimestamp, at: DbTimestamp): Promise<number> {
    const result = await this.db()
      .updateTable('mail_ingest_messages')
      .set({ raw_eml_enc: null, raw_purged_at: at })
      .where('raw_eml_enc', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('received_at', '<', hardCutoff),
          eb.and([
            eb('status', 'in', ['processed', 'discarded', 'failed']),
            eb('processed_at', '<', doneCutoff),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('mail_ingest_candidates as c')
                  .select('c.id')
                  .whereRef('c.message_id', '=', 'mail_ingest_messages.id')
                  .where('c.resolution', '=', 'pending'),
              ),
            ),
          ]),
        ]),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  /** Deletes the mails that came in before `cutoff` and have no inbox entry left; answers how many went. */
  async deleteSettledBefore(cutoff: DbTimestamp): Promise<number> {
    const result = await this.db()
      .deleteFrom('mail_ingest_messages')
      .where('received_at', '<', cutoff)
      .where('status', '!=', 'queued')
      .where('status', '!=', 'processing')
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('mail_ingest_candidates as c')
              .select('c.id')
              .whereRef('c.message_id', '=', 'mail_ingest_messages.id'),
          ),
        ),
      )
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
