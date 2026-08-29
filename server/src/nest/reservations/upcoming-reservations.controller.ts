import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import { Controller, Get, UseGuards } from '@nestjs/common';

/**
 * GET /api/reservations/upcoming — the cross-trip "upcoming reservations" feed
 * (dashboard widget). Byte-identical to the legacy inline handler in
 * server/src/app.ts (authenticate, returns { reservations: [...] }, limit 6).
 *
 * Separate from the trip-scoped ReservationsController
 * (/api/trips/:tripId/reservations) because the base path differs.
 */
@Controller('api/reservations')
@UseGuards(JwtAuthGuard)
export class UpcomingReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get('upcoming')
  upcoming(@CurrentUser() user: User) {
    return { reservations: this.reservations.listUpcoming(user.id) };
  }
}
