import type { Tag } from '@trek/shared';
import { offlineDb } from './offlineDb';

/** The trip's tags as the server last listed them; none while the device never read them. */
export async function cachedTripTags(tripId: number): Promise<Tag[]> {
  return (await offlineDb.tripTags.get(tripId))?.tags ?? [];
}

/** Keeps the trip's tags as the server listed them. */
export async function cacheTripTags(tripId: number, tags: Tag[]): Promise<void> {
  await offlineDb.tripTags.put({ tripId, tags });
}
