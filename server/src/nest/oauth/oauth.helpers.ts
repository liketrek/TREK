import crypto, { createHash, randomBytes } from 'crypto';

/** Pure helpers and row shapes for the OAuth 2.1 domain — no DB, no DI. */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ACCESS_TOKEN_TTL_S = 60 * 60;                  // 1 hour
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days rolling

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
