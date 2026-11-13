import type { MailIngestCursor } from '../entities/MailIngestCursor.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** What reads mail: an IMAP box, the TREK Cloud relay, or the processing pipeline itself. */
export type MailIngestCursorTransport = 'imap' | 'cloud' | 'pipeline';

/** One `mail_ingest_cursor` row as stored. */
interface MailIngestCursorRow {
  id: number;
  transport: string;
  mailbox: string;
  uid_validity: number | null;
  last_uid: number | null;
  last_ok_at: string | null;
  last_error: string | null;
  lease_owner: string | null;
  lease_until: string | null;
}

const _mailIngestCursorRowKeys: AssertRowKeys<MailIngestCursorRow, MailIngestCursor> = true;

/** A reader's position after a good run; an IMAP reader names its box's uid validity and the last uid it took. */
interface MailIngestCursorPosition {
  uidValidity?: number | null;
  lastUid?: number | null;
}

type CursorKyselyDB = Pick<DB, 'mail_ingest_cursor'>;

/**
 * `mail_ingest_cursor`: where each reader stands and who holds it. The lease
 * is one conditional update, so of two processes on one database exactly one
 * wins; a lease whose holder died runs out and the next run takes it.
 */
export class MailIngestCursorRepository extends TrekRepository<MailIngestCursor> {
  private db() {
    return this.kysely<CursorKyselyDB>();
  }

  /**
   * Takes the reader's lease until `until` when it is free, run out at `now`,
   * or already this owner's. The row is created on first use.
   *
   * @txIndependent the row is provisioned idempotently first; the lease itself
   * is the one conditional update that decides the race.
   */
  async acquireLease(
    transport: MailIngestCursorTransport,
    mailbox: string,
    owner: string,
    until: DbTimestamp,
    now: DbTimestamp,
  ): Promise<boolean> {
    await this.db()
      .insertInto('mail_ingest_cursor')
      .values({ transport, mailbox })
      .onConflict((oc) => oc.columns(['transport', 'mailbox']).doNothing())
      .execute();
    const result = await this.db()
      .updateTable('mail_ingest_cursor')
      .set({ lease_owner: owner, lease_until: until })
      .where('transport', '=', transport)
      .where('mailbox', '=', mailbox)
      .where((eb) =>
        eb.or([eb('lease_until', 'is', null), eb('lease_until', '<', now), eb('lease_owner', '=', owner)]),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /** Gives the lease back, if this owner still holds it. */
  async releaseLease(transport: MailIngestCursorTransport, mailbox: string, owner: string): Promise<void> {
    await this.db()
      .updateTable('mail_ingest_cursor')
      .set({ lease_owner: null, lease_until: null })
      .where('transport', '=', transport)
      .where('mailbox', '=', mailbox)
      .where('lease_owner', '=', owner)
      .execute();
  }

  /** A good run: its time, the reader's position where it has one, and no error. */
  async recordOk(
    transport: MailIngestCursorTransport,
    mailbox: string,
    at: DbTimestamp,
    position: MailIngestCursorPosition = {},
  ): Promise<void> {
    await this.db()
      .updateTable('mail_ingest_cursor')
      .set({
        last_ok_at: at,
        last_error: null,
        ...(position.uidValidity !== undefined && { uid_validity: position.uidValidity }),
        ...(position.lastUid !== undefined && { last_uid: position.lastUid }),
      })
      .where('transport', '=', transport)
      .where('mailbox', '=', mailbox)
      .execute();
  }

  /** A failed run, for the admin's status card; the position stays where the last good run left it. */
  async recordError(transport: MailIngestCursorTransport, mailbox: string, error: string): Promise<void> {
    await this.db()
      .updateTable('mail_ingest_cursor')
      .set({ last_error: error.slice(0, 500) })
      .where('transport', '=', transport)
      .where('mailbox', '=', mailbox)
      .execute();
  }

  async find(transport: MailIngestCursorTransport, mailbox: string): Promise<MailIngestCursorRow | null> {
    const row = await this.db()
      .selectFrom('mail_ingest_cursor')
      .selectAll()
      .where('transport', '=', transport)
      .where('mailbox', '=', mailbox)
      .executeTakeFirst();
    return row ?? null;
  }
}
