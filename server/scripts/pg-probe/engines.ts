/**
 * The parts of the Postgres probe that talk to a database: the two MikroORM
 * instances (a stock one that builds the schema and runs the helper cases,
 * and one whose driver records every repository statement), the scratch
 * SQLite database the helper cases are compared on, and the loop that calls
 * every repository method.
 */
import { ALL_ENTITIES } from '../../src/db/entities';
import type { MethodPlan } from './arg-samples';
import {
  VALUES_TABLE,
  VALUES_TABLE_DDL,
  type HelperEngine,
  type KyselySelect,
  type RawSelect,
  type ValuesDB,
  type ValuesRow,
} from './helper-cases';
import { ProbePostgresDialect, type StatementRecorder } from './recorder';
import type { MethodResult } from './report';
import { adjustColumns, NOCASE_COLLATION_SQL, splitStatements, type ColumnMeta } from './schema';
import { RequestContext, type Configuration, type EntityManager, type EntityProperty } from '@mikro-orm/core';
import { MikroORM, PostgreSqlConnection, PostgreSqlDriver, type Options } from '@mikro-orm/postgresql';
import { SqlitePlatform } from '@mikro-orm/sql';

import Database from 'better-sqlite3';
import {
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type PostgresDialect,
} from 'kysely';
import path from 'node:path';

/** Marks a database the probe built, so a rerun may drop what it finds there and nothing else. */
const MARKER_TABLE = 'trek_pg_probe_marker';

function baseOptions(url: string): Options {
  return {
    clientUrl: url,
    entities: [...ALL_ENTITIES],
    discovery: { warnWhenNoEntities: false },
    debug: false,
    allowGlobalContext: true,
    pool: { min: 0, max: 4 },
    schemaGenerator: { createForeignKeyConstraints: false },
  };
}

/** The stock ORM: builds the schema and runs the helper cases. */
export function connectSetupOrm(url: string): Promise<MikroORM> {
  return MikroORM.init(baseOptions(url));
}

/** A Postgres driver whose Kysely dialect records every statement (see recorder.ts). */
export function createProbeDriverClass(
  recorder: StatementRecorder,
  statementTimeoutMs: number,
): typeof PostgreSqlDriver {
  class ProbeConnection extends PostgreSqlConnection {
    override createKyselyDialect(
      overrides: Parameters<PostgreSqlConnection['createKyselyDialect']>[0],
    ): PostgresDialect {
      return new ProbePostgresDialect(super.createKyselyDialect(overrides), recorder, statementTimeoutMs);
    }
  }
  return class ProbePostgreSqlDriver extends PostgreSqlDriver {
    constructor(config: Configuration) {
      super(config);
      // Same seam as src/db/orm-driver.ts: the base constructor hardcodes the
      // connection class, so the instance is swapped before anything connects.
      (this as unknown as { connection: PostgreSqlConnection }).connection = new ProbeConnection(config);
    }
  };
}

export function connectProbeOrm(
  url: string,
  recorder: StatementRecorder,
  statementTimeoutMs: number,
): Promise<MikroORM> {
  return MikroORM.init({ ...baseOptions(url), driver: createProbeDriverClass(recorder, statementTimeoutMs) });
}

/**
 * Refuses a database that holds tables the probe did not create, then drops
 * and recreates the `public` schema. The probe needs a throwaway database
 * (CI's service container); pointing it at anything else must not cost data.
 */
async function resetDatabase(orm: MikroORM): Promise<void> {
  const connection = orm.em.getConnection();
  const tables = await connection.execute<{ table_name: string }[]>(
    "select table_name from information_schema.tables where table_schema = 'public'",
  );
  const names = tables.map((row) => row.table_name);
  if (names.length > 0 && !names.includes(MARKER_TABLE)) {
    throw new Error(
      `refusing to run: the database holds ${names.length} table(s) the probe did not create. Point it at an empty database.`,
    );
  }
  if (names.length > 0) {
    await connection.execute('drop schema public cascade');
    await connection.execute('create schema public');
  }
  await connection.execute(`create table ${MARKER_TABLE} (created_at text)`);
}

export interface SchemaFailure {
  statement: string;
  message: string;
}

/** Resets the database and builds the probe schema; returns the DDL statements Postgres refused. */
export async function prepareDatabase(
  orm: MikroORM,
): Promise<{ failures: SchemaFailure[]; adjusted: number; statements: number }> {
  await resetDatabase(orm);
  const connection = orm.em.getConnection();
  const failures: SchemaFailure[] = [];
  const run = async (statement: string): Promise<void> => {
    try {
      await connection.execute(statement);
    } catch (error) {
      failures.push({ statement, message: error instanceof Error ? error.message.split('\n')[0]! : String(error) });
    }
  };
  await run(NOCASE_COLLATION_SQL);
  let adjusted = 0;
  for (const meta of orm.getMetadata().getAll().values()) {
    adjusted += adjustColumns(meta.props as EntityProperty[] as ColumnMeta[]).length;
  }
  const statements = splitStatements(await orm.schema.getCreateSchemaSQL({ wrap: false }));
  for (const statement of statements) await run(statement);
  await run(VALUES_TABLE_DDL.postgres);
  return { failures, adjusted, statements: statements.length };
}

