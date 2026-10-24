import { logWarn } from '../nest/audit/audit-log.logger';

import type { ZodType } from 'zod';

/**
 * One JSON-in-TEXT column: where it lives, the shape it holds, and what a reader
 * gets when the stored text is missing or broken.
 *
 * The storage model keeps JSON in TEXT (see server/CLAUDE.md, "SQL dialect"), and
 * the service boundary turns it into a value. Declaring the column once keeps
 * every reader of it on the same answer: one schema, one fallback, one log line
 * when a row does not hold what it should, instead of a `JSON.parse` per call
 * site that throws in one place and shrugs in the next.
 */
export interface JsonColumn<T> {
  /** `table.column`, for the log line. */
  readonly column: string;
  readonly schema: ZodType<T>;
  /** What a reader gets for an empty column or a value that does not decode. A function, so a mutable default is fresh per call. */
  readonly fallback: () => T;
  /**
   * The stored text may be a JSON string of the JSON (an old double-encoding
   * bug). When set, one level of that is unwrapped before the schema check.
   */
  readonly unwrapDoubleEncoded?: boolean;
}

export type JsonDecodeFailure = 'empty' | 'invalid-json' | 'schema';

export type JsonDecodeResult<T> =
  { ok: true; value: T; reason?: never } | { ok: false; value?: never; reason: JsonDecodeFailure };

/**
 * Decode a stored value without a fallback, for the readers that react to a
 * broken row themselves (flag it for review, skip it). A value a driver already
 * handed back parsed (an object rather than text) is checked as it is.
 */
export function decodeJsonResult<T>(col: JsonColumn<T>, raw: unknown): JsonDecodeResult<T> {
  if (raw === null || raw === undefined || raw === '') return { ok: false, reason: 'empty' };
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
      if (col.unwrapDoubleEncoded && typeof value === 'string') value = JSON.parse(value);
    } catch {
      return { ok: false, reason: 'invalid-json' };
    }
  }
  const parsed = col.schema.safeParse(value);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, reason: 'schema' };
}

/**
 * Decode a stored value, falling back to the column's default. An empty column
 * is ordinary and falls back quietly; text that is not JSON, or JSON of the
 * wrong shape, falls back too and is logged with `context` (a row id, say), so
 * broken data shows up in trek.log instead of disappearing.
 */
export function decodeJson<T>(col: JsonColumn<T>, raw: unknown, context?: string): T {
  const result = decodeJsonResult(col, raw);
  if (result.ok) return result.value;
  if (result.reason !== 'empty') logJsonFailure(col, result.reason, context);
  return col.fallback();
}

/** Log a row whose JSON did not decode; for callers of {@link decodeJsonResult} that handle the failure themselves. */
export function logJsonFailure(col: JsonColumn<unknown>, reason: JsonDecodeFailure, context?: string): void {
  logWarn(
    `[json] ${col.column}${context ? ` (${context})` : ''}: stored value ${reason === 'schema' ? 'has the wrong shape' : 'is not valid JSON'}, using the fallback`,
  );
}

/** The text to store for a value, checked against the column's shape first (a mismatch throws: it is a bug in the writer). */
export function encodeJson<T>(col: JsonColumn<T>, value: T): string {
  return JSON.stringify(col.schema.parse(value));
}
