/**
 * The settings every plugin transaction on Postgres runs with, so that what
 * a plugin reads never depends on how the server is configured.
 *
 * Postgres formats and parses values by settings the server, the database or
 * TREK's role may set: `TimeZone` decides how a `timestamptz` prints and
 * where `date_trunc('day', now())` cuts, `lc_monetary` how `money` prints,
 * `lc_numeric` and `lc_time` what `to_char` writes, `DateStyle` how
 * `'01/02/2020'` reads, `default_text_search_config` what `text @@ text`
 * matches. Left to the server, a plugin would answer differently on two
 * installs, and its output would tell it how the server is set up (its time
 * zone, its locale). SQLite has no such settings: its dates are UTC and its
 * numbers plain.
 *
 * So the store sets each of these with `SET LOCAL` at the start of every
 * plugin transaction (`plugin-data-store.ts`), to Postgres's own built-in
 * default (what a server with an untouched configuration gives), with the
 * time zone UTC as on SQLite. `SET LOCAL` ends with the transaction, so
 * nothing reaches TREK's own use of the pool connection. A plugin cannot
 * change them: the guard refuses `SET`, `set_config` and `current_setting`.
 *
 * The `search_path` and `statement_timeout` are set by the store per call,
 * since they depend on the plugin and its time budget. The Postgres lane
 * (PGPLUG-023) lists every setting of the server a client may change in the
 * categories that cover output and statement behaviour, and fails on one
 * that is neither pinned here nor named there as one that cannot change what
 * a plugin reads, so a setting a new Postgres adds is decided on, not missed.
 */
export const PLUGIN_SESSION_SETTINGS: Readonly<Record<string, string>> = {
  // How dates, times and intervals print and parse.
  TimeZone: 'UTC',
  DateStyle: 'ISO, MDY',
  IntervalStyle: 'postgres',
  timezone_abbreviations: 'Default',
  // How money, numbers and month and day names print (`money`, `to_char`, `to_number`).
  lc_monetary: 'C',
  lc_numeric: 'C',
  lc_time: 'C',
  // How floating point numbers, bytea and xml print and parse.
  extra_float_digits: '1',
  bytea_output: 'hex',
  xmlbinary: 'base64',
  xmloption: 'content',
  // The configuration `text @@ text` and the other text search defaults use.
  default_text_search_config: 'pg_catalog.simple',
  // How SQL reads: string literals, NULL in array input, `x = NULL`, `quote_ident`.
  standard_conforming_strings: 'on',
  backslash_quote: 'safe_encoding',
  array_nulls: 'on',
  transform_null_equals: 'off',
  quote_all_identifiers: 'off',
  // How many rows a GIN index search may return; 0 is all of them.
  gin_fuzzy_search_limit: '0',
};

/** The `SET LOCAL` statements for {@link PLUGIN_SESSION_SETTINGS}, in one string. */
export function pluginSessionSql(): string {
  return Object.entries(PLUGIN_SESSION_SETTINGS)
    .map(([name, value]) => `set local ${name} to '${value}'`)
    .join(';\n');
}
