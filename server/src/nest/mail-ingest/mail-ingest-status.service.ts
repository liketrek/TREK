import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import type { MailIngestCandidatesRepository } from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestCursorRepository } from '../../db/repositories/MailIngestCursor.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow, utcSuffix } from '../../db/types';
import { describeImapFailure, MailIngestImapClient } from './mail-ingest-imap.client';
import { MailIngestRelayHost } from './mail-ingest-relay.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  mailIngestMessageStatusSchema,
  mailIngestReasonSchema,
  type MailIngestAdminStatusResponse,
  type MailIngestAdminTestResponse,
  type MailIngestTransportSetting,
} from '@trek/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The admin's view of the import: how its transport runs and what became of
 * the mails of the last day, in counts only. No subject, sender, address or
 * content of any mail is part of it, and the backlog is a list of numbers,
 * not of people. The connection test reaches the transport the way the
 * import does and says what failed.
 */
@Injectable()
export class MailIngestStatusService {
  constructor(
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
    @InjectRepository(MailIngestCursor) private readonly cursor: MailIngestCursorRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly imap: MailIngestImapClient,
    private readonly relays: MailIngestRelayHost,
  ) {}

  async status(now: Date = new Date()): Promise<MailIngestAdminStatusResponse> {
    const transport = await this.settings.transport();
    const reader = await this.readerCursor(transport);
    const since = dbNow(new Date(now.getTime() - DAY_MS));
    const byStatus: MailIngestAdminStatusResponse['last_day']['by_status'] = {};
    const byReason: MailIngestAdminStatusResponse['last_day']['by_reason'] = {};
    for (const { status, reason, n } of await this.messages.tallySince(since)) {
      const knownStatus = mailIngestMessageStatusSchema.safeParse(status);
      if (knownStatus.success) byStatus[knownStatus.data] = (byStatus[knownStatus.data] ?? 0) + n;
      const knownReason = mailIngestReasonSchema.safeParse(reason);
      if (knownReason.success) byReason[knownReason.data] = (byReason[knownReason.data] ?? 0) + n;
    }
    const resolutions = new Map(
      (await this.candidates.tallyResolutionsSince(since)).map(({ resolution, n }) => [resolution, n]),
    );
    const startOfDay = dbNow(new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`));
    return {
      transport,
      last_ok_at: utcSuffix(reader?.last_ok_at),
      last_error: reader?.last_error ?? null,
      lease_until: utcSuffix(reader?.lease_until),
      last_day: { by_status: byStatus, by_reason: byReason },
      auto_applied: resolutions.get('auto_applied') ?? 0,
      undone: resolutions.get('undone') ?? 0,
      ai_calls_today: await this.messages.countAllAiReadSince(startOfDay),
      backlog: await this.candidates.pendingPerUser(),
    };
  }

  /** Whether the configured transport can reach its mail now, and if not, why. */
  async test(): Promise<MailIngestAdminTestResponse> {
    const transport = await this.settings.transport();
    const error = await this.problemWith(transport);
    return { transport, ok: error === null, error };
  }

  private async problemWith(transport: MailIngestTransportSetting): Promise<string | null> {
    switch (transport) {
      case 'off':
        return 'No transport is set; mails come in by upload only';
      case 'webhook':
        return (await this.settings.webhookSecret()) ? null : 'No webhook secret is set';
      case 'cloud':
        return this.relays.current() ? null : 'The TREK Cloud relay is not connected';
      case 'imap':
        return this.imapProblem();
    }
  }

  /** Opens the box and its folder the way a run does, and lets go again. */
  private async imapProblem(): Promise<string | null> {
    const config = await this.settings.imapConfig();
    if (!config) return 'The IMAP host, user or password is missing';
    try {
      const session = await this.imap.connect(config);
      try {
        await session.open(config.mailbox);
      } finally {
        await session.close();
      }
      return null;
    } catch (err) {
      return describeImapFailure(err);
    }
  }

  /** Where the reader of the transport stands: the IMAP box's or the relay's cursor, else the pipeline's own. */
  private async readerCursor(transport: MailIngestTransportSetting) {
    if (transport === 'imap') {
      const config = await this.settings.imapConfig();
      return config ? this.cursor.find('imap', config.mailbox) : null;
    }
    return this.cursor.find(transport === 'cloud' ? 'cloud' : 'pipeline', '');
  }
}
