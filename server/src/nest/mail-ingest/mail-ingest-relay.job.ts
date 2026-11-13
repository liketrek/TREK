import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import type { MailIngestCursorRepository } from '../../db/repositories/MailIngestCursor.repository';
import { dbNow } from '../../db/types';
import { logError, logWarn } from '../audit/audit-log.logger';
import { CronRegistrarService, LEASE_OWNER } from '../scheduling/cron-registrar.service';
import { isPassingRefusal, MailIngestIntakeService } from './mail-ingest-intake.service';
import { MailIngestRelayHost, type MailInboxRelay } from './mail-ingest-relay.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { createHash } from 'node:crypto';
import { z } from 'zod';

/** How long a run holds the relay before another process may take it over. */
const LEASE_MS = 10 * 60 * 1000;
/** The mails one page of the relay's queue holds, and the pages one run reads. */
const PAGE = 10;
const PAGES_PER_RUN = 5;
/** The most recipients one mail names on this instance; the relay sends no more. */
const MAX_RELAYED_RECIPIENTS = 100;
/** The base64 length of the largest mail the relay hands on. */
const MAX_RAW_CHARS = Math.ceil(MAIL_INGEST_LIMITS.cloudMailBytes / 3) * 4;
/** The relay's mail ids are UUIDs. */
const MAIL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** One page of the relay's queue; each mail in it is checked on its own, so an unreadable one blocks no other. */
const relayPageSchema = z.object({
  messages: z.array(z.unknown()).max(PAGE),
  /** Further mails wait beyond `next`. */
  more: z.boolean(),
  /** Where the next page starts: after the last mail the relay looked at for this one. */
  next: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,200}$/)
    .nullable(),
});
const relayedMailSchema = z.object({
  id: z.string().regex(MAIL_ID),
  receivedAt: z.string().max(40),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** The addresses on this instance it was sent to, as the relay's mail server took them (RCPT TO). */
  recipients: z.array(z.string().min(3).max(320)).min(1).max(MAX_RELAYED_RECIPIENTS),
  /** The mail itself, base64. */
  raw: z.string().max(MAX_RAW_CHARS),
});
type RelayedMail = z.infer<typeof relayedMailSchema>;
const relayedIdSchema = z.object({ id: z.string().regex(MAIL_ID) });

/**
 * Collects this instance's forwarded mails from the TREK Cloud relay every
 * two minutes, page after page while more wait, up to five pages a run. Each
 * mail is checked against its hash, handed to the intake under the addresses
 * it was sent to, and acknowledged once it is in (or once it is clear it
 * never will be), so the relay drops it. A mail that did not arrive whole,
 * or that the import cannot take for now (switched off, an address's share
 * for the day taken, an inbox full), stays with the relay for a later run,
 * and the pages after it are still read. Idle wherever no relay is attached,
 * which is every self-hosted install, and where the control plane runs no
 * import for this instance.
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
    this.registrar.register('mail-ingest-relay', '*/2 * * * *', async () => {
      await this.tick();
    });
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
      const taken = await this.drain(relay, null, PAGES_PER_RUN);
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

  /** The pages from `after` on, as many as are left to the run; answers the mails taken in. */
  private async drain(relay: MailInboxRelay, after: string | null, pagesLeft: number): Promise<number> {
    const answer = await relay.list(PAGE, after);
    if (answer === null) return 0;
    const page = relayPageSchema.safeParse(answer);
    if (!page.success) throw new Error('The relay answered with an inbox this server cannot read');
    const taken = await page.data.messages.reduce<Promise<number>>(async (previous, item) => {
      const count = await previous;
      return count + ((await this.takeIn(relay, item)) ? 1 : 0);
    }, Promise.resolve(0));
    const { more, next } = page.data;
    if (!more || next === null || next === after || pagesLeft <= 1) return taken;
    return taken + (await this.drain(relay, next, pagesLeft - 1));
  }

  /** One mail of a page into the intake; answers whether it was taken in. */
  private async takeIn(relay: MailInboxRelay, item: unknown): Promise<boolean> {
    const parsed = relayedMailSchema.safeParse(item);
    if (parsed.success) return this.store(relay, parsed.data);
    // It would read the same on every run: dropped, where it names an id to drop it by.
    const id = relayedIdSchema.safeParse(item);
    logWarn(`[mail-ingest] The relay sent a mail this server cannot read${id.success ? `: ${id.data.id}` : ''}`);
    if (id.success) await relay.ack(id.data.id);
    return false;
  }

  private async store(relay: MailInboxRelay, mail: RelayedMail): Promise<boolean> {
    const raw = Buffer.from(mail.raw, 'base64');
    if (createHash('sha256').update(raw).digest('hex') !== mail.sha256) {
      logWarn(`[mail-ingest] Relayed mail ${mail.id} did not arrive whole; left for the next run`);
      return false;
    }
    const result = await this.intake.receive(raw, 'cloud', mail.recipients);
    if (result.status === 'refused' && isPassingRefusal(result.reason)) {
      logWarn(`[mail-ingest] Relayed mail ${mail.id} waits with the relay: ${result.reason}`);
      return false;
    }
    if (result.status === 'refused') {
      logWarn(`[mail-ingest] Relayed mail ${mail.id} was not taken in: ${result.reason}`);
    }
    await relay.ack(mail.id);
    return result.status === 'accepted';
  }
}
