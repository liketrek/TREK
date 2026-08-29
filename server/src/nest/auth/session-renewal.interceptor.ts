import { setAuthCookie } from '../common/cookie';
import { AuthService } from './auth.service';
import { decodeSessionClaims } from './jwt-verify';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';

/**
 * Sliding session renewal (#1927): once a cookie-authenticated session token is
 * past half of its lifetime, re-issue the trek_session cookie with a fresh
 * token so an active user never hits the expiry cliff mid-use. Renewal
 * preserves the login's remember semantics via the token's `remember` claim
 * (true → long persistent cookie, false → browser-session cookie, absent → the
 * historical default duration).
 *
 * Cheap by construction — no DB access:
 * - `req.user` is only set after a guard ran verifyJwtAndLoadUser on this exact
 *   request, which already proved the token's `pv` matches the DB, so both the
 *   user id and pv can be copied from the decoded (not re-verified) token.
 * - The cookie is only renewed when it is the verified credential: extractToken
 *   prefers the cookie over the Authorization header, so cookie-present +
 *   req.user set means the guard verified the cookie. Bearer-only callers
 *   (MCP, API clients) are never renewed.
 *
 * The cookie is written eagerly, before the handler runs: renewal doesn't
 * depend on the handler's outcome, and this sidesteps @Res()/streaming routes
 * whose headers are gone by the time the observable settles. When a handler
 * later sets or clears trek_session itself (password change, logout), Express
 * appends its Set-Cookie after this one and the browser keeps the last — the
 * handler's cookie wins, which is the correct outcome.
 */
@Injectable()
export class SessionRenewalInterceptor implements NestInterceptor {
  constructor(private readonly auth: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<Request & { user?: { id: number } }>();
      const res = context.switchToHttp().getResponse<Response>();
      this.maybeRenew(req, res);
    }
    return next.handle();
  }

  private maybeRenew(req: Request & { user?: { id: number } }, res: Response): void {
    const cookieToken: string | undefined = (req as { cookies?: Record<string, string> }).cookies?.trek_session;
    if (!req.user || !cookieToken || res.headersSent) return;

    const claims = decodeSessionClaims(cookieToken);
    if (!claims || claims.purpose || claims.id !== req.user.id) return;
    if (typeof claims.iat !== 'number' || typeof claims.exp !== 'number' || claims.exp <= claims.iat) return;

    const halfLife = claims.iat + (claims.exp - claims.iat) / 2;
    if (Date.now() / 1000 < halfLife) return;

    const token = this.auth.generateToken({ id: req.user.id, password_version: claims.pv ?? 0 }, claims.remember);
    setAuthCookie(res, token, req, claims.remember);
  }
}
