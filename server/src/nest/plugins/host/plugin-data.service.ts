import { openDatabase } from '../../../db/connection';
import { pluginDataDir, pluginDbFile, pluginsDataRoot } from '../paths';
import { splitAfterSemicolons } from './sql-script';

import type { Database as Db, Statement } from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A plugin's own sqlite database (#plugins, db:own). The HOST owns the handle;
 * the plugin child never gets a path or a connection — it can only reach this
 * through RPC (db.exec / db.query / db.migrate). Because it is a SEPARATE FILE,
 * containment is a filesystem fact: the plugin physically cannot read trek.db,
 * and we don't have to police table-name prefixes in its SQL.
 *
 * A thin guard still rejects statements that would let a plugin escape its file
 * (ATTACH another db, VACUUM INTO elsewhere, PRAGMA fiddling) or DoS via
 * oversize SQL, every read is held to a row cap, and query(), tx() and an exec()
 * script are held to a time budget (below).
 */

const MAX_SQL_LENGTH = 100_000;
// RECURSIVE is the one construct that generates unbounded rows/CPU independent of
// the (capped) data size — a `WITH RECURSIVE …` can spin the synchronous host
// forever even with an empty database, which neither the size quota nor the
// result-row cap can stop (an aggregate over it never yields a first row). Refuse
// it outright; the row/size caps below bound everything else.
// load_extension is included as defense-in-depth: better-sqlite3 disables
// extension loading by default (so it's inert today), but banning it in the guard
// means a future connection-option slip can't turn it into an arbitrary-.so RCE.
const FORBIDDEN = /\b(ATTACH|DETACH|VACUUM|PRAGMA|RECURSIVE|LOAD_EXTENSION)\b/i;
// Transaction-control keywords, matched only at statement start (so CASE…END and
// identifiers are unaffected). Refused inside db.tx() so a plugin can't COMMIT the
// batch's earlier writes and then have the wrapper report failure — breaking atomicity.
const TX_CONTROL = /^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|END)\b/i;
// Per-plugin on-disk quota. better-sqlite3 is synchronous and runs in the HOST
// process, so an unbounded plugin DB is both a disk-exhaustion DoS on the shared
// trek.db volume and (via a huge scan) an event-loop stall. max_page_count caps
// the file (writes past it fail SQLITE_FULL, contained to the plugin) and bounds
// the worst-case scan cost. Result sets are additionally row-capped below so a
// recursive CTE / cartesian product can't materialize an unbounded array.
const QUOTA_BYTES = 256 * 1024 * 1024;
const MAX_ROWS = 100_000;
// Cap statements per atomic batch so a single tx() can't monopolise the synchronous
// host — generous for real write batches, far below anything abusive.
const MAX_TX_OPS = 100;
// Wall-clock budget for one query(), one whole tx() batch or one exec() script.
// better-sqlite3 has no interrupt or progress handler, so the budget is checked
// between the rows a statement yields and between the statements of a batch or a
// script: a scan that keeps producing rows, a select whose every row is expensive, or
// a script of many statements stops at the first row or statement past the budget
// instead of holding the host loop. One statement on its own still runs to the end
// (a write such as `INSERT … SELECT` over a cartesian product) or to its first row
// (an aggregate over one); only moving plugin SQL off the host thread can bound that,
// and the plugin-sdk README says so. migrate() is left unbudgeted on purpose: a
// migration is stopped part of the way only to fail the same way on every later
// start, which leaves a plugin that cannot update its schema at all.
const TIME_BUDGET_MS = 2_000;
// What better-sqlite3 throws from prepare() for a statement cut off before its end:
// in an exec() script, a trigger body whose semicolon split it.
const INCOMPLETE_INPUT = 'incomplete input';
// And for a piece that holds no statement at all, only whitespace or comments.
const NO_STATEMENT = 'The supplied SQL string contains no statements';

/** The caps a PluginDataDb enforces. Overridable for tests; production uses the defaults. */
export interface PluginDataLimits {
  maxRows: number;
  timeBudgetMs: number;
  /** The clock the time budget reads. */
  now: () => number;
}

