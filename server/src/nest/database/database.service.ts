import { Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { db } from '../../db/database';

/**
 * Injectable wrapper around TREK's existing better-sqlite3 connection.
 *
 * `db` is a Proxy onto the singleton connection the legacy app already uses
 * (WAL enabled), so Nest modules share the exact same connection — no second
 * connection, no split state, single writer preserved.
 */
@Injectable()
export class DatabaseService {
  /** The shared better-sqlite3 connection (same singleton the legacy app uses). */
  get connection(): Database.Database {
    return db;
  }

  prepare(sql: string): Database.Statement {
    return db.prepare(sql);
  }

  get<T = unknown>(sql: string, ...params: unknown[]): T | undefined {
    return db.prepare(sql).get(...params) as T | undefined;
  }

  all<T = unknown>(sql: string, ...params: unknown[]): T[] {
    return db.prepare(sql).all(...params) as T[];
  }

  run(sql: string, ...params: unknown[]): Database.RunResult {
    return db.prepare(sql).run(...params);
  }

  /** Run `fn` inside a synchronous better-sqlite3 transaction. */
  transaction<T>(fn: (conn: Database.Database) => T): T {
    return db.transaction(() => fn(db))();
  }
}
