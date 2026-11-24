import type { PlaceContribState } from '@trek/shared';
import { HeartHandshake, Undo2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { TranslationFn } from '../../types';
import { SettingsCard, StatusPill } from '../Settings/settingsKit';
import ToggleSwitch from '../Settings/ToggleSwitch';
import ConfirmDialog from '../shared/ConfirmDialog';
import { fs } from '../shared/DialogShell';
import { FigureBadge } from '../Tours/paddle/FigureBadge';
import PlaceContribLog from './PlaceContribLog';
import { contribNote, fieldEntries, fieldLabel, type ContribStatus } from './placeContribModel';
import PlaceContribPrompt from './PlaceContribPrompt';
import { usePlaceContribPanel } from './usePlaceContribPanel';

const PILL_TONE: Record<ContribStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  off: 'neutral',
  unavailable: 'neutral',
};

function Figures({ state, t }: { state: PlaceContribState; t: TranslationFn }) {
  const { locale } = useTranslation();
  const number = new Intl.NumberFormat(locale);
  const last = state.lastSuccessDay
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
        new Date(`${state.lastSuccessDay}T12:00:00`)
      )
    : t('admin.contribute.never');
  return (
    <div className="flex flex-wrap gap-1.5">
      <FigureBadge
        label={t('admin.contribute.figure.accepted')}
        value={number.format(state.counts.accepted)}
        info={t('admin.contribute.figure.acceptedInfo')}
      />
      <FigureBadge
        label={t('admin.contribute.figure.queue')}
        value={number.format(state.queue.size)}
        tone={state.queue.full ? 'warning' : 'neutral'}
        info={state.queue.full ? t('admin.contribute.figure.queueFull') : undefined}
      />
      <FigureBadge label={t('admin.contribute.figure.last')} value={last} />
    </div>
  );
}

/**
 * Sharing place details with the TREK Places API, inside the TREK API card:
 * one switch for the installation, one per field, the transmission log and the
 * way to take everything back. Turning it on for the first time opens the same
 * prompt an admin gets on the first visit, so an agreement always comes from it.
 */
export default function PlaceContribPanel({ hideWhenSwitchedOff = false }: { hideWhenSwitchedOff?: boolean } = {}) {
  const { t } = useTranslation();
  const panel = usePlaceContribPanel({ hideWhenSwitchedOff });
  const { contrib, state, status, on, confirm, setConfirm, toggleField, withdraw } = panel;

  if (panel.hidden || !state || !status) return null;

  return (
    <SettingsCard
      flush
      icon={HeartHandshake}
      title={t('admin.contribute.title')}
      badge={<StatusPill tone={PILL_TONE[status]}>{t(`admin.contribute.status.${status}`)}</StatusPill>}
      hint={contribNote(t, state)}
      action={
        <ToggleSwitch
          on={on}
          label={t('admin.contribute.title')}
          disabled={!state.eligible || contrib.busy}
          onToggle={panel.toggleMain}
        />
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      {on && (
        <>
          <Figures state={state} t={t} />
          <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 max-sm:grid-cols-1">
            {fieldEntries(state.consent.fields).map(([field, on]) => (
              <li
                key={field}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-edge-faint bg-surface-card px-3 py-1.5"
              >
                <span className={on ? 'text-content' : 'text-content-faint'} style={fs(12.5, 'body')}>
                  {fieldLabel(t, field)}
                </span>
                <ToggleSwitch
                  on={on}
                  label={fieldLabel(t, field)}
                  disabled={contrib.busy}
                  onToggle={() => toggleField(field)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {panel.showLog && (
        <div className="overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
          {/* A plain section head: the settings fold nothing away. */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5">
            <span className="font-medium text-content" style={fs(12.5, 'body')}>
              {t('admin.contribute.log.title')}
            </span>
          </div>
          <div className="flex flex-col gap-3 border-t border-edge-faint p-3">
            <PlaceContribLog />
            <button
              type="button"
              disabled={contrib.busy}
              onClick={() => setConfirm('withdraw')}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-edge-faint bg-surface-card px-3 py-1.5 font-medium text-danger hover:bg-danger-soft disabled:opacity-40"
              style={fs(12.5, 'body')}
            >
              <Undo2 size={14} aria-hidden="true" />
              {t('admin.contribute.withdraw')}
            </button>
          </div>
        </div>
      )}

      {panel.showPrompt && <PlaceContribPrompt state={state} contrib={contrib} onClose={panel.closePrompt} />}
      <ConfirmDialog
        isOpen={confirm === 'off'}
        onClose={() => setConfirm(null)}
        onConfirm={panel.switchOff}
        title={t('admin.contribute.offTitle')}
        message={t('admin.contribute.offMessage')}
        confirmLabel={t('admin.contribute.offConfirm')}
      />
      <ConfirmDialog
        isOpen={confirm === 'withdraw'}
        onClose={() => setConfirm(null)}
        onConfirm={withdraw}
        title={t('admin.contribute.withdrawTitle')}
        message={t('admin.contribute.withdrawMessage')}
        confirmLabel={t('admin.contribute.withdraw')}
        danger
      />
    </SettingsCard>
  );
}
