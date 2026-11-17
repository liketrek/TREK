import type { Tag, TripTagCreateRequest, TripTagListResponse } from '@trek/shared';

import { tripTagsApi } from '../api/tripTags';
import { cachedTripTags, cacheTripTags } from '../db/cacheTripTags';
import { withTripTag } from '../utils/placeTags';
import { requireOnline } from './onlineOnly';
import { onlineThenCache } from './withOfflineFallback';

/**
 * The tags a trip owns. Reading them works offline, from the list the device last
 * read. Adding one is online only, on purpose: the place it is then put on is saved
 * with the tag's id, and a queued place cannot name a tag the server has not made.
 * Putting a tag the trip already has on a place is the place's own write, which the
 * offline queue holds like any other.
 */
export const tripTagRepo = {
  async list(tripId: number | string): Promise<TripTagListResponse> {
    const id = Number(tripId);
    return onlineThenCache(
      async () => {
        const result = await tripTagsApi.list(id);
        await cacheTripTags(id, result.tags);
        return result;
      },
      async () => ({ tags: await cachedTripTags(id) })
    );
  },

  /** The new tag, or the one the trip already has under that name. */
  async create(tripId: number | string, body: TripTagCreateRequest): Promise<Tag> {
    requireOnline();
    const id = Number(tripId);
    const { tag } = await tripTagsApi.create(id, body);
    await cacheTripTags(id, withTripTag(await cachedTripTags(id), tag));
    return tag;
  },
};
