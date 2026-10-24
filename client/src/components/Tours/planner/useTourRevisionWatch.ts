import type { TourListItem } from '@trek/shared';
import { useEffect } from 'react';
import { useTranslation } from '../../../i18n';
import { useToast } from '../../shared/Toast';
import type { TourPlannerController } from './useTourPlanner';

/**
 * P2C-03, live: the trip's tours follow every save over the websocket, so a
 * newer revision of the tour open in the editor means someone else saved it.
 * An editor without changes of its own loads it again at once and says so; an
 * editor with changes keeps them and shows the notice (TourRemoteChangeNotice),
 * and its save asks what to do instead of overwriting.
 */
export function useTourRevisionWatch(planner: TourPlannerController, tours: readonly TourListItem[]) {
  const { t } = useTranslation();
  const toast = useToast();
  const placeId = planner.mode.type === 'edit-saved' ? planner.mode.placeId : null;
  const listed = placeId === null ? undefined : tours.find((tour) => tour.place_id === placeId)?.revision;
  const { notice } = planner.revision;
  const { hasUnsavedChanges, isSaving, openTour } = planner;

  useEffect(() => {
    if (placeId === null || isSaving || !notice(listed)) return;
    if (hasUnsavedChanges) return;
    void openTour({ place_id: placeId }).then((opened) => {
      if (opened) toast.info(t('tours.revision.reloaded'));
    });
  }, [hasUnsavedChanges, isSaving, listed, notice, openTour, placeId, t, toast]);
}
