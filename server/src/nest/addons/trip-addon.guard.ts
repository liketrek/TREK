import type { TripAccess } from '../../db/repositories/Trips.repository';
import { TRIP_REQUEST_KEY } from '../permissions/trip-access.guard';
import { AddonsService } from './addons.service';
import { REQUIRE_ADDON, type RequireAddonMeta } from './require-addon.decorator';
import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { Request } from 'express';

type TripRequest = Request & { [TRIP_REQUEST_KEY]?: TripAccess };

/**
 * Enforces @RequireAddon on a trip-scoped route against what applies to that
 * one trip: the owner's choice for the trip when there is one, else the
 * instance switch. A trip that switched an addon on answers although the admin
 * has it off, and one that switched it off answers 404 `<Label> addon is not
 * enabled`, the same body AddonGuard sends.
 *
 * It runs AFTER TripAccessGuard and reads the trip that guard parked on the
 * request, so a stranger still gets "Trip not found" and never learns from the
 * addon answer that the trip exists or what its owner chose:
 *
 *   @UseGuards(JwtAuthGuard, TripAccessGuard, TripAddonGuard)
 *   @RequireAddon(ADDON_IDS.ROADTRIP, 'Road trip')
 *
 * A route without a parked trip is a wiring mistake and fails closed with a
 * 500 rather than answering as if the addon were on. Without the decorator the
 * guard is a no-op. Never put it on a multipart upload; such a handler asks
 * AddonsService.isEnabledForTrip itself.
 */
@Injectable()
export class TripAddonGuard implements CanActivate {
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
    const trip = context.switchToHttp().getRequest<TripRequest>()[TRIP_REQUEST_KEY];
    if (!trip) throw new Error('TripAddonGuard needs TripAccessGuard ahead of it in the guard chain');
    const ids = typeof meta.addonId === 'string' ? [meta.addonId] : meta.addonId;
    const enabled = await Promise.all(ids.map((id) => this.addons.isEnabledForTrip(trip.id, id)));
    if (!enabled.includes(true)) {
      throw new HttpException({ error: `${meta.label} addon is not enabled` }, 404);
    }
    return true;
  }
}
