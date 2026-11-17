/**
 * Which suites run in the Postgres lane (vitest.pg.config.ts), worked out from
 * the test files themselves instead of a list someone has to remember.
 *
 * A suite belongs on Postgres when it boots the app on the real database
 * module: it reaches `src/bootstrap.ts` (buildApp) or `src/nest/app.module.ts`
 * (bootTestApp and the like) through its imports, directly or through a
 * helper under tests/, and it does not `vi.mock` `src/db/database`. Such a
 * suite gets its ORM from `src/mikro-orm.config.ts`, which follows
 * TREK_DB_URL, so it runs unchanged on both engines. A suite that mocks
 * `db/database` has put an in-memory SQLite snapshot in its place and seeds
 * through that handle, so it can only run on SQLite.
 *
 * Two lists hold the exceptions, and tests/unit/postgres-lane.test.ts keeps
 * both honest:
 *   - SQLITE_ONLY: suites that stay on SQLite by design, each with its
 *     reason. Most are on the real database module; the legacy upgrade
 *     suites mock `db/database` onto a SQLite file the retired positional
 *     runner built (Postgres never had that runner), which the scan
 *     tells apart from the snapshot mock because they never name
 *     `createSnapshotTestDb`.
 *   - snapshot-suites-baseline.json: the suites that boot the app over the
 *     SQLite snapshot mock. It may only shrink; a new suite that boots the app
 *     is written on the real database module and so runs on both engines.
 *
 * Plain Node and the TypeScript scanner only, no vitest: vitest.pg.config.ts
 * imports this while it loads.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const TESTS_ROOT = path.join(SERVER_ROOT, 'tests');

/** The Postgres-only suites (schema parity, engine semantics), always in the lane. */
export const POSTGRES_ONLY_SUITES = 'tests/postgres/**/*.test.ts';

/** Importing either of these is what booting the app means here. */
const BOOT_MODULES = ['src/bootstrap.ts', 'src/nest/app.module.ts'].map((file) => path.join(SERVER_ROOT, file));

/** The module whose `vi.mock` puts a SQLite snapshot in place of the real database. */
const DATABASE_MODULE = path.join(SERVER_ROOT, 'src', 'db', 'database.ts');

/** The reason shared by the legacy upgrade suites (tests/helpers/legacy-upgrade-suite.ts). */
const LEGACY_UPGRADE =
  'Boots on a SQLite file the retired positional runner built (tests/fixtures/legacy/) to prove the legacy ' +
  'baseline adopts it. That runner only ever wrote SQLite; a Postgres database starts from the Postgres ' +
  'baseline or from db:move-to-postgres, never from a schema_version install.';

/**
 * Suites that boot the app and still stay on SQLite, keyed by path from
 * server/, each with the reason: on the real database module, or mocking it
 * onto a SQLite database of their own that is not the snapshot. A reason has
 * to be about SQLite itself; "not ported yet" is not one.
 */
export const SQLITE_ONLY: Readonly<Record<string, string>> = {
  'tests/e2e/tours-hike.e2e.test.ts':
    'Moves a faked setTimeout on by a tenth of a second per turn of the event loop until a tool call ends. ' +
    'A synchronous SQLite answers within a few turns; a database over the network does not, and the MCP ' +
    'request times out on the faked clock.',
  'tests/e2e/tours-plan-types.e2e.test.ts':
    'Same faked clock as tours-hike: the tool call has to finish within a few turns of the event loop, ' +
    'which only a synchronous SQLite does.',
  'tests/integration/database-lifecycle.test.ts':
    'About the SQLite connection: asserts the :memory: file, and has the SQLite backup port close, swap ' +
    'and reopen the better-sqlite3 handle under the ORM.',
  'tests/integration/demo-reset-connection-swap.spike.test.ts':
    'Closes and reopens the better-sqlite3 handle in src/db/database.ts mid request context; the Postgres ' +
    'engine has no such handle.',
  'tests/integration/legacy-upgrade-v066.test.ts': LEGACY_UPGRADE,
  'tests/integration/legacy-upgrade-v082.test.ts': LEGACY_UPGRADE,
  'tests/integration/legacy-upgrade-v205.test.ts': LEGACY_UPGRADE,
  'tests/integration/legacy-upgrade-v242.test.ts': LEGACY_UPGRADE,
  'tests/integration/legacy-upgrade-v244.test.ts': LEGACY_UPGRADE,
  'tests/integration/places-nul-sqlite.test.ts':
    'About SQLite value quoting of a NUL byte (U+0000) in a user string; Postgres text cannot hold that ' +
    'character, so the round-trip it asserts does not exist there. The other control characters run on ' +
    'both engines in places.test.ts.',
};

const SNAPSHOT_BASELINE_FILE = path.join(__dirname, 'snapshot-suites-baseline.json');

/** Server-relative path with forward slashes, the form every list here uses. */
function relative(file: string): string {
  return path.relative(SERVER_ROOT, file).split(path.sep).join('/');
}

function listTestFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'fixtures' ? [] : listTestFiles(full);
    return entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

const sources = new Map<string, string>();
function source(file: string): string {
  let text = sources.get(file);
  if (text === undefined) {
    text = fs.readFileSync(file, 'utf8');
    sources.set(file, text);
  }
  return text;
}

