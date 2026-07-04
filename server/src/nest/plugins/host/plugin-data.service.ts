import fs from 'node:fs';
import Database from 'better-sqlite3';
import type { Database as Db } from 'better-sqlite3';
import { pluginDataDir, pluginDbFile } from '../paths';

/**
 * A plugin's own sqlite database (#plugins, db:own). The HOST owns the handle;
 * the plugin child never gets a path or a connection — it can only reach this
 * through RPC (db.exec / db.query / db.migrate). Because it is a SEPARATE FILE,
 * containment is a filesystem fact: the plugin physically cannot read trek.db,
 * and we don't have to police table-name prefixes in its SQL.
 *
 * A thin guard still rejects statements that would let a plugin escape its file
 * (ATTACH another db, VACUUM INTO elsewhere, PRAGMA fiddling) or DoS via
 * oversize SQL.
 */

const MAX_SQL_LENGTH = 100_000;
// RECURSIVE is the one construct that generates unbounded rows/CPU independent of
// the (capped) data size — a `WITH RECURSIVE …` can spin the synchronous host
// forever even with an empty database, which neither the size quota nor the
// result-row cap can stop (an aggregate over it never yields a first row). Refuse
// it outright; the row/size caps below bound everything else.
const FORBIDDEN = /\b(ATTACH|DETACH|VACUUM|PRAGMA|RECURSIVE)\b/i;
// Per-plugin on-disk quota. better-sqlite3 is synchronous and runs in the HOST
// process, so an unbounded plugin DB is both a disk-exhaustion DoS on the shared
// trek.db volume and (via a huge scan) an event-loop stall. max_page_count caps
// the file (writes past it fail SQLITE_FULL, contained to the plugin) and bounds
// the worst-case scan cost. Result sets are additionally row-capped below so a
// recursive CTE / cartesian product can't materialize an unbounded array.
const QUOTA_BYTES = 256 * 1024 * 1024;
const MAX_ROWS = 100_000;

export class PluginDataDb {
  private db: Db;

  constructor(pluginId: string) {
    fs.mkdirSync(pluginDataDir(pluginId), { recursive: true });
    this.db = new Database(pluginDbFile(pluginId));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    // Cap the file size (per-connection; not persisted, so set on every open).
    const pageSize = Number(this.db.pragma('page_size', { simple: true })) || 4096;
    this.db.pragma(`max_page_count = ${Math.max(1, Math.floor(QUOTA_BYTES / pageSize))}`);
    // Track applied migrations so db.migrate is idempotent per (plugin, id).
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS _plugin_migrations (id TEXT PRIMARY KEY, applied_at INTEGER)`,
    );
  }

  private guard(sql: string): void {
    if (typeof sql !== 'string') throw new Error('sql must be a string');
    if (sql.length > MAX_SQL_LENGTH) throw new Error('sql too long');
    if (FORBIDDEN.test(sql)) throw new Error('statement type not allowed for plugin databases');
  }

  /** Read query — returns rows up to MAX_ROWS. Single statement only. */
  query(sql: string, args: unknown[] = []): unknown[] {
    this.guard(sql);
    // iterate() pulls one row at a time, so a recursive CTE that would yield
    // unboundedly is halted at the cap instead of materializing via all().
    const rows: unknown[] = [];
    for (const row of this.db.prepare(sql).iterate(...(args as never[]))) {
      rows.push(row);
      if (rows.length > MAX_ROWS) throw new Error(`query returned more than ${MAX_ROWS} rows`);
    }
    return rows;
  }

  /** Write statement(s). exec() allows multiple statements (e.g. a small setup script). */
  exec(sql: string, args: unknown[] = []): { changes: number } {
    this.guard(sql);
    if (args.length > 0) {
      const info = this.db.prepare(sql).run(...(args as never[]));
      return { changes: info.changes };
    }
    this.db.exec(sql);
    return { changes: 0 };
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

  close(): void {
    try {
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
