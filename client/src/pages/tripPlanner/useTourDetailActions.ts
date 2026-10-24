import type { TourListItem } from '@trek/shared';
import { rememberListsSubTab } from '../../hooks/useListsSubTab';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import { tourRepo } from '../../repo/tourRepo';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import type { useTripPlanner } from './useTripPlanner';

/**
 * What the tour's detail does beyond a place's: a rename reloads the tours,
 * a reimport from its source check (MF-03) takes the new snapshot in and opens
 * it, "save as new tour" (P2C-07) makes the copy and opens it under a name
 * that says it is one, so renaming it is the next step, and a recorded track
 * assigned or taken off (ACT-01) is taken into the lists.
 */
export function useTourDetailActions(planner: ReturnType<typeof useTripPlanner>) {
  const { invalidateTourPlaceIds, reloadTourPlaceIds, t, toast, tripActions, tripId, upsertTour } = planner;

  /** A tour that just came in: in the lists and on the map. */
  const bringIn = async (tour: TourListItem) => {
    upsertTour(tour);
    await useTripStore.getState().refreshPlaces(tripId);
    void invalidateTourPlaceIds({ placeIds: [tour.place_id] });
  };
  /** ...and its detail open. */
  const takeIn = async (tour: TourListItem) => {
    await bringIn(tour);
    planner.handlePlaceClick(tour.place_id);
  };

  return {
    onUpdatePlace: async (placeId: number, data: Partial<Place>) => {
      await tripActions.updatePlace(tripId, placeId, data);
      await reloadTourPlaceIds();
    },
    onSourceReimported: takeIn,
    /** ACT-01: a recorded track assigned, taken off or imported; the lists read these tours again. */
    onToursChanged: (placeIds: number[]) => invalidateTourPlaceIds({ placeIds }),
    /** LIB-02: a tour taken over from another trip; the tours rail opens it in the planner. */
    onTakenOver: bringIn,
    /** P2D-XD-01: the packing list a tour points at, in the trip's Lists tab, on its packing side. */
    onOpenPacking: () => {
      planner.setSelectedPlaceId(null);
      rememberListsSubTab(tripId, 'packing');
      planner.handleTabChange('listen');
    },
    onSaveAsNew: async (tour: TourListItem) => {
      try {
        const name = t('tours.copy.name', { name: tour.name }).slice(0, 255);
        const { tour: copy } = await tourRepo.copy(tripId, tour.place_id, name);
        await takeIn(copy);
        toast.success(t('tours.copy.saved'));
      } catch (err: unknown) {
        // Offline, or behind an edit of the tour still waiting to be sent, which the copy would leave out.
        toast.error(t(err instanceof OnlineOnlyError ? 'tours.copy.offline' : 'tours.copy.failed'));
      }
    },
  };
}
