import { nulFreeJson, stripNul } from '../../../nul-free';

import { createHash } from 'node:crypto';

/**
 * How a value read from a SQLite file becomes the value a Postgres column of
 * the move's target takes, and the one text form both sides are compared in.
 *
 * SQLite stores a value by what it is, not by the column's declared type, so
 * a column may hold text where the schema says integer. The move never
 * guesses: a value the Postgres column cannot hold exactly is refused with
 * the reason, and the move stops before it commits anything.
 *
 * Two sets of rules decide what "exactly" means ({@link ConvertRules}):
 * - TREK's own tables follow TREK's storage model, so a whole number stored
 *   as text reaches an integer column as that number. A NUL character in text
 *   or JSON, which TREK has stopped storing on either engine
 *   (`db/nul-free.ts`), is refused unless the operator asked for it to be
 *   dropped (`--drop-nul`); each value that loses one is reported.
 * - A plugin's own data is the plugin's, so a value must come back from the
 *   Postgres plugin store as the plugin's SQLite file hands it back today:
 *   an INTEGER or a REAL as a number, TEXT as a string, a BLOB as a Buffer,
 *   with the same bytes. Nothing changes its storage class, and a NUL, which
 *   the Postgres store cannot hold, is refused.
 *
 * The compared text of a row is built from the value read from SQLite
 * ({@link canonicalFromSource}), never from the value sent, so a conversion
 * that changed a value fails the verification instead of passing it.
 *
 * The SQLite side is read with better-sqlite3's safe integers, so an integer
 * arrives as a `bigint` and keeps all 64 bits.
 */

/** The Postgres column types the move writes, by what they hold. */
export type ColumnKind = 'integer' | 'float' | 'text' | 'json' | 'bytes';

/** What a SQLite cell can be: NULL, INTEGER, REAL, TEXT or BLOB. */
export type SqliteValue = null | bigint | number | string | Uint8Array;

/** A value Postgres takes as a parameter: a decimal string for an integer, a Buffer for bytes. */
export type PostgresValue = null | string | number | Buffer;

/** A converted value, and whether `--drop-nul` removed NUL characters from it. */
type Converted = { ok: true; value: PostgresValue; droppedNul?: true } | { ok: false; reason: string };

/** How strictly a value must arrive; see the header. */
export interface ConvertRules {
  /** A plugin's own data: the value keeps its storage class and its bytes, and a NUL is refused. */
  exact: boolean;
  /** TREK's own data: a NUL in text or JSON is dropped (and reported) instead of refused. */
  dropNul: boolean;
}

/** TREK's own tables, without `--drop-nul`. */
const TREK_RULES: ConvertRules = { exact: false, dropNul: false };
/** A plugin's own tables. */
export const PLUGIN_RULES: ConvertRules = { exact: true, dropNul: false };

const INT64_MIN = -(2n ** 63n);
const INT64_MAX = 2n ** 63n - 1n;
const SAFE_MAX = BigInt(Number.MAX_SAFE_INTEGER);
const DECIMAL_INTEGER = /^[+-]?\d+$/;
const DECIMAL_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const NUL = '\u0000';

/** Why a value holding a NUL character is refused. */
export const NUL_REASON = 'holds a NUL character (U+0000), which Postgres text cannot hold';

/**
 * The kind of a Postgres column, from `information_schema.columns.data_type`.
 * Null for a type the move has no rule for: the caller refuses the move then,
 * so a new column type fails loudly here instead of being copied by guess.
 */
export function columnKind(dataType: string): ColumnKind | null {
  switch (dataType) {
    case 'bigint':
    case 'integer':
    case 'smallint':
      return 'integer';
    case 'double precision':
    case 'real':
      return 'float';
    case 'text':
    case 'character varying':
    case 'character':
      return 'text';
    case 'json':
    case 'jsonb':
      return 'json';
    case 'bytea':
      return 'bytes';
    default:
      return null;
  }
}

function refuse(reason: string): Converted {
  return { ok: false, reason };
}

function describe(value: SqliteValue): string {
  if (value instanceof Uint8Array) return `a ${value.length}-byte BLOB`;
  if (typeof value === 'string')
    return `the text ${JSON.stringify(value.length > 40 ? `${value.slice(0, 40)}...` : value)}`;
  return `the value ${String(value)}`;
}

function toInteger(value: Exclude<SqliteValue, null>): Converted {
  let whole: bigint;
  if (typeof value === 'bigint') whole = value;
  else if (typeof value === 'number') {
    if (!Number.isInteger(value)) return refuse(`${describe(value)} is not a whole number`);
    whole = BigInt(value);
  } else if (typeof value === 'string' && DECIMAL_INTEGER.test(value.trim())) {
    whole = BigInt(value.trim());
  } else {
    return refuse(`${describe(value)} is not a whole number`);
  }
  if (whole < INT64_MIN || whole > INT64_MAX) return refuse(`${describe(value)} does not fit in 64 bits`);
  return { ok: true, value: whole.toString() };
}

