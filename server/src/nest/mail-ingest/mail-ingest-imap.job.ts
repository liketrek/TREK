import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import type { MailIngestCursorRepository } from '../../db/repositories/MailIngestCursor.repository';
import { dbNow } from '../../db/types';
import { logError, logWarn } from '../audit/audit-log.logger';
import { CronRegistrarService, LEASE_OWNER } from '../scheduling/cron-registrar.service';
import {
  describeImapFailure,
  MailIngestImapClient,
  type ImapMailRef,
  type ImapSession,
} from './mail-ingest-imap.client';
import { isPassingRefusal, MailIngestIntakeService } from './mail-ingest-intake.service';
import { MailIngestProcessJob } from './mail-ingest-process.job';
import { MailIngestSettingsService, type MailIngestImapConfig } from './mail-ingest-settings.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** How long a run holds the box before another process may take it over. */
const LEASE_MS = 10 * 60 * 1000;
/** The mails one run takes from the box; the rest wait for the next run. */
const MAILS_PER_RUN = 20;
/** The mails one run offers the intake again from the deferred folder, oldest first. */
const DEFERRED_PER_RUN = 5;
/** How long a deferred mail is offered again before it is given up. */
const DEFER_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Where read mails go: kept, never deleted, out of the folder the next run reads. */
const PROCESSED_FOLDER = ['TREK', 'processed'] as const;
/** Where a mail the import cannot take for now waits to be offered again. */
const DEFERRED_FOLDER = ['TREK', 'deferred'] as const;

/** What became of one mail: taken in, done with otherwise, or kept to be offered again. */
type ImapOutcome = 'taken' | 'done' | 'deferred';

/**
 * Reads the admin's IMAP box every two minutes, with a client of its own for
 * every run. Each new mail is handed to the intake, which stores it once,
 * and then moved to TREK/processed. A mail the import cannot take for now
 * (an address's share for the day taken, an inbox full) goes to
 * TREK/deferred instead, so it holds up no mail behind it, and a few of
 * those are offered again on every run until they are taken or
 * {@link DEFER_DAYS} old. The cursor (uid validity, last uid) keeps a mail
 * a move missed from being read twice, and the intake's dedupe keeps it so
 * when the server renumbers the box and the run starts over. One process
 * holds the box at a time, by the cursor's lease.
 */
