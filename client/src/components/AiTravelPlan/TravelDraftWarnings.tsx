import type { TravelPlanWarning, TravelPlanWarningSeverity } from '@trek/shared';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';

interface TravelDraftWarningsProps {
  warnings: TravelPlanWarning[];
}

const SEVERITY_CLASS: Record<TravelPlanWarningSeverity, string> = {
  info: 'border-info bg-info-soft text-content',
  warning: 'border-warning bg-warning-soft text-content',
  blocking: 'border-danger bg-danger-soft text-content',
};

const SEVERITY_ICON: Record<TravelPlanWarningSeverity, React.ReactNode> = {
  info: <Info size={15} className="text-info" />,
  warning: <AlertTriangle size={15} className="text-warning" />,
  blocking: <ShieldAlert size={15} className="text-danger" />,
};

/** Everything the planner wants the traveller to know before applying; blocking first. */
export default function TravelDraftWarnings({ warnings }: TravelDraftWarningsProps): React.ReactElement {
  const { t } = useTranslation();
  const ordered = [...warnings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return (
    <section className="rounded-2xl border border-edge bg-surface-card p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-content">{t('planner.ai.warnings')}</h2>
      {ordered.length === 0 ? (
        <p className="text-sm text-content-muted">{t('planner.ai.noWarnings')}</p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((warning) => (
            <li
              key={`${warning.code}-${warning.message}`}
              className={`flex gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${SEVERITY_CLASS[warning.severity]}`}
            >
              <span className="mt-0.5 shrink-0">{SEVERITY_ICON[warning.severity]}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                  {t(`planner.ai.severity.${warning.severity}`)}
                </div>
                <p className="mt-0.5 break-words">{warning.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function severityRank(severity: TravelPlanWarningSeverity): number {
  return severity === 'blocking' ? 2 : severity === 'warning' ? 1 : 0;
}
