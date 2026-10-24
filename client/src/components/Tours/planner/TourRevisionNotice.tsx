import { CopyPlus, History, RefreshCw, Save, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from '../../../i18n';
import ConfirmDialog from '../../shared/ConfirmDialog';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../../shared/DialogShell';
import type { TourPlannerController } from './useTourPlanner';

/** The tour open in the editor again as it is saved now: the draft here is thrown away. */
function reloadSaved(planner: TourPlannerController) {
  if (planner.mode.type !== 'edit-saved') return;
  void planner.openTour({ place_id: planner.mode.placeId });
}

/**
 * P2C-03, said while editing: someone else saved this tour since it was
 * opened here, and this draft has changes of its own. Nothing is lost yet;
 * the newer tour can be loaded (after a confirm, since the draft goes), or the
 * draft kept, and its save then asks what to do.
 */
export function TourRemoteChangeNotice({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  if (planner.revision.remote === null || !planner.hasUnsavedChanges || planner.revision.conflict) return null;
  return (
    <section
      role="status"
      data-testid="tour-remote-change"
      className="ring-warning/25 flex items-start gap-2.5 rounded-[12px] bg-warning-soft px-3 py-2.5 ring-1 ring-inset"
    >
      <History size={15} strokeWidth={2} className="mt-0.5 flex-none text-warning" />
      <div className="min-w-0 flex-1">
        <p className="m-0 font-semibold text-content" style={fs(12.5, 'body')}>
          {t('tours.revision.remoteTitle')}
        </p>
        <p className="m-0 mt-0.5 leading-snug text-content-secondary" style={fs(12, 'body')}>
          {t('tours.revision.remoteBody')}
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-card px-2.5 font-semibold text-content shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={fs(11.5, 'body')}
        >
          <RefreshCw size={12} strokeWidth={2.2} />
          {t('tours.revision.loadNewer')}
        </button>
      </div>
      <button
        type="button"
        onClick={planner.revision.dismissRemote}
        aria-label={t('common.close')}
        className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-card hover:text-content"
      >
        <X size={13} strokeWidth={2.2} />
      </button>
      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => reloadSaved(planner)}
        title={t('tours.revision.loadNewerTitle')}
        message={t('tours.revision.loadNewerBody')}
        confirmLabel={t('tours.revision.loadNewer')}
      />
    </section>
  );
}

/**
 * P2C-03 when a save was refused because the tour moved on meanwhile. Three
 * ways on, none of them silent: keep both by saving this draft as a tour of
 * its own (the one that loses nothing, so it leads), load the newer tour and
 * drop the draft, or save the draft over the newer tour on purpose. Closing
 * keeps editing; the next save asks again.
 */
export function TourRevisionConflictDialog({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation();
  const labelId = useId();
  const { conflict } = planner.revision;
  if (!conflict || planner.mode.type !== 'edit-saved') return null;
  const busy = planner.isSaving;
  const close = planner.revision.dismissConflict;
  return (
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      width="detail"
      blocked={busy}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <History size={20} strokeWidth={2} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          eyebrow={t('tours.revision.conflictEyebrow')}
          title={t('tours.revision.conflictTitle')}
          sub={t('tours.revision.conflictBody')}
          subWraps
        />
      }
      footer={
        <DialogFooter>
          <DialogButton
            data-testid="tour-conflict-overwrite"
            disabled={busy}
            icon={<Save size={14} strokeWidth={2} />}
            onClick={() => {
              planner.revision.takeOver();
              void planner.save();
            }}
          >
            {t('tours.revision.overwrite')}
          </DialogButton>
          <FooterSpacer />
          <DialogButton
            data-testid="tour-conflict-reload"
            disabled={busy}
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={() => reloadSaved(planner)}
          >
            {t('tours.revision.loadNewer')}
          </DialogButton>
          <DialogButton
            variant="primary"
            data-testid="tour-conflict-save-new"
            disabled={busy}
            icon={<CopyPlus size={14} strokeWidth={2} />}
            onClick={() =>
              void planner.save({ asNew: true, name: t('tours.revision.mineName', { name: planner.name.trim() }) })
            }
          >
            {t('tours.revision.saveAsNew')}
          </DialogButton>
        </DialogFooter>
      }
    />
  );
}
