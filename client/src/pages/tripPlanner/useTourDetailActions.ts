import type { TourListItem } from '@trek/shared';
import { tourRepo } from '../../repo/tourRepo';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import type { useTripPlanner } from './useTripPlanner';

/**
 * What the tour's detail does beyond a place's: a rename reloads the tours,
 * a reimport from its source check (MF-03) takes the new snapshot in and opens
 * it, and "save as new tour" (P2C-07) makes the copy and opens it under a name
 * that says it is one, so renaming it is the next step.
 */
export function useTourDetailActions(planner: ReturnType<typeof useTripPlanner>) {
  const { invalidateTourPlaceIds, reloadTourPlaceIds, t, toast, tripActions, tripId, upsertTour } = planner;

  /** A tour that just came in: in the lists and on the map, then open. */
  const takeIn = async (tour: TourListItem) => {
    upsertTour(tour);
    await useTripStore.getState().refreshPlaces(tripId);
    void invalidateTourPlaceIds({ placeIds: [tour.place_id] });
    planner.handlePlaceClick(tour.place_id);
  };

  return {
    onUpdatePlace: async (placeId: number, data: Partial<Place>) => {
      await tripActions.updatePlace(tripId, placeId, data);
      await reloadTourPlaceIds();
    },
    onSourceReimported: takeIn,
    onSaveAsNew: async (tour: TourListItem) => {
      try {
        const name = t('tours.copy.name', { name: tour.name }).slice(0, 255);
        const { tour: copy } = await tourRepo.copy(tripId, tour.place_id, name);
        await takeIn(copy);
        toast.success(t('tours.copy.saved'));
      } catch {
        toast.error(t('tours.copy.failed'));
      }
    },
  };
}
