import { PLUGIN_DATA_CAPS, type PluginDataStore, type PluginTxOp, type PluginTxResult } from '../plugin-data';
import {
  PLUGIN_SCHEMA_MAX_OBJECTS,
  PrivilegedRoleGate,
  refuseForeignTargets,
  refuseNulValues,
  schemaUsage,
  type PluginRoleGate,
  type SchemaUsage,
} from './plugin-data-checks';
import { isPluginId, pluginSchemaName, quotePluginSchema } from './plugin-schema';
import { checkPlaceholders, checkQualifiers, parsePluginSql, type PluginStatement } from './plugin-sql-guard';

import { CompiledQuery, type Kysely } from 'kysely';
import Cursor from 'pg-cursor';

/**
 * A plugin's own data on Postgres (`db:own`): a schema of its own in TREK's
 * database (`plugin-schema.ts`), reached through TREK's pool.
 *
 * Every call checks a `pg` client out of the pool for itself
 * ({@link poolClients}) and runs one transaction on it directly, not through
 * Kysely. Before the transaction it refuses the call outright while TREK's
 * role is privileged (`PrivilegedRoleGate` in `plugin-data-checks.ts`, read
 * once per connection). The transaction first makes sure the schema and its
 * migration table exist, then puts only that schema on the `search_path`,
 * with `pg_temp` explicitly last so a temporary table is never found before
 * the plugin's own, and sets `statement_timeout` to the call's time budget;
 * every setting is `local` and ends with the transaction. The plugin's SQL is
 * checked by `plugin-sql-guard.ts` before it runs, so it cannot name another
 * schema; right before each statement, the existing objects it changes are
 * resolved by Postgres and must lie in the plugin's schema
 * (`refuseForeignTargets`); and each statement goes to Postgres on its own
 * over the extended query protocol, which runs one statement and no more: a
 * write as a query with `queryMode: 'extended'`, which `pg` honours even
 * without values, and a read through a `pg-cursor`, which always uses that
 * protocol. A bound value or a migration id holding U+0000 is refused before
 * anything runs, since Postgres text cannot hold it and changing it would
 * change the plugin's data. Reads stop at the row cap. A call that may write
 * measures the schema before and after (`schemaUsage`: the bytes of every
 * relation with its TOAST table, and the catalog objects), and rolls back one
 * that leaves it past the quota or the object cap and larger than it found
 * it, so a plugin at either limit can still delete. Before the client goes
 * back to the pool, whatever session state a statement could have left on it
 * is dropped ({@link END_SESSION}); a client that cannot be brought back to a
 * clean state is closed instead of reused.
 *
 * The calls of one plugin run one at a time, as they do on its SQLite file,
 * and all plugins together hold at most half of TREK's pool
 * (`pluginDataSlots`), so a busy plugin never takes the connections TREK's
 * own requests need.
 *
 * The SQLite store's semantics carry over: `query` and `tx` are held to the
 * row cap, `query`, a `tx` batch and an `exec` script to the time budget, a
 * script's statements each commit on their own, and `migrate` runs once per
 * id with no time budget. What Postgres adds is that the budget also stops a
 * single statement (`statement_timeout`), which SQLite cannot, and that an
 * `exec` with bound args is held to it as well.
 */

/** The limits one store enforces. Overridable for tests; production uses `PLUGIN_DATA_CAPS`. */
interface PostgresPluginDataLimits {
  maxRows: number;
  timeBudgetMs: number;
  quotaBytes: number;
  /** The most catalog objects the schema may hold (`PLUGIN_SCHEMA_MAX_OBJECTS`). */
  maxObjects: number;
  /** The clock the time budget reads. */
  now: () => number;
}

const DEFAULT_LIMITS: PostgresPluginDataLimits = {
  maxRows: PLUGIN_DATA_CAPS.maxRows,
  timeBudgetMs: PLUGIN_DATA_CAPS.timeBudgetMs,
  quotaBytes: PLUGIN_DATA_CAPS.quotaBytes,
  maxObjects: PLUGIN_SCHEMA_MAX_OBJECTS,
  now: () => Date.now(),
};

