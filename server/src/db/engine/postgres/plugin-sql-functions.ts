import fs from 'node:fs';
import path from 'node:path';

/**
 * Which of Postgres's own functions a plugin's SQL may call.
 *
 * A plugin's statements run on the plugin's `search_path`, its schema and
 * `pg_temp`, and a plugin cannot create a function (the guard refuses CREATE
 * FUNCTION). So an unqualified call either finds nothing, finds one of the
 * functions its range types bring along, or finds a function of `pg_catalog`,
 * which Postgres searches first. Many of those read the catalogs or the
 * server rather than the values handed to them: `obj_description` and
 * `col_description` return the comment on any object by its OID,
 * `format_type` names a type by its OID, `version()`, `current_database()` and
 * `inet_server_addr()` describe the server, `txid_current()` the cluster's
 * activity. Listing those one by one would miss the next one Postgres adds.
 *
 * So the rule is an allowlist: a call to a function of `pg_catalog` is
 * refused unless its name is in {@link PLUGIN_FUNCTIONS_FILE}, the string, math,
 * date and time, JSON, array, range, aggregate, window, UUID and text search
 * functions a data plugin plausibly needs, each of which works only on its
 * arguments. None of them takes or returns a type that looks an object up by
 * a name (`regconfig`, `regclass`, ..., `aclitem`): such a parameter turns a
 * text argument into a catalog lookup, so `to_tsvector('schema.cfg', ...)`
 * would tell whether a schema exists. None returns a transaction id type
 * either, so the only ways to an `xid` value, which `age(xid)` turns into
 * the server's transaction counter, are the system columns and the type's
 * name, which the guard refuses. PGPLUG-022 checks every overload of every
 * listed name on the lane's server.
 *
 * A name counts as called when `(` follows it (`version()`, `"version" ()`)
 * or when it follows a dot, Postgres's column notation for a call
 * (`(16386::oid).obj_description`, `u.obj_description` over `FROM
 * unnest(...) u`, `$1.obj_description`), unless it is one of
 * {@link COLUMN_NAMES}. A plugin's own table or type may still carry such a
 * name where it cannot be a call: after INTO, TABLE, VIEW, REFERENCES or IF
 * NOT EXISTS (`INSERT INTO version (...)`).
 *
 * Which names are functions of `pg_catalog` is read from
 * `assets/postgres/catalog-functions.txt`: every function name of every
 * supported major (14 to 18; the boot refuses any other server). The Postgres
 * lane compares it with `pg_proc` on the server it runs on and fails on a
 * name missing there (PGPLUG-021), so a new major cannot add a function a
 * plugin may call without someone deciding whether it belongs here.
 *
 * The SQL keywords that call a function without parentheses
 * ({@link SESSION_KEYWORDS}: `current_user`, `current_catalog`, ...) are
 * refused unquoted wherever they appear; quoted they are plain names. A
 * name starting with `pg_` is refused anywhere by the guard itself.
 */

/**
 * The SQL keywords that call a catalog function without parentheses and
 * describe the session or the server: the role names, the database and the
 * schema. Refused unquoted anywhere; a quoted `"user"` is a column.
 */
export const SESSION_KEYWORDS: ReadonlySet<string> = new Set([
  'current_catalog',
  'current_role',
  'current_schema',
  'current_user',
  'session_user',
  'system_user',
  'user',
]);

/**
 * The refused names a plugin's table may well have as a column, which may
 * still follow a table, an alias or a parameter and a dot (`t.name`,
 * `n.version`). Postgres reads `x.f` as the column `f` of `x` and, when `x`
 * has no such column, as the call `f(x)`: with a function in FROM that
 * returns a single value (`FROM unnest(...) u`, `FROM generate_series(...)
 * g`) or a parameter (`$1.f`), that value is the argument. None of these
 * reads anything called that way: `version` takes no argument, so the
 * notation never calls it, and `money`, `name`, `oid` and `xml` only
 * convert their argument to the type of that name. Every other refused name
 * is refused after a dot too. `xid` is not here: `u.xid` casts `u` to the
 * transaction id type, whose `age()` reads the server's transaction counter.
 * PGPLUG-021 holds each name here to that on the lane's server.
 */
export const COLUMN_NAMES: ReadonlySet<string> = new Set(['money', 'name', 'oid', 'version', 'xml']);

/** The function names of `pg_catalog` on every supported major, one per line, sorted. */
export const CATALOG_FUNCTIONS_FILE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'assets',
  'postgres',
  'catalog-functions.txt',
);

/**
 * The functions of `pg_catalog` a plugin may call, one per line, grouped under
 * `#` comments. A list of names, not SQL, so it is kept as data beside the
 * catalog list. Each must exist in that list (a unit test checks).
 */
export const PLUGIN_FUNCTIONS_FILE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'assets',
  'postgres',
  'plugin-functions.txt',
);

/** The names in `file`: its lines without blanks and `#` comments. */
function namesIn(file: string): ReadonlySet<string> {
  return new Set(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#')),
  );
}

let catalog: ReadonlySet<string> | undefined;
let allowed: ReadonlySet<string> | undefined;

/** The names in {@link CATALOG_FUNCTIONS_FILE}, read once. */
export function catalogFunctionNames(): ReadonlySet<string> {
  catalog ??= namesIn(CATALOG_FUNCTIONS_FILE);
  return catalog;
}

/** The names in {@link PLUGIN_FUNCTIONS_FILE}, read once. */
export function pluginFunctionNames(): ReadonlySet<string> {
  allowed ??= namesIn(PLUGIN_FUNCTIONS_FILE);
  return allowed;
}

/** Whether calling `name` reaches a function of `pg_catalog` a plugin may not call. */
export function refusedCatalogCall(name: string): boolean {
  return !pluginFunctionNames().has(name) && catalogFunctionNames().has(name);
}

/**
 * Whether `name` after a dot (`x.name`, the column notation) may call a
 * function of `pg_catalog` a plugin may not call: one of
 * {@link refusedCatalogCall} that is not in {@link COLUMN_NAMES}.
 */
export function refusedCatalogField(name: string): boolean {
  return refusedCatalogCall(name) && !COLUMN_NAMES.has(name);
}
