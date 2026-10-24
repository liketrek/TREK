/**
 * The statement recorder under the Postgres probe.
 *
 * The probe runs every repository method against an empty Postgres schema and
 * wants two things from each SQL statement the method sends: whether
 * Postgres accepts it, and that nothing it does survives. This module wraps a
 * Kysely dialect so both hold for every statement, whichever API built it
 * (the MikroORM QueryBuilder, `em.insert`, `this.kysely()`), because they all
 * end in the same Kysely driver:
 *
 *   - every statement runs alone inside `begin; set local statement_timeout;
 *     <statement>; rollback`, so it always meets empty tables and can never
 *     hang the run;
 *   - a statement Postgres refuses is recorded with its SQLSTATE and answered
 *     with an empty result, the way an empty table would answer, so the method
 *     goes on and its later statements are probed too;
 *   - the transaction calls MikroORM and Kysely make (begin, commit,
 *     savepoints) become no-ops, since each statement already rolls back.
 *
 * Statements are attributed to the method that sent them through
 * AsyncLocalStorage, so a straggler from a timed-out method can never be
 * counted against the next one.
 */
import {
  CompiledQuery,
  type DatabaseConnection,
  type DatabaseIntrospector,
  type DialectAdapter,
  type Driver,
  type Kysely,
  PostgresDialect,
  type QueryCompiler,
  type QueryResult,
} from 'kysely';
import { AsyncLocalStorage } from 'node:async_hooks';

export type StatementOutcome = { ok: true } | { ok: false; code: string; message: string };

export interface StatementRecord {
  sql: string;
  outcome: StatementOutcome;
}

/** Transaction control a probed method sends; each statement already runs in its own rolled-back transaction. */
const TRANSACTION_CONTROL =
  /^\s*(begin|commit|rollback|end|abort|start\s+transaction|savepoint|release(\s+savepoint)?)\b/i;

export function isTransactionControl(sql: string): boolean {
  return TRANSACTION_CONTROL.test(sql);
}

/** The SQLSTATE of a driver error (`pg` puts it on `code`), or a marker when there is none. */
export function sqlState(error: unknown): string {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return 'NOSQLSTATE';
}

/** The first line of an error message, without the stack. */
export function errorLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0]!.trim();
}

export class StatementRecorder {
  private readonly scope = new AsyncLocalStorage<string>();
  private readonly records = new Map<string, StatementRecord[]>();

  /** Runs `fn` with every statement it sends attributed to `key`. */
  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (!this.records.has(key)) this.records.set(key, []);
    return this.scope.run(key, fn);
  }

  /** The method the current async context belongs to, or null outside one. */
  current(): string | null {
    return this.scope.getStore() ?? null;
  }

  record(key: string, record: StatementRecord): void {
    const list = this.records.get(key);
    if (list) list.push(record);
    else this.records.set(key, [record]);
  }

  statementsOf(key: string): readonly StatementRecord[] {
    return this.records.get(key) ?? [];
  }

  entries(): [string, readonly StatementRecord[]][] {
    return [...this.records.entries()];
  }
}

export class ProbeConnection implements DatabaseConnection {
  constructor(
    readonly inner: DatabaseConnection,
    private readonly recorder: StatementRecorder,
    private readonly statementTimeoutMs: number,
  ) {}

  async executeQuery<R>(compiled: CompiledQuery): Promise<QueryResult<R>> {
    const key = this.recorder.current();
    if (key === null) return this.inner.executeQuery<R>(compiled);
    if (isTransactionControl(compiled.sql)) return { rows: [] };

    await this.inner.executeQuery(CompiledQuery.raw('begin'));
    try {
      await this.inner.executeQuery(CompiledQuery.raw(`set local statement_timeout = ${this.statementTimeoutMs}`));
      const result = await this.inner.executeQuery<R>(compiled);
      this.recorder.record(key, { sql: compiled.sql, outcome: { ok: true } });
      return result;
    } catch (error) {
      this.recorder.record(key, {
        sql: compiled.sql,
        outcome: { ok: false, code: sqlState(error), message: errorLine(error) },
      });
      return { rows: [] };
    } finally {
      await this.inner.executeQuery(CompiledQuery.raw('rollback'));
    }
  }

  streamQuery<R>(compiled: CompiledQuery, chunkSize?: number): AsyncIterableIterator<QueryResult<R>> {
    return this.inner.streamQuery<R>(compiled, chunkSize);
  }
}

export class ProbeDriver implements Driver {
  private readonly wrapped = new WeakMap<DatabaseConnection, ProbeConnection>();

  constructor(
    private readonly inner: Driver,
    private readonly recorder: StatementRecorder,
    private readonly statementTimeoutMs: number,
  ) {}

  init(): Promise<void> {
    return this.inner.init();
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const connection = await this.inner.acquireConnection();
    let probe = this.wrapped.get(connection);
    if (!probe) {
      probe = new ProbeConnection(connection, this.recorder, this.statementTimeoutMs);
      this.wrapped.set(connection, probe);
    }
    return probe;
  }

  async beginTransaction(): Promise<void> {
    // Every statement runs in a transaction of its own (ProbeConnection).
  }

  async commitTransaction(): Promise<void> {
    // See beginTransaction.
  }

  async rollbackTransaction(): Promise<void> {
    // See beginTransaction.
  }

  async savepoint(): Promise<void> {
    // See beginTransaction.
  }

  async rollbackToSavepoint(): Promise<void> {
    // See beginTransaction.
  }

  async releaseSavepoint(): Promise<void> {
    // See beginTransaction.
  }

  releaseConnection(connection: DatabaseConnection): Promise<void> {
    return this.inner.releaseConnection(connection instanceof ProbeConnection ? connection.inner : connection);
  }

  destroy(): Promise<void> {
    return this.inner.destroy();
  }
}

/**
 * A Postgres dialect whose driver is `base`'s wrapped in a {@link ProbeDriver};
 * compiler, adapter and introspector stay `base`'s own. A subclass rather
 * than a plain `Dialect` object because MikroORM's `PostgreSqlConnection`
 * declares `createKyselyDialect()` to return a `PostgresDialect`. The config
 * handed to `super` is never read: every method that would read it is
 * overridden to delegate to `base`.
 */
export class ProbePostgresDialect extends PostgresDialect {
  constructor(
    private readonly base: PostgresDialect,
    private readonly recorder: StatementRecorder,
    private readonly statementTimeoutMs: number,
  ) {
    super({ pool: () => Promise.reject(new Error('ProbePostgresDialect: the base dialect owns the pool')) });
  }

  override createDriver(): Driver {
    return new ProbeDriver(this.base.createDriver(), this.recorder, this.statementTimeoutMs);
  }

  override createQueryCompiler(): QueryCompiler {
    return this.base.createQueryCompiler();
  }

  override createAdapter(): DialectAdapter {
    return this.base.createAdapter();
  }

  override createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
    return this.base.createIntrospector(db);
  }
}
