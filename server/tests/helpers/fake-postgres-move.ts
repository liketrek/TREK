import type { AnyOrm } from '../../src/db/orm';

import type { CompiledQuery, Kysely } from 'kysely';
import { vi } from 'vitest';

/**
 * A stand-in for the Postgres side of the SQLite move
 * (`src/db/engine/postgres/sqlite-move/`), for the unit tests in the SQLite
 * lane: it answers exactly the statements the move sends, keeps the rows it
 * is given in memory and reads them back as Postgres's `::text` would. The
 * real database is the Postgres lane's (`tests/postgres/sqlite-move.test.ts`).
 */

interface FakeColumn {
  name: string;
  dataType: string;
  nullable?: boolean;
}

export interface FakeTableDef {
  name: string;
  columns: FakeColumn[];
  primaryKey: string[];
  /** Foreign keys: `columns` of this table point at `references`. */
  foreignKeys?: Array<{ columns: string[]; references: string }>;
  /** Columns a sequence fills. */
  serial?: string[];
}

interface FakeTable {
  columns: string[];
  rows: unknown[][];
}

const QUOTED = /"((?:[^"]|"")*)"/g;

function unquote(text: string): string[] {
  return [...text.matchAll(QUOTED)].map((match) => match[1].replaceAll('""', '"'));
}

/** A value as Postgres would print it with `::text` and `bytea_output = hex`. */
function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Buffer.isBuffer(value)) return `\\x${value.toString('hex')}`;
  return String(value);
}

export class FakePostgres {
  /** Every statement, in order. */
  readonly statements: string[] = [];
  readonly tables = new Map<string, FakeTable>();
  readonly sequences = new Map<string, { value: string; called: boolean }>();
  /** Tables the database holds before anything runs (the move refuses them). */
  existing: string[] = [];
  pluginSchemas: string[] = [];
  /** A statement matching this fails, as Postgres would refuse it. */
  failOn: RegExp | null = null;
  /** Rows the read-back answers in place of the stored ones, by table: a copy that came out wrong. */
  tamper = new Map<string, (rows: unknown[][]) => unknown[][]>();
  private cursor: Array<Record<string, string | null>> = [];
  private bootstrapped = false;

  constructor(readonly schema: FakeTableDef[]) {}

  /** What the engine's bootstrap leaves: every table of the schema, with a seeded row or two. */
  bootstrap(): void {
    this.bootstrapped = true;
    for (const table of this.schema) {
      this.tables.set(`"${table.name}"`, { columns: table.columns.map((column) => column.name), rows: [] });
    }
    const first = this.schema[0];
    this.tables.get(`"${first.name}"`)?.rows.push(first.columns.map(() => null));
  }

  rowsOf(target: string): unknown[][] {
    return this.tables.get(target)?.rows ?? [];
  }

  async executeQuery<R>(query: CompiledQuery): Promise<{ rows: R[] }> {
    const sql = query.sql;
    const params = [...query.parameters];
    this.statements.push(sql);
    if (this.failOn?.test(sql)) {
      throw Object.assign(new Error('refused by the fake'), { detail: 'Key (id)=(1)', constraint: 'fake_key' });
    }
    return { rows: this.answer(sql, params) as R[] };
  }

  /** `db.transaction().execute(fn)`: the fake has no isolation, only the order of statements. */
  transaction() {
    return { execute: <T>(work: (trx: Kysely<object>) => Promise<T>) => work(this.asKysely()) };
  }

  asKysely(): Kysely<object> {
    return this as unknown as Kysely<object>;
  }

  private answer(sql: string, params: unknown[]): unknown[] {
    if (sql.startsWith('select table_name from information_schema.tables')) {
      return [...this.existing, ...(this.bootstrapped ? this.schema.map((table) => table.name) : [])].map(
        (table_name) => ({ table_name }),
      );
    }
    if (sql.startsWith('select nspname from pg_namespace')) return this.pluginSchemas.map((nspname) => ({ nspname }));
    if (sql.includes('from information_schema.columns c')) {
      return this.schema.flatMap((table) =>
        table.columns.map((column) => ({
          table_name: table.name,
          column_name: column.name,
          data_type: column.dataType,
          is_nullable: column.nullable === false ? 'NO' : 'YES',
        })),
      );
    }
    if (sql.includes('from pg_constraint')) {
      return this.schema.flatMap((table) => [
        { kind: 'p', table_name: table.name, target_name: null, columns: table.primaryKey },
        ...(table.foreignKeys ?? []).map((fk) => ({
          kind: 'f',
          table_name: table.name,
          target_name: fk.references,
          columns: fk.columns,
        })),
      ]);
    }
    if (sql.includes("pg_get_serial_sequence(format('%I'")) {
      return this.schema.flatMap((table) =>
        (table.serial ?? []).map((column) => ({
          table_name: table.name,
          column_name: column,
          sequence: `public.${table.name}_${column}_seq`,
        })),
      );
    }
    if (sql.startsWith('DO $clear$')) {
      // The current schema is emptied: the database is as the move found it.
      this.bootstrapped = false;
      this.tables.clear();
      return [];
    }
    if (sql.startsWith('select pg_get_serial_sequence($1, $2)')) return [{ sequence: `${String(params[0])}_seq` }];
    if (sql.startsWith('truncate table ')) {
      for (const target of sql.slice('truncate table '.length).split(', ')) this.tableOf(target).rows = [];
      return [];
    }
    if (sql.startsWith('insert into ')) return this.insert(sql, params);
    if (sql.startsWith('update ')) return this.update(sql, params);
    if (sql.startsWith('create table ')) return this.createTable(sql);
    if (sql.startsWith('declare trek_move_verify')) return this.declare(sql);
    if (sql.startsWith('fetch forward ')) {
      const size = Number(/fetch forward (\d+)/.exec(sql)?.[1]);
      return this.cursor.splice(0, size);
    }
    if (sql.startsWith('select max(')) {
      const [column] = unquote(sql.slice(0, sql.indexOf(')')));
      const table = this.tableOf(sql.slice(sql.indexOf(' from ') + 6));
      const index = table.columns.indexOf(column);
      const values = table.rows
        .map((row) => row[index])
        .filter((value) => value !== null)
        .map((value) => BigInt(String(value)));
      const max = values.reduce<bigint | null>((best, value) => (best === null || value > best ? value : best), null);
      return [{ max: max === null ? null : max.toString() }];
    }
    if (sql.startsWith('select setval(')) {
      this.sequences.set(String(params[0]), { value: String(params[1]), called: Boolean(params[2]) });
      return [];
    }
    return [];
  }

