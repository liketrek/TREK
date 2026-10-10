import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { Request } from 'express';
import { Users } from '../../db/entities/Users.entity';
import { UserSessions } from '../../db/entities/UserSessions.entity';
import { extractToken, verifyJwtAndLoadUser } from './jwt-verify';

/**
 * Mirrors the legacy `optionalAuth` middleware: populates req.user with the
 * loaded user when a valid token is present, otherwise leaves it null — and
 * always allows the request through (never 401). Used for endpoints whose
 * response varies by auth state but don't require it (e.g. /app-config).
 *
 * `EntityManager` injection, not `@InjectRepository(Users)` — same reasoning
 * as `JwtAuthGuard` (Plan 3b Task 1 RULING).
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    (req as { user: unknown }).user = (token ? await verifyJwtAndLoadUser(token, this.em.getRepository(Users), this.em.getRepository(UserSessions)) : null) || null;
    return true;
  }
}
