import { readEnv } from '../../app-config';
import fs from 'fs';
import path from 'path';

/**
 * The server's rotating file logger — a plain module, NOT an injectable
 * (index.ts lazy-requires it before any Nest container exists). Directory
 * creation is lazy (first write), so importing the module has no disk side
 * effect; the LOG_LEVEL freeze below is the one deliberate import-time
 * behavior and is load-bearing for tests/setup.ts.
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
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  reset:   '\x1b[0m',
};

// ── File logger with rotation ─────────────────────────────────────────────

const logsDir = path.join(process.cwd(), 'data/logs');
const logFilePath = path.join(logsDir, 'trek.log');
let logsDirReady = false;

function ensureLogsDir(): void {
  if (logsDirReady) return;
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    logsDirReady = true;
  } catch (e) {
    console.error(`[logger] could not create ${logsDir}: ${e instanceof Error ? e.message : e}`);
  }
}

function rotateIfNeeded(): void {
  try {
    if (!fs.existsSync(logFilePath)) return;
    const stat = fs.statSync(logFilePath);
    if (stat.size < MAX_LOG_SIZE) return;

    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const src = i === 1 ? logFilePath : `${logFilePath}.${i - 1}`;
      const dst = `${logFilePath}.${i}`;
      if (fs.existsSync(src)) fs.renameSync(src, dst);
    }
  } catch (e) {
    console.error(`[logger] log rotation failed: ${e instanceof Error ? e.message : e}`);
  }
}

function writeToFile(line: string): void {
  try {
    ensureLogsDir();
    rotateIfNeeded();
    fs.appendFileSync(logFilePath, line + '\n');
  } catch (e) {
    console.error(`[logger] log file write failed: ${e instanceof Error ? e.message : e}`);
  }
}

// ── Public log helpers ────────────────────────────────────────────────────

function formatTs(): string {
  const tz = readEnv().app.tz || 'UTC';
  return new Date().toLocaleString('sv-SE', { timeZone: tz }).replace(' ', 'T');
}

export function logInfo(msg: string): void {
  if (LOG_THRESHOLD < LEVEL_RANKS.info) return;
  const ts = formatTs();
  console.log(`${C.blue}[INFO]${C.reset} ${ts} ${msg}`);
  writeToFile(`[INFO] ${ts} ${msg}`);
}

export function logDebug(msg: string): void {
  if (LOG_THRESHOLD < LEVEL_RANKS.debug) return;
  const ts = formatTs();
  console.log(`${C.cyan}[DEBUG]${C.reset} ${ts} ${msg}`);
  writeToFile(`[DEBUG] ${ts} ${msg}`);
}

export function logError(msg: string): void {
  const ts = formatTs();
  console.error(`${C.red}[ERROR]${C.reset} ${ts} ${msg}`);
  writeToFile(`[ERROR] ${ts} ${msg}`);
}

export function logWarn(msg: string): void {
  if (LOG_THRESHOLD < LEVEL_RANKS.warn) return;
  const ts = formatTs();
  console.warn(`${C.yellow}[WARN]${C.reset} ${ts} ${msg}`);
  writeToFile(`[WARN] ${ts} ${msg}`);
}

export { LOG_LEVEL };
