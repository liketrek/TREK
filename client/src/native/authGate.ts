/**
 * Self-hosters often put a sign-in page of their own in front of TREK: an
 * identity-aware proxy such as Cloudflare Access, Pangolin, Authentik,
 * Authelia or oauth2-proxy, or a reverse proxy's password prompt. The app's
 * server check then gets that page instead of TREK's answer and used to call
 * the server "not TREK". This reads which gate it met, so the address screen
 * can say so, and offers its sign-in inside the app where that can work.
 */

export type AuthGateKind = 'cloudflare' | 'pangolin' | 'authentik' | 'authelia' | 'oauth2proxy' | 'basic' | 'unknown';

export interface AuthGate {
  kind: AuthGateKind;
  /**
   * The host the gate's sign-in page lives on, when the check was sent there.
   * Only these hosts are let into the app's web view while signing in; every
   * other foreign page still opens in the system browser.
   */
  loginHost: string | null;
}

/** The product names the address screen shows; not translated. */
export const AUTH_GATE_NAMES: Record<Exclude<AuthGateKind, 'unknown' | 'basic'>, string> = {
  cloudflare: 'Cloudflare Access',
  pangolin: 'Pangolin',
  authentik: 'authentik',
  authelia: 'Authelia',
  oauth2proxy: 'OAuth2 Proxy',
};

export interface GateResponse {
  status: number;
  data: unknown;
  /** The URL after redirects. */
  url: string;
  headers?: Record<string, string>;
}

function header(headers: Record<string, string> | undefined, name: string): string {
  if (!headers) return '';
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) if (key.toLowerCase() === wanted) return String(value);
  return '';
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/** A page that asks for a sign-in: a password field, or the words for it. */
function looksLikeSignIn(html: string): boolean {
  return /type=["']?password/i.test(html) || /\b(sign|log)[\s-]?in\b/i.test(html);
}

/** What the check got back, read once for the rules below. */
interface Seen {
  host: string | null;
  path: string;
  html: string;
  status: number;
  headers: Record<string, string> | undefined;
}

/** The named gates, each by what gives it away; the first that matches wins. */
const NAMED_GATES: Array<[Exclude<AuthGateKind, 'basic' | 'unknown'>, (seen: Seen) => boolean]> = [
  [
    'cloudflare',
    (seen) => !!seen.host?.endsWith('.cloudflareaccess.com') || !!header(seen.headers, 'cf-access-domain'),
  ],
  ['authentik', (seen) => seen.path.includes('/outpost.goauthentik.io/') || /authentik/i.test(seen.html)],
  ['authelia', (seen) => /authelia/i.test(seen.html)],
  ['oauth2proxy', (seen) => seen.path.startsWith('/oauth2/') || /oauth2[\s-]?proxy/i.test(seen.html)],
  ['pangolin', (seen) => seen.path.startsWith('/auth/resource/') || /pangolin/i.test(seen.html)],
];

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

/** A gate that gives no name away: a password prompt, or any other page that asks for a sign-in. */
function unnamedGate(seen: Seen, loginHost: string | null): AuthGate | null {
  if (seen.status === 401 && /^basic\b/i.test(header(seen.headers, 'www-authenticate'))) {
    return { kind: 'basic', loginHost: null };
  }
  // Only a page that reads as a sign-in counts: a server that is simply
  // something other than TREK answers with a page of its own too.
  if (!seen.html || !looksLikeSignIn(seen.html)) return null;
  return loginHost || [200, 401, 403].includes(seen.status) ? { kind: 'unknown', loginHost } : null;
}

/**
 * The gate in front of `requested`, judged from what came back instead of
 * TREK's answer, or null when nothing points to one: then the address simply
 * is not a TREK server.
 */
export function detectAuthGate(requested: string, response: GateResponse): AuthGate | null {
  const finalUrl = response.url || requested;
  const host = hostOf(finalUrl);
  const loginHost = host !== null && host !== hostOf(requested) ? host : null;
  const seen: Seen = {
    host,
    path: pathOf(finalUrl),
    html: typeof response.data === 'string' ? response.data : '',
    status: response.status,
    headers: response.headers,
  };
  const named = NAMED_GATES.find(([, matches]) => matches(seen));
  return named ? { kind: named[0], loginHost } : unnamedGate(seen, loginHost);
}

/** Whether the app can show this gate's sign-in itself: a password prompt it cannot. */
export function canSignInInApp(gate: AuthGate): boolean {
  return gate.kind !== 'basic';
}
