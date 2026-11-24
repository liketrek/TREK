/**
 * The contract of a plugin's own database (`db:own`) that holds on every
 * engine: the caps, the words a call that breaks it is refused with, and the
 * refusals of U+0000 (NUL) and of transaction control, so a plugin answers the
 * same whichever engine TREK runs on.
 *
 * TREK's two stores (`server/src/db/engine/sqlite/plugin-data-store.ts` and
 * `server/src/db/engine/postgres/plugin-data-store.ts`) throw these texts;
 * `server/tests/unit/db/engine/plugin-data-contract.test.ts` runs every case
 * on both and fails on a store that answers one differently.
 *
 * The plugin SDK keeps a byte-identical copy (`plugin-sdk/src/plugin-data-contract.ts`)
 * so `trek-plugin dev` and the mock host refuse what TREK refuses, with the
 * same words; its `test/permissions-parity.test.ts` compares the two files.
 * Change both together. No imports: the SDK ships standalone.
 */

/**
 * The limits every plugin database is held to, whatever the engine. The
 * plugin-sdk README's "Runtime limits" table documents them.
 */
export const PLUGIN_DATA_CAPS = {
  /** The longest SQL text one call may carry. */
  maxSqlLength: 100_000,
  /** The most rows a query, or a whole tx batch, returns. */
  maxRows: 100_000,
  /** The most statements one tx batch holds. */
  maxTxOps: 100,
  /** Wall-clock time for one query, one tx batch or one exec script. */
  timeBudgetMs: 2_000,
  /** The most a plugin's data may take on disk. */
  quotaBytes: 256 * 1024 * 1024,
} as const;

/** The calls a time budget holds. */
export type PluginDataBudgetedCall = 'query' | 'exec' | 'tx';

/** The start of every refusal of a statement a plugin may not run. */
const STATEMENT_NOT_ALLOWED = 'statement type not allowed for plugin databases';

/**
 * What a plugin is told when a call breaks the contract. Both stores throw
 * these and nothing else for these cases.
 *
 * `noStatement`, `moreThanOneStatement` and `closed` are better-sqlite3's own
 * messages: the SQLite store passes them on as the driver throws them, and
 * the Postgres store says the same. `statementNotAllowed` starts every
 * refusal of a statement the store does not run for a plugin; the Postgres
 * guard adds the reason after a colon. `txControl` is such a refusal with its
 * reason, in the same words on both engines ({@link refuseTransactionControl}).
 * `parameterBeforeParenthesis` is the refusal of a spelling no engine TREK
 * runs accepts, which the scanner behind `refuseTransactionControl` cannot
 * read the way every SQLite build does.
 */
export const PLUGIN_DATA_ERRORS = {
  sqlNotString: 'sql must be a string',
  sqlTooLong: 'sql too long',
  statementNotAllowed: STATEMENT_NOT_ALLOWED,
  txControl:
    `${STATEMENT_NOT_ALLOWED}: transaction-control statements are not allowed: ` +
    'each call runs in its own transaction, and tx() makes a batch atomic',
  parameterBeforeParenthesis:
    `${STATEMENT_NOT_ALLOWED}: a parameter name ($name, :name, @name) directly followed by "(" is not allowed: ` +
    'no engine TREK runs accepts it, and the SQLite of trek-plugin dev would read the parentheses as part of the name',
  noStatement: 'The supplied SQL string contains no statements',
  moreThanOneStatement: 'The supplied SQL string contains more than one statement',
  closed: 'The database connection is not open',
  txNotArray: 'tx requires an array of { sql, args }',
  txTooManyOps: (max: number): string => `tx allows at most ${max} statements`,
  queryTooManyRows: (max: number): string => `query returned more than ${max} rows`,
  txTooManyRows: (max: number): string => `tx returned more than ${max} rows in total`,
  overBudget: (call: PluginDataBudgetedCall, ms: number): string => `${call} exceeded its ${ms} ms time budget`,
} as const;

/**
 * Why a plugin's SQL holding NUL is refused: Postgres ends a statement's text
 * at a NUL and its text cannot hold one. On SQLite a NUL in a string literal
 * would store a value the same plugin could never store on Postgres.
 */
export const PLUGIN_SQL_NUL_REFUSAL =
  'the SQL holds the character U+0000 (NUL), which plugin databases refuse on every engine: ' +
  'Postgres cannot read it in a statement or store it in text. Remove it from the SQL';

/**
 * Why a plugin's bound value or migration id holding NUL is refused: TREK
 * will not change what a plugin asked to store or compare (`'a\0b'` and
 * `'ab'` are different keys). SQLite could store it, but then the plugin
 * would answer differently on Postgres and its data could not move there.
 */
export const PLUGIN_VALUE_NUL_REFUSAL =
  'a plugin argument holds the character U+0000 (NUL), which plugin databases refuse on every engine: ' +
  'Postgres text cannot store it, and TREK refuses it instead of changing the value. ' +
  'Remove it, or bind binary data as a Buffer (a BLOB on SQLite, bytea on Postgres)';

