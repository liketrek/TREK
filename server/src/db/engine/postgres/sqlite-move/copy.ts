import type { SqliteSource } from '../../sqlite/sqlite-source';
import { FIX_IN_PLUGIN_DB, FIX_IN_SQLITE_FILE, MoveRefusal } from './refusal';
import {
  beyondSafeInteger,
  canonicalFromPostgres,
  canonicalFromSource,
  convertValue,
  NUL_REASON,
  PLUGIN_RULES,
  TableChecksum,
  type ColumnKind,
  type ConvertRules,
  type PostgresValue,
  type SqliteValue,
} from './values';

import { CompiledQuery, type Kysely, type Transaction } from 'kysely';

/**
 * Copying one table from the SQLite file into Postgres and proving the copy,
 * inside the move's transaction. The same steps serve TREK's own tables and a
 * plugin's: read the rows one at a time, convert each value to its column's
 * type, insert in batches, then read the table back and compare its row count
 * and checksum with the rows read from the SQLite file.
 */

export type Trx = Transaction<object>;

/** Rows per INSERT at most; fewer for a wide table, so a batch stays far below Postgres's 65535 parameters. */
const MAX_BATCH_ROWS = 500;
const MAX_BATCH_PARAMS = 30_000;
/** Rows a verification cursor fetches at once. */
const FETCH_ROWS = 2_000;
/** The most refused values a refusal lists one by one. */
export const MAX_LISTED_PROBLEMS = 20;
/** Postgres's SQLSTATE for a row that would break a unique key. */
const UNIQUE_VIOLATION = '23505';

/**
 * A unique index of a Postgres table. `key` is its key as Postgres spells it
 * (`username`, or `lower(email)` for an expression), `columns` every column
 * the key reads, so a broken key can be traced to the values that changed.
 * `expression` is whether any part of the key is an expression rather than a
 * plain column.
 */
export interface UniqueKey {
  name: string;
  key: string;
  columns: string[];
  expression: boolean;
}

/** One column of a table the move copies. */
interface CopyColumn {
  name: string;
  kind: ColumnKind;
}

/** What the move copies from one SQLite table into one Postgres table. */
export interface TableSpec {
  /** The table in the SQLite file. */
  source: string;
  /** The Postgres table, quoted and qualified as SQL needs it. */
  target: string;
  /** A name for messages: `users`, or `plugin my-plugin: notes`. */
  label: string;
  columns: CopyColumn[];
  /** Foreign key columns inserted as NULL first and set once every table is in (`order.ts`). */
  deferred: string[];
  /** The primary key's columns, which the deferred update finds a row by. */
  primaryKey: string[];
  /** A plugin's own table, whose values must arrive exactly as stored (`PLUGIN_RULES` in `values.ts`). */
  exact: boolean;
  /** The unique keys of the Postgres table (the primary key among them), by constraint or index name. */
  uniqueKeys: UniqueKey[];
}

/** A value from which `--drop-nul` removed NUL characters, for the summary. */
interface DroppedNul {
  /** The table, row and column, named as a refusal names a value. */
  where: string;
  column: string;
  /**
   * The text without its NUL characters, as Postgres spells it in a broken
   * key's detail, or null where it spells it otherwise (JSON, which jsonb
   * reformats).
   */
  text: string | null;
}

/** A row's deferred values, kept until every table is in. */
interface DeferredRow {
  key: PostgresValue[];
  values: PostgresValue[];
}

/** What copying one table found. */
export interface CopiedTable {
  spec: TableSpec;
  rows: number;
  checksum: string;
  /** Values the Postgres column cannot hold exactly, listed up to `MAX_LISTED_PROBLEMS`; the move refuses on any. */
  problems: string[];
  problemCount: number;
  /** How many of the refused values hold a NUL character. */
  nulRefused: number;
  /** Every value `--drop-nul` changed. */
  nulDropped: DroppedNul[];
  /** Integer values beyond 2^53, which TREK's Postgres driver refuses to read back. */
  unsafeIntegers: number;
  deferredRows: DeferredRow[];
}

