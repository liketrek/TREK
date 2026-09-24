import { pipeline, Readable, Transform } from 'node:stream';
import type { DocsyncErrorCode } from '@trek/shared';
import { safeFetch, SsrfBlockedError } from '../../../utils/ssrfGuard';
import { discardBody } from '../../../utils/cappedFetch';

/**
 * The transport the four document clients share: the SSRF-guarded fetch with
 * its timeout and certificate switch, the reading of a request that never got
 * an answer, the base status table, and the guard on a streamed download.
 *
 * What stays in the clients is what differs on purpose: how each one
 * authenticates, the shape of its requests (Papra's JSON, WebDAV's methods and
 * Depth header, DSM's JSON-encoded form parameters), how it reads an error
 * body, and which statuses mean something narrower on that product. Each
 * client also keeps its own error class and wording, so the `instanceof`
 * checks in the adapters see exactly the errors they always saw.
 */

/** The four ways a request can fail without an HTTP answer. */
export type TransportFailureCode = Extract<
  DocsyncErrorCode,
  'ssrf_blocked' | 'timeout' | 'tls_untrusted' | 'unreachable'
>;

export interface TransportFailure {
  code: TransportFailureCode;
  /** Every message in the cause chain, for the self-hoster's log. */
  detail: string;
}

export interface ProviderFetchOptions {
  timeoutMs: number;
  /** The connection's self-signed switch. It relaxes the certificate check only; the SSRF guard still applies. */
  allowInsecureTls: boolean;
  /** The client's own error for a request that never got an answer. */
  onTransportFailure: (failure: TransportFailure) => Error;
}

export interface DownloadGuard {
  maxBytes: number;
  /** The client's error for a download that announces more than `maxBytes`. */
  tooLarge: (declared: number) => Error;
  /** And for one that arrives without a body to stream. */
  noBody: () => Error;
}

export interface GuardedDownload {
  body: Readable;
  /** The announced length, or null when the answer did not state one. */
  size: number | null;
}

/**
 * The ceiling for one download where an adapter has no number of its own.
 *
 * A runaway guard, not the install's file-size policy: the sync core applies
 * that to every byte it pulls, and this sits far above it so that the core's
 * verdict is the one a user sees.
 */
export const DOWNLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * The abort `AbortSignal.timeout` fires, and undici's header and body timers:
 * a host that took the request and then went quiet. undici's connect timer is
 * left out on purpose. A host that never completed the handshake (switched
 * off, or behind a firewall that drops the SYN) did not answer at all, so it
 * reads as unreachable.
 */
const TIMEOUT_NAME = /^(TimeoutError|AbortError)$/;
const TIMEOUT_CODE = /ABORT_ERR|HEADERS_TIMEOUT|BODY_TIMEOUT/i;

/**
 * Codes that are a verdict on the certificate rather than on the connection,
 * which is what lets the settings screen offer the self-signed switch instead
 * of a dead end. Most carry CERT or TLS in the name; the verify codes listed
 * here do not, and the switch gets past each of them all the same.
 *
 * ERR_SSL_* is deliberately not among them: a handshake that fails on the
 * protocol (https against a plain http port, say) is not something the switch
 * can fix, and `tls_untrusted` tells the user it is.
 */
const CERTIFICATE_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'HOSTNAME_MISMATCH',
  'INVALID_PURPOSE',
  'INVALID_CA',
  'PATH_LENGTH_EXCEEDED',
]);
const CERTIFICATE_CODE = /CERT|SELF_SIGNED|ERR_TLS/i;

/**
 * The guard's own wording for a name DNS could not resolve. It arrives as an
 * SsrfBlockedError like every other refusal, but nothing was blocked: there is
 * no address to block. Reporting it as a policy verdict sends the self-hoster
 * to the SSRF settings when the fault is a typo in the host name.
 */
const UNRESOLVED_HOST = /could not resolve hostname/i;

/** Whether a guard refusal is really a host that does not exist. */
export function isUnresolvedHost(message: string): boolean {
  return UNRESOLVED_HOST.test(message);
}

/**
 * The codes every product answers alike. A client layers its own meaning on
 * top through `overrides`, and `fallback` answers whatever neither table knows.
 */
