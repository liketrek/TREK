import { JWT_SECRET, SESSION_DURATION_SECONDS, SESSION_DURATION_REMEMBER_SECONDS } from '../../config';
import { UserSessions } from '../../db/entities/UserSessions.entity';
import type { UserSessionsRepository } from '../../db/repositories/UserSessions.repository';
import { dbNow } from '../../db/types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { UserSession } from '@trek/shared';

import { createHash, randomUUID } from 'crypto';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';

/** The longest User-Agent kept, the same cap a Web Push device's gets. */
export const USER_AGENT_MAX_LENGTH = 256;

/** What the issuing request tells about the device a session belongs to. */
export interface SessionClient {
  userAgent?: string | null;
}

/** The claims a session token is renewed from (decoded by the caller after a guard verified it). */
export interface RenewableSessionClaims {
  id: number;
  pv?: number;
  remember?: boolean;
  jti?: string;
  /**
   * The token itself. A token from before sessions were tracked has no `jti`,
   * and its session id is derived from it, so every renewal of that one token
   * lands on the same session.
   */
  token?: string;
}

/**
 * The session id a token from before sessions were tracked is renewed into:
 * a SHA-256 of the token, laid out as a version 8 UUID (RFC 9562), so it
 * passes the same id check a random one does. The same token always gives the
 * same id; any other token, which differs at least in its signature, another.
 */
