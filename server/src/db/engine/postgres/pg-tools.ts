import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** The Postgres client tools a backup runs. */
type PgTool = 'pg_dump' | 'pg_restore' | 'psql';

/**
 * Where the client tools are looked for when `TREK_DB_PG_BIN_DIR` is unset:
 * Debian's versioned directories newest first (the Docker image installs 17),
 * then the usual prefixes. Never PATH: a binary is run by its absolute path.
 */
const DEFAULT_BIN_DIRS = [
  '/usr/lib/postgresql/17/bin',
  '/usr/lib/postgresql/16/bin',
  '/usr/lib/postgresql/15/bin',
  '/usr/lib/postgresql/14/bin',
  '/usr/local/bin',
  '/usr/bin',
];

/** A dump or a restore of a large database takes minutes, not hours. */
const TOOL_TIMEOUT_MS = 30 * 60 * 1000;
const TOOL_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
/** An unreachable host fails the tool in seconds instead of holding a boot or a restore. */
const CONNECT_TIMEOUT_SECONDS = '10';
/**
 * A restore waiting on a lock another session holds gives up, and rolls back,
 * instead of hanging; the NOTICEs every CASCADE prints stay out of its stderr.
 */
const RESTORE_SESSION_OPTIONS = '-c lock_timeout=60s -c client_min_messages=warning';
/** How much of a tool's stderr an error keeps. */
const STDERR_LIMIT = 2000;
/** stderr lines that quote SQL or row data: they stay out of errors and logs. */
const DATA_LINE = /^\s*(Command was:|CONTEXT:|DETAIL:|LINE \d+:|QUERY:)/;

/**
 * Drops every table, view, sequence, routine, collation and standalone type in
 * the current schema, except an extension's, before a dump is loaded: a dump only recreates what it
 * holds, so whatever a later migration added would otherwise survive the
 * restore and break the migrations the reopen runs. It runs in the same
 * transaction as the load, so a restore that fails leaves the database as it
 * was.
 */
const CLEAR_SCHEMA_SQL = `DO $clear$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.oid::regclass AS name, c.relkind FROM pg_class c
    WHERE c.relnamespace = current_schema()::regnamespace AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype IN ('e', 'a', 'i'))
  LOOP
    EXECUTE format('DROP %s IF EXISTS %s CASCADE',
      CASE r.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' WHEN 'S' THEN 'SEQUENCE'
        WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END, r.name);
  END LOOP;
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
    WHERE p.pronamespace = current_schema()::regnamespace
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('DROP ROUTINE IF EXISTS %s CASCADE', r.sig);
  END LOOP;
  FOR r IN SELECT format('%I.%I', n.nspname, c.collname) AS name FROM pg_collation c
    JOIN pg_namespace n ON n.oid = c.collnamespace
    WHERE n.nspname = current_schema()
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('DROP COLLATION IF EXISTS %s CASCADE', r.name);
  END LOOP;
  FOR r IN SELECT t.oid::regtype AS name FROM pg_type t
    WHERE t.typnamespace = current_schema()::regnamespace AND t.typtype IN ('e', 'd', 'r')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = t.oid AND d.deptype IN ('e', 'i'))
  LOOP
    EXECUTE format('DROP TYPE IF EXISTS %s CASCADE', r.name);
  END LOOP;
END
$clear$;
`;

/** The absolute path of `tool`, or null when it is not installed where TREK looks. */
export function resolvePgTool(tool: PgTool, binDir: string | undefined): string | null {
  const dirs = binDir ? [binDir] : DEFAULT_BIN_DIRS;
  const executable = (candidate: string): boolean => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false; // missing or not executable: the next directory may have it
    }
  };
  return dirs.map((dir) => path.join(dir, tool)).find(executable) ?? null;
}

/**
 * The libpq environment for `url`: the tools read the password from
 * PGPASSWORD, so it never appears in an argument list another process can
 * read. An sslmode that asks for SSL verifies the server's certificate, as the
 * app's own pool does (`postgres-engine.ts`): against the URL's sslrootcert,
 * else the system's trusted CAs.
 */
export function pgConnectionEnv(url: string): Record<string, string> {
  const parsed = new URL(url);
  const env: Record<string, string> = {
    PGHOST: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
    PGPORT: parsed.port || '5432',
    PGDATABASE: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    PGCONNECT_TIMEOUT: CONNECT_TIMEOUT_SECONDS,
  };
  if (parsed.username) env.PGUSER = decodeURIComponent(parsed.username);
  if (parsed.password) env.PGPASSWORD = decodeURIComponent(parsed.password);
  const sslmode = parsed.searchParams.get('sslmode');
  if (sslmode === 'disable') env.PGSSLMODE = 'disable';
  else if (sslmode) {
    env.PGSSLMODE = 'verify-full';
    env.PGSSLROOTCERT = parsed.searchParams.get('sslrootcert') ?? 'system';
  }
  return env;
}

