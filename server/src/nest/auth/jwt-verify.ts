import { JWT_SECRET } from '../../config';
import { db } from '../../db/database';
import type { User } from '../../types';

import type { Request } from 'express';
import jwt from 'jsonwebtoken';

/**
 * The canonical JWT session check. Every auth surface goes through here — the
 * three guards, MCP bearer tokens, the file-download query token, the
 * photo-serving route and the global MFA policy — so the secret, the
 * password_version gate and the loaded user cannot drift between them.
 *
 * Free functions rather than a provider: the MFA policy in
 * middleware/mfaPolicy.ts and the platform routes run outside the container and
 * would have no way to inject one. Note JWT_SECRET is deliberately a live
 * binding from src/config, not an app-config value: the admin panel rotates it
 * at runtime and `export let` is what makes a rotation take effect in-process.
 */
export function extractToken(req: Request): string | null {
  // Prefer httpOnly cookie; fall back to Authorization: Bearer (MCP, API clients)
  const cookieToken = (req as any).cookies?.trek_session;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers['authorization'];
  return (authHeader && authHeader.split(' ')[1]) || null;
}

/**
 * Verify a JWT and load its user, enforcing the password_version gate.
 *
 * A password reset bumps `users.password_version`, which invalidates every JWT
 * that embedded the prior value — but only if every verify path actually
 * compares the claim. Several paths used to call `jwt.verify` directly and skip
 * the DB lookup, so a stolen token kept working after the victim reset.
 */
export interface SessionClaims {
  id?: number;
  pv?: number;
  remember?: boolean;
  purpose?: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode (NOT verify) a session token's claims. Only for callers that have
 * already authenticated the request through a guard and need the token's
 * metadata — sliding renewal and the password-change cookie re-issue read the
 * `remember` claim this way. Never use this as an auth check.
 */
export function decodeSessionClaims(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object') return null;
  return decoded as SessionClaims;
}

export function verifyJwtAndLoadUser(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as {
      id: number;
      pv?: number;
      purpose?: string;
    };
    // Purpose-scoped tokens (e.g. the short-lived mfa_login token) share this
    // secret but are not full session tokens — only their dedicated endpoint
    // may accept them, so reject any token carrying a purpose claim here.
    if (decoded.purpose) return null;
    const row = db
      .prepare('SELECT id, username, email, role, password_version FROM users WHERE id = ?')
      .get(decoded.id) as (User & { password_version?: number }) | undefined;
    if (!row) return null;
    // Session invalidation: any token whose embedded password_version
    // predates the user's current one is rejected. Tokens issued before
    // the `pv` claim existed (decoded.pv === undefined) are treated as
    // version 0 so legacy sessions keep working until the user resets.
    const tokenPv = typeof decoded.pv === 'number' ? decoded.pv : 0;
    const currentPv = typeof row.password_version === 'number' ? row.password_version : 0;
    if (tokenPv !== currentPv) return null;
    // Don't leak password_version beyond the verify.
    const { password_version: _pv, ...user } = row;
    return user as User;
  } catch {
    return null;
  }
}
