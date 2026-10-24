import { AlertTriangle, Circle, Loader2, RotateCcw, Route } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useTourFerrataCrossingStore } from '../../../store/tourFerrataCrossingStore';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { retryable, STATUS_KEY, statusLabelOf } from './railStatusText';
import type { TourPlannerController } from './useTourPlanner';

/** A status as a small round icon beside the title, its words in the tooltip and for a screen reader. */
function StatusDot({
  label,
  tone,
  children,
}: {
  label: string;
  tone: 'neutral' | 'info' | 'warning';
  children: ReactNode;
}) {
  const look = tone === 'warning' ? 'text-warning' : tone === 'info' ? 'text-info' : 'text-content-muted';
  return (
    <Tooltip label={label}>
      <span
        aria-label={label}
        className={`grid h-[20px] w-[20px] flex-none place-items-center rounded-full bg-surface-card shadow-sm ring-1 ring-inset ring-edge-faint ${look}`}
      >
        {children}
      </span>
    </Tooltip>
  );
}

/**
 * What the editor is doing right now, as icon badges beside the head's title:
 * a restored draft, routing or saving, and a failure with its retry. Nothing
 * when there is nothing to say.
 */
export function RailStatusBadges({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation();
  const statusKey = planner.isSaving ? STATUS_KEY.saving : STATUS_KEY[planner.status];
  const restored = planner.draftRestored && planner.hasUnsavedChanges;
  const onFerrata = useTourFerrataCrossingStore((state) => state.crossings.length > 0);
  const failed = planner.error === 'save' || planner.error === 'conflict';
  const canRetry = retryable(planner);
  if (!restored && !statusKey && !failed && !onFerrata) return null;
  const warning = planner.error != null || canRetry;
  const statusLabel = statusLabelOf(planner, statusKey, t);
  const busy = planner.isSaving || planner.status === 'routing' || planner.status === 'enriching-elevation';
  return (
    <span role="status" data-testid="tour-planner-status" className="ms-1.5 flex flex-none items-center gap-1">
      {restored && (
        <StatusDot label={t('tours.planner.restored')} tone="info">
          <RotateCcw size={11} strokeWidth={2.2} />
        </StatusDot>
      )}
      {onFerrata && (
        <StatusDot label={t('tours.ferrata.crossingShort')} tone="warning">
          <Route size={11} strokeWidth={2.2} />
        </StatusDot>
      )}
      {statusLabel && (
        <StatusDot label={statusLabel} tone={warning ? 'warning' : 'neutral'}>
          {warning ? (
            <AlertTriangle size={11} strokeWidth={2.2} />
          ) : busy ? (
            <Loader2 size={11} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Circle size={7} strokeWidth={3} />
          )}
        </StatusDot>
      )}
      {canRetry && (
        <button
          type="button"
          onClick={planner.retry}
          className="inline-flex h-[20px] items-center rounded-full bg-accent px-2 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={fs(10.5)}
        >
          {t('tours.planner.retry')}
        </button>
      )}
    </span>
  );
}