/** `name` as a Postgres identifier. */
export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

/** Runs one statement, in the move's transaction or on the pool, and returns its rows. */
export async function run<R = Record<string, unknown>>(
  trx: Kysely<object>,
  sql: string,
  params: unknown[] = [],
): Promise<R[]> {
  const result = await trx.executeQuery<R>(CompiledQuery.raw(sql, params));
  return result.rows;
}

/**
 * Runs `work` for each item, one after the other, each started once the one
 * before it has finished: the move's statements share one transaction, which
 * runs one statement at a time.
 */
export async function inOrder<T>(items: readonly T[], work: (item: T) => Promise<void>): Promise<void> {
  await items.reduce<Promise<void>>((previous, item) => previous.then(() => work(item)), Promise.resolve());
}

/** A Postgres error with its detail and the constraint it broke, which `pg` keeps apart from the message. */
export function describePgError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const extra = err as Error & { detail?: string; constraint?: string };
  const parts = [err.message];
  if (extra.constraint) parts.push(`constraint ${extra.constraint}`);
  if (extra.detail) parts.push(extra.detail);
  return parts.join('; ');
}

/** How many rows one INSERT carries for a table of `columns` columns. */
export function batchRows(columns: number): number {
  return Math.max(1, Math.min(MAX_BATCH_ROWS, Math.floor(MAX_BATCH_PARAMS / Math.max(1, columns))));
}

/** The INSERT of `rows` rows into the table, with numbered parameters row by row. */
export function insertSql(spec: Pick<TableSpec, 'target' | 'columns'>, rows: number): string {
  const names = spec.columns.map((column) => quoteIdentifier(column.name)).join(', ');
  const width = spec.columns.length;
  const tuples = Array.from(
    { length: rows },
    (_, row) => `(${spec.columns.map((_column, index) => `$${row * width + index + 1}`).join(', ')})`,
  );
  return `insert into ${spec.target} (${names}) values ${tuples.join(', ')}`;
}

/** Lines as a refusal lists them, and how many more there are when `total` is above what is listed. */
export function listLines(lines: readonly string[], total = lines.length): string {
  const shown = lines.map((line) => `  - ${line}`);
  if (total > lines.length) shown.push(`  - and ${total - lines.length} more`);
  return shown.join('\n');
}

/** The SQLSTATE of a Postgres error, when it carries one. */
function sqlState(err: unknown): string {
  const { code } = (err ?? {}) as { code?: unknown };
  return typeof code === 'string' ? code : '';
}

/**
 * Whether Postgres refused rows over a constraint (SQLSTATE class 23: a
 * unique, check, not-null or foreign key violation). Its detail names the
 * key or the failing row, which the operator corrects in the SQLite file.
 */
function brokeConstraint(err: unknown): boolean {
  return sqlState(err).startsWith('23');
}

/**
 * Whether Postgres refused a value its column cannot hold (SQLSTATE class
 * 22). `values.ts` refuses every such value by table, row and column before
 * anything is written, so one that reaches Postgres is a gap in the move, not
 * something the operator can find in the file: Postgres does not say which
 * row of a batch it was.
 */
function valueRefused(err: unknown): boolean {
  return sqlState(err).startsWith('22');
}

/**
 * The key value of a unique violation's detail (`Key (lower(email))=(ab@x.test)
 * already exists.`), lower-cased, or null when the detail has another shape
 * (none, or the server's messages are in another language).
 */
function duplicateKeyValue(err: unknown): string | null {
  const { detail } = (err ?? {}) as { detail?: unknown };
  if (typeof detail !== 'string') return null;
  const match = /^Key \(.*?\)=\((.*)\) already exists\.$/s.exec(detail);
  return match ? match[1].toLowerCase() : null;
}

