import type { PlaceContribField, PlaceContribState } from '@trek/shared';
import { ChevronRight, HeartHandshake, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../i18n';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { SettingsCard, StatusPill } from '../Settings/settingsKit';
import ToggleSwitch from '../Settings/ToggleSwitch';
import ConfirmDialog from '../shared/ConfirmDialog';
import { fs } from '../shared/DialogShell';
import { useToast } from '../shared/Toast';
import { FigureBadge } from '../Tours/paddle/FigureBadge';
import PlaceContribLog from './PlaceContribLog';
import {
  contribNote,
  contribStatus,
  fieldEntries,
  fieldLabel,
  refusalReason,
  type ContribStatus,
} from './placeContribModel';
import PlaceContribPrompt from './PlaceContribPrompt';
import { usePlaceContrib } from './usePlaceContrib';

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
  const toast = useToast();
  const contrib = usePlaceContrib();
  const { state } = contrib;
  const [prompting, setPrompting] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState<'off' | 'withdraw' | null>(null);

  if (!state) return null;
  // Standing alone (managed settings), a card that can only say "not available"
  // because the operator switched sharing off is a dead end.
  if (hideWhenSwitchedOff && state.ineligibleReason === 'env_off') return null;
  const status = contribStatus(state);
  const agreed = state.consent.decision === 'agreed' && state.consent.termsVersion === state.termsVersion;
  // The prompt opens by itself once per visit while the server asks for it.
  const showPrompt = prompting ?? state.showPrompt;

  const fail = (err: unknown) => {
    const reason = refusalReason(err);
    toast.error(
      reason === 'terms_outdated' || reason === 'no_field'
        ? t(`admin.contribute.refused.${reason}`)
        : getApiErrorMessage(err, t('common.error'))
    );
  };

  const toggleField = (field: PlaceContribField) => {
    const fields = { ...state.consent.fields, [field]: !state.consent.fields[field] };
    if (!Object.values(fields).some(Boolean)) {
      setConfirm('off');
      return;
    }
    contrib.decide({ action: 'fields', fields }).catch(fail);
  };

  const withdraw = () => {
    setConfirm(null);
    contrib.withdraw().then((r) => {
      const total = Object.values(r.withdrawn).reduce((a, b) => a + b, 0);
      toast.success(t('admin.contribute.withdrawn', { total }));
    }, fail);
  };

  return (
    <SettingsCard
      flush
      icon={HeartHandshake}
      title={t('admin.contribute.title')}
      badge={<StatusPill tone={PILL_TONE[status]}>{t(`admin.contribute.status.${status}`)}</StatusPill>}
      hint={contribNote(t, state)}
      action={
        <ToggleSwitch
          on={agreed && state.consent.enabled}
          label={t('admin.contribute.title')}
          disabled={!state.eligible || contrib.busy}
          onToggle={() => (agreed && state.consent.enabled ? setConfirm('off') : setPrompting(true))}
        />
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      {agreed && state.consent.enabled && (
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

      {(agreed || state.consent.decision === 'off') && (
        <details className="group overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
          {/* The admin page's fold head (pages/admin/FoldSummary), which a component cannot import. */}
          <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3.5 py-2.5 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--text-primary)] [&::-webkit-details-marker]:hidden">
            <ChevronRight
              size={15}
              strokeWidth={2}
              className="flex-none text-content-faint transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
            <span className="font-medium text-content" style={fs(12.5, 'body')}>
              {t('admin.contribute.log.title')}
            </span>
          </summary>
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
        </details>
      )}

      {showPrompt && state.eligible && (
        <PlaceContribPrompt state={state} contrib={contrib} onClose={() => setPrompting(false)} />
      )}
      <ConfirmDialog
        isOpen={confirm === 'off'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          contrib.decide({ action: 'off' }).catch(fail);
        }}
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
