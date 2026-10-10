#!/usr/bin/env node
/*
 * lint:dialect: SQLite-only SQL may only shrink.
 *
 * The server runs on SQLite today and is meant to run on Postgres next. What
 * stands in the way is SQL that only SQLite understands, spelled out inline:
 * INSERT OR IGNORE, datetime('now'), strftime, json_extract, GLOB,
 * last_insert_rowid, PRAGMA, AUTOINCREMENT and `||` string concatenation.
 * Each of them has a dialect-neutral form: the query builder's onConflict(),
 * returning('id'), or a helper in src/db/dialect/ (sql-functions.ts and its
 * Kysely twin kysely-functions.ts), which dispatches on the live platform
 * and is the one place allowed to spell an engine's own forms.
 *
 * The check reads every string and template literal under src/ (comments
 * never count) and every `.insertId` read, counts the hits per file and rule,
 * and holds them to scripts/dialect-baseline.json. A new hit fails, and so
 * does a baseline entry above what its file holds now, so the change that
 * removes one lowers the baseline with --update in the same commit.
 *
 * Not scanned: src/db/dialect/ (the dialect layer itself) and
 * the migrations that have shipped (append-only, never edited again; the last
 * one is FROZEN_MIGRATIONS_THROUGH). A newer migration is scanned for the
 * DML rules; its DDL may still be engine specific. PRAGMA is allowed in the
 * src/db/ lifecycle files (src/db/*.ts and the migrations), nowhere else.
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

/** The dialect layer: the one place that may spell an engine's own SQL. */
const DIALECT_LAYER = 'src/db/dialect/';

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
    test: (text) => /\bjson_(extract|each|set|patch|insert|replace|remove|group_array|group_object)\b/i.test(text),
    advice: 'read the JSON column and parse it in the service, or add a helper to sql-functions.ts',
    migrations: true,
  },
  {
    name: 'glob',
    test: (text) => /\bGLOB\b/.test(text) || text.trim().toLowerCase() === 'glob',
    advice: 'use LIKE, or startsWithIsoDate and its siblings in sql-functions.ts',
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
  },
];

/** `.insertId` reads, the JS face of last_insert_rowid. */
const INSERT_ID_RULE = 'insert-id';

const SOURCE = /\.ts$/;
const TEST = /\.(?:test|spec)\./;

/** 'skip', 'migration' (a newer one, DML rules only) or 'source'. */
export function classify(file) {
  if (file.startsWith(DIALECT_LAYER)) return 'skip';
  const migration = /^src\/db\/migrations\/(Migration\d+)_/.exec(file);
  if (migration) return migration[1] <= FROZEN_MIGRATIONS_THROUGH ? 'skip' : 'migration';
  if (file.startsWith('src/db/migrations/')) return 'skip';
  return 'source';
}

/** PRAGMA is fine in src/db/*.ts (connection, durability, baseline, snapshot) and the migrations. */
export function pragmaAllowed(file) {
  return /^src\/db\/[^/]+\.ts$/.test(file) || file.startsWith('src/db/migrations/');
}

function isSqlTag(node) {
  let tag = node.tag;
  if (ts.isPropertyAccessExpression(tag)) tag = tag.expression;
  return ts.isIdentifier(tag) && tag.text === 'sql';
}

/** Hits per rule in one file's source. */
export function scanSource(file, text) {
  const kind = classify(file);
  const counts = {};
  if (kind === 'skip') return counts;
  const add = (rule) => {
    counts[rule] = (counts[rule] ?? 0) + 1;
  };
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const checkText = (literal, inSqlTag) => {
    for (const rule of RULES) {
      if (kind === 'migration' && !rule.migrations) continue;
      if (rule.name === 'pragma' && pragmaAllowed(file)) continue;
      if (rule.test(literal, inSqlTag)) add(rule.name);
    }
  };

  const visit = (node, inSqlTag) => {
    if (ts.isTaggedTemplateExpression(node) && isSqlTag(node)) {
      ts.forEachChild(node, (child) => visit(child, true));
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      checkText(node.text, inSqlTag);
    } else if (ts.isTemplateExpression(node)) {
      // The literal parts only: an interpolated value is code, scanned on its own.
      checkText([node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' '), inSqlTag);
    } else if (ts.isPropertyAccessExpression(node) && node.name.text === 'insertId') {
      add(INSERT_ID_RULE);
    } else if (
      ts.isBindingElement(node) &&
      ((node.propertyName && ts.isIdentifier(node.propertyName) && node.propertyName.text === 'insertId') ||
        (!node.propertyName && ts.isIdentifier(node.name) && node.name.text === 'insertId'))
    ) {
      add(INSERT_ID_RULE);
    }
    ts.forEachChild(node, (child) => visit(child, inSqlTag));
  };
  visit(sf, false);
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
  const result = {};
  for (const path of walk(src)) {
    const file = relative(serverDir, path).split('\\').join('/');
    const counts = scanSource(file, readFileSync(path, 'utf8'));
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
  return RULES.find((r) => r.name === rule).advice;
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
    console.error(`FAIL  ${file}: ${n} SQLite-only ${rule} hit(s), ${allowed} allowed. ${adviceFor(rule)}.`);
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