/** A unique key as a refusal names it: its columns, and for an expression also the key as Postgres spells it. */
function describeKey(key: UniqueKey): string {
  const columns = `column(s) ${key.columns.join(', ')}`;
  return key.expression ? `${columns} (read by its unique key ${key.key})` : columns;
}

/**
 * Why Postgres refused rows of a table, and what to do. A broken unique key
 * is two rows the SQLite file held apart: it may lack that index, compare
 * differently, or have held two values that differed only by a NUL until
 * `--drop-nul` removed it. Only Postgres's detail tells which, so the refusal
 * never asserts a cause: it names the key and the value, and lists the values
 * `--drop-nul` changed in the columns the key reads (for an expression index,
 * the columns its expression reads) whose text the duplicate value holds.
 * That test ignores case, so a key over lower() still finds them; it may keep
 * a value that is not one of the two rows, but never leaves out one that is.
 * Any other broken constraint is a row Postgres names in its detail. A value
 * its column refuses is a gap in the move, reported as one.
 */
export function refusedRowsMessage(spec: TableSpec, err: unknown, dropped: readonly DroppedNul[]): string {
  const message = `Postgres refused rows of ${spec.label}: ${describePgError(err)}`;
  if (valueRefused(err)) {
    return (
      `${message}\nThe move let through a value of ${spec.label} that Postgres refuses. It should have refused ` +
      'that value by table, row and column before writing anything, so this is a bug in TREK: please report it ' +
      'with this message.'
    );
  }
  if (!brokeConstraint(err)) return message;
  const fix = spec.exact ? FIX_IN_PLUGIN_DB : FIX_IN_SQLITE_FILE;
  if (sqlState(err) !== UNIQUE_VIOLATION) {
    return (
      `${message}\nA row of ${spec.label} breaks a rule of its Postgres table that the SQLite file did not hold ` +
      `it to; the detail above names the failing row or the value it refers to. Correct or remove that row ${fix}`
    );
  }
  const { constraint } = (err ?? {}) as { constraint?: unknown };
  const key = spec.uniqueKeys.find((candidate) => candidate.name === constraint);
  const keyValue = duplicateKeyValue(err);
  const suspects = (key ? dropped.filter((value) => key.columns.includes(value.column)) : dropped).filter(
    (value) => keyValue === null || value.text === null || keyValue.includes(value.text.toLowerCase()),
  );
  const differently = key?.expression ? ", or compare differently: SQLite's lower() changes only A to Z" : '';
  const lines = [
    message,
    `Two rows of ${spec.label} share ${key ? `a value of its ${describeKey(key)}` : 'a unique key'}, which ` +
      `Postgres holds unique and the SQLite file did not (it may lack that index${differently}). The detail ` +
      'above names the value.',
  ];
  if (suspects.length > 0) {
    lines.push(
      `--drop-nul removed NUL characters (U+0000) from ${suspects.length} value(s) of ` +
        `${key ? `its ${describeKey(key)}` : spec.label} that may hold it; a value that differed from another ` +
        'only by a NUL equals it once the NUL is gone, so check these first:',
      listLines(
        suspects.slice(0, MAX_LISTED_PROBLEMS).map((value) => value.where),
        suspects.length,
      ),
    );
  }
  lines.push(`Change or remove one of those rows ${fix}`);
  return lines.join('\n');
}

async function insertBatch(
  trx: Trx,
  spec: TableSpec,
  batch: PostgresValue[][],
  dropped: readonly DroppedNul[],
): Promise<void> {
  if (batch.length === 0) return;
  try {
    await run(trx, insertSql(spec, batch.length), batch.flat());
  } catch (err) {
    const message = refusedRowsMessage(spec, err, dropped);
    throw brokeConstraint(err) ? new MoveRefusal(message, { cause: err }) : new Error(message, { cause: err });
  }
}

/**
 * Copies the rows of one table. Every value is converted first; once one
 * cannot be, nothing more is inserted, but the rest of the table is still read
 * so the refusal can list every problem at once. Without a transaction, or
 * with `insert: false` (once an earlier table was refused), it only reads and
 * converts, which is how the checks before anything is written run it.
 */
