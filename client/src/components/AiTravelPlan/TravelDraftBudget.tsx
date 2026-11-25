import type { TravelPlanBudget } from '@trek/shared';
import { Wallet } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface TravelDraftBudgetProps {
  budget: TravelPlanBudget;
}

const CATEGORIES = ['lodging', 'meals', 'local_transport', 'tickets_other'] as const;

function formatCny(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

/**
 * The estimated price band and, more importantly, how it was reached. The
 * numbers are rule-based, so the assumptions are part of the answer rather
 * than fine print.
 */
export default function TravelDraftBudget({ budget }: TravelDraftBudgetProps): React.ReactElement {
  const { t, locale } = useTranslation();
  const rows = CATEGORIES.filter((key) => (budget.breakdown[key] ?? 0) > 0 || (budget.breakdownMax[key] ?? 0) > 0);

  return (
    <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
      <header className="mb-1 flex flex-wrap items-center gap-2">
        <Wallet size={16} className="text-content-muted" />
        <h2 className="text-body font-semibold text-content">{t('planner.ai.budgetTitle')}</h2>
        <span className="ms-auto text-body font-semibold text-content">
          {formatCny(budget.min, locale)}–{formatCny(budget.max, locale)}
        </span>
      </header>
      <p className="text-caption text-content-muted">{t('planner.ai.budgetEstimateNote')}</p>

      {rows.length === 0 ? (
        <p className="mt-3 text-body text-content-muted">{t('planner.ai.budgetNoEstimate')}</p>
      ) : (
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((key) => (
            <div key={key} className="flex items-center justify-between gap-3 text-body">
              <dt className="text-content-secondary">{t(`planner.ai.budgetCategory.${key}`)}</dt>
              <dd className="tabular-nums text-content">
                {formatCny(budget.breakdown[key] ?? 0, locale)}–{formatCny(budget.breakdownMax[key] ?? 0, locale)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {budget.assumptions.length > 0 && (
        <div className="mt-4 border-t border-edge pt-3">
          <h3 className="text-caption font-semibold text-content-secondary">{t('planner.ai.budgetAssumptions')}</h3>
          <ul className="mt-1.5 list-disc space-y-1 ps-5 text-caption leading-relaxed text-content-muted">
            {budget.assumptions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
