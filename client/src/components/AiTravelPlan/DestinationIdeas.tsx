import type { DestinationIdea } from '@trek/shared';
import { Loader2, MapPin, Sparkles } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface DestinationIdeasProps {
  ideas: DestinationIdea[] | null;
  pending: boolean;
  disabled?: boolean;
  onSuggest: () => void;
  onPick: (idea: DestinationIdea) => void;
}

/**
 * Discovery inside the brief form: ask for a few cities, then pick one. Picking
 * only fills the destination field; nothing is generated until the traveller
 * submits the form.
 */
export default function DestinationIdeas({
  ideas,
  pending,
  disabled = false,
  onSuggest,
  onPick,
}: DestinationIdeasProps): React.ReactElement {
  const { t, locale } = useTranslation();
  const dayLabel = new Intl.NumberFormat(locale, { style: 'unit', unit: 'day', unitDisplay: 'long' });
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });

  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || pending}
        onClick={onSuggest}
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        {pending ? t('planner.ai.ideasLoading') : t('planner.ai.ideasCta')}
      </button>

      {ideas !== null && !pending && (
        <div className="mt-3">
          {ideas.length === 0 ? (
            <p className="text-xs text-content-muted">{t('planner.ai.ideasEmpty')}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-3">
              {ideas.map((idea) => (
                <li key={idea.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPick(idea)}
                    className="h-full w-full rounded-xl border border-edge bg-surface-input p-3 text-left transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-1 text-sm font-semibold text-content">
                      <MapPin size={12} className="text-content-muted" />
                      {idea.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-content-muted">
                      {idea.region} · {dayLabel.format(idea.suggestedDays)}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-content-muted">
                      {currency.format(idea.estimatedBudgetCny.min)}–{currency.format(idea.estimatedBudgetCny.max)}
                    </span>
                    {idea.reasons.length > 0 && (
                      <span className="mt-1 block text-xs leading-relaxed text-content-secondary">
                        {idea.reasons.slice(0, 2).join(' · ')}
                      </span>
                    )}
                    <span className="mt-1.5 block text-xs font-medium text-accent">{t('planner.ai.ideasPick')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
