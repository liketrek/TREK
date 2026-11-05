/**
 * The bundled assets/airports.json itself, not a fixture.
 *
 * OurAirports marks some airports with daily flights as having no scheduled
 * service, and the build used to drop them on that flag alone (#2820, Little
 * Cayman). These pin a few of them and the codes saved bookings already point at.
 */
import { findByIata } from '../../../../src/nest/airports/airports.data';

import { describe, it, expect } from 'vitest';

describe('bundled airport dataset', () => {
  it('AIRPORT-ASSET-001: keeps airports OurAirports flags as unscheduled', () => {
    expect(findByIata('LYB')?.name).toBe('Edward Bodden Little Cayman Airfield');
    expect(findByIata('VEY')?.country).toBe('IS');
  });

  it('AIRPORT-ASSET-002: still resolves the codes it carried before', () => {
    for (const code of ['PBI', 'ADA', 'GCM', 'CYB', 'FRA']) {
      expect(findByIata(code), code).not.toBeNull();
    }
  });

  it('AIRPORT-ASSET-003: carries the codes OurAirports gained since, Logroño among them (#2897)', () => {
    expect(findByIata('RJL')).toMatchObject({ icao: 'LERJ', city: 'Logroño', country: 'ES', tz: 'Europe/Madrid' });
    expect(findByIata('DXN')?.country).toBe('IN');
  });
});
