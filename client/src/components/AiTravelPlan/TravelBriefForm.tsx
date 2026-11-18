import { Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';
import { PACE_OPTIONS, TRANSPORT_OPTIONS, type TravelBrief } from './aiPlanModel';

interface TravelBriefFormProps {
  brief: TravelBrief;
  disabled: boolean;
  onChange: (patch: Partial<TravelBrief>) => void;
  onSubmit: () => void;
}

const inputClass =
  'w-full rounded-xl border border-edge bg-surface-input px-3 py-2 text-sm text-content placeholder:text-content-faint focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60';
const labelClass = 'mb-1.5 block text-xs font-medium text-content-muted';

/** The traveller's wish list: one sentence, plus the structured fields that sharpen it. */
export default function TravelBriefForm({
  brief,
  disabled,
  onChange,
  onSubmit,
}: TravelBriefFormProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <form
      className="rounded-2xl border border-edge bg-surface-card p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="mb-5">
        <label className={labelClass} htmlFor="ai-plan-prompt">
          {t('planner.ai.promptLabel')}
        </label>
        <textarea
          id="ai-plan-prompt"
          className={`${inputClass} min-h-24 resize-y`}
          value={brief.prompt}
          maxLength={2000}
          disabled={disabled}
          placeholder={t('planner.ai.promptPlaceholder')}
          onChange={(event) => onChange({ prompt: event.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ai-plan-destination">
            {t('planner.ai.destination')}
          </label>
          <input
            id="ai-plan-destination"
            className={inputClass}
            value={brief.destination}
            maxLength={120}
            disabled={disabled}
            placeholder={t('planner.ai.destinationPlaceholder')}
            onChange={(event) => onChange({ destination: event.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ai-plan-origin">
            {t('planner.ai.origin')} <span className="text-content-faint">({t('planner.ai.optional')})</span>
          </label>
          <input
            id="ai-plan-origin"
            className={inputClass}
            value={brief.origin}
            maxLength={120}
            disabled={disabled}
            placeholder={t('planner.ai.originPlaceholder')}
            onChange={(event) => onChange({ origin: event.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ai-plan-start">
            {t('planner.ai.startDate')} <span className="text-content-faint">({t('planner.ai.optional')})</span>
          </label>
          <input
            id="ai-plan-start"
            type="date"
            className={inputClass}
            value={brief.startDate}
            disabled={disabled}
            onChange={(event) => onChange({ startDate: event.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ai-plan-end">
            {t('planner.ai.endDate')} <span className="text-content-faint">({t('planner.ai.optional')})</span>
          </label>
          <input
            id="ai-plan-end"
            type="date"
            className={inputClass}
            value={brief.endDate}
            min={brief.startDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ endDate: event.target.value })}
          />
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className={labelClass}>{t('planner.ai.travelers')}</legend>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs text-content-muted">
            <span className="mb-1 block">{t('planner.ai.adults')}</span>
            <input
              type="number"
              min={1}
              max={50}
              className={inputClass}
              value={brief.adults}
              disabled={disabled}
              onChange={(event) => onChange({ adults: Number(event.target.value) || 1 })}
            />
          </label>
          <label className="text-xs text-content-muted">
            <span className="mb-1 block">{t('planner.ai.children')}</span>
            <input
              type="number"
              min={0}
              max={50}
              className={inputClass}
              value={brief.children}
              disabled={disabled}
              onChange={(event) => onChange({ children: Number(event.target.value) || 0 })}
            />
          </label>
          <label className="text-xs text-content-muted">
            <span className="mb-1 block">{t('planner.ai.seniors')}</span>
            <input
              type="number"
              min={0}
              max={50}
              className={inputClass}
              value={brief.seniors}
              disabled={disabled}
              onChange={(event) => onChange({ seniors: Number(event.target.value) || 0 })}
            />
          </label>
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ai-plan-budget">
            {t('planner.ai.budget')} <span className="text-content-faint">({t('planner.ai.optional')})</span>
          </label>
          <input
            id="ai-plan-budget"
            type="number"
            min={0}
            max={1000000}
            className={inputClass}
            value={brief.budgetCny}
            disabled={disabled}
            placeholder={t('planner.ai.budgetPlaceholder')}
            onChange={(event) => onChange({ budgetCny: event.target.value })}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ai-plan-pace">
            {t('planner.ai.pace')}
          </label>
          <select
            id="ai-plan-pace"
            className={inputClass}
            value={brief.pace}
            disabled={disabled}
            onChange={(event) => onChange({ pace: event.target.value as TravelBrief['pace'] })}
          >
            {PACE_OPTIONS.map((pace) => (
              <option key={pace} value={pace}>
                {t(`planner.ai.pace.${pace}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="ai-plan-transport">
            {t('planner.ai.transport')}
          </label>
          <select
            id="ai-plan-transport"
            className={inputClass}
            value={brief.transport}
            disabled={disabled}
            onChange={(event) => onChange({ transport: event.target.value as TravelBrief['transport'] })}
          >
            {TRANSPORT_OPTIONS.map((transport) => (
              <option key={transport} value={transport}>
                {t(`planner.ai.transport.${transport}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="ai-plan-interests">
            {t('planner.ai.interests')} <span className="text-content-faint">({t('planner.ai.optional')})</span>
          </label>
          <input
            id="ai-plan-interests"
            className={inputClass}
            value={brief.interests}
            disabled={disabled}
            placeholder={t('planner.ai.interestsPlaceholder')}
            onChange={(event) => onChange({ interests: event.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="ai-plan-constraints">
            {t('planner.ai.constraints')} <span className="text-content-faint">({t('planner.ai.optional')})</span>
          </label>
          <input
            id="ai-plan-constraints"
            className={inputClass}
            value={brief.constraints}
            disabled={disabled}
            placeholder={t('planner.ai.constraintsPlaceholder')}
            onChange={(event) => onChange({ constraints: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-content-muted">{t('planner.ai.briefHint')}</p>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-on transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles size={16} />
          {disabled ? t('planner.ai.generating') : t('planner.ai.generate')}
        </button>
      </div>
    </form>
  );
}
