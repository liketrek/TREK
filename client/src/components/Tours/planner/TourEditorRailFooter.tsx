import { RotateCcw, Save } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { DialogButton, fs } from '../../shared/DialogShell';
import { PaddleSafetyRow } from '../paddle/PaddleSafety';
import type { TourPlannerController } from './useTourPlanner';

/**
 * The editor rail's foot: the paddle safety row, a word when a saved tour has
 * nothing new to save, and the discard and save buttons. It lives on its own
 * so the rail itself stays a readable list of its parts.
 */
export function TourEditorRailFooter({
  planner,
  canEdit,
  locked,
  isSavedEdit,
  onDiscard,
}: {
  planner: TourPlannerController;
  canEdit: boolean;
  /** Nothing changes while the viewer may not edit or a save is in flight. */
  locked: boolean;
  isSavedEdit: boolean;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const isSaving = planner.isSaving;
  return (
    <div className="flex flex-none flex-col gap-2 border-t border-edge-faint px-3 py-3">
      {planner.isPaddle && <PaddleSafetyRow />}
      {isSavedEdit && !locked && !planner.hasUnsavedChanges && (
        <p
          className="m-0 text-center text-content-faint"
          style={fs(11.5, 'body')}
          data-testid="tour-planner-nothing-to-save"
        >
          {t('tours.planner.nothingToSave')}
        </p>
      )}
      <div className="grid grid-cols-[auto_1fr] gap-2 [&>button]:justify-center">
        <DialogButton
          icon={<RotateCcw size={14} strokeWidth={2} />}
          onClick={onDiscard}
          disabled={isSaving || (!planner.hasUnsavedChanges && !isSavedEdit)}
        >
          {t('common.discard')}
        </DialogButton>
        <DialogButton
          variant="primary"
          icon={<Save size={14} strokeWidth={2} />}
          onClick={() => {
            if (canEdit && !isSaving) void planner.save();
          }}
          disabled={locked || !planner.canSave}
        >
          {t('common.save')}
        </DialogButton>
      </div>
    </div>
  );
}