  private tableOf(target: string): FakeTable {
    const table = this.tables.get(target.trim());
    if (!table) throw new Error(`relation ${target} does not exist`);
    return table;
  }

  private insert(sql: string, params: unknown[]): unknown[] {
    const match = /^insert into (.+?) \((.+?)\) values /.exec(sql);
    if (!match) throw new Error(`unparsed insert: ${sql}`);
    const table = this.tableOf(match[1]);
    const columns = unquote(match[2]);
    for (let at = 0; at < params.length; at += columns.length) {
      const values = params.slice(at, at + columns.length);
      table.rows.push(table.columns.map((name) => values[columns.indexOf(name)] ?? null));
    }
    return [];
  }

  private update(sql: string, params: unknown[]): unknown[] {
    const match = /^update (.+?) set (.+) where (.+)$/.exec(sql);
    if (!match) throw new Error(`unparsed update: ${sql}`);
    const table = this.tableOf(match[1]);
    const sets = unquote(match[2]);
    const keys = unquote(match[3]);
    const keyValues = params.slice(sets.length);
    const row = table.rows.find((candidate) =>
      keys.every((key, index) => String(candidate[table.columns.indexOf(key)]) === String(keyValues[index])),
    );
    if (!row) throw new Error(`no row in ${match[1]} to update`);
    sets.forEach((column, index) => {
      row[table.columns.indexOf(column)] = params[index];
    });
    return [];
  }

  private createTable(sql: string): unknown[] {
    const match = /^create table (\S+?\.\S+?|\S+) \((.*)\)$/s.exec(sql);
    if (!match) throw new Error(`unparsed create table: ${sql}`);
    const definitions = match[2].split(/, (?![^(]*\))/).filter((part) => !part.startsWith('primary key'));
    const columns = definitions.map((part) => (part.startsWith('"') ? unquote(part)[0] : part.split(' ')[0]));
    const target = match[1].replace(/\._plugin_migrations$/, '."_plugin_migrations"');
    this.tables.set(target, { columns, rows: [] });
    return [];
  }

  private declare(sql: string): unknown[] {
    const target = sql.slice(sql.lastIndexOf(' from ') + 6);
    const table = this.tableOf(target);
    const selected = [...sql.matchAll(/"((?:[^"]|"")*)"::text/g)].map((match) => match[1]);
    const tamper = this.tamper.get(target) ?? ((rows: unknown[][]) => rows);
    this.cursor = tamper(table.rows).map((row) =>
      Object.fromEntries(selected.map((name, index) => [`c${index}`, asText(row[table.columns.indexOf(name)])])),
    );
    return [];
  }
}

/**
 * An ORM whose connection is the fake: enough for the engine's bootstrap
 * (`schema-bootstrap.ts`) to run its empty-database path, and for the move to
 * reach the fake through `getClient()`.
 */
export function fakeMoveOrm(pg: FakePostgres, options: { pending?: string[]; known: string[] }): AnyOrm {
  const executed: string[] = [];
  const connection = {
    execute: vi.fn(async (sql: string) => {
      if (sql.includes('server_version_num')) return [{ schema: 'public', version: '170004', privileged: false }];
      const answer = await pg.executeQuery({ sql, parameters: [], query: undefined } as unknown as CompiledQuery);
      if (sql.startsWith('create table "baseline"')) pg.bootstrap();
      return answer.rows;
    }),
    transactional: vi.fn(async (work: (ctx: unknown) => Promise<void>) => work({})),
    getClient: () => pg.asKysely(),
  };
  const migrator = {
    getStorage: () => ({
      ensureTable: vi.fn(async () => undefined),
      setMasterMigration: vi.fn(),
      unsetMasterMigration: vi.fn(),
      logMigration: vi.fn(async ({ name }: { name: string }) => {
        executed.push(name);
      }),
    }),
    getExecuted: vi.fn(async () => executed.map((name) => ({ name }))),
    getPending: vi.fn(async () => (options.pending ?? []).map((name) => ({ name }))),
    up: vi.fn(async () => undefined),
  };
  return {
    config: { getExtension: () => migrator, get: () => ({ tableName: 'mikro_orm_migrations' }) },
    em: { getConnection: () => connection },
  } as unknown as AnyOrm;
}