const DEFAULT_LIMITS: PluginDataLimits = { maxRows: MAX_ROWS, timeBudgetMs: TIME_BUDGET_MS, now: () => Date.now() };

// Every live per-plugin handle, so a backup can WAL-checkpoint them before archiving
// (the host keeps these open, so their .db files would otherwise be copied with recent
// commits still stranded in the -wal sidecar → a stale/torn snapshot in the backup).
const openDbs = new Set<PluginDataDb>();

/** Fold the WAL back into each open plugin.db so a subsequent file copy is a complete,
 * consistent snapshot — mirrors the wal_checkpoint the core backup runs on travel.db.
 * Best-effort per handle; never throws. */
export function checkpointAllPluginDataDbs(): void {
  for (const d of openDbs) {
    try {
      d.checkpoint();
    } catch {
      /* a busy/closed handle is skipped, not fatal */
    }
  }
}

export class PluginDataDb {
  private db: Db;
  readonly pluginId: string;
  private readonly limits: PluginDataLimits;

  constructor(pluginId: string, limits: Partial<PluginDataLimits> = {}) {
    this.pluginId = pluginId;
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    fs.mkdirSync(pluginDataDir(pluginId), { recursive: true });
    this.db = openDatabase(pluginDbFile(pluginId));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    openDbs.add(this);
    // Cap the file size (per-connection; not persisted, so set on every open).
    const pageSize = Number(this.db.pragma('page_size', { simple: true })) || 4096;
    this.db.pragma(`max_page_count = ${Math.max(1, Math.floor(QUOTA_BYTES / pageSize))}`);
    // Track applied migrations so db.migrate is idempotent per (plugin, id).
    this.db.exec(`CREATE TABLE IF NOT EXISTS _plugin_migrations (id TEXT PRIMARY KEY, applied_at INTEGER)`);
  }

  private guard(sql: string): void {
    if (typeof sql !== 'string') throw new Error('sql must be a string');
    if (sql.length > MAX_SQL_LENGTH) throw new Error('sql too long');
    if (FORBIDDEN.test(sql)) throw new Error('statement type not allowed for plugin databases');
  }

  /** A deadline for one call: throws once the call has run past the time budget. */
  private startBudget(what: string): () => void {
    const { now, timeBudgetMs } = this.limits;
    const startedAt = now();
    return () => {
      if (now() - startedAt > timeBudgetMs) throw new Error(`${what} exceeded its ${timeBudgetMs} ms time budget`);
    };
  }

  /** Read query: returns rows up to the row cap, within the time budget. Single statement only. */
  query(sql: string, args: unknown[] = []): unknown[] {
    this.guard(sql);
    const { maxRows } = this.limits;
    const checkTime = this.startBudget('query');
    // iterate() pulls one row at a time, so a recursive CTE that would yield
    // unboundedly is halted at the cap instead of materializing via all(), and the
    // clock is read between rows. It is read only once another row has come back, so
    // a result that has been read to its end is returned, however long that took.
    const rows: unknown[] = [];
    for (const row of this.db.prepare(sql).iterate(...(args as never[]))) {
      if (rows.length > 0) checkTime();
      rows.push(row);
      if (rows.length > maxRows) throw new Error(`query returned more than ${maxRows} rows`);
    }
    return rows;
  }

  /**
   * Write statement(s). With bound args, exec() runs one statement. Without, it runs a
   * script of any number (e.g. a small setup script), one statement at a time and
   * within the time budget, checked before each statement after the first.
   */
  exec(sql: string, args: unknown[] = []): { changes: number } {
    this.guard(sql);
    if (args.length > 0) {
      const info = this.db.prepare(sql).run(...(args as never[]));
      return { changes: info.changes };
    }
    this.runScript(sql, this.startBudget('exec'));
    return { changes: 0 };
  }