export function postgresHelperEngine(orm: MikroORM): HelperEngine {
  const connection = orm.em.getConnection();
  const kysely = orm.em.getKysely<ValuesDB>();
  return {
    engine: 'postgres',
    platform: orm.em.getPlatform(),
    async writeRow(row: ValuesRow) {
      await connection.execute(`delete from ${VALUES_TABLE}`);
      await kysely.insertInto(VALUES_TABLE).values(row).execute();
    },
    async selectRaw(select: RawSelect) {
      const sql = `select ${select.sql}${select.column ? '' : ' as v'} from ${VALUES_TABLE}`;
      const rows = await connection.execute<Record<string, unknown>[]>(sql, select.params);
      return rows[0]?.[select.column ?? 'v'];
    },
    async selectKysely(select: KyselySelect) {
      const platform = orm.em.getPlatform();
      const row = await kysely
        .selectFrom(VALUES_TABLE)
        .select((eb) => select(platform, eb).as('v'))
        .executeTakeFirst();
      return row?.v;
    },
  };
}

/** The same cases on an in-memory SQLite database, through the SQLite branch of every helper. */
export function sqliteHelperEngine(): HelperEngine & { close(): void } {
  const db = new Database(':memory:');
  db.exec(VALUES_TABLE_DDL.sqlite);
  const platform = new SqlitePlatform();
  const compiler = new Kysely<ValuesDB>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () => new DummyDriver(),
      createIntrospector: (kysely) => new SqliteIntrospector(kysely),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
  });
  const bind = (value: unknown): unknown => (typeof value === 'boolean' ? Number(value) : value);
  return {
    engine: 'sqlite',
    platform,
    async writeRow(row: ValuesRow) {
      db.prepare(`delete from ${VALUES_TABLE}`).run();
      db.prepare(`insert into ${VALUES_TABLE} (id, a, b, n, x) values (?, ?, ?, ?, ?)`).run(
        row.id,
        row.a,
        row.b,
        row.n,
        row.x,
      );
    },
    async selectRaw(select: RawSelect) {
      const sql = `select ${select.sql}${select.column ? '' : ' as v'} from ${VALUES_TABLE}`;
      const row = db.prepare(sql).get(...select.params.map(bind)) as Record<string, unknown> | undefined;
      return row?.[select.column ?? 'v'];
    },
    async selectKysely(select: KyselySelect) {
      const compiled = compiler
        .selectFrom(VALUES_TABLE)
        .select((eb) => select(platform, eb).as('v'))
        .compile();
      const row = db.prepare(compiled.sql).get(...compiled.parameters.map(bind)) as Record<string, unknown> | undefined;
      return row?.v;
    },
    close: () => db.close(),
  };
}

type RepositoryFactory = (em: EntityManager) => object;

/** How to reach each repository class: through its entity, or `new X(em)` for the two that have none. */
function repositoryFactories(
  orm: MikroORM,
  plans: readonly MethodPlan[],
  serverRoot: string,
): Map<string, RepositoryFactory | string> {
  const byEntity = new Map<string, RepositoryFactory>();
  for (const meta of orm.getMetadata().getAll().values()) {
    const repository = meta.repository?.();
    if (repository) byEntity.set(repository.name, (em) => em.getRepository(meta.class));
  }
  const factories = new Map<string, RepositoryFactory | string>();
  for (const plan of plans) {
    if (factories.has(plan.className)) continue;
    const viaEntity = byEntity.get(plan.className);
    if (viaEntity) {
      factories.set(plan.className, viaEntity);
      continue;
    }
    const exported = (require(path.join(serverRoot, plan.file)) as Record<string, unknown>)[plan.className];
    if (typeof exported === 'function' && exported.length === 1) {
      const RepositoryClass = exported as new (em: EntityManager) => object;
      factories.set(plan.className, (em) => new RepositoryClass(em));
    } else {
      factories.set(plan.className, 'no entity maps it and it does not take an EntityManager');
    }
  }
  return factories;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<{ value: T } | 'timeout'> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  return Promise.race([promise.then((value) => ({ value })), timeout]).finally(() => clearTimeout(timer));
}

/** Calls every planned method once, inside a request context, and collects what each one sent. */
export async function probeRepositories(
  orm: MikroORM,
  recorder: StatementRecorder,
  plans: readonly MethodPlan[],
  serverRoot: string,
  methodTimeoutMs: number,
): Promise<MethodResult[]> {
  const factories = repositoryFactories(orm, plans, serverRoot);
  const results: MethodResult[] = [];
  for (const plan of plans) {
    const key = `${plan.className}.${plan.method}`;
    const factory = factories.get(plan.className);
    if ('unprobeable' in plan) {
      results.push({ key, statements: [], unprobeable: plan.unprobeable });
      continue;
    }
    if (typeof factory !== 'function') {
      results.push({ key, statements: [], unprobeable: factory ?? 'unknown class' });
      continue;
    }
    const result: MethodResult = { key, statements: [] };
    try {
      const outcome = await recorder.run(key, () =>
        withTimeout(
          RequestContext.create(orm.em, async () => {
            const repository = factory(RequestContext.getEntityManager() ?? orm.em.fork()) as Record<string, unknown>;
            const method = repository[plan.method];
            if (typeof method !== 'function') throw new Error(`${key} is not a function at runtime`);
            return (await (method as (...args: unknown[]) => unknown).apply(repository, plan.args)) as unknown;
          }),
          methodTimeoutMs,
        ),
      );
      if (outcome === 'timeout') result.timedOut = true;
    } catch (error) {
      result.threw = error instanceof Error ? error.message.split('\n')[0]! : String(error);
    }
    result.statements = [...recorder.statementsOf(key)];
    results.push(result);
  }
  return results;
}
