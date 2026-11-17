import { Undo2 } from 'lucide-react';
import PlaceContribLog from '../../../components/Admin/PlaceContribLog';
import PlaceContribPrompt from '../../../components/Admin/PlaceContribPrompt';
import { contribNote, fieldEntries, fieldLabel, type ContribStatus } from '../../../components/Admin/placeContribModel';
import { usePlaceContribPanel } from '../../../components/Admin/usePlaceContribPanel';
import { useTranslation } from '../../../i18n';
import MToggle from '../../components/MToggle';
import MConfirmSheet from '../settings/MConfirmSheet';
import { MAdminButton, MAdminNote, MAdminRow } from './MAdminUi';

const STATUS_TONE: Record<ContribStatus, string> = {
  active: 'text-[color:var(--m-st-confirmed)]',
  paused: 'text-[color:var(--m-st-pending)]',
  off: 'text-m-muted',
  unavailable: 'text-m-muted',
};

/**
 * Sharing place details with the TREK Places API, the phone's form of the
 * desktop PlaceContribPanel: one switch for the installation (on asks for
 * consent first), one per field, the figures, the transmission log and the way
 * to take everything back. The logic is usePlaceContribPanel, shared with it.
 */
export default function MAdminPlaceContrib({ hideWhenSwitchedOff = false }: { hideWhenSwitchedOff?: boolean }) {
  const { t, locale } = useTranslation();
  const panel = usePlaceContribPanel({ hideWhenSwitchedOff });
  const { contrib, state, status, on, confirm, setConfirm } = panel;
  if (panel.hidden || !state || !status) return null;

  const number = new Intl.NumberFormat(locale);
  const last = state.lastSuccessDay
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
        new Date(`${state.lastSuccessDay}T12:00:00`)
      )
    : t('admin.contribute.never');

  return (
    <div className="rounded-[16px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-1">
      <MAdminRow
        first
        title={
          <span className="inline-flex max-w-full items-center gap-[6px]">
            <span className="min-w-0">{t('admin.contribute.title')}</span>
            <span
              className={`flex-none font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold ${STATUS_TONE[status]}`}
            >
              {t(`admin.contribute.status.${status}`)}
            </span>
          </span>
        }
        hint={contribNote(t, state)}
        trailing={
          <MToggle
            checked={on}
            ariaLabel={t('admin.contribute.title')}
            disabled={!state.eligible || contrib.busy}
            onChange={panel.toggleMain}
          />
        }
      />

      {on && (
        <>
          <MAdminNote>
            {[
              `${t('admin.contribute.figure.accepted')} ${number.format(state.counts.accepted)}`,
              `${t('admin.contribute.figure.queue')} ${number.format(state.queue.size)}`,
              `${t('admin.contribute.figure.last')} ${last}`,
            ].join(', ')}
          </MAdminNote>
          {state.queue.full && <MAdminNote warn>{t('admin.contribute.figure.queueFull')}</MAdminNote>}
          {fieldEntries(state.consent.fields).map(([field, fieldOn]) => (
            <MAdminRow
              key={field}
              title={fieldLabel(t, field)}
              trailing={
                <MToggle
                  checked={fieldOn}
                  ariaLabel={fieldLabel(t, field)}
                  disabled={contrib.busy}
                  onChange={() => panel.toggleField(field)}
                />
              }
            />
          ))}
        </>
      )}

      {panel.showLog && (
        <div className="space-y-2 border-t border-[color:var(--m-rowbr)] py-[11px]">
          <div className="text-[length:calc(12.5px*var(--fs-scale-body,1))] font-bold text-m-ink">
            {t('admin.contribute.log.title')}
          </div>
          <PlaceContribLog />
          <MAdminButton variant="ghost" disabled={contrib.busy} onClick={() => setConfirm('withdraw')}>
            <Undo2 size={12} strokeWidth={2.2} />
            {t('admin.contribute.withdraw')}
          </MAdminButton>
        </div>
      )}

      {panel.showPrompt && <PlaceContribPrompt state={state} contrib={contrib} onClose={panel.closePrompt} />}
      <MConfirmSheet
        open={confirm === 'off'}
        onClose={() => setConfirm(null)}
        title={t('admin.contribute.offTitle')}
        message={t('admin.contribute.offMessage')}
        confirmLabel={t('admin.contribute.offConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={panel.switchOff}
      />
      <MConfirmSheet
        open={confirm === 'withdraw'}
        onClose={() => setConfirm(null)}
        title={t('admin.contribute.withdrawTitle')}
        message={t('admin.contribute.withdrawMessage')}
        confirmLabel={t('admin.contribute.withdraw')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={panel.withdraw}
      />
    </div>
  );
}
