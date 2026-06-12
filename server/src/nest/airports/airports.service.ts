import { Injectable } from '@nestjs/common';
import type { Airport } from '@trek/shared';
import { searchAirports, findByIata } from '../../services/airportService';

/**
 * Thin Nest wrapper around the existing airport service. It delegates to the
 * same `searchAirports` / `findByIata` functions the legacy route uses, so the
 * in-memory dataset and lookup behaviour stay identical and unduplicated.
 */
@Injectable()
export class AirportsService {
  search(query: string): Airport[] {
    return searchAirports(query) as Airport[];
  }

  findByIata(code: string): Airport | null {
    return findByIata(code) as Airport | null;
  }
}
