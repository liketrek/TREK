import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { verifyJwtAndLoadUser } from '../../middleware/auth';

/**
 * Mirrors the legacy `requireCookieAuth` middleware: accepts ONLY the httpOnly
 * trek_session cookie (never a Bearer token), so CSRF-sensitive state-changing
 * OAuth endpoints (consent submit, client/session mutations) can't be driven by
 * a leaked Bearer. Error bodies + codes match the legacy 401 shapes exactly.
 */
@Injectable()
export class CookieAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { cookies?: Record<string, string> }>();
    const cookieToken = req.cookies?.trek_session;
    if (!cookieToken) {
      throw new HttpException({ error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' }, 401);
    }
    const user = verifyJwtAndLoadUser(cookieToken);
    if (!user) {
      throw new HttpException({ error: 'Invalid or expired session', code: 'AUTH_REQUIRED' }, 401);
    }
    req.user = user;
    return true;
  }
}
