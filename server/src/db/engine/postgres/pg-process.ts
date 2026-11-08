import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** The Postgres client tools a backup runs. */
export type PgTool = 'pg_dump' | 'pg_restore' | 'psql';

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
/** How much of a tool's stderr an error keeps. */
const STDERR_LIMIT = 2000;
/** stderr lines that quote SQL or row data: they stay out of errors and logs. */
const DATA_LINE = /^\s*(Command was:|CONTEXT:|DETAIL:|LINE \d+:|QUERY:)/;

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

/**
 * Runs `tool` by its absolute path and resolves with its stdout. A failure
 * throws `<tool> failed: <its stderr, summarized>`, with the original error as
 * the cause.
 */
export async function run(
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
    const message = summarizeStderr((err as { stderr?: string }).stderr);
    throw new Error(`${tool} failed${message ? `: ${message}` : ''}`, { cause: err });
  }
}