  /**
   * Runs a script the way `Database#exec` did (statement after statement, each in
   * autocommit unless the script opens a transaction), with `checkTime` read before
   * every statement but the first. The clock is never read after the last one, so a
   * script whose statements have all run (and committed) is reported as done. A
   * trigger body is gathered until SQLite stops calling it incomplete. A script that
   * runs out of time inside a transaction it opened itself has that transaction rolled
   * back, so the connection is not left holding it.
   */
  private runScript(sql: string, checkTime: () => void): void {
    const openedNoTransaction = !this.db.inTransaction;
    let pending = '';
    let ranOne = false;
    for (const piece of splitAfterSemicolons(sql)) {
      pending += piece;
      const stmt = this.prepareComplete(pending);
      if (stmt === 'incomplete') continue;
      pending = '';
      if (stmt === 'empty') continue;
      if (ranOne) {
        try {
          checkTime();
        } catch (e) {
          if (openedNoTransaction && this.db.inTransaction) this.db.prepare('ROLLBACK').run();
          throw e;
        }
      }
      stmt.run();
      ranOne = true;
    }
    // A statement still open at the end of the script: prepare it once more for
    // SQLite's own error, as Database#exec reports it.
    if (pending !== '') this.db.prepare(pending);
  }

  /** `sql` prepared, or why it cannot be yet: cut off before its end, or no statement at all. */
  private prepareComplete(sql: string): Statement | 'incomplete' | 'empty' {
    try {
      return this.db.prepare(sql);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message === INCOMPLETE_INPUT) return 'incomplete';
      if (message === NO_STATEMENT) return 'empty';
      throw e;
    }
  }

  /**
   * Atomic batch on the plugin's OWN db: every op runs in a single transaction, so
   * they all commit or all roll back — the primitive a plugin needs for a consistent
   * multi-write (e.g. move an item between two tables). Each op is ONE statement;
   * a read (SELECT/RETURNING) yields `{ rows }`, a write yields `{ changes }`, and
   * reads within the batch see the batch's own earlier writes (read-modify-write).
   */
  tx(ops: Array<{ sql: string; args?: unknown[] }>): { results: Array<{ changes?: number; rows?: unknown[] }> } {
    if (!Array.isArray(ops)) throw new Error('tx requires an array of { sql, args }');
    if (ops.length === 0) return { results: [] };
    if (ops.length > MAX_TX_OPS) throw new Error(`tx allows at most ${MAX_TX_OPS} statements`);
    for (const op of ops) {
      this.guard(op?.sql);
      // Reject transaction-control statements: a raw COMMIT/ROLLBACK inside the batch
      // would break atomicity — it commits the earlier writes even though the wrapper
      // then reports the tx as failed. Strip any LEADING comments/whitespace first so a
      // `/* */COMMIT` or `-- x\nCOMMIT` can't slip past the start-anchored check; these
      // keywords are only valid at statement start, so CASE ... END is unaffected.
      const head = String(op?.sql ?? '').replace(/^(?:\s|--[^\n]*\n?|\/\*[\s\S]*?\*\/)*/, '');
      if (TX_CONTROL.test(head)) throw new Error('transaction-control statements are not allowed inside tx()');
    }
    const { maxRows } = this.limits;
    let batchRows = 0; // one row budget for the WHOLE batch, not per statement
    // One time budget for the whole batch too. A throw inside the transaction rolls
    // every statement of the batch back, so running out of time is all-or-nothing.
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
            if (++batchRows > maxRows) throw new Error(`tx returned more than ${maxRows} rows in total`);
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

  /** Run a migration once, keyed by id. Re-running with the same id is a no-op. */
  migrate(id: string, sql: string): { applied: boolean } {
    this.guard(sql);
    const seen = this.db.prepare('SELECT 1 FROM _plugin_migrations WHERE id = ?').get(id);
    if (seen) return { applied: false };
    this.db.transaction(() => {
      this.db.exec(sql);
      this.db.prepare('INSERT INTO _plugin_migrations (id, applied_at) VALUES (?, ?)').run(id, Date.now());
    })();
    return { applied: true };
  }

  /** Whether the underlying sqlite handle is still open (better-sqlite3 `.open`).
   * The host uses this to detect a handle closed by a terminal-failure dispose that
   * left the instance cached, so it can recreate it instead of throwing on reuse. */
  isOpen(): boolean {
    return this.db.open;
  }

  /** Fold the WAL back into the main db file (checkpoint TRUNCATE) so a file-level copy
   * is a complete snapshot. No-op on a closed handle. */
  checkpoint(): void {
    if (this.db.open) this.db.pragma('wal_checkpoint(TRUNCATE)');
  }

  /** Write a fully-consistent copy of this DB to `destPath` via VACUUM INTO. Unlike a
   * file copy it folds in the WAL and reads a point-in-time snapshot, so the result is
   * correct even while the plugin is writing — no torn page, no separate -wal to keep in
   * sync. This is a host op on the host's own handle, not plugin SQL, so it bypasses the
   * FORBIDDEN guard by design. */
  snapshotInto(destPath: string): void {
    fs.rmSync(destPath, { force: true }); // VACUUM INTO fails if the target already exists
    this.db.exec(`VACUUM INTO '${destPath.replaceAll("'", "''")}'`);
  }

  close(): void {
    try {
      openDbs.delete(this);
      this.db.close();
    } catch {
      /* already closed */
    }
  }
}