export async function copyTable(
  trx: Trx | null,
  source: SqliteSource,
  spec: TableSpec,
  options: { insert?: boolean; dropNul?: boolean } = {},
): Promise<CopiedTable> {
  const result: CopiedTable = {
    spec,
    rows: 0,
    checksum: '',
    problems: [],
    problemCount: 0,
    nulRefused: 0,
    nulDropped: [],
    unsafeIntegers: 0,
    deferredRows: [],
  };
  const rules: ConvertRules = spec.exact ? PLUGIN_RULES : { exact: false, dropNul: options.dropNul === true };
  const checksum = new TableChecksum();
  const deferredAt = spec.deferred.map((name) => spec.columns.findIndex((column) => column.name === name));
  const keyAt = spec.primaryKey.map((name) => spec.columns.findIndex((column) => column.name === name));
  const size = batchRows(spec.columns.length);

  /**
   * How a refusal names a row: by its primary key, or by its place in the
   * table without one. A NUL in a key is spelled `\u0000`, so the line can be
   * read and copied.
   */
  const rowName = (raw: unknown[]): string => {
    if (keyAt.length === 0 || keyAt.includes(-1)) return `row ${result.rows}`;
    const key = (index: number) => String(raw[keyAt[index]]).replaceAll('\u0000', '\\u0000');
    return `row ${spec.primaryKey.map((name, index) => `${name}=${key(index)}`).join(', ')}`;
  };

  /** One SQLite row as the values sent to Postgres, or null once a value was refused. */
  const convertRow = (raw: unknown[]): PostgresValue[] | null => {
    result.rows++;
    const values: PostgresValue[] = [];
    spec.columns.forEach((column, index) => {
      const converted = convertValue(raw[index] as SqliteValue, column.kind, rules);
      const where = `${spec.label} ${rowName(raw)}, column ${column.name}`;
      // Narrowed by `in`: the server compiles without strictNullChecks, where `ok` does not narrow the union.
      if (!('reason' in converted)) {
        values.push(converted.value);
        if (column.kind === 'integer' && beyondSafeInteger(converted.value)) result.unsafeIntegers++;
        if (converted.droppedNul) {
          const text = column.kind === 'text' ? String(converted.value) : null;
          result.nulDropped.push({ where, column: column.name, text });
        }
        return;
      }
      values.push(null);
      result.problemCount++;
      if (converted.reason.includes(NUL_REASON)) result.nulRefused++;
      if (result.problems.length < MAX_LISTED_PROBLEMS) result.problems.push(`${where}: ${converted.reason}`);
    });
    if (result.problemCount > 0) return null;
    // From the SQLite values, not the converted ones, so a conversion that changed a value cannot verify itself.
    checksum.add(
      spec.columns.map((column, index) => canonicalFromSource(raw[index] as SqliteValue, column.kind, rules)),
    );
    if (deferredAt.length > 0) {
      const later = deferredAt.map((index) => values[index]);
      if (later.some((value) => value !== null)) {
        result.deferredRows.push({ key: keyAt.map((index) => values[index]), values: later });
      }
      for (const index of deferredAt) values[index] = null;
    }
    return values;
  };

  const rows = source.rows(
    spec.source,
    spec.columns.map((column) => column.name),
  );
  /** Reads up to one batch of rows; `done` once the table has no more. */
  const nextBatch = (): { batch: PostgresValue[][]; done: boolean } => {
    const batch: PostgresValue[][] = [];
    while (batch.length < size) {
      const next = rows.next();
      if (next.done) return { batch, done: true };
      const values = convertRow(next.value);
      if (values) batch.push(values);
    }
    return { batch, done: false };
  };
  const pump = async (): Promise<void> => {
    const { batch, done } = nextBatch();
    // Always awaited, so the next batch starts on a fresh stack even when nothing is inserted.
    await (trx && options.insert !== false && result.problemCount === 0
      ? insertBatch(trx, spec, batch, result.nulDropped)
      : Promise.resolve());
    if (!done) await pump();
  };
  try {
    await pump();
  } finally {
    // An iterator left open keeps the SQLite handle busy.
    rows.return?.();
  }
  result.checksum = checksum.hex();
  return result;
}