/** A relative module specifier resolved the way the TypeScript sources write them (no extension). */
function resolveSpecifier(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), specifier);
  for (const candidate of [`${base}.ts`, base, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Static imports, re-exports, `import()` and `require()`; comments are not read as code. */
const imports = new Map<string, string[]>();
function importsOf(file: string): string[] {
  let targets = imports.get(file);
  if (targets === undefined) {
    targets = ts
      .preProcessFile(source(file), true, true)
      .importedFiles.map((ref) => resolveSpecifier(file, ref.fileName))
      .filter((target): target is string => target !== null);
    imports.set(file, targets);
  }
  return targets;
}

/**
 * Whether `file` reaches a boot module through its imports. Only test code is
 * followed (tests/**): the boot modules are the targets, and what src imports
 * internally says nothing about how a suite builds the app.
 */
function bootsTheApp(file: string): boolean {
  const seen = new Set<string>([file]);
  const pending = [file];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    for (const target of importsOf(next)) {
      if (BOOT_MODULES.includes(target)) return true;
      if (target.startsWith(TESTS_ROOT) && !seen.has(target)) {
        seen.add(target);
        pending.push(target);
      }
    }
  }
  return false;
}

/** The file's code as tokens, comments dropped. */
function tokens(file: string): Array<{ kind: ts.SyntaxKind; text: string }> {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source(file));
  const out: Array<{ kind: ts.SyntaxKind; text: string }> = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    out.push({ kind, text: kind === ts.SyntaxKind.StringLiteral ? scanner.getTokenValue() : scanner.getTokenText() });
  }
  return out;
}

/** Whether the suite uses the SQLite snapshot (tests/helpers/db-mock.ts) in code. */
function namesTheSnapshot(file: string): boolean {
  return tokens(file).some((token) => token.kind === ts.SyntaxKind.Identifier && token.text === 'createSnapshotTestDb');
}

/** Whether the suite replaces `src/db/database` with `vi.mock`/`vi.doMock`. */
function mocksTheDatabase(file: string): boolean {
  const list = tokens(file);
  return list.some((token, i) => {
    if (token.text !== 'vi' || list[i + 1]?.kind !== ts.SyntaxKind.DotToken) return false;
    if (!['mock', 'doMock'].includes(list[i + 2]?.text ?? '')) return false;
    const target = list[i + 4];
    if (list[i + 3]?.kind !== ts.SyntaxKind.OpenParenToken || target?.kind !== ts.SyntaxKind.StringLiteral)
      return false;
    return resolveSpecifier(file, target.text) === DATABASE_MODULE;
  });
}

/**
 * Names that build the whole app. A suite that uses one in code but does not
 * reach a boot module through its imports got there some way this file does
 * not follow; the guard test fails on it so the discovery gets fixed.
 */
const BOOT_NAMES = new Set(['buildApp', 'bootTestApp', 'AppModule']);

const DECLARING = new Set([
  ts.SyntaxKind.FunctionKeyword,
  ts.SyntaxKind.ConstKeyword,
  ts.SyntaxKind.LetKeyword,
  ts.SyntaxKind.VarKeyword,
  ts.SyntaxKind.ClassKeyword,
]);

/** Whether the file uses one of BOOT_NAMES that it does not declare itself (a local `function buildApp` builds a bare module). */
function namesABootEntryPoint(file: string): boolean {
  const list = tokens(file);
  const declared = new Set(
    list
      .filter((token, i) => i > 0 && DECLARING.has(list[i - 1].kind) && BOOT_NAMES.has(token.text))
      .map((t) => t.text),
  );
  return list.some(
    (token) => token.kind === ts.SyntaxKind.Identifier && BOOT_NAMES.has(token.text) && !declared.has(token.text),
  );
}

export interface LaneScan {
  /** Suites that boot the app on the real database module (SQLITE_ONLY included). */
  realDatabase: string[];
  /** Suites that boot the app over the SQLite snapshot mock. */
  snapshot: string[];
  /**
   * Suites named in SQLITE_ONLY that mock `src/db/database` onto a SQLite
   * database of their own, never the snapshot (the legacy upgrade fixtures).
   */
  ownSqlite: string[];
  /** Suites that name a boot entry point in code but were not found to import one. */
  undiscovered: string[];
}

/** Every server test file, sorted into the groups above. tests/postgres/ is the lane's own and is left out. */
export function scanSuites(): LaneScan {
  const scan: LaneScan = { realDatabase: [], snapshot: [], ownSqlite: [], undiscovered: [] };
  const own = path.join(TESTS_ROOT, 'postgres') + path.sep;
  for (const file of listTestFiles(TESTS_ROOT).sort()) {
    if (file.startsWith(own)) continue;
    if (bootsTheApp(file)) {
      const name = relative(file);
      if (!mocksTheDatabase(file)) scan.realDatabase.push(name);
      else if (name in SQLITE_ONLY && !namesTheSnapshot(file)) scan.ownSqlite.push(name);
      else scan.snapshot.push(name);
    } else if (namesABootEntryPoint(file)) {
      scan.undiscovered.push(relative(file));
    }
  }
  return scan;
}

/** The `include` of vitest.pg.config.ts: every suite on the real database module but SQLITE_ONLY, plus tests/postgres/. */
export function postgresLane(scan: LaneScan = scanSuites()): string[] {
  return [POSTGRES_ONLY_SUITES, ...scan.realDatabase.filter((file) => !(file in SQLITE_ONLY))];
}

export function readSnapshotBaseline(): string[] {
  const parsed: unknown = JSON.parse(fs.readFileSync(SNAPSHOT_BASELINE_FILE, 'utf8'));
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
    throw new Error(`${relative(SNAPSHOT_BASELINE_FILE)} must be a JSON array of paths`);
  }
  return parsed;
}
