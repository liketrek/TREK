#!/usr/bin/env node
/*
 * lint:dialect: SQLite-only SQL may only shrink.
 *
 * The server runs on SQLite and on Postgres. What stands in the way is SQL
 * that only SQLite understands, spelled out inline: INSERT OR IGNORE,
 * datetime('now'), strftime, json_extract, group_concat, ifnull and the other
 * SQLite-only functions, GLOB, last_insert_rowid, PRAGMA, AUTOINCREMENT and
 * `||` string concatenation, and LIKE, which ignores case on SQLite only.
 * Each of them has a dialect-neutral form: the query builder's onConflict(),
 * returning('id'), or a helper in src/db/dialect/ (sql-functions.ts and its
 * Kysely twin kysely-functions.ts, ilike() for a search), which dispatches on
 * the live platform and is the one place allowed to spell an engine's own
 * forms. A LIKE that is exact on purpose (a key or path prefix) carries a
 * `like-exact: <reason>` comment on its line or the line above.
 *
 * The check reads every string and template literal under src/ (comments
 * never count), every `.insertId` read and every MikroORM `$like`, counts the
 * hits per file and rule, and holds them to scripts/dialect-baseline.json. A
 * new hit fails, and so does a baseline entry above what its file holds now,
 * so the change that removes one lowers the baseline with --update in the
 * same commit.
 *
 * Not scanned: src/db/dialect/ (the dialect layer itself), the SQLite
 * engine's own code (src/db/engine/sqlite/) and the migrations that have
 * shipped (append-only, never edited again; the last one is
 * FROZEN_MIGRATIONS_THROUGH). A newer migration is scanned for the DML rules.
 * PRAGMA is allowed in the src/db/ lifecycle files (src/db/*.ts and the
 * migrations), nowhere else.
 *
 * A migration after the Postgres baseline's cut (`through` in
 * assets/postgres/baseline.json, or POSTGRES_FIRST_CUT when that comes
 * first: moving the manifest's cut never takes a migration off the Postgres
 * installs that already run it) runs on both engines, so it is held to
 * POST_CUT_RULES as well: each schema statement goes through
 * engineDdl(this, { sqlite: [...], postgres: [...] }), whose sqlite member
 * holds nothing but the schema change and whose postgres member is filled (or
 * says why not) and holds no SQLite spelling; each column handed to
 * addColumnIfMissing is { sqlite, postgres }; the SQLite-only helpers of
 * migration-utils are not called, and neither are the best-effort ones, which
 * abort the migration transaction on Postgres when they fail; and LIKE counts
 * there too. The post-cut rules have no allowance: the baseline file may not
 * hold an entry for them.
 *
 *   npm run lint:dialect              check against the baseline (CI)
 *   npm run lint:dialect -- --update  lower the baseline to what the files hold now;
 *                                     it never raises or adds an entry
 *
 * --dir=<path> points the check at another server root (the unit tests use it).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

/** The last migration that shipped before this check existed. Later ones are scanned. */
export const FROZEN_MIGRATIONS_THROUGH = 'Migration20200101042400';

/** Where the cut is read from: the migrations after its `through` run on Postgres too. */
export const POSTGRES_BASELINE_MANIFEST = 'assets/postgres/baseline.json';

/**
 * The cut Postgres support shipped with. A Postgres install can stand at it,
 * and its next boot runs every later migration through the migrator, so a
 * migration after it is held to POST_CUT_RULES for good, wherever the
 * manifest's `through` moves later: regenerating the baseline over a migration
 * does not take it off the Postgres installs that already exist. Never
 * change this.
 */
export const POSTGRES_FIRST_CUT = 'Migration20200101046440';

/** The dialect layer: the one place that may spell an engine's own SQL. */
const DIALECT_LAYER = 'src/db/dialect/';

/** The SQLite engine's own code, which runs on SQLite alone. */
const SQLITE_ENGINE = 'src/db/engine/sqlite/';

const SQL_KEYWORDS = /\b(SELECT|UPDATE|INSERT|DELETE|WHERE|SET|CASE|WHEN|COALESCE|CAST|VALUES|FROM)\b/i;

/**
 * Each rule: a name, a test over one literal's text, the advice the failure
 * prints, and whether it applies to a migration newer than the frozen ones.
 */