/** Sets the foreign key columns `copyTable` held back, once every table is in. */
export async function applyDeferred(trx: Trx, copied: CopiedTable): Promise<void> {
  const { spec } = copied;
  if (copied.deferredRows.length === 0) return;
  if (spec.primaryKey.length === 0) throw new Error(`${spec.label} has no primary key to set its deferred columns by.`);
  const width = spec.deferred.length;
  const sets = spec.deferred.map((name, index) => `${quoteIdentifier(name)} = $${index + 1}`).join(', ');
  const where = spec.primaryKey.map((name, index) => `${quoteIdentifier(name)} = $${width + index + 1}`).join(' and ');
  const sql = `update ${spec.target} set ${sets} where ${where}`;
  // One row at a time: only the rows of a table that points at itself, a handful in practice.
  await inOrder(copied.deferredRows, async (row) => {
    try {
      await run(trx, sql, [...row.values, ...row.key]);
    } catch (err) {
      throw new Error(`Postgres refused a reference in ${spec.label}: ${describePgError(err)}`, { cause: err });
    }
  });
}

/**
 * Reads a table back through a cursor, every column as text, and answers its
 * row count and checksum, which must equal what `copyTable` read from SQLite.
 */
export async function readBack(trx: Trx, spec: TableSpec): Promise<{ rows: number; checksum: string }> {
  const checksum = new TableChecksum();
  const list = spec.columns.map((column, index) => `${quoteIdentifier(column.name)}::text as c${index}`).join(', ');
  const fetchAll = async (): Promise<void> => {
    const rows = await run<Record<string, string | null>>(trx, `fetch forward ${FETCH_ROWS} from trek_move_verify`);
    for (const row of rows) {
      checksum.add(spec.columns.map((column, index) => canonicalFromPostgres(row[`c${index}`] ?? null, column.kind)));
    }
    if (rows.length === FETCH_ROWS) await fetchAll();
  };
  await run(trx, `declare trek_move_verify no scroll cursor for select ${list} from ${spec.target}`);
  try {
    await fetchAll();
  } finally {
    await run(trx, 'close trek_move_verify');
  }
  return { rows: checksum.rows, checksum: checksum.hex() };
}

/** A sequence behind a copied column: `table` names it in the SQLite file, `target` in Postgres. */
export interface CopiedSequence {
  table: string;
  target: string;
  column: string;
  sequence: string;
}

/**
 * Moves every sequence of the copied tables past the ids they now hold, and
 * past the highest id an AUTOINCREMENT table ever handed out in the SQLite
 * file, so a new row never takes an id SQLite would not have reused.
 */
export async function advanceSequences(
  trx: Trx,
  sequences: readonly CopiedSequence[],
  autoincrementSeen: ReadonlyMap<string, bigint>,
): Promise<number> {
  await inOrder(sequences, async (entry) => {
    const [row] = await run<{ max: string | null }>(
      trx,
      `select max(${quoteIdentifier(entry.column)})::text as max from ${entry.target}`,
    );
    const seen = autoincrementSeen.get(entry.table) ?? null;
    const copied = row?.max ? BigInt(row.max) : null;
    const highest = seen !== null && (copied === null || seen > copied) ? seen : copied;
    // Nothing copied: the next id is 1, as on a new database.
    const called = highest !== null && highest >= 1n;
    await run(trx, 'select setval($1::regclass, $2::bigint, $3::boolean)', [
      entry.sequence,
      called ? highest.toString() : '1',
      called,
    ]);
  });
  return sequences.length;
}
