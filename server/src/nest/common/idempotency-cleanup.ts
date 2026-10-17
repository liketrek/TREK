import { readEnv } from '../../app-config';
import type { IdempotencyKeysRepository } from '../../db/repositories/IdempotencyKeys.repository';

/**
 * Idempotency-key TTL purge (moved from src/scheduler.ts; the interceptor that
 * writes the keys lives next door in idempotency.interceptor.ts).
 *
 * The TTL must exceed any realistic offline window: the TREK client replays
 * queued mutations with their X-Idempotency-Key when it reconnects, so a key
 * GC'd before the device comes back online would let the replay create a
 * duplicate. 24h was far too short for a multi-day offline trip; default 30d,
 * overridable via IDEMPOTENCY_TTL_SECONDS (default lives in app-config).
 *
 * Plan 4 Task 1: the raw `DELETE FROM idempotency_keys WHERE created_at < ?`
 * moved onto `IdempotencyKeysRepository.deleteExpired` — the repository is a
 * required parameter now, matching this function's own pre-existing "no lazy
 * default" convention (it used to be a `DatabaseService`).
 */

/** Delete idempotency keys older than the configured TTL. Returns rows removed. */
export async function purgeExpiredIdempotencyKeys(
  now: number = Date.now(),
  ttlSeconds: number = readEnv().session.idempotencyTtlSeconds,
  repo: IdempotencyKeysRepository,
): Promise<number> {
  const cutoff = Math.floor(now / 1000) - ttlSeconds;
  return await repo.deleteExpired(cutoff);
}
