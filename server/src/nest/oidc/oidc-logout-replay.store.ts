/**
 * The logout tokens already acted on, by issuer and `jti`, so a token seen
 * once is refused when it comes again (OpenID Connect Back-Channel Logout 1.0,
 * section 2.6, step 6).
 *
 * An entry only has to live as long as its token would still be accepted: the
 * validation refuses a token whose `iat` is older than the accepted window (or
 * whose `exp` has passed), so a replay after that is refused without the
 * entry. The caller passes that moment as `expiresAt`.
 *
 * An injectable port like OidcFlowStore: in memory today, replaceable in
 * OidcModule by a store shared between processes. Every method returns a
 * promise for that reason.
 */
export abstract class OidcLogoutReplayStore {
  /**
   * Record `key` until `expiresAt` (epoch milliseconds). True when it was not
   * held yet, false when it is a replay. Check and record are one step.
   */
  abstract claim(key: string, expiresAt: number, now: number): Promise<boolean>;

  /**
   * Forget `key` again, for a token whose logout failed after its claim, so
   * the provider's retry of the same token is acted on.
   */
  abstract release(key: string): Promise<void>;
}

/**
 * The most entries held at once. Only the provider can sign a token that
 * passes validation, so the store fills only as fast as real logouts arrive;
 * the cap keeps memory bounded whatever happens. At the cap the expired
 * entries go first, then the oldest one.
 */
export const OIDC_LOGOUT_REPLAY_MAX_ENTRIES = 10_000;

/** The current behaviour: one bounded map in this process's memory. */
export class InMemoryOidcLogoutReplayStore extends OidcLogoutReplayStore {
  private readonly seen = new Map<string, number>();

  constructor(private readonly maxEntries = OIDC_LOGOUT_REPLAY_MAX_ENTRIES) {
    super();
  }

  claim(key: string, expiresAt: number, now: number): Promise<boolean> {
    const held = this.seen.get(key);
    if (held !== undefined && held > now) return Promise.resolve(false);
    this.seen.delete(key);
    if (this.seen.size >= this.maxEntries) this.makeRoom(now);
    this.seen.set(key, expiresAt);
    return Promise.resolve(true);
  }

  release(key: string): Promise<void> {
    this.seen.delete(key);
    return Promise.resolve();
  }

  /** How many entries are held, for the tests of the cap. */
  get size(): number {
    return this.seen.size;
  }

  private makeRoom(now: number): void {
    for (const [key, expiresAt] of this.seen) {
      if (expiresAt <= now) this.seen.delete(key);
    }
    // Map iteration follows insertion order, so the first key is the oldest.
    while (this.seen.size >= this.maxEntries) {
      const oldest = this.seen.keys().next();
      if (oldest.done) break;
      this.seen.delete(oldest.value);
    }
  }
}
