import type { AbortableOperationOptions, CompiledQuery, DatabaseConnection, Dialect, Driver } from 'kysely';

/**
 * TREK stores no U+0000 (NUL) in text, on either engine.
 *
 * Postgres cannot hold the character in `text` at all: a statement that binds
 * or spells one fails, so a NUL arriving from anywhere (a request body, a
 * query string, an import, a provider's feed, a forwarded mail, a plugin)
 * answered a 500 on Postgres where SQLite stored it. NUL is a control
 * character, never part of a name, a note or an address, so instead of
 * refusing the write both engines drop it from every string a statement
 * carries, and an install holds the same text on either engine.
 *
 * It happens once, where every value leaves for the database, so no caller
 * can forget it:
 * - the MikroORM platforms (`nul-safe-sqlite-platform.ts`, and the Postgres
 *   platform in `engine/postgres/postgres-driver.ts`) render every string
 *   they inline into a statement through {@link stripNul}, and every JSON
 *   value they serialize through {@link nulFreeJson};
 * - the Kysely dialects of both engines (`orm-driver.ts`,
 *   `engine/postgres/postgres-driver.ts`) send every query's parameters
 *   through {@link withNulFreeParameters}, which covers the Kysely
 *   statements of the repositories and a plugin's own SQL on Postgres;
 * - a plugin's own SQLite file (`nest/plugins/host/plugin-data.service.ts`)
 *   binds its arguments through {@link nulFreeParameter};
 * - the move from SQLite to Postgres (`engine/postgres/sqlite-move/values.ts`)
 *   copies text the same way.
 *
 * A filter is stripped as well as a write, so a lookup finds what the write
 * stored. Text that spells the character as the six characters `\u0000`
 * (JSON already encoded to a string) is left alone: it holds no NUL.
 */

const NUL = '\u0000';

/** `text` without its NUL characters. */
export function stripNul(text: string): string {
  return text.includes(NUL) ? text.replaceAll(NUL, '') : text;
}

/** A bound parameter without NUL: a string, or each string of an array; any other value as it is. */
export function nulFreeParameter(value: unknown): unknown {
  if (typeof value === 'string') return stripNul(value);
  if (Array.isArray(value)) return value.some((item) => typeof item === 'string') ? value.map(nulFreeParameter) : value;
  return value;
}

/** A value about to be serialized as JSON, with every string in it, object keys included, without NUL. */
export function nulFreeJson(value: unknown): unknown {
  if (typeof value === 'string') return stripNul(value);
  if (Array.isArray(value)) return value.map(nulFreeJson);
  if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [stripNul(key), nulFreeJson(item)]),
    );
  }
  return value;
}

/** `query` with its parameters passed through {@link nulFreeParameter}; the same object when none holds a NUL. */
function nulFreeQuery(query: CompiledQuery): CompiledQuery {
  const parameters = query.parameters.map(nulFreeParameter);
  if (parameters.every((value, i) => value === query.parameters[i])) return query;
  return { ...query, parameters };
}

/**
 * `target` with `replaced` in place of some of its members. Every other member
 * is the target's own, a method bound to the target, so a driver that reaches
 * a connection's private state (Kysely's Postgres driver releases a
 * connection through a private method) still finds it.
 */
function overriding<T extends object>(target: T, replaced: Partial<T>): T {
  return new Proxy(target, {
    get(object, key) {
      if (Object.prototype.hasOwnProperty.call(replaced, key)) return replaced[key as keyof T];
      const member: unknown = Reflect.get(object, key, object);
      return typeof member === 'function' ? member.bind(object) : member;
    },
  });
}

/** `driver`, whose connections send every query's parameters without NUL. */
function nulFreeDriver(driver: Driver): Driver {
  const wrapped = new WeakMap<DatabaseConnection, DatabaseConnection>();
  const wrap = (connection: DatabaseConnection): DatabaseConnection => {
    let proxy = wrapped.get(connection);
    if (!proxy) {
      proxy = overriding(connection, {
        executeQuery: <R>(query: CompiledQuery, options?: AbortableOperationOptions) =>
          connection.executeQuery<R>(nulFreeQuery(query), options),
        streamQuery: <R>(query: CompiledQuery, chunkSize: number, options?: AbortableOperationOptions) =>
          connection.streamQuery<R>(nulFreeQuery(query), chunkSize, options),
      });
      wrapped.set(connection, proxy);
    }
    return proxy;
  };
  return overriding(driver, { acquireConnection: async () => wrap(await driver.acquireConnection()) });
}

/** `dialect`, whose driver sends every query's parameters without NUL; the rest is its own. */
export function withNulFreeParameters(dialect: Dialect): Dialect {
  return {
    createAdapter: () => dialect.createAdapter(),
    createDriver: () => nulFreeDriver(dialect.createDriver()),
    createIntrospector: (db) => dialect.createIntrospector(db),
    createQueryCompiler: () => dialect.createQueryCompiler(),
  };
}
