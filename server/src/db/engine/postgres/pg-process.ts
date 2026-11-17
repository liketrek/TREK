import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/** The Postgres client tools a backup runs. */
export type PgTool = 'pg_dump' | 'pg_restore' | 'psql';

/**
 * Where the client tools are looked for when `TREK_DB_PG_BIN_DIR` is unset:
 * Debian's versioned directories newest first (the Docker image installs 18),
 * then the usual prefixes. Newest first because a client dumps and restores
 * every server up to its own major version and refuses a newer one. Never
 * PATH: a binary is run by its absolute path.
 */
const DEFAULT_BIN_DIRS = [
  '/usr/lib/postgresql/18/bin',
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
/** How much of a streaming tool's stderr is held while it runs, before it is summarized. */
const STDERR_CAPTURE_LIMIT = 64 * 1024;
/** stderr lines that quote SQL or row data: they stay out of errors and logs. */
const DATA_LINE = /^\s*(Command was:|CONTEXT:|DETAIL:|LINE \d+:|QUERY:)/;
/** libpq reads `sslrootcert=system` as the system's trusted CAs from this major on; older clients read it as a file name. */
const SYSTEM_ROOT_CERT_SINCE = 16;

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
 * else the system's trusted CAs (`system`, which `run` accepts only from a
 * client that understands it).
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

