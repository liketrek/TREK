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
import { MailIngestIntakeService } from './mail-ingest-intake.service';
import { MailIngestSettingsService, type MailIngestImapConfig } from './mail-ingest-settings.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** How long a run holds the box before another process may take it over. */
const LEASE_MS = 10 * 60 * 1000;
/** The mails one run takes from the box; the rest wait for the next run. */
const MAILS_PER_RUN = 20;
/** Where read mails go: kept, never deleted, out of the folder the next run reads. */
const PROCESSED_FOLDER = ['TREK', 'processed'] as const;

/**
 * Reads the admin's IMAP box every two minutes, with a client of its own for
 * every run. Each new mail is handed to the intake, which stores it once,
 * and then moved to TREK/processed. The cursor (uid validity, last uid)
 * keeps a mail the move missed from being read twice, and the intake's
 * dedupe keeps it so when the server renumbers the box and the run starts
 * over. One process holds the box at a time, by the cursor's lease.
 */
@Injectable()
export class MailIngestImapJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MailIngestCursor) private readonly cursor: MailIngestCursorRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly intake: MailIngestIntakeService,
    private readonly imap: MailIngestImapClient,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('mail-ingest-imap', '*/2 * * * *', () => this.tick());
  }

  /**
   * One run; answers how many mails it took from the box. Nothing happens
   * unless the import is on, IMAP is its transport and the box is complete.
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
      const { taken, uidValidity, lastUid } = await this.poll(config);
      await this.cursor.recordOk('imap', config.mailbox, dbNow(new Date()), { uidValidity, lastUid });
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

  private async poll(config: MailIngestImapConfig): Promise<{ taken: number; uidValidity: number; lastUid: number }> {
    const session = await this.imap.connect(config);
    try {
      const { uidValidity } = await session.open(config.mailbox);
      const position = await this.cursor.find('imap', config.mailbox);
      // A changed uid validity means the server renumbered the box: start over, the dedupe keeps each mail once.
      const after = position?.uid_validity === uidValidity ? (position.last_uid ?? 0) : 0;
      const due = (await session.listAfter(after)).slice(0, MAILS_PER_RUN);
      if (due.length === 0) return { taken: 0, uidValidity, lastUid: after };
      const folder = await session.ensureFolder(PROCESSED_FOLDER);
      await due.reduce(async (previous, mail) => {
        await previous;
        await this.takeIn(session, mail);
      }, Promise.resolve());
      await session.move(due.map((mail) => mail.uid), folder);
      return { taken: due.length, uidValidity, lastUid: Math.max(...due.map((mail) => mail.uid)) };
    } finally {
      await session.close();
    }
  }

  /** One mail into the intake. One larger than the import takes is left unread, and moved on with the rest. */
  private async takeIn(session: ImapSession, mail: ImapMailRef): Promise<void> {
    if (mail.size > this.settings.maxMailBytes()) {
      logWarn(`[mail-ingest] An IMAP mail of ${mail.size} bytes is larger than the import takes; left unread`);
      return;
    }
    const raw = await session.source(mail.uid);
    if (!raw) return;
    const result = await this.intake.receive(raw, 'imap');
    if (result.status === 'refused') logWarn(`[mail-ingest] An IMAP mail was not taken in: ${result.reason}`);
  }
}
