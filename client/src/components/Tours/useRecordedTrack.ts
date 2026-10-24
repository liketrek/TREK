import type { TourListItem } from '@trek/shared';
import { useCallback, useState } from 'react';
import { useTranslation } from '../../i18n';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import { tourRepo } from '../../repo/tourRepo';
import { useToast } from '../shared/Toast';
import type { TourPlannerController } from './planner/useTourPlanner';

interface RecordedTrackOptions {
  tripId: number;
  planner: TourPlannerController;
  tours: readonly TourListItem[];
  canEdit: boolean;
  /** The tour as it stands after going back, for the lists and the map to take it in. */
  onRestored: (tour: TourListItem) => Promise<void> | void;
}

/**
 * Going back from a planned-over import to the track it was recorded with: the
 * undo of "replace the import", offered for as long as the tour keeps that
 * track, not only right after. The planning is dropped on the server; the tour
 * keeps its id, days and notes.
 */
export function useRecordedTrack({ tripId, planner, tours, canEdit, onRestored }: RecordedTrackOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const placeId = planner.mode.type === 'edit-saved' ? planner.mode.placeId : null;
  const tour = placeId === null ? null : (tours.find((item) => item.place_id === placeId) ?? null);
  const { returnToNeutral } = planner;

  const restore = useCallback(async () => {
    if (!tour || restoring) return;
    setRestoring(true);
    try {
      const result = await tourRepo.restoreRecorded(tripId, tour.place_id);
      returnToNeutral();
      await onRestored(result.tour);
      toast.success(t('tours.recorded.restored'));
    } catch (err: unknown) {
      // Offline, or behind an edit of the tour still waiting to be sent: said as such, not as a failure.
      toast.error(t(err instanceof OnlineOnlyError ? 'tours.recorded.offline' : 'tours.recorded.failed'));
    } finally {
      setRestoring(false);
    }
  }, [onRestored, restoring, returnToNeutral, t, toast, tour, tripId]);

  return {
    /** The tour in the editor keeps a recorded track and the user may change it. */
    available: canEdit && !!tour?.has_recorded_track,
    restoring,
    restore,
  };
}

export type RecordedTrack = ReturnType<typeof useRecordedTrack>;
