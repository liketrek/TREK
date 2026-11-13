import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import type { MailIngestCursorRepository } from '../../db/repositories/MailIngestCursor.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../db/types';
import { logError } from '../audit/audit-log.logger';
import { withRequestContext } from '../database/request-context';
import { CronRegistrarService, LEASE_OWNER } from '../scheduling/cron-registrar.service';
import { MailIngestProcessService } from './mail-ingest-process.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** How long a run holds the pipeline and its mails before another run may take them over. */
const LEASE_MS = 10 * 60 * 1000;

/**
 * Reads the queued mails every two minutes, at most three per run, one after
 * the other. The pipeline's own lease on its cursor row keeps two processes
 * on one database (or a run and an upload that asked for one now) from
 * reading at once; each mail has its claim as well, so a run that died hands
 * its mail on when the claim runs out. Every mail is read in a request
 * context of its own, so one mail's identity map never leaks into the next.
 */
@Injectable()
export class MailIngestProcessJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    @InjectRepository(MailIngestCursor) private readonly cursor: MailIngestCursorRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly process: MailIngestProcessService,
    private readonly registrar: CronRegistrarService,
    private readonly orm: MikroORM,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('mail-ingest-process', '*/2 * * * *', async () => {
      await this.tick();
    });
  }

  /**
   * One run; answers how many mails it read. Nothing happens while the import
   * is off, which is how a plan without it costs nothing.
   *
   * @txIndependent every mail is read and written on its own: one that fails
   * leaves the others, and its retry is its own claim's business.
   */
  async tick(now: Date = new Date()): Promise<number> {
    if (!(await this.settings.isAvailable())) return 0;
    const until = dbNow(new Date(now.getTime() + LEASE_MS));
    if (!(await this.cursor.acquireLease('pipeline', '', LEASE_OWNER, until, dbNow(now)))) return 0;
    try {
      const ids = await this.messages.claimDue(dbNow(now), until, MAIL_INGEST_LIMITS.mailsPerRun);
      await ids.reduce(async (previous, id) => {
        await previous;
        await withRequestContext(this.orm, () => this.process.process(id, now));
      }, Promise.resolve());
      await this.cursor.recordOk('pipeline', '', dbNow(new Date()));
      return ids.length;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logError(`[mail-ingest] A processing run failed: ${reason}`);
      await this.cursor.recordError('pipeline', '', reason);
      return 0;
    } finally {
      await this.cursor.releaseLease('pipeline', '', LEASE_OWNER);
    }
  }

  /**
   * Starts a run now instead of at the next tick, without waiting for it.
   * Where the crons are off (the test suites) nothing starts, as no tick
   * would either, so a run never outlives the request that asked for it.
   */
  runSoon(): void {
    if (!this.registrar.isEnabled()) return;
    withRequestContext(this.orm, () => this.tick()).catch((err: unknown) => {
      logError(`[mail-ingest] A run asked for at once failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
