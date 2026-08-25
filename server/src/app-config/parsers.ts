/**
 * Pure env-string coercion helpers shared by the whole config layer (derive.ts,
 * env.schema.ts) and — until their call sites migrate — by legacy readers like
 * src/mcp/config.ts. Kept free of imports so units can test them in isolation.
 *
 * Each helper reproduces a coercion family that already exists in the codebase.
 * Parity is law: do NOT "fix" a family's quirks here (e.g. `numberOr` treating
 * "0" as unset) — call sites were written against the current semantics.
 */

const TRUE_VALUES = new Set(['true', '1', 'on', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'off', 'no']);

/**
 * Unified boolean coercion for env switches — the ONE deliberate departure from
 * legacy parity: historically each site accepted a different literal ('true'
 * vs '1' vs 'on'), so operators guessed. Now every boolean-like variable
 * accepts true/1/on/yes and false/0/off/no (any casing, padded ok) and derives
 * to a real boolean. Anything else — including unset and blank — returns
 * undefined so the field's default applies; out-of-family values are rejected
 * at boot by env.schema.ts anyway (undefined here is the safe fallback for
 * paths that skip validation, e.g. tests).
 */
export function parseBool(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const v = raw.trim().toLowerCase();
  if (TRUE_VALUES.has(v)) return true;
  if (FALSE_VALUES.has(v)) return false;
  return undefined;
}

/** `Number(raw) || fallback` — NaN, 0 and '' all fall back (PORT, plugin limits). */
export function numberOr(raw: string | undefined, fallback: number): number {
  return Number(raw) || fallback;
}

/** Finite and > 0, else fallback (IDEMPOTENCY_TTL_SECONDS, OVERPASS_TIMEOUT_MS, BACKUP_*). */
export function positiveNumberOr(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** `Number.parseInt` finite and > 0, else fallback (MCP_MAX_SESSION_PER_USER, MCP_RATE_LIMIT). */
export function positiveIntOr(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? '');
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Integer ≥ 0 (zero is meaningful — e.g. retries disabled), else the fallback. */
export function nonNegativeIntOr(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Comma-split + trim, null when unset — the websocket ALLOWED_ORIGINS variant (no empty-entry filter). */
export function csvList(raw: string | undefined): string[] | null {
  return raw ? raw.split(',').map((o) => o.trim()) : null;
}

/** Comma-split + trim + drop empties — the CORS ALLOWED_ORIGINS variant (globalMiddleware). */
export function csvListFiltered(raw: string | undefined): string[] | null {
  return raw
    ? raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : null;
}

/** Strip ALL trailing slashes (`/\/+$/`) — app-url.getAppUrl / TRANSIT_API_URL variant.
 *  Scanned rather than replaced: `/\/+$/` re-walks the slash run from every start
 *  position, which is quadratic on a slash-heavy value. Same result, same quirk. */
export function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47 /* '/' */) end--;
  return value.slice(0, end);
}

const DURATION_UNITS_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  y: 31_557_600_000,
};

/**
 * ms-style duration strings ('1h', '7d', '30d', …) → milliseconds, null when
 * invalid. Same grammar as the SESSION_DURATION parsing in src/config.ts.
 */
export function parseDurationMs(value: string): number | null {
  const m = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)?$/i.exec(value.trim());
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n * DURATION_UNITS_MS[(m[2] || 'ms').toLowerCase()];
}

/**
 * Session idle TTL in SECONDS via MCP_SESSION_TTL, default 1 hour, clamped to
 * 24h so a milliseconds-value typo can't produce a 1000-hour session.
 * (Same contract as src/mcp/config.ts, which commit 7 retires in favor of this.)
 */
export function resolveSessionTtlMs(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 24 * 60 * 60) * 1000 : 60 * 60 * 1000;
}

/**
 * SSE keep-alive interval in SECONDS via MCP_SSE_KEEPALIVE, default 25s
 * (below common proxy idle timeouts like nginx-ingress's 60s). 0 disables.
 */
export function resolveKeepaliveMs(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed * 1000 : 25_000;
}

/** SQLite's journal_mode vocabulary. WAL is the default and the right choice on local disk; DELETE and TRUNCATE are the ones that survive network storage (Azure App Service, SMB/NFS volumes), where WAL's shared-memory coordination is not reliable. */
const JOURNAL_MODES = ['DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'WAL', 'OFF'];

/** PRAGMA synchronous levels, in the order SQLite numbers them (0-3). */
const SYNCHRONOUS_LEVELS = ['OFF', 'NORMAL', 'FULL', 'EXTRA'];

export const DEFAULT_JOURNAL_MODE = 'WAL';

export interface Durability {
  journalMode: string;
  synchronous: string;
  /** Rejected input, phrased for the log. Resolution never throws — a typo in a pragma must not lock an operator out of their instance — so the process that opens the file prints these instead. */
  warnings: string[];
}

/**
 * TREK_DB_JOURNAL_MODE / TREK_DB_SYNCHRONOUS → the pragmas to apply.
 *
 * journal_mode is persisted in the database file header, so it outlives the
 * process that set it and every entry point opening the file read-write has to
 * agree on it (see src/db/durability.ts). Defaults reproduce what an existing
 * install runs today: WAL, and the synchronous=NORMAL that SQLite itself picks
 * for a WAL database. Anything other than WAL keeps a rollback journal, where
 * NORMAL means a power cut can lose the last transactions — those default to
 * FULL, otherwise moving off WAL for safety would only trade one risk for
 * another.
 */
export function resolveDurability(rawJournalMode: string | undefined, rawSynchronous: string | undefined): Durability {
  const warnings: string[] = [];

  let journalMode = DEFAULT_JOURNAL_MODE;
  const wanted = rawJournalMode?.trim().toUpperCase();
  if (wanted) {
    if (JOURNAL_MODES.includes(wanted)) {
      journalMode = wanted;
    } else {
      warnings.push(
        `TREK_DB_JOURNAL_MODE="${rawJournalMode}" is not a SQLite journal mode ` +
          `(${JOURNAL_MODES.join(', ')}) — using ${DEFAULT_JOURNAL_MODE}.`,
      );
    }
  }

  const defaultSynchronous = journalMode === DEFAULT_JOURNAL_MODE ? 'NORMAL' : 'FULL';
  let synchronous = defaultSynchronous;
  const wantedSync = rawSynchronous?.trim().toUpperCase();
  if (wantedSync) {
    if (SYNCHRONOUS_LEVELS.includes(wantedSync)) {
      synchronous = wantedSync;
    } else {
      warnings.push(
        `TREK_DB_SYNCHRONOUS="${rawSynchronous}" is not a SQLite synchronous level ` +
          `(${SYNCHRONOUS_LEVELS.join(', ')}) — using ${defaultSynchronous}.`,
      );
    }
  }

  return { journalMode, synchronous, warnings };
}

/** `PRAGMA synchronous` reads back as a number — name it, so the boot log says FULL instead of 2. Unrecognized values pass through unchanged. */
export function synchronousName(level: unknown): string {
  return SYNCHRONOUS_LEVELS[Number(level)] ?? String(level);
}
