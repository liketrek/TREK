/**
 * TREK stores no NUL (U+0000) on either engine (src/db/nul-free.ts). These pin
 * the pieces every engine's write path runs through; the integration suite
 * tests/integration/places-nul.test.ts runs a write and a search through the
 * whole app on SQLite and on Postgres.
 */
import { TrekPostgreSqlPlatform } from '../../../src/db/engine/postgres/postgres-driver';
import {
  HASHED_PASSWORD_KEYS,
  nulFreeInput,
  nulFreeJson,
  nulFreeParameter,
  stripNul,
  withNulFreeParameters,
} from '../../../src/db/nul-free';

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
import fs from 'node:fs';
import path from 'node:path';
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

describe('nulFreeInput: a request value as the application handles it', () => {
  it('drops NUL from every string and key, in arrays and nested objects', () => {
    expect(nulFreeInput('victim@x.test\u0000')).toBe('victim@x.test');
    expect(nulFreeInput({ 'na\u0000me': ['a\u0000', { deep: 'b\u0000c' }], n: 1, ok: true, none: null })).toEqual({
      name: ['a', { deep: 'bc' }],
      n: 1,
      ok: true,
      none: null,
    });
  });

  it('returns the very same value when nothing holds a NUL', () => {
    const body = { email: 'a@b.c', tags: ['x', 'y'], nested: { k: 'v' } };
    expect(nulFreeInput(body)).toBe(body);
    const list = ['a', 'b'];
    expect(nulFreeInput(list)).toBe(list);
  });

  it('leaves a password TREK only hashes exactly as sent, at any depth', () => {
    const body = {
      email: 'a@b.c\u0000',
      password: 'pa\u0000ss',
      new_password: 'n\u0000ew',
      current_password: 'c\u0000ur',
      credentials: { password: 'na\u0000s' },
    };
    expect(nulFreeInput(body)).toEqual({
      email: 'a@b.c',
      password: 'pa\u0000ss',
      new_password: 'n\u0000ew',
      current_password: 'c\u0000ur',
      credentials: { password: 'na\u0000s' },
    });
  });

  it('cleans every other key that only mentions a password, so a check sees the value the database stores', () => {
    expect(
      nulFreeInput({
        password_login: 'true\u0000',
        password_registration: 'false\u0000',
        password_hint: 'h\u0000int',
        synology_password: 's\u0000y',
        Password: 'P\u0000w',
      }),
    ).toEqual({
      password_login: 'true',
      password_registration: 'false',
      password_hint: 'hint',
      synology_password: 'sy',
      Password: 'Pw',
    });
  });

  it('decides on the key as the application reads it, without its NUL', () => {
    expect(nulFreeInput({ 'pass\u0000word': 'pa\u0000ss' })).toEqual({ password: 'pa\u0000ss' });
  });

  it('still walks an object under a password key, only its strings stay as sent', () => {
    expect(nulFreeInput({ passwordReset: { note: 'x\u0000' } })).toEqual({ passwordReset: { note: 'x' } });
  });

  it('keeps a null prototype, and a `__proto__` key stays a plain property', () => {
    const fields = Object.create(null) as Record<string, unknown>;
    fields.title = 't\u0000';
    const cleaned = nulFreeInput(fields) as Record<string, unknown>;
    expect(Object.getPrototypeOf(cleaned)).toBeNull();
    expect(cleaned.title).toBe('t');

    const hostile = JSON.parse('{"__proto__": {"polluted": "y\\u0000"}, "a": "b\\u0000"}') as object;
    const out = nulFreeInput(hostile) as Record<string, unknown>;
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(out, '__proto__')).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(out.a).toBe('b');
  });

  it('leaves anything that is not a string, an array or a plain object alone', () => {
    const buffer = Buffer.from('a\u0000b');
    const date = new Date(0);
    expect(nulFreeInput(buffer)).toBe(buffer);
    expect(nulFreeInput(date)).toBe(date);
    expect(nulFreeInput(5)).toBe(5);
    expect(nulFreeInput(undefined)).toBeUndefined();
    const file = { originalname: 'pho\u0000to.jpg', buffer };
    expect(nulFreeInput(file)).toEqual({ originalname: 'photo.jpg', buffer });
  });
});

/**
 * Every field of the shared schemas and every instance setting whose name
 * looks like a secret, with the reason it is not one of
 * {@link HASHED_PASSWORD_KEYS}: it loses its NUL like any other input.
 */
const NOT_HASHED: Record<string, string> = {
  password_login: 'an instance setting holding the flag true or false',
  password_registration: 'an instance setting holding the flag true or false',
  synology_password: 'stored encrypted and sent to the Synology API, like every other provider credential',
  passphrase: "a Synology shared album's passphrase, stored and sent to the Synology API",
  client_secret: "an OAuth client's or the OIDC provider's secret, stored or compared as text",
  oidc_client_secret: 'stored encrypted and sent to the OIDC provider',
  mail_ingest_webhook_secret: 'compared with the secret a mail webhook presents',
  secret: "a plugin setting's flag that marks a field as secret",
};

/** The object keys named like a secret in `files` and in the TypeScript under `dir` (specs and locales left out). */
function secretLikeKeys(dir: string | null, files: string[] = []): Set<string> {
  const visit = (at: string) => {
    for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
      const full = path.join(at, entry.name);
      if (entry.isDirectory() && entry.name !== 'i18n') visit(full);
      else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(full);
    }
  };
  if (dir !== null) visit(dir);
  const keys = new Set<string>();
  for (const file of files) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/^\s*['"]?([A-Za-z_]\w*)['"]?\??\s*:/gm)) {
      if (/password|passphrase|secret/i.test(match[1])) keys.add(match[1]);
    }
  }
  return keys;
}

describe('which secrets keep a NUL: a decision for every field named like one', () => {
  const server = path.join(__dirname, '..', '..', '..');
  const keys = new Set([
    ...secretLikeKeys(path.join(server, '..', 'shared', 'src')),
    ...secretLikeKeys(null, [path.join(server, 'src', 'nest', 'common', 'app-settings.registry.ts')]),
  ]);

  it('reads the fields of the shared schemas and the instance settings', () => {
    expect(keys.has('new_password')).toBe(true);
    expect(keys.has('password_login')).toBe(true);
  });

  it('has each one either hashed or decided against, so a new one joins neither rule unseen', () => {
    const undecided = [...keys].filter((key) => !HASHED_PASSWORD_KEYS.has(key) && !(key in NOT_HASHED));
    expect(
      undecided,
      'A field named like a secret has no decision. If TREK only ever hashes it with bcrypt, add it to ' +
        'HASHED_PASSWORD_KEYS in src/db/nul-free.ts; otherwise add it to NOT_HASHED here with the reason.',
    ).toEqual([]);
  });

  it('keeps no decision for a field that is gone', () => {
    const stale = [...HASHED_PASSWORD_KEYS, ...Object.keys(NOT_HASHED)].filter((key) => !keys.has(key));
    expect(stale).toEqual([]);
  });
});
