import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import { MAIL_INGEST_ATTACHMENTS } from '../../db/json-columns';
import type {
  MailIngestCandidateRow,
  MailIngestCandidatesRepository,
} from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { utcSuffix } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import { DomainError } from '../common/domain-error';
import { MailReadService } from '../llm-parse/mail-read.service';
import { MailIngestAddressService } from './mail-ingest-address.service';
import { MailIngestIntakeService, type MailIntakeRefusal } from './mail-ingest-intake.service';
import { MailIngestNotifyService } from './mail-ingest-notify.service';
import { MailIngestProcessJob } from './mail-ingest-process.job';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { candidateView, messageView } from './mail-ingest-views';
import { openMail } from './mail-seal';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  MailIngestAddressResponse,
  MailIngestCandidate,
  MailIngestInboxCountResponse,
  MailIngestInboxQuery,
  MailIngestInboxResponse,
  MailIngestMessagePreviewResponse,
  MailIngestPrefsUpdateRequest,
  MailIngestSettingsResponse,
  MailIngestTripRef,
  MailIngestUploadResponse,
} from '@trek/shared';

/** How an upload the intake refused answers, by why. */
const UPLOAD_REFUSALS: Record<MailIntakeRefusal, [status: number, error: string]> = {
  unavailable: [404, 'Mail import is not available'],
  too_large: [413, 'This mail is larger than the import takes'],
  not_a_mail: [422, 'This file is not a mail'],
  unknown_address: [422, 'This file is not a mail'],
  address_daily_limit: [429, 'Your address took all the mails it takes today'],
  inbox_full: [409, 'Your inbox is full; decide some of its entries first'],
};

/**
 * What a person sees of their mail import: the settings card (their address,
 * their switches, whether AI reads for them), their inbox page by page, a
 * mail as plain text, and an .eml they upload. Every read is the person's
 * own: an entry or a mail of someone else answers as missing.
 */
@Injectable()
export class MailIngestInboxService {
  constructor(
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly addresses: MailIngestAddressService,
    private readonly intake: MailIngestIntakeService,
    private readonly reader: MailReadService,
    private readonly job: MailIngestProcessJob,
    private readonly notify: MailIngestNotifyService,
  ) {}

  /** The settings card. Where the import is off or not part of the plan it says so, and nothing else. */
  async settingsOf(userId: number): Promise<MailIngestSettingsResponse> {
    const prefs = await this.settings.prefsOf(userId);
    if (!(await this.settings.isAvailable())) {
      return { available: false, address: null, prefs, ai_available: false, pending: 0 };
    }
    return {
      available: true,
      address: await this.addresses.ownAddressForCard(userId, prefs.enabled),
      prefs,
      // Whether AI reading can work here at all (the AI Parsing addon and a connection), not the person's own
      // switch: with it folded in, switching AI off greyed the switch out and it could never come back on.
      ai_available: await this.reader.isAvailable(userId),
      pending: await this.candidates.countPending(userId),
    };
  }

  async updatePrefs(userId: number, update: MailIngestPrefsUpdateRequest): Promise<MailIngestSettingsResponse> {
    await this.requireAvailable();
    await this.settings.updatePrefs(userId, update);
    this.notify.settingsChanged(userId);
    return this.settingsOf(userId);
  }

  /** A new own address; the old one stops taking mail at once. */
  async renewOwnAddress(userId: number): Promise<MailIngestAddressResponse> {
    await this.requireAvailable();
    const address = await this.addresses.renewOwn(userId);
    this.notify.settingsChanged(userId);
    return { address };
  }

  async tripAddress(userId: number, tripId: number): Promise<MailIngestAddressResponse> {
    await this.requireAvailable();
    return { address: await this.addresses.tripAddress(userId, tripId) };
  }

  /** The person's address for the trip, made now or renewed. */
  async renewTripAddress(userId: number, tripId: number): Promise<MailIngestAddressResponse> {
    await this.requireAvailable();
    const address = await this.addresses.renewTripAddress(userId, tripId);
    this.notify.settingsChanged(userId);
    return { address };
  }