/** Postgres's SQLSTATE for a statement cancelled by `statement_timeout`. */
const QUERY_CANCELED = '57014';
/** Rows a cursor fetches at once. */
const CHUNK_ROWS = 500;
/** What better-sqlite3 says about a closed handle, which the host recognizes. */
const CLOSED = 'The database connection is not open';

/**
 * What a client runs before it goes back to the pool, outside any
 * transaction: `DISCARD ALL` without the two parts that would undo the pool's
 * own session state. `RESET ALL` would drop the `search_path` every pool
 * connection sets with `pg_temp` last (`session-search-path.ts`), and
 * `DEALLOCATE ALL` the statements `pg` prepared by name for other callers.
 * The plugin's settings need neither: they are all `local`. The guard
 * refuses every statement that could leave anything this drops, so this is
 * the layer behind it.
 */
export const END_SESSION = 'close all; unlisten *; select pg_advisory_unlock_all(); discard temp; discard sequences';

/** A query result, as far as the store reads it. */
interface PgResult {
  rows: unknown[];
  rowCount: number | null;
}

/** The part of a `pg` client the store uses. It is the store's alone from checkout to release. */
export interface PluginSqlClient {
  /** SQL of TREK's own, without values: over the simple protocol. */
  query(text: string): Promise<PgResult>;
  /** A query with values, or a plugin statement with `queryMode: 'extended'`. */
  query(config: { text: string; values: unknown[]; queryMode?: 'extended' }): Promise<PgResult>;
  /** Submits a cursor and hands it back. */
  query(cursor: Cursor): Cursor;
  /** Back to the pool, or closed when `destroy` is true. */
  release(destroy?: boolean): void;
}

/** Checks a client out of the pool; resolves once one is free. */
export type ConnectPluginClient = () => Promise<PluginSqlClient>;

/** The part of `pg`'s pool the store checks clients out of. */
interface PgPool {
  connect(): Promise<PluginSqlClient>;
}

/**
 * Clients of the `pg` pool behind MikroORM's Postgres connection, which its
 * `getNativeClient` hands out. Its options apply to them as to every other
 * client of the pool: the TLS settings, and the `int8` and `numeric` parsers
 * (`postgres-driver.ts`). Nothing of the pool is changed for them.
 */
export function poolClients(connection: { getNativeClient(): Promise<unknown> }): ConnectPluginClient {
  return async () => ((await connection.getNativeClient()) as PgPool).connect();
}

/** How many plugin transactions may hold a pool connection at once: half of TREK's pool, at least one. */
export function pluginDataSlots(poolMax: number): number {
  return Math.max(1, Math.floor(poolMax / 2));
}

/** A counting semaphore: at most `size` pieces of work at once, the rest wait in order. */
export class PluginDataSlots {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(readonly size: number) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.active < this.size) this.active++;
    else await new Promise<void>((resolve) => this.waiting.push(resolve));
    try {
      return await work();
    } finally {
      // A waiting call takes the slot over, so the count stays where it is.
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }
}

/** The rows one call has returned so far, against the cap they share. */
interface RowBudget {
  count: number;
  readonly max: number;
  readonly message: string;
}

/** Drops the plugin `id`'s schema and everything in it. An id no schema can be made from has none. */
export async function dropPluginSchema(db: Kysely<object>, id: string): Promise<void> {
  if (!isPluginId(id)) return;
  const schema = quotePluginSchema(pluginSchemaName(id));
  await db.executeQuery(CompiledQuery.raw(`drop schema if exists ${schema} cascade`));
}

