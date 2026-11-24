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
 *   statements of the repositories;
 * - the move from SQLite to Postgres (`engine/postgres/sqlite-move/values.ts`)
 *   drops it from TREK's own text only when the operator asks for it
 *   (`--drop-nul`) and lists each value it changed; by default it refuses
 *   such a value, since the move changes nothing silently.
 *
 * A plugin's own data (`db:own`) is not TREK's to change: the stores of both
 * engines (`engine/sqlite/plugin-data-store.ts`,
 * `engine/postgres/plugin-data-store.ts`) refuse SQL, an argument or a
 * migration id holding one with the same error (`engine/plugin-data-contract.ts`)
 * instead of dropping it, so a key never changes meaning.
 *
 * A filter is stripped as well as a write, so a lookup finds what the write
 * stored. Text that spells the character as the six characters `\u0000`
 * (JSON already encoded to a string) is left alone: it holds no NUL.
 *
 * What a client sends loses the character earlier still, before any logic
 * runs ({@link nulFreeInput}), so the application never holds a value the
 * database would store differently. The stripping here is the backstop for
 * everything that does not arrive through a request.
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

/**
 * The keys whose string value is a password TREK only ever hashes with bcrypt
 * or compares with a bcrypt hash: signup and login (`password`), the password
 * change (`current_password`, `new_password`), the reset (`new_password`),
 * an admin creating or editing an account (`password`), and the re-entry
 * that guards MFA and passkey changes (`password`). Matched exactly, on the
 * key without its NUL characters, at any depth, so the `password` of a
 * document connection's `credentials` stays as sent too; that one is stored
 * only encrypted, never as text. Every other key loses its NUL like any
 * other input, however it is named: the settings
 * `password_login` and `password_registration` are flags, a Synology
 * password or an OIDC client secret is stored encrypted and handed to
 * another server. `tests/unit/db/nul-free.test.ts` fails on a field of the
 * shared schemas named like a secret that is neither listed here nor
 * decided against in its list there.
 */
export const HASHED_PASSWORD_KEYS: ReadonlySet<string> = new Set(['password', 'current_password', 'new_password']);

/**
 * A request's input as the application handles it: every string in it, object
 * keys included, without NUL. The HTTP layer, the websocket adapter and the
 * MCP input mapper pass what a client sends through this before any logic runs
 * (`nest/common/nul-free-input.ts`), so a throttle, a rate-limit key, a
 * uniqueness check or an audit line sees the same value the database later
 * stores and filters by. Without it `victim@x.test\u0000` was a new key for
 * the per-email reset throttle while the lookup found the victim's row.
 *
 * A string under one of {@link HASHED_PASSWORD_KEYS} is left exactly as
 * sent. Such a password never reaches the database as text, only as its
 * bcrypt hash, so the stores above never meet it, and bcryptjs hashes a NUL
 * like any other byte. Stripping it here would change the hash input and lock
 * out an account whose password was set with a NUL before this rule existed;
 * left alone, signup, login and a password change all hash the same string.
 *
 * Returns the same value, by identity, when it holds no NUL. Arrays and plain
 * objects (null-prototype ones too, the shape a query or multipart parser
 * builds) are walked; any other value is returned as it is.
 */
export function nulFreeInput(value: unknown): unknown {
  return nulFreeInputValue(value, false);
}

function nulFreeInputValue(value: unknown, password: boolean): unknown {
  if (typeof value === 'string') return password ? value : stripNul(value);
  if (Array.isArray(value)) {
    const items = value.map((item: unknown) => nulFreeInputValue(item, password));
    return items.some((item, i) => item !== value[i]) ? items : value;
  }
  if (value === null || typeof value !== 'object') return value;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  const entries = Object.entries(value as Record<string, unknown>);
  const cleaned = entries.map(([key, item]) => {
    const name = stripNul(key);
    return [name, nulFreeInputValue(item, HASHED_PASSWORD_KEYS.has(name))] as const;
  });
  if (cleaned.every(([key, item], i) => key === entries[i][0] && item === entries[i][1])) return value;
  // Defined, not assigned, so a key named `__proto__` stays a plain property.
  const copy = Object.create(prototype as object | null) as Record<string, unknown>;
  for (const [key, item] of cleaned) {
    Object.defineProperty(copy, key, { value: item, enumerable: true, writable: true, configurable: true });
  }
  return copy;
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
