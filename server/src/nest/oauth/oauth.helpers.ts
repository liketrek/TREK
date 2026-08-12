import crypto, { createHash, randomBytes } from 'crypto';

/** Pure helpers and row shapes for the OAuth 2.1 domain — no DB, no DI. */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ACCESS_TOKEN_TTL_S = 60 * 60;                  // 1 hour
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days rolling

/**
 * How long a just-rotated refresh token still counts as "in flight" rather than
 * as a replay (#1007).
 *
 * Rotation is a race by construction: two clients sharing one token — several
 * MCP sessions, a client that retried after a timeout — can present it within
 * the same second. Without leeway the second one is read as theft and the whole
 * chain is revoked, which is why a handful of MCP tabs would all pop a login
 * window every day. RFC 9700 §4.14.2 names exactly this and asks for a short
 * grace period. Short is the point: it is measured from the *first* rotation and
 * does not slide, so a stolen token still gets caught as soon as it is used
 * outside the window.
 */
export const REFRESH_ROTATION_GRACE_MS = 30 * 1000;

/** SQLite writes CURRENT_TIMESTAMP as UTC without a zone; JS would read it as local. */
export function parseSqliteUtc(ts: string | null | undefined): Date | null {
  if (!ts) return null;
  const iso = ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

// PKCE format (RFC 7636)
export const CODE_CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/;
export const CODE_VERIFIER_RE = /^[A-Za-z0-9\-._~]{43,128}$/;

// ---------------------------------------------------------------------------
// DB row types
// ---------------------------------------------------------------------------

export interface OAuthClientRow {
  id: string;
  user_id: number;
  name: string;
  client_id: string;
  client_secret_hash: string;
  redirect_uris: string;   // JSON array
  allowed_scopes: string;  // JSON array
  created_at: string;
  is_public: number;       // 0 | 1 (SQLite boolean)
  created_via: string;     // 'settings_ui' | 'browser-registration'
  allows_client_credentials: number; // 0 | 1
}

export interface OAuthTokenRow {
  id: number;
  client_id: string;
  user_id: number;
  access_token_hash: string;
  refresh_token_hash: string;
  scopes: string;           // JSON array
  audience: string | null;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  revoked_at: string | null;
  parent_token_id: number | null;
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Constant-time comparison of two hex-encoded SHA-256 hashes. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch { return false; }
}

export function generateAccessToken(): string {
  return 'trekoa_' + randomBytes(32).toString('hex');
}

export function generateRefreshToken(): string {
  return 'trekrf_' + randomBytes(32).toString('hex');
}
