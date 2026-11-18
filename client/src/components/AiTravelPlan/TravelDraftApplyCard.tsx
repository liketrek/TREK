import type { TravelPlanApplyResult, TravelPlanDraft } from '@trek/shared';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Undo2, UserPlus, Wand2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface TripOption {
  id: number;
  title: string;
}

interface TravelDraftApplyCardProps {
  draft: TravelPlanDraft | null;
  applyResult: TravelPlanApplyResult | null;
  canApply: boolean;
  blocking: boolean;
  busy: boolean;
  tripOptions: TripOption[];
  mode: 'new_trip' | 'existing_trip';
  tripId: string;
  title: string;
  onModeChange: (mode: 'new_trip' | 'existing_trip') => void;
  onTripChange: (tripId: string) => void;
  onTitleChange: (title: string) => void;
  onApply: () => void;
  onUndo: () => void;
  onOpenTrip: () => void;
  /** Opens the trip's roster straight from the receipt, so a new trip can be shared before leaving. */
  onInvite: () => void;
}

function formatCny(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

/**
 * The confirmation step. Nothing is written until the traveller presses the
 * apply button here, and a blocking warning disables it outright. Once
 * applied, the same card becomes the receipt: where it went, what it wrote and
 * the one undo the server can carry out by itself.
 */
export default function TravelDraftApplyCard({
  draft,
  applyResult,
  canApply,
  blocking,
  busy,
  tripOptions,
  mode,
  tripId,
  title,
  onModeChange,
  onTripChange,
  onTitleChange,
  onApply,
  onUndo,
  onOpenTrip,
  onInvite,
}: TravelDraftApplyCardProps): React.ReactElement {
  const { t, locale } = useTranslation();
  const budget = draft?.estimatedBudgetCny;

  if (applyResult) {
    return (
      <section className="rounded-2xl border border-success bg-success-soft p-4 shadow-sm sm:p-5">
        <header className="mb-3 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-success" />
          <h2 className="text-sm font-semibold text-content">{t('planner.ai.appliedTitle')}</h2>
        </header>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface-card px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-content-muted">{t('planner.days')}</div>
            <div className="text-lg font-semibold text-content">{applyResult.createdDayIds.length}</div>
          </div>
          <div className="rounded-xl bg-surface-card px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-content-muted">{t('planner.places')}</div>
            <div className="text-lg font-semibold text-content">{applyResult.createdPlaceIds.length}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenTrip}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition hover:bg-accent-hover"
          >
            <ArrowUpRight size={16} />
            {t('planner.ai.openTrip')}
          </button>
          {applyResult.mode === 'new_trip' && (
            <button
              type="button"
              onClick={onInvite}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-edge px-4 py-2 text-sm font-medium text-content transition hover:bg-surface-hover"
            >
              <UserPlus size={16} />
              {t('members.inviteUser')}
            </button>
          )}
          {applyResult.mode === 'new_trip' ? (
            <button
              type="button"
              onClick={onUndo}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-edge px-4 py-2 text-sm font-medium text-content transition hover:bg-surface-hover disabled:opacity-60"
            >
              <Undo2 size={16} />
              {busy ? t('planner.ai.undoing') : t('planner.ai.undo')}
            </button>
          ) : (
            <p className="text-xs leading-relaxed text-content-muted">{t('planner.ai.undoManual')}</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex items-center gap-2">
        <Wand2 size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-content">{t('planner.ai.applyCardTitle')}</h2>
      </header>

      {budget && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface-secondary px-2.5 py-2">
            <div className="text-[11px] uppercase tracking-wide text-content-muted">{t('planner.days')}</div>
            <div className="text-base font-semibold text-content">{draft?.days.length ?? 0}</div>
          </div>
          <div className="rounded-xl bg-surface-secondary px-2.5 py-2">
            <div className="text-[11px] uppercase tracking-wide text-content-muted">{t('planner.places')}</div>
            <div className="text-base font-semibold text-content">
              {draft?.days.reduce((total, day) => total + day.items.length, 0) ?? 0}
            </div>
          </div>
          <div className="rounded-xl bg-surface-secondary px-2.5 py-2">
            <div className="text-[11px] uppercase tracking-wide text-content-muted">
              {t('planner.ai.estimatedBudget')}
            </div>
            <div className="text-xs font-semibold text-content">
              {formatCny(budget.min, locale)}–{formatCny(budget.max, locale)}
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1">
        <button
          type="button"
          aria-pressed={mode === 'new_trip'}
          onClick={() => onModeChange('new_trip')}
          className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
            mode === 'new_trip' ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted'
          }`}
        >
          {t('planner.ai.modeNew')}
        </button>
        <button
          type="button"
          aria-pressed={mode === 'existing_trip'}
          onClick={() => onModeChange('existing_trip')}
          className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
            mode === 'existing_trip' ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted'
          }`}
        >
          {t('planner.ai.modeExisting')}
        </button>
      </div>

      {mode === 'new_trip' ? (
        <div className="mb-3">
          <label className="mb-1 block text-xs text-content-muted" htmlFor="ai-plan-title">
            {t('planner.ai.newTripTitle')}
          </label>
          <input
            id="ai-plan-title"
            className="w-full rounded-xl border border-edge bg-surface-input px-3 py-2 text-sm text-content"
            value={title}
            maxLength={200}
            placeholder={t('planner.ai.newTripTitlePlaceholder')}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
      ) : (
        <div className="mb-3">
          <label className="mb-1 block text-xs text-content-muted" htmlFor="ai-plan-trip">
            {t('planner.ai.selectTrip')}
          </label>
          <select
            id="ai-plan-trip"
            className="w-full rounded-xl border border-edge bg-surface-input px-3 py-2 text-sm text-content"
            value={tripId}
            onChange={(event) => onTripChange(event.target.value)}
          >
            <option value="">{t('planner.ai.selectTripPlaceholder')}</option>
            {tripOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="mb-3 text-xs leading-relaxed text-content-muted">
        {mode === 'new_trip' ? t('planner.ai.applyHintNew') : t('planner.ai.applyHintExisting')}
      </p>

      {blocking && (
        <p className="mb-3 flex items-start gap-1.5 rounded-xl bg-danger-soft px-3 py-2 text-xs text-content">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
          {t('planner.ai.blockingCannotApply')}
        </p>
      )}

      <button
        type="button"
        onClick={onApply}
        disabled={!canApply || busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-on transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Wand2 size={16} />
        {busy ? t('planner.ai.applying') : t('planner.ai.apply')}
      </button>
    </section>
  );
}
