import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { Request } from 'express';
import { Users } from '../../db/entities/Users.entity';
import { UserSessions } from '../../db/entities/UserSessions.entity';
import { extractToken, verifyJwtAndLoadUser } from './jwt-verify';

/**
 * Validates TREK's existing JWT session — the same httpOnly `trek_session`
 * cookie (or `Authorization: Bearer`) the legacy app uses. Reuses the canonical
 * `verifyJwtAndLoadUser` so the secret, the password_version invalidation gate
 * and the loaded user are IDENTICAL to the Express middleware. No new tokens.
 *
 * Error bodies match the legacy 401 shape exactly so the client is unaffected.
 *
 * Injects `EntityManager`, not `@InjectRepository(Users)` (Plan 3b Task 1
 * RULING on `verifyJwtAndLoadUser`'s callers): this guard is applied via
 * `@UseGuards(JwtAuthGuard)` on ~70 controllers across nearly every domain
 * module in the app, and Nest resolves a class-referenced guard's
 * constructor dependencies from the HOST CONTROLLER'S OWN module graph, not
 * from a single "the guard's module" — `@InjectRepository(Users)` would need
 * `MikroOrmModule.forFeature([Users])` added to every one of those ~70
 * modules (and to every partial e2e-testing-module harness that composes a
 * guarded controller without the full app), which is the exact blast radius
 * D5 exists to avoid. `EntityManager`/`MikroORM`, by contrast, come from
 * `MikroOrmModule.forRoot`'s core module, which IS `@Global()` — already
 * required wherever a JWT-guarded route is exercised for a real user (the
 * ORM owns `users` everywhere else too) — so no module needs new wiring.
 * `this.em.getRepository(Users)` inside `canActivate` is the same
 * `orm.em.getRepository(Users)`-inside-the-request pattern
 * `platform.routes.ts::servePhoto` uses (Task 0).
 *
 * **Correction (Plan 3b Task 1 fix round, task-1-review.md's Ruling):**
 * `this.em` here is NOT a request-scoped fork — with no `scope` on
 * `MikroOrmModule.forRoot` and no `Scope.REQUEST` anywhere in `src/`,
 * `@mikro-orm/nestjs`'s provider factory injects `orm.em`, the ORM's single
 * GLOBAL, context-resolving `EntityManager`, the same object every request
 * shares. It resolves to the request's transactional fork at QUERY TIME:
 * `EntityManager.getRepository` builds the repository holding a
 * reference to `this.em` with no `getContext()` call, and
 * `EntityRepository.findOne` calls `this.getEntityManager().findOne(...)`,
 * which resolves the live `AsyncLocalStorage`/`TransactionContext` inside
 * that call — so the repository built here still finds the request's own
 * fork correctly, even though `this.em` itself is the shared global
 * instance, not a per-request object.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token) {
      throw new HttpException({ error: 'Access token required', code: 'AUTH_REQUIRED' }, 401);
    }
    const user = await verifyJwtAndLoadUser(token, this.em.getRepository(Users), this.em.getRepository(UserSessions));
    if (!user) {
      throw new HttpException({ error: 'Invalid or expired token', code: 'AUTH_REQUIRED' }, 401);
    }
    req.user = user;
    return true;
  }
}
