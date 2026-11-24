/**
 * How a row id that arrives as text becomes a number before it reaches SQL.
 * `src/nest/common/row-id.ts` re-exports both helpers for the Nest layers.
 */

/**
 * The one rule by which a row id from outside (a path, a query, a body, an MCP
 * resource URI, a plugin RPC param, a websocket message) becomes the number a
 * repository binds.
 *
 * Only the canonical spelling is an id: a safe integer, or a string of decimal
 * digits naming one ('007' is 7, as SQLite's own conversion reads it). Every
 * other spelling names no row and returns null: 'abc', '0x5', '5e0', '5.0',
 * '+5', ' 5', '5 ', '5_0', '-5', '' and a number past 2^53. Bound to SQL as
 * sent, those strings answer three ways. SQLite compares a TEXT operand with an
 * INTEGER column by numeric affinity, so ' 5', '5.0', '+5' and '5e0' match row
 * 5 there while '0x5' matches nothing. Postgres 14 and 15 refuse the cast with
 * an error, a 500. Postgres 16 and later read hex and underscores as a number.
 * `Number()` and `parseInt()` read most of them as 5 on every engine, and hand
 * NaN or a number past the bigint range to Postgres, which refuses it.
 *
 * Our own clients only ever send `String(id)` of an integer column, so the
 * refusal costs nothing but a hand-made request, which gets the answer an id
 * that names no row gets. Keep the regex as it is: narrowing it to refuse
 * '007' or widening it to any spelling an engine accepts brings the
 * difference back.
 *
 * A caller that ran `Number(id)` before handing the value in has already lost
 * the spelling: `toRowId(Number('0x10'))` is 16. Pass the raw value.
 */
export function toRowId(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Runs `read` with the id `toRowId` parses from `value`, or answers undefined
 * without reading when it refuses the value. For the lookups that take an id
 * from a request: a spelling no client sends ('0x1', '1e0', '1.0', '+1', '1_0',
 * a number past 2^53) is no row, the same answer on every engine, where bound
 * raw SQLite matched nothing, Postgres 14 and 15 refused the cast with an
 * error and Postgres 16 and later read hex and underscores as a number.
 */
export async function withRowId<T>(value: unknown, read: (id: number) => Promise<T>): Promise<T | undefined> {
  const id = toRowId(value);
  return id === null ? undefined : read(id);
}
