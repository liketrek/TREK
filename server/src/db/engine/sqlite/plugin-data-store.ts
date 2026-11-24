import { openDatabase } from '../../connection';
import type { PluginDataStore } from '../plugin-data';
import {
  PLUGIN_DATA_CAPS,
  PLUGIN_DATA_ERRORS,
  refuseNulSql,
  refuseNulValues,
  refuseTransactionControl,
  type PluginDataBudgetedCall,
} from '../plugin-data-contract';
import { splitAfterSemicolons } from './sql-script';

import fs from 'node:fs';
import path from 'node:path';

/**
 * A plugin's own data on SQLite (`db:own`): a database file of its own, the
 * SQLite side of the `PluginDataStore` port (`../plugin-data.ts`; the Postgres
 * side is a schema per plugin, `../postgres/plugin-data-store.ts`). The host
 * owns the handle and decides where the file lies
 * (`nest/plugins/host/plugin-data.backend.ts`); the plugin child never gets a
 * path or a connection, it reaches this only through RPC (db.exec, db.query,
 * db.tx, db.migrate). Because it is a separate file, containment is a
 * filesystem fact: the plugin cannot read TREK's database, and nothing has to
 * police table names in its SQL.
 *
 * A thin guard still refuses statements that would let a plugin leave its
 * file (ATTACH another database, VACUUM INTO elsewhere, PRAGMA) or tie up the
 * host with oversize SQL, and transaction control in any statement of any call
 * (`refuseTransactionControl`, the same refusal as on Postgres: every call
 * runs in a transaction of its own and tx() makes a batch atomic). Every read
 * is held to a row cap, and `query`, `tx`
 * and an `exec` script are held to a time budget (below). A call that breaks
 * the contract is refused with the words both engines use
 * (`PLUGIN_DATA_ERRORS`).
 *
 * SQL, a bound argument or a migration id holding U+0000 (NUL) is refused
 * before anything runs, with the same error as on Postgres, whose text cannot
 * hold the character (`../plugin-data-contract.ts`). TREK never drops or changes
 * it, since `'a\0b'` and `'ab'` are different keys, so a plugin answers the
 * same on either engine and its data can move to Postgres. Rows an older TREK
 * stored with a NUL are still read as they are.
 */

/** The handle `openDatabase` gives. */
type Db = ReturnType<typeof openDatabase>;
/** A statement of a script, prepared and ready to run without args. */
interface ScriptStatement {
  run(): unknown;
}

// RECURSIVE is the one construct that generates unbounded rows and CPU whatever
// the (capped) data size: a `WITH RECURSIVE ...` can spin the synchronous host
// forever even on an empty database, which neither the size quota nor the row
// cap can stop (an aggregate over it never yields a first row). It is refused
// outright; the row and size caps bound everything else.
// load_extension is refused as a second line: better-sqlite3 disables
// extension loading by default, but refusing it here means a later connection
// option cannot turn it into loading an arbitrary shared library.
const FORBIDDEN = /\b(ATTACH|DETACH|VACUUM|PRAGMA|RECURSIVE|LOAD_EXTENSION)\b/i;
// What better-sqlite3 throws from prepare() for a statement cut off before its end:
// in an exec() script, a trigger body whose semicolon split it.
const INCOMPLETE_INPUT = 'incomplete input';

/**
 * The limits one store enforces. Overridable for tests; production uses
 * `PLUGIN_DATA_CAPS`.
 *
 * The time budget: better-sqlite3 has no interrupt or progress handler, so it
 * is checked between the rows a statement yields and between the statements
 * of a batch or a script. A scan that keeps producing rows, a select whose
 * every row is expensive, or a script of many statements stops at the first
 * row or statement past the budget instead of holding the host loop. One
 * statement on its own still runs to its end (a write such as
 * `INSERT ... SELECT` over a cartesian product) or to its first row (an
 * aggregate over one); only moving plugin SQL off the host thread can bound
 * that, and the plugin-sdk README says so. `migrate` is left unbudgeted on
 * purpose: a migration stopped part of the way would fail the same way on
 * every later start, leaving a plugin that cannot update its schema at all.
 */
interface SqlitePluginDataLimits {
  maxRows: number;
  timeBudgetMs: number;
  /**
   * The most the file may take on disk. better-sqlite3 runs in the host
   * process, so an unbounded plugin file would fill the data volume TREK's
   * own database lives on, and a scan over it would stall the event loop.
   * `max_page_count` caps the file: a write past it fails with SQLITE_FULL,
   * contained to the plugin.
   */
  quotaBytes: number;
  /** The clock the time budget reads. */
  now: () => number;
}

