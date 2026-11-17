import { CURRENT_SCHEMA_TABLES_SQL } from '../../dialect/catalog';
import { CLEAR_SCHEMA_SQL } from './clear-schema';
import { pgConnectionEnv, PgOutputLimitError, refuseClientOlderThanServer, run, runToFile } from './pg-process';
import { refuseToolsWithoutRestrict } from './restore-safety';
import { PRIVILEGED_ROLE_SQL, serverMajor } from './server-checks';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

/**
 * Restore's session settings: a restore waiting on a lock another session
 * holds gives up, and rolls back, instead of hanging; the NOTICEs every
 * CASCADE prints stay out of its stderr.
 */
const RESTORE_SESSION_OPTIONS = '-c lock_timeout=60s -c client_min_messages=warning';

/** Why a restore refuses a role that could reach the database host (`PRIVILEGED_ROLE_SQL`). */
const PRIVILEGED_RESTORE_REFUSAL =
  'TREK_DB_URL connects as a superuser, or as a role that may run programs or write files on the database server. ' +
  'A backup archive is a SQL script that runs as this role, so a crafted one could take over the database host; ' +
  'nothing was replaced. Connect TREK as a role that owns its database and is not a superuser ' +
  '(the wiki page "Database: Postgres" shows how).';

/** An empty file only its owner can read: the tool writing into it keeps the mode. */
function createPrivateFile(file: string): void {
  fs.writeFileSync(file, '', { mode: 0o600 });
}

/** The schema TREK's tables live in: its name, and the name as SQL quotes it (`quote_ident`). */
interface PgSchema {
  name: string;
  quoted: string;
}

/** What a dump or a restore needs to know about the server before it runs. */
interface PgServer {
  schema: PgSchema;
  /** The server's major version, which the client tools must reach. */
  major: number;
  /** Whether TREK's role could run programs or write files on the database host (`PRIVILEGED_ROLE_SQL`). */
  privileged: boolean;
}

/** One line, tab-separated: the current schema, its quoted name, the server version, whether the role is privileged. */
const SERVER_SQL =
  "select concat_ws(E'\\t', coalesce(current_schema(), ''), coalesce(quote_ident(current_schema()), ''), " +
  `current_setting('server_version_num'), (${PRIVILEGED_ROLE_SQL})::text)`;

/**
 * The current schema of the database at `url`, the one TREK creates its
 * tables in, with the server's version and what TREK's role may do there. A
 * backup and a restore stay inside that schema: a hosted database (Supabase)
 * keeps the platform's own schemas, `auth` among them, beside it, and they are
 * neither TREK's to copy nor to replace.
 */
async function pgServer(url: string, binDir: string | undefined): Promise<PgServer> {
  const out = await run(
    'psql',
    binDir,
    ['--no-psqlrc', '--no-align', '--tuples-only', `--command=${SERVER_SQL}`],
    pgConnectionEnv(url),
  );
  const [name, quoted, version, privileged] = out.replace(/\n$/, '').split('\t');
  if (!name || !quoted) {
    throw new Error('The database has no current schema: set the search_path of the role in TREK_DB_URL.');
  }
  return { schema: { name, quoted }, major: serverMajor(version), privileged: privileged === 'true' };
}

/**
 * Writes a custom-format dump of the current schema of the database at `url`
 * to `target`, readable by its owner only. It is written beside the target and
 * renamed into place, so a dump that fails or is killed never leaves a file
 * that passes for a copy. A pg_dump older than the server is refused first.
 */
export async function pgDump(url: string, target: string, binDir: string | undefined): Promise<void> {
  const partial = `${target}.partial`;
  try {
    createPrivateFile(partial);
    const { schema, major } = await pgServer(url, binDir);
    await refuseClientOlderThanServer(['pg_dump'], binDir, major);
    await run(
      'pg_dump',
      binDir,
      [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file=${partial}`,
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

/** pg_restore's script for the dump at `source`, written to `script` and held to `maxBytes`. */
async function writeRestoreScript(
  source: string,
  script: string,
  schema: PgSchema,
  binDir: string | undefined,
  maxBytes: number,
): Promise<void> {
  const args = ['--no-owner', '--no-privileges', `--schema=${schema.name}`, '--file=-', '--', source];
  try {
    await runToFile('pg_restore', binDir, args, {}, script, maxBytes);
  } catch (err) {
    if (!(err instanceof PgOutputLimitError)) throw err;
    throw new Error(
      `The backup's database expands to more than ${Number((maxBytes / 1024 / 1024).toFixed(2))} MB of SQL, the limit ` +
        'BACKUP_MAX_DECOMPRESSED_MB sets; nothing was replaced. Raise the limit if the backup is genuine.',
      { cause: err },
    );
  }
}

/**
 * Replaces the current schema of the database at `url` with the dump at
 * `source`: pg_restore turns the dump's objects in that schema into a script
 * beside it (anything else the dump holds is left out), then psql clears the
 * schema and runs the script in one transaction, so a restore that fails
 * leaves the database as it was. Refused before anything is cleared:
 *
 * - client tools without the CVE-2025-8714 fix, or older than the server;
 * - a role that could run programs or write files on the database host,
 *   since the script comes from an archive and runs as that role;
 * - a script past `maxScriptBytes` (BACKUP_MAX_DECOMPRESSED_MB): the dump is
 *   compressed once more inside the archive, so its script is held to the
 *   limit while pg_restore writes it, not only the archive's entry;
 * - a dump without TREK's tables in that schema.
 *
 * The work files are removed whatever happens.
 */
export async function pgRestore(
  url: string,
  source: string,
  binDir: string | undefined,
  maxScriptBytes: number,
): Promise<void> {
  await refuseToolsWithoutRestrict(binDir);
  const { schema, major, privileged } = await pgServer(url, binDir);
  if (privileged) throw new Error(PRIVILEGED_RESTORE_REFUSAL);
  await refuseClientOlderThanServer(['pg_restore', 'psql'], binDir, major);
  const workDir = fs.mkdtempSync(path.join(path.dirname(source), '.pg-restore-'));
  try {
    const clear = path.join(workDir, 'clear-schema.sql');
    const script = path.join(workDir, 'restore.sql');
    fs.writeFileSync(clear, CLEAR_SCHEMA_SQL, { mode: 0o600 });
    createPrivateFile(script);
    await writeRestoreScript(source, script, schema, binDir, maxScriptBytes);
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
        `--output=${os.devNull}`,
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
    ['--no-psqlrc', '--no-align', '--tuples-only', `--command=${CURRENT_SCHEMA_TABLES_SQL}`],
    pgConnectionEnv(url),
  );
  return out.split('\n').filter((line) => line !== '');
}

/**
 * The migration names in a restore script's COPY block for
 * `mikro_orm_migrations`, read from its `name` column; none when the script
 * has no such block.
 */
function migrationNamesFromCopy(script: string): string[] {
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
  return migrationNamesFromCopy(script);
}