export function legacySessionId(token: string): string {
  const h = createHash('sha256').update(token).digest('hex');
  const variant = ((parseInt(h.charAt(16), 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** The device description of a request: its User-Agent header, when it sent one. */
export function sessionClientFrom(req: Pick<Request, 'headers'>): SessionClient {
  const agent = req.headers['user-agent'];
  return { userAgent: typeof agent === 'string' && agent.length > 0 ? agent : null };
}

/**
 * Session tokens and the `user_sessions` rows behind them.
 *
 * Every token issued here carries a random `jti` naming its row, and
 * `verifyJwtAndLoadUser` (auth-core/jwt-verify.ts) refuses a token whose row is
 * revoked, expired or gone. That is what lets a logout end the token instead
 * of only clearing the cookie, and lets a user sign out a device. A token
 * without a `jti` was issued before sessions were tracked: it is never looked
 * up here and stays valid until it expires or the password changes, so the
 * upgrade signs nobody out.
 *
 * Its own domain, with no import of auth, because auth, oidc and admin all end
 * or start sessions; a home inside auth would have made oidc's and admin's
 * reach for it a reach into auth's internals.
 */
@Injectable()
export class SessionsService {
  constructor(@InjectRepository(UserSessions) private readonly sessions: UserSessionsRepository) {}

  /**
   * Mint a session token for the user and record its session.
   *
   * `remember` picks the lifetime (true: the long "remember me" one) and is
   * kept as a claim so sliding renewal keeps the same cookie semantics; it is
   * left out when the caller made no choice, as before.
   *
   * @txStandalone the row only makes the token it returns usable: if the
   * caller fails after it, nobody holds that token and the row expires with it.
   */
  async issue(user: { id: number; pv: number }, remember?: boolean, client: SessionClient = {}): Promise<string> {
    const jti = randomUUID();
    const token = this.sign(user, remember, jti);
    const { iat, exp } = this.lifetimeOf(token);
    await this.sessions.insertSession({
      id: jti,
      user_id: user.id,
      created_at: dbNow(new Date(iat * 1000)),
      expires_at: dbNow(new Date(exp * 1000)),
      user_agent: clipUserAgent(client.userAgent),
    });
    return token;
  }

  /**
   * Sliding renewal of a verified token past half its life. A tracked token
   * is re-signed under the same id and its row's expiry moves with it; a
   * token from before sessions were tracked becomes a tracked session here.
   * Null when the session ended in the meantime, so nothing is renewed.
   *
   * @txStandalone one statement either way, and a renewal stands on its own:
   * the old token keeps working until its own expiry whatever happens next.
   */
  async renew(claims: RenewableSessionClaims, client: SessionClient = {}): Promise<string | null> {
    if (claims.jti === undefined) return this.renewUntracked(claims, client);
    const token = this.sign({ id: claims.id, pv: claims.pv ?? 0 }, claims.remember, claims.jti);
    const { exp } = this.lifetimeOf(token);
    const extended = await this.sessions.extendActive(claims.jti, claims.id, dbNow(), dbNow(new Date(exp * 1000)));
    return extended ? token : null;
  }

  /**
   * A token from before sessions were tracked, renewed into a tracked one.
   *
   * A page load sends many requests at once, and each of them past the token's
   * half life renews it. With a random id every one of them would add a
   * session, and the list would show one browser several times until they
   * expired. The id is derived from the token instead and the row inserted
   * only if it is not there yet, so all of them land on one session. If that
   * session was ended in the meantime, nothing is renewed.
   *
   * The old token stays valid until its own expiry whatever happens to the
   * session, so the row is what refuses it after an end. Its `expires_at` is
   * therefore never earlier than the old token's, and the nightly purge
   * keeps a revoked row until that has passed: a purged row would let the
   * old token insert the session again as an active one.
   *
   * @txStandalone one statement, standing on its own like `renew`.
   */
  private async renewUntracked(claims: RenewableSessionClaims, client: SessionClient): Promise<string | null> {
    const user = { id: claims.id, pv: claims.pv ?? 0 };
    if (claims.token === undefined) return this.issue(user, claims.remember, client);
    const jti = legacySessionId(claims.token);
    const token = this.sign(user, claims.remember, jti);
    const { iat, exp } = this.lifetimeOf(token);
    const keepUntil = Math.max(exp, expiryOf(claims.token) ?? exp);
    await this.sessions.insertSessionIfAbsent({
      id: jti,
      user_id: user.id,
      created_at: dbNow(new Date(iat * 1000)),
      expires_at: dbNow(new Date(keepUntil * 1000)),
      user_agent: clipUserAgent(client.userAgent),
    });
    return (await this.sessions.findActive(jti, user.id, dbNow())) ? token : null;
  }

  /**
   * The active session a token names, for the session check in
   * `verifyJwtAndLoadUser` (auth-core/jwt-verify.ts, its `SessionLookup`): null
   * when it is revoked, expired, gone or another user's.
   */
  async findActive(id: string, userId: number, now: string): Promise<{ id: string; last_seen_at: string } | null> {
    return this.sessions.findActive(id, userId, now);
  }

  /**
   * Refresh when a session was last used; the same check calls it at most
   * every few minutes.
   *
   * @txStandalone bookkeeping for the session list that stands on its own.
   */
  async touchLastSeen(id: string, now: string): Promise<void> {
    await this.sessions.touchLastSeen(id, now);
  }

  /** The user's active sessions, most recently used first, the one in `currentId` flagged. */
  async list(userId: number, currentId?: string): Promise<UserSession[]> {
    const rows = await this.sessions.listActiveForUser(userId, dbNow());
    return rows.map((row) => ({ ...row, current: row.id === currentId }));
  }

  /** End one of the user's sessions. False when the user has no active session by that id. */
  async revoke(userId: number, sessionId: string): Promise<boolean> {
    return this.sessions.revokeForUser(sessionId, userId, dbNow());
  }

  /**
   * Logout: end the session a verified token names. False for no token, or
   * for one from before sessions were tracked, which has no session to end.
   */
  async endSession(claims: { id: number; jti?: string } | null): Promise<boolean> {
    if (!claims || typeof claims.jti !== 'string') return false;
    return this.revoke(claims.id, claims.jti);
  }

  /**
   * End every session of the user, or every one but `exceptId`. Answers how
   * many ended. Runs inside the caller's transaction where there is one (a
   * password change revokes the sessions with the password write).
   */
  async revokeAll(userId: number, exceptId?: string): Promise<number> {
    return this.sessions.revokeAllForUser(userId, dbNow(), exceptId);
  }

  /**
   * Remove the expired rows. A revoked row is kept until it expires too, so
   * a session derived from a token from before tracking cannot come back
   * (see `renewUntracked`).
   */
  async purgeInactive(now: Date): Promise<number> {
    return this.sessions.deleteInactive(dbNow(now));
  }

  private sign(user: { id: number; pv: number }, remember: boolean | undefined, jti: string): string {
    // "Remember me" extends the JWT lifetime to match the persistent cookie
    // maxAge; the cookie service decides session-vs-persistent off the same flag.
    const expiresIn = remember === true ? SESSION_DURATION_REMEMBER_SECONDS : SESSION_DURATION_SECONDS;
    return jwt.sign({ id: user.id, pv: user.pv, ...(typeof remember === 'boolean' ? { remember } : {}) }, JWT_SECRET, {
      expiresIn,
      algorithm: 'HS256',
      jwtid: jti,
    });
  }

  /** `iat` and `exp` of a token this service just signed. */
  private lifetimeOf(token: string): { iat: number; exp: number } {
    const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };
    return { iat, exp };
  }
}

/** The `exp` claim of a token, when it has a numeric one. */
function expiryOf(token: string): number | undefined {
  const decoded = jwt.decode(token);
  const exp = decoded !== null && typeof decoded === 'object' ? (decoded as { exp?: unknown }).exp : undefined;
  return typeof exp === 'number' ? exp : undefined;
}

function clipUserAgent(agent: string | null | undefined): string | null {
  return agent ? agent.slice(0, USER_AGENT_MAX_LENGTH) : null;
}
