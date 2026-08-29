import { readEnv } from './app-config';

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
  } catch (readErr: unknown) {
    const code = (readErr as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') {
      // The file is there, we just cannot read it (permissions, I/O error).
      // Continuing would resolve a different key and overwrite this one below,
      // which permanently orphans every stored secret. Refuse to start instead.
      // The errno goes in the line because this exit crash-loops the container,
      // and the code is the only part that says which of these it is.
      console.error(
        `FATAL: could not read ${encKeyFile} (${code ?? 'no errno'}) -`,
        readErr instanceof Error ? readErr.message : readErr,
      );
      if (code === 'EISDIR') {
        // Compose creating a missing bind-mount source as a directory is by far
        // the most common way this file stops being a file.
        console.error(
          'EISDIR: the path is a directory. A bind mount pointed at data/.encryption_key created it as one — remove it and mount the data directory instead.',
        );
      }
      console.error('Fix the file permissions or set ENCRYPTION_KEY explicitly.');
      process.exit(1);
    }
    // File not found — first start on an existing or fresh install.
  }

  if (!_encryptionKey && fs.existsSync(encKeyFile)) {
    // Present but empty: a truncated write, a full disk, a broken restore.
    // Same reasoning as above. Regenerating here would silently replace the real key.
    console.error('FATAL:', encKeyFile, 'is empty. Restore it from backup or set ENCRYPTION_KEY.');
    process.exit(1);
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

// DEFAULT_LANGUAGE / SESSION_DURATION* parsing moved into src/app-config
// (env.schema.ts validates fail-fast at boot; derive.ts resolves/falls back).
// Re-exported here — frozen at import, exactly like before — so the many
// importers of this module (mcp, middleware, services, e2e harness) are
// untouched. This module now owns only key material (above).
const sessionEnv = readEnv().session;

/** Default login-page language, validated against the supported set ('en' fallback). */
export const DEFAULT_LANGUAGE = readEnv().app.defaultLanguage;
/** Human-readable session length actually in effect (for logs/diagnostics). */
export const SESSION_DURATION = sessionEnv.duration;
/** Session length in milliseconds — used for the cookie `maxAge`. */
export const SESSION_DURATION_MS = sessionEnv.durationMs;
/** Session length in seconds — passed to `jwt.sign({ expiresIn })` (number = seconds). */
export const SESSION_DURATION_SECONDS = sessionEnv.durationSeconds;
/** Human-readable "remember me" session length actually in effect (for logs/diagnostics). */
export const SESSION_DURATION_REMEMBER = sessionEnv.durationRemember;
/** "Remember me" session length in milliseconds — used for the persistent cookie `maxAge`. */
export const SESSION_DURATION_REMEMBER_MS = sessionEnv.durationRememberMs;
/** "Remember me" session length in seconds — passed to `jwt.sign({ expiresIn })`. */
export const SESSION_DURATION_REMEMBER_SECONDS = sessionEnv.durationRememberSeconds;
