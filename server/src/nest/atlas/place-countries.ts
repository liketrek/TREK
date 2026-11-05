import type { PlaceRow } from '../../db/repositories/Places.repository';
import { resolveCountryCodeSync } from './atlas-geo';

type LocatedPlace = Pick<PlaceRow, 'lat' | 'lng' | 'address'>;

/**
 * The one way a place gets its country, for every view that counts countries
 * (#2875): the country of its cached region first, the bundled borders for a
 * place that has no cached region. place_regions is a region cache, and a place
 * in a country the region bundle does not cover (Vatican City) or one whose
 * background lookup has not finished holds no row there, so a count that read the
 * cache alone lost countries the Atlas map shows.
 *
 * A place without a cached region costs a border lookup on every count: a box
 * prefilter, then a point-in-polygon test against the few countries whose box
 * holds the point. The resolver runs it once per distinct coordinates and
 * address, which only spares repeats of one place (a hotel added to every night
 * of a stay, say), since every place keeps its own pin. The dashboard pays this on purpose rather than
 * queueing the region lookup the Atlas runs: that lookup falls back to Nominatim
 * where the bundle has no region, and a dashboard load must not send a user's
 * places to a third party. place_regions fills up once the Atlas looks the places
 * up, and from then on the count reads the cache.
 */
export function placeCountryResolver(): (place: LocatedPlace, cached: string | null | undefined) => string | null {
  const byLocation = new Map<string, string | null>();
  return (place, cached) => {
    if (cached) return cached;
    const key = `${place.lat},${place.lng},${place.address ?? ''}`;
    let code = byLocation.get(key);
    if (code === undefined) {
      code = resolveCountryCodeSync(place);
      byLocation.set(key, code);
    }
    return code;
  };
}
