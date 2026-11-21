/**
 * Records what the database drivers are handed while a recording runs: each
 * statement's SQL text and its bound values, on SQLite (better-sqlite3) and on
 * Postgres (pg), below MikroORM and Kysely, so every statement the app sends
 * is seen whichever API built it.
 *
 * For suites that must prove a value never reached SQL (ROUTEID, in
 * route-row-ids.e2e.test.ts): a route that parsed '0x3ade68b1' with Number()
 * binds 987654321 even when no row has that id, which no answer would show.
 */
import Database from 'better-sqlite3';
import { createRequire } from 'node:module';
import path from 'node:path';

interface SentStatement {
  sql: string;
  values: unknown[];
}

type Method = (this: unknown, ...args: unknown[]) => unknown;
type Patchable = Record<string, Method>;

let recording: SentStatement[] | null = null;
const restores: Array<() => void> = [];

function flatten(args: unknown[]): unknown[] {
  return args.flatMap((arg) => {
    if (Array.isArray(arg)) return arg as unknown[];
    if (arg !== null && typeof arg === 'object') return Object.values(arg);
    return [arg];
  });
}

function patch(target: Patchable, name: string, record: (self: unknown, args: unknown[]) => void): void {
  const original = target[name];
  if (typeof original !== 'function') return;
  target[name] = function (this: unknown, ...args: unknown[]) {
    if (recording) record(this, args);
    return original.apply(this, args);
  };
  restores.push(() => {
    target[name] = original;
  });
}

/** better-sqlite3's Statement prototype: every statement of every handle runs through its methods. */
function patchSqlite(): void {
  const scratch = new Database(':memory:');
  const prepare = (Database.prototype as unknown as Patchable)['prepare'];
  const statementProto = Object.getPrototypeOf(prepare.call(scratch, 'SELECT 1')) as Patchable;
  scratch.close();
  for (const method of ['run', 'get', 'all', 'iterate']) {
    patch(statementProto, method, (self, args) => {
      recording?.push({ sql: String((self as { source?: unknown }).source ?? ''), values: flatten(args) });
    });
  }
}

/** pg's Client.prototype.query, which the pool's clients run every statement through. */
function patchPostgres(): void {
  // pg arrives with @mikro-orm/postgresql rather than as a dependency of the server's own.
  const fromServer = createRequire(path.join(process.cwd(), 'package.json'));
  const fromDriver = createRequire(fromServer.resolve('@mikro-orm/postgresql'));
  const pg = fromDriver('pg') as { Client: { prototype: Patchable } };
  patch(pg.Client.prototype, 'query', (_self, args) => {
    const [config, values] = args;
    if (typeof config === 'string') {
      recording?.push({ sql: config, values: Array.isArray(values) ? values : [] });
    } else if (config !== null && typeof config === 'object') {
      const query = config as { text?: unknown; values?: unknown };
      recording?.push({
        sql: String(query.text ?? ''),
        values: Array.isArray(query.values) ? query.values : Array.isArray(values) ? values : [],
      });
    }
  });
}

/** Wraps both drivers once per test file; `uninstallSqlCapture` puts them back. */
export function installSqlCapture(): void {
  if (restores.length > 0) return;
  patchSqlite();
  patchPostgres();
}

export function uninstallSqlCapture(): void {
  for (const restore of restores.splice(0).reverse()) restore();
  recording = null;
}

/** The statements the drivers were handed while `run` ran. */
export async function recordSql(run: () => Promise<unknown>): Promise<SentStatement[]> {
  const sent: SentStatement[] = [];
  recording = sent;
  try {
    await run();
  } finally {
    recording = null;
  }
  return sent;
}

/**
 * The first statement that carried `spelling` to the database, as a bound value
 * or quoted in its text, or the number `id` that Number() or parseInt() makes
 * of it; undefined when none did.
 */
export function carriedTo(sent: SentStatement[], spelling: string, id: number): string | undefined {
  const bare = new RegExp(`(^|[^0-9])${id}([^0-9]|$)`);
  return sent.find(
    ({ sql, values }) =>
      values.some((v) => v === spelling || v === id || v === String(id)) ||
      sql.includes(`'${spelling}'`) ||
      bare.test(sql),
  )?.sql;
}
