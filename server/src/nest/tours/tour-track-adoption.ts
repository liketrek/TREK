import { normalizePlaceName } from '@trek/shared';

/** A place of the trip as the places list reads it: enough to tell a track that is no tour yet. */
export interface TripPlaceForAdoption {
  id: number;
  name: string;
  route_geometry?: string | null;
  tour_place_id?: number | null;
}

/** A track of the trip a file row takes over: its place and the line it already holds. */
export interface AdoptedTrack {
  id: number;
  route_geometry: string;
}

/**
 * The rows of a tour import that take over a track already in the trip, by
 * row index: a place with a line and no tour yet, under the same name
 * (trimmed, any case, the duplicate rule's own reading), one place per row
 * and oldest first. A GPX file imported before Tours existed (4.x) left its
 * tracks as plain places, and the name alone made every tour import of the
 * same file a duplicate, with no tour to show for it (#2810).
 */
export function tracksToAdopt(
  rows: ReadonlyArray<{ name: string }>,
  places: ReadonlyArray<TripPlaceForAdoption>,
): Map<number, AdoptedTrack> {
  const byName = new Map<string, AdoptedTrack[]>();
  for (const place of [...places].sort((a, b) => a.id - b.id)) {
    const key = normalizePlaceName(place.name);
    if (!key || !place.route_geometry || place.tour_place_id != null) continue;
    byName.set(key, [...(byName.get(key) ?? []), { id: place.id, route_geometry: place.route_geometry }]);
  }
  const adopt = new Map<number, AdoptedTrack>();
  rows.forEach((row, index) => {
    const key = normalizePlaceName(row.name);
    const track = key ? byName.get(key)?.shift() : undefined;
    if (track) adopt.set(index, track);
  });
  return adopt;
}