const DEFAULT_LIMITS: SqlitePluginDataLimits = {
  maxRows: PLUGIN_DATA_CAPS.maxRows,
  timeBudgetMs: PLUGIN_DATA_CAPS.timeBudgetMs,
  quotaBytes: PLUGIN_DATA_CAPS.quotaBytes,
  now: () => Date.now(),
};

/**
 * Every open store, so a backup can fold each one's WAL back into its file or
 * snapshot it before archiving: the host keeps the handles open, so a plain
 * copy of the files would miss the commits still in the `-wal` sidecar.
 */
const openStores = new Set<SqlitePluginDataStore>();

/** The stores open now, for the backup (`nest/plugins/host/plugin-data.service.ts`). */
export function openSqlitePluginDataStores(): SqlitePluginDataStore[] {
  return [...openStores];
}

export class SqlitePluginDataStore implements PluginDataStore {
  readonly engine = 'sqlite' as const;
  private readonly db: Db;
  private readonly limits: SqlitePluginDataLimits;

  /** Opens (and creates) the plugin `pluginId`'s database at `file`. */
  constructor(
    readonly pluginId: string,
    file: string,
    limits: Partial<SqlitePluginDataLimits> = {},
  ) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = openDatabase(file);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    openStores.add(this);
    // The size cap is per connection and not persisted, so it is set on every open.
    const pageSize = Number(this.db.pragma('page_size', { simple: true })) || 4096;
    this.db.pragma(`max_page_count = ${Math.max(1, Math.floor(this.limits.quotaBytes / pageSize))}`);
    // Records the applied migrations, so migrate() runs once per (plugin, id).
    this.db.exec(`CREATE TABLE IF NOT EXISTS _plugin_migrations (id TEXT PRIMARY KEY, applied_at INTEGER)`);
  }

  private guard(sql: unknown): void {
    if (typeof sql !== 'string') throw new Error(PLUGIN_DATA_ERRORS.sqlNotString);
    if (sql.length > PLUGIN_DATA_CAPS.maxSqlLength) throw new Error(PLUGIN_DATA_ERRORS.sqlTooLong);
    refuseNulSql(sql);
    if (FORBIDDEN.test(sql)) throw new Error(PLUGIN_DATA_ERRORS.statementNotAllowed);
    refuseTransactionControl(sql);
  }

  /**
   * Refuses a call once {@link close} ran, with better-sqlite3's words for a
   * closed handle. A statement on a closed handle is refused by the driver
   * itself; this covers the calls that would run none (an empty or
   * comment-only script, an empty tx), so a closed store refuses every call,
   * as on Postgres.
   */
  private refuseIfClosed(): void {
    if (!this.db.open) throw new Error(PLUGIN_DATA_ERRORS.closed);
  }

  /** A deadline for one call: throws once the call has run past the time budget. */
  private startBudget(call: PluginDataBudgetedCall): () => void {
    const { now, timeBudgetMs } = this.limits;
    const startedAt = now();
    return () => {
      if (now() - startedAt > timeBudgetMs) throw new Error(PLUGIN_DATA_ERRORS.overBudget(call, timeBudgetMs));
    };
  }

  /** One read statement: its rows up to the row cap, within the time budget. */
  query(sql: string, args: unknown[] = []): unknown[] {
    this.guard(sql);
    refuseNulValues(args);
    const { maxRows } = this.limits;
    const checkTime = this.startBudget('query');
    // iterate() pulls one row at a time, so a result that would grow without
    // bound is stopped at the cap instead of materialized by all(), and the
    // clock is read between rows. It is read only once another row has come
    // back, so a result read to its end is returned, however long that took.
    const rows: unknown[] = [];
    for (const row of this.db.prepare(sql).iterate(...(args as never[]))) {
      if (rows.length > 0) checkTime();
      rows.push(row);
      if (rows.length > maxRows) throw new Error(PLUGIN_DATA_ERRORS.queryTooManyRows(maxRows));
    }
    return rows;
  }

  /**
   * With bound args, one statement. Without, a script of any number (a small
   * setup script, say), run one statement at a time within the time budget,
   * checked before each statement after the first.
   */
  exec(sql: string, args: unknown[] = []): { changes: number } {
    this.guard(sql);
    refuseNulValues(args);
    if (args.length > 0) {
      const info = this.db.prepare(sql).run(...(args as never[]));
      return { changes: info.changes };
    }
    this.refuseIfClosed();
    this.runScript(sql, this.startBudget('exec'));
    return { changes: 0 };
  }

  /**
   * Runs a script the way `Database#exec` does (statement after statement, each
   * in autocommit, since the guard refuses a script that would open a
   * transaction), with `checkTime` read before every statement but the first.
   * The clock is never read after the last one, so a script whose statements
   * have all run (and committed) is reported as done. A trigger body is
   * gathered until SQLite stops calling it incomplete.
   */
  private runScript(sql: string, checkTime: () => void): void {
    let pending = '';
    let ranOne = false;
    for (const piece of splitAfterSemicolons(sql)) {
      pending += piece;
      const stmt = this.prepareComplete(pending);
      if (stmt === 'incomplete') continue;
      pending = '';
      if (stmt === 'empty') continue;
      if (ranOne) checkTime();
      stmt.run();
      ranOne = true;
    }
    // A statement still open at the end of the script: prepared once more for
    // SQLite's own error, as Database#exec reports it.
    if (pending !== '') this.db.prepare(pending);
  }

  /** `sql` prepared, or why it cannot be yet: cut off before its end, or no statement at all. */
  private prepareComplete(sql: string): ScriptStatement | 'incomplete' | 'empty' {
    try {
      return this.db.prepare(sql);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message === INCOMPLETE_INPUT) return 'incomplete';
      if (message === PLUGIN_DATA_ERRORS.noStatement) return 'empty';
      throw e;
    }
  }

  /**
   * Statements that commit or roll back together, the primitive a plugin
   * needs for a consistent multi-write (moving an item between two tables).
   * Each op is one statement; a read (SELECT, RETURNING) yields `{ rows }`, a
   * write `{ changes }`, and a read sees the batch's own earlier writes.
   */
  tx(ops: Array<{ sql: string; args?: unknown[] }>): { results: Array<{ changes?: number; rows?: unknown[] }> } {
    if (!Array.isArray(ops)) throw new Error(PLUGIN_DATA_ERRORS.txNotArray);
    if (ops.length === 0) {
      this.refuseIfClosed();
      return { results: [] };
    }
    if (ops.length > PLUGIN_DATA_CAPS.maxTxOps)
      throw new Error(PLUGIN_DATA_ERRORS.txTooManyOps(PLUGIN_DATA_CAPS.maxTxOps));
    for (const op of ops) {
      this.guard(op?.sql);
      refuseNulValues(op.args ?? []);
    }
    const { maxRows } = this.limits;
    let batchRows = 0; // one row cap for the whole batch, not per statement
    // One time budget for the whole batch too. A throw inside the transaction
    // rolls every statement of the batch back, so running out of time is all or nothing.
    const checkTime = this.startBudget('tx');
    const run = this.db.transaction((batch: Array<{ sql: string; args?: unknown[] }>) => {
      const results: Array<{ changes?: number; rows?: unknown[] }> = [];
      for (const op of batch) {
        const stmt = this.db.prepare(op.sql);
        const args = (op.args ?? []) as never[];
        if (stmt.reader) {
          const rows: unknown[] = [];
          for (const row of stmt.iterate(...args)) {
            rows.push(row);
            if (++batchRows > maxRows) throw new Error(PLUGIN_DATA_ERRORS.txTooManyRows(maxRows));
            checkTime();
          }
          results.push({ rows });
        } else {
          results.push({ changes: stmt.run(...args).changes });
        }
        checkTime();
      }
      return results;
    });
    return { results: run(ops) };
  }

  /** Runs a migration once, keyed by id. Running it again with the same id is a no-op. */
  migrate(id: string, sql: string): { applied: boolean } {
    this.guard(sql);
    refuseNulValues([id]);
    const seen = this.db.prepare('SELECT 1 FROM _plugin_migrations WHERE id = ?').get(id);
    if (seen) return { applied: false };
    this.db.transaction(() => {
      this.db.exec(sql);
      this.db.prepare('INSERT INTO _plugin_migrations (id, applied_at) VALUES (?, ?)').run(id, Date.now());
    })();
    return { applied: true };
  }

  /**
   * Whether the handle is still open. The host reads it to notice a handle a
   * terminal-failure dispose closed while it stayed cached, and opens a new
   * store instead of throwing on reuse.
   */
  isOpen(): boolean {
    return this.db.open;
  }

  /**
   * Folds the WAL back into the database file (checkpoint TRUNCATE), so a copy
   * of the file is a complete snapshot. No-op on a closed handle.
   */
  checkpoint(): void {
    if (this.db.open) this.db.pragma('wal_checkpoint(TRUNCATE)');
  }

  /**
   * Writes a consistent copy of the database to `destPath` with VACUUM INTO.
   * Unlike a file copy it folds in the WAL and reads one point in time, so the
   * copy is right even while the plugin writes: no torn page, no separate
   * `-wal` to keep in step. It runs the host's own SQL on the host's own
   * handle, not plugin SQL, so the plugin guard does not apply.
   */
  snapshotInto(destPath: string): void {
    fs.rmSync(destPath, { force: true }); // VACUUM INTO fails if the target exists
    this.db.exec(`VACUUM INTO '${destPath.replaceAll("'", "''")}'`);
  }

  close(): void {
    try {
      openStores.delete(this);
      this.db.close();
    } catch {
      /* already closed */
    }
  }
}
