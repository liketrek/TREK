import type { TourCreateResponse } from '@trek/shared';
import { offlineDb, type CachedTour } from './offlineDb';

/**
 * A tour as the server answered it, written to the cache with its control
 * points. Where it came from and a paddle tour's checklist are kept from the
 * row already there when the answer carries none, so a write answered
 * without them does not lose them. Safe inside a Dexie transaction that
 * holds the tours table.
 */
export async function cacheTourAnswer(tripId: number, answer: TourCreateResponse): Promise<CachedTour> {
  const previous = await offlineDb.tours.get(answer.tour.place_id);
  const provenance = answer.provenance ?? previous?.provenance;
  // Only a paddle tour has a checklist; a tour that stopped being one drops it.
  const check = answer.tour.tour_type === 'kayak' ? (answer.obstacle_check ?? previous?.obstacle_check) : undefined;
  const row: CachedTour = {
    ...answer.tour,
    trip_id: tripId,
    waypoints: answer.waypoints,
    ...(provenance ? { provenance } : {}),
    ...(check ? { obstacle_check: check } : {}),
  };
  await offlineDb.tours.put(row);
  return row;
}
