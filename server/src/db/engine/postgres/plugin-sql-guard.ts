import { PLUGIN_DATA_ERRORS, PLUGIN_TRANSACTION_CONTROL, refuseNulSql } from '../plugin-data-contract';
import { PLUGIN_SCHEMA_PREFIX } from './plugin-schema';
import { refusedCatalogCall, refusedCatalogField, SESSION_KEYWORDS } from './plugin-sql-functions';

/**
 * What keeps a plugin's own SQL on Postgres inside its own schema.
 *
 * On SQLite a plugin's database is a file of its own, so it cannot name
 * TREK's tables at all. On Postgres its schema sits in TREK's database and
 * its statements run as TREK's role, which may read every table TREK has: a
 * role per plugin would need CREATEROLE, which TREK's role is not given. So
 * the store (`plugin-data-store.ts`) keeps it in with layers that each hold
 * on their own for what they cover, the ones after this guard enforced by
 * the database itself:
 *
 * 1. No plugin SQL at all while TREK's role is privileged in the sense of the
 *    restore check (`PRIVILEGED_ROLE_SQL` in `server-checks.ts`: a superuser
 *    or a member of one, a role that may reach the server's files or
 *    programs, ...): every `db:own` call fails with
 *    `PRIVILEGED_ROLE_PLUGIN_REFUSAL`, and the boot log says why
 *    (`plugin-data-checks.ts`). Such a role may change the system catalogs,
 *    which no check on the SQL text can rule out.
 * 2. This guard holds each statement to what cannot leave the schema, before
 *    it runs (below).
 * 3. Every existing object a statement changes ({@link PluginTarget}: the
 *    target of an ALTER, DROP, REFRESH, TRUNCATE or CREATE INDEX ... ON, and
 *    the tables a CREATE or ALTER TABLE ties to its own) is resolved by
 *    Postgres in the transaction, right before the statement, with
 *    `to_regclass` or `to_regtype` on the plugin's `search_path`, and the
 *    statement is refused unless each one found lies in the plugin's schema.
 *    `pg_catalog` is searched first, so an unqualified `int4`, `text` or
 *    `box` is the catalog's type and refused, on a superuser connection too.
 * 4. The store sends every statement on its own over the extended query
 *    protocol, on a pool client it checked out for the call: Postgres parses
 *    exactly one statement there, so a second statement the guard missed is
 *    an error, never run.
 * 5. The transaction puts the plugin's schema on the `search_path` with
 *    `pg_temp` explicitly last, TREK's own pool connections put `pg_temp`
 *    last too (`session-search-path.ts`), and the store drops every
 *    temporary table on its client before giving it back, so a temporary
 *    table never stands in for a table of TREK's or of the plugin's.
 * 6. A call that may write is held to the disk quota, counted over every
 *    relation of the schema with its TOAST table, and to
 *    `PLUGIN_SCHEMA_MAX_OBJECTS` catalog objects, so views, types and enum
 *    labels, which take no disk space of their own, are bounded too.
 *
 * The SQL is split into tokens the way Postgres's own lexer splits it (string
 * and identifier quoting, comments, dollar signs). Where JavaScript and the
 * Postgres lexer would read a character differently, the guard refuses it
 * instead of guessing: whitespace is exactly what Postgres skips (space, tab,
 * CR, LF, form feed), a `--` comment ends at CR or LF as it does there, and
 * any other control character, or whitespace past ASCII (U+00A0, U+FEFF,
 * U+2028, ...), outside a string, a quoted name or a comment is refused. A
 * NUL is refused anywhere, strings included: the protocol ends a statement's
 * text there. The SQL is refused when it holds:
 *
 * - a statement other than SELECT, INSERT, UPDATE, DELETE, MERGE, WITH,
 *   VALUES, TABLE, TRUNCATE, REFRESH, or a CREATE, ALTER or DROP of a table,
 *   index, view, materialized view, sequence or type (a composite, enum or
 *   range type; a base type is built from C functions). No function, schema,
 *   role, setting, transaction control, COPY, LOCK, prepared statement or
 *   notification. Several statements are split at their semicolons and each
 *   is checked;
 * - a qualified name whose qualifier is another schema of the database
 *   (`public.users`, another plugin's schema), or any name starting with
 *   `pg_` or naming `information_schema`: the catalogs, the server functions
 *   and the temporary schema;
 * - a function that runs SQL handed to it as text (`query_to_xml`, `ts_stat`,
 *   `ts_rewrite`), reads or changes settings (`set_config`,
 *   `current_setting`), reaches objects by a name in a string (`nextval`,
 *   `setval`, `has_table_privilege` and its siblings, `currtid2`, the BRIN
 *   and GIN maintenance functions, `to_reg*`), large objects (`lo_*`) or
 *   `dblink`;
 * - a call to a function of `pg_catalog` that is not on the allowlist in
 *   `plugin-sql-functions.ts` (`obj_description`, `format_type`, `version`,
 *   `current_database`, ...: whatever reads the catalogs or the server rather
 *   than its arguments), in either spelling of a call (`f(...)`, or the
 *   column notation `(x).f`, `u.f`, `$1.f`), and the keywords that name the
 *   session's roles, database or schema (`current_user`, `session_user`,
 *   `current_catalog`, ...);
 * - the object identifier types that look an object up by name
 *   (`regclass`, `regtype`, `regproc`, `regprocedure`, `regoper`,
 *   `regoperator`, `regconfig`, `regdictionary`, `regnamespace`, `regrole`,
 *   `regcollation`, and their array types `_regclass`, ...), in every
 *   spelling: `'x'::regtype`, `CAST('x' AS regtype)`, `regtype 'x'`, quoted;
 *   and `aclitem`, whose input and output name roles;
 * - a read of a system column every Postgres table has (`xmin`, `xmax`,
 *   `cmin`, `cmax`, `ctid`, `tableoid`), quoted or not: they show the
 *   server's transaction ids, where a row sits on disk and the table's OID,
 *   and SQLite has none of them. Nothing of TREK's reads them either; a
 *   plugin that wants optimistic locking keeps a version column of its own.
 *   The name may still be given to a value of the plugin's own, after AS or
 *   in the column list of a WITH query or an alias (`min(lng) AS xmin`);
 * - the transaction id types `xid` and `xid8` (and `_xid`, `_xid8`) where
 *   the word stands for the type: `age('3'::xid)` is how many transactions
 *   the cluster ran since. That is after `::`, before a string, as a call
 *   or after a dot (`xid(x)` and `x.xid` are casts when `x` has no such
 *   column), after AS in a CAST, and after any word but the keywords that
 *   precede a column (`c xid` in a column definition, `TYPE xid`). A column
 *   of the plugin's own may be called `xid` (`SELECT xid FROM payments`);
 * - a collation other than `"C"`, `"POSIX"`, `"default"` and `ucs_basic`,
 *   and an access method other than the built-in ones (`USING bloom`): which
 *   others exist depends on the server's locales, ICU and extensions, so
 *   naming one would tell a plugin about the server;
 * - a temporary object: CREATE TEMP or TEMPORARY (also after OR REPLACE,
 *   LOCAL or GLOBAL), and SELECT ... INTO TEMP; a temporary table outlives
 *   the call on a pooled connection. Elsewhere `temp` is an ordinary name;
 * - INTO anywhere but right after the verb INSERT or MERGE of the statement
 *   itself or of a WITH query's body, at any depth of parentheses: `SELECT
 *   ... INTO` creates a table outside what CREATE is held to, and in `SELECT
 *   1 insert INTO t` the word `insert` is only a column alias;
 * - `WITH RECURSIVE`, refused on SQLite too;
 * - in an ALTER, a change of a table's schema, owner or tablespace;
 * - escape strings (`E'...'`), Unicode escapes (`U&'...'`), dollar-quoted
 *   strings, hexadecimal, octal and binary numbers, digit separators (`1_000`)
 *   and a number running straight into a name, whose reading differs between
 *   Postgres versions and settings (before 16, Postgres reads `0x1F` as `0 AS x1F`).
 *
 * An alias that happens to share a schema's name (`auth.id` on a database
 * that has an `auth` schema) is refused too; the plugin renames the alias.
 */

