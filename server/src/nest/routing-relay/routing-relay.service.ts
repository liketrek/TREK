import { readCapped } from '../../utils/cappedFetch';
import { safeFetchAdminConfigured } from '../../utils/ssrfGuard';
import { servicesConfig } from '../app-config/tokens';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { RateLimitService } from '../common/rate-limit.service';
import { ServiceIdentityPort } from '../service-identity/service-identity.interface';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { VALHALLA_RELAY_REQUEST_SCHEMAS, compactValhallaRequest, type ValhallaRelayAction } from '@trek/shared';

/** Questions one user may put to the TREK Valhalla a minute, the browser and the server's own routing together. */
const QUESTIONS_PER_MINUTE = 120;
const RATE_WINDOW_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 30_000;
/** A day with alternates, or the description of a long line, stays far below this. */
const MAX_ANSWER_BYTES = 8 * 1024 * 1024;

/** Valhalla's answer as it came: its status, its content type and its body untouched. */
export interface ValhallaRelayAnswer {
  status: number;
  contentType: string;
  body: Buffer;
}

/**
 * The TREK services' Valhalla, asked on behalf of a signed-in user. The
 * address comes from configuration (TREK_VALHALLA_URL), never from the
 * request; the installation key goes with it only to a host
 * TREK_SERVICES_HOSTS lists, so a browser never sees the key and a user
 * cannot send it anywhere else. Every question counts against the user's
 * allowance here, whichever surface asks it.
 */
@Injectable()
export class RoutingRelayService {
  constructor(
    @Inject(servicesConfig.KEY) private readonly config: ConfigType<typeof servicesConfig>,
    private readonly identity: ServiceIdentityPort,
    private readonly rateLimit: RateLimitService,
  ) {}

  /** The TREK Valhalla's address while it can be asked: the services are on and hold a key for it. */
  trekValhalla(): string | null {
    return this.keyHeaders(new URL(this.config.valhallaUrl)) ? this.config.valhallaUrl : null;
  }

  /** Whether an address names the TREK Valhalla, whose questions go through here and nowhere else. */
  serves(base: string): boolean {
    return base.trim().replace(/\/+$/, '') === this.config.valhallaUrl;
  }

  async ask(
    userId: number,
    action: ValhallaRelayAction,
    body: object,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ): Promise<ValhallaRelayAnswer> {
    const parsed = VALHALLA_RELAY_REQUEST_SCHEMAS[action].safeParse(compactValhallaRequest(action, body));
    if (!parsed.success) {
      throw new DomainError(400, parsed.error.issues[0]?.message ?? 'Invalid routing request');
    }
    const url = this.endpoint(action);
    const headers = this.keyHeaders(url);
    if (!headers) throw new DomainError(503, 'The TREK routing service is not available on this instance');
    const allowed = await this.rateLimit.check(
      'valhalla-relay',
      String(userId),
      QUESTIONS_PER_MINUTE,
      RATE_WINDOW_MS,
      Date.now(),
    );
    if (!allowed) throw new DomainError(429, 'Too many routing requests, try again in a minute');
    return this.forward(url, headers, parsed.data, timeoutMs);
  }

  private async forward(
    url: URL,
    identity: Record<string, string>,
    body: unknown,
    timeoutMs: number,
  ): Promise<ValhallaRelayAnswer> {
    try {
      const response = await safeFetchAdminConfigured(
        url.href,
        {
          method: 'POST',
          headers: { ...identity, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        },
        0,
        undefined,
        MAX_ANSWER_BYTES,
      );
      this.identity.observe(url, response);
      const { bytes, truncated } = await readCapped(response, MAX_ANSWER_BYTES);
      if (truncated) throw new Error('the answer is larger than the relay passes on');
      return {
        status: response.status,
        contentType: response.headers.get('content-type') ?? 'application/json',
        body: bytes,
      };
    } catch (err) {
      logWarn(`[Routing relay] ${url.pathname}: ${err instanceof Error ? err.message : String(err)}`);
      throw new DomainError(502, 'The TREK routing service did not answer');
    }
  }

  private endpoint(action: ValhallaRelayAction): URL {
    return new URL(`${this.config.valhallaUrl}/${action}`);
  }

  /** The identity headers for the TREK Valhalla, or null while there is no key to send. */
  private keyHeaders(url: URL): Record<string, string> | null {
    if (this.config.mode === 'off') return null;
    const headers = this.identity.headersFor(url);
    return headers.Authorization ? headers : null;
  }
}
