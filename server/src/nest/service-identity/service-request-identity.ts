import { servicesConfig } from '../app-config/tokens';
import { QuotaTracker } from './quota-tracker';
import { ServiceClock } from './service-clock';
import { isAllowlisted, readQuotaHeaders, serverDateMs } from './service-identity.helpers';
import { ServiceIdentityPort } from './service-identity.interface';
import { ServiceKeyService } from './service-key.service';
import { serviceUserAgent } from './user-agent';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

/** A revocation notice is one short JSON object; nothing longer is read. */
const NOTICE_MAX_CHARS = 2048;

/**
 * The identity every request to a liketrek service carries, and what TREK
 * learns from each answer. The key goes to the allowlisted hosts only; a
 * mirror, a plugin's egress or any other host never sees it.
 */
@Injectable()
export class ServiceRequestIdentity extends ServiceIdentityPort {
  constructor(
    @Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>,
    private readonly keys: ServiceKeyService,
    private readonly tracker: QuotaTracker,
    private readonly clock: ServiceClock,
  ) {
    super();
  }

  headersFor(url: URL): Record<string, string> {
    const headers: Record<string, string> = { 'User-Agent': serviceUserAgent() };
    if (!isAllowlisted(url, this.config.hosts)) return headers;
    const bearer = this.keys.bearer();
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    return headers;
  }

  observe(url: URL, response: Response): void {
    if (!isAllowlisted(url, this.config.hosts)) return;
    this.clock.learn(serverDateMs(response.headers));
    this.tracker.record(readQuotaHeaders(response.headers));
    if (response.ok) this.keys.noteAccepted();
    else if (response.status === 401) this.keys.noteInvalid();
    else if (response.status === 403) void this.checkRevocation(response.clone());
  }

  private async checkRevocation(response: Response): Promise<void> {
    if (await saysRevoked(response)) this.keys.noteRevoked();
  }
}

/** A 403 means a revoked key only when the body says so; anything else leaves the key alone. */
async function saysRevoked(response: Response): Promise<boolean> {
  try {
    return (await readUpTo(response, NOTICE_MAX_CHARS)).includes('key_revoked');
  } catch {
    return false;
  }
}

async function readUpTo(response: Response, maxChars: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  return readOn(reader, new TextDecoder(), '', maxChars);
}

async function readOn(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  text: string,
  maxChars: number,
): Promise<string> {
  if (text.length > maxChars) {
    await reader.cancel();
    return text;
  }
  const { done, value } = await reader.read();
  if (done) return text;
  return readOn(reader, decoder, text + decoder.decode(value, { stream: true }), maxChars);
}
