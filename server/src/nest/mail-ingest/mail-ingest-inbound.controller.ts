import { Public } from '../auth-core/public.decorator';
import { DomainError } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import {
  MailIngestWebhookService,
  WEBHOOK_RECIPIENT_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from './mail-ingest-webhook.service';
import { Controller, HttpCode, Post, Req } from '@nestjs/common';
import { mailIngestInboundResponseSchema, type MailIngestInboundResponse } from '@trek/shared';

import type { Request } from 'express';

const TOO_LARGE = 'This mail is larger than the import takes';

/**
 * `POST /api/mail-ingest/inbound`: the signed webhook a mail service posts
 * every mail to, raw (message/rfc822). It does not exist (404) unless the
 * import is on, the webhook is its transport and a secret is set; then the
 * body is read up to the import's limit, and the signature over it decides.
 * The JSON parsers leave a message/rfc822 body alone, so this route reads
 * the stream itself and nothing of the mail reaches the request log.
 */
@Controller('api/mail-ingest/inbound')
export class MailIngestInboundController {
  constructor(private readonly webhook: MailIngestWebhookService) {}

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
    const raw = await readBody(req, this.webhook.maxBytes());
    return this.webhook.receive(secret, raw, {
      timestamp: req.get(WEBHOOK_TIMESTAMP_HEADER),
      signature: req.get(WEBHOOK_SIGNATURE_HEADER),
      recipient: req.get(WEBHOOK_RECIPIENT_HEADER),
    });
  }
}

/**
 * The request body, up to `maxBytes`. Past the limit the rest is drained
 * unread, so the sender gets the 413 rather than a reset connection.
 */
function readBody(req: Request, maxBytes: number): Promise<Buffer> {
  if (Number(req.get('content-length')) > maxBytes) return Promise.reject(new DomainError(413, TOO_LARGE));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size <= maxBytes) chunks.push(chunk);
    });
    req.on('end', () => (size > maxBytes ? reject(new DomainError(413, TOO_LARGE)) : resolve(Buffer.concat(chunks))));
    req.on('error', reject);
  });
}
