import {
  DEFAULT_PORTAGE_SPEED_KMH,
  estimatePaddleTime,
  paddleLayoutOfTrack,
  recommendedPaddleSpeedKmh,
  type TourListItem,
} from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../../i18n';
import { tourRepo } from '../../../repo/tourRepo';
import {
  loadTrackMarks,
  markTrackMarksSaved,
  startTrackPick,
  trackMarkEdits,
  useTrackMarkToolStore,
  type TrackPick,
} from '../../../store/trackMarkToolStore';
import { useToast } from '../../shared/Toast';
import type { TourPlannerController } from '../planner/useTourPlanner';

interface TrackPaddlePlanOptions {
  tripId: number;
  planner: TourPlannerController;
  canEdit: boolean;
  /** The tour as it stands after the save, for the lists and the map to take it in. */
  onSaved: (tour: TourListItem) => Promise<void> | void;
}

/**
 * PAD-03 and PAD-07 for a recorded paddle track: the portages and locks laid
 * onto it and the speeds its estimate is reckoned with. The marks live in a
 * store the map shares (it is clicked to place them); this loads them when a
 * paddle import is opened, drops them when it is left, and saves them through
 * the offline core. The track itself is never changed.
 */
export function useTrackPaddlePlan({ tripId, planner, canEdit, onSaved }: TrackPaddlePlanOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const tour = planner.mode.type === 'view-gpx' ? planner.mode.tour : null;
  const paddleTour = tour?.tour_type === 'kayak' ? tour : null;
  const totalM = (planner.readOnlyGpxAnalysis?.distanceKm ?? 0) * 1000;
  const state = useTrackMarkToolStore(
    useShallow((store) => ({
      placeId: store.placeId,
      marks: store.marks,
      speeds: store.speeds,
      dirty: store.dirty,
      pick: store.pick,
      pendingFromM: store.pendingFromM,
      refused: store.refused,
    }))
  );

  // The tour opened, saved elsewhere meanwhile, or left: the marks follow it, unsaved ones are dropped.
  useEffect(() => {
    if (!paddleTour) {
      loadTrackMarks(null, null, { paddle: null, portage: null });
      return;
    }
    loadTrackMarks(paddleTour.place_id, paddleTour.track_marks, {
      paddle: paddleTour.paddle_speed_kmh ?? null,
      portage: paddleTour.portage_speed_kmh ?? null,
    });
  }, [paddleTour]);

  const active = !!paddleTour && state.placeId === paddleTour.place_id;
  const layout = useMemo(() => paddleLayoutOfTrack(totalM, state.marks), [state.marks, totalM]);
  const recommended = recommendedPaddleSpeedKmh(paddleTour?.boat_type ?? null);
  const estimate = useMemo(
    () =>
      estimatePaddleTime(layout, {
        paddleSpeedKmh: state.speeds.paddle ?? recommended,
        portageSpeedKmh: state.speeds.portage,
        breakMinutes: null,
      }),
    [layout, recommended, state.speeds.paddle, state.speeds.portage]
  );

  const save = useCallback(async () => {
    if (!paddleTour || saving || !canEdit) return;
    setSaving(true);
    try {
      const body = {
        paddle_speed_kmh: state.speeds.paddle,
        portage_speed_kmh: state.speeds.portage,
        track_marks: state.marks,
      };
      const result = await tourRepo.updatePaddlePlan(tripId, paddleTour.place_id, body);
      markTrackMarksSaved(result.tour.track_marks, {
        paddle: result.tour.paddle_speed_kmh ?? null,
        portage: result.tour.portage_speed_kmh ?? null,
      });
      await onSaved(result.tour);
      toast.success(t('tours.paddle.marks.saved'));
    } catch {
      toast.error(t('tours.paddle.marks.failed'));
    } finally {
      setSaving(false);
    }
  }, [canEdit, onSaved, paddleTour, saving, state.marks, state.speeds, t, toast, tripId]);

  const discard = useCallback(() => {
    if (!paddleTour) return;
    loadTrackMarks(paddleTour.place_id, paddleTour.track_marks, {
      paddle: paddleTour.paddle_speed_kmh ?? null,
      portage: paddleTour.portage_speed_kmh ?? null,
    });
  }, [paddleTour]);

  return {
    /** A recorded paddle track is open: the card shows. */
    active,
    canEdit,
    saving,
    marks: state.marks,
    speeds: state.speeds,
    dirty: state.dirty,
    pick: state.pick,
    pendingFromM: state.pendingFromM,
    refused: state.refused,
    totalM,
    layout,
    estimate,
    recommendedPaddleSpeed: recommended,
    defaultPortageSpeed: DEFAULT_PORTAGE_SPEED_KMH,
    startPick: (pick: TrackPick) => startTrackPick(state.pick === pick ? null : pick),
    edits: trackMarkEdits,
    save,
    discard,
  };
}

export type TrackPaddlePlan = ReturnType<typeof useTrackPaddlePlan>;
