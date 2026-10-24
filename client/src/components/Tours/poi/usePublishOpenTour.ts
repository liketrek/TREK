import { TOUR_STOP_TYPES } from '@trek/shared';
import { useEffect } from 'react';
import { setOpenTour } from '../../../store/openTourStore';
import type { TourPlannerController } from '../planner/useTourPlanner';

type PublishedPlanner = Pick<
  TourPlannerController,
  'tripId' | 'mode' | 'name' | 'tourType' | 'hasUnsavedChanges' | 'canEdit'
>;

const STOP_TYPES: readonly string[] = TOUR_STOP_TYPES;

/**
 * P6: tells the chat which saved tour the editor has open, so a place the
 * assistant found can be taken into it with "+ Tour". Only a saved hike or
 * city walk the user may edit counts, and only while the editor holds nothing
 * unsaved: the stop is saved on the server, and a draft would then stand
 * against a newer tour. `shown` is whether the editor is on screen at all.
 */
export function usePublishOpenTour(planner: PublishedPlanner, shown: boolean): void {
  const { tripId, mode, name, tourType, hasUnsavedChanges, canEdit } = planner;
  const placeId = mode.type === 'edit-saved' ? mode.placeId : null;
  const trip = Number(tripId);
  const takesStop = shown && placeId !== null && canEdit && !hasUnsavedChanges && STOP_TYPES.includes(tourType);
  useEffect(() => {
    setOpenTour(takesStop && placeId !== null ? { tripId: trip, placeId, name } : null);
  }, [name, placeId, takesStop, trip]);
  // The editor gone, the chat no longer offers to take anything into it.
  useEffect(() => () => setOpenTour(null), []);
}
