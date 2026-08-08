import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AddonsService } from './addons.service';
import { REQUIRE_ADDON, type RequireAddonMeta } from './require-addon.decorator';

/**
 * Enforces @RequireAddon. Replaces the three hand-written addon guards
 * (collections, airtrail, journey), which differed only in which addon id they
 * read and which word led the 404 body.
 *
 * A handler-level @RequireAddon overrides the controller's, so a route group
 * can carry one addon and a single endpoint another. Without the decorator the
 * guard is a no-op — it never gates a route that did not ask for it.
 */
@Injectable()
export class AddonGuard implements CanActivate {
  constructor(
    private readonly addons: AddonsService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.getAllAndOverride<RequireAddonMeta | undefined>(REQUIRE_ADDON, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) return true;
    if (!this.addons.isAddonEnabled(meta.addonId)) {
      throw new HttpException({ error: `${meta.label} addon is not enabled` }, 404);
    }
    return true;
  }
}