/** A tool that wrote more than the caller allowed; it was stopped and its output is incomplete. */
export class PgOutputLimitError extends Error {
  constructor(
    tool: PgTool,
    readonly limitBytes: number,
  ) {
    super(`${tool} wrote more than ${limitBytes} bytes and was stopped`);
    this.name = 'PgOutputLimitError';
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
 * The error a failed tool run throws: `<tool> failed: <its stderr, summarized>`.
 * Its cause names only how the process ended (exit code, signal, whether the
 * timeout killed it), never the process error itself, whose message and
 * `stderr` hold the tool's whole stderr, row data included, and would reach
 * the log through the cause chain.
 */
function toolFailure(tool: PgTool, failure: unknown): Error {
  const { stderr, code, signal, killed } = (failure ?? {}) as {
    stderr?: unknown;
    code?: unknown;
    signal?: unknown;
    killed?: unknown;
  };
  const message = summarizeStderr(typeof stderr === 'string' ? stderr : undefined);
  const ending = signal ? `signal ${String(signal)}` : `code ${String(code)}`;
  const cause = Object.assign(new Error(`${tool} ended with ${ending}${killed === true ? ' (timed out)' : ''}`), {
    code,
    signal,
    killed,
  });
  return new Error(`${tool} failed${message ? `: ${message}` : ''}`, { cause });
}

/** The major version in a tool's `--version` line (`pg_dump (PostgreSQL) 18.1 (Debian …)`), or null. */
function toolMajor(version: string): number | null {
  const match = /\(PostgreSQL\) (\d+)/.exec(version);
  return match ? Number(match[1]) : null;
}

/** `binary --version`, read directly: the check before a run must not go through `run` itself. */
async function binaryVersion(tool: PgTool, binary: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(binary, ['--version'], { env: {}, timeout: TOOL_TIMEOUT_MS });
    return stdout;
  } catch (err) {
    throw toolFailure(tool, err);
  }
}

/** The absolute path of `tool`, or the refusal that says how to install it. */
function locate(tool: PgTool, binDir: string | undefined): string {
  const binary = resolvePgTool(tool, binDir);
  if (!binary) throw new PgToolMissingError(tool);
  return binary;
}

/**
 * Refuses to run a client older than libpq 16 with `sslrootcert=system`: it
 * would read `system` as a file name and fail on every connection. Such a
 * client needs the CA file named in the URL.
 */
async function refuseSystemRootCertOnOldClient(
  tool: PgTool,
  binary: string,
  env: Record<string, string>,
): Promise<void> {
  if (env.PGSSLROOTCERT !== 'system') return;
  const version = await binaryVersion(tool, binary);
  const major = toolMajor(version);
  if (major !== null && major >= SYSTEM_ROOT_CERT_SINCE) return;
  throw new Error(
    `${tool} (${version.trim()}) cannot verify the server against the system's trusted certificate authorities, ` +
      `which needs a client of version ${SYSTEM_ROOT_CERT_SINCE} or later. Add sslrootcert=<CA file> to TREK_DB_URL, ` +
      'or point TREK_DB_PG_BIN_DIR at newer client tools (the Docker image has them).',
  );
}

/** The major version of `tool` as TREK would run it. */
async function pgToolMajor(tool: PgTool, binDir: string | undefined): Promise<number | null> {
  return toolMajor(await binaryVersion(tool, locate(tool, binDir)));
}

/**
 * Refuses `tools` when one is older than the server it is about to talk to:
 * pg_dump refuses a newer server outright, and what an older pg_restore or
 * psql makes of a newer server's dump is not something a restore should find
 * out halfway. A newer client is fine; it handles every older server.
 */
export async function refuseClientOlderThanServer(
  tools: readonly PgTool[],
  binDir: string | undefined,
  serverMajor: number,
): Promise<void> {
  for (const tool of tools) {
    const major = await pgToolMajor(tool, binDir);
    if (major !== null && major >= serverMajor) continue;
    throw new Error(
      `${tool} is version ${major ?? 'unknown'}, older than the PostgreSQL ${serverMajor} server, which it cannot ` +
        `back up or restore. Point TREK_DB_PG_BIN_DIR at client tools of version ${serverMajor} or later ` +
        '(the Docker image has the newest supported ones).',
    );
  }
}

/**
 * Runs `tool` by its absolute path and resolves with its stdout. A failure
 * throws `<tool> failed: <its stderr, summarized>`.
 */
export async function run(
  tool: PgTool,
  binDir: string | undefined,
  args: string[],
  env: Record<string, string>,
): Promise<string> {
  const binary = locate(tool, binDir);
  await refuseSystemRootCertOnOldClient(tool, binary, env);
  try {
    const { stdout } = await execFileAsync(binary, args, {
      env,
      timeout: TOOL_TIMEOUT_MS,
      maxBuffer: TOOL_MAX_OUTPUT_BYTES,
    });
    return stdout;
  } catch (err) {
    throw toolFailure(tool, err);
  }
}

/** How a spawned tool ended: its exit, or the error that kept it from starting. */
type Ending = { code: number | null; signal: NodeJS.Signals | null } | { error: Error };

/**
 * Runs `tool` and streams its stdout into `target` (which must exist; its mode
 * is kept), stopping the tool with {@link PgOutputLimitError} once more than
 * `maxBytes` have come out. The caller removes `target` on failure. A failure
 * of the tool itself throws as `run` does.
 */
export async function runToFile(
  tool: PgTool,
  binDir: string | undefined,
  args: string[],
  env: Record<string, string>,
  target: string,
  maxBytes: number,
): Promise<void> {
  const binary = locate(tool, binDir);
  await refuseSystemRootCertOnOldClient(tool, binary, env);
  const child = spawn(binary, args, { env, stdio: ['ignore', 'pipe', 'pipe'], timeout: TOOL_TIMEOUT_MS });
  const ended = new Promise<Ending>((resolve) => {
    child.once('error', (error) => resolve({ error }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    if (stderr.length < STDERR_CAPTURE_LIMIT) stderr += chunk;
  });
  let written = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      written += chunk.length;
      if (written > maxBytes) callback(new PgOutputLimitError(tool, maxBytes));
      else callback(null, chunk);
    },
  });
  try {
    await pipeline(child.stdout, limit, fs.createWriteStream(target, { flags: 'w' }));
  } catch (err) {
    child.kill('SIGKILL');
    await ended;
    throw err instanceof PgOutputLimitError ? err : toolFailure(tool, { stderr, code: 'stream' });
  }
  const ending = await ended;
  if ('error' in ending) throw toolFailure(tool, { stderr, code: (ending.error as { code?: unknown }).code });
  if (ending.code !== 0) throw toolFailure(tool, { stderr, code: ending.code, signal: ending.signal });
}