/** Why a plugin's SQL is refused. The message is the plugin's to read, so it says what to change. */
export class PluginSqlRefused extends Error {
  constructor(reason: string) {
    super(`${PLUGIN_DATA_ERRORS.statementNotAllowed}: ${reason}`);
    this.name = 'PluginSqlRefused';
  }
}

/**
 * Transaction control, refused with the contract's whole sentence
 * (`PLUGIN_DATA_ERRORS.txControl`), which the SQLite store and the SDK throw
 * too, so a plugin reads the same words on both engines.
 */
class TransactionControlRefused extends PluginSqlRefused {
  constructor() {
    super('');
    this.message = PLUGIN_DATA_ERRORS.txControl;
  }
}

/** One token of plugin SQL. A word is a name or a keyword: `value` is folded to lower case unless it was quoted. */
type Token = (
  | { kind: 'word'; value: string; quoted: boolean }
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'param' }
  | { kind: 'punct'; value: string }
) & {
  /** Where the token starts in the SQL text. */
  at: number;
};

/** One statement of plugin SQL: its tokens, without the semicolon that ended it. */
export interface PluginStatement {
  /** The statement's own text, as Postgres is handed it. */
  readonly text: string;
  readonly tokens: readonly Token[];
  /** Whether it returns rows: a SELECT, VALUES or TABLE, or anything with a RETURNING clause. */
  readonly returnsRows: boolean;
  /** Whether it may change data or schema, which is what the disk quota is checked after. */
  readonly mayWrite: boolean;
  /** Whether it names a qualified object (`x.y`), which needs the database's schema names to check. */
  readonly qualifies: boolean;
  /** How many `$n` placeholders it holds. */
  readonly params: number;
  /**
   * The existing objects it changes, which the store resolves in the
   * transaction right before the statement runs and refuses unless each one
   * found lies in the plugin's own schema ({@link PluginTarget}).
   */
  readonly targets: readonly PluginTarget[];
}

/**
 * An existing object a statement changes: the table, index, view,
 * materialized view or sequence (`relation`) or the type an ALTER, DROP,
 * REFRESH or TRUNCATE names, the table a CREATE INDEX is ON, and the tables a
 * CREATE or ALTER TABLE ties to its own (REFERENCES, INHERITS, PARTITION OF,
 * ATTACH, DETACH and INHERIT). `name` holds the name's parts as Postgres
 * keeps them (folded unless quoted, cut to 63 bytes), qualifier first. A
 * name that resolves to nothing is left to Postgres, which reports it missing
 * or, with IF EXISTS, skips it.
 */
export interface PluginTarget {
  readonly kind: 'relation' | 'type';
  readonly name: readonly string[];
}

/** Postgres keeps the first 63 bytes of a name (NAMEDATALEN - 1) and drops the rest. */
const MAX_NAME_BYTES = 63;

/** The first word of each statement a plugin may run. */
const STATEMENTS = new Set([
  'select',
  'insert',
  'update',
  'delete',
  'merge',
  'with',
  'values',
  'table',
  'truncate',
  'refresh',
  'create',
  'alter',
  'drop',
]);

/** What a CREATE, ALTER or DROP may act on. */
const OBJECTS = new Set(['table', 'index', 'view', 'materialized', 'sequence', 'type']);

