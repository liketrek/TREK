import { detectAuthGate, type AuthGate } from './authGate';
import { DEMO_SERVER_URL } from './links';

/**
 * Turns what someone typed into the app's address field into a TREK server it
 * can load, or a reason it cannot.
 */

export type ProbeFailure = 'invalid' | 'unreachable' | 'notTrek' | 'authGate' | 'clientCert' | 'tooOld';

/**
 * A proxy in front of the server asked for a client certificate (mutual TLS)
 * and let the check through without one. `sent`: the app showed its stored
 * certificate and the proxy refused it all the same.
 */
export interface ClientCertDemand {
  host: string;
  port: number;
  sent: boolean;
}

type ProbeResult =
  | { ok: true; url: string; reason?: undefined; gate?: undefined; cert?: undefined }
  /**
   * `authGate`: a sign-in page of the user's own stands in front of TREK
   * (authGate.ts); `url` is the server address it guards. `clientCert`: a proxy
   * wants a client certificate, `cert` says for which host and whether one was shown.
   */
  | { ok: false; reason: ProbeFailure; url?: string; gate?: AuthGate; cert?: ClientCertDemand };

export interface ProbeResponse {
  status: number;
  data: unknown;
  /** The URL after redirects. */
  url: string;
  headers?: Record<string, string>;
  /** Whether the server asked for a client certificate, and whether the app showed one (native requests only). */
  clientCert?: { requested: boolean; sent: boolean };
}
export type ProbeGet = (url: string) => Promise<ProbeResponse>;

const FEATURES_PATH = '/api/health/features';

/**
 * The oldest server API this app can work with (`nativeApi` in the features
 * response). A server from before the field existed answers without it and is
 * accepted while the minimum is 1.
 */
const MIN_NATIVE_API = 1;

function normalize(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || !parsed.hostname) return null;
  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

/**
 * Without a scheme, https comes first and plain http second: a server on the
 * home network is often reached as a bare IP and port without TLS.
 */
export function candidateUrls(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const candidates = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? [normalize(trimmed)]
    : [normalize(`https://${trimmed}`), normalize(`http://${trimmed}`)];
  return candidates.filter((url): url is string => url !== null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function judge(response: ProbeResponse): ProbeResult {
  if (response.status !== 200 || !isRecord(response.data)) return { ok: false, reason: 'notTrek' };
  if (response.data.nativeApp === true) {
    const api = response.data.nativeApi;
    if (typeof api === 'number' && api < MIN_NATIVE_API) return { ok: false, reason: 'tooOld' };
    // Follow a redirect (http to https, a canonical host) so the app loads the
    // address the server actually answers on.
    const base = response.url.endsWith(FEATURES_PATH) ? response.url.slice(0, -FEATURES_PATH.length) : null;
    return { ok: true, url: (base && normalize(base)) || '' };
  }
  return 'bookingImport' in response.data ? { ok: false, reason: 'tooOld' } : { ok: false, reason: 'notTrek' };
}

const FAILURE_RANK: Record<ProbeFailure, number> = {
  invalid: 0,
  unreachable: 1,
  notTrek: 2,
  authGate: 3,
  clientCert: 4,
  tooOld: 5,
};

/**
 * A server that asked for a client certificate and did not answer with TREK:
 * the TLS handshake failed (status 0, as nginx, Caddy and Traefik do), or the
 * proxy answered with its own refusal (Cloudflare's 403, nginx's 400).
 */
function clientCertDemand(candidate: string, response: ProbeResponse): ClientCertDemand | null {
  if (!response.clientCert?.requested) return null;
  const url = new URL(candidate);
  return { host: url.hostname.toLowerCase(), port: url.port ? Number(url.port) : 443, sent: response.clientCert.sent };
}

/**
 * A gate that did not send the check to its sign-in page (an API path can get a
 * bare 401 where a browser gets redirected) is asked once more for the start
 * page, which is what the app's web view will load, to learn the host its
 * sign-in lives on.
 */
async function withLoginHost(candidate: string, gate: AuthGate, get: ProbeGet): Promise<AuthGate> {
  if (gate.loginHost || gate.kind === 'basic') return gate;
  try {
    const page = await get(candidate + '/');
    const found = detectAuthGate(candidate + '/', page);
    return found?.loginHost ? { ...gate, loginHost: found.loginHost } : gate;
  } catch {
    return gate;
  }
}

export async function probeServer(input: string, get: ProbeGet): Promise<ProbeResult> {
  const candidates = candidateUrls(input);
  if (!candidates.length) return { ok: false, reason: 'invalid' };

  let best: ProbeResult = { ok: false, reason: 'unreachable' };
  for (const candidate of candidates) {
    let response: ProbeResponse;
    try {
      response = await get(candidate + FEATURES_PATH);
    } catch {
      continue;
    }
    const cert = clientCertDemand(candidate, response);
    let verdict = response.status === 0 && !cert ? ({ ok: false, reason: 'unreachable' } as const) : judge(response);
    if (verdict.ok) return { ok: true, url: verdict.url || candidate };
    if (cert) {
      verdict = { ok: false, reason: 'clientCert', url: candidate, cert };
    } else if (verdict.reason === 'notTrek') {
      const gate = detectAuthGate(candidate + FEATURES_PATH, response);
      if (gate)
        verdict = { ok: false, reason: 'authGate', url: candidate, gate: await withLoginHost(candidate, gate, get) };
    }
    if (!best.ok && FAILURE_RANK[verdict.reason] > FAILURE_RANK[best.reason]) best = verdict;
  }
  return best;
}

/** The address screen's "Try the demo": the same probe, against the public demo server. */
export function probeDemo(get: ProbeGet): Promise<ProbeResult> {
  return probeServer(DEMO_SERVER_URL, get);
}
