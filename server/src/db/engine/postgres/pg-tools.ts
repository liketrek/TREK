import { CURRENT_SCHEMA_TABLES_SQL } from '../../dialect/catalog';
import { CLEAR_SCHEMA_SQL, pluginSchemasSql } from './clear-schema';
import { pgConnectionEnv, PgOutputLimitError, refuseClientOlderThanServer, run, runToFile } from './pg-process';
import { isPluginSchemaName, PLUGIN_SCHEMA_PREFIX } from './plugin-schema';
import { refuseToolsWithoutRestrict } from './restore-safety';
import { PRIVILEGED_ROLE_DESCRIPTION, PRIVILEGED_ROLE_SQL, serverMajor } from './server-checks';

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
  `TREK_DB_URL connects as ${PRIVILEGED_ROLE_DESCRIPTION}. ` +
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
  /** The plugin data schemas TREK's role owns (`plugin-schema.ts`), which a dump holds beside TREK's own. */
  pluginSchemas: string[];
  /** The server's major version, which the client tools must reach. */
  major: number;
  /** Whether TREK's role could reach the database host from SQL (`PRIVILEGED_ROLE_SQL`). */
  privileged: boolean;
}

/**
 * One line, tab-separated: the current schema, its quoted name, the server
 * version, whether the role is privileged, and the plugin schemas the role
 * owns, comma-separated.
 */
const SERVER_SQL =
  "select concat_ws(E'\\t', coalesce(current_schema(), ''), coalesce(quote_ident(current_schema()), ''), " +
  `current_setting('server_version_num'), (${PRIVILEGED_ROLE_SQL})::text, ` +
  "(select coalesce(string_agg(nspname, ',' order by nspname), '') from pg_namespace " +
  `where starts_with(nspname, '${PLUGIN_SCHEMA_PREFIX}') and pg_get_userbyid(nspowner) = current_user))`;

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
  const [name, quoted, version, privileged, plugins = ''] = out.replace(/\n$/, '').split('\t');
  if (!name || !quoted) {
    throw new Error('The database has no current schema: set the search_path of the role in TREK_DB_URL.');
  }
  return {
    schema: { name, quoted },
    pluginSchemas: plugins.split(',').filter(isPluginSchemaName),
    major: serverMajor(version),
    privileged: privileged === 'true',
  };
}

/**
 * Writes a custom-format dump of the current schema of the database at `url`,
 * and of the plugin data schemas TREK's role owns, to `target`, readable by
 * its owner only. No other schema of the database is read. It is written beside the target and
 * renamed into place, so a dump that fails or is killed never leaves a file
 * that passes for a copy. A pg_dump older than the server is refused first.
 */
export async function pgDump(url: string, target: string, binDir: string | undefined): Promise<void> {
  const partial = `${target}.partial`;
  try {
    createPrivateFile(partial);
    const { schema, pluginSchemas, major } = await pgServer(url, binDir);
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
        // A plugin schema's name holds lowercase letters, digits and underscores, none of them pattern syntax.
        ...pluginSchemas.map((plugin) => `--schema=${plugin}`),
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
  schemas: readonly string[],
  binDir: string | undefined,
  maxBytes: number,
): Promise<void> {
  const only = schemas.map((name) => `--schema=${name}`);
  const args = ['--no-owner', '--no-privileges', ...only, '--file=-', '--', source];
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
 * `source`, and the plugin data schemas with the dump's: pg_restore turns the
 * dump's objects in those schemas into a script beside it (anything else the
 * dump holds is left out), then psql clears the schema, drops the plugin
 * schemas TREK's role owns, creates the dump's and runs the script, all in
 * one transaction, so a restore that fails leaves the database as it was. No
 * other schema of the database is touched. Refused before anything is cleared:
 *
 * - client tools without the CVE-2025-8714 fix, or older than the server;
 * - a role that could reach the database host from SQL (`PRIVILEGED_ROLE_SQL`),
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
    const pluginSchemas = await dumpPluginSchemas(source, path.join(workDir, 'toc.txt'), binDir);
    fs.writeFileSync(clear, CLEAR_SCHEMA_SQL + pluginSchemasSql(pluginSchemas), { mode: 0o600 });
    createPrivateFile(script);
    await writeRestoreScript(source, script, [schema.name, ...pluginSchemas], binDir, maxScriptBytes);
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

/**
 * The plugin data schemas the dump at `source` holds, read from its table of
 * contents (`pg_restore --list`, written to `toc`), which has a line
 * `<id>; <oid> <oid> SCHEMA - <name> <owner>` per schema. Only a name TREK
 * gives a plugin schema counts.
 */
async function dumpPluginSchemas(source: string, toc: string, binDir: string | undefined): Promise<string[]> {
  createPrivateFile(toc);
  await run('pg_restore', binDir, ['--list', `--file=${toc}`, '--', source], {});
  const names = new Set<string>();
  for (const line of fs.readFileSync(toc, 'utf8').split('\n')) {
    const name = /^\d+; \d+ \d+ SCHEMA - (\S+) /.exec(line)?.[1];
    if (name !== undefined && isPluginSchemaName(name)) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
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
  // A plugin may name a table of its own schema mikro_orm_migrations too; only TREK's counts.
  const copy = lines.findIndex((line) => {
    const match = /^COPY (?:(\S+)\.)?mikro_orm_migrations \(/.exec(line);
    return match !== null && !isPluginSchemaName(match[1] ?? '');
  });
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