/** The words that make up a statement's main verb, after a WITH clause. */
const VERBS = new Set(['select', 'insert', 'update', 'delete', 'merge', 'values', 'table']);

/** The verbs of a statement that only reads. */
const READ_VERBS = new Set(['select', 'values', 'table']);

/**
 * The object identifier types whose input looks an object up by a name in a
 * string (`'public.users'::regclass`, `CAST('int4' AS regtype)`,
 * `regtype 'text'`), refused in every spelling, their array types
 * (`_regclass`) too.
 */
const NAME_LOOKUP_TYPES = [
  'regclass',
  'regtype',
  'regproc',
  'regprocedure',
  'regoper',
  'regoperator',
  'regconfig',
  'regdictionary',
  'regnamespace',
  'regrole',
  'regcollation',
  // New in PostgreSQL 19: looks a database of the cluster up by its name.
  'regdatabase',
];

/**
 * `aclitem`, a privilege as `grantee=privileges/grantor`, refused in every
 * spelling like the object identifier types: its input looks each role up by
 * name and its output names them, so `'=r'::aclitem` shows the cluster's
 * first superuser and `'x=r/x'::aclitem` tells whether a role exists.
 */
const ROLE_LOOKUP_TYPES = ['aclitem', '_aclitem'];

/** The system columns of every Postgres table, refused where they are read ({@link checkSystemColumn}). */
const SYSTEM_COLUMNS = new Set(['xmin', 'xmax', 'cmin', 'cmax', 'ctid', 'tableoid']);

/**
 * The transaction id types and their array types, refused where the word
 * stands for the type ({@link checkXidType}): an `xid` value is all
 * `age(xid)` needs to show the server's transaction counter.
 */
const XID_TYPES = new Set(['xid', '_xid', 'xid8', '_xid8']);

/**
 * The keywords after which a word names a column, a table or an alias and
 * never a type: `SELECT xid`, `WHERE xid = $1`, `ORDER BY xid`, `ADD xid
 * text`, `INSERT INTO xid`. After AS and RETURNING it depends on what
 * encloses them ({@link namesType}); after any other word the word is a type
 * (`c xid` in a column definition, `TYPE xid`) or a bare alias, which a
 * plugin then writes with AS.
 */
const NAME_AFTER = new Set(
  (
    'select distinct where and or not by set on then else when case between like ilike having from join into ' +
    'update table column add alter drop rename to with index view exists only lateral over window constraint ' +
    'references using'
  ).split(' '),
);

/** The calls in which AS is followed by a type: `CAST(x AS xid)`. */
const CAST_CALLS = new Set(['cast', 'treat', 'xmlserialize']);

/** The words a WITH query's body starts with, after `AS (`. */
const QUERY_START = new Set(['select', 'values', 'table', 'insert', 'update', 'delete', 'merge', 'with']);

/**
 * The collations every Postgres server has. Which others exist depends on
 * the server's locales and on ICU, so naming one tells a plugin whether the
 * server has it. `"C"` sorts by code point, as SQLite's BINARY does.
 */
const COLLATIONS = new Set(['C', 'POSIX', 'default', 'ucs_basic']);

/** The built-in access methods. Another one comes from an extension, whose presence it would tell. */
const ACCESS_METHODS = new Set(['btree', 'hash', 'gist', 'gin', 'spgist', 'brin', 'heap']);

/** Functions and types refused under any spelling, quoted or not. */
const REFUSED_NAMES = new Set([
  'set_config',
  'current_setting',
  'ts_stat',
  'ts_rewrite',
  'nextval',
  'setval',
  'currval',
  'lastval',
  'loread',
  'lowrite',
  ...NAME_LOOKUP_TYPES,
  ...NAME_LOOKUP_TYPES.map((type) => `_${type}`),
  ...ROLE_LOOKUP_TYPES,
  // Functions that take a relation, a type or another object by a name in a
  // string, or reach an index by one to maintain it.
  'has_any_column_privilege',
  'has_column_privilege',
  'has_database_privilege',
  'has_foreign_data_wrapper_privilege',
  'has_function_privilege',
  'has_language_privilege',
  'has_parameter_privilege',
  'has_schema_privilege',
  'has_sequence_privilege',
  'has_server_privilege',
  'has_table_privilege',
  'has_tablespace_privilege',
  'has_type_privilege',
  'row_security_active',
  'currtid2',
  'brin_summarize_new_values',
  'brin_summarize_range',
  'brin_desummarize_range',
  'gin_clean_pending_list',
  'information_schema',
]);

/** Name prefixes refused under any spelling. */
const REFUSED_PREFIXES = ['pg_', 'lo_', 'dblink', 'to_reg', 'binary_upgrade_'];

/** A name refused wherever it appears: the XML exports of a query, a table, a schema or the database. */
const XML_EXPORT = /_to_xml/;

/** Starts a name: a letter, an underscore or any character past ASCII, as Postgres reads it. */
const NAME_START = /[A-Za-z_\u0080-￿]/;
/** Continues a name; a dollar sign is part of one. */
const NAME_PART = /[A-Za-z0-9_$\u0080-￿]/;
/** The single-character punctuation and operator characters. */
const PUNCT = new Set([...'.,()[];+-*/<>=~!@#%^&|?']);
/**
 * What the Postgres lexer skips as whitespace (`space` in scan.l). Vertical
 * tab is whitespace only from Postgres 16 on, so it is refused instead.
 */
const WHITESPACE = new Set([' ', '\t', '\n', '\r', '\f']);
/** The verbs INTO may follow. Anywhere else it makes a table (`SELECT ... INTO`). */
const INTO_AFTER = new Set(['insert', 'merge']);
/** The words that make an object temporary right after CREATE (`CREATE LOCAL TEMP TABLE`). */
const TEMPORARY = new Set(['temp', 'temporary']);