@Injectable()
export class MailIngestImapJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MailIngestCursor) private readonly cursor: MailIngestCursorRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly intake: MailIngestIntakeService,
    private readonly imap: MailIngestImapClient,
    private readonly registrar: CronRegistrarService,
    private readonly process: MailIngestProcessJob,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('mail-ingest-imap', '*/2 * * * *', async () => {
      await this.tick();
    });
  }

  /**
   * One run; answers how many mails it took in. Nothing happens unless the
   * import is on, IMAP is its transport and the box is complete.
   *
   * @txIndependent each mail is stored on its own as it is read; the cursor
   * notes where the run got to once the box is done with.
   */
  async tick(now: Date = new Date()): Promise<number> {
    if (!(await this.settings.isAvailable()) || (await this.settings.transport()) !== 'imap') return 0;
    const config = await this.settings.imapConfig();
    if (!config) return 0;
    const until = dbNow(new Date(now.getTime() + LEASE_MS));
    if (!(await this.cursor.acquireLease('imap', config.mailbox, LEASE_OWNER, until, dbNow(now)))) return 0;
    try {
      const { taken, uidValidity, lastUid } = await this.poll(config, now);
      await this.cursor.recordOk('imap', config.mailbox, dbNow(new Date()), { uidValidity, lastUid });
      // Read what came in now, not at the next processing tick.
      if (taken > 0) this.process.runSoon();
      return taken;
    } catch (err) {
      const reason = describeImapFailure(err);
      logError(`[mail-ingest] Reading the IMAP box failed: ${reason}`);
      await this.cursor.recordError('imap', config.mailbox, reason);
      return 0;
    } finally {
      await this.cursor.releaseLease('imap', config.mailbox, LEASE_OWNER);
    }
  }

  /** @txIndependent IMAP round trips sit between the writes; each mail and the cursor are complete on their own. */
  private async poll(
    config: MailIngestImapConfig,
    now: Date,
  ): Promise<{ taken: number; uidValidity: number; lastUid: number }> {
    const session = await this.imap.connect(config);
    try {
      const { uidValidity } = await session.open(config.mailbox);
      const position = await this.cursor.findCursor('imap', config.mailbox);
      // A changed uid validity means the server renumbered the box: start over, the dedupe keeps each mail once.
      const after = position?.uid_validity === uidValidity ? (position.last_uid ?? 0) : 0;
      const due = (await session.listAfter(after)).slice(0, MAILS_PER_RUN);
      const fresh = due.length > 0 ? await this.readNew(session, due) : 0;
      const lastUid = due.length > 0 ? Math.max(...due.map((mail) => mail.uid)) : after;
      const retried = await this.retryDeferred(session, now);
      return { taken: fresh + retried, uidValidity, lastUid };
    } finally {
      await session.close();
    }
  }

  /** The new mails of the box into the intake, each moved on by what became of it; answers how many were taken. */
  private async readNew(session: ImapSession, due: readonly ImapMailRef[]): Promise<number> {
    const outcomes = await this.takeAll(session, due);
    const deferred = due.filter((_, i) => outcomes[i] === 'deferred').map((mail) => mail.uid);
    const settled = due.filter((_, i) => outcomes[i] !== 'deferred').map((mail) => mail.uid);
    if (settled.length > 0) await session.move(settled, await session.ensureFolder(PROCESSED_FOLDER));
    if (deferred.length > 0) await session.move(deferred, await session.ensureFolder(DEFERRED_FOLDER));
    return outcomes.filter((outcome) => outcome === 'taken').length;
  }

  /**
   * Offers the oldest deferred mails again. One taken now, or done with
   * otherwise, moves on to TREK/processed; one still refused stays, unless
   * it waited {@link DEFER_DAYS} already, and is then given up the same way.
   */
  private async retryDeferred(session: ImapSession, now: Date): Promise<number> {
    await session.open(await session.ensureFolder(DEFERRED_FOLDER));
    const due = (await session.listAfter(0)).slice(0, DEFERRED_PER_RUN);
    if (due.length === 0) return 0;
    const outcomes = await this.takeAll(session, due);
    // A mail whose arrival the server does not name cannot be aged, so it gets this one retry only.
    const expired = (mail: ImapMailRef) =>
      !mail.receivedAt || now.getTime() - mail.receivedAt.getTime() > DEFER_DAYS * DAY_MS;
    const settled = due.filter((mail, i) => outcomes[i] !== 'deferred' || expired(mail));
    const givenUp = due.filter((mail, i) => outcomes[i] === 'deferred' && expired(mail)).length;
    if (givenUp > 0) {
      logWarn(`[mail-ingest] Deferred IMAP mails given up after waiting ${DEFER_DAYS} days: ${givenUp}`);
    }
    if (settled.length > 0) {
      await session.move(
        settled.map((mail) => mail.uid),
        await session.ensureFolder(PROCESSED_FOLDER),
      );
    }
    return outcomes.filter((outcome) => outcome === 'taken').length;
  }

  /** @txIndependent each mail is fetched from the box and stored by itself, with network I/O between them. */
  private takeAll(session: ImapSession, due: readonly ImapMailRef[]): Promise<ImapOutcome[]> {
    return due.reduce<Promise<ImapOutcome[]>>(async (previous, mail) => {
      const done = await previous;
      return [...done, await this.takeIn(session, mail)];
    }, Promise.resolve([]));
  }

  /** One mail into the intake. One larger than the import takes is left unread, and moved on with the rest. */
  private async takeIn(session: ImapSession, mail: ImapMailRef): Promise<ImapOutcome> {
    if (mail.size > this.settings.maxMailBytes()) {
      logWarn(`[mail-ingest] An IMAP mail of ${mail.size} bytes is larger than the import takes; left unread`);
      return 'done';
    }
    const raw = await session.source(mail.uid);
    if (!raw) return 'done';
    const result = await this.intake.receive(raw, 'imap');
    if (result.status !== 'refused') return result.status === 'accepted' ? 'taken' : 'done';
    if (isPassingRefusal(result.reason)) return 'deferred';
    logWarn(`[mail-ingest] An IMAP mail was not taken in: ${result.reason}`);
    return 'done';
  }
}