/** Refuses plugin SQL holding NUL ({@link PLUGIN_SQL_NUL_REFUSAL}). */
export function refuseNulSql(sql: string): void {
  if (sql.includes('\u0000')) throw new Error(PLUGIN_SQL_NUL_REFUSAL);
}

/**
 * Refuses plugin values holding NUL ({@link PLUGIN_VALUE_NUL_REFUSAL}): a
 * string, or a string anywhere in an array or a plain object (SQLite binds an
 * object's fields as named parameters, `pg` sends one as JSON). A Buffer is
 * binary data and holds any byte.
 */
export function refuseNulValues(values: readonly unknown[]): void {
  if (holdsNul(values, new Set())) throw new Error(PLUGIN_VALUE_NUL_REFUSAL);
}

function holdsNul(value: unknown, seen: Set<object>): boolean {
  if (typeof value === 'string') return value.includes('\u0000');
  if (typeof value !== 'object' || value === null || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => holdsNul(item, seen));
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  return Object.values(value).some((item) => holdsNul(item, seen));
}

/**
 * The verbs of transaction control, in lower case. TREK runs every call in a
 * transaction of its own and `tx()` makes a batch atomic, so a plugin never
 * opens, ends or nests one: a COMMIT in the middle would keep writes the call
 * then reports as failed. SQLite knows no START or ABORT, but they are refused
 * there too, so a plugin is told the same on both engines.
 */
export const PLUGIN_TRANSACTION_CONTROL: ReadonlySet<string> = new Set([
  'begin',
  'start',
  'commit',
  'end',
  'rollback',
  'abort',
  'savepoint',
  'release',
]);

/**
 * Refuses SQL in which any statement starts with transaction control
 * ({@link PLUGIN_DATA_ERRORS.txControl}), in a query, a tx op, a migration or
 * any statement of an exec script, before anything runs. The SQLite store and
 * the SDK harnesses call it; the Postgres guard finds the same verbs with its
 * own lexer.
 *
 * A named parameter directly followed by `(` is refused as well
 * ({@link PLUGIN_DATA_ERRORS.parameterBeforeParenthesis}). A SQLite built with
 * Tcl variables, as node:sqlite is under `trek-plugin dev`, reads `$a(...)`
 * up to the closing parenthesis as one token, quotes and semicolons
 * included, so `$a(')); COMMIT; --')` would hide a COMMIT from this scan.
 * better-sqlite3 and Postgres refuse the spelling anyway.
 *
 * `dialect` says whose spelling `sql` is. The stores and `trek-plugin dev`
 * run SQLite and pass nothing. The SDK's mock host emulating Postgres passes
 * `'postgres'`, so `$1`, dollar quotes (`$$...$$`, `$tag$...$tag$`) and
 * escape strings (`E'...'`) are read as Postgres reads them, `:`, `@` and `#`
 * are operators there, and a trigger has no body of statements.
 */
export function refuseTransactionControl(sql: string, dialect: PluginSqlDialect = 'sqlite'): void {
  if (statementVerbs(sql, dialect).some((verb) => PLUGIN_TRANSACTION_CONTROL.has(verb))) {
    throw new Error(PLUGIN_DATA_ERRORS.txControl);
  }
}

/** Whose spelling a plugin's SQL is in. */
export type PluginSqlDialect = 'sqlite' | 'postgres';

/** A name or keyword as SQLite reads one, unquoted. */
const WORD = /[A-Za-z_\u0080-￿][A-Za-z0-9_$\u0080-￿]*/y;

/** A character SQLite reads as part of a name. */
const NAME_CHAR = /[A-Za-z0-9_$\u0080-￿]/;

/** The characters a named parameter starts with in SQLite. */
const PARAMETER_PREFIXES = new Set(['$', ':', '@', '#']);

/**
 * How many leading words of a statement are kept: enough for
 * EXPLAIN QUERY PLAN CREATE TEMP TRIGGER.
 */
const LEADING_WORDS = 6;

/**
 * The first word of every statement in `sql`, in lower case, read the way
 * SQLite splits a script: quoted text ('...', "...", `...`, [...]) and
 * comments are skipped, and a semicolon ends a statement, except inside
 * the body of a CREATE TRIGGER, which only `; END ;` ends (as in SQLite's
 * sqlite3_complete). The statements of a trigger body are not counted, so
 * its closing END is not taken for transaction control. A statement that
 * starts with a quoted name or a parenthesis has no verb here. A named
 * parameter is read as SQLite reads it ({@link afterParameter}).
 */
