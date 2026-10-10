import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/**
 * Request correlation: one id per unit of work, carried through everything
 * that unit does by AsyncLocalStorage, so the access log line, the stack of a
 * 500 and every log line in between can be found together.
 *
 * Five entry points start work: an HTTP request (globalMiddleware.ts), an MCP
 * tool call, a WebSocket message, a plugin RPC dispatch and a cron tick (each
 * through `traceEntry()` in nest/audit/entry-trace.logger.ts). An MCP call or a
 * WebSocket message gets its own id even though an HTTP request or a socket is
 * already open around it, and remembers that outer id as its parent.
 *
 * Process-local by nature: the store is per async chain, never shared.
 */

export type EntryKind = 'http' | 'mcp' | 'ws' | 'rpc' | 'cron';

export interface Correlation {
  readonly id: string;
  readonly kind: EntryKind;
  /** The id of the unit of work this one started inside, if any. */
  readonly parentId?: string;
}

/** The header an incoming request may carry its id in, and the one every response carries. */
export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * What an incoming X-Request-Id may look like to be adopted: the characters
 * proxies and tracing systems use for their ids, and short. Anything else is
 * replaced by a fresh id rather than echoed into the logs and the response.
 */
const INCOMING_ID = /^[A-Za-z0-9._:=-]{1,128}$/;

/**
 * Keys on `res.locals` shared by the exception filter and the access log: the
 * access log marks a response it will report, and the filter leaves the
 * exception there so the request line and the stack land in one entry.
 */
export const ACCESS_LOG_ATTACHED = 'trekAccessLog';
export const UNHANDLED_ERROR = 'trekUnhandledError';

const storage = new AsyncLocalStorage<Correlation>();

export function newCorrelationId(): string {
  return randomUUID();
}

/** The incoming header value when it is a single, well-formed id; null otherwise. */
export function acceptRequestId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return INCOMING_ID.test(value) ? value : null;
}

/** The unit of work the caller is part of, if any. */
export function currentCorrelation(): Correlation | undefined {
  return storage.getStore();
}

/** Run `fn` (and everything it awaits) as part of `correlation`. */
export function runWithCorrelation<T>(correlation: Correlation, fn: () => T): T {
  return storage.run(correlation, fn);
}

/** A fresh correlation for an entry point, nested under whatever is running now. */
export function childCorrelation(kind: EntryKind): Correlation {
  const parent = storage.getStore();
  return parent ? { id: newCorrelationId(), kind, parentId: parent.id } : { id: newCorrelationId(), kind };
}

/** How a correlation appears in a log line: `[http 1b9d...]`. */
export function correlationTag(correlation: Correlation | undefined): string {
  return correlation ? `[${correlation.kind} ${correlation.id}] ` : '';
}
