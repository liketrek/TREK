import { clockOf, type HoursSource, type HoursWindow, type StationFit } from '@trek/shared';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatClockTime } from '../../../utils/formatters';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { StationSchedule, WalkSchedule } from './walkSchedule';

type Translate = ReturnType<typeof useTranslation>['t'];

/** Where a station's hours come from, named on the pill, with how far to trust them behind it. */
const SOURCES: Record<HoursSource, { labelKey: string; hintKey: string }> = {
  osm: { labelKey: 'tours.walk.hours.sourceOsm', hintKey: 'tours.walk.hours.sourceOsmHint' },
  place: { labelKey: 'tours.walk.hours.sourcePlace', hintKey: 'tours.walk.hours.sourcePlaceHint' },
};

interface ClockFormat {
  /** A time of the day in the user's 12 or 24 hours. */
  at: (minutes: number) => string;
  /** The end of a window: one running to midnight reads 24:00 in 24 hours. */
  end: (minutes: number) => string;
}

function useClock(): ClockFormat {
  const is12h = useSettingsStore((state) => state.settings.time_format) === '12h';
  const at = (minutes: number) => formatClockTime(clockOf(minutes), is12h);
  return { at, end: (minutes) => (minutes >= 24 * 60 && !is12h ? '24:00' : at(minutes)) };
}

function windowsText(windows: readonly HoursWindow[], clock: ClockFormat, t: Translate): string {
  return windows
    .map(([from, to]) => t('tours.walk.hours.window', { from: clock.at(from), to: clock.end(to) }))
    .join(', ');
}

/** The arrival, and the end of the stay where it lasts; the next day said as such. */
function arrivalText(schedule: StationSchedule, clock: ClockFormat, t: Translate): string {
  const arrival = clock.at(schedule.arrival);
  if (schedule.fit.kind === 'nextDay') return t('tours.walk.arrivalNextDay', { time: arrival });
  const leave = schedule.leave ?? schedule.arrival;
  if (leave > schedule.arrival) {
    return t(schedule.atLeast ? 'tours.walk.arrivalStayAtLeast' : 'tours.walk.arrivalStay', {
      arrival,
      leave: clock.at(leave),
    });
  }
  return t(schedule.atLeast ? 'tours.walk.arrivalAtLeast' : 'tours.walk.arrival', { time: arrival });
}

type Conflict = Extract<StationFit, { kind: 'closes' | 'closed' | 'closedAllDay' }>;

/** A conflict in one sentence: the station, the arrival, the end of the stay and the window it was checked against. */
function conflictText(
  fit: Conflict,
  schedule: StationSchedule,
  name: string,
  clock: ClockFormat,
  t: Translate
): string {
  const arrival = clock.at(schedule.arrival);
  const leave = schedule.leave ?? schedule.arrival;
  if (fit.kind === 'closedAllDay') return t('tours.walk.hours.closedAllDay', { name });
  if (fit.kind === 'closes') {
    return t('tours.walk.hours.closes', {
      name,
      closes: clock.end(fit.window[1]),
      arrival,
      leave: clock.at(leave),
      window: windowsText([fit.window], clock, t),
    });
  }
  const open = windowsText(fit.windows, clock, t);
  return leave > schedule.arrival
    ? t('tours.walk.hours.closed', { name, arrival, leave: clock.at(leave), window: open })
    : t('tours.walk.hours.closedNoStay', { name, arrival, window: open });
}

function SourcePill({ source }: { source: HoursSource }) {
  const { t } = useTranslation();
  const { labelKey, hintKey } = SOURCES[source];
  return (
    <Tooltip label={t(hintKey)}>
      <span className="inline-flex" data-testid="walk-hours-source">
        <SoftPill>{t(labelKey)}</SoftPill>
        <span className="sr-only">{t(hintKey)}</span>
      </span>
    </Tooltip>
  );
}

/** What the hours say: a conflict in the warning tone, otherwise a quiet line; nothing where none are known. */
function FitLine({ schedule, name, clock }: { schedule: StationSchedule; name: string; clock: ClockFormat }) {
  const { t } = useTranslation();
  const { fit } = schedule;
  if (fit.kind === 'unknown' || fit.kind === 'nextDay') return null;
  if (fit.kind === 'unread') {
    return (
      <span className="break-words text-content-faint" style={fs(10.5, 'body')}>
        {t('tours.walk.hours.unread', { text: fit.text })}
      </span>
    );
  }
  if (fit.kind === 'open' || fit.kind === 'uncertain') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1 text-content-faint" style={fs(10.5, 'body')}>
        {fit.kind === 'open'
          ? t('tours.walk.hours.open', { window: windowsText([fit.window], clock, t) })
          : t('tours.walk.hours.uncertain')}
        <SourcePill source={fit.source} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex flex-wrap items-start gap-1 text-warning"
      style={fs(11, 'body')}
      data-testid="walk-station-conflict"
    >
      <AlertTriangle size={11} strokeWidth={2.2} className="mt-0.5 flex-none" aria-hidden="true" />
      <span className="min-w-0 flex-1 break-words">{conflictText(fit, schedule, name, clock, t)}</span>
      <SourcePill source={fit.source} />
    </span>
  );
}

/**
 * CW-04: a station on the day looked at: its expected arrival, the end of its
 * stay, and what its opening hours say, with where they come from. The same
 * lines in the planner and in the walk's detail; nothing is changed by them.
 */
export function StationScheduleLine({ schedule, name }: { schedule: StationSchedule | undefined; name: string }) {
  const { t } = useTranslation();
  const clock = useClock();
  if (!schedule) return null;
  return (
    <span className="flex flex-col gap-0.5" data-testid="walk-station-hours">
      <span className="inline-flex items-start gap-1 text-content-muted" style={fs(11, 'body')}>
        <Clock size={11} strokeWidth={2.2} className="mt-0.5 flex-none" aria-hidden="true" />
        <span className="min-w-0 break-words">{arrivalText(schedule, clock, t)}</span>
      </span>
      <FitLine schedule={schedule} name={name} clock={clock} />
    </span>
  );
}

/**
 * The station's lines under its row in the planner, beside its select button
 * and aligned with its name; nothing for a point that is no station.
 */
export function StationScheduleRow({
  schedule,
  point,
  placeName,
  number,
}: {
  schedule: WalkSchedule;
  point: Pick<TourPlannerWaypoint, 'id' | 'name'>;
  /** The name the row shows for a point without its own: the trip place it stands for, else the place found there. */
  placeName: string | undefined;
  /** The stop's number, for a station without any name. */
  number: number;
}) {
  const { t } = useTranslation();
  const at = schedule.byStation.get(point.id);
  if (!at) return null;
  return (
    <div className="pb-1 pe-1.5 ps-[66px]" data-testid="walk-station-schedule">
      <StationScheduleLine
        schedule={at}
        name={point.name ?? placeName ?? t('tours.walk.stationNumbered', { number })}
      />
    </div>
  );
}
