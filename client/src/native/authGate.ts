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

/**
 * The gate in front of `requested`, judged from what came back instead of
 * TREK's answer, or null when nothing points to one: then the address simply
 * is not a TREK server.
 */
export function detectAuthGate(requested: string, response: GateResponse): AuthGate | null {
  const finalUrl = response.url || requested;
  const requestedHost = hostOf(requested);
  const finalHost = hostOf(finalUrl);
  const movedHost = finalHost !== null && finalHost !== requestedHost;
  const loginHost = movedHost ? finalHost : null;
  const html = typeof response.data === 'string' ? response.data : '';
  let path = '';
  try {
    path = new URL(finalUrl).pathname;
  } catch {
    /* an unparsable URL leaves only the page itself to go by */
  }

  if (finalHost?.endsWith('.cloudflareaccess.com') || header(response.headers, 'cf-access-domain')) {
    return { kind: 'cloudflare', loginHost };
  }
  if (path.includes('/outpost.goauthentik.io/') || /authentik/i.test(html)) return { kind: 'authentik', loginHost };
  if (/authelia/i.test(html)) return { kind: 'authelia', loginHost };
  if (path.startsWith('/oauth2/') || /oauth2[\s-]?proxy/i.test(html)) return { kind: 'oauth2proxy', loginHost };
  if (path.startsWith('/auth/resource/') || /pangolin/i.test(html)) return { kind: 'pangolin', loginHost };
  if (response.status === 401 && /^basic\b/i.test(header(response.headers, 'www-authenticate'))) {
    return { kind: 'basic', loginHost: null };
  }
  // Anything else counts only when it reads as a sign-in: a server that is
  // simply something other than TREK answers with a page of its own too.
  if (html && looksLikeSignIn(html) && (movedHost || [200, 401, 403].includes(response.status))) {
    return { kind: 'unknown', loginHost };
  }
  return null;
}

/** Whether the app can show this gate's sign-in itself: a password prompt it cannot. */
export function canSignInInApp(gate: AuthGate): boolean {
  return gate.kind !== 'basic';
}
