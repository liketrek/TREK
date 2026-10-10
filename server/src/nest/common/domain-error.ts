import { HttpException } from '@nestjs/common';

/**
 * A refusal a service raises for its caller to pass on as it stands: the HTTP
 * status, the exact `error` text the client sees, and any further fields the
 * body carries next to it.
 *
 * It replaces the `return { error, status }` result a controller had to turn
 * into `throw new HttpException({ error: r.error }, r.status)` and an MCP tool
 * into `errorResult(r.error)`. Raised once in the service, it reaches both
 * channels in their existing shapes:
 *
 * - REST: it IS an HttpException whose response is `{ error, ...details }`, so
 *   TrekExceptionFilter writes that body verbatim at `status` (5xx included,
 *   exactly as the hand-thrown HttpException did), and every
 *   `if (err instanceof HttpException) throw err` along the way lets it pass.
 * - MCP: the registry's error mapper (`trekMcpErrorMapper`) answers the tool
 *   call with `errorResult(publicMessage)`.
 *
 * `code` names the refusal for logs and tests; it never reaches the body, so
 * adding one changes no response.
 */
export class DomainError extends HttpException {
  readonly code: string;
  readonly publicMessage: string;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    status: number,
    publicMessage: string,
    options: { code?: string; details?: Record<string, unknown> } = {},
  ) {
    super({ ...options.details, error: publicMessage }, status);
    this.name = 'DomainError';
    this.message = publicMessage;
    this.publicMessage = publicMessage;
    this.code = options.code ?? defaultCode(status);
    if (options.details) this.details = { ...options.details };
  }

  /** The JSON body REST answers with: `{ error, ...details }`. */
  toBody(): Record<string, unknown> {
    return { ...this.details, error: this.publicMessage };
  }
}

const CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  410: 'gone',
  413: 'payload_too_large',
  422: 'unprocessable',
  429: 'too_many_requests',
  500: 'internal',
  502: 'bad_gateway',
  503: 'unavailable',
};

function defaultCode(status: number): string {
  return CODES[status] ?? `http_${status}`;
}

/** Shorthands for the statuses services raise most. */
export const badRequest = (message: string, details?: Record<string, unknown>) =>
  new DomainError(400, message, { details });
export const unauthorized = (message: string, details?: Record<string, unknown>) =>
  new DomainError(401, message, { details });
export const forbidden = (message: string, details?: Record<string, unknown>) =>
  new DomainError(403, message, { details });
export const notFound = (message: string, details?: Record<string, unknown>) =>
  new DomainError(404, message, { details });
export const conflict = (message: string, details?: Record<string, unknown>) =>
  new DomainError(409, message, { details });

/**
 * Runs `fn` and returns the DomainError it raised instead of throwing it; any
 * other error propagates. For the few callers that must act on a refusal before
 * passing it on (an audit row, a constant-time pad) and for service tests.
 * Test the result with `instanceof DomainError`.
 */
export async function catchDomainError<T>(fn: () => Promise<T> | T): Promise<T | DomainError> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof DomainError) return err;
    throw err;
  }
}
