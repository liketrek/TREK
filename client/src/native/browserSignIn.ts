import { sha256 } from '@noble/hashes/sha2'
import { bytesToHex } from '@noble/hashes/utils'
import { nativeAuthApi } from '../api/nativeAuth'
import { APP_URL_SCHEME, TrekShell } from './trekShell'

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

export const HANDOFF_PATH = '/native-handoff'

export type BrowserSignInStart = 'oidc'

export function createHandoffSecret(): { verifier: string; challenge: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const verifier = bytesToHex(bytes)
  return { verifier, challenge: bytesToHex(sha256(new TextEncoder().encode(verifier))) }
}

export function handoffUrl(origin: string, challenge: string, start?: BrowserSignInStart, invite?: string): string {
  const url = new URL(HANDOFF_PATH, origin)
  url.searchParams.set('challenge', challenge)
  if (start) url.searchParams.set('start', start)
  if (invite) url.searchParams.set('invite', invite)
  return url.href
}

export class BrowserSignInCancelled extends Error {
  constructor() {
    super('Sign-in cancelled')
    this.name = 'BrowserSignInCancelled'
  }
}

/** Resolves once the WebView holds a session cookie of its own. */
export async function signInThroughBrowser(start?: BrowserSignInStart, invite?: string): Promise<void> {
  const { verifier, challenge } = createHandoffSecret()
  let returned: string
  try {
    ;({ url: returned } = await TrekShell.authenticate({
      url: handoffUrl(window.location.origin, challenge, start, invite),
      callbackScheme: APP_URL_SCHEME,
    }))
  } catch (err) {
    if ((err as { code?: string })?.code === 'CANCELLED') throw new BrowserSignInCancelled()
    throw err
  }
  const code = new URL(returned).searchParams.get('code')
  if (!code) throw new Error('The browser returned without a sign-in code')
  await nativeAuthApi.exchange({ code, verifier })
}
