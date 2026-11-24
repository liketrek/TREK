import type { TripAccess } from '../../db/repositories/Trips.repository';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { Trip } from '../permissions/trip.decorator';
import { FlightLiveService } from './flight-live.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { tripFlightLiveResponseSchema, type TripFlightLiveResponse } from '@trek/shared';

/**
 * GET /api/trips/:tripId/flights/live: every flight leg of the trip with its
 * schedule in UTC and what the open ADS-B feeds last said about it.
 *
 * Trip-scoped like reading the bookings: TripAccessGuard answers 404 for a trip
 * the caller cannot reach, and reading needs no permission beyond access. The
 * read never asks a feed; an in-window leg whose answer is older than two
 * minutes is put up for the poll's next tick. With the admin switch off it
 * answers `{ enabled: false, attribution: null, flights: [] }`.
 */
@Controller('api/trips/:tripId/flights')
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class FlightLiveController {
  constructor(private readonly live: FlightLiveService) {}

  @Get('live')
  @ResponseContract(tripFlightLiveResponseSchema)
  async list(@Trip() trip: TripAccess): Promise<TripFlightLiveResponse> {
    return await this.live.tripFlights(trip.id);
  }
}
