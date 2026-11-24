import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import type { MailIngestCandidatesRepository } from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../db/types';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A mail is kept this long after it was settled, for the ways out of the inbox and an undo. */
const RAW_AFTER_DONE_DAYS = 7;
/** And never longer than this after it came in. */
const RAW_MAX_DAYS = 30;
/** Decided entries, and mails without any, are kept this long, for the person's history and the admin's counts. */
const DECIDED_DAYS = 90;

/**
 * The nightly sweep of the mail import (plan section 7): the stored mail goes
 * 7 days after it was settled and at the latest 30 days after it came in;
 * decided entries and the mails left without one go after 90 days. Waiting
 * entries stay until the person decides. Bookings the import added are
 * ordinary bookings and are not touched.
 */
@Injectable()
export class MailIngestRetentionJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('mail-ingest-retention', '20 4 * * *', () => this.tick());
  }

  /** @txIndependent a retention sweep in passes, each complete on its own. */
  async tick(now: Date = new Date()): Promise<void> {
    const before = (days: number) => dbNow(new Date(now.getTime() - days * DAY_MS));
    try {
      const purged = await this.messages.purgeRaw(before(RAW_AFTER_DONE_DAYS), before(RAW_MAX_DAYS), dbNow(now));
      const entries = await this.candidates.deleteResolvedBefore(before(DECIDED_DAYS));
      const mails = await this.messages.deleteSettledBefore(before(DECIDED_DAYS));
      if (purged + entries + mails > 0) {
        logInfo(`Mail import retention: ${purged} mail(s) purged, ${entries} entr(ies) and ${mails} mail(s) removed`);
      }
    } catch (err) {
      logError(`Mail import retention: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
