import type { SqliteSource } from '../../sqlite/sqlite-source';
import {
  beyondSafeInteger,
  canonicalFromPostgres,
  canonicalFromSent,
  convertValue,
  TableChecksum,
  type ColumnKind,
  type PostgresValue,
  type SqliteValue,
} from './values';

import { CompiledQuery, type Kysely, type Transaction } from 'kysely';

/**
 * Copying one table from the SQLite file into Postgres and proving the copy,
 * inside the move's transaction. The same steps serve TREK's own tables and a
 * plugin's: read the rows one at a time, convert each value to its column's
 * type, insert in batches, then read the table back and compare its row count
 * and checksum with what was sent.
 */

export type Trx = Transaction<object>;

/** Rows per INSERT at most; fewer for a wide table, so a batch stays far below Postgres's 65535 parameters. */
const MAX_BATCH_ROWS = 500;
const MAX_BATCH_PARAMS = 30_000;
/** Rows a verification cursor fetches at once. */
const FETCH_ROWS = 2_000;
/** The most refused values a refusal lists one by one. */
export const MAX_LISTED_PROBLEMS = 20;

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

async function insertBatch(trx: Trx, spec: TableSpec, batch: PostgresValue[][]): Promise<void> {
  if (batch.length === 0) return;
  try {
    await run(trx, insertSql(spec, batch.length), batch.flat());
  } catch (err) {
    throw new Error(`Postgres refused rows of ${spec.label}: ${describePgError(err)}`, { cause: err });
  }
}

/**
 * Copies the rows of one table. Every value is converted first; once one
 * cannot be, nothing more is inserted, but the rest of the table is still read
 * so the refusal can list every problem at once. With `insert: false` it only
 * reads and converts, once an earlier table was refused.
 */
export async function copyTable(
  trx: Trx,
  source: SqliteSource,
  spec: TableSpec,
  options: { insert: boolean } = { insert: true },
): Promise<CopiedTable> {
  const result: CopiedTable = {
    spec,
    rows: 0,
    checksum: '',
    problems: [],
    problemCount: 0,
    unsafeIntegers: 0,
    deferredRows: [],
  };
  const checksum = new TableChecksum();
  const deferredAt = spec.deferred.map((name) => spec.columns.findIndex((column) => column.name === name));
  const keyAt = spec.primaryKey.map((name) => spec.columns.findIndex((column) => column.name === name));
  const size = batchRows(spec.columns.length);

  /** How a refusal names a row: by its primary key, or by its place in the table without one. */
  const rowName = (raw: unknown[]): string => {
    if (keyAt.length === 0 || keyAt.includes(-1)) return `row ${result.rows}`;
    return `row ${spec.primaryKey.map((name, index) => `${name}=${String(raw[keyAt[index]])}`).join(', ')}`;
  };

  /** One SQLite row as the values sent to Postgres, or null once a value was refused. */
  const convertRow = (raw: unknown[]): PostgresValue[] | null => {
    result.rows++;
    const values: PostgresValue[] = [];
    spec.columns.forEach((column, index) => {
      const converted = convertValue(raw[index] as SqliteValue, column.kind);
      if (converted.ok) {
        values.push(converted.value);
        if (column.kind === 'integer' && beyondSafeInteger(converted.value)) result.unsafeIntegers++;
        return;
      }
      values.push(null);
      result.problemCount++;
      if (result.problems.length < MAX_LISTED_PROBLEMS) {
        result.problems.push(`${spec.label} ${rowName(raw)}, column ${column.name}: ${converted.reason}`);
      }
    });
    if (result.problemCount > 0) return null;
    checksum.add(values.map((value, index) => canonicalFromSent(value, spec.columns[index].kind)));
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
    await (options.insert && result.problemCount === 0 ? insertBatch(trx, spec, batch) : Promise.resolve());
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
 * row count and checksum, which must equal what `copyTable` sent.
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
