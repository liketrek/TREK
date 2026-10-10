import { childCorrelation, runWithCorrelation, type Correlation, type EntryKind } from '../common/request-correlation';
import { logDebug, logError, logWarn } from './audit-log.logger';

/** Errors a trace has already written to the log, so an outer handler can skip a second line. */
const reported = new WeakSet<object>();

export interface TraceOptions<T = unknown> {
  /** How a failure is logged: `warn` (default) for calls a client made, `error` for the server's own work. */
  failureLevel?: 'warn' | 'error';
  /** The failure line, when the entry point already has a wording people search for. */
  failureMessage?: (error: unknown) => string;
  /**
   * For entry points that answer failures with a value instead of a throw (a
   * plugin RPC returns `{ ok: false, error }`): the reason when `result` is a
   * failure, null when it is not. A failure found this way is logged at warn.
   */
  refusal?: (result: Awaited<T>) => string | null;
  /**
   * For entry points that may decline to do their work on purpose (a cron tick
   * whose lease another process holds): the reason when `result` says the call
   * did nothing, null when it ran. A skip is logged at debug, as `skipped`
   * rather than `ok`, so the line says which process actually did the work.
   */
  skipped?: (result: Awaited<T>) => string | null;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parentNote(correlation: Correlation): string {
  return correlation.parentId ? ` parent=${correlation.parentId}` : '';
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Run one call of a non-HTTP entry point (an MCP tool, a WebSocket message, a
 * plugin RPC, a cron tick) under its own correlation id, and log one line for
 * it: at debug when it succeeds or skips its work on purpose, mirroring the
 * HTTP access log, and at warn (or error) with the reason when it fails. Every line the call writes in
 * between carries the same id.
 *
 * The call's own result comes back untouched, a plain value as a plain value
 * and a promise as that same promise, and is invoked synchronously, so
 * wrapping an entry point changes nothing about its timing. For a promise the
 * line is written when it settles.
 */
export function traceEntry<T>(
  kind: Exclude<EntryKind, 'http'>,
  label: string,
  fn: () => T,
  options: TraceOptions<T> = {},
): T {
  const correlation = childCorrelation(kind);
  const startedAt = Date.now();
  const elapsed = () => `${Date.now() - startedAt}ms${parentNote(correlation)}`;

  const succeeded = (value: Awaited<T>): void => {
    const refused = options.refusal?.(value) ?? null;
    if (refused !== null) {
      logWarn(`${kind} ${label} refused ${elapsed()}: ${refused}`);
      return;
    }
    const skipped = options.skipped?.(value) ?? null;
    if (skipped !== null) logDebug(`${kind} ${label} skipped ${elapsed()}: ${skipped}`);
    else logDebug(`${kind} ${label} ok ${elapsed()}`);
  };
  const failed = (error: unknown): void => {
    const line = options.failureMessage?.(error) ?? `${kind} ${label} failed ${elapsed()}: ${messageOf(error)}`;
    if (options.failureLevel === 'error') logError(line);
    else logWarn(line);
    if (error !== null && typeof error === 'object') reported.add(error);
  };

  return runWithCorrelation(correlation, () => {
    let result: T;
    try {
      result = fn();
    } catch (error) {
      failed(error);
      throw error;
    }
    if (isThenable(result)) {
      // Observes the outcome without replacing the promise the caller gets.
      result.then(
        (value) => succeeded(value as Awaited<T>),
        (error: unknown) => failed(error),
      );
    } else {
      succeeded(result as Awaited<T>);
    }
    return result;
  });
}

/** True when a trace already logged this error (see traceEntry). */
export function wasTraced(error: unknown): boolean {
  return error !== null && typeof error === 'object' && reported.has(error);
}