/**
 * Whether JavaScript and the Postgres lexer read `ch` differently: a control
 * character Postgres does not skip, or whitespace past ASCII, which
 * JavaScript's `\s` skips and Postgres reads as part of a name.
 */
function divergent(ch: string): boolean {
  if (WHITESPACE.has(ch)) return false;
  const code = ch.charCodeAt(0);
  return code < 0x20 || code === 0x7f || /\s/.test(ch);
}

/** Refuses `ch` when {@link divergent}. */
function refuseDivergent(ch: string): void {
  if (divergent(ch)) {
    const code = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
    throw new PluginSqlRefused(
      `the character U+${code} is read differently by Postgres; outside a string use plain spaces, tabs and newlines`,
    );
  }
}

/** `name` lower-cased the way Postgres folds an unquoted name: ASCII letters only. */
function fold(name: string): string {
  return name.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

/** `name` cut to the bytes Postgres keeps of it, never in the middle of a character. */
function truncateName(name: string): string {
  if (Buffer.byteLength(name, 'utf8') <= MAX_NAME_BYTES) return name;
  let out = '';
  for (const ch of name) {
    if (Buffer.byteLength(out + ch, 'utf8') > MAX_NAME_BYTES) break;
    out += ch;
  }
  return out;
}

/** Splits `sql` into tokens, or refuses what this guard does not read the way Postgres would. */
export function tokenize(sql: string): Token[] {
  // The protocol ends a statement's text at a NUL, so what Postgres would read
  // is not what was checked. The store refuses it before the guard runs, with
  // the words every engine uses; the guard refuses it too, so it holds on its own.
  refuseNulSql(sql);
  const tokens: Token[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const at = i;
    const c = sql[i];
    const next = sql[i + 1];
    refuseDivergent(c);
    if (WHITESPACE.has(c)) {
      i++;
    } else if (c === '-' && next === '-') {
      // Postgres ends a line comment at either newline character (`non_newline` in scan.l).
      while (i < n && sql[i] !== '\n' && sql[i] !== '\r') i++;
    } else if (c === '/' && next === '*') {
      i = skipBlockComment(sql, i);
    } else if (c === "'") {
      i = skipQuoted(sql, i, "'", 'a string');
      tokens.push({ kind: 'string', at });
    } else if (c === '"') {
      const end = skipQuoted(sql, i, '"', 'a quoted name');
      const value = sql.slice(i + 1, end - 1).replaceAll('""', '"');
      if (value === '') throw new PluginSqlRefused('a quoted name may not be empty');
      tokens.push({ kind: 'word', value: truncateName(value), quoted: true, at });
      i = end;
    } else if (c === '$') {
      if (!/[0-9]/.test(next ?? '')) {
        throw new PluginSqlRefused('dollar-quoted strings are not accepted; write the string in single quotes');
      }
      i++;
      while (i < n && /[0-9]/.test(sql[i])) i++;
      tokens.push({ kind: 'param', at });
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(next ?? ''))) {
      if (c === '0' && /[xXoObB]/.test(next ?? '')) {
        throw new PluginSqlRefused(
          'hexadecimal, octal and binary numbers are not accepted: Postgres before 16 reads 0x1F as 0 AS x1F; write it in decimal',
        );
      }
      i = skipNumber(sql, i);
      if (sql[i] === '_') {
        throw new PluginSqlRefused('digit separators (1_000) are not accepted: Postgres before 16 does not read them');
      }
      if (i < n) refuseDivergent(sql[i]);
      if (i < n && NAME_PART.test(sql[i])) {
        throw new PluginSqlRefused('a number may not run straight into a name; put a space between them');
      }
      tokens.push({ kind: 'number', at });
    } else if (NAME_START.test(c)) {
      if ((c === 'e' || c === 'E') && next === "'") {
        throw new PluginSqlRefused("escape strings (E'...') are not accepted; write the string in single quotes");
      }
      if ((c === 'u' || c === 'U') && next === '&' && (sql[i + 2] === "'" || sql[i + 2] === '"')) {
        throw new PluginSqlRefused('Unicode escapes (U&) are not accepted');
      }
      while (i < n && NAME_PART.test(sql[i])) {
        refuseDivergent(sql[i]);
        i++;
      }
      tokens.push({ kind: 'word', value: truncateName(fold(sql.slice(at, i))), quoted: false, at });
    } else if (c === ':' && next === ':') {
      tokens.push({ kind: 'punct', value: '::', at });
      i += 2;
    } else if (c === ':' || PUNCT.has(c)) {
      tokens.push({ kind: 'punct', value: c, at });
      i++;
    } else {
      throw new PluginSqlRefused(`unexpected character ${JSON.stringify(c)}`);
    }
  }
  return tokens;
}

/** The index past a block comment starting at `start`; Postgres nests them. */
function skipBlockComment(sql: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < sql.length) {
    if (sql[i] === '/' && sql[i + 1] === '*') {
      depth++;
      i += 2;
    } else if (sql[i] === '*' && sql[i + 1] === '/') {
      depth--;
      i += 2;
      if (depth === 0) return i;
    } else {
      i++;
    }
  }
  throw new PluginSqlRefused('a comment is not closed');
}

/** The index past a quoted string or name starting at `start`; a doubled quote stands for one. */
function skipQuoted(sql: string, start: number, quote: string, what: string): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === quote) {
      if (sql[i + 1] === quote) {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i++;
  }
  throw new PluginSqlRefused(`${what} is not closed`);
}

