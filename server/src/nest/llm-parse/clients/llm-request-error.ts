/**
 * A provider answered a parsing request with an error status. The message
 * stays the one the import has always logged and shown; `status` and `code`
 * let the caller tell a spent allowance from a broken request without
 * reading that message.
 */
export class LlmRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The error code the body named (`QUOTA_SPENT` from the TREK Cloud gate), when it named one. */
    readonly code: string | undefined,
  ) {
    super(message);
    this.name = 'LlmRequestError';
  }
}

/** How much of an error body is read for its code: the gate's and the providers' are a few hundred bytes. */
const MAX_CODE_BODY = 4096;

/**
 * The `code` of a JSON error body, at the top (the TREK Cloud gate's
 * `{ error, code }`) or inside `error` (OpenAI's and Anthropic's shape).
 * Undefined for a body that is not JSON or names none.
 */
export function errorBodyCode(detail: string): string | undefined {
  if (!detail || detail.length > MAX_CODE_BODY) return undefined;
  let body: unknown;
  try {
    body = JSON.parse(detail);
  } catch {
    return undefined;
  }
  if (!body || typeof body !== 'object') return undefined;
  const record = body as { code?: unknown; error?: unknown };
  if (typeof record.code === 'string') return record.code;
  const inner = record.error;
  if (inner && typeof inner === 'object' && typeof (inner as { code?: unknown }).code === 'string') {
    return (inner as { code: string }).code;
  }
  return undefined;
}

/** The error a client throws for a refused request, its message as the import has always worded it. */
export function llmRequestError(label: string, status: number, detail: string): LlmRequestError {
  return new LlmRequestError(`${label} (${status}): ${detail.slice(0, 300)}`, status, errorBodyCode(detail));
}
