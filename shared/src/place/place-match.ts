/**
 * When two places are the same place — the single source of the rule.
 *
 * There are two consumers with nothing in common but this decision: the bulk
 * place importers ask it of an in-memory set they already built for the trip
 * (`isPlaceDuplicate`), and the booking importer asks it of the database and
 * needs the matched row's id so it can link to it (`findMatchingPlaceId`). Both
 * used to spell the rule out themselves, in the same order, and the SQL copy had
 * quietly drifted: it reached for coordinates on a NAMED candidate, which the
 * in-memory copy deliberately never does.
 *
 * So the order lives here as data, and each consumer is a mechanical interpreter
 * of it. Adding a way to recognise a place means adding a strategy here once.
 *
 * The order, and why:
 *
 *   1. Provider id — the only part of a place that survives the user editing it.
 *      Re-importing a Google Maps list used to duplicate every place someone had
 *      renamed (#1550). One strategy per id rather than one for all of them, so
 *      an earlier provider still wins when two ids point at different rows.
 *   2. Name — exact after trim + lowercase.
 *   3. Coordinates — **only when there is no name.** Widening the coordinate
 *      check to named places would merge the restaurant and the bar at the same
 *      address, which is a worse failure than the duplicate it would prevent.
 */

/** ≈ 11 m. Two coordinate-only places inside this box are treated as one place. */
export const COORD_DEDUP_TOLERANCE = 0.0001;

/** The fields a place can be recognised by. Both a parsed candidate and a stored row fit. */
export interface PlaceMatchCandidate {
  name?: string | null;
  lat?: number | null;
  lng?: number | null;
  google_place_id?: string | null;
  google_ftid?: string | null;
  osm_id?: string | null;
}

/** One way to look for an existing place, to be tried in order. */
export type PlaceMatchStrategy =
  | { by: 'externalId'; id: string }
  | { by: 'name'; name: string }
  | { by: 'coords'; lat: number; lng: number; tolerance: number };

/** Trim + lowercase, or null when there is no usable name. */
export function normalizePlaceName(name: string | null | undefined): string | null {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed === '' ? null : trimmed.toLowerCase();
}

/** The provider ids a candidate carries, trimmed, in provider order, blanks dropped. */
export function externalIdsOf(candidate: PlaceMatchCandidate): string[] {
  return [candidate.google_place_id, candidate.google_ftid, candidate.osm_id]
    .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
    .map((id) => id.trim());
}

/**
 * How to look for `candidate`, most reliable first. An empty list means the
 * candidate carries nothing to recognise it by, so it cannot match anything.
 */
export function placeMatchStrategies(candidate: PlaceMatchCandidate): PlaceMatchStrategy[] {
  const strategies: PlaceMatchStrategy[] = externalIdsOf(candidate).map((id) => ({
    by: 'externalId' as const,
    id,
  }));

  const name = normalizePlaceName(candidate.name);
  if (name) {
    strategies.push({ by: 'name', name });
    return strategies;
  }

  if (candidate.lat != null && candidate.lng != null) {
    strategies.push({
      by: 'coords',
      lat: candidate.lat,
      lng: candidate.lng,
      tolerance: COORD_DEDUP_TOLERANCE,
    });
  }
  return strategies;
}