export class PostgresPluginDataStore implements PluginDataStore {
  readonly engine = 'postgres' as const;
  private readonly schema: string;
  private readonly quoted: string;
  private readonly limits: PostgresPluginDataLimits;
  private open = true;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    readonly pluginId: string,
    private readonly connect: ConnectPluginClient,
    private readonly slots: PluginDataSlots,
    limits: Partial<PostgresPluginDataLimits> = {},
    private readonly roleGate: PluginRoleGate = new PrivilegedRoleGate(),
  ) {
    this.schema = pluginSchemaName(pluginId);
    this.quoted = quotePluginSchema(this.schema);
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  isOpen(): boolean {
    return this.open;
  }

  /** Stops new calls. One already running finishes: it holds a pool client of its own, not this store. */
  close(): void {
    this.open = false;
  }

  async query(sql: string, args: unknown[] = []): Promise<unknown[]> {
    const statement = this.single(sql, args);
    const { maxRows } = this.limits;
    return this.call('query', (budget) =>
      this.transaction(budget.ms, [statement], (client) => {
        const rows = { count: 0, max: maxRows, message: `query returned more than ${maxRows} rows` };
        return this.stream(client, statement, args, rows, budget.check);
      }),
    );
  }

  async exec(sql: string, args: unknown[] = []): Promise<{ changes: number }> {
    if (args.length > 0) {
      const statement = this.single(sql, args);
      return this.call('exec', (budget) =>
        this.transaction(budget.ms, [statement], async (client) => ({
          changes: await this.run(client, statement, args),
        })),
      );
    }
    const statements = this.parse(sql);
    return this.call('exec', async (budget) => {
      // A script runs as SQLite runs one: each statement commits on its own, and
      // the clock is read before every statement but the first.
      await inOrder(statements, (statement, index) => {
        if (index > 0) budget.check();
        return this.transaction(budget.remaining(), [statement], (client) => this.run(client, statement, []));
      });
      return { changes: 0 };
    });
  }

  async tx(ops: PluginTxOp[]): Promise<PluginTxResult> {
    if (!Array.isArray(ops)) throw new Error('tx requires an array of { sql, args }');
    if (ops.length === 0) return { results: [] };
    if (ops.length > PLUGIN_DATA_CAPS.maxTxOps) {
      throw new Error(`tx allows at most ${PLUGIN_DATA_CAPS.maxTxOps} statements`);
    }
    const statements = ops.map((op) => this.single(op?.sql, op?.args ?? []));
    const { maxRows } = this.limits;
    return this.call('tx', (budget) =>
      this.transaction(budget.ms, statements, async (client) => {
        const rows = { count: 0, max: maxRows, message: `tx returned more than ${maxRows} rows in total` };
        const results = await inOrder(statements, async (statement, index) => {
          const args = ops[index].args ?? [];
          // One budget for the whole batch: each statement after the first gets what is left of it.
          if (index > 0) await this.setTimeout(client, budget.remaining());
          const result = statement.returnsRows
            ? { rows: await this.stream(client, statement, args, rows, budget.check) }
            : { changes: await this.run(client, statement, args) };
          budget.check();
          return result;
        });
        return { results };
      }),
    );
  }

  /** No time budget, as on SQLite: a migration stopped part of the way would fail the same way on every start. */
  async migrate(id: string, sql: string): Promise<{ applied: boolean }> {
    const statements = this.parse(sql);
    refuseNulValues([id]);
    return this.enqueue(() =>
      this.transaction(null, statements, async (client) => {
        const seen = await client.query({
          text: `select 1 from ${this.quoted}._plugin_migrations where id = $1`,
          values: [id],
        });
        if (seen.rows.length > 0) return { applied: false };
        await inOrder(statements, (statement) => this.run(client, statement, []));
        await client.query({
          text: `insert into ${this.quoted}._plugin_migrations (id, applied_at) values ($1, $2)`,
          values: [id, Date.now()],
        });
        return { applied: true };
      }),
    );
  }

  /** `sql` as exactly one statement, checked against `args`. */
  private single(sql: unknown, args: readonly unknown[]): PluginStatement {
    const statements = this.parse(sql);
    if (statements.length !== 1) throw new Error('sql must hold exactly one statement here; use exec() for a script');
    checkPlaceholders(statements[0], args);
    refuseNulValues(args);
    return statements[0];
  }

  /** The statements of `sql`, refused when the guard does not allow one or none is there. */
  private parse(sql: unknown): PluginStatement[] {
    if (!this.open) throw new Error(CLOSED);
    if (typeof sql !== 'string') throw new Error('sql must be a string');
    if (sql.length > PLUGIN_DATA_CAPS.maxSqlLength) throw new Error('sql too long');
    const statements = parsePluginSql(sql);
    if (statements.length === 0) throw new Error('The supplied SQL string contains no statements');
    return statements;
  }

  /**
   * Runs `work` in this plugin's turn with a time budget that starts when its
   * turn comes, and reports a statement Postgres cancelled at
   * `statement_timeout` as the budget running out.
   */
  private call<T>(what: string, work: (budget: Budget) => Promise<T>): Promise<T> {
    const { now, timeBudgetMs } = this.limits;
    return this.enqueue(async () => {
      const startedAt = now();
      const budget: Budget = {
        ms: timeBudgetMs,
        remaining: () => Math.max(1, timeBudgetMs - (now() - startedAt)),
        check: () => {
          if (now() - startedAt > timeBudgetMs) throw new Error(`${what} exceeded its ${timeBudgetMs} ms time budget`);
        },
      };
      try {
        return await work(budget);
      } catch (err) {
        if (sqlState(err) === QUERY_CANCELED) {
          throw new Error(`${what} exceeded its ${timeBudgetMs} ms time budget`, { cause: err });
        }
        throw err;
      }
    });
  }

  /** Queues `work` behind this plugin's earlier calls, then waits for a pool slot. */
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const turn = this.queue.then(() => this.slots.run(work));
    this.queue = turn.catch(() => undefined);
    return turn;
  }

  /**
   * One transaction on this plugin's schema, on a client of its own: created
   * if missing, alone on the `search_path`, with `statement_timeout` at
   * `timeoutMs` (none for null). The statements' qualified names are checked
   * against the database's schemas first, and a call that may write is held
   * to the quota. The client goes back to the pool with its session state
   * dropped, or is closed when the rollback or that cleanup fails.
   */
  private async transaction<T>(
    timeoutMs: number | null,
    statements: readonly PluginStatement[],
    work: (client: PluginSqlClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.connect();
    let reusable = true;
    try {
      await this.roleGate.refuseIfPrivileged(client);
      await client.query('begin');
      try {
        const result = await this.inTransaction(client, timeoutMs, statements, work);
        await client.query('commit');
        return result;
      } catch (err) {
        await client.query('rollback').catch(() => {
          reusable = false;
        });
        throw err;
      }
    } finally {
      if (reusable) {
        await client.query(END_SESSION).catch(() => {
          reusable = false;
        });
      }
      client.release(!reusable);
    }
  }

  /** What {@link transaction} runs between `begin` and `commit`. */
  private async inTransaction<T>(
    client: PluginSqlClient,
    timeoutMs: number | null,
    statements: readonly PluginStatement[],
    work: (client: PluginSqlClient) => Promise<T>,
  ): Promise<T> {
    const setup = [
      `create schema if not exists ${this.quoted}`,
      `create table if not exists ${this.quoted}._plugin_migrations (id text primary key, applied_at bigint)`,
      `set local search_path to ${this.quoted}, pg_temp`,
      'set local standard_conforming_strings to on',
    ];
    if (timeoutMs !== null) setup.push(`set local statement_timeout to ${Math.max(1, Math.floor(timeoutMs))}`);
    await client.query(setup.join(';\n'));
    if (statements.some((s) => s.qualifies)) {
      const schemas = await this.schemaNames(client);
      for (const statement of statements) checkQualifiers(statement, this.schema, schemas);
    }
    const writes = statements.some((s) => s.mayWrite);
    const before = writes ? await schemaUsage(client, this.schema) : null;
    const result = await work(client);
    if (before !== null) this.checkQuota(before, await schemaUsage(client, this.schema));
    return result;
  }

  /**
   * Refuses a call that left the schema past its quota or its object cap and
   * grew it there, so a plugin at either limit can still delete.
   */
  private checkQuota(before: SchemaUsage, after: SchemaUsage): void {
    const { quotaBytes, maxObjects } = this.limits;
    if (after.bytes > quotaBytes && after.bytes > before.bytes) {
      throw new Error(`the plugin database is past its ${quotaBytes / 1024 / 1024} MB quota`);
    }
    if (after.objects > maxObjects && after.objects > before.objects) {
      throw new Error(
        `the plugin database holds more than ${maxObjects} catalog objects (tables, indexes, sequences, views, ` +
          'types, constraints, enum labels)',
      );
    }
  }

  private async setTimeout(client: PluginSqlClient, ms: number): Promise<void> {
    await client.query({
      text: "select set_config('statement_timeout', $1, true)",
      values: [String(Math.max(1, Math.floor(ms)))],
    });
  }

  /** Every schema name of the database, which a qualified name in plugin SQL may not use. */
  private async schemaNames(client: PluginSqlClient): Promise<Set<string>> {
    const result = await client.query('select nspname from pg_namespace');
    return new Set((result.rows as Array<{ nspname: string }>).map((row) => row.nspname));
  }

  /**
   * Runs a statement for its effect: the rows it changed, or 0 for a read,
   * whose rows are read past and dropped. Both go over the extended protocol:
   * a write as an extended query, a read through a cursor.
   */
  private async run(client: PluginSqlClient, statement: PluginStatement, args: readonly unknown[]): Promise<number> {
    await refuseForeignTargets(client, statement, this.schema);
    if (!statement.mayWrite) {
      // Read to the end so the statement runs whole; its rows are not wanted.
      await readCursor(client.query(new Cursor(statement.text, [...args])), () => undefined);
      return 0;
    }
    const result = await client.query({ text: statement.text, values: [...args], queryMode: 'extended' });
    return result.rowCount ?? 0;
  }

  /**
   * The rows of a statement, read through a cursor a chunk at a time: past the
   * row cap the read stops and throws, and the clock is read between chunks.
   */
  private async stream(
    client: PluginSqlClient,
    statement: PluginStatement,
    args: readonly unknown[],
    budget: RowBudget,
    checkTime: () => void,
  ): Promise<unknown[]> {
    await refuseForeignTargets(client, statement, this.schema);
    const rows: unknown[] = [];
    await readCursor(client.query(new Cursor(statement.text, [...args])), (chunk) => {
      if (rows.length > 0) checkTime();
      for (const row of chunk) {
        rows.push(row);
        budget.count++;
        if (budget.count > budget.max) throw new Error(budget.message);
      }
    });
    return rows;
  }
}

/**
 * Reads `cursor` to its end a chunk at a time, handing each chunk to `take`
 * (which may throw to stop the read), and closes it however the read ends.
 */
async function readCursor(cursor: Cursor, take: (rows: unknown[]) => void): Promise<void> {
  const next = async (): Promise<void> => {
    const rows = await cursor.read(CHUNK_ROWS);
    if (rows.length === 0) return;
    take(rows);
    return next();
  };
  try {
    await next();
  } finally {
    await cursor.close();
  }
}

/** `work` for each item, one after the other, each started once the one before it has finished. */
async function inOrder<T, R>(items: readonly T[], work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  await items.reduce<Promise<void>>(
    (previous, item, index) =>
      previous.then(async () => {
        results.push(await work(item, index));
      }),
    Promise.resolve(),
  );
  return results;
}

/** A call's time budget: its whole length, what is left of it, and a check that throws once it is spent. */
interface Budget {
  readonly ms: number;
  remaining(): number;
  check(): void;
}

/** The SQLSTATE of a `pg` error, or null. */
function sqlState(err: unknown): string | null {
  if (typeof err !== 'object' || err === null || !('code' in err)) return null;
  return typeof err.code === 'string' ? err.code : null;
}
