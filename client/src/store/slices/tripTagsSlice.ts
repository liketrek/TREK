import type { Tag, TripTagCreateRequest, TripTagUpdateRequest } from '@trek/shared';
import type { StoreApi } from 'zustand';

import { tripTagRepo } from '../../repo/tripTagRepo';
import { withoutTagFilters } from '../../utils/placesFilter';
import { tagChanges, withTagChanges, withTripTag } from '../../utils/placeTags';
import type { TripStoreState } from '../tripStore';

type SetState = StoreApi<TripStoreState>['setState'];
type GetState = StoreApi<TripStoreState>['getState'];

export interface TripTagsSlice {
  /** The tags the open trip owns, the same list for everybody on it (`tags` holds the user's personal ones). */
  tripTags: Tag[];
  /** Reads the trip's tags again: on a reconnect, and when they changed elsewhere (`tripTags:changed`). */
  loadTripTags: (tripId: number | string) => Promise<void>;
  /** Adds a tag to the trip, or hands back the one it already has under that name. Needs a connection. */
  addTripTag: (tripId: number | string, data: TripTagCreateRequest) => Promise<Tag>;
  /** Renames or recolours one of the trip's tags, and takes the change into the places carrying it. Needs a connection. */
  updateTripTag: (tripId: number | string, tagId: number, data: TripTagUpdateRequest) => Promise<Tag>;
}

/**
 * The store once the trip's tags were read again. A place carries a copy of each of
 * its tags, so a tag renamed, recoloured or deleted elsewhere is taken into the places
 * and into the visits that embed them, and a deleted one leaves the category filter.
 */
function withTripTags(state: TripStoreState, tags: Tag[]): Partial<TripStoreState> {
  const changes = tagChanges(state.tripTags, tags);
  if (!changes) return { tripTags: tags };
  return {
    tripTags: tags,
    places: state.places.map((place) => withTagChanges(place, changes)),
    assignments: Object.fromEntries(
      Object.entries(state.assignments).map(([dayId, visits]) => [
        dayId,
        visits.map((visit) => {
          const place = visit.place && withTagChanges(visit.place, changes);
          return place === visit.place ? visit : { ...visit, place };
        }),
      ])
    ),
    placesCategoryFilter: withoutTagFilters(state.placesCategoryFilter, changes.removed),
  };
}

export const createTripTagsSlice = (set: SetState, get: GetState): TripTagsSlice => ({
  tripTags: [],

  loadTripTags: async (tripId) => {
    try {
      const { tags } = await tripTagRepo.list(tripId);
      // Another trip was opened while the answer was on its way.
      if (String(get().trip?.id) !== String(tripId)) return;
      set((state) => withTripTags(state, tags));
    } catch {
      // The tags on screen stay; the next reload or reconnect reads them again.
    }
  },

  addTripTag: async (tripId, data) => {
    const tag = await tripTagRepo.create(tripId, data);
    set((state) => ({ tripTags: withTripTag(state.tripTags, tag) }));
    return tag;
  },

  updateTripTag: async (tripId, tagId, data) => {
    const tag = await tripTagRepo.update(tripId, tagId, data);
    set((state) => withTripTags(state, withTripTag(state.tripTags, tag)));
    return tag;
  },
});
