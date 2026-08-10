import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { extractToken, verifyJwtAndLoadUser } from './jwt-verify';
import { IS_PUBLIC, OPTIONAL_AUTH } from './public.decorator';

/**
 * Default-deny. Registered as an APP_GUARD, so a route is authenticated unless
 * it says otherwise — the inverse of what TREK had, where protection was opt-in
 * through 62 separate `@UseGuards(JwtAuthGuard)` and a forgotten one was a
 * silent bypass rather than an error.
 *
 * It is a new class rather than JwtAuthGuard gaining a Reflector, for two
 * reasons. JwtAuthGuard is constructed positionally in its own unit test with an
 * ExecutionContext stub that has no getHandler, so a Reflector lookup there
 * would break it; and the two want different behaviour anyway — this one stands
 * down, that one refuses.
 *
 * The third check is what keeps this change behaviour-neutral: a controller
 * that DECLARES its own guard chain keeps it, untouched. Nest runs global guards
 * before route guards, so without this the global guard would 401 an anonymous
 * request to an addon-gated controller before its AddonGuard could answer 404 —
 * inverting an order that four e2e suites pin, and leaking which addons are
 * installed. Reading the declared chain and standing down means every existing
 * @UseGuards keeps deciding for itself, and this guard only covers what nobody
 * claimed.
 */
@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();

    if (this.reflector.getAllAndOverride(IS_PUBLIC, [handler, controller])) return true;

    const req = context.switchToHttp().getRequest<Request>();

    if (this.reflector.getAllAndOverride(OPTIONAL_AUTH, [handler, controller])) {
      const token = extractToken(req);
      (req as { user: unknown }).user = (token ? verifyJwtAndLoadUser(token) : null) || null;
      return true;
    }

    // A declared chain decides for itself, in the order it declared — but the
    // user still gets resolved here, without refusing. Global guards run before
    // route guards, so standing down silently would leave req.user unset for the
    // MFA guard behind us, and it would wave every request through. Resolving
    // without throwing keeps the declared chain in charge of the 401 while the
    // rest of the chain can still see who is calling. Absent or invalid token
    // leaves req.user null, which is what it was before.
    const declared = [
      ...(this.reflector.get<unknown[]>(GUARDS_METADATA, handler) ?? []),
      ...(this.reflector.get<unknown[]>(GUARDS_METADATA, controller) ?? []),
    ];
    if (declared.length > 0) {
      const declaredToken = extractToken(req);
      (req as { user: unknown }).user = (declaredToken ? verifyJwtAndLoadUser(declaredToken) : null) || null;
      return true;
    }

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