/** The index past a decimal numeric constant starting at `start`, with a fraction and an exponent. */
function skipNumber(sql: string, start: number): number {
  const match = /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/.exec(sql.slice(start));
  return start + (match ? match[0].length : 1);
}

/** Splits `sql` into its statements, each checked on its own; empty ones (`;;`, a comment) are dropped. */
export function parsePluginSql(sql: string): PluginStatement[] {
  const statements: PluginStatement[] = [];
  let current: Token[] = [];
  const flush = (end: number) => {
    if (current.length > 0) statements.push(describe(sql.slice(current[0].at, end).trimEnd(), current));
    current = [];
  };
  for (const token of tokenize(sql)) {
    if (token.kind === 'punct' && token.value === ';') flush(token.at);
    else current.push(token);
  }
  flush(sql.length);
  return statements;
}

/** The unquoted keyword at `token`, or null for anything else. */
function keyword(token: Token | undefined): string | null {
  return token?.kind === 'word' && !token.quoted ? token.value : null;
}

/** Whether `token` is the punctuation `value`. */
function isPunct(token: Token | undefined, value: string): boolean {
  return token?.kind === 'punct' && token.value === value;
}

/** Reads what a statement's caller needs to know about it, and refuses one this guard does not allow. */
function describe(text: string, tokens: Token[]): PluginStatement {
  const first = tokens[0];
  const opensWithParen = first.kind === 'punct' && first.value === '(';
  const verb = opensWithParen ? 'select' : keyword(first);
  // Transaction control: every call already runs in a transaction of the host's.
  if (verb !== null && PLUGIN_TRANSACTION_CONTROL.has(verb)) throw new TransactionControlRefused();
  if (verb === null || !STATEMENTS.has(verb)) {
    throw new PluginSqlRefused(`a statement may not start with ${describeToken(first)}`);
  }
  if (verb === 'create' || verb === 'alter' || verb === 'drop' || verb === 'refresh') checkObject(verb, tokens);
  const targets = targetsOf(verb, tokens);

  let depth = 0;
  let main: string | null = verb === 'with' ? null : verb;
  // Where the statement's own verb stands: its first token, or after a WITH clause the verb at depth 0.
  let mainAt = verb === 'with' ? -1 : 0;
  let returning = false;
  let params = 0;
  let qualifies = false;
  for (const [index, token] of tokens.entries()) {
    if (token.kind === 'param') params++;
    if (token.kind === 'punct' && token.value === '(') depth++;
    if (token.kind === 'punct' && token.value === ')') depth--;
    if (token.kind !== 'word') continue;
    checkName(token.value);
    checkSystemColumn(tokens, index);
    checkXidType(tokens, index);
    checkCall(tokens, index);
    const after = tokens[index + 1];
    if (after?.kind === 'punct' && after.value === '.') qualifies = true;
    if (token.quoted) continue;
    checkKeyword(token.value);
    checkServerNames(verb, tokens, index);
    if (token.value === 'into') checkInto(tokens, index, mainAt);
    if (verb === 'alter' && (token.value === 'schema' || token.value === 'owner')) {
      throw new PluginSqlRefused(`an ALTER may not change the ${token.value}`);
    }
    if (depth !== 0) continue;
    if (main === null && VERBS.has(token.value)) {
      main = token.value;
      mainAt = index;
    }
    if (token.value === 'returning') returning = true;
  }

  const reads = main !== null && READ_VERBS.has(main);
  const writesInside = tokens.some((t) => {
    const word = keyword(t);
    return word !== null && ['insert', 'update', 'delete', 'merge'].includes(word);
  });
  return {
    text,
    tokens,
    returnsRows: reads || returning,
    mayWrite: !reads || writesInside,
    qualifies,
    params,
    targets,
  };
}

/** Refuses a CREATE, ALTER, DROP or REFRESH of anything but the objects a plugin keeps in its schema. */
function checkObject(verb: string, tokens: readonly Token[]): void {
  let at = 1;
  if (verb === 'create') {
    if (keyword(tokens[at]) === 'or' && keyword(tokens[at + 1]) === 'replace') at += 2;
    const scope = keyword(tokens[at]);
    if (
      TEMPORARY.has(scope ?? '') ||
      ((scope === 'local' || scope === 'global') && TEMPORARY.has(keyword(tokens[at + 1]) ?? ''))
    ) {
      throw new PluginSqlRefused(
        `CREATE ${describeToken(tokens[at])} is not allowed: a temporary object outlives the call on a pooled connection`,
      );
    }
    while (keyword(tokens[at]) === 'unique' || keyword(tokens[at]) === 'unlogged') at++;
  }
  const object = keyword(tokens[at]);
  const allowed = verb === 'refresh' ? object === 'materialized' : object !== null && OBJECTS.has(object);
  if (!allowed) {
    throw new PluginSqlRefused(`${verb.toUpperCase()} ${describeToken(tokens[at])} is not allowed`);
  }
  // A base type is made of C functions and needs a superuser; a composite, enum or range type says AS.
  if (verb === 'create' && object === 'type' && isPunct(tokens[at + 2], '(')) {
    throw new PluginSqlRefused('CREATE TYPE may make a composite, enum or range type (CREATE TYPE x AS ...) only');
  }
}

/**
 * Refuses an unquoted keyword that is never safe, at whatever depth of
 * parentheses it sits.
 */
function checkKeyword(word: string): void {
  if (word === 'recursive') throw new PluginSqlRefused('WITH RECURSIVE is not allowed');
  if (word === 'tablespace') throw new PluginSqlRefused('a tablespace may not be named');
  if (SESSION_KEYWORDS.has(word)) {
    throw new PluginSqlRefused(`${word.toUpperCase()} describes the session, which a plugin may not read`);
  }
}

