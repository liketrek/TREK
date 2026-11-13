import { DomainError } from '../common/domain-error';
import { MailIngestIntakeService, type MailIntakeRefusal } from './mail-ingest-intake.service';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { Injectable } from '@nestjs/common';
import type { MailIngestInboundResponse } from '@trek/shared';

import { createHmac, timingSafeEqual } from 'node:crypto';

/** The headers a webhook sender signs a mail with, and the address it was sent to (the RCPT TO). */
export const WEBHOOK_TIMESTAMP_HEADER = 'x-trek-timestamp';
export const WEBHOOK_SIGNATURE_HEADER = 'x-trek-signature';
export const WEBHOOK_RECIPIENT_HEADER = 'x-trek-recipient';

/** How far a signed timestamp may lie from the server's clock, either way. */
const WINDOW_MS = 5 * 60 * 1000;

/** How a mail the intake refused answers the sender, by why. */
const REFUSALS: Record<MailIntakeRefusal, [status: number, error: string]> = {
  unavailable: [404, 'Not found'],
  too_large: [413, 'This mail is larger than the import takes'],
  not_a_mail: [422, 'This is not a mail'],
  unknown_address: [422, 'No address of this server takes this mail'],
  address_daily_limit: [429, 'This address took all the mails it takes today'],
  inbox_full: [429, 'The inbox of this address is full'],
};

/** The signed parts of a webhook request, as the sender put them in its headers. */
export interface WebhookSignedParts {
  timestamp?: string;
  signature?: string;
  recipient?: string;
}

/**
 * The signed webhook: a mail service (a Cloudflare Email Worker, Postmark,
 * Mailgun) posts each mail to the install raw, signed with the admin's
 * secret. The signature covers the time it was sent, the address it was
 * sent to and every byte of the mail, so neither can be changed on the way,
 * and a request older than five minutes is refused. A request replayed
 * within that window stores nothing new: the intake keeps one copy of a mail
 * per address.
 */
@Injectable()
export class MailIngestWebhookService {
  constructor(
    private readonly settings: MailIngestSettingsService,
    private readonly intake: MailIngestIntakeService,
  ) {}

  /**
   * The secret mails are checked against. While the import is off, the
   * webhook is not its transport or no secret is set, the route answers as
   * if it did not exist.
   */
  async secret(): Promise<string> {
    const open = (await this.settings.isAvailable()) && (await this.settings.transport()) === 'webhook';
    const secret = open ? await this.settings.webhookSecret() : null;
    if (!secret) throw new DomainError(404, 'Not found');
    return secret;
  }

  maxBytes(): number {
    return this.settings.maxMailBytes();
  }

  /**
   * Whether the headers could carry a valid signature at all: a fresh
   * timestamp, a signature of the right form and a recipient within its
   * length. Checked before the body is read, so a request that can never
   * pass holds no memory.
   */
  plausiblySigned(signed: WebhookSignedParts, now: number = Date.now()): boolean {
    const { timestamp } = signed;
    if (!timestamp || !/^\d{1,12}$/.test(timestamp) || Math.abs(now - Number(timestamp) * 1000) > WINDOW_MS) {
      return false;
    }
    return /^[0-9a-f]{64}$/.test(signatureOf(signed)) && (signed.recipient?.trim() ?? '').length <= 320;
  }

  async receive(
    secret: string,
    raw: Buffer,
    signed: WebhookSignedParts,
    now: number = Date.now(),
  ): Promise<MailIngestInboundResponse> {
    const recipient = signed.recipient?.trim() ?? '';
    if (!this.plausiblySigned(signed, now) || !verifyWebhook(secret, signed, recipient, raw)) {
      throw new DomainError(401, 'The signature does not match');
    }
    const result = await this.intake.receive(raw, 'webhook', recipient ? [recipient] : []);
    if (result.status === 'refused') {
      const [status, error] = REFUSALS[result.reason];
      throw new DomainError(status, error);
    }
    return { accepted: true, duplicate: result.status === 'duplicate' };
  }
}

/**
 * The signature a sender puts on a mail: hex HMAC-SHA256, keyed with the
 * secret, over the timestamp (Unix seconds), a newline, the recipient
 * address (empty when the sender names none), a newline, and the raw mail.
 */
export function signWebhookMail(secret: string, timestamp: string, recipient: string, raw: Buffer): string {
  return createHmac('sha256', secret).update(`${timestamp}\n${recipient}\n`).update(raw).digest('hex');
}

/** The signature over a request whose headers were found plausible: compared in constant time. */
function verifyWebhook(secret: string, signed: WebhookSignedParts, recipient: string, raw: Buffer): boolean {
  const expected = signWebhookMail(secret, signed.timestamp ?? '', recipient, raw);
  return timingSafeEqual(Buffer.from(signatureOf(signed), 'hex'), Buffer.from(expected, 'hex'));
}

/** The hex signature as sent, with or without its `sha256=` prefix. */
function signatureOf(signed: WebhookSignedParts): string {
  return (signed.signature ?? '')
    .trim()
    .replace(/^sha256=/i, '')
    .toLowerCase();
}
