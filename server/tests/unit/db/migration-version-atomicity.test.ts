/**
 * The schema_version bump must commit with the migration that earned it.
 *
 * If it lands in a statement of its own, a crash between the two leaves the
 * schema advanced and the version stale, and the next boot replays a step that
 * is not idempotent (an INSERT INTO app_settings, say) and exits 1 forever.
 */
import { describe, it, expect, vi } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';

function migratedDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  runMigrations(db);
  return db;
}

describe('migration version bump atomicity', () => {
  it('MIGRATE-ATOMIC-001: writes schema_version inside the migration transaction', () => {
    const db = migratedDb();
    try {
      const { version } = db.prepare('SELECT version FROM schema_version LIMIT 1').get() as { version: number };
      // Rewind one slot so exactly the last migration replays.
      db.prepare('UPDATE schema_version SET version = ?').run(version - 1);

      const realPrepare = db.prepare.bind(db);
      const inTransaction: boolean[] = [];
      vi.spyOn(db, 'prepare').mockImplementation(((sql: string) => {
        const stmt = realPrepare(sql);
        if (sql.includes('UPDATE schema_version SET version')) {
          const realRun = stmt.run.bind(stmt);
          stmt.run = ((...args: unknown[]) => {
            inTransaction.push(db.inTransaction);
            return realRun(...(args as never[]));
          }) as typeof stmt.run;
        }
        return stmt;
      }) as typeof db.prepare);

      runMigrations(db);

      expect(inTransaction).toEqual([true]);
      const after = db.prepare('SELECT version FROM schema_version LIMIT 1').get() as { version: number };
      expect(after.version).toBe(version);
    } finally {
      vi.restoreAllMocks();
      db.close();
    }
  });
});