/** A client tool, refused with a clear message when it is not installed. */
export class PgToolMissingError extends Error {
  constructor(tool: PgTool) {
    super(
      `${tool} was not found, so a Postgres database cannot be backed up or restored. ` +
        'Install the PostgreSQL client tools (the Docker image has them) or point TREK_DB_PG_BIN_DIR at them.',
    );
    this.name = 'PgToolMissingError';
  }
}

/** The tool's own message, without the lines that quote SQL or rows, and bounded. */
function summarizeStderr(stderr: string | undefined): string {
  const kept = (stderr ?? '')
    .split('\n')
    .filter((line) => line.trim() !== '' && !DATA_LINE.test(line))
    .join('\n');
  return kept.length > STDERR_LIMIT ? `${kept.slice(0, STDERR_LIMIT)}…` : kept;
}

async function run(
  tool: PgTool,
  binDir: string | undefined,
  args: string[],
  env: Record<string, string>,
): Promise<string> {
  const binary = resolvePgTool(tool, binDir);
  if (!binary) throw new PgToolMissingError(tool);
  try {
    const { stdout } = await execFileAsync(binary, args, {
      env,
      timeout: TOOL_TIMEOUT_MS,
      maxBuffer: TOOL_MAX_OUTPUT_BYTES,
    });
    return stdout;
  } catch (err) {
    // stderr is the tool's own message; the password is in env, never in it.
    const message = summarizeStderr((err as { stderr?: string }).stderr);
    throw new Error(`${tool} failed${message ? `: ${message}` : ''}`, { cause: err });
  }
}

/** An empty file only its owner can read: the tool writing into it keeps the mode. */
function createPrivateFile(file: string): void {
  fs.writeFileSync(file, '', { mode: 0o600 });
}

/** The schema TREK's tables live in: its name, and the name as SQL quotes it (`quote_ident`). */
interface PgSchema {
  name: string;
  quoted: string;
}

/**
 * The current schema of the database at `url`, the one TREK creates its
 * tables in. A backup and a restore stay inside it: a hosted database
 * (Supabase) keeps the platform's own schemas, `auth` among them, beside it,
 * and they are neither TREK's to copy nor to replace.
 */
async function pgCurrentSchema(url: string, binDir: string | undefined): Promise<PgSchema> {
  const out = await run(
    'psql',
    binDir,
    [
      '--no-psqlrc',
      '--no-align',
      '--tuples-only',
      "--command=select concat_ws(E'\\t', current_schema(), quote_ident(current_schema()))",
    ],
    pgConnectionEnv(url),
  );
  const [name, quoted] = out.replace(/\n$/, '').split('\t');
  if (!name || !quoted) {
    throw new Error('The database has no current schema: set the search_path of the role in TREK_DB_URL.');
  }
  return { name, quoted };
}

/**
 * Writes a custom-format dump of the current schema of the database at `url`
 * to `target`, readable by its owner only. It is written beside the target and
 * renamed into place, so a dump that fails or is killed never leaves a file
 * that passes for a copy.
 */
export async function pgDump(url: string, target: string, binDir: string | undefined): Promise<void> {
  const partial = `${target}.partial`;
  try {
    createPrivateFile(partial);
    const schema = await pgCurrentSchema(url, binDir);
    await run(
      'pg_dump',
      binDir,
      [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file=${partial}`,
        // A pattern in double quotes matches that one name, as written.
        `--schema="${schema.name.replaceAll('"', '""')}"`,
      ],
      pgConnectionEnv(url),
    );
    fs.renameSync(partial, target);
  } catch (err) {
    fs.rmSync(partial, { force: true });
    throw err;
  }
}

/**
 * The first minor of each major whose pg_restore and psql carry the fix for
 * CVE-2025-8714; every major after 17 has it from its first release.
 */
const RESTRICT_SINCE: Readonly<Record<number, number>> = { 14: 19, 15: 14, 16: 10, 17: 6 };
const LAST_MAJOR_WITHOUT_IT = 17;
const OLDEST_MAJOR = 14;

/** Whether `version` (`pg_restore (PostgreSQL) 17.11 (Debian …)`) carries the fix. */
export function hasRestrictFix(version: string): boolean {
  const match = /\(PostgreSQL\) (\d+)\.(\d+)/.exec(version);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  if (major > LAST_MAJOR_WITHOUT_IT) return true;
  return major >= OLDEST_MAJOR && minor >= RESTRICT_SINCE[major];
}

/**
 * A script from a dump an admin uploaded is run by psql, which would also run
 * a psql meta-command (`\!` runs a shell command) smuggled into an object
 * name. A fixed pg_restore opens the script with `\restrict <random key>`, and
 * a fixed psql then refuses every meta-command until the matching
 * `\unrestrict` (CVE-2025-8714). The tools' own versions are checked, not the
 * script, whose text the dump controls.
 */
