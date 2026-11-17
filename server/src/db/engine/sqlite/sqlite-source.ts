import { openDatabase } from '../../connection';

import fs from 'node:fs';

/**
 * A SQLite file opened for reading only, for the move to Postgres and the
 * Postgres boot's check for an install left behind. It never writes: the
 * handle is read-only, and every read runs in one read transaction, so the
 * whole move sees the file as it was at one moment.
 *
 * Integers come back as `bigint` (better-sqlite3's safe integers), so a value
 * past 2^53 keeps every digit.
 */

/** A column as `pragma_table_info` describes it. */
export interface SqliteColumn {
  name: string;
  /** The declared type, as written in the CREATE TABLE (may be empty). */
  declaredType: string;
  notNull: boolean;
  /** Its position in the primary key, from 1; 0 when it is not part of it. */
  primaryKey: number;
  /** The default as SQL text, or null. */
  defaultSql: string | null;
}

/** An index of a table, as `pragma_index_list` and `pragma_index_info` describe it. */
export interface SqliteIndex {
  name: string;
  unique: boolean;
  /** Where it comes from: `c` a CREATE INDEX, `u` a UNIQUE constraint, `pk` the primary key. */
  origin: string;
  partial: boolean;
  /** The indexed columns in order; null when one of them is an expression. */
  columns: string[] | null;
}

/** A row whose foreign key points at nothing, from `pragma_foreign_key_check`. */
interface OrphanRow {
  table: string;
  rowid: bigint | null;
  parent: string;
}

/** `name` as a SQLite identifier. */
function quoteSqliteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

/** A handle as `openDatabase` gives it: the driver itself stays behind src/db/connection.ts. */
type SqliteHandle = ReturnType<typeof openDatabase>;

export class SqliteSource {
  private constructor(
    private readonly db: SqliteHandle,
    readonly file: string,
  ) {}

  /**
   * Opens `file` read-only and starts the read transaction. A file that does
   * not exist is refused rather than created.
   */
  static open(file: string): SqliteSource {
    if (!fs.existsSync(file)) throw new Error(`There is no SQLite file at ${file}.`);
    const db = openDatabase(file, { readonly: true, fileMustExist: true });
    try {
      db.defaultSafeIntegers(true);
      db.exec('BEGIN');
      return new SqliteSource(db, file);
    } catch (err) {
      db.close();
      throw err;
    }
  }

  close(): void {
    if (!this.db.open) return;
    if (this.db.inTransaction) this.db.exec('ROLLBACK');
    this.db.close();
  }

  private names(sql: string, ...params: unknown[]): string[] {
    return this.db
      .prepare(sql)
      .pluck()
      .all(...params)
      .map((value) => String(value));
  }

  /** The user tables, by name, without SQLite's own (`sqlite_*`). */
  tables(): string[] {
    return this.names(
      "select name from sqlite_master where type = 'table' and name not like 'sqlite\\_%' escape '\\' order by name",
    );
  }

  /** The views and triggers, which the move does not carry for a plugin's database. */
  viewsAndTriggers(): Array<{ type: string; name: string }> {
    return this.db
      .prepare("select type, name from sqlite_master where type in ('view', 'trigger') order by type, name")
      .all() as Array<{ type: string; name: string }>;
  }

  hasTable(name: string): boolean {
    return this.names("select name from sqlite_master where type = 'table' and name = ?", name).length > 0;
  }

  /** The names TREK's migration history holds; null when the file has no history table. */
  migrationNames(): string[] | null {
    if (!this.hasTable('mikro_orm_migrations')) return null;
    return this.names('select name from mikro_orm_migrations order by name');
  }

  columns(table: string): SqliteColumn[] {
    const rows = this.db
      .prepare('select name, type, "notnull", pk, dflt_value from pragma_table_info(?) order by cid')
      .all(table) as Array<{
      name: string;
      type: string | null;
      notnull: bigint;
      pk: bigint;
      dflt_value: string | null;
    }>;
    return rows.map((row) => ({
      name: row.name,
      declaredType: row.type ?? '',
      notNull: row.notnull !== 0n,
      primaryKey: Number(row.pk),
      defaultSql: row.dflt_value,
    }));
  }

  indexes(table: string): SqliteIndex[] {
    const list = this.db
      .prepare('select name, "unique", origin, partial from pragma_index_list(?)')
      .all(table) as Array<{
      name: string;
      unique: bigint;
      origin: string;
      partial: bigint;
    }>;
    return list.map((index) => {
      const keys = this.db
        .prepare('select cid, name from pragma_index_info(?) order by seqno')
        .all(index.name) as Array<{
        cid: bigint;
        name: string | null;
      }>;
      const columns = keys.every((key) => key.cid >= 0n && key.name !== null)
        ? keys.map((key) => String(key.name))
        : null;
      return {
        name: index.name,
        unique: index.unique !== 0n,
        origin: index.origin,
        partial: index.partial !== 0n,
        columns,
      };
    });
  }

  hasRows(table: string): boolean {
    return this.db.prepare(`select 1 from ${quoteSqliteIdentifier(table)} limit 1`).get() !== undefined;
  }

  count(table: string): number {
    return Number(
      this.db
        .prepare(`select count(*) from ${quoteSqliteIdentifier(table)}`)
        .pluck()
        .get(),
    );
  }

  /** What `typeof()` answers for the column's values that are not NULL: `integer`, `real`, `text`, `blob`. */
  storageClasses(table: string, column: string): Set<string> {
    const quoted = quoteSqliteIdentifier(column);
    return new Set(
      this.names(`select distinct typeof(${quoted}) from ${quoteSqliteIdentifier(table)} where ${quoted} is not null`),
    );
  }

  /** The rows of `table`, one array of `columns` per row, read one at a time. */
  rows(table: string, columns: readonly string[]): IterableIterator<unknown[]> {
    const list = columns.map(quoteSqliteIdentifier).join(', ');
    return this.db
      .prepare(`select ${list} from ${quoteSqliteIdentifier(table)}`)
      .raw(true)
      .iterate() as IterableIterator<unknown[]>;
  }

  /** The highest id each AUTOINCREMENT table ever handed out, which can be above the largest id left. */
  autoincrementSeen(): Map<string, bigint> {
    if (!this.hasTable('sqlite_sequence')) return new Map();
    const rows = this.db.prepare('select name, seq from sqlite_sequence').all() as Array<{ name: string; seq: bigint }>;
    return new Map(rows.map((row) => [row.name, BigInt(row.seq)]));
  }

  /** Up to `limit` rows whose foreign key points at a row that does not exist. */
  orphans(limit: number): OrphanRow[] {
    const rows = this.db
      .prepare('select "table", rowid, parent from pragma_foreign_key_check limit ?')
      .all(limit) as Array<{
      table: string;
      rowid: bigint | null;
      parent: string;
    }>;
    return rows;
  }
}

/**
 * Whether `file` is a SQLite install holding accounts: a `users` table with a
 * row. A missing or empty file holds none. A file that cannot be read is
 * reported as holding some, so a check built on this fails closed.
 */
export function sqliteInstallHoldsAccounts(file: string): boolean {
  let size: number;
  try {
    size = fs.statSync(file).size;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    return true;
  }
  if (size === 0) return false;
  let source: SqliteSource | null = null;
  try {
    source = SqliteSource.open(file);
    return source.hasTable('users') && source.hasRows('users');
  } catch {
    return true;
  } finally {
    source?.close();
  }
}
