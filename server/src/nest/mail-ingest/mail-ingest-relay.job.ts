import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import type { MailIngestCursorRepository } from '../../db/repositories/MailIngestCursor.repository';
import { dbNow } from '../../db/types';
import { logError, logWarn } from '../audit/audit-log.logger';
import { CronRegistrarService, LEASE_OWNER } from '../scheduling/cron-registrar.service';
import { MailIngestIntakeService } from './mail-ingest-intake.service';
import { MailIngestRelayHost, type MailInboxRelay } from './mail-ingest-relay.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { createHash } from 'node:crypto';
import { z } from 'zod';

/** How long a run holds the relay before another process may take it over. */
const LEASE_MS = 10 * 60 * 1000;
/** The mails one run asks the relay for. */
const PAGE = 10;
/** The base64 length of the largest mail the relay hands on. */
const MAX_RAW_CHARS = Math.ceil(MAIL_INGEST_LIMITS.cloudMailBytes / 3) * 4;

/** The relay's answer, checked before anything of it is used. */
const relayInboxSchema = z.object({
  mails: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
        /** The addresses it was sent to, as the relay's mail server took them (RCPT TO). */
        recipients: z.array(z.string().min(3).max(320)).min(1).max(5),
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
        /** The mail itself, base64. */
        raw: z.string().max(MAX_RAW_CHARS),
      }),
    )
    .max(PAGE),
});
type RelayedMail = z.infer<typeof relayInboxSchema>['mails'][number];

/**
 * Collects this instance's forwarded mails from the TREK Cloud relay every
 * two minutes: a page of at most ten, each checked against its hash, handed
 * to the intake under the address it was sent to, and acknowledged once it
 * is in (or once it is clear it never will be), so the relay drops it. A
 * mail that does not arrive whole is left for the next run. Idle wherever
 * no relay is attached, which is every self-hosted install.
 */
@Injectable()
export class MailIngestRelayJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(MailIngestCursor) private readonly cursor: MailIngestCursorRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly intake: MailIngestIntakeService,
    private readonly relays: MailIngestRelayHost,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('mail-ingest-relay', '*/2 * * * *', () => this.tick());
  }

  /**
   * One run; answers how many mails it took in.
   *
   * @txIndependent each mail is stored on its own and acknowledged after it, network I/O between them.
   */
  async tick(now: Date = new Date()): Promise<number> {
    const relay = this.relays.current();
    if (!relay || !(await this.settings.isAvailable()) || (await this.settings.transport()) !== 'cloud') return 0;
    const until = dbNow(new Date(now.getTime() + LEASE_MS));
    if (!(await this.cursor.acquireLease('cloud', '', LEASE_OWNER, until, dbNow(now)))) return 0;
    try {
      const page = relayInboxSchema.safeParse(await relay.list(PAGE));
      if (!page.success) throw new Error('The relay answered with an inbox this server cannot read');
      const taken = await page.data.mails.reduce(async (previous, mail) => {
        const count = await previous;
        return count + ((await this.takeIn(relay, mail)) ? 1 : 0);
      }, Promise.resolve(0));
      await this.cursor.recordOk('cloud', '', dbNow(new Date()));
      return taken;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logError(`[mail-ingest] Collecting mails from the relay failed: ${reason}`);
      await this.cursor.recordError('cloud', '', reason);
      return 0;
    } finally {
      await this.cursor.releaseLease('cloud', '', LEASE_OWNER);
    }
  }

  /** One relayed mail into the intake; answers whether it was taken in. */
  private async takeIn(relay: MailInboxRelay, mail: RelayedMail): Promise<boolean> {
    const raw = Buffer.from(mail.raw, 'base64');
    if (createHash('sha256').update(raw).digest('hex') !== mail.sha256) {
      logWarn(`[mail-ingest] Relayed mail ${mail.id} did not arrive whole; left for the next run`);
      return false;
    }
    const result = await this.intake.receive(raw, 'cloud', mail.recipients);
    // Switched off in between: the relay keeps the mail until the import is back or the mail expires.
    if (result.status === 'refused' && result.reason === 'unavailable') return false;
    if (result.status === 'refused') {
      logWarn(`[mail-ingest] Relayed mail ${mail.id} was not taken in: ${result.reason}`);
    }
    await relay.ack(mail.id);
    return result.status === 'accepted';
  }
}