/** The keywords after which a name followed by `(` is an object's, not a call: `INSERT INTO version (...)`. */
const NAME_BEFORE = new Set(['into', 'table', 'view', 'references', 'exists']);

/**
 * Refuses the word at `index` when it calls a function of `pg_catalog` a
 * plugin may not call (`plugin-sql-functions.ts`), unless it names an object
 * after one of {@link NAME_BEFORE}: followed by `(`, or after a dot, in
 * Postgres's column notation for a call (`(16386::oid).obj_description`, and
 * `u.obj_description` or `$1.obj_description`, where `u` is a function in
 * FROM that returns a single value); after a dot, the column names
 * `COLUMN_NAMES` in `plugin-sql-functions.ts` lists still pass.
 */
function checkCall(tokens: readonly Token[], index: number): void {
  const token = tokens[index];
  if (token.kind !== 'word' || namesObject(tokens, index)) return;
  const call = isPunct(tokens[index + 1], '(');
  const field = !call && isPunct(tokens[index - 1], '.');
  if ((call && refusedCatalogCall(token.value)) || (field && refusedCatalogField(token.value))) {
    throw new PluginSqlRefused(
      `"${token.value}" is a function of the Postgres catalog that a plugin may not call; ` +
        (field
          ? `after a dot Postgres may read x.${token.value} as ${token.value}(x), so name such a column without its table or rename it; `
          : '') +
        "the plugin SDK's README lists the functions a plugin may call",
    );
  }
}

/** Whether the (possibly qualified) name ending at `index` follows one of {@link NAME_BEFORE}. */
function namesObject(tokens: readonly Token[], index: number): boolean {
  let start = index;
  while (isPunct(tokens[start - 1], '.') && tokens[start - 2]?.kind === 'word') start -= 2;
  return NAME_BEFORE.has(keyword(tokens[start - 1]) ?? '');
}

/**
 * Refuses the INTO at `index` unless it follows the verb INSERT or MERGE of
 * the statement itself (`mainAt`) or of a WITH query's body (`AS (INSERT
 * INTO ...`). Anywhere else it is `SELECT ... INTO`, which makes a table (a
 * temporary one with TEMP) past what CREATE is held to, at any depth of
 * parentheses: `(SELECT ... INTO t)`, `WITH x AS (...) SELECT ... INTO t`,
 * and `SELECT 1 insert INTO t`, where `insert` is only a column alias.
 */
function checkInto(tokens: readonly Token[], index: number, mainAt: number): void {
  const verbAt = index - 1;
  const verb = keyword(tokens[verbAt]);
  if (verb !== null && INTO_AFTER.has(verb) && (verbAt === mainAt || opensQueryBody(tokens, verbAt))) return;
  const next = keyword(tokens[index + 1]);
  if (next !== null && TEMPORARY.has(next)) {
    throw new PluginSqlRefused(`SELECT ... INTO ${next.toUpperCase()} is not allowed: no temporary tables`);
  }
  throw new PluginSqlRefused('SELECT ... INTO is not allowed; use CREATE TABLE ... AS');
}

/** Whether the token at `index` is the first of a WITH query's body: `AS (`, `AS [NOT] MATERIALIZED (`. */
function opensQueryBody(tokens: readonly Token[], index: number): boolean {
  if (!isPunct(tokens[index - 1], '(')) return false;
  const before = keyword(tokens[index - 2]);
  return before === 'as' || (before === 'materialized' && keyword(tokens[index - 3]) !== null);
}

/** A name of up to three parts (`t`, `s.t`, `db.s.t`) at `at` and the index past it; null when none starts there. */
function readName(tokens: readonly Token[], at: number): { name: string[]; next: number } | null {
  const name: string[] = [];
  let i = at;
  for (;;) {
    const token = tokens[i];
    if (token?.kind !== 'word') return name.length === 0 ? null : { name, next: i };
    name.push(token.value);
    if (!isPunct(tokens[i + 1], '.')) return { name, next: i + 1 };
    if (name.length === 3) throw new PluginSqlRefused('a name may have at most three parts');
    i += 2;
  }
}

/** The index past the unquoted keywords `words` at `at`, or `at` when they are not there. */
function skip(tokens: readonly Token[], at: number, ...words: string[]): number {
  return words.every((word, i) => keyword(tokens[at + i]) === word) ? at + words.length : at;
}

/** The comma-separated names starting at `at`, each optionally led by ONLY or followed by `*` (TRUNCATE). */
function readNames(tokens: readonly Token[], at: number, what: string): string[][] {
  const names: string[][] = [];
  let i = at;
  for (;;) {
    const read = readName(tokens, skip(tokens, i, 'only'));
    if (read === null) throw new PluginSqlRefused(`the object ${what} acts on could not be read`);
    names.push(read.name);
    i = read.next;
    if (isPunct(tokens[i], '*')) i++;
    if (!isPunct(tokens[i], ',')) return names;
    i++;
  }
}

/**
 * The existing objects a statement changes ({@link PluginTarget}). The one an
 * ALTER, DROP, REFRESH, TRUNCATE or CREATE INDEX acts on must be readable, or
 * the statement is refused; the tables a CREATE or ALTER ties to its own are
 * every name after REFERENCES, INHERITS (, PARTITION OF, ATTACH PARTITION,
 * DETACH PARTITION and INHERIT, read generously: a word there that is no
 * table resolves to nothing and changes nothing.
 */
