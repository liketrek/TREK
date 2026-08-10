import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { TripAccess } from '../database/database.service';
import { TRIP_REQUEST_KEY } from './trip-access.guard';

/**
 * The trip row `TripAccessGuard` resolved for this request.
 *
 * A param decorator rather than a `req.trip` cast on purpose: the request type the
 * controllers used to widen for that (`AuthRequest`) is gone, and re-introducing a
 * per-controller cast would put the same untyped hole back. Only usable on a route
 * that carries `@UseGuards(TripAccessGuard)` — without it there is nothing to read,
 * and the handler would silently receive undefined, so it throws instead.
 */
export const Trip = createParamDecorator((_data: unknown, context: ExecutionContext): TripAccess => {
  const request = context.switchToHttp().getRequest<Record<string, unknown>>();
  const trip = request[TRIP_REQUEST_KEY] as TripAccess | undefined;
  if (!trip) {
    throw new Error('@Trip() used on a route without @UseGuards(TripAccessGuard)');
  }
  return trip;
});
