import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';
import type { User } from '../../types';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import type { UserSessionsRepository } from '../../db/repositories/UserSessions.repository';
import { dbNow } from '../../db/types';

/**
 * The canonical JWT session check. Every auth surface goes through here — the
 * three guards, MCP bearer tokens, the file-download query token, the
 * photo-serving route and the global MFA policy — so the secret, the
 * password_version gate and the loaded user cannot drift between them.
 *
 * Free functions rather than a provider: the platform routes run outside the
 * container and would have no way to inject one, and the guards that call this
 * (the MFA policy is nest/auth-core/mfa-policy.guard.ts now) share the one copy.
 * Note JWT_SECRET is deliberately a live binding from src/config, not an app-config value: the admin panel rotates it
 * at runtime and `export let` is what makes a rotation take effect in-process.
 *
 * `verifyJwtAndLoadUser` stays a free function (Plan 3b Task 1 RULING) and
 * gains an explicit `users: UsersRepository` parameter — DI over a
 * module-level accessor (CLAUDE.md "DI over global mutable module state").
 * This file imports neither the ORM nor `RequestContext`: every caller
 * resolves its own `UsersRepository` (through Nest DI, or — for the one
 * pre-init caller, `platform.routes.ts::servePhoto` — `orm.em.getRepository(Users)`
 * resolved INSIDE `applyPlatformUploads`'s `withRequestContext` wrapper,
 * `orm` threaded in from `bootstrap.ts`) and passes it in. The legacy `db`
 * proxy import is gone. The `UserSessionsRepository` beside it is resolved
 * the same way, from the same entity manager, and carries the session check.
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
  /** The session id (`user_sessions.id`); absent on tokens issued before sessions were tracked. */
  jti?: string;
}

/**
 * How old a session's `last_seen_at` may get before a request refreshes it.
 * Coarse on purpose: the list only has to tell "today" from "last month", and
 * a write on every request would be a write on every GET.
 */
export const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

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

/**
 * The session id of the token this request authenticated with, or undefined
 * for a token from before sessions were tracked. Decoded, not verified: only
 * for handlers behind the auth guard, which verified this same token.
 */
export function currentSessionId(req: Request): string | undefined {
  const jti = decodeSessionClaims(extractToken(req) ?? undefined)?.jti;
  return typeof jti === 'string' ? jti : undefined;
}

/**
 * The claims of a session token whose signature checks out, expired or not;
 * null for anything else (a forged or purpose-scoped token). Logout reads the
 * session to end through this, since it must work with an expired token too.
 */
export function verifiedSessionClaims(token: string | null | undefined): (SessionClaims & { id: number }) | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'], ignoreExpiration: true }) as SessionClaims;
    if (decoded.purpose || typeof decoded.id !== 'number') return null;
    return decoded as SessionClaims & { id: number };
  } catch {
    return null;
  }
}

/**
 * What the session check reads and writes: the two `UserSessionsRepository`
 * methods. The guards hand in the repository from their own entity manager;
 * `AuthService` hands in `SessionsService`, which answers the same two calls,
 * so auth reaches the table through the sessions domain that owns it.
 */
export type SessionLookup = Pick<UserSessionsRepository, 'findActive' | 'touchLastSeen'>;

/**
 * The session half of the check. A token with a `jti` must name an active
 * session of its own user: one revoked (logout, a password change, "sign out
 * other sessions"), expired or purged refuses the token. A token without one
 * was issued before sessions were tracked and passes until its own expiry, so
 * the upgrade signs nobody out; a password change still ends it through `pv`.
 */
async function sessionIsActive(decoded: { id: number; jti?: unknown }, sessions: SessionLookup): Promise<boolean> {
  if (decoded.jti === undefined) return true;
  if (typeof decoded.jti !== 'string') return false;
  const now = new Date();
  const session = await sessions.findActive(decoded.jti, decoded.id, dbNow(now));
  if (!session) return false;
  const lastSeen = Date.parse(`${session.last_seen_at.replace(' ', 'T')}Z`);
  if (!(now.getTime() - lastSeen < SESSION_TOUCH_INTERVAL_MS)) {
    try {
      await sessions.touchLastSeen(session.id, dbNow(now));
    } catch {
      // Bookkeeping for the session list only: a busy database must not turn
      // a valid session into a 401.
    }
  }
  return true;
}

export async function verifyJwtAndLoadUser(
  token: string,
  users: UsersRepository,
  sessions: SessionLookup,
): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as {
      id: number;
      pv?: number;
      purpose?: string;
      jti?: unknown;
    };
    // Purpose-scoped tokens (e.g. the short-lived mfa_login token) share this
    // secret but are not full session tokens — only their dedicated endpoint
    // may accept them, so reject any token carrying a purpose claim here.
    if (decoded.purpose) return null;
    const row = await users.findByIdWithPasswordVersion(decoded.id);
    if (!row) return null;
    // Session invalidation: any token whose embedded password_version
    // predates the user's current one is rejected. Tokens issued before
    // the `pv` claim existed (decoded.pv === undefined) are treated as
    // version 0 so legacy sessions keep working until the user resets.
    const tokenPv = typeof decoded.pv === 'number' ? decoded.pv : 0;
    const currentPv = typeof row.password_version === 'number' ? row.password_version : 0;
    if (tokenPv !== currentPv) return null;
    if (!(await sessionIsActive(decoded, sessions))) return null;
    // Don't leak password_version beyond the verify.
    const { password_version: _pv, ...user } = row;
    return user as User;
  } catch {
    return null;
  }
}
