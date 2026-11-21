import type { User } from '../../types';
import { AddonsService } from './addons.service';
import { REQUIRE_ADDON, type RequireAddonMeta } from './require-addon.decorator';
import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Request } from 'express';

/**
 * Enforces @RequireAddon. Replaces the three hand-written addon guards
 * (collections, airtrail, journey), which differed only in which addon id they
 * read and which word led the 404 body.
 *
 * A handler-level @RequireAddon overrides the controller's, so a route group
 * can carry one addon and a single endpoint another. Without the decorator the
 * guard is a no-op — it never gates a route that did not ask for it.
 *
 * It reads the instance switch, and nothing else while no user is known yet,
 * which is the case where it runs ahead of JwtAuthGuard. Placed after
 * JwtAuthGuard on a route that has no trip (a tour library, a search across
 * trips), it also opens for a user one of whose trips switched the addon on
 * although the instance has it off. A trip-scoped route takes TripAddonGuard
 * after TripAccessGuard instead, which asks the one trip.
 */
@Injectable()
export class AddonGuard implements CanActivate {
  constructor(
    private readonly addons: AddonsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<RequireAddonMeta | undefined>(REQUIRE_ADDON, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) return true;
    const ids = typeof meta.addonId === 'string' ? [meta.addonId] : meta.addonId;
    const user = context.switchToHttp().getRequest<Request & { user?: User | null }>().user;
    const enabled = await Promise.all(
      ids.map((id) => (user ? this.addons.isEnabledForUserAnywhere(user.id, id) : this.addons.isAddonEnabled(id))),
    );
    if (!enabled.includes(true)) {
      throw new HttpException({ error: `${meta.label} addon is not enabled` }, 404);
    }
    return true;
  }
}