const STATUS_CODES: Readonly<Record<number, DocsyncErrorCode>> = {
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'too_large',
  415: 'unsupported_type',
  429: 'rate_limited',
  507: 'quota_exceeded',
};

/** The error and each `cause` below it. undici hides the real reason one or two levels down. */
function causeChain(err: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current !== undefined && current !== null; depth++) {
    chain.push(current);
    current = current instanceof Error ? current.cause : undefined;
  }
  return chain;
}

function codeOf(entry: unknown): string {
  return typeof entry === 'object' && entry !== null && 'code' in entry
    ? String((entry as { code: unknown }).code)
    : '';
}

/** Why a request never produced a response. */
export function classifyTransportFailure(err: unknown): TransportFailure {
  const chain = causeChain(err);
  const detail = chain
    .map((entry) => (entry instanceof Error ? entry.message : String(entry)))
    .filter((message) => message.length > 0)
    .join(': ');

  if (err instanceof SsrfBlockedError) {
    return { code: isUnresolvedHost(err.message) ? 'unreachable' : 'ssrf_blocked', detail };
  }

  const codes = chain.map(codeOf);
  const names = chain.map((entry) => (entry instanceof Error ? entry.name : ''));
  if (names.some((name) => TIMEOUT_NAME.test(name)) || codes.some((code) => TIMEOUT_CODE.test(code))) {
    return { code: 'timeout', detail };
  }
  if (codes.some((code) => CERTIFICATE_CODES.has(code) || CERTIFICATE_CODE.test(code))) {
    return { code: 'tls_untrusted', detail };
  }
  return { code: 'unreachable', detail };
}

/**
 * One request to a user's instance: through the SSRF guard, bounded by
 * `timeoutMs`, with the certificate check relaxed only when the connection
 * asks for it. The timeout covers the body as well, so a streamed transfer is
 * bounded end to end rather than only until the headers arrive.
 */
export async function providerFetch(url: string, init: RequestInit, options: ProviderFetchOptions): Promise<Response> {
  try {
    return await safeFetch(
      url,
      { ...init, signal: AbortSignal.timeout(options.timeoutMs) as AbortSignal },
      { rejectUnauthorized: !options.allowInsecureTls },
    );
  } catch (err: unknown) {
    throw options.onTransportFailure(classifyTransportFailure(err));
  }
}

/** The docsync code for an HTTP status that is not a product-specific answer. */
export function statusErrorCode(
  status: number,
  overrides: Readonly<Record<number, DocsyncErrorCode>> = {},
  fallback: DocsyncErrorCode = 'provider_error',
): DocsyncErrorCode {
  return overrides[status] ?? STATUS_CODES[status] ?? fallback;
}

/**
 * The byte count a response announced, or null.
 *
 * An absent header must not become 0: `Number('')` is 0, and a size of zero
 * reads as "an empty file" to everything downstream. Compressed and chunked
 * answers routinely leave it out.
 */
export function declaredLength(header: string | null): number | null {
  if (header === null || header.trim().length === 0) return null;
  const value = Number(header);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Count the bytes as they pass. A declared length is only half a cap: a
 * chunked answer declares nothing, and nothing stops a server from sending
 * more than it announced.
 */
function limitStream(source: Readable, maxBytes: number): Readable {
  let seen = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      seen += chunk.length;
      if (seen > maxBytes) {
        done(new Error(`The download exceeded ${maxBytes} bytes`));
        return;
      }
      done(null, chunk);
    },
  });
  // pipeline rather than pipe: a limiter that gives up, or a consumer that
  // stops reading, has to take the source down with it. undici keeps the
  // socket reserved until the body is released.
  pipeline(source, limiter, () => {});
  return limiter;
}

/**
 * A download handed on as a stream, never buffered: the caller pipes it into
 * storage. An announced length over the limit is refused before a byte is
 * read, and the bytes are counted on the way through for the answers that
 * announce nothing.
 */
export function guardDownload(response: Response, guard: DownloadGuard): GuardedDownload {
  const size = declaredLength(response.headers.get('content-length'));
  if (size !== null && size > guard.maxBytes) {
    discardBody(response);
    throw guard.tooLarge(size);
  }
  if (!response.body) throw guard.noBody();
  return {
    body: limitStream(Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]), guard.maxBytes),
    size,
  };
}
