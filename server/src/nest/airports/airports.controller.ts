import { Controller, Get, HttpException, Param, Query, UseGuards } from '@nestjs/common';
import type { Airport } from '@trek/shared';
import { AirportsService } from './airports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * /api/airports — typeahead search + single lookup by IATA code.
 *
 * Behaviour is byte-identical to the legacy Express route (server/src/routes/
 * airports.ts): both endpoints require auth, an absent/non-string query answers
 * with `[]` (not a 400), and an unknown IATA code 404s with the exact
 * `{ error: 'Airport not found' }` body.
 *
 * The `search` route is declared before `:iata` so the static segment wins over
 * the param, matching the legacy router's registration order.
 */
@Controller('api/airports')
@UseGuards(JwtAuthGuard)
export class AirportsController {
  constructor(private readonly airports: AirportsService) {}

  @Get('search')
  search(@Query('q') q?: string | string[]): Airport[] {
    // Express coerces a missing/array query to '' and returns [] for it.
    const term = typeof q === 'string' ? q : '';
    if (!term) return [];
    return this.airports.search(term);
  }

  @Get(':iata')
  findByIata(@Param('iata') iata: string): Airport {
    const airport = this.airports.findByIata(iata);
    if (!airport) {
      throw new HttpException({ error: 'Airport not found' }, 404);
    }
    return airport;
  }
}
