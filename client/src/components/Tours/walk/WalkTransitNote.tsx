import { AlertTriangle, Footprints } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatClockTime } from '../../../utils/formatters';
import { fs } from '../../shared/DialogShell';
import { TourNotice } from '../tourParts';
import type { WalkLate, WalkTransitContext } from './walkTransit';

function useIs12h(): boolean {
  return useSettingsStore((state) => state.settings.time_format) === '12h';
}

/**
 * CW-08: what the search between two city walks goes by, above it: when the
 * first walk ends, at the earliest where a time of it is not known, that it
 * ends after midnight, or that the end is not known, and then a time is to be
 * chosen; and when the next one starts.
 */
export function WalkTransitNote({ walk }: { walk: WalkTransitContext | null }) {
  const { t } = useTranslation();
  const is12h = useIs12h();
  if (!walk) return null;
  const params = { walk: walk.fromWalk, time: formatClockTime(walk.ends, is12h) };
  let end = t('tours.walk.transit.ends', params);
  if (walk.endsNextDay) end = t('tours.walk.transit.endsNextDay', params);
  else if (!walk.ends) end = t('tours.walk.transit.endUnknown', params);
  else if (walk.endsAtLeast) end = t('tours.walk.transit.endsAtLeast', params);
  return (
    <TourNotice role="status" icon={<Footprints size={13} strokeWidth={2} />}>
      <div data-testid="transit-walk-end">{end}</div>
      {walk.nextStarts && (
        <div data-testid="transit-walk-next">
          {t('tours.walk.transit.nextStarts', { walk: walk.toWalk, time: formatClockTime(walk.nextStarts, is12h) })}
        </div>
      )}
    </TourNotice>
  );
}

/**
 * CW-08: a connection, or a journey saved before, that arrives after the next
 * walk starts. Said on one line that wraps; nothing is moved or replaced.
 */
export function WalkLateLine({ late }: { late?: WalkLate | null }) {
  const { t } = useTranslation();
  const is12h = useIs12h();
  if (!late) return null;
  return (
    <div
      data-testid="transit-walk-late"
      className="mt-1.5 flex items-start gap-1 text-warning"
      style={fs(11.5, 'body')}
    >
      <AlertTriangle size={12} strokeWidth={2.2} aria-hidden="true" className="mt-[2px] flex-none" />
      <span className="min-w-0 break-words">
        {t('tours.walk.transit.late', { walk: late.walk, time: formatClockTime(late.time, is12h) })}
      </span>
    </div>
  );
}