function targetsOf(verb: string, tokens: readonly Token[]): PluginTarget[] {
  const targets: PluginTarget[] = [];
  const add = (kind: PluginTarget['kind'], names: string[][]) => {
    for (const name of names) targets.push({ kind, name });
  };
  const object = keyword(tokens[1]);
  const kind = object === 'type' ? 'type' : 'relation';
  if (verb === 'alter') {
    const at = skip(tokens, object === 'materialized' ? 3 : 2, 'if', 'exists');
    add(kind, readNames(tokens, at, 'an ALTER').slice(0, 1));
  } else if (verb === 'drop') {
    const at = skip(tokens, skip(tokens, object === 'materialized' ? 3 : 2, 'concurrently'), 'if', 'exists');
    add(kind, readNames(tokens, at, 'a DROP'));
  } else if (verb === 'refresh') {
    add('relation', readNames(tokens, skip(tokens, 3, 'concurrently'), 'a REFRESH').slice(0, 1));
  } else if (verb === 'truncate') {
    add('relation', readNames(tokens, skip(tokens, 1, 'table'), 'a TRUNCATE'));
  } else if (verb === 'create' && keyword(tokens[skip(tokens, 1, 'unique')]) === 'index') {
    const on = tokens.findIndex((t, i) => keyword(t) === 'on' && depthAt(tokens, i) === 0);
    if (on < 0) throw new PluginSqlRefused('a CREATE INDEX must name its table with ON');
    add('relation', readNames(tokens, on + 1, 'a CREATE INDEX').slice(0, 1));
  }
  if (verb === 'create' || verb === 'alter') add('relation', tiedTables(tokens));
  return targets;
}

/** The names after REFERENCES, INHERITS (, PARTITION OF, ATTACH/DETACH PARTITION and INHERIT. */
function tiedTables(tokens: readonly Token[]): string[][] {
  const names: string[][] = [];
  for (const [index, token] of tokens.entries()) {
    const word = keyword(token);
    let at = -1;
    if (word === 'references' || word === 'inherit') at = index + 1;
    else if (word === 'partition' && keyword(tokens[index + 1]) === 'of') at = index + 2;
    else if (word === 'partition' && ['attach', 'detach'].includes(keyword(tokens[index - 1]) ?? '')) at = index + 1;
    else if (word === 'inherits' && isPunct(tokens[index + 1], '(')) {
      names.push(...readNames(tokens, index + 2, 'INHERITS'));
      continue;
    }
    const read = at < 0 ? null : readName(tokens, at);
    if (read !== null) names.push(read.name);
  }
  return names;
}

/** How deep in parentheses the token at `index` sits. */
function depthAt(tokens: readonly Token[], index: number): number {
  let depth = 0;
  for (const token of tokens.slice(0, index)) {
    if (token.kind === 'punct' && token.value === '(') depth++;
    if (token.kind === 'punct' && token.value === ')') depth--;
  }
  return depth;
}

/** The token before the `(` that encloses the token at `index`, the name of a call: `cast` in `CAST(x AS t)`. */
function opener(tokens: readonly Token[], index: number): Token | undefined {
  let depth = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (isPunct(tokens[i], ')')) depth++;
    if (isPunct(tokens[i], '(')) {
      if (depth === 0) return tokens[i - 1];
      depth--;
    }
  }
  return undefined;
}

/**
 * Refuses a read of a system column ({@link SYSTEM_COLUMNS}): the word
 * anywhere but where it gives a name ({@link givesName}). `t.xmin`, `xmin`
 * in WHERE or RETURNING and `"xmin"` read the column of the table in FROM.
 */
function checkSystemColumn(tokens: readonly Token[], index: number): void {
  const token = tokens[index];
  if (token.kind !== 'word' || !SYSTEM_COLUMNS.has(token.value) || givesName(tokens, index)) return;
  throw new PluginSqlRefused(
    `"${token.value}" reads a Postgres system column, which a plugin may not read: xmin, xmax, cmin, cmax, ` +
      "ctid and tableoid show the server's transaction ids and where rows are stored, and SQLite has none of " +
      'them. Keep a column of your own (a version number, an updated_at) for optimistic locking. A value of ' +
      `your own may carry the name where you give it (min(lng) AS ${token.value}) and be read from the result, ` +
      'but the SQL may not refer to it by that name',
  );
}

/**
 * Whether the word at `index` gives a name rather than reads one: right
 * after AS (`min(lng) AS xmin`, `FROM t AS xmin`), or in the column list of
 * an alias (`AS b(xmin, xmax)`) or of a WITH query (`WITH b(xmin) AS
 * (SELECT ...)`). A word read wrongly here as a reference is only refused; a
 * reference read wrongly as a name would let the column through, so a list
 * counts only when it holds names alone and stands where a list of names
 * does. `f(xmin) AS (a int)` is a call with a column definition list.
 */
function givesName(tokens: readonly Token[], index: number): boolean {
  if (keyword(tokens[index - 1]) === 'as') return true;
  let first = index;
  while (isPunct(tokens[first - 1], ',') && tokens[first - 2]?.kind === 'word') first -= 2;
  let last = index;
  while (isPunct(tokens[last + 1], ',') && tokens[last + 2]?.kind === 'word') last += 2;
  if (!isPunct(tokens[first - 1], '(') || !isPunct(tokens[last + 1], ')') || tokens[first - 2]?.kind !== 'word') {
    return false;
  }
  if (keyword(tokens[first - 3]) === 'as') return true;
  if (keyword(tokens[first - 3]) !== 'with' && !isPunct(tokens[first - 3], ',')) return false;
  const as = last + 2;
  if (keyword(tokens[as]) !== 'as') return false;
  const body = skip(tokens, skip(tokens, as + 1, 'not'), 'materialized');
  return (
    isPunct(tokens[body], '(') && (isPunct(tokens[body + 1], '(') || QUERY_START.has(keyword(tokens[body + 1]) ?? ''))
  );
}

