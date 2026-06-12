import { airportSchema, airportSearchQuerySchema } from './airport.schema';

import { describe, it, expect } from 'vitest';

describe('airportSchema', () => {
  it('accepts a full airport record', () => {
    const parsed = airportSchema.parse({
      iata: 'BER',
      icao: 'EDDB',
      name: 'Berlin Brandenburg',
      city: 'Berlin',
      country: 'DE',
      lat: 52.36,
      lng: 13.5,
      tz: 'Europe/Berlin',
    });
    expect(parsed.iata).toBe('BER');
  });

  it('allows a null icao (smaller fields can be missing one)', () => {
    expect(
      airportSchema.safeParse({
        iata: 'XXX',
        icao: null,
        name: 'Test',
        city: 'Test',
        country: 'DE',
        lat: 0,
        lng: 0,
        tz: 'UTC',
      }).success,
    ).toBe(true);
  });
});

describe('airportSearchQuerySchema', () => {
  it('treats the query as optional (the route answers [] when absent)', () => {
    expect(airportSearchQuerySchema.parse({})).toEqual({});
    expect(airportSearchQuerySchema.parse({ q: 'ber' })).toEqual({ q: 'ber' });
  });
});
