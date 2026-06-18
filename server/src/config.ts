import { SUPPORTED_LANGUAGE_CODES as SUPPORTED_LANG_CODES } from '@trek/shared';

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(__dirname, '../data');
const jwtSecretFile = path.join(dataDir, '.jwt_secret');

// ENCRYPTION_KEY is used to derive at-rest encryption keys for stored secrets
// (API keys, MFA TOTP secrets, SMTP password, OIDC client secret, etc.).
// Keeping it separate from JWT_SECRET means you can rotate session tokens without
// invalidating all stored encrypted data, and vice-versa.
//
// Resolution order:
//   1. ENCRYPTION_KEY env var — explicit, always takes priority.
//   2. data/.encryption_key file — present on any install that has started at
//      least once (written automatically by cases 1b and 3 below).
//   3. data/.jwt_secret — one-time fallback for existing installs upgrading
//      without a pre-set ENCRYPTION_KEY. The value is immediately persisted to
//      data/.encryption_key so JWT rotation can never break decryption later.
//   4. Auto-generated — fresh install with none of the above; persisted to
//      data/.encryption_key.
const encKeyFile = path.join(dataDir, '.encryption_key');
let _encryptionKey: string = process.env.ENCRYPTION_KEY || '';

if (_encryptionKey) {
  // Env var is set explicitly — persist it to file so the value survives
  // container restarts even if the env var is later removed.
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(encKeyFile, _encryptionKey, { mode: 0o600 });
  } catch {
    // Non-fatal: env var is the source of truth when set.
  }
} else {
  // Try the dedicated key file first (covers all installs after first start).
  try {
    _encryptionKey = fs.readFileSync(encKeyFile, 'utf8').trim();
  } catch {
    // File not found — first start on an existing or fresh install.
  }

  if (!_encryptionKey) {
    // One-time migration: existing install upgrading for the first time.
    // Use the JWT secret as the encryption key and immediately write it to
    // .encryption_key so future JWT rotations cannot break decryption.
    try {
      _encryptionKey = fs.readFileSync(jwtSecretFile, 'utf8').trim();
      console.warn('WARNING: ENCRYPTION_KEY is not set. Falling back to JWT secret for at-rest encryption.');
      console.warn('The value has been persisted to data/.encryption_key — JWT rotation is now safe.');
    } catch {
      // JWT secret not found — must be a fresh install.
    }
  }

  if (!_encryptionKey) {
    // Fresh install — auto-generate a dedicated key.
    _encryptionKey = crypto.randomBytes(32).toString('hex');
  }

  // Persist whatever key was resolved so subsequent starts skip the fallback chain.
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(encKeyFile, _encryptionKey, { mode: 0o600 });
    console.log('Encryption key persisted to', encKeyFile);
  } catch (writeErr: unknown) {
    console.warn(
      'WARNING: Could not persist encryption key to disk:',
      writeErr instanceof Error ? writeErr.message : writeErr,
    );
    console.warn('Set ENCRYPTION_KEY env var to avoid losing access to encrypted secrets on restart.');
  }
}

export const ENCRYPTION_KEY = _encryptionKey;

// JWT_SECRET is always managed by the server — auto-generated on first start and
// persisted to data/.jwt_secret. Use the admin panel to rotate it; do not set it
// via environment variable (env var would override a rotation on next restart).
let _jwtSecret: string;

try {
  _jwtSecret = fs.readFileSync(jwtSecretFile, 'utf8').trim();
} catch {
  _jwtSecret = crypto.randomBytes(32).toString('hex');
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(jwtSecretFile, _jwtSecret, { mode: 0o600 });
    console.log('Generated and saved JWT secret to', jwtSecretFile);
  } catch (writeErr: unknown) {
    console.warn(
      'WARNING: Could not persist JWT secret to disk:',
      writeErr instanceof Error ? writeErr.message : writeErr,
    );
    console.warn('Sessions will reset on server restart.');
  }
}

// export let so TypeScript's CJS output keeps exports.JWT_SECRET live
// (generates `exports.JWT_SECRET = JWT_SECRET = newVal` inside updateJwtSecret)
export let JWT_SECRET = _jwtSecret;

// Called by the admin rotate-jwt-secret endpoint to update the in-process
// binding that all middleware and route files reference.
export function updateJwtSecret(newSecret: string): void {
  JWT_SECRET = newSecret;
}

