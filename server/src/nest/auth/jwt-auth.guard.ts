import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { extractToken, verifyJwtAndLoadUser } from '../../middleware/auth';

/**
 * Validates TREK's existing JWT session — the same httpOnly `trek_session`
 * cookie (or `Authorization: Bearer`) the legacy app uses. Reuses the canonical
 * `verifyJwtAndLoadUser` so the secret, the password_version invalidation gate
 * and the loaded user are IDENTICAL to the Express middleware. No new tokens.
 *
 * Error bodies match the legacy 401 shape exactly so the client is unaffected.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token) {
      throw new HttpException({ error: 'Access token required', code: 'AUTH_REQUIRED' }, 401);
    }
    const user = verifyJwtAndLoadUser(token);
    if (!user) {
      throw new HttpException({ error: 'Invalid or expired token', code: 'AUTH_REQUIRED' }, 401);
    }
    req.user = user;
    return true;
  }
}