export const RULES = [
  {
    name: 'insert-or',
    test: (text) => /\bINSERT\s+OR\s+(IGNORE|REPLACE)\b|\bREPLACE\s+INTO\b/i.test(text),
    advice: "use the query builder's onConflict((oc) => oc.columns([...]).doNothing() / .doUpdateSet(...))",
    migrations: true,
  },
  {
    name: 'datetime',
    // The call in SQL text, or the bare name the query builder takes in eb.fn('datetime', [...]).
    test: (text) =>
      /\b(datetime|julianday|unixepoch)\s*\(/i.test(text) || /^(datetime|julianday|unixepoch)$/i.test(text.trim()),
    advice: 'use currentTimestamp/nowMinusDays/nowPlusSeconds and friends from sql-functions.ts',
    migrations: true,
  },
  {
    name: 'strftime',
    test: (text) => /\bstrftime\b/i.test(text),
    advice: 'use unixEpochToIsoKysely or another sql-functions.ts helper',
    migrations: true,
  },
  {
    name: 'json',
    test: (text) =>
      /\bjson_(extract|each|set|patch|insert|replace|remove|group_array|group_object)\b/i.test(text) ||
      // These read as words elsewhere (an LLM API's json_object mode), so only the call counts.
      /\bjson_(object|array|valid|type|quote)\s*\(/i.test(text),
    advice: 'read the JSON column and parse it in the service, or add a helper to sql-functions.ts',
    migrations: true,
  },
  {
    name: 'sqlite-function',
    // The call in SQL text, or the bare name handed to eb.fn('ifnull', [...]).
    // `total` and `changes` are words and column names too, so they count
    // only as a call with the parenthesis right after the name.
    test: (text) =>
      /\b(group_concat|ifnull|instr|iif|printf|typeof)\s*\(|\b(total|changes)\(/i.test(text) ||
      /^(group_concat|ifnull|instr|iif|printf)$/i.test(text.trim()),
    advice:
      'group_concat, ifnull, instr, iif, printf, typeof, total and changes are SQLite-only: use coalesce (both ' +
      'engines), aggregate in the service, or add a helper to sql-functions.ts that spells both engines',
    migrations: true,
  },
  {
    name: 'glob',
    test: (text) => /\bGLOB\b/.test(text) || text.trim().toLowerCase() === 'glob',
    advice: 'use startsWithIsoDate and its siblings, or ilike(), from sql-functions.ts',
    migrations: true,
  },
  {
    name: 'last-insert-rowid',
    test: (text) => /\blast_insert_rowid\b/i.test(text),
    advice: "read the new id with .returning('id')",
    migrations: true,
  },
  {
    name: 'autoincrement',
    test: (text) => /\bAUTOINCREMENT\b/i.test(text),
    advice: 'tables are created by migrations, not by query-builder code',
    migrations: false,
  },
  {
    name: 'pragma',
    // The statement, `PRAGMA name`: the bare word is also an HTTP header.
    test: (text) => /\bPRAGMA\s+[a-z_]/i.test(text),
    advice: 'PRAGMA belongs in the src/db/ lifecycle files (connection, durability, migrations)',
    migrations: false,
  },
  {
    name: 'concat',
    test: (text, inSqlTag) => text.includes('||') && (inSqlTag || SQL_KEYWORDS.test(text)),
    advice: 'use concat/concatKysely from sql-functions.ts',
    migrations: true,
    // Postgres spells `||` itself, so a postgres member may hold it.
    postgresSpells: true,
  },
  {
    name: 'like',
    // Kysely's 'like'/'not like' operator, LIKE in a sql tag, or LIKE before a
    // SQL operand (a bound value, a quoted pattern, a call) in other SQL text,
    // so that prose ("a name like ...") does not count. MikroORM's `$like`
    // key is counted where the object is read (scanSource).
    test: (text, inSqlTag) =>
      /^(not\s+)?like$/i.test(text.trim()) ||
      (inSqlTag && /\bLIKE\b/i.test(text)) ||
      (/\bLIKE\s+(?:\?|'|:\w|\$\d|\w+\s*\()/i.test(text) && SQL_KEYWORDS.test(text)),
    advice:
      'LIKE ignores case on SQLite and not on Postgres: build a search with ilike(platform, refs) from ' +
      'sql-functions.ts. A match that is exact on purpose (a settings key, a storage path) keeps LIKE and says so ' +
      'in a `// like-exact: <reason>` comment on its line or the line above',
    // A migration up to the cut runs on SQLite alone; a later one runs on both.
    migrations: 'post-cut',
    postgresSpells: true,
    marker: /like-exact:\s*\S/,
  },
];

/** `.insertId` reads, the JS face of last_insert_rowid. */
const INSERT_ID_RULE = 'insert-id';

/** What every post-cut rule's advice ends with: the two steps that satisfy it. */
const POST_CUT_ROUTINE =
  '(1) write the schema change as engineDdl(this, { sqlite: [...], postgres: [] }) from src/db/migration-utils.ts ' +
  "with the SQLite statements by hand (a column for addColumnIfMissing as { sqlite: '...', postgres: '...' }); " +
  '(2) fill postgres with what npm run gen:pg-migration prints (server/CLAUDE.md, SQL dialect, Migrations)';

/** A schema statement: CREATE/ALTER/DROP of a table, index, trigger or view, or a RENAME. */
const DDL_STATEMENT =
  /\b(?:CREATE|ALTER|DROP)\s+(?:UNIQUE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:TABLE|INDEX|TRIGGER|VIEW)\b|\bRENAME\s+(?:TO|COLUMN)\b/i;

/** SQLite's own column types and clauses, which Postgres refuses or reads differently. */
const SQLITE_ONLY_DDL = /\bDATETIME\b|\bAUTOINCREMENT\b|\bINTEGER\s+PRIMARY\s+KEY\b|\bWITHOUT\s+ROWID\b|\bPRAGMA\b/i;

/** The migration-utils helpers that only speak SQLite. */
const SQLITE_ONLY_HELPERS = new Set(['tableSql', 'createPlaceRegionsFollowPlaceTrigger']);

/**
 * The migration-utils helpers that swallow a failed statement. On Postgres the
 * pending migrations run in one transaction, and a failed statement aborts it,
 * so they cannot be best-effort there.
 */
const BEST_EFFORT_HELPERS = new Set(['execBestEffort', 'bestEffort', 'execUnlessTableMissing']);

/** The calls whose { sqlite, postgres } argument holds the DDL of each engine. */
const ENGINE_DDL_CALLS = new Set(['engineDdl', 'addColumnIfMissing']);

/**
 * What an engineDdl sqlite member may hold, statement by statement: a schema
 * change (CREATE/DROP of a table, index or view, an ALTER TABLE), a PRAGMA,
 * and what a table rebuild needs besides: the INSERT ... SELECT that copies
 * the old table into a new one the same member creates, and the
 * sqlite_sequence bookkeeping that carries its AUTOINCREMENT counter over.
 */
const SQLITE_SCHEMA_STATEMENT =
  /^(?:(?:CREATE|DROP)\s+(?:UNIQUE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:TABLE|INDEX|VIEW)\b|ALTER\s+TABLE\b|PRAGMA\b)/i;
const SQLITE_SEQUENCE_STATEMENT = /^(?:UPDATE|DELETE\s+FROM|INSERT\s+INTO)\s+["`]?sqlite_sequence\b/i;
const CREATED_TABLE = /^CREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)/i;
const TABLE_COPY = /^INSERT\s+INTO\s+["`]?(\w+)["`]?[\s(][\s\S]*\bSELECT\b/i;

/** The comment that names why an engineDdl with SQLite statements leaves Postgres nothing to do. */
const SQLITE_ONLY_MARKER = /sqlite-only:\s*\S/;

/**
 * The rules for a migration after the Postgres baseline's cut. A new
 * migration starts at zero: the baseline file may not hold an entry for them.
 */
export const POST_CUT_RULES = [
  {
    name: 'ddl',
    label: 'schema statement(s) outside engineDdl',
    advice: `a migration after the Postgres baseline's cut runs on both engines: ${POST_CUT_ROUTINE}`,
  },
  {
    name: 'sqlite-ddl',
    label: 'SQLite spelling(s) in an engineDdl postgres member',
    advice:
      'the postgres member is what Postgres runs, and DATETIME, AUTOINCREMENT, INTEGER PRIMARY KEY, WITHOUT ROWID, ' +
      'PRAGMA and the SQLite-only functions are not Postgres: replace it with what npm run gen:pg-migration prints',
  },
  {
    name: 'sqlite-member',
    label: 'statement(s) in an engineDdl sqlite member that are not a schema change',
    advice:
      'what the sqlite member holds never runs on Postgres, so it holds the schema change alone: CREATE/DROP of a ' +
      'table, index or view, ALTER TABLE, PRAGMA, and for a table rebuild the INSERT INTO <new table> ... SELECT ' +
      'and the sqlite_sequence statements, each written inline as a string. Move a data change (UPDATE, DELETE, ' +
      'INSERT) into this.addSql after the engineDdl call, where it runs on both engines under the DML rules. A ' +
      'trigger after the cut has no Postgres port (server/CLAUDE.md, SQL dialect, Migrations): do that work in the ' +
      'repository instead',
  },
  {
    name: 'empty-postgres',
    label: 'engineDdl call(s) with SQLite statements and an empty postgres member',
    advice:
      'fill the postgres member with what npm run gen:pg-migration prints. When it prints postgres: [] because the ' +
      "change is SQLite's alone (a rebuild that leaves the Postgres schema as it is), say why in a " +
      '`// sqlite-only: <reason>` comment directly above the postgres member',
  },
  {
    name: 'best-effort',
    label: 'best-effort step(s), which abort every pending migration on Postgres when they fail',
    advice:
      'execBestEffort, bestEffort and execUnlessTableMissing swallow a failed statement, but on Postgres the pending ' +
      'migrations run in one transaction that a failed statement aborts, so the next statement and the history row ' +
      'fail and the boot is refused. Write a statement that cannot fail instead: guard it in its WHERE clause, or ' +
      'check tableExists/columnNames from src/db/migration-utils.ts first',
  },
];
const POST_CUT_RULE_NAMES = new Set(POST_CUT_RULES.map((rule) => rule.name));

const SOURCE = /\.ts$/;
const TEST = /\.(?:test|spec)\./;

/** The `Migration<timestamp>` a migration's class name starts with, or null. */
function migrationId(name) {
  return /^(Migration\d+)(?:_|$)/.exec(name)?.[1] ?? null;
}

/**
 * 'skip', 'migration' (a newer one, DML rules only), 'post-cut' (one after
 * the Postgres baseline's `through` or after POSTGRES_FIRST_CUT, whichever
 * comes first: the DML rules and POST_CUT_RULES) or 'source'.
 */
export function classify(file, through) {
  if (file.startsWith(DIALECT_LAYER) || file.startsWith(SQLITE_ENGINE)) return 'skip';
  const migration = /^src\/db\/migrations\/(Migration\d+)_/.exec(file);
  if (migration) {
    if (migration[1] <= FROZEN_MIGRATIONS_THROUGH) return 'skip';
    const cut = [migrationId(through), POSTGRES_FIRST_CUT].sort()[0];
    return migration[1] > cut ? 'post-cut' : 'migration';
  }
  if (file.startsWith('src/db/migrations/')) return 'skip';
  return 'source';
}

/**
 * The Postgres baseline's cut, from its manifest. A missing or malformed one
 * stops the run: without it no migration would be held to POST_CUT_RULES.
 */
export function readThrough(serverDir) {
  let through;
  try {
    through = JSON.parse(readFileSync(join(serverDir, POSTGRES_BASELINE_MANIFEST), 'utf8')).through;
  } catch (err) {
    throw new Error(`${POSTGRES_BASELINE_MANIFEST} cannot be read: ${err.message}`);
  }
  if (typeof through !== 'string' || migrationId(through) === null) {
    throw new Error(`${POSTGRES_BASELINE_MANIFEST} must name the last migration it stands for in "through"`);
  }
  return through;
}

/** The name a call is made by: `engineDdl(...)` and `utils.engineDdl(...)` alike. */
function calleeName(node) {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return null;
}

/** Whether `node` is an object literal naming both engines, the shape engineDdl and addColumnIfMissing take. */
function isPerEngineObject(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return false;
  const names = node.properties
    .filter((property) => ts.isPropertyAssignment(property) && ts.isIdentifier(property.name))
    .map((property) => property.name.text);
  return names.includes('sqlite') && names.includes('postgres');
}

/**
 * PRAGMA is fine in src/db/*.ts (connection, durability, baseline, snapshot),
 * the migrations and the SQLite engine's own folder (src/db/engine/sqlite/).
 */
export function pragmaAllowed(file) {
  return (
    /^src\/db\/[^/]+\.ts$/.test(file) ||
    file.startsWith('src/db/migrations/') ||
    file.startsWith('src/db/engine/sqlite/')
  );
}

function isSqlTag(node) {
  let tag = node.tag;
  if (ts.isPropertyAccessExpression(tag)) tag = tag.expression;
  return ts.isIdentifier(tag) && tag.text === 'sql';
}

/** The text of a string or template literal, or null. An interpolation is code, scanned on its own. */
function literalText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    // An interpolated value reads as what it stands for in SQL, a bound value.
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' ? ');
  }
  return null;
}

/** The statements of one SQL text, `--` comments and empty ones left out. */
function statementsOf(text) {
  return text
    .replace(/--[^\n]*/g, ' ')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

/** The `sqlite` or `postgres` property of a per-engine object. */
function engineMember(object, name) {
  return object.properties.find(
    (property) => ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && property.name.text === name,
  );
}

/**
 * How many literals of an engineDdl sqlite member hold a statement that is
 * not a schema change (SQLITE_SCHEMA_STATEMENT, the sequence bookkeeping, or
 * a copy into a table the same member creates). A member that is not an array
 * literal, and an element that is not a literal, count too: what the check
 * cannot read, it cannot let through.
 */
function sqliteMemberProblems(initializer) {
  if (!ts.isArrayLiteralExpression(initializer)) return 1;
  const texts = initializer.elements.map(literalText);
  const created = new Set(
    texts
      .flatMap((text) => (text === null ? [] : statementsOf(text)))
      .map((statement) => CREATED_TABLE.exec(statement)?.[1]?.toLowerCase())
      .filter(Boolean),
  );
  const isSchemaChange = (statement) =>
    SQLITE_SCHEMA_STATEMENT.test(statement) ||
    SQLITE_SEQUENCE_STATEMENT.test(statement) ||
    created.has(TABLE_COPY.exec(statement)?.[1]?.toLowerCase());
  return texts.filter((text) => text === null || !statementsOf(text).every(isSchemaChange)).length;
}

/**
 * Whether an engineDdl call hands SQLite statements and Postgres none, with no
 * `sqlite-only: <reason>` comment above its postgres member.
 */
function emptyPostgresUnexplained(object, sourceText) {
  const sqlite = engineMember(object, 'sqlite');
  const postgres = engineMember(object, 'postgres');
  if (!ts.isArrayLiteralExpression(sqlite.initializer) || sqlite.initializer.elements.length === 0) return false;
  if (!ts.isArrayLiteralExpression(postgres.initializer) || postgres.initializer.elements.length > 0) return false;
  const comments = ts.getLeadingCommentRanges(sourceText, postgres.getFullStart()) ?? [];
  return !comments.some((range) => SQLITE_ONLY_MARKER.test(sourceText.slice(range.pos, range.end)));
}

/** Whether `rule` applies to a file of `kind` ('source', 'migration' or 'post-cut'). */
function ruleApplies(rule, kind) {
  if (kind === 'source') return true;
  if (rule.migrations === 'post-cut') return kind === 'post-cut';
  return rule.migrations;
}

/**
 * Hits per rule in one file's source. `through` is the Postgres baseline's
 * cut; a migration after it is held to POST_CUT_RULES as well.
 */
export function scanSource(file, text, through) {
  const kind = classify(file, through);
  const counts = {};
  if (kind === 'skip') return counts;
  const postCut = kind === 'post-cut';
  const add = (rule) => {
    counts[rule] = (counts[rule] ?? 0) + 1;
  };
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const lines = text.split('\n');
  // A rule's marker comment excuses a hit on its own line or the line above.
  const marked = (rule, node) => {
    if (!rule.marker) return false;
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    return rule.marker.test(lines[line]) || (line > 0 && rule.marker.test(lines[line - 1]));
  };

  // `engine` is the member of an engineDdl or addColumnIfMissing argument a
  // literal sits in: 'sqlite' (SQLite's own DDL, whose shape the engineDdl
  // call checks), 'postgres' (no SQLite spelling) or null (anywhere else).
  const checkText = (literal, node, inSqlTag, engine) => {
    if (engine === 'sqlite') return;
    if (engine === 'postgres') {
      const sqliteOnly =
        SQLITE_ONLY_DDL.test(literal) || RULES.some((rule) => !rule.postgresSpells && rule.test(literal, inSqlTag));
      if (sqliteOnly) add('sqlite-ddl');
      return;
    }
    if (postCut && DDL_STATEMENT.test(literal)) add('ddl');
    for (const rule of RULES) {
      if (!ruleApplies(rule, kind)) continue;
      if (rule.name === 'pragma' && pragmaAllowed(file)) continue;
      if (rule.test(literal, inSqlTag) && !marked(rule, node)) add(rule.name);
    }
  };
  const like = RULES.find((rule) => rule.name === 'like');

  const visitPerEngine = (object, inSqlTag) => {
    for (const property of object.properties) {
      const name = ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) ? property.name.text : null;
      if (name === 'sqlite' || name === 'postgres') visit(property.initializer, inSqlTag, name);
      else visit(property, inSqlTag, null);
    }
  };

  const visit = (node, inSqlTag, engine) => {
    if (ts.isTaggedTemplateExpression(node) && isSqlTag(node)) {
      ts.forEachChild(node, (child) => visit(child, true, engine));
      return;
    }
    if (postCut && engine === null && ts.isCallExpression(node)) {
      const name = calleeName(node);
      if (SQLITE_ONLY_HELPERS.has(name)) add('ddl');
      if (BEST_EFFORT_HELPERS.has(name)) add('best-effort');
      // A plain string would hand Postgres the SQLite spelling of the column.
      if (name === 'addColumnIfMissing' && !isPerEngineObject(node.arguments[3])) add('ddl');
      if (ENGINE_DDL_CALLS.has(name)) {
        visit(node.expression, inSqlTag, null);
        for (const argument of node.arguments) {
          if (!isPerEngineObject(argument)) {
            visit(argument, inSqlTag, null);
            continue;
          }
          if (name === 'engineDdl') {
            const problems = sqliteMemberProblems(engineMember(argument, 'sqlite').initializer);
            for (let i = 0; i < problems; i++) add('sqlite-member');
            if (emptyPostgresUnexplained(argument, text)) add('empty-postgres');
          }
          visitPerEngine(argument, inSqlTag);
        }
        return;
      }
    }
    const literal = literalText(node);
    if (literal !== null) {
      checkText(literal, node, inSqlTag, engine);
    } else if (
      engine === null &&
      ruleApplies(like, kind) &&
      (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      node.name.text === '$like' &&
      !marked(like, node)
    ) {
      // MikroORM's `{ title: { $like: ... } }` is the same LIKE as in SQL text.
      add('like');
    } else if (ts.isPropertyAccessExpression(node) && node.name.text === 'insertId') {
      add(INSERT_ID_RULE);
    } else if (
      ts.isBindingElement(node) &&
      ((node.propertyName && ts.isIdentifier(node.propertyName) && node.propertyName.text === 'insertId') ||
        (!node.propertyName && ts.isIdentifier(node.name) && node.name.text === 'insertId'))
    ) {
      add(INSERT_ID_RULE);
    }
    ts.forEachChild(node, (child) => visit(child, inSqlTag, engine));
  };
  visit(sf, false, null);
  return counts;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (SOURCE.test(name) && !TEST.test(name) && !name.endsWith('.d.ts')) files.push(path);
  }
  return files;
}

/** `{ file: { rule: n } }` for every file under src/ with at least one hit. */
export function scan(serverDir) {
  const src = join(serverDir, 'src');
  if (!existsSync(src) || !statSync(src).isDirectory()) {
    throw new Error(`src/ does not exist under ${serverDir}: the check would pass without looking at anything`);
  }
  const through = readThrough(serverDir);
  const result = {};
  for (const path of walk(src)) {
    const file = relative(serverDir, path).split('\\').join('/');
    const counts = scanSource(file, readFileSync(path, 'utf8'), through);
    if (Object.keys(counts).length > 0) result[file] = sortKeys(counts);
  }
  return sortKeys(result);
}

function sortKeys(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

const RULE_NAMES = new Set([...RULES.map((r) => r.name), INSERT_ID_RULE]);

/** The committed baseline. Missing or malformed stops the run rather than reading as empty. */
export function readBaseline(path) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`scripts/dialect-baseline.json cannot be read: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('scripts/dialect-baseline.json must be an object of file paths to { rule: count }');
  }
  for (const [file, rules] of Object.entries(parsed)) {
    if (rules === null || typeof rules !== 'object' || Array.isArray(rules)) {
      throw new Error(`scripts/dialect-baseline.json: ${file} must map rule names to counts`);
    }
    for (const [rule, n] of Object.entries(rules)) {
      if (POST_CUT_RULE_NAMES.has(rule)) {
        throw new Error(
          `scripts/dialect-baseline.json: ${file} holds an allowance for ${rule}, which a migration after the ` +
            "Postgres baseline's cut never gets",
        );
      }
      if (!RULE_NAMES.has(rule))
        throw new Error(`scripts/dialect-baseline.json: ${file} names an unknown rule "${rule}"`);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(
          `scripts/dialect-baseline.json: ${file} ${rule} holds ${JSON.stringify(n)}, expected a positive integer`,
        );
      }
    }
  }
  return parsed;
}

/** The baseline lowered to what the files hold now. Never raises an entry, never adds one. */
export function lowerBaseline(baseline, counts) {
  const lowered = {};
  for (const [file, rules] of Object.entries(baseline)) {
    const kept = {};
    for (const [rule, allowed] of Object.entries(rules)) {
      const now = counts[file]?.[rule] ?? 0;
      if (now > 0) kept[rule] = Math.min(allowed, now);
    }
    if (Object.keys(kept).length > 0) lowered[file] = sortKeys(kept);
  }
  return sortKeys(lowered);
}

/** New hits over the baseline, and baseline entries above what their file holds now. */
export function compare(baseline, counts) {
  const grown = [];
  for (const [file, rules] of Object.entries(counts)) {
    for (const [rule, n] of Object.entries(rules)) {
      const allowed = baseline[file]?.[rule] ?? 0;
      if (n > allowed) grown.push({ file, rule, n, allowed });
    }
  }
  const lowered = lowerBaseline(baseline, counts);
  const stale = [];
  for (const [file, rules] of Object.entries(baseline)) {
    for (const [rule, allowed] of Object.entries(rules)) {
      const now = lowered[file]?.[rule] ?? 0;
      if (now !== allowed) stale.push({ file, rule, allowed, now: counts[file]?.[rule] ?? 0 });
    }
  }
  return { grown, stale };
}

function adviceFor(rule) {
  if (rule === INSERT_ID_RULE) return "read the new id with .returning('id'); insertId is undefined on Postgres";
  return [...RULES, ...POST_CUT_RULES].find((r) => r.name === rule).advice;
}

function labelFor(rule) {
  return POST_CUT_RULES.find((r) => r.name === rule)?.label ?? `SQLite-only ${rule} hit(s)`;
}

function main(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, 'scripts', 'dialect-baseline.json');
  const update = argv.includes('--update');

  const counts = scan(serverDir);
  let baseline = readBaseline(baselinePath);
  if (update) {
    baseline = lowerBaseline(baseline, counts);
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  }

  const { grown, stale } = compare(baseline, counts);
  for (const { file, rule, n, allowed } of grown) {
    console.error(`FAIL  ${file}: ${n} ${labelFor(rule)}, ${allowed} allowed. ${adviceFor(rule)}.`);
  }
  for (const { file, rule, allowed, now } of stale) {
    console.error(
      `FAIL  ${file} is held at ${allowed} ${rule} hit(s) in scripts/dialect-baseline.json, but has ${now} now.`,
    );
  }
  if (stale.length) {
    console.error('Run npm run lint:dialect -- --update to lower the baseline with the change that removed them.');
  }
  const total = Object.values(baseline).reduce(
    (sum, rules) => sum + Object.values(rules).reduce((a, b) => a + b, 0),
    0,
  );
  console.log(
    `dialect: ${Object.keys(baseline).length} file(s) hold ${total} SQLite-only spelling(s) at their baseline`,
  );
  return grown.length || stale.length ? 1 : 0;
}

const isCli =
  Boolean(process.argv[1]) &&
  existsSync(process.argv[1]) &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(`FAIL  ${err.message}`);
    process.exitCode = 1;
  }
}