// DEFAULT_LANGUAGE sets the language shown on the login page before the user
// selects one. Only applies when the user has no saved language preference.
const rawDefaultLang = process.env.DEFAULT_LANGUAGE?.toLowerCase() || 'en';
if (!SUPPORTED_LANG_CODES.includes(rawDefaultLang)) {
  console.warn(
    `DEFAULT_LANGUAGE="${rawDefaultLang}" is not supported. Falling back to "en". Supported: ${SUPPORTED_LANG_CODES.join(', ')}`,
  );
}
export const DEFAULT_LANGUAGE = SUPPORTED_LANG_CODES.includes(rawDefaultLang) ? rawDefaultLang : 'en';

// SESSION_DURATION controls how long a TREK session (the `trek_session` JWT
// cookie) stays valid before re-login is required. Accepts ms-style strings:
// '1h', '12h', '7d', '30d', '90d', etc. It applies to BOTH the JWT `exp` claim
// and the cookie `maxAge`, so the two never drift apart. Invalid values warn at
// startup and fall back to the default. Does not affect the short-lived MFA
// challenge token or MCP OAuth tokens — those keep their own TTL.
const DEFAULT_SESSION_DURATION = '24h';
const DURATION_UNITS_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  y: 31_557_600_000,
};
function parseDurationMs(value: string): number | null {
  const m = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)?$/i.exec(value.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n * DURATION_UNITS_MS[(m[2] || 'ms').toLowerCase()];
}
const rawSessionDuration = process.env.SESSION_DURATION?.trim() || DEFAULT_SESSION_DURATION;
const parsedSessionMs = parseDurationMs(rawSessionDuration);
if (parsedSessionMs == null) {
  console.warn(
    `SESSION_DURATION="${rawSessionDuration}" is not a valid duration (use e.g. 1h, 7d, 30d). Falling back to "${DEFAULT_SESSION_DURATION}".`,
  );
}
/** Human-readable session length actually in effect (for logs/diagnostics). */
export const SESSION_DURATION = parsedSessionMs == null ? DEFAULT_SESSION_DURATION : rawSessionDuration;
/** Session length in milliseconds — used for the cookie `maxAge`. */
export const SESSION_DURATION_MS = parsedSessionMs ?? parseDurationMs(DEFAULT_SESSION_DURATION)!;
/** Session length in seconds — passed to `jwt.sign({ expiresIn })` (number = seconds). */
export const SESSION_DURATION_SECONDS = Math.floor(SESSION_DURATION_MS / 1000);

// SESSION_DURATION_REMEMBER is the session length used when the user ticks
// "Remember me" on the login form: a longer-lived JWT `exp` claim plus a
// persistent `trek_session` cookie `maxAge`. An unticked login keeps
// SESSION_DURATION and a browser-session cookie (no `maxAge`). Same ms-style
// format and fallback behavior as SESSION_DURATION.
const DEFAULT_SESSION_DURATION_REMEMBER = '30d';
const rawRememberDuration = process.env.SESSION_DURATION_REMEMBER?.trim() || DEFAULT_SESSION_DURATION_REMEMBER;
const parsedRememberMs = parseDurationMs(rawRememberDuration);
if (parsedRememberMs == null) {
  console.warn(
    `SESSION_DURATION_REMEMBER="${rawRememberDuration}" is not a valid duration (use e.g. 7d, 30d, 90d). Falling back to "${DEFAULT_SESSION_DURATION_REMEMBER}".`,
  );
}
/** Human-readable "remember me" session length actually in effect (for logs/diagnostics). */
export const SESSION_DURATION_REMEMBER =
  parsedRememberMs == null ? DEFAULT_SESSION_DURATION_REMEMBER : rawRememberDuration;
/** "Remember me" session length in milliseconds — used for the persistent cookie `maxAge`. */
export const SESSION_DURATION_REMEMBER_MS = parsedRememberMs ?? parseDurationMs(DEFAULT_SESSION_DURATION_REMEMBER)!;
/** "Remember me" session length in seconds — passed to `jwt.sign({ expiresIn })`. */
export const SESSION_DURATION_REMEMBER_SECONDS = Math.floor(SESSION_DURATION_REMEMBER_MS / 1000);
