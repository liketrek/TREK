import { readEnv } from '../../app-config';
import { resolveDataPaths } from '../../app-config/data-paths';
import { correlationTag, currentCorrelation } from '../common/request-correlation';
import { BufferedLogFile } from './log-file';

/**
 * The server's rotating file logger, a plain module and NOT an injectable
 * (index.ts lazy-requires it before any Nest container exists). Every line goes
 * to the console at once and to `data/logs/trek.log` through a buffered,
 * asynchronous sink (log-file.ts), so logging never waits for the disk.
 * Nothing touches the disk at import: the directory appears with the first
 * flush. A line written inside a unit of work (an HTTP request, an MCP call,
 * a WebSocket message, a plugin RPC, a cron tick) carries its correlation tag,
 * `[http 1b9d...]`, after the timestamp. The LOG_LEVEL freeze below is the
 * one deliberate import-time behavior and is load-bearing for tests/setup.ts.
 */

// Frozen at import on purpose (legacy timing; tests/setup.ts sets it pre-import).
const LOG_LEVEL = (readEnv().app.logLevel || 'info').toLowerCase();
// Severity threshold: a level logs only if it is at or above LOG_LEVEL's rank
// (error < warn < info < debug). Unknown values fall back to 'info', matching
// the legacy default.
const LEVEL_RANKS: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const LOG_THRESHOLD = LEVEL_RANKS[LOG_LEVEL] ?? LEVEL_RANKS.info;
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_LOG_FILES = 5;

const C = {
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

// ── File sink ─────────────────────────────────────────────────────────────

const logFile = new BufferedLogFile({
  // From the data layout, like every other data path. It used to be cwd-based,
  // which agreed only because the image and `npm run dev` both start in server/.
  dir: resolveDataPaths().logsDir,
  file: 'trek.log',
  maxBytes: MAX_LOG_SIZE,
  maxFiles: MAX_LOG_FILES,
  onError: (message) => console.error(`[logger] ${message}`),
});

/** Resolves once every line logged so far is in trek.log. */
export function flushLogFile(): Promise<void> {
  return logFile.flush();
}

/** Writes what is still queued, synchronously: for the process exit handler only. */
export function flushLogFileSync(): void {
  logFile.flushSync();
}

// ── Public log helpers ────────────────────────────────────────────────────

/** Timestamp, then the correlation tag of the current unit of work when there is one. */
function prefix(): string {
  const tz = readEnv().app.tz || 'UTC';
  const ts = new Date().toLocaleString('sv-SE', { timeZone: tz }).replace(' ', 'T');
  return `${ts} ${correlationTag(currentCorrelation())}`;
}

export function logInfo(msg: string): void {
  if (LOG_THRESHOLD < LEVEL_RANKS.info) return;
  const ts = prefix();
  console.log(`${C.blue}[INFO]${C.reset} ${ts}${msg}`);
  logFile.write(`[INFO] ${ts}${msg}`);
}

export function logDebug(msg: string): void {
  if (LOG_THRESHOLD < LEVEL_RANKS.debug) return;
  const ts = prefix();
  console.log(`${C.cyan}[DEBUG]${C.reset} ${ts}${msg}`);
  logFile.write(`[DEBUG] ${ts}${msg}`);
}

export function logError(msg: string): void {
  const ts = prefix();
  console.error(`${C.red}[ERROR]${C.reset} ${ts}${msg}`);
  logFile.write(`[ERROR] ${ts}${msg}`);
}

export function logWarn(msg: string): void {
  if (LOG_THRESHOLD < LEVEL_RANKS.warn) return;
  const ts = prefix();
  console.warn(`${C.yellow}[WARN]${C.reset} ${ts}${msg}`);
  logFile.write(`[WARN] ${ts}${msg}`);
}

export { LOG_LEVEL };