async function refuseToolsWithoutRestrict(binDir: string | undefined): Promise<void> {
  const tools = ['pg_restore', 'psql'] as const;
  const versions = await Promise.all(tools.map((tool) => run(tool, binDir, ['--version'], {})));
  const stale = tools.findIndex((_, i) => !hasRestrictFix(versions[i]));
  if (stale >= 0) {
    throw new Error(
      `${tools[stale]} is too old to restore safely (${versions[stale].trim()}): it must be at least 17.6, 16.10, ` +
        '15.14 or 14.19 (the Docker image has 17). Upgrade the PostgreSQL client tools or point TREK_DB_PG_BIN_DIR at newer ones.',
    );
  }
}

/** Escapes every character a RegExp would read as syntax. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whether the restore script creates TREK's migration table in `schema`: a
 * dump of TREK's own schema does. The script is read line by line and the
 * read stops at the first match: the COPY data that fills a large script is
 * never loaded, and a script past V8's maximum string length would not load
 * at all.
 */
async function scriptHoldsTrekSchema(script: string, schema: PgSchema): Promise<boolean> {
  const createsHistory = new RegExp(`^CREATE TABLE ${escapeRegExp(`${schema.quoted}.mikro_orm_migrations`)} \\(`);
  const input = fs.createReadStream(script, { encoding: 'utf8' });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      if (createsHistory.test(line)) return true;
    }
    return false;
  } finally {
    lines.close();
    input.destroy();
  }
}

/**
 * Replaces the current schema of the database at `url` with the dump at
 * `source`: pg_restore turns the dump's objects in that schema into a script
 * beside it (anything else the dump holds is left out), then psql clears the
 * schema and runs the script in one transaction, so a restore that fails
 * leaves the database as it was. A dump without TREK's tables in that schema
 * is refused before anything is cleared.
 */
export async function pgRestore(url: string, source: string, binDir: string | undefined): Promise<void> {
  await refuseToolsWithoutRestrict(binDir);
  const schema = await pgCurrentSchema(url, binDir);
  const workDir = fs.mkdtempSync(path.join(path.dirname(source), '.pg-restore-'));
  try {
    const clear = path.join(workDir, 'clear-schema.sql');
    const script = path.join(workDir, 'restore.sql');
    fs.writeFileSync(clear, CLEAR_SCHEMA_SQL, { mode: 0o600 });
    createPrivateFile(script);
    await run(
      'pg_restore',
      binDir,
      ['--no-owner', '--no-privileges', `--schema=${schema.name}`, `--file=${script}`, '--', source],
      {},
    );
    if (!(await scriptHoldsTrekSchema(script, schema))) {
      throw new Error(`The backup holds no TREK tables in the schema "${schema.name}"; nothing was replaced.`);
    }
    await run(
      'psql',
      binDir,
      [
        '--no-psqlrc',
        '--quiet',
        '--single-transaction',
        '--set=ON_ERROR_STOP=1',
        '--output=/dev/null',
        `--file=${clear}`,
        `--file=${script}`,
      ],
      { ...pgConnectionEnv(url), PGOPTIONS: RESTORE_SESSION_OPTIONS },
    );
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/** The tables in the current schema of the database at `url`, read before TREK opens it. */
export async function pgTableNames(url: string, binDir: string | undefined): Promise<string[]> {
  const out = await run(
    'psql',
    binDir,
    [
      '--no-psqlrc',
      '--no-align',
      '--tuples-only',
      '--command=select table_name from information_schema.tables where table_schema = current_schema()',
    ],
    pgConnectionEnv(url),
  );
  return out.split('\n').filter((line) => line !== '');
}

/**
 * The migrations a dump records as executed, read from the dump itself (its
 * `mikro_orm_migrations` rows as COPY text), so a restore can refuse a newer
 * TREK's backup before anything is replaced. Throws on a file that is not a
 * dump; an empty list means the dump holds no TREK history.
 */
export async function pgDumpMigrations(source: string, binDir: string | undefined): Promise<string[]> {
  const script = await run(
    'pg_restore',
    binDir,
    ['--data-only', '--table=mikro_orm_migrations', '--file=-', '--', source],
    {},
  );
  const lines = script.split('\n');
  const copy = lines.findIndex((line) => /^COPY \S*mikro_orm_migrations \(/.test(line));
  if (copy < 0) return [];
  const columns =
    /\(([^)]*)\)/
      .exec(lines[copy])?.[1]
      .split(',')
      .map((column) => column.trim()) ?? [];
  const nameAt = columns.indexOf('name');
  if (nameAt < 0) return [];
  const names: string[] = [];
  for (const line of lines.slice(copy + 1)) {
    if (line === '\\.' || line === '') break;
    const name = line.split('\t')[nameAt];
    if (name) names.push(name);
  }
  return names;
}