function toFloat(value: Exclude<SqliteValue, null>): Converted {
  if (typeof value === 'number') return { ok: true, value };
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (BigInt(number) !== value) return refuse(`${describe(value)} has more digits than a double holds`);
    return { ok: true, value: number };
  }
  if (typeof value === 'string' && DECIMAL_NUMBER.test(value.trim())) {
    const number = Number(value.trim());
    if (Number.isFinite(number)) return { ok: true, value: number };
  }
  return refuse(`${describe(value)} is not a number`);
}

function toText(value: Exclude<SqliteValue, null>, dropNul: boolean): Converted {
  if (typeof value === 'string') {
    if (!value.includes(NUL)) return { ok: true, value };
    if (!dropNul) return refuse(`${describe(value)} ${NUL_REASON}`);
    return { ok: true, value: stripNul(value), droppedNul: true };
  }
  if (typeof value === 'bigint' || typeof value === 'number') return { ok: true, value: String(value) };
  return refuse(`${describe(value)} is not text`);
}

/** Whether a parsed JSON value holds a NUL in any string, object keys included. */
function jsonHoldsNul(value: unknown): boolean {
  if (typeof value === 'string') return value.includes(NUL);
  if (Array.isArray(value)) return value.some(jsonHoldsNul);
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).some(([key, item]) => key.includes(NUL) || jsonHoldsNul(item));
  }
  return false;
}

function toJson(value: Exclude<SqliteValue, null>, dropNul: boolean): Converted {
  if (typeof value === 'bigint' || typeof value === 'number') return { ok: true, value: String(value) };
  if (typeof value !== 'string') return refuse(`${describe(value)} is not JSON text`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return refuse(`${describe(value)} is not valid JSON`);
  }
  // Valid JSON holds a NUL only escaped, which jsonb refuses as well.
  if (!jsonHoldsNul(parsed)) return { ok: true, value };
  if (!dropNul) return refuse(`${describe(value)} ${NUL_REASON} (escaped as \\u0000)`);
  return { ok: true, value: JSON.stringify(nulFreeJson(parsed)), droppedNul: true };
}

function toBytes(value: Exclude<SqliteValue, null>): Converted {
  if (value instanceof Uint8Array) return { ok: true, value: Buffer.from(value) };
  // A text value in a BLOB column: its UTF-8 bytes, what SQLite's CAST(x AS BLOB) answers.
  if (typeof value === 'string') return { ok: true, value: Buffer.from(value, 'utf8') };
  return refuse(`${describe(value)} is not a BLOB`);
}

/** What a column of `kind` holds on Postgres, for a refusal. */
const KIND_HOLDS: Record<ColumnKind, string> = {
  integer: 'integers (bigint)',
  float: 'numbers (double precision)',
  text: 'text',
  json: 'JSON (jsonb)',
  bytes: 'bytes (bytea)',
};

/** The SQLite storage class of a value, for a refusal. */
function storageClass(value: Exclude<SqliteValue, null>): string {
  if (value instanceof Uint8Array) return 'a BLOB';
  if (typeof value === 'string') return 'TEXT';
  return typeof value === 'bigint' ? 'an INTEGER' : 'a REAL';
}

/**
 * A plugin's value as its Postgres column takes it, only where the Postgres
 * plugin store hands it back to the plugin as the SQLite file did: a `bigint`
 * column reads as a number (and one past 2^53 is refused, `parseInt8` in
 * `postgres-driver.ts`), `double precision` as a number, `text` as a string
 * and `bytea` as a Buffer.
 */
function exactly(value: Exclude<SqliteValue, null>, kind: ColumnKind): Converted {
  const changed = () =>
    refuse(
      `${describe(value)} is stored as ${storageClass(value)}, but the column holds ${KIND_HOLDS[kind]} on Postgres, ` +
        'so the plugin would read it back as another type',
    );
  switch (kind) {
    case 'integer':
      if (typeof value !== 'bigint') return changed();
      if (value > SAFE_MAX || value < -SAFE_MAX) {
        return refuse(`${describe(value)} is beyond 2^53, which the Postgres plugin store refuses to read`);
      }
      return { ok: true, value: value.toString() };
    case 'float':
      if (typeof value === 'number') return { ok: true, value };
      if (typeof value !== 'bigint') return changed();
      return value > SAFE_MAX || value < -SAFE_MAX
        ? refuse(`${describe(value)} has more digits than a double holds`)
        : { ok: true, value: Number(value) };
    case 'text':
      if (typeof value !== 'string') return changed();
      return value.includes(NUL) ? refuse(`${describe(value)} ${NUL_REASON}`) : { ok: true, value };
    case 'bytes':
      return value instanceof Uint8Array ? { ok: true, value: Buffer.from(value) } : changed();
    case 'json':
      return toJson(value, false);
  }
}

