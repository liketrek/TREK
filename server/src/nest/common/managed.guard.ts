import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { MANAGED_FORBIDDEN, MANAGED_FORBIDDEN_ERROR } from './managed';

/**
 * Refuses the routes a centrally administered instance does not hand to its own
 * admin: the ones whose value comes from whoever operates the install.
 *
 * Registered as the third APP_GUARD, after GlobalAuthGuard and MfaPolicyGuard.
 * The order is the whole point — a stranger has to get the 401 the other two
 * would have given them, not a 403 that confirms the route exists and tells them
 * something about how this install is run.
 *
 * Marked routes only. An unmarked route is untouched in every mode, so the
 * guard is inert on a self-hosted install and stays that way even if somebody
 * sets the flag there.
 *
 * Explicitly not a path list. `MfaPolicyGuard` documents where the two literal
 * path lists it replaced ended up: they stopped being maintained, and every
 * endpoint added afterwards silently fell on the wrong side. A decorator lives
 * on the handler it describes and cannot drift away from it.
 */
@Injectable()
export class ManagedGuard implements CanActivate {
  constructor(
    private readonly env: RuntimeEnvService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.env.isManaged()) return true;

    const marked = this.reflector.getAllAndOverride<{ enforcedInHandler?: boolean } | undefined>(
      MANAGED_FORBIDDEN,
      [context.getHandler(), context.getClass()],
    );
    if (!marked) return true;

    // A multipart handler checks for itself, after the interceptor has drained
    // the upload. Throwing here would leave the body unread and the client would
    // see an ECONNRESET rather than the 403 (PROFILE-015). The marker still sits
    // on the route so the boot gate can inventory it.
    if (marked.enforcedInHandler) return true;

    throw new HttpException(MANAGED_FORBIDDEN_ERROR, 403);
  }
}
