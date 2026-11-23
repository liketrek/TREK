import { Public } from '../auth-core/public.decorator';
import { DomainError } from '../common/domain-error';
import { RateLimitService } from '../common/rate-limit.service';
import { ResponseContract } from '../common/response-contract';
import {
  MailIngestWebhookService,
  WEBHOOK_RECIPIENT_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  type WebhookSignedParts,
} from './mail-ingest-webhook.service';
import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import { mailIngestInboundResponseSchema, type MailIngestInboundResponse } from '@trek/shared';

import type { Request } from 'express';

const TOO_LARGE = 'This mail is larger than the import takes';
const TOO_SLOW = 'The mail took too long to arrive; send it again';
/** Requests one address may post in a minute: a mail service delivers in bursts, never at this rate for long. */
const REQUESTS_PER_MINUTE = 120;
/** Memory all bodies being read may hold together, in the import's largest mails. */
const MAX_BODIES_IN_FLIGHT = 4;
/** How long one body may take to arrive; a mail service posts a whole mail in seconds. */
const READ_DEADLINE_MS = 60_000;

/**
 * `POST /api/mail-ingest/inbound`: the signed webhook a mail service posts
 * every mail to, raw (message/rfc822). It does not exist (404) unless the
 * import is on, the webhook is its transport and a secret is set; then the
 * body is read up to the import's limit, and the signature over it decides.
 * Before a byte of the body is read, a request whose headers cannot carry a
 * valid signature is refused, each address has its share of requests a
 * minute, and the bodies being read hold only a few of the largest mails in
 * memory together; a sender told 429 tries again. A body that trickles in
 * holds no share of that memory and is cut off after a minute. The JSON parsers leave a message/rfc822 body alone, so this route
 * reads the stream itself and nothing of the mail reaches the request log.
 */
@Controller('api/mail-ingest/inbound')
export class MailIngestInboundController {
  private buffered = 0;

  constructor(
    private readonly webhook: MailIngestWebhookService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Post()
  @Public(
    'A mail service cannot hold a TREK session; an HMAC signature over the raw mail, its recipient and a timestamp within five minutes is the credential, and the route answers 404 unless the webhook is the configured transport.',
  )
  @HttpCode(200)
  @ResponseContract(mailIngestInboundResponseSchema)
  async receive(@Req() req: Request): Promise<MailIngestInboundResponse> {
    const secret = await this.webhook.secret();
    if (!req.is('message/rfc822')) {
      throw new DomainError(415, 'Send the raw mail as message/rfc822');
    }
    const signed: WebhookSignedParts = {
      timestamp: req.get(WEBHOOK_TIMESTAMP_HEADER),
      signature: req.get(WEBHOOK_SIGNATURE_HEADER),
      recipient: req.get(WEBHOOK_RECIPIENT_HEADER),
    };
    if (!this.webhook.plausiblySigned(signed)) throw new DomainError(401, 'The signature does not match');
    const now = Date.now();
    if (!(await this.rateLimit.check('mail-ingest-webhook', req.ip ?? 'unknown', REQUESTS_PER_MINUTE, 60_000, now))) {
      throw new DomainError(429, 'Too many mails in a short time; try again later');
    }
    return this.webhook.receive(secret, await this.readLimited(req), signed);
  }

  /** The body, while all bodies being read hold less than {@link MAX_BODIES_IN_FLIGHT} of the largest mails. */
  private async readLimited(req: Request): Promise<Buffer> {
    const maxBytes = this.webhook.maxBytes();
    const budget = MAX_BODIES_IN_FLIGHT * maxBytes;
    let held = 0;
    try {
      return await readBody(req, maxBytes, (bytes) => {
        if (this.buffered + bytes > budget) return false;
        this.buffered += bytes;
        held += bytes;
        return true;
      });
    } finally {
      this.buffered -= held;
    }
  }
}

/**
 * The request body, up to `maxBytes`, each chunk kept only once `take` grants
 * its memory. Past the limit the rest is drained unread, so the sender gets
 * the 413 rather than a reset connection; a refused chunk or a body still
 * arriving at the deadline ends the read the same way.
 */
function readBody(req: Request, maxBytes: number, take: (bytes: number) => boolean): Promise<Buffer> {
  if (Number(req.get('content-length')) > maxBytes) return Promise.reject(new DomainError(413, TOO_LARGE));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const stop = (error: Error) => {
      clearTimeout(deadline);
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.resume();
      reject(error);
    };
    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) return;
      if (!take(chunk.length)) stop(new DomainError(429, 'Too many mails at once; try again shortly'));
      else chunks.push(chunk);
    };
    const onEnd = () => {
      clearTimeout(deadline);
      if (size > maxBytes) reject(new DomainError(413, TOO_LARGE));
      else resolve(Buffer.concat(chunks));
    };
    const deadline = setTimeout(() => stop(new DomainError(408, TOO_SLOW)), READ_DEADLINE_MS);
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', stop);
  });
}
