import type { TourListItem } from '@trek/shared';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { tourRepo } from '../../../repo/tourRepo';
import { useToast } from '../../shared/Toast';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { revisionConflictOf } from '../planner/useTourRevisionGuard';
import { NO_SKI_CHOICE, skiChoiceChanged, skiChoiceOf, skiFieldsOf, type SkiChoice } from './skiChoice';

interface SkiClassificationOptions {
  tripId: number;
  planner: Pick<TourPlannerController, 'mode'>;
  /** The trip's tours, which follow every save, so the card shows the classification as it stands. */
  tours: readonly TourListItem[];
  canEdit: boolean;
  /** The tour as it stands after the save, for the lists and the map to take it in. */
  onSaved: (tour: TourListItem) => Promise<void> | void;
}

/**
 * SKI-02: the ski track open in the planner and its classification, changed
 * on purpose in a dialog: the discipline, and for cross-country the
 * technique. Saving goes through the offline core and changes nothing of the
 * track; closing the dialog changes nothing at all.
 */
export function useSkiClassification({ tripId, planner, tours, canEdit, onSaved }: SkiClassificationOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [draft, setDraft] = useState<SkiChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const viewed = planner.mode.type === 'view-gpx' ? planner.mode.tour : null;
  const tour = viewed?.tour_type === 'ski' ? (tours.find((item) => item.place_id === viewed.place_id) ?? viewed) : null;
  const saved = useMemo(() => (tour ? skiChoiceOf(tour) : NO_SKI_CHOICE), [tour]);

  const open = useCallback(() => {
    if (tour && canEdit) setDraft(saved);
  }, [canEdit, saved, tour]);

  const close = useCallback(() => {
    if (!saving) setDraft(null);
  }, [saving]);

  const save = useCallback(async () => {
    const fields = draft ? skiFieldsOf(draft) : null;
    if (!tour || !fields || saving || !canEdit) return;
    setSaving(true);
    try {
      const result = await tourRepo.classifySki(tripId, tour.place_id, {
        ...fields,
        expected_revision: tour.revision ?? null,
      });
      await onSaved(result.tour);
      setDraft(null);
      toast.success(t('tours.ski.saved'));
    } catch (error: unknown) {
      // Saved elsewhere meanwhile: the list brings the newer classification, the dialog stays to choose again.
      toast.error(t(revisionConflictOf(error) === null ? 'tours.ski.saveFailed' : 'tours.revision.conflictTitle'));
    } finally {
      setSaving(false);
    }
  }, [canEdit, draft, onSaved, saving, t, toast, tour, tripId]);

  return {
    /** The ski track in view, or null while none is. */
    tour,
    canEdit,
    saving,
    /** The choice in the open dialog; null while it is closed. */
    draft,
    setDraft,
    /** The dialog's choice is complete and says something else than the saved one. */
    canSave: draft !== null && skiFieldsOf(draft) !== null && skiChoiceChanged(draft, saved),
    open,
    close,
    save,
  };
}

export type SkiClassification = ReturnType<typeof useSkiClassification>;
