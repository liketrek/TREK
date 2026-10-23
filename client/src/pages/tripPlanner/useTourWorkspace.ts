import type { TourListItem } from '@trek/shared';
import { useCallback } from 'react';
import { useGpxConversion } from '../../components/Tours/conversion/useGpxConversion';
import { usePaddleChecklist } from '../../components/Tours/paddle/usePaddleChecklist';
import { useTrackPaddlePlan } from '../../components/Tours/paddle/useTrackPaddlePlan';
import { useTourPlanner } from '../../components/Tours/planner/useTourPlanner';
import { useTourRevisionWatch } from '../../components/Tours/planner/useTourRevisionWatch';
import { useSkiClassification } from '../../components/Tours/ski/useSkiClassification';
import { useRecordedTrack } from '../../components/Tours/useRecordedTrack';
import { useTourGpxImport } from '../../components/Tours/useTourGpxImport';
import { useWandererBrowser } from '../../components/Tours/wanderer/useWandererBrowser';
import { useAddonStore } from '../../store/addonStore';
import { useTripStore } from '../../store/tripStore';
import { useTourDetailActions } from './useTourDetailActions';
import type { useTripPlanner } from './useTripPlanner';

type TripPlanner = ReturnType<typeof useTripPlanner>;

/**
 * A tour of the trip opened in the planner: an import (no waypoints of its own) shows as it
 * came in, a planned tour opens in the editor. Never over an edit it would replace.
 */
function useTourOpeners(
  tourPlanner: ReturnType<typeof useTourPlanner>,
  places: TripPlanner['places'],
  tours: TripPlanner['tours']
) {
  const { hasUnsavedChanges, viewGpxTour, openTour } = tourPlanner;
  /** An import shown as it came in, over whatever the planner shows; the caller asked before discarding. */
  const viewImportedTour = useCallback(
    (tour: TourListItem) => {
      // The store first: right after an import the page's list may not have the new place yet.
      const byId = (item: { id: number }) => item.id === tour.place_id;
      const place = useTripStore.getState().places.find(byId) ?? places.find(byId);
      viewGpxTour(tour, place?.route_geometry ?? null);
    },
    [places, viewGpxTour]
  );
  const openTourInPlanner = useCallback(
    (placeId: number, known?: TourListItem) => {
      const tour = known ?? tours.find((item) => item.place_id === placeId);
      if (!tour || hasUnsavedChanges) return;
      if (tour.has_waypoints === false) viewImportedTour(tour);
      else void openTour(tour);
    },
    [hasUnsavedChanges, openTour, tours, viewImportedTour]
  );
  return { viewImportedTour, openTourInPlanner };
}

/**
 * The desktop tours workspace: the tour editor, its GPX import (button and file drop)
 * and the wanderer trail browser, wired so that whatever comes in opens on the map.
 */
export function useTourWorkspace(planner: TripPlanner, canPlaceEdit: boolean, canDayEdit: boolean) {
  const {
    activeTab,
    enabledAddons,
    invalidateTourPlaceIds,
    isMobile,
    places,
    reloadTourPlaceIds,
    t,
    toast,
    tours,
    tripActions,
    tripId,
    tripMembers,
    upsertTour,
  } = planner;
  // wanderer only while the admin allows it under Tours (the store reads Tours being on into it too).
  const wandererAllowed = useAddonStore((state) => state.toursWanderer);

  const tourPlanner = useTourPlanner({
    tripId,
    canEdit: canPlaceEdit,
    canAssign: canDayEdit,
    active: activeTab === 'tour-planner' && enabledAddons.tours && !isMobile,
    onSaved: async (result) => {
      upsertTour(result.tour);
      toast.success(t('tours.planner.saved'));
      await tripActions.loadTrip(tripId);
      void reloadTourPlaceIds();
    },
  });

  useTourRevisionWatch(tourPlanner, tours); // P2C-03: a save made elsewhere reaches the open editor
  const { viewImportedTour, openTourInPlanner } = useTourOpeners(tourPlanner, places, tours);

  // The tours workspace's GPX import, shared by its button and its file drop. One new
  // tour opens on the map at once.
  const openImportedTours = useCallback(
    (imported: TourListItem[]) => {
      if (imported.length === 1) openTourInPlanner(imported[0].place_id, imported[0]);
    },
    [openTourInPlanner]
  );
  const tourGpxImport = useTourGpxImport({
    tripId,
    canEdit: canPlaceEdit,
    onToursChanged: (placeIds) => invalidateTourPlaceIds(placeIds ? { placeIds } : undefined),
    onImported: openImportedTours,
  });

  // Browsing the user's wanderer trails in place of the editor rail; the trail shows on the map.
  const wandererBrowser = useWandererBrowser({
    tripId,
    enabled: activeTab === 'tour-planner' && wandererAllowed && !isMobile && canPlaceEdit,
    onImported: async (tour) => {
      upsertTour(tour);
      await useTripStore.getState().refreshPlaces(tripId);
      void invalidateTourPlaceIds({ placeIds: [tour.place_id] });
      openTourInPlanner(tour.place_id, tour);
    },
    onOpenTour: openTourInPlanner,
  });

  // An import planned as an editable tour: analysed on request, adopted over itself or as a new draft.
  const tourConversion = useGpxConversion(tourPlanner);
  // The way back from an import planned over in place to its recorded track.
  const recordedTrack = useRecordedTrack({
    tripId,
    planner: tourPlanner,
    tours,
    canEdit: canPlaceEdit,
    onRestored: async (tour) => {
      upsertTour(tour);
      await useTripStore.getState().refreshPlaces(tripId);
      void invalidateTourPlaceIds({ placeIds: [tour.place_id] });
      viewImportedTour(tour);
    },
  });

  // A tour saved by a paddle card, its portages and locks or a checklist decision: lists and map take it in.
  const takeInSavedTour = (tour: TourListItem) => {
    upsertTour(tour);
    void invalidateTourPlaceIds({ placeIds: [tour.place_id] });
  };
  // PAD-03/PAD-07: portages and locks laid onto a recorded paddle track, without redrawing it.
  const trackPaddlePlan = useTrackPaddlePlan({
    tripId,
    planner: tourPlanner,
    canEdit: canPlaceEdit,
    onSaved: takeInSavedTour,
  });
  // PAD-06/PAD-09: the obstacle checklist of the paddle tour open in the planner.
  const paddleChecklist = usePaddleChecklist({
    tripId,
    planner: tourPlanner,
    tours,
    tripMembers,
    canEdit: canPlaceEdit,
    active: activeTab === 'tour-planner' && enabledAddons.tours && !isMobile,
    trackPaddlePlan,
    onSaved: takeInSavedTour,
  });

  // SKI-02: the discipline and technique of the ski track in view, classified again without touching the track.
  const skiClassification = useSkiClassification({
    tripId,
    planner: tourPlanner,
    tours,
    canEdit: canPlaceEdit,
    onSaved: takeInSavedTour,
  });

  return {
    tourPlanner,
    viewImportedTour,
    // A saved tour opened in the editor, or shown as it came in; the chat's `?tour=` link opens it this way.
    openTourInPlanner,
    tourGpxImport,
    wandererBrowser,
    tourConversion,
    recordedTrack,
    trackPaddlePlan,
    paddleChecklist,
    skiClassification,
    tourDetailActions: useTourDetailActions(planner),
  };
}
