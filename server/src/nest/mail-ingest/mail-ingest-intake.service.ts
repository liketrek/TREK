import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import type { MailIngestAddressRow } from '../../db/repositories/MailIngestAddresses.repository';
import type { MailIngestCandidatesRepository } from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../db/types';
import { MailReadService } from '../llm-parse/mail-read.service';
import type { WalkedMail } from '../llm-parse/mail-read.types';
import { MailIngestAddressService } from './mail-ingest-address.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { sealMail } from './mail-seal';
import { MAIL_INGEST_LIMITS } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { MailIngestTransport } from '@trek/shared';

import { createHash } from 'node:crypto';

/** Why a mail was not taken in. A transport answers each the way its protocol does (a 550, a 404, a 413). */
export type MailIntakeRefusal =
  | 'unavailable'
  | 'too_large'
  | 'not_a_mail'
  | 'unknown_address'
  | 'address_daily_limit'
  | 'inbox_full';

/**
 * Refusals that pass: the import is switched off for now, the address took
 * its share for the day, or its person's inbox is full. A transport keeps
 * such a mail and offers it again later instead of dropping it.
 */
const PASSING_REFUSALS: ReadonlySet<MailIntakeRefusal> = new Set(['unavailable', 'address_daily_limit', 'inbox_full']);

export function isPassingRefusal(reason: MailIntakeRefusal): boolean {
  return PASSING_REFUSALS.has(reason);
}

type MailIntakeResult =
  | { status: 'accepted' | 'duplicate'; messageId: number }
  | { status: 'refused'; reason: MailIntakeRefusal };

/** A received mail's outcome over every address it reached. */
type MailReceiveResult = { status: 'accepted' | 'duplicate' } | { status: 'refused'; reason: MailIntakeRefusal };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Where every mail comes in, whatever carried it: an IMAP box, the signed
 * webhook, the TREK Cloud relay, or an .eml the person uploaded. It only
 * stores the mail, encrypted and queued, once per address and Message-ID,
 * and answers at once; the processing job reads it later. So a transport can
 * acknowledge as soon as this returns, and a mail delivered twice is read once.
 */
@Injectable()
export class MailIngestIntakeService {
  constructor(
    @InjectRepository(MailIngestMessages) private readonly messages: MailIngestMessagesRepository,
    @InjectRepository(MailIngestCandidates) private readonly candidates: MailIngestCandidatesRepository,
    private readonly settings: MailIngestSettingsService,
    private readonly addresses: MailIngestAddressService,
    private readonly reader: MailReadService,
  ) {}

  /**
   * A mail a transport received, stored once for every live address it was
   * sent to. `envelopeRecipients` are the RCPT TO addresses where the
   * transport knows them, and then the only ones read; otherwise the delivery
   * header the receiving server put on top names the address.
   *
   * When one of its addresses refuses it for now, the whole mail answers that
   * refusal: the transport offers it again, and the copies stored already
   * come back as duplicates.
   */
  async receive(
    raw: Buffer,
    transport: Exclude<MailIngestTransport, 'upload'>,
    envelopeRecipients: readonly string[] = [],
  ): Promise<MailReceiveResult> {
    const refused = await this.precheck(raw);
    if (refused) return { status: 'refused', reason: refused };
    const mail = this.reader.walk(raw);
    if (!mail) return { status: 'refused', reason: 'not_a_mail' };
    const recipients = envelopeRecipients.length > 0 ? envelopeRecipients : headerRecipients(mail.envelope);
    const addresses = await this.addresses.resolveAll(recipients);
    if (addresses.length === 0) return { status: 'refused', reason: 'unknown_address' };
    const results = await addresses.reduce<Promise<MailIntakeResult[]>>(async (previous, address) => {
      const done = await previous;
      return [...done, await this.store(raw, transport, address, mail.envelope.messageId)];
    }, Promise.resolve([]));
    return combined(results);
  }

  /** An .eml the person uploaded, read as if they had forwarded it to their own address. */
  async upload(raw: Buffer, userId: number): Promise<MailIntakeResult> {
    const refused = await this.precheck(raw);
    if (refused) return { status: 'refused', reason: refused };
    const mail = this.reader.walk(raw);
    if (!mail) return { status: 'refused', reason: 'not_a_mail' };
    const address = await this.addresses.ensureOwn(userId);
    return this.store(raw, 'upload', address, mail.envelope.messageId);
  }

  private async precheck(raw: Buffer): Promise<MailIntakeRefusal | null> {
    if (!(await this.settings.isAvailable())) return 'unavailable';
    if (raw.length > this.settings.maxMailBytes()) return 'too_large';
    return null;
  }

  /** @txIndependent the mail is stored by itself; noting the address's last use stands on its own. */
  private async store(
    raw: Buffer,
    transport: MailIngestTransport,
    address: MailIngestAddressRow,
    messageIdHdr: string | null,
  ): Promise<MailIntakeResult> {
    const dedupeHash = createHash('sha256')
      .update(`${address.id}\n${messageIdHdr ?? createHash('sha256').update(raw).digest('hex')}`)
      .digest('hex');
    const known = await this.messages.findIdByDedupeHash(dedupeHash);
    if (known !== null) return { status: 'duplicate', messageId: known };

    const now = new Date();
    const today = await this.messages.countForAddressSince(address.id, dbNow(new Date(now.getTime() - DAY_MS)));
    if (today >= MAIL_INGEST_LIMITS.mailsPerAddressPerDay) return { status: 'refused', reason: 'address_daily_limit' };
    if ((await this.candidates.countPending(address.user_id)) >= MAIL_INGEST_LIMITS.pendingPerUser) {
      return { status: 'refused', reason: 'inbox_full' };
    }

    const id = await this.messages.insertIfNew({
      transport,
      messageIdHdr: messageIdHdr?.slice(0, 500) ?? null,
      dedupeHash,
      addressId: address.id,
      userId: address.user_id,
      tripId: address.trip_id,
      size: raw.length,
      rawEnc: sealMail(raw),
      receivedAt: dbNow(now),
    });
    // Another delivery of the same mail won the insert in between: it is in, once.
    if (id === null) {
      const winner = await this.messages.findIdByDedupeHash(dedupeHash);
      return winner === null ? { status: 'refused', reason: 'not_a_mail' } : { status: 'duplicate', messageId: winner };
    }
    await this.addresses.touch(address.id);
    return { status: 'accepted', messageId: id };
  }
}

/**
 * The addresses the headers name when the transport knows no envelope: the
 * topmost Delivered-To, else the topmost X-Original-To, which the receiving
 * server adds above whatever the mail brought along, and only without either
 * the To line. A sender who names another token there gains nothing over
 * sending to that token directly.
 */
function headerRecipients(envelope: WalkedMail['envelope']): string[] {
  const delivered = [envelope.deliveredTo, envelope.xOriginalTo].find((value) => !!value?.trim());
  if (delivered) return [delivered];
  return (envelope.to ?? '').split(',').filter((value) => value.trim() !== '');
}

/** One answer for a mail stored per address: a passing refusal first, then accepted, then duplicate. */
function combined(results: readonly MailIntakeResult[]): MailReceiveResult {
  const passing = results.find((result) => result.status === 'refused' && isPassingRefusal(result.reason));
  if (passing) return passing;
  if (results.some((result) => result.status === 'accepted')) return { status: 'accepted' };
  if (results.some((result) => result.status === 'duplicate')) return { status: 'duplicate' };
  return results[0] ?? { status: 'refused', reason: 'unknown_address' };
}
