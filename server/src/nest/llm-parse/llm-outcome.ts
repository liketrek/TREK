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

/** A reading that found bookings or did not. */
export function foundOutcome(items: readonly unknown[]): LlmParseOutcome {
  return items.length > 0 ? 'ok' : 'empty';
}
