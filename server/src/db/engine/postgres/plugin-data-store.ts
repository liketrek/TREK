import { PLUGIN_DATA_CAPS, type PluginDataStore, type PluginTxOp, type PluginTxResult } from '../plugin-data';
import { isPluginId, pluginSchemaName, quotePluginSchema } from './plugin-schema';
import { checkPlaceholders, checkQualifiers, parsePluginSql, type PluginStatement } from './plugin-sql-guard';

import { CompiledQuery, type Kysely, type Transaction } from 'kysely';

/**
 * A plugin's own data on Postgres (`db:own`): a schema of its own in TREK's
 * database (`plugin-schema.ts`), reached through TREK's pool.
 *
 * Every call runs in one transaction that first makes sure the schema and its
 * migration table exist, then puts only that schema on the `search_path` and
 * sets `statement_timeout` to the call's time budget. The plugin's SQL is
 * checked by `plugin-sql-guard.ts` before it runs, so it cannot name another
 * schema. Reads stream through a cursor and stop at the row cap. A call that
 * may write measures the schema's size before and after, and rolls back one
 * that leaves it past the quota and larger than it found it, so a plugin at
 * its quota can still delete.
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
  /** The clock the time budget reads. */
  now: () => number;
}

const DEFAULT_LIMITS: PostgresPluginDataLimits = {
  maxRows: PLUGIN_DATA_CAPS.maxRows,
  timeBudgetMs: PLUGIN_DATA_CAPS.timeBudgetMs,
  quotaBytes: PLUGIN_DATA_CAPS.quotaBytes,
  now: () => Date.now(),
};

/** Postgres's SQLSTATE for a statement cancelled by `statement_timeout`. */
const QUERY_CANCELED = '57014';
/** Rows a cursor fetches at once. */
const CHUNK_ROWS = 500;
/** What better-sqlite3 says about a closed handle, which the host recognizes. */
const CLOSED = 'The database connection is not open';

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

