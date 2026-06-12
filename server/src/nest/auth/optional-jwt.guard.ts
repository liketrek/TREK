import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { extractToken, verifyJwtAndLoadUser } from '../../middleware/auth';

/**
 * Mirrors the legacy `optionalAuth` middleware: populates req.user with the
 * loaded user when a valid token is present, otherwise leaves it null — and
 * always allows the request through (never 401). Used for endpoints whose
 * response varies by auth state but don't require it (e.g. /app-config).
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    (req as { user: unknown }).user = (token ? verifyJwtAndLoadUser(token) : null) || null;
    return true;
  }
}
