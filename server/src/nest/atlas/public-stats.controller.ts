import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicApiStats } from '@trek/shared';
import { AtlasService } from './atlas.service';
import { ApiTokenGuard } from '../public-api/api-token.guard';
import { enforcePublicApiRateLimit, requireUserId } from '../public-api/public-api-request';
import { RateLimitService } from '../common/rate-limit.service';

/**
 * GET /api/v1/stats — aggregate counts for a dashboard widget (#1367).
 *
 * Homepage's `customapi` widget and everything shaped like it want a handful of
 * numbers from one request. `/api/v1/trips` already hands out the rows, but a
 * widget cannot aggregate a list; it maps a field to a label.
 *
 * ── Why this controller sits in atlas/ and not in public-api/ ────────────────
 *
 * The figures come from `AtlasService.getTravelStats`, the same call behind the
 * dashboard's passport card. That is deliberate and is the whole reason this is
 * not a fresh count: "visited countries" carries years of accumulated rules —
 * countries reached only by a flight (#1366), layovers that do not count as
 * visited (#1486, #1535), countries the user hid by hand (#1490), bookings that
 * belong to someone else on the trip (#1966). A second implementation would
 * disagree with the card sitting next to it within a release.
 *
 * PublicApiModule is deliberately a leaf — its own docblock explains that pulling
 * AtlasModule in would drag AuthModule and the storage registry behind it, and a
 * read-only surface that cannot boot without half the application is one that
 * breaks for reasons it has nothing to do with. So the route comes to the data
 * instead. TravelStatsController next door already does exactly this for
 * `/api/auth/travel-stats`, and for the same reason.
 *
 * What crosses the boundary is only the request handling: the guard and the shared
 * rate-limit bucket, so an integration polling `/trips` and `/stats` spends one
 * budget rather than two.
 */
@Controller('api/v1')
@UseGuards(ApiTokenGuard)
export class PublicStatsController {
  constructor(
    private readonly atlas: AtlasService,
    private readonly rl: RateLimitService,
  ) {}

  @Get('stats')
  stats(@Req() req: Request): PublicApiStats {
    enforcePublicApiRateLimit(this.rl, req);
    const userId = requireUserId(req);

    const travel = this.atlas.getTravelStats(userId);
    const last = this.atlas.lastTrip(userId);

    // Counts, not the arrays behind them. A consumer that wants the members asks
    // /api/v1/trips; this endpoint exists for the one that wants a number.
    return {
      total_trips: travel.totalTrips,
      total_countries: travel.countries.length,
      total_cities: travel.cities.length,
      total_places: travel.totalPlaces,
      total_days: travel.totalDays,
      total_distance_km: travel.totalDistanceKm,
      last_trip: last && {
        title: last.title,
        start_date: last.start_date,
        end_date: last.end_date,
        // The list's head, so `country` and `countries[0]` can never disagree.
        country: last.countries[0] ?? null,
        countries: last.countries,
      },
    };
  }
}
