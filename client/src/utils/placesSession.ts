/**
 * Google bills place autocomplete per keystroke unless the requests carry a
 * session token. With one, the keystrokes and the details lookup that ends the
 * search are charged as a single session, which is what a user experiences as
 * "I looked up one place".
 *
 * A session starts with the first suggestion request and ends when the user
 * picks a result (or gives up). Reusing a token across two searches would merge
 * them into one billed session and return stale-scoped suggestions, so `end()`
 * has to run on both paths.
 *
 * The token has to be URL-safe ASCII and at most 36 characters; a UUID is
 * exactly 36 and is what Google's own clients use. `crypto.randomUUID` is
 * missing on http:// origins in some browsers, hence the fallback.
 */
export function newSessionToken(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** One search's worth of token, created lazily and cleared when it is spent. */
export class PlacesSession {
  private token: string | null = null;

  /** The token for the running search, starting one if none is open. */
  current(): string {
    if (!this.token) this.token = newSessionToken();
    return this.token;
  }

  /** The token without starting a session: a details lookup that no search led
   *  to must not open one, or it would be billed as an empty session. */
  peek(): string | undefined {
    return this.token ?? undefined;
  }

  /** Call when the search is over, whether it ended in a pick or not. */
  end(): void {
    this.token = null;
  }
}