function statementVerbs(sql: string, dialect: PluginSqlDialect): string[] {
  const verbs: string[] = [];
  let words: string[] = [];
  let tokens = 0;
  let inTrigger = false;
  // In a trigger body: whether the last tokens were `;`, or `;` and END.
  let afterSemicolon = false;
  let afterEnd = false;
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const next = sql[i + 1];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '-' && next === '-') {
      i = indexAfter(sql, '\n', i + 2);
      continue;
    }
    if (c === '/' && next === '*') {
      i = indexAfter(sql, '*/', i + 2);
      continue;
    }
    if (c === ';') {
      if (!inTrigger || afterEnd) {
        words = [];
        tokens = 0;
        inTrigger = false;
      }
      afterSemicolon = inTrigger;
      afterEnd = false;
      i++;
      continue;
    }
    WORD.lastIndex = i;
    const word = WORD.exec(sql)?.[0];
    tokens++;
    if (word === undefined) {
      i = afterOtherToken(sql, i, dialect);
      afterSemicolon = false;
      afterEnd = false;
      continue;
    }
    i += word.length;
    const lower = word.toLowerCase();
    if (tokens === 1) verbs.push(lower);
    if (tokens === words.length + 1 && words.length < LEADING_WORDS) words.push(lower);
    if (!inTrigger && dialect === 'sqlite') inTrigger = opensTrigger(words);
    afterEnd = afterSemicolon && lower === 'end';
    afterSemicolon = false;
  }
  return verbs;
}

/**
 * Whether a statement starting with `words` is
 * [EXPLAIN [QUERY PLAN]] CREATE [TEMP | TEMPORARY] TRIGGER.
 */
function opensTrigger(words: readonly string[]): boolean {
  let at = 0;
  if (words[0] === 'explain') at = words[1] === 'query' && words[2] === 'plan' ? 3 : 1;
  if (words[at] !== 'create') return false;
  at += words[at + 1] === 'temp' || words[at + 1] === 'temporary' ? 2 : 1;
  return words[at] === 'trigger';
}

/** The index after the token at `start` that is no word: quoted text, a parameter, or one character. */
function afterOtherToken(sql: string, start: number, dialect: PluginSqlDialect): number {
  if (dialect === 'postgres') return afterPostgresToken(sql, start);
  const c = sql[start];
  if (c === '[') return indexAfter(sql, ']', start + 1);
  if (c === "'" || c === '"' || c === '`') return afterQuoted(sql, start);
  if (PARAMETER_PREFIXES.has(c)) return afterParameter(sql, start);
  return start + 1;
}

/** A dollar quote's opening tag, `$$` or `$tag$`, as Postgres reads one. */
const DOLLAR_TAG = /\$(?:[A-Za-z_\u0080-￿][A-Za-z0-9_\u0080-￿]*)?\$/y;

/**
 * The index after the token at `start` that is no word, read as Postgres reads
 * it: quoted text and quoted names, a dollar-quoted string up to its closing
 * tag, an escape string (`E'...'`, where a backslash escapes the next
 * character), or one character (`$1` is `$` and a number, `::` two colons).
 */
function afterPostgresToken(sql: string, start: number): number {
  const c = sql[start];
  if (c === '$') {
    DOLLAR_TAG.lastIndex = start;
    const tag = DOLLAR_TAG.exec(sql)?.[0];
    if (tag !== undefined) return indexAfter(sql, tag, start + tag.length);
    return start + 1;
  }
  if (c === "'" && isEscapeStringPrefix(sql, start - 1)) return afterEscapeString(sql, start);
  if (c === "'" || c === '"') return afterQuoted(sql, start);
  return start + 1;
}

/** Whether the character at `at` is a lone `E`/`e` that makes the string after it an escape string. */
function isEscapeStringPrefix(sql: string, at: number): boolean {
  return (sql[at] === 'E' || sql[at] === 'e') && (at === 0 || !NAME_CHAR.test(sql[at - 1]));
}

/** The index after the escape string whose quote is at `start`. */
function afterEscapeString(sql: string, start: number): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === '\\') i += 2;
    else if (sql[i] !== "'") i++;
    else if (sql[i + 1] === "'") i += 2;
    else return i + 1;
  }
  return sql.length;
}

/**
 * The index after the named parameter starting at `start`, read as SQLite's
 * tokenizer reads one: name characters, with `::` allowed inside. Refuses a
 * name directly followed by `(` ({@link PLUGIN_DATA_ERRORS.parameterBeforeParenthesis}).
 *
 * A prefix without a name is no parameter, and SQLite refuses the statement
 * holding it. Its colons are skipped together, so the scan does not read a
 * Postgres cast (`x::numeric(10)`, which the mock host may be handed) as a
 * parameter.
 */
function afterParameter(sql: string, start: number): number {
  let i = start + 1;
  let named = false;
  while (i < sql.length) {
    if (NAME_CHAR.test(sql[i])) {
      named = true;
      i++;
    } else if (sql[i] === ':' && sql[i + 1] === ':') {
      i += 2;
    } else {
      break;
    }
  }
  if (!named) {
    while (sql[i] === ':') i++;
    return i;
  }
  if (sql[i] === '(') throw new Error(PLUGIN_DATA_ERRORS.parameterBeforeParenthesis);
  return i;
}

/** The index after the first `token` from `from`, or the end of `sql`. */
function indexAfter(sql: string, token: string, from: number): number {
  const at = sql.indexOf(token, from);
  return at < 0 ? sql.length : at + token.length;
}

/** The index after the quoted text starting at `start`; a doubled quote stands for itself. */
function afterQuoted(sql: string, start: number): number {
  const quote = sql[start];
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] !== quote) i++;
    else if (sql[i + 1] === quote) i += 2;
    else return i + 1;
  }
  return sql.length;
}