/** `value` as the Postgres column of `kind` takes it under `rules`, or the reason it cannot hold it exactly. */
export function convertValue(value: SqliteValue, kind: ColumnKind, rules: ConvertRules = TREK_RULES): Converted {
  if (value === null) return { ok: true, value: null };
  if (rules.exact) return exactly(value, kind);
  switch (kind) {
    case 'integer':
      return toInteger(value);
    case 'float':
      return toFloat(value);
    case 'text':
      return toText(value, rules.dropNul);
    case 'json':
      return toJson(value, rules.dropNul);
    case 'bytes':
      return toBytes(value);
  }
}

/** Whether an integer value read back would be beyond what TREK's Postgres driver reads (2^53). */
export function beyondSafeInteger(value: PostgresValue): boolean {
  if (typeof value !== 'string' || !DECIMAL_INTEGER.test(value)) return false;
  const whole = BigInt(value);
  return whole > SAFE_MAX || whole < -SAFE_MAX;
}

/** JSON text with its object keys sorted, so two spellings of one value compare equal (jsonb reorders keys). */
export function stableJson(text: string): string {
  const sort = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sort);
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [key, sort((value as Record<string, unknown>)[key])]),
      );
    }
    return value;
  };
  return JSON.stringify(sort(JSON.parse(text)));
}

/** Bytes as the compared text: their hex digits. */
function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * The text a value is compared in, from the value read from the SQLite file
 * (not from what the move sent), by the rules it was converted under.
 * `canonicalFromPostgres` must answer the same for what Postgres stored, so a
 * conversion that changed a value, or a value that changed on the way, fails
 * the verification. The one change the rules allow is `--drop-nul` on TREK's
 * own text and JSON, which the operator asked for and the summary lists. A
 * value of a storage class its kind does not take is refused before it is
 * sent; here it answers a marked text that matches nothing Postgres prints.
 */
export function canonicalFromSource(
  value: SqliteValue,
  kind: ColumnKind,
  rules: ConvertRules = TREK_RULES,
): string | null {
  if (value === null) return null;
  if (value instanceof Uint8Array) return kind === 'bytes' ? hex(value) : `blob:${hex(value)}`;
  const dropNul = rules.dropNul && !rules.exact;
  switch (kind) {
    case 'integer':
      return typeof value === 'bigint' ? value.toString() : BigInt(String(value).trim()).toString();
    case 'float':
      return typeof value === 'bigint' ? value.toString() : String(Number(String(value).trim()));
    case 'text':
      return typeof value === 'string' && dropNul ? stripNul(value) : String(value);
    case 'json':
      if (typeof value !== 'string') return stableJson(String(value));
      return stableJson(dropNul ? JSON.stringify(nulFreeJson(JSON.parse(value))) : value);
    case 'bytes':
      return typeof value === 'string' ? Buffer.from(value, 'utf8').toString('hex') : `number:${String(value)}`;
  }
}

/**
 * The text a value is compared in, from the column read back as `::text`
 * (with `bytea_output = hex`, so bytes read as `\x` and their hex digits).
 */
export function canonicalFromPostgres(text: string | null, kind: ColumnKind): string | null {
  if (text === null) return null;
  switch (kind) {
    case 'integer':
      return BigInt(text).toString();
    case 'float':
      return String(Number(text));
    case 'text':
      return text;
    case 'json':
      return stableJson(text);
    case 'bytes':
      return text.startsWith('\\x') ? text.slice(2).toLowerCase() : text;
  }
}

const CHECKSUM_MODULUS = 2n ** 256n;

/**
 * An order-free checksum over a table's rows: the sum of each row's SHA-256
 * modulo 2^256. Postgres and SQLite need not hand the rows back in the same
 * order (their collations differ), and a row that is missing, added, doubled
 * or changed changes the sum.
 */
export class TableChecksum {
  private sum = 0n;
  rows = 0;

  add(canonicalRow: ReadonlyArray<string | null>): void {
    const digest = createHash('sha256').update(JSON.stringify(canonicalRow)).digest('hex');
    this.sum = (this.sum + BigInt(`0x${digest}`)) % CHECKSUM_MODULUS;
    this.rows++;
  }

  hex(): string {
    return this.sum.toString(16).padStart(64, '0');
  }
}
