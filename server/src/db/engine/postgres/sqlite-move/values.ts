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
 * The SQLite side is read with better-sqlite3's safe integers, so an integer
 * arrives as a `bigint` and keeps all 64 bits.
 */

/** The Postgres column types the move writes, by what they hold. */
export type ColumnKind = 'integer' | 'float' | 'text' | 'json' | 'bytes';

/** What a SQLite cell can be: NULL, INTEGER, REAL, TEXT or BLOB. */
export type SqliteValue = null | bigint | number | string | Uint8Array;

/** A value Postgres takes as a parameter: a decimal string for an integer, a Buffer for bytes. */
export type PostgresValue = null | string | number | Buffer;

type Converted = { ok: true; value: PostgresValue } | { ok: false; reason: string };

const INT64_MIN = -(2n ** 63n);
const INT64_MAX = 2n ** 63n - 1n;
const SAFE_MAX = BigInt(Number.MAX_SAFE_INTEGER);
const DECIMAL_INTEGER = /^[+-]?\d+$/;
const DECIMAL_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const NUL = '\u0000';

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

function toText(value: Exclude<SqliteValue, null>): Converted {
  if (typeof value === 'string') {
    return value.includes(NUL)
      ? refuse('the text holds a NUL character, which Postgres text cannot store')
      : { ok: true, value };
  }
  if (typeof value === 'bigint' || typeof value === 'number') return { ok: true, value: String(value) };
  return refuse(`${describe(value)} is not text`);
}

function toJson(value: Exclude<SqliteValue, null>): Converted {
  if (typeof value === 'bigint' || typeof value === 'number') return { ok: true, value: String(value) };
  if (typeof value !== 'string') return refuse(`${describe(value)} is not JSON text`);
  try {
    JSON.parse(value);
  } catch {
    return refuse(`${describe(value)} is not valid JSON`);
  }
  // jsonb refuses the escaped NUL character as well as the raw one.
  if (value.includes(NUL) || value.includes('\\u0000'))
    return refuse('the JSON holds a NUL character, which jsonb cannot store');
  return { ok: true, value };
}

function toBytes(value: Exclude<SqliteValue, null>): Converted {
  if (value instanceof Uint8Array) return { ok: true, value: Buffer.from(value) };
  // A text value in a BLOB column: its UTF-8 bytes, what SQLite's CAST(x AS BLOB) answers.
  if (typeof value === 'string') return { ok: true, value: Buffer.from(value, 'utf8') };
  return refuse(`${describe(value)} is not a BLOB`);
}

/** `value` as the Postgres column of `kind` takes it, or the reason it cannot hold it exactly. */
export function convertValue(value: SqliteValue, kind: ColumnKind): Converted {
  if (value === null) return { ok: true, value: null };
  switch (kind) {
    case 'integer':
      return toInteger(value);
    case 'float':
      return toFloat(value);
    case 'text':
      return toText(value);
    case 'json':
      return toJson(value);
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

/**
 * The text a value is compared in, from the value the move sent to Postgres.
 * `canonicalFromPostgres` must answer the same for what Postgres stored.
 */
export function canonicalFromSent(value: PostgresValue, kind: ColumnKind): string | null {
  if (value === null) return null;
  switch (kind) {
    case 'integer':
      return BigInt(String(value)).toString();
    case 'float':
      return String(Number(value));
    case 'text':
      return String(value);
    case 'json':
      return stableJson(String(value));
    case 'bytes':
      return Buffer.isBuffer(value) ? value.toString('hex') : Buffer.from(String(value), 'utf8').toString('hex');
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
