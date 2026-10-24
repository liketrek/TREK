import type { JourneyRecordedDay } from '@trek/shared';
import { Route } from 'lucide-react';
import type React from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance } from '../../utils/units';
import DawarichIcon from '../shared/DawarichIcon';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';

// aria-disabled rather than disabled: a disabled button gets no pointer events, and
// the tooltip is what tells a viewer or an offline editor what they are looking at.
const ROUND =
  'grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-hover aria-disabled:cursor-default aria-disabled:opacity-40';
const PILL =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold tabular-nums transition-colors aria-disabled:cursor-default [&:not([aria-disabled=true])]:hover:bg-surface-hover';

/**
 * The recorded route of one journey day in its header (JRN-01).
 *
 * A day that keeps its route shows how far it went, for everyone who can open
 * the journey, with whose recording it is and since when in the tooltip; an
 * editor opens it to check it against Dawarich again, replace it or drop it.
 * A day without one offers an editor whose Dawarich answers to take it over;
 * offline the offer stays, dimmed, and says why.
 */
export default function JourneyDayRecordingButton({
  day,
  canEdit,
  canTakeOver,
  needsConnection,
  onOpen,
}: {
  day: JourneyRecordedDay | undefined;
  canEdit: boolean;
  canTakeOver: boolean;
  needsConnection: boolean;
  onOpen: () => void;
}): React.ReactElement | null {
  const { t, locale } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit) ?? 'metric';

  if (day) {
    const distance = formatDistance(day.stats.distanceMeters / 1000, unit);
    const date = new Date(day.savedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const kept = day.importedBy
      ? t('journey.recording.keptBy', { distance, name: day.importedBy.username, date })
      : t('journey.recording.keptOn', { distance, date });
    const label = day.provisional ? `${kept} ${t('journey.recording.keptRunning')}` : kept;
    return (
      <Tooltip label={label} placement="top">
        <button
          type="button"
          onClick={canEdit ? onOpen : undefined}
          aria-disabled={!canEdit}
          aria-label={label}
          data-testid="journey-day-recording"
          className={PILL}
          style={{ ...fs(10.5), background: 'var(--vg-surf2)', color: 'var(--vg-ink)' }}
        >
          <Route size={12} strokeWidth={2.4} aria-hidden="true" />
          {distance}
          {day.provisional && <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />}
        </button>
      </Tooltip>
    );
  }

  if (!canTakeOver && !needsConnection) return null;
  const label = canTakeOver ? t('journey.recording.takeOver') : t('dawarich.error.offline');
  return (
    <Tooltip label={label} placement="top">
      <button
        type="button"
        onClick={canTakeOver ? onOpen : undefined}
        aria-disabled={!canTakeOver}
        aria-label={label}
        data-testid="journey-day-recording"
        className={ROUND}
        style={{ background: 'var(--vg-surf2)' }}
      >
        <DawarichIcon size={15} />
      </button>
    </Tooltip>
  );
}
