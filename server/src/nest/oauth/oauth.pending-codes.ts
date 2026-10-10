import { logError } from '../audit/audit-log.logger';
import { ProcessStoreSlot } from '../common/process-store-slot';

/**
 * The short-lived authorization-code store.
 *
 * An injectable port, PendingCodeStore, with the in-memory implementation
 * below. One instance is process-wide, with an import-time sweep on purpose
 * (legacy parity, the atlas-geo interval precedent): OauthModule provides
 * that instance and installs whatever the container resolved in
 * pendingCodesSlot, which the sweep and a hand-built OauthService read. Sharing is not
 * a stylistic choice: the consent controller writes a code through the container OauthService and the SDK exchange path
 * (oauth-sdk.provider.ts) reads it back — through the same injected singleton
 * in production, but the integration harness and any second OauthService
 * instance must keep seeing the same map. Two maps would make the
 * authorization-code flow fail *silently* — the SDK only ever answers
 * "Authorization grant is invalid."
 *
 * No DB persistence: codes live two minutes and a restart invalidating them
 * is the correct behaviour.
 */

export interface PendingCode {
  clientId: string;
  userId: number;
  redirectUri: string;
  scopes: string[];
  resource: string | null;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  expiresAt: number;
}

export const MAX_PENDING_CODES = 500;
export const AUTH_CODE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Where pending authorization codes are kept between the consent and the
 * token exchange. In memory today, which ties an authorization to the process
 * that issued it; a store shared between processes replaces the process
 * instance in OauthModule without touching OauthService. Every method returns
 * a promise, because such a store lives in the database or on the network.
 */
export abstract class PendingCodeStore {
  /** Keep `entry` under `code`; false when the store is at capacity (the caller answers with a null code). */
  abstract put(code: string, entry: PendingCode): Promise<boolean>;
  /** Single use: the entry is removed even when it turns out to be expired, and an expired one is null. */
  abstract take(code: string): Promise<PendingCode | null>;
  /** Drop everything past its TTL. */
  abstract sweep(now?: number): Promise<void>;
}

/** The current behaviour: one capped map in this process's memory. */
export class InMemoryPendingCodeStore extends PendingCodeStore {
  private readonly codes = new Map<string, PendingCode>();

  put(code: string, entry: PendingCode): Promise<boolean> {
    if (this.codes.size >= MAX_PENDING_CODES) return Promise.resolve(false);
    this.codes.set(code, entry);
    return Promise.resolve(true);
  }

  take(code: string): Promise<PendingCode | null> {
    const entry = this.codes.get(code);
    if (!entry) return Promise.resolve(null);
    this.codes.delete(code);
    if (Date.now() > entry.expiresAt) return Promise.resolve(null);
    return Promise.resolve(entry);
  }

  sweep(now = Date.now()): Promise<void> {
    for (const [key, entry] of this.codes) {
      if (now > entry.expiresAt) this.codes.delete(key);
    }
    return Promise.resolve();
  }
}

/** The in-memory store this process starts with, and what OauthModule provides unless overridden. */
export const processPendingCodes: PendingCodeStore = new InMemoryPendingCodeStore();

/**
 * The store the readers outside the container use: the import-time sweep and
 * a hand-built OauthService. OauthModule installs the one the container
 * resolved, so swapping the provider moves them too.
 */
export const pendingCodesSlot = new ProcessStoreSlot<PendingCodeStore>(processPendingCodes);

/** Drop everything past its TTL. Named so the interval body is reachable from a test. */
export function sweepPendingCodes(now = Date.now()): Promise<void> {
  return pendingCodesSlot.get().sweep(now);
}

/** The interval body: a sweep that fails is logged, never thrown into the timer. */
export function runPendingCodeSweep(now = Date.now()): Promise<void> {
  return sweepPendingCodes(now).catch((err: unknown) => {
    logError(`OAuth pending-code sweep failed: ${err instanceof Error ? err.message : String(err)}`);
  });
}

setInterval(() => void runPendingCodeSweep(), 60_000).unref();
