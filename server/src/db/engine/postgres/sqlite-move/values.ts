import { stripNul } from '../../../nul-free';
import { InvalidUtf8Text } from '../../sqlite/sqlite-source';

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
 * arrives as a `bigint` and keeps all 64 bits. A TEXT value whose bytes are
 * not valid UTF-8 arrives as an {@link InvalidUtf8Text} and is refused under
 * either set of rules: Postgres text cannot hold those bytes, and reading
 * them as text would replace them without a trace.
 */

/** The Postgres column types the move writes, by what they hold. */
export type ColumnKind = 'integer' | 'float' | 'text' | 'json' | 'bytes';

/** What a SQLite cell can be: NULL, INTEGER, REAL, TEXT (valid UTF-8 or not) or BLOB. */
export type SqliteValue = null | bigint | number | string | InvalidUtf8Text | Uint8Array;

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
  if (value instanceof InvalidUtf8Text) return describe(value.text);
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

/**
 * A double as the parameter Postgres takes. Negative zero is sent as text:
 * `pg` spells the number -0 as "0", which would drop its sign.
 */
function floatParameter(value: number): PostgresValue {
  return Object.is(value, -0) ? '-0' : value;
}

/** A double as the compared text, negative zero kept apart from zero as Postgres prints it. */
function floatText(value: number): string {
  return Object.is(value, -0) ? '-0' : String(value);
}

function toFloat(value: Exclude<SqliteValue, null>): Converted {
  if (typeof value === 'number') return { ok: true, value: floatParameter(value) };
  if (typeof value === 'bigint') {
    const number = Number(value);
    if (BigInt(number) !== value) return refuse(`${describe(value)} has more digits than a double holds`);
    return { ok: true, value: number };
  }
  if (typeof value === 'string' && DECIMAL_NUMBER.test(value.trim())) {
    const number = Number(value.trim());
    if (Number.isFinite(number)) return { ok: true, value: floatParameter(number) };
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

/**
 * JSON text without its `\u0000` escapes, everything else exactly as written,
 * so dropping a NUL changes no number or spelling around it. Each escape is
 * read as a whole, so an escaped backslash followed by `u0000` stays.
 */
function dropJsonNul(text: string): string {
  return text.replace(/\\(?:u0000|[\s\S])/g, (escape) => (escape === '\\u0000' ? '' : escape));
}

/** JSON text without its NUL characters, raw or escaped, as `--drop-nul` stores it; see {@link toJson}. */
function jsonWithoutNul(text: string): string {
  return dropJsonNul(stripNul(text));
}

/** Half a UTF-16 surrogate pair: a high one without a low one after it, or a low one without a high one before. */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** Whether a parsed JSON value holds a string, object keys included, with half a surrogate pair. */
function jsonHoldsLoneSurrogate(value: unknown): boolean {
  if (typeof value === 'string') return LONE_SURROGATE.test(value);
  if (Array.isArray(value)) return value.some(jsonHoldsLoneSurrogate);
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).some(([key, item]) => LONE_SURROGATE.test(key) || jsonHoldsLoneSurrogate(item));
  }
  return false;
}

/** The text parsed as JSON, or undefined when it is not valid JSON. */
function parseJson(text: string): { parsed: unknown } | undefined {
  try {
    return { parsed: JSON.parse(text) as unknown };
  } catch {
    return undefined;
  }
}

/**
 * JSON text for a `jsonb` column. A NUL can sit in it two ways: escaped
 * (`\u0000`), which is valid JSON that jsonb refuses, or raw, which is not
 * valid JSON at all (JSON escapes every control character inside a string and
 * allows none outside one) and which TREK's own writes drop like any NUL in
 * text (`db/nul-free.ts`). Both are a NUL: refused with the NUL reason, and
 * under `--drop-nul` removed, the raw characters and the escapes and nothing
 * else. Text that is not valid JSON even without its NUL characters is
 * refused as that. An escape of half a surrogate pair (`\ud800` alone) parses
 * in JavaScript but not in jsonb, so it is named here instead of failing the
 * insert without a row.
 */
function toJson(value: Exclude<SqliteValue, null>, dropNul: boolean): Converted {
  if (typeof value === 'bigint' || typeof value === 'number') return { ok: true, value: String(value) };
  if (typeof value !== 'string') return refuse(`${describe(value)} is not JSON text`);
  const rawNul = value.includes(NUL);
  const json = parseJson(rawNul ? stripNul(value) : value);
  if (!json) {
    return refuse(`${describe(value)} is not valid JSON${rawNul ? ', even without its NUL characters (U+0000)' : ''}`);
  }
  if (jsonHoldsLoneSurrogate(json.parsed)) {
    return refuse(`${describe(value)} holds a \\u escape of half a UTF-16 surrogate pair, which Postgres JSON refuses`);
  }
  if (!rawNul && !jsonHoldsNul(json.parsed)) return { ok: true, value };
  if (!dropNul) return refuse(`${describe(value)} ${NUL_REASON}${rawNul ? '' : ' (escaped as \\u0000)'}`);
  return { ok: true, value: jsonWithoutNul(value), droppedNul: true };
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
  if (typeof value === 'string' || value instanceof InvalidUtf8Text) return 'TEXT';
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
      if (typeof value === 'number') return { ok: true, value: floatParameter(value) };
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
  if (value instanceof InvalidUtf8Text) {
    return refuse(
      `${describe(value)} holds bytes that are not valid UTF-8 (${hex(value.bytes)}), which Postgres text cannot hold`,
    );
  }
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

/**
 * Columns TREK's code compares in the `'<id>.0'` text its services write
 * (`legacyBoundIntegerText`). An install that got
 * `reservations.accommodation_id` from legacy step 34 has it as INTEGER, so
 * SQLite stored that text as the number and still matched it; the Postgres
 * column is text and matches only the text.
 */
const LEGACY_ID_TEXT_COLUMNS = new Set(['reservations.accommodation_id']);

/** Whether `table.column` of TREK's own schema holds ids in the `'<id>.0'` text. */
export function holdsLegacyIdText(table: string, column: string): boolean {
  return LEGACY_ID_TEXT_COLUMNS.has(`${table}.${column}`);
}

/** A whole number stored in such a column, as the `'<id>.0'` text it was written as; anything else as it is. */
export function asLegacyIdText(value: SqliteValue): SqliteValue {
  if (typeof value === 'bigint') return `${value}.0`;
  if (typeof value === 'number' && Number.isInteger(value)) return `${value}.0`;
  return value;
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
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
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
  if (value instanceof InvalidUtf8Text) return `invalid-utf8:${hex(value.bytes)}`;
  const dropNul = rules.dropNul && !rules.exact;
  switch (kind) {
    case 'integer':
      return typeof value === 'bigint' ? value.toString() : BigInt(String(value).trim()).toString();
    case 'float':
      if (typeof value === 'number') return floatText(value);
      return typeof value === 'bigint' ? value.toString() : floatText(Number(value.trim()));
    case 'text':
      return typeof value === 'string' && dropNul ? stripNul(value) : String(value);
    case 'json':
      if (typeof value !== 'string') return stableJson(String(value));
      return stableJson(dropNul ? jsonWithoutNul(value) : value);
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
      return floatText(Number(text));
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
