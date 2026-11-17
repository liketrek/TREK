import type { EngineId } from '../../app-config/db-settings';

/**
 * A plugin's own database (`db:own`), as the host's RPC handlers reach it.
 * One implementation per engine: on SQLite a file of the plugin's own
 * (`nest/plugins/host/plugin-data.service.ts`), on Postgres a schema of the
 * plugin's own (`postgres/plugin-data-store.ts`). The plugin's SQL is its
 * own, written for the engine `engine` names; neither implementation
 * translates it.
 *
 * The SQLite handle answers synchronously, the Postgres one with a promise,
 * so every method may return either. The caller awaits the result.
 */
export interface PluginDataStore {
  readonly pluginId: string;
  /** The engine the plugin's SQL runs on, which decides the SQL dialect it has to be written in. */
  readonly engine: EngineId;
  /** One read statement: its rows, up to the row cap and within the time budget. */
  query(sql: string, args?: unknown[]): MaybePromise<unknown[]>;
  /** One statement with bound args, or a script of statements without. */
  exec(sql: string, args?: unknown[]): MaybePromise<{ changes: number }>;
  /** Statements that commit or roll back together. */
  tx(ops: PluginTxOp[]): MaybePromise<PluginTxResult>;
  /** Runs `sql` once per `id`; a second call with the same id is a no-op. */
  migrate(id: string, sql: string): MaybePromise<{ applied: boolean }>;
  /** False once `close` ran: the host then opens a new store instead of reusing this one. */
  isOpen(): boolean;
  close(): void;
}

type MaybePromise<T> = T | Promise<T>;

/** One statement of a `tx` batch. */
export interface PluginTxOp {
  sql: string;
  args?: unknown[];
}

/** A `tx` batch's results, one per op: the rows of a statement that returns rows, the change count of any other. */
export interface PluginTxResult {
  results: Array<{ changes?: number; rows?: unknown[] }>;
}

/**
 * The limits every plugin database is held to, whatever the engine. The
 * plugin-sdk README's "Runtime limits" table documents them.
 */
export const PLUGIN_DATA_CAPS = {
  /** The longest SQL text one call may carry. */
  maxSqlLength: 100_000,
  /** The most rows a query, or a whole tx batch, returns. */
  maxRows: 100_000,
  /** The most statements one tx batch holds. */
  maxTxOps: 100,
  /** Wall-clock time for one query, one tx batch or one exec script. */
  timeBudgetMs: 2_000,
  /** The most a plugin's data may take on disk. */
  quotaBytes: 256 * 1024 * 1024,
} as const;
