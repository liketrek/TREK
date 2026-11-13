import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import type { MailIngestAddressRow } from '../../db/repositories/MailIngestAddresses.repository';
import type { MailIngestCandidatesRepository } from '../../db/repositories/MailIngestCandidates.repository';
import type { MailIngestMessagesRepository } from '../../db/repositories/MailIngestMessages.repository';
import { dbNow } from '../../db/types';
import { MailReadService } from '../llm-parse/mail-read.service';
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

export type MailIntakeResult =
  | { status: 'accepted' | 'duplicate'; messageId: number }
  | { status: 'refused'; reason: MailIntakeRefusal };

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
   * A mail a transport received. `envelopeRecipients` are the RCPT TO
   * addresses where the transport knows them; otherwise the headers name the
   * address, in the order the receiving server adds them.
   */
  async receive(
    raw: Buffer,
    transport: Exclude<MailIngestTransport, 'upload'>,
    envelopeRecipients: readonly string[] = [],
  ): Promise<MailIntakeResult> {
    const refused = await this.precheck(raw);
    if (refused) return { status: 'refused', reason: refused };
    const mail = this.reader.walk(raw);
    if (!mail) return { status: 'refused', reason: 'not_a_mail' };
    const { deliveredTo, xOriginalTo, to } = mail.envelope;
    const headerRecipients = [deliveredTo, xOriginalTo, ...(to ?? '').split(',')].filter(
      (value): value is string => !!value && value.trim() !== '',
    );
    const resolved = await this.addresses.resolve([...envelopeRecipients, ...headerRecipients]);
    if (!resolved) return { status: 'refused', reason: 'unknown_address' };
    return this.store(raw, transport, resolved.address, mail.envelope.messageId);
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
