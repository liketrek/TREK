/**
 * TREK stores no NUL (U+0000) on either engine (src/db/nul-free.ts). These pin
 * the pieces every engine's write path runs through; the integration suite
 * tests/integration/places-nul.test.ts runs a write and a search through the
 * whole app on SQLite and on Postgres.
 */
import { TrekPostgreSqlPlatform } from '../../../src/db/engine/postgres/postgres-driver';
import { nulFreeJson, nulFreeParameter, stripNul, withNulFreeParameters } from '../../../src/db/nul-free';

import {
  type AbortableOperationOptions,
  CompiledQuery,
  type DatabaseConnection,
  type Dialect,
  type Driver,
  type QueryResult,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';
import { describe, expect, it } from 'vitest';

const RELEASE = Symbol('release');

/** A connection that records what it was sent and keeps a private release, like Kysely's Postgres one. */
class RecordingConnection implements DatabaseConnection {
  readonly sent: CompiledQuery[] = [];
  /** What came with each query besides itself: the chunk size of a stream, the abort options. */
  readonly extras: unknown[][] = [];
  released = false;
  #open = true;

  async executeQuery<R>(query: CompiledQuery, options?: AbortableOperationOptions): Promise<QueryResult<R>> {
    if (!this.#open) throw new Error('closed');
    this.sent.push(query);
    this.extras.push([options]);
    return { rows: [] };
  }

  async *streamQuery<R>(
    query: CompiledQuery,
    chunkSize: number,
    options?: AbortableOperationOptions,
  ): AsyncIterableIterator<QueryResult<R>> {
    this.sent.push(query);
    this.extras.push([chunkSize, options]);
    yield { rows: [] };
  }

  [RELEASE](): void {
    this.released = this.#open;
  }
}

function recordingDialect(connection: RecordingConnection): Dialect {
  const driver: Driver = {
    init: async () => undefined,
    acquireConnection: async () => connection,
    beginTransaction: async (c) => {
      await c.executeQuery(CompiledQuery.raw('begin'));
    },
    commitTransaction: async () => undefined,
    rollbackTransaction: async () => undefined,
    releaseConnection: async (c) => {
      (c as RecordingConnection)[RELEASE]();
    },
    destroy: async () => undefined,
  };
  return {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => driver,
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
}

describe('NUL-free values', () => {
  it('NULFREE-001: strips NUL from a string, from the strings of an array, and nothing else', () => {
    expect(stripNul('a\u0000b\u0000')).toBe('ab');
    expect(stripNul('a\\u0000b')).toBe('a\\u0000b');
    const plain = 'no nul';
    expect(stripNul(plain)).toBe(plain);
    expect(nulFreeParameter(['x\u0000', 2])).toEqual(['x', 2]);
    const numbers = [1, 2];
    expect(nulFreeParameter(numbers)).toBe(numbers);
    const bytes = Buffer.from([0, 1]);
    expect(nulFreeParameter(bytes)).toBe(bytes);
    expect(nulFreeParameter(null)).toBeNull();
  });

  it('NULFREE-002: strips NUL from every string of a JSON value, keys included', () => {
    expect(nulFreeJson({ 'a\u0000': ['b\u0000', 1, null, { c: 'd\u0000' }] })).toEqual({
      a: ['b', 1, null, { c: 'd' }],
    });
    const date = new Date(0);
    expect(nulFreeJson(date)).toBe(date);
  });

  it("NULFREE-003: a dialect's connections send every parameter without NUL and keep the rest of the query", async () => {
    const connection = new RecordingConnection();
    const driver = withNulFreeParameters(recordingDialect(connection)).createDriver();
    const acquired = await driver.acquireConnection();
    expect(await driver.acquireConnection()).toBe(acquired);

    const clean = CompiledQuery.raw('select ?', ['clean']);
    await acquired.executeQuery(clean);
    expect(connection.sent[0]).toBe(clean);

    await acquired.executeQuery(CompiledQuery.raw('insert into t values (?, ?, ?)', ['a\u0000b', 3, ['c\u0000']]));
    expect(connection.sent[1].sql).toBe('insert into t values (?, ?, ?)');
    expect(connection.sent[1].parameters).toEqual(['ab', 3, ['c']]);

    for await (const chunk of acquired.streamQuery(CompiledQuery.raw('select ?', ['s\u0000']), 10)) {
      expect(chunk.rows).toEqual([]);
    }
    expect(connection.sent[2].parameters).toEqual(['s']);

    // The driver's own methods get the wrapped connection and still reach its private state.
    await driver.beginTransaction(acquired, {});
    expect(connection.sent[3].sql).toBe('begin');
    await driver.releaseConnection(acquired);
    expect(connection.released).toBe(true);
  });

  it('NULFREE-005: the chunk size of a stream and the abort options reach the connection as they were given', async () => {
    const connection = new RecordingConnection();
    const acquired = await withNulFreeParameters(recordingDialect(connection)).createDriver().acquireConnection();
    const options: AbortableOperationOptions = { signal: new AbortController().signal };

    await acquired.executeQuery(CompiledQuery.raw('select ?', ['a\u0000']), options);
    for await (const chunk of acquired.streamQuery(CompiledQuery.raw('select 1'), 25, options)) {
      expect(chunk.rows).toEqual([]);
    }
    expect(connection.extras).toEqual([[options], [25, options]]);
    expect(connection.extras[0][0]).toBe(options);
    expect(connection.extras[1][1]).toBe(options);
  });

  it('NULFREE-004: the Postgres platform inlines strings and serializes JSON without NUL', () => {
    const platform = new TrekPostgreSqlPlatform();
    expect(platform.escape("o\u0000'k")).toBe("'o''k'");
    expect(platform.formatQuery('select ?', ['x\u0000y'])).toBe("select 'xy'");
    expect(platform.convertJsonToDatabaseValue({ k: 'v\u0000' })).toBe('{"k":"v"}');
  });
});
