import { decodeSessionClaims } from '../auth-core/jwt-verify';
import { setAuthCookie } from '../common/cookie';
import { SessionsService, sessionClientFrom } from '../sessions/sessions.service';
import { AuthService } from './auth.service';
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
 * Cheap by construction, one write per half-life at most:
 * - Only a token past half its life is looked at again: the decoded claims
 *   answer that, and every younger token costs nothing more.
 * - Such a token is verified once more, through the same check the guards use
 *   (signature, expiry, `pv` against the DB, an active session), and must name
 *   the user this request runs as. `req.user` alone proves nothing about the
 *   cookie: a route with its own guard chain lets that chain authenticate, and
 *   ApiTokenGuard does so with a public API key while the cookie beside it was
 *   never checked. Renewing that cookie re-signed whatever it claimed.
 * - A request a public API key authenticated renews nothing, even beside a
 *   valid cookie: the key is that request's credential, and a key must never
 *   yield a browser session.
 * - A tracked token is re-signed under the same session id and the session's
 *   expiry moves with it; a token from before sessions were tracked comes back
 *   as a tracked session whose id is derived from that token, so the parallel
 *   requests of one page load renew it into one session, not several. If the
 *   session ended in between, nothing is renewed.
 * - Bearer-only callers (MCP, API clients) carry no cookie and are never renewed.
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
  constructor(
    private readonly sessions: SessionsService,
    private readonly auth: AuthService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest<Request & { user?: { id: number } }>();
      const res = context.switchToHttp().getResponse<Response>();
      await this.maybeRenew(req, res);
    }
    return next.handle();
  }

  private async maybeRenew(req: Request & { user?: { id: number } }, res: Response): Promise<void> {
    const cookieToken: string | undefined = (req as { cookies?: Record<string, string> }).cookies?.trek_session;
    if (!req.user || req.apiToken || !cookieToken || res.headersSent) return;

    const claims = decodeSessionClaims(cookieToken);
    if (!claims || claims.purpose || claims.id !== req.user.id) return;
    if (typeof claims.iat !== 'number' || typeof claims.exp !== 'number' || claims.exp <= claims.iat) return;

    const halfLife = claims.iat + (claims.exp - claims.iat) / 2;
    if (Date.now() / 1000 < halfLife) return;

    const owner = await this.auth.verifyJwtToken(cookieToken);
    if (!owner || owner.id !== req.user.id) return;

    const token = await this.sessions.renew(
      { id: req.user.id, pv: claims.pv, remember: claims.remember, jti: claims.jti, token: cookieToken },
      sessionClientFrom(req),
    );
    if (token) setAuthCookie(res, token, req, claims.remember);
  }
}