type Trx = Transaction<object>;

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
    private readonly db: Kysely<object>,
    private readonly slots: PluginDataSlots,
    limits: Partial<PostgresPluginDataLimits> = {},
  ) {
    this.schema = pluginSchemaName(pluginId);
    this.quoted = quotePluginSchema(this.schema);
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  isOpen(): boolean {
    return this.open;
  }

  /** Stops new calls. One already running finishes: it holds a pool connection of its own, not this store. */
  close(): void {
    this.open = false;
  }

  async query(sql: string, args: unknown[] = []): Promise<unknown[]> {
    const statement = this.single(sql, args);
    const { maxRows } = this.limits;
    return this.call('query', (budget) =>
      this.transaction(budget.ms, [statement], (trx) => {
        const rows = { count: 0, max: maxRows, message: `query returned more than ${maxRows} rows` };
        return this.stream(trx, statement, args, rows, budget.check);
      }),
    );
  }

  async exec(sql: string, args: unknown[] = []): Promise<{ changes: number }> {
    if (args.length > 0) {
      const statement = this.single(sql, args);
      return this.call('exec', (budget) =>
        this.transaction(budget.ms, [statement], async (trx) => ({ changes: await this.run(trx, statement, args) })),
      );
    }
    const statements = this.parse(sql);
    return this.call('exec', async (budget) => {
      // A script runs as SQLite runs one: each statement commits on its own, and
      // the clock is read before every statement but the first.
      await inOrder(statements, (statement, index) => {
        if (index > 0) budget.check();
        return this.transaction(budget.remaining(), [statement], (trx) => this.run(trx, statement, []));
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
      this.transaction(budget.ms, statements, async (trx) => {
        const rows = { count: 0, max: maxRows, message: `tx returned more than ${maxRows} rows in total` };
        const results = await inOrder(statements, async (statement, index) => {
          const args = ops[index].args ?? [];
          // One budget for the whole batch: each statement after the first gets what is left of it.
          if (index > 0) await this.setTimeout(trx, budget.remaining());
          const result = statement.returnsRows
            ? { rows: await this.stream(trx, statement, args, rows, budget.check) }
            : { changes: await this.run(trx, statement, args) };
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
    return this.enqueue(() =>
      this.transaction(null, statements, async (trx) => {
        const seen = await trx.executeQuery(
          CompiledQuery.raw(`select 1 from ${this.quoted}._plugin_migrations where id = $1`, [id]),
        );
        if (seen.rows.length > 0) return { applied: false };
        await inOrder(statements, (statement) => this.run(trx, statement, []));
        await trx.executeQuery(
          CompiledQuery.raw(`insert into ${this.quoted}._plugin_migrations (id, applied_at) values ($1, $2)`, [
            id,
            Date.now(),
          ]),
        );
        return { applied: true };
      }),
    );
  }

  /** `sql` as exactly one statement, checked against `args`. */
  private single(sql: unknown, args: readonly unknown[]): PluginStatement {
    const statements = this.parse(sql);
    if (statements.length !== 1) throw new Error('sql must hold exactly one statement here; use exec() for a script');
    checkPlaceholders(statements[0], args);
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
   * One transaction on this plugin's schema: created if missing, alone on the
   * `search_path`, with `statement_timeout` at `timeoutMs` (none for null).
   * The statements' qualified names are checked against the database's
   * schemas first, and a call that may write is held to the quota.
   */
  private transaction<T>(
    timeoutMs: number | null,
    statements: readonly PluginStatement[],
    work: (trx: Trx) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      const setup = [
        `create schema if not exists ${this.quoted}`,
        `create table if not exists ${this.quoted}._plugin_migrations (id text primary key, applied_at bigint)`,
        `set local search_path to ${this.quoted}`,
        'set local standard_conforming_strings to on',
      ];
      if (timeoutMs !== null) setup.push(`set local statement_timeout to ${Math.max(1, Math.floor(timeoutMs))}`);
      await trx.executeQuery(CompiledQuery.raw(setup.join(';\n')));
      if (statements.some((s) => s.qualifies)) {
        const schemas = await this.schemaNames(trx);
        for (const statement of statements) checkQualifiers(statement, this.schema, schemas);
      }
      const writes = statements.some((s) => s.mayWrite);
      const before = writes ? await this.sizeBytes(trx) : 0;
      const result = await work(trx);
      if (writes) {
        const after = await this.sizeBytes(trx);
        if (after > this.limits.quotaBytes && after > before) {
          throw new Error(`the plugin database is past its ${this.limits.quotaBytes / 1024 / 1024} MB quota`);
        }
      }
      return result;
    });
  }

  private async setTimeout(trx: Trx, ms: number): Promise<void> {
    await trx.executeQuery(
      CompiledQuery.raw("select set_config('statement_timeout', $1, true)", [String(Math.max(1, Math.floor(ms)))]),
    );
  }

  /** Every schema name of the database, which a qualified name in plugin SQL may not use. */
  private async schemaNames(trx: Trx): Promise<Set<string>> {
    const result = await trx.executeQuery<{ nspname: string }>(CompiledQuery.raw('select nspname from pg_namespace'));
    return new Set(result.rows.map((row) => row.nspname));
  }

  /** What this plugin's tables, indexes and materialized views take on disk. */
  private async sizeBytes(trx: Trx): Promise<number> {
    const result = await trx.executeQuery<{ bytes: number | string }>(
      CompiledQuery.raw(
        'select coalesce(sum(pg_total_relation_size(c.oid)), 0) as bytes from pg_class c ' +
          "join pg_namespace n on n.oid = c.relnamespace where n.nspname = $1 and c.relkind in ('r', 'm')",
        [this.schema],
      ),
    );
    return Number(result.rows[0]?.bytes ?? 0);
  }

  /** Runs a statement for its effect: the rows it changed, or 0 for a read, whose rows are streamed past and dropped. */
  private async run(trx: Trx, statement: PluginStatement, args: readonly unknown[]): Promise<number> {
    if (!statement.mayWrite) {
      const chunks = trx.getExecutor().stream(CompiledQuery.raw(statement.text, [...args]), CHUNK_ROWS);
      for await (const _chunk of chunks) {
        // Read to the end so the statement runs whole; its rows are not wanted.
      }
      return 0;
    }
    const result = await trx.executeQuery(CompiledQuery.raw(statement.text, [...args]));
    return Number(result.numAffectedRows ?? 0);
  }

  /**
   * The rows of a statement, read through a cursor a chunk at a time: past the
   * row cap the read stops and throws, and the clock is read between chunks.
   */
  private async stream(
    trx: Trx,
    statement: PluginStatement,
    args: readonly unknown[],
    budget: RowBudget,
    checkTime: () => void,
  ): Promise<unknown[]> {
    const rows: unknown[] = [];
    const chunks = trx.getExecutor().stream(CompiledQuery.raw(statement.text, [...args]), CHUNK_ROWS);
    for await (const chunk of chunks) {
      if (rows.length > 0) checkTime();
      for (const row of chunk.rows) {
        rows.push(row);
        budget.count++;
        if (budget.count > budget.max) throw new Error(budget.message);
      }
    }
    return rows;
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