/** Refuses a transaction id type ({@link XID_TYPES}) where the word stands for the type ({@link namesType}). */
function checkXidType(tokens: readonly Token[], index: number): void {
  const token = tokens[index];
  if (token.kind !== 'word' || !XID_TYPES.has(token.value) || !namesType(tokens, index)) return;
  throw new PluginSqlRefused(
    `"${token.value}" stands for a transaction id type here, which a plugin may not use: age() of one shows ` +
      `how many transactions the server ran. A column of your own may be called ${token.value}, but only ` +
      `without its table: Postgres reads x.${token.value} as the cast ${token.value}(x) when x has no such ` +
      `column, so where you need x.${token.value} (excluded.${token.value} in an upsert) rename the column`,
  );
}

/**
 * Whether the word at `index` stands for a type: after `::`, before a string
 * (`xid '3'`), as a call or after a dot (both casts: `xid(x)`, `x.xid`),
 * after `subtype =` (a range type), after AS in a CAST, after RETURNING in
 * a JSON function, and after any word but {@link NAME_AFTER} (`c xid`,
 * `TYPE xid`). Anywhere else, after a comma, a parenthesis or an operator,
 * it is a column.
 */
function namesType(tokens: readonly Token[], index: number): boolean {
  const before = tokens[index - 1];
  const after = tokens[index + 1];
  if (isPunct(before, '::') || isPunct(before, '.') || after?.kind === 'string') return true;
  if (isPunct(after, '(')) return !namesObject(tokens, index);
  if (isPunct(before, '=')) return keyword(tokens[index - 2]) === 'subtype';
  if (before?.kind !== 'word') return false;
  const word = keyword(before);
  if (word === 'as') return CAST_CALLS.has(keyword(opener(tokens, index)) ?? '');
  if (word === 'returning') return (keyword(opener(tokens, index)) ?? '').startsWith('json');
  return word === null || !NAME_AFTER.has(word);
}

/**
 * Refuses a collation or an access method a plugin may not name: the word
 * after COLLATE, after `collation =` in a CREATE TYPE, after USING where it
 * names an index's or a table's access method, and after ACCESS METHOD. Only
 * {@link COLLATIONS} and {@link ACCESS_METHODS}, unqualified, pass.
 */
function checkServerNames(verb: string, tokens: readonly Token[], index: number): void {
  const word = keyword(tokens[index]);
  const before = keyword(tokens[index - 1]);
  let collation = -1;
  if (word === 'collate') collation = index + 1;
  else if (word === 'collation' && verb === 'create' && isPunct(tokens[index + 1], '=')) collation = index + 2;
  if (collation >= 0 && !named(tokens, collation, COLLATIONS)) {
    throw new PluginSqlRefused(
      'a collation other than "C", "POSIX", "default" or ucs_basic may not be named: which others exist ' +
        'depends on the server\'s locales and ICU. COLLATE "C" sorts by code point, as SQLite does',
    );
  }
  const method =
    (word === 'using' && (before === 'exclude' || (verb === 'create' && tokens[index + 1]?.kind === 'word'))) ||
    (word === 'method' && before === 'access');
  if (method && !named(tokens, index + 1, ACCESS_METHODS)) {
    throw new PluginSqlRefused(
      'only the built-in access methods may be named (btree, hash, gist, gin, spgist and brin for an index, ' +
        'heap for a table): whether another exists depends on the extensions installed on the server',
    );
  }
}

/** Whether the token at `at` is one of `names`, unqualified. */
function named(tokens: readonly Token[], at: number, names: ReadonlySet<string>): boolean {
  const token = tokens[at];
  return token?.kind === 'word' && names.has(token.value) && !isPunct(tokens[at + 1], '.');
}

/** Refuses a name that reaches past the plugin's schema whatever qualifies it. */
function checkName(name: string): void {
  if (REFUSED_NAMES.has(name) || REFUSED_PREFIXES.some((p) => name.startsWith(p)) || XML_EXPORT.test(name)) {
    throw new PluginSqlRefused(`"${name}" may not be named in a plugin's SQL`);
  }
}

/** A token as an error message shows it. */
function describeToken(token: Token | undefined): string {
  if (token === undefined) return 'nothing';
  if (token.kind === 'word') return token.quoted ? `"${token.value}"` : token.value.toUpperCase();
  if (token.kind === 'punct') return `"${token.value}"`;
  return `a ${token.kind}`;
}

/**
 * Refuses a qualified name in `statement` whose qualifier is a schema other
 * than `ownSchema`: one of `schemas` (every schema of the database), or one
 * named like a plugin schema even before it exists.
 */
export function checkQualifiers(statement: PluginStatement, ownSchema: string, schemas: ReadonlySet<string>): void {
  const { tokens } = statement;
  for (const [index, token] of tokens.entries()) {
    const after = tokens[index + 1];
    if (token.kind !== 'word' || after?.kind !== 'punct' || after.value !== '.') continue;
    if (token.value === ownSchema) continue;
    if (schemas.has(token.value) || token.value.startsWith(PLUGIN_SCHEMA_PREFIX) || token.value === 'public') {
      throw new PluginSqlRefused(`"${token.value}" is another schema; a plugin reaches its own tables only`);
    }
  }
}

/**
 * Refuses `?` placeholders where bound args were given: Postgres numbers its
 * placeholders `$1`, `$2`, ..., and reads a `?` as an operator.
 */
export function checkPlaceholders(statement: PluginStatement, args: readonly unknown[]): void {
  if (args.length === 0 || statement.params > 0) return;
  const questionMark = statement.tokens.some((t) => t.kind === 'punct' && t.value === '?');
  if (questionMark) {
    throw new PluginSqlRefused('this TREK runs on Postgres, which numbers its placeholders $1, $2, ... instead of ?');
  }
}
