/** A sign-in the system browser handed off and the app has not redeemed yet. */
export interface NativeHandoff {
  userId: number;
  /** Hex sha256 of the verifier the app kept to itself. */
  challenge: string;
  expiresAt: number;
}

export const NATIVE_HANDOFF_CODE_TTL_MS = 60_000;
export const MAX_PENDING_HANDOFFS = 500;

/**
 * Where the one-time hand-off codes wait between the browser minting one and
 * the app redeeming it, as an injectable port.
 *
 * In memory today, which ties a code to the process that issued it; a code
 * lives a minute and a restart only means signing in again, so nothing about
 * it is worth a table. A store shared between processes replaces
 * InMemoryNativeHandoffStore in NativeAuthModule without touching the
 * service. Every method returns a promise, because such a store lives in the
 * database or on the network.
 */
export abstract class NativeHandoffStore {
  /** Keep `entry` under `code`; false when the store is at capacity. */
  abstract put(code: string, entry: NativeHandoff): Promise<boolean>;
  /** Single use: the entry is removed even when it turns out to be expired, and an expired one is null. */
  abstract take(code: string): Promise<NativeHandoff | null>;
}

/**
 * The current behaviour: one capped map in this process's memory. Expired
 * entries are dropped on the next write instead of by a timer, so the store
 * runs no interval of its own and dead codes never fill its cap.
 */
export class InMemoryNativeHandoffStore extends NativeHandoffStore {
  private readonly codes = new Map<string, NativeHandoff>();

  put(code: string, entry: NativeHandoff): Promise<boolean> {
    const now = Date.now();
    for (const [key, pending] of this.codes) {
      if (now > pending.expiresAt) this.codes.delete(key);
    }
    if (this.codes.size >= MAX_PENDING_HANDOFFS) return Promise.resolve(false);
    this.codes.set(code, entry);
    return Promise.resolve(true);
  }

  take(code: string): Promise<NativeHandoff | null> {
    const entry = this.codes.get(code);
    if (!entry) return Promise.resolve(null);
    this.codes.delete(code);
    return Promise.resolve(Date.now() > entry.expiresAt ? null : entry);
  }
}
