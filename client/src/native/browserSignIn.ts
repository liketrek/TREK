import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { startAuthentication } from '@simplewebauthn/browser';
import { authApi } from '../api/client';
import { nativeAuthApi } from '../api/nativeAuth';
import { APP_URL_SCHEME, TrekShell } from './trekShell';

/**
 * SSO and passkeys cannot run inside the app's WebView: identity providers
 * refuse embedded browsers, and WebAuthn wants the app to be associated with
 * the server's domain, which no build can be for every server. So the app
 * opens the server's /native-handoff page in the system browser, lets the user
 * sign in there, and carries the session back with a one-time code.
 *
 * The verifier never leaves this function. Only its sha256 travels into the
 * browser, and the code that comes back through the URL scheme is useless to
 * anyone who does not also hold the verifier. The hash is computed in JS
 * because crypto.subtle is missing on a plain-http server, which is how many
 * home networks reach theirs.
 */

export const HANDOFF_PATH = '/native-handoff';

/**
 * Where the browser is sent first: a page of the server's that takes an older
 * TREK's service worker off the browser and then opens HANDOFF_PATH with the
 * same query. Under /api, which every TREK service worker passes to the server.
 */
const HANDOFF_START_PATH = '/api/auth/native/start';

/** Where the browser starts: straight into SSO, or straight at the passkey prompt. */
export type BrowserSignInStart = 'oidc' | 'passkey';

const HANDOFF_RETURN_KEY = 'trek_native_handoff_return';
const HANDOFF_RETURN_TTL_MS = 15 * 60 * 1000;

/**
 * Remembers the handoff page an SSO round trip has to come back to. The login
 * keeps its return path in sessionStorage, which is per tab, and an identity
 * provider such as Google may finish its sign-in in another tab or in its own
 * app on Android. The return then arrives without it and the user lands in the
 * web app instead of being handed back, so the handoff page also leaves a short
 * lived copy here.
 */
export function rememberHandoffReturn(path: string): void {
  try {
    localStorage.setItem(HANDOFF_RETURN_KEY, JSON.stringify({ path, at: Date.now() }));
  } catch {
    /* storage blocked: the sessionStorage copy still covers a single-tab sign-in */
  }
}

/** The remembered handoff page, once: only a fresh path to the handoff page itself. */
export function takeHandoffReturn(): string | null {
  try {
    const raw = localStorage.getItem(HANDOFF_RETURN_KEY);
    localStorage.removeItem(HANDOFF_RETURN_KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof path !== 'string' || typeof at !== 'number') return null;
    if (Date.now() - at > HANDOFF_RETURN_TTL_MS) return null;
    return path.startsWith(`${HANDOFF_PATH}?challenge=`) ? path : null;
  } catch {
    return null;
  }
}

export function createHandoffSecret(): { verifier: string; challenge: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = bytesToHex(bytes);
  return { verifier, challenge: bytesToHex(sha256(new TextEncoder().encode(verifier))) };
}

export function handoffUrl(origin: string, challenge: string, start?: BrowserSignInStart, invite?: string): string {
  const url = new URL(HANDOFF_START_PATH, origin);
  url.searchParams.set('challenge', challenge);
  if (start) url.searchParams.set('start', start);
  if (invite) url.searchParams.set('invite', invite);
  return url.href;
}

/** The browser side: trade the signed-in session for a one-time code bound to `challenge`. */
export async function requestHandoffCode(challenge: string): Promise<string> {
  const { code } = await nativeAuthApi.handoff(challenge);
  return code;
}

/** The browser side of a passkey sign-in the app started: the prompt, then the session cookie. */
export async function signInWithPasskey(): Promise<void> {
  const options = await authApi.passkey.loginOptions();
  const assertion = await startAuthentication({ optionsJSON: options });
  await authApi.passkey.loginVerify(assertion);
}

export class BrowserSignInCancelled extends Error {
  constructor() {
    super('Sign-in cancelled');
    this.name = 'BrowserSignInCancelled';
  }
}

/** Resolves once the WebView holds a session cookie of its own. */
export async function signInThroughBrowser(start?: BrowserSignInStart, invite?: string): Promise<void> {
  const { verifier, challenge } = createHandoffSecret();
  let returned: string;
  try {
    ({ url: returned } = await TrekShell.authenticate({
      url: handoffUrl(window.location.origin, challenge, start, invite),
      callbackScheme: APP_URL_SCHEME,
    }));
  } catch (err) {
    if ((err as { code?: string })?.code === 'CANCELLED') throw new BrowserSignInCancelled();
    throw err;
  }
  const code = new URL(returned).searchParams.get('code');
  if (!code) throw new Error('The browser returned without a sign-in code');
  await nativeAuthApi.exchange({ code, verifier });
}
