/**
 * The database side of the encryption key rotation (`migrate-encryption.ts`):
 * the statements it runs, on the SQLite file through better-sqlite3 or on a
 * Postgres database through the server's MikroORM connection, and where the
 * Postgres path finds the server's code. Kept beside the command so that one
 * stays within the size limit; the image copies both.
 */
import type { EntityManager } from '@mikro-orm/core';

import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/** The parts of the server the Postgres path uses, loaded at run time (`loadServer`). */
export interface ServerModules {
  engine: typeof import('../src/db/engine');
  appConfig: typeof import('../src/app-config');
  pgTools: typeof import('../src/db/engine/postgres/pg-tools');
}

/**
 * The statements the rotation needs, on either engine. Every statement is
 * written once, with `?` placeholders both engines take; only the catalog
 * lookups differ. The rotation runs inside one transaction the caller opens.
 */
export interface SecretStore {
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
  tableExists(name: string): Promise<boolean>;
  columnsOf(table: string): Promise<Set<string>>;
}

/** The SQLite file through better-sqlite3, whose calls are synchronous; the store only wraps them. */
export function sqliteStore(db: Database.Database): SecretStore {
  return {
    async all<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async get<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    async run(sql: string, params: unknown[] = []) {
      db.prepare(sql).run(...params);
    },
    async tableExists(name: string) {
      return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
    },
    async columnsOf(table: string) {
      const rows = db.prepare('SELECT name FROM pragma_table_info(?)').all(table) as { name: string }[];
      return new Set(rows.map((r) => r.name));
    },
  };
}

/**
 * A Postgres database through the server's MikroORM connection, inside the
 * transaction `em` holds when it is a transactional fork. The catalog lookups
 * read the current schema, the one TREK keeps its tables in.
 */
export function postgresStore(em: EntityManager): SecretStore {
  const connection = em.getConnection();
  const ctx = em.getTransactionContext();
  const all = async <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
    (await connection.execute(sql, params, 'all', ctx)) as T[];
  return {
    all,
    async get<T>(sql: string, params: unknown[] = []) {
      const [row] = await all<T>(sql, params);
      return row;
    },
    async run(sql: string, params: unknown[] = []) {
      await connection.execute(sql, params, 'run', ctx);
    },
    async tableExists(name: string) {
      const [row] = await all<{ present: boolean }>('SELECT to_regclass(?) IS NOT NULL AS present', [name]);
      return row?.present === true;
    },
    async columnsOf(table: string) {
      const rows = await all<{ name: string }>(
        'SELECT column_name AS name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?',
        [table],
      );
      return new Set(rows.map((r) => r.name));
    },
  };
}

/**
 * The server's engine, app-config and Postgres tools: from src/ under tsx in a
 * source checkout, so it runs without a build, else from the built dist/ the
 * image ships (it has no src/).
 */
export function loadServer(): ServerModules {
  const source = path.join(__dirname, '..', 'src');
  const root = fs.existsSync(path.join(source, 'db', 'engine', 'index.ts'))
    ? source
    : path.join(__dirname, '..', 'dist');
  return {
    engine: require(path.join(root, 'db', 'engine')) as ServerModules['engine'],
    appConfig: require(path.join(root, 'app-config')) as ServerModules['appConfig'],
    pgTools: require(path.join(root, 'db', 'engine', 'postgres', 'pg-tools')) as ServerModules['pgTools'],
  };
}
