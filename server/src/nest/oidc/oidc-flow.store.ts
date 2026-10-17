/** A login that went to the provider and has not come back yet. */
export interface OidcPendingState {
  createdAt: number;
  redirectUri: string;
  inviteToken?: string;
  codeVerifier: string;
  remember?: boolean;
}

/**
 * A finished login waiting to be exchanged for the session.
 *
 * `bindingHash` is the sha256 of a secret that only the browser which finished
 * the callback holds, in a cookie. The code itself travels in a URL, through
 * history, referrers and any log in between, so on its own it is not a
 * credential, and /exchange must not accept it as one.
 */
export interface OidcAuthCode {
  token: string;
  created: number;
  remember?: boolean;
  bindingHash: string;
}

/**
 * The short-lived OIDC flow state, as an injectable port: the `state` a login
 * leaves with and the one-time code it comes back with. Both are single use.
 *
 * In memory today, which ties a login to the process that started it; with
 * several processes behind one address the callback can land on another one.
 * A store shared between processes replaces InMemoryOidcFlowStore in
 * OidcModule without touching OidcService. Every method returns a promise,
 * because such a store lives in the database or on the network.
 */
export abstract class OidcFlowStore {
  abstract putState(state: string, entry: OidcPendingState): Promise<void>;
  /** The entry, removed in the same step; null when unknown. */
  abstract takeState(state: string): Promise<OidcPendingState | null>;
  abstract putCode(code: string, entry: OidcAuthCode): Promise<void>;
  /** The entry, removed in the same step, expired or not (the caller decides); null when unknown. */
  abstract takeCode(code: string): Promise<OidcAuthCode | null>;
  /** Drop states created more than `ttlMs` before `now`. */
  abstract sweepStates(now: number, ttlMs: number): Promise<void>;
  /** Drop codes created more than `ttlMs` before `now`. */
  abstract sweepCodes(now: number, ttlMs: number): Promise<void>;
}

/** The current behaviour: two maps in this process's memory. */
export class InMemoryOidcFlowStore extends OidcFlowStore {
  private readonly states = new Map<string, OidcPendingState>();
  private readonly codes = new Map<string, OidcAuthCode>();

  putState(state: string, entry: OidcPendingState): Promise<void> {
    this.states.set(state, entry);
    return Promise.resolve();
  }

  takeState(state: string): Promise<OidcPendingState | null> {
    const entry = this.states.get(state);
    if (!entry) return Promise.resolve(null);
    this.states.delete(state);
    return Promise.resolve(entry);
  }

  putCode(code: string, entry: OidcAuthCode): Promise<void> {
    this.codes.set(code, entry);
    return Promise.resolve();
  }

  takeCode(code: string): Promise<OidcAuthCode | null> {
    const entry = this.codes.get(code);
    if (!entry) return Promise.resolve(null);
    this.codes.delete(code);
    return Promise.resolve(entry);
  }

  sweepStates(now: number, ttlMs: number): Promise<void> {
    for (const [state, entry] of this.states) {
      if (now - entry.createdAt > ttlMs) this.states.delete(state);
    }
    return Promise.resolve();
  }

  sweepCodes(now: number, ttlMs: number): Promise<void> {
    for (const [code, entry] of this.codes) {
      if (now - entry.created > ttlMs) this.codes.delete(code);
    }
    return Promise.resolve();
  }
}
