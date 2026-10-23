import { ALL_SCOPES, DEFAULT_CLIENT_SCOPES } from '../../mcp/scopes';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import { logWarn } from '../audit/audit-log.logger';
import { RateLimitService } from '../common/rate-limit.service';
import { classifyRedirectUri } from './oauth.helpers';
import { Injectable } from '@nestjs/common';

import { z } from 'zod';

/**
 * Client ID Metadata Documents (draft-ietf-oauth-client-id-metadata-document):
 * a client whose client_id is the https URL of a JSON document describing it,
 * so it needs no registration call. claude.ai's custom connectors use it.
 *
 * Dynamic registration (oauth-sdk.provider.ts) is untouched; this only answers
 * for client ids that are https URLs, which no registered client can hold (their
 * ids are UUIDs). Resolving never writes: OauthService persists a client the
 * first time a signed-in user approves it, because the consent and token rows
 * reference oauth_clients by foreign key. Until then an anonymous
 * /oauth/authorize with a fresh URL costs at most one rate-limited fetch.
 */
export interface CimdClient {
  /** The document URL, exactly as the client sent it. */
  clientId: string;
  /** The host the document was fetched from, which is what the consent screen vouches for. */
  host: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// A document that failed is asked for again after a minute, not a day.
const FAILURE_TTL_MS = 60 * 1000;
const MAX_CACHED = 500;
const FETCH_TIMEOUT_MS = 5000;
const MAX_DOCUMENT_BYTES = 16 * 1024;
const MIN = 60_000;
const FETCHES_PER_HOST_PER_MIN = 10;
const FETCHES_PER_MIN = 60;

const cimdDocumentSchema = z.object({
  client_id: z.string(),
  client_name: z.string().trim().min(1).max(100).optional(),
  redirect_uris: z.array(z.string().max(2048)).min(1).max(10),
  // A metadata document cannot carry a secret, so only public clients qualify.
  token_endpoint_auth_method: z.literal('none').optional(),
  client_secret: z.never().optional(),
  client_secret_expires_at: z.never().optional(),
  scope: z.string().max(4096).optional(),
});

export function isCimdClientId(clientId: string): boolean {
  return clientId.startsWith('https://');
}

/**
 * The URL rules of the draft: https, a path, no fragment, no credentials, no
 * dot segments. The WHATWG parser resolves dot segments and normalises case and
 * default ports, so a client_id that does not serialise back to itself is
 * refused rather than fetched under a different spelling than it claims.
 */
export function parseCimdClientId(clientId: string): URL | null {
  if (!isCimdClientId(clientId) || clientId.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(clientId);
  } catch {
    return null;
  }
  if (url.href !== clientId || url.username || url.password || url.hash || url.pathname === '/') return null;
  return url;
}

function reject(url: URL, reason: string): null {
  logWarn(`[OAuth] Client metadata document ${url.href} refused: ${reason}`);
  return null;
}

/** The validated client a fetched document describes, or null with the reason logged. */
export function toCimdClient(url: URL, body: unknown): CimdClient | null {
  const parsed = cimdDocumentSchema.safeParse(body);
  if (!parsed.success) return reject(url, parsed.error.issues[0]?.message ?? 'invalid document');
  const doc = parsed.data;
  if (doc.client_id !== url.href) return reject(url, 'client_id does not match the document URL');
  const badUri = doc.redirect_uris.find((uri) => classifyRedirectUri(uri) !== 'ok');
  if (badUri !== undefined) return reject(url, `redirect URI not allowed: ${badUri}`);
  // Same default as DCR: a client that names no scope gets the safe set, never an opt-in one.
  const requested = doc.scope ? doc.scope.split(' ').filter(Boolean) : DEFAULT_CLIENT_SCOPES;
  const scopes = requested.filter((s) => (ALL_SCOPES as string[]).includes(s));
  if (scopes.length === 0) return reject(url, 'no valid scopes requested');
  return {
    clientId: url.href,
    host: url.host,
    name: doc.client_name ?? url.host,
    redirectUris: doc.redirect_uris,
    scopes,
  };
}

/**
 * Fetches and caches client metadata documents. The cache holds a document for
 * a day and a failure for a minute; a miss is rate-limited per host and over
 * all hosts, so the authorize endpoint cannot be turned into a fetch cannon.
 */
@Injectable()
export class CimdClientResolver {
  private readonly cache = new Map<string, { client: CimdClient | null; expiresAt: number }>();
  private readonly inflight = new Map<string, Promise<CimdClient | null>>();

  constructor(private readonly rl: RateLimitService) {}

  async resolve(clientId: string): Promise<CimdClient | null> {
    const url = parseCimdClientId(clientId);
    if (!url) return null;
    const cached = this.cache.get(clientId);
    if (cached && cached.expiresAt > Date.now()) return cached.client;

    const pending = this.inflight.get(clientId);
    if (pending !== undefined) return pending;
    const lookup = this.lookup(url).finally(() => {
      this.inflight.delete(clientId);
    });
    this.inflight.set(clientId, lookup);
    return lookup;
  }

  private async lookup(url: URL): Promise<CimdClient | null> {
    const now = Date.now();
    if (!(await this.rl.check('oauth_cimd_host', url.host, FETCHES_PER_HOST_PER_MIN, MIN, now))) {
      return reject(url, 'too many fetches for this host');
    }
    if (!(await this.rl.check('oauth_cimd', 'all', FETCHES_PER_MIN, MIN, now))) {
      return reject(url, 'too many fetches');
    }
    const client = await this.fetchDocument(url);
    this.remember(url.href, client, now);
    return client;
  }

  private async fetchDocument(url: URL): Promise<CimdClient | null> {
    let body: unknown;
    try {
      const res = await safeFetchFollow(
        url.href,
        { headers: { Accept: 'application/json' } },
        {
          timeoutMs: FETCH_TIMEOUT_MS,
          maxBytes: MAX_DOCUMENT_BYTES,
          // The document must answer at its own URL, and only from the public internet.
          maxRedirects: 0,
          bypassInternalIpAllowed: true,
        },
      );
      if (!res.ok) {
        void res.body?.cancel().catch(() => {});
        return reject(url, `HTTP ${res.status}`);
      }
      body = await res.json();
    } catch (err: unknown) {
      return reject(url, err instanceof Error ? err.message : String(err));
    }
    return toCimdClient(url, body);
  }

  private remember(clientId: string, client: CimdClient | null, now: number): void {
    this.cache.delete(clientId);
    this.cache.set(clientId, { client, expiresAt: now + (client ? CACHE_TTL_MS : FAILURE_TTL_MS) });
    if (this.cache.size > MAX_CACHED) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
  }
}