  async revokeTripAddress(userId: number, tripId: number): Promise<void> {
    await this.requireAvailable();
    await this.addresses.revokeTripAddress(userId, tripId);
    this.notify.settingsChanged(userId);
  }

  /** One page of the inbox, newest first, each entry with the mail it came from. */
  async inbox(userId: number, query: MailIngestInboxQuery, now: Date = new Date()): Promise<MailIngestInboxResponse> {
    await this.requireAvailable();
    const rows = await this.candidates.listForUser(userId, query.status === 'open', query.before ?? null, query.limit);
    const mails = await this.messages.listHeads(uniq(rows.map((row) => row.message_id)));
    const heads = new Map(mails.map((head) => [head.id, head]));
    const trips = await this.tripsNamedBy(userId, rows);
    const entries = rows.flatMap((row) => {
      const head = heads.get(row.message_id);
      return head ? [{ ...candidateView(row, trips, now), message: messageView(head) }] : [];
    });
    return {
      entries,
      pending: await this.candidates.countPending(userId),
      next_before: rows.length === query.limit ? (rows.at(-1)?.id ?? null) : null,
    };
  }

  async count(userId: number): Promise<MailIngestInboxCountResponse> {
    if (!(await this.settings.isAvailable())) return { pending: 0 };
    return { pending: await this.candidates.countPending(userId) };
  }

  /** An entry as the inbox shows it, for the answer of an action on it. */
  async entry(row: MailIngestCandidateRow, now: Date = new Date()): Promise<MailIngestCandidate> {
    return candidateView(row, await this.tripsNamedBy(row.user_id, [row]), now);
  }

  /** "Show mail": the mail as plain text, without its headers, as long as it is stored. */
  async preview(userId: number, messageId: number): Promise<MailIngestMessagePreviewResponse> {
    await this.requireAvailable();
    const message = await this.messages.findById(messageId);
    if (!message || message.user_id !== userId) throw new DomainError(404, 'Mail not found');
    const raw = openMail(message.raw_eml_enc);
    const mail = raw ? this.reader.walk(raw) : null;
    if (!mail) throw new DomainError(410, 'The mail is no longer stored');
    return {
      id: message.id,
      subject: mail.subject ?? message.subject,
      received_at: utcSuffix(message.received_at) ?? message.received_at,
      text: mail.body,
      attachments: decodeJson(MAIL_INGEST_ATTACHMENTS, message.attachments),
    };
  }

  /**
   * An .eml the person uploaded, read as if they had forwarded it to their
   * own address. A person who switched their import off uploads nothing: the
   * pipeline would only put the mail aside. The pipeline is asked to run at
   * once rather than at its next tick, so the inbox fills while the person
   * still looks at it.
   *
   * @txIndependent the mail is stored by itself; its reading runs on its own afterwards.
   */
  async upload(userId: number, raw: Buffer): Promise<MailIngestUploadResponse> {
    if ((await this.settings.isAvailable()) && !(await this.settings.prefsOf(userId)).enabled) {
      throw new DomainError(409, 'Your mail import is switched off');
    }
    const result = await this.intake.upload(raw, userId);
    if (result.status === 'refused') {
      const [status, error] = UPLOAD_REFUSALS[result.reason];
      throw new DomainError(status, error);
    }
    const [head] = await this.messages.listHeads([result.messageId]);
    if (!head) throw new Error(`mail ${result.messageId} vanished after its upload`);
    if (result.status === 'accepted') this.job.runSoon();
    return { message: messageView(head), duplicate: result.status === 'duplicate' };
  }

  private async requireAvailable(): Promise<void> {
    if (!(await this.settings.isAvailable())) throw new DomainError(404, 'Mail import is not available');
  }

  /** The trips these entries suggest, as far as the reader can see them. */
  private async tripsNamedBy(
    userId: number,
    rows: readonly MailIngestCandidateRow[],
  ): Promise<Map<number, MailIngestTripRef>> {
    const ids = uniq(rows.flatMap((row) => (row.suggested_trip_id === null ? [] : [row.suggested_trip_id])));
    const refs = await this.candidates.listTripRefs(userId, ids);
    return new Map(refs.map((ref) => [ref.id, ref]));
  }
}

function uniq(ids: readonly number[]): number[] {
  return [...new Set(ids)];
}
