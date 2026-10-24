import { ListChecks } from 'lucide-react';
import type React from 'react';
import { useTranslation } from '../../i18n';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { dayPrepText, dayPrepUnsettled, type JourneyDayPrep } from './journeyRecordingPrepModel';

/**
 * Taking a day over with its stays (JRN-02), in the day header beside the
 * route: for an editor whose Dawarich answers, with the number of stays still
 * waiting on the day; offline it stays, dimmed, and says why. While the
 * journey prepares its days (JRN-03), a dot marks a day that is not final yet
 * (still running, fetched before it ended, not fetched, or stale after a
 * failed refresh) and the tooltip says which.
 */
export default function JourneyDayImportButton({
  pending,
  canTakeOver,
  needsConnection,
  prep,
  onOpen,
}: {
  /** Stays of the day nobody decided on yet. */
  pending: number;
  canTakeOver: boolean;
  needsConnection: boolean;
  /** Where preparing the day stands; absent while the journey does not prepare it. */
  prep?: JourneyDayPrep | null;
  onOpen: () => void;
}): React.ReactElement | null {
  const { t, locale } = useTranslation();
  if (!canTakeOver && !needsConnection) return null;
  const base = !canTakeOver
    ? t('dawarich.error.offline')
    : pending > 0
      ? t('journey.dayImport.pending', { count: pending })
      : t('journey.dayImport.openHint');
  const unsettled = canTakeOver && dayPrepUnsettled(prep);
  // The tooltip breaks before the second line; a screen reader reads both as one.
  const label = unsettled && prep ? `${base}\n${dayPrepText(prep, t, locale)}` : base;
  return (
    <Tooltip label={label} placement="top">
      <button
        type="button"
        onClick={canTakeOver ? onOpen : undefined}
        aria-disabled={!canTakeOver}
        aria-label={label}
        data-testid="journey-day-import"
        className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-content-secondary transition-colors aria-disabled:cursor-default aria-disabled:opacity-40 [&:not([aria-disabled=true])]:hover:bg-surface-hover"
        style={{ background: 'var(--vg-surf2)' }}
      >
        <ListChecks size={14} strokeWidth={2.2} aria-hidden="true" />
        {pending > 0 && (
          <span className="font-bold tabular-nums" style={fs(10.5)}>
            {pending}
          </span>
        )}
        {unsettled && (
          <span
            data-testid="journey-day-prep-unsettled"
            className="h-1.5 w-1.5 rounded-full bg-warning"
            aria-hidden="true"
          />
        )}
      </button>
    </Tooltip>
  );
}