/** Delete a plugin's data directory (uninstall "delete data"). */
export function removePluginData(pluginId: string): void {
  fs.rmSync(pluginDataDir(pluginId), { recursive: true, force: true });
}

/**
 * Copy every plugin's data dir into `destRoot` as a CONSISTENT snapshot, for a backup to
 * archive instead of the live tree. An open plugin.db is captured with VACUUM INTO (safe
 * under concurrent writes); a plugin with no live handle is copied as-is (no writer). The
 * -wal/-shm sidecars are never copied — the snapshot folds them in, and copying them out
 * of step with the .db is exactly what produced torn/corrupt restores when the archiver
 * read the live files lazily while a plugin kept writing. Blobs and any other files a
 * plugin wrote to its dir are copied verbatim. Best-effort per file; never throws.
 */
export function snapshotAllPluginDataDbs(destRoot: string): void {
  const root = pluginsDataRoot();
  if (!fs.existsSync(root)) return;
  const openById = new Map<string, PluginDataDb>();
  for (const d of openDbs) if (d.isOpen()) openById.set(d.pluginId, d);
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const srcDir = path.join(root, entry.name);
    const destDir = path.join(destRoot, entry.name);
    fs.mkdirSync(destDir, { recursive: true });
    const open = openById.get(entry.name);
    // Handle the live db up front so we know whether its WAL got folded in. If both
    // the VACUUM INTO snapshot and the checkpoint fail, the -wal/-shm are NOT folded,
    // so they must be copied alongside the .db — a .db stripped of an un-checkpointed
    // WAL loses committed transactions, whereas the .db + its WAL is a recoverable set.
    let foldedIn = false;
    if (open) {
      try {
        open.snapshotInto(path.join(destDir, 'plugin.db'));
        foldedIn = true;
      } catch {
        try {
          open.checkpoint();
          foldedIn = true;
        } catch {
          /* WAL not folded — keep sidecars */
        }
        try {
          fs.copyFileSync(path.join(srcDir, 'plugin.db'), path.join(destDir, 'plugin.db'));
        } catch {
          /* unreadable live db — best effort */
        }
      }
    }
    for (const f of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (f.name === 'plugin.db' && open) continue; // already snapshotted above
      // Skip the .db sidecars only when the live handle's WAL was folded in — VACUUM
      // INTO / checkpoint absorbs them, and copying them out of step with a live writer
      // is what produced torn restores. For a plugin with NO open handle there is no
      // writer, so the -wal/-shm are a consistent set with the .db; copy them too, or an
      // unclean shutdown's committed-but-uncheckpointed transactions (still sitting in
      // the WAL) would be lost from the backup.
      if ((f.name.endsWith('-wal') || f.name.endsWith('-shm')) && foldedIn) continue;
      const src = path.join(srcDir, f.name);
      const dest = path.join(destDir, f.name);
      try {
        if (f.isDirectory()) fs.cpSync(src, dest, { recursive: true });
        else fs.copyFileSync(src, dest);
      } catch {
        /* skip an unreadable entry rather than fail the whole backup */
      }
    }
  }
}
