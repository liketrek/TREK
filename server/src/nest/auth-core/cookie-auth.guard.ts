import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { Request } from 'express';
import { Users } from '../../db/entities/Users.entity';
import { UserSessions } from '../../db/entities/UserSessions.entity';
import { verifyJwtAndLoadUser } from './jwt-verify';

/**
 * Mirrors the legacy `requireCookieAuth` middleware: accepts ONLY the httpOnly
 * trek_session cookie (never a Bearer token), so CSRF-sensitive state-changing
 * OAuth endpoints (consent submit, client/session mutations) can't be driven by
 * a leaked Bearer. Error bodies + codes match the legacy 401 shapes exactly.
 *
 * `EntityManager` injection, not `@InjectRepository(Users)` — same reasoning
 * as `JwtAuthGuard` (Plan 3b Task 1 RULING): the guard is instantiated per the
 * HOST controller's module, and using the always-global `EntityManager`
 * avoids new `forFeature` wiring in every module that applies it.
 */
@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { cookies?: Record<string, string> }>();
    const cookieToken = req.cookies?.trek_session;
    if (!cookieToken) {
      throw new HttpException({ error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' }, 401);
    }
    const user = await verifyJwtAndLoadUser(cookieToken, this.em.getRepository(Users), this.em.getRepository(UserSessions));
    if (!user) {
      throw new HttpException({ error: 'Invalid or expired session', code: 'AUTH_REQUIRED' }, 401);
    }
    req.user = user;
    return true;
  }
}
