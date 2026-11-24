import { LlmContextOverflowError } from './clients/context-overflow';
import { LlmRequestError } from './clients/llm-request-error';
import { ImageTooLargeError } from './image-input';
import type { LlmParseOutcome } from '@trek/shared';

/** The codes the TREK Cloud gate answers a spent allowance with, on a 429. */
const QUOTA_CODES = new Set(['QUOTA_SPENT', 'HARD_CAP']);

/**
 * How a failed reading ended, from the error alone: a spent Cloud allowance,
 * a document too large for the model or the gate, or a provider that failed.
 */
export function failureOutcome(err: unknown): LlmParseOutcome {
  if (err instanceof LlmRequestError) {
    if (err.status === 429 && err.code !== undefined && QUOTA_CODES.has(err.code)) return 'quota_exhausted';
    if (err.status === 413) return 'too_large';
  }
  if (err instanceof LlmContextOverflowError || err instanceof ImageTooLargeError) return 'too_large';
  return 'provider_error';
}

/** The statuses a provider answers with when it is busy or briefly down, not when the request is wrong. */
const TRANSIENT_STATUSES = new Set([408, 500, 502, 503, 504]);

/**
 * Whether a failed request may well succeed when sent again shortly: a busy or
 * briefly broken provider, a rate limit that is no spent Cloud allowance, a
 * request that timed out or a connection that dropped.
 */
export function isTransientLlmFailure(err: unknown): boolean {
  if (err instanceof LlmRequestError) {
    if (err.status === 429) return err.code === undefined || !QUOTA_CODES.has(err.code);
    return TRANSIENT_STATUSES.has(err.status);
  }
  if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) return true;
  return err instanceof TypeError && /fetch failed/i.test(err.message);
}

/** A reading that found bookings or did not. */
export function foundOutcome(items: readonly unknown[]): LlmParseOutcome {
  return items.length > 0 ? 'ok' : 'empty';
}
