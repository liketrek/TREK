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
const QUESTIONS_PER_MINUTE = 60;
/**
 * Questions the whole installation may put a minute. The TREK services allow
 * a key 120 calls a minute across their services, so routing stays below
 * that and leaves the address and place search their share.
 */
const INSTALLATION_QUESTIONS_PER_MINUTE = 100;
const RATE_WINDOW_MS = 60_000;
/** Short, because FOSSGIS still has to answer behind it while the planner waits. */
const TIMEOUT_MS = 10_000;
/** Matching a long line takes Valhalla a while, on FOSSGIS as much as here. */
const TRACE_TIMEOUT_MS = 30_000;
/** How long every question goes to FOSSGIS after the TREK Valhalla failed one. */
const REST_MS = 60_000;
/** The longest wait a Retry-After is followed for; the first question after it finds out whether the allowance is back. */
const MAX_REST_MS = 60 * 60_000;
/** A day with alternates, or the description of a long line, stays far below this. */
const MAX_ANSWER_BYTES = 8 * 1024 * 1024;

/** Valhalla's answer as it came: its status, its content type, its body untouched and the wait a refusal asks for. */
export interface ValhallaRelayAnswer {
  status: number;
  contentType: string;
  body: Buffer;
  retryAfter?: string;
}

/**
 * The TREK services' Valhalla, asked on behalf of a signed-in user. The
 * address comes from configuration (TREK_VALHALLA_URL), never from the
 * request; the installation key goes with it only to a host
 * TREK_SERVICES_HOSTS lists, so a browser never sees the key and a user
 * cannot send it anywhere else. Every question counts against the user's
 * allowance here, whichever surface asks it.
 *
 * A host that failed a question, or refused it for a spent allowance, is left
 * alone for a while: the relay then answers 503 at once and every caller asks
 * FOSSGIS, instead of each leg of a long day waiting out the deadline again.
 */
@Injectable()
export class RoutingRelayService {
  private restingUntil = 0;

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
    timeoutMs = action === 'trace_attributes' ? TRACE_TIMEOUT_MS : TIMEOUT_MS,
  ): Promise<ValhallaRelayAnswer> {
    const parsed = VALHALLA_RELAY_REQUEST_SCHEMAS[action].safeParse(compactValhallaRequest(action, body));
    if (!parsed.success) {
      throw new DomainError(400, parsed.error.issues[0]?.message ?? 'Invalid routing request');
    }
    const url = this.endpoint(action);
    const headers = this.keyHeaders(url);
    if (!headers) throw new DomainError(503, 'The TREK routing service is not available on this instance');
    const now = Date.now();
    if (now < this.restingUntil) {
      return refusal(503, 'The TREK routing service is resting', this.restingUntil - now);
    }
    const allowed = await this.rateLimit.check(
      'valhalla-relay',
      String(userId),
      QUESTIONS_PER_MINUTE,
      RATE_WINDOW_MS,
      now,
    );
    if (!allowed) throw new DomainError(429, 'Too many routing requests, try again in a minute');
    const withinInstallation = await this.rateLimit.check(
      'valhalla-relay-installation',
      'all',
      INSTALLATION_QUESTIONS_PER_MINUTE,
      RATE_WINDOW_MS,
      now,
    );
    if (!withinInstallation) return refusal(429, 'Too many routing requests on this instance', RATE_WINDOW_MS);
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
      const retryAfter = response.headers.get('retry-after');
      if (response.status === 429) this.rest(waitOf(retryAfter) ?? REST_MS);
      else if (response.status >= 500) this.rest(REST_MS);
      const { bytes, truncated } = await readCapped(response, MAX_ANSWER_BYTES);
      if (truncated) throw new Error('the answer is larger than the relay passes on');
      return {
        status: response.status,
        contentType: response.headers.get('content-type') ?? 'application/json',
        body: bytes,
        ...(retryAfter ? { retryAfter } : {}),
      };
    } catch (err) {
      this.rest(REST_MS);
      logWarn(`[Routing relay] ${url.pathname}: ${err instanceof Error ? err.message : String(err)}`);
      throw new DomainError(502, 'The TREK routing service did not answer');
    }
  }

  private rest(ms: number): void {
    this.restingUntil = Math.max(this.restingUntil, Date.now() + Math.min(ms, MAX_REST_MS));
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

/** A refusal of the relay's own, in the body the exception filter writes, with the wait it asks for. */
function refusal(status: number, error: string, waitMs: number): ValhallaRelayAnswer {
  return {
    status,
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({ error })),
    retryAfter: String(Math.max(1, Math.ceil(waitMs / 1000))),
  };
}

/** A Retry-After in milliseconds, given as seconds or as an HTTP date; null when there is none to read. */
function waitOf(header: string | null): number | null {
  const value = header?.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value) * 1000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}
