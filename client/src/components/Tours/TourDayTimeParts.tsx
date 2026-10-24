import type { TourListItem } from '@trek/shared';
import { Clock } from 'lucide-react';
import { isRtlLanguage, useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { Assignment } from '../../types';
import { formatTime } from '../../utils/formatters';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { tourDayTimeOf, type TourDayEntry, type TourDayTime, type TourOverrun } from './tourDayTime';
import { totalText, workedOutEndHint, type Translate } from './tourDayTimeHint';

/**
 * TIME-02: how the day plan says a tour's time on a day, on the desktop and
 * the phone alike; each only places it in its own badge or chip.
 */

/** The words a worked-out end is explained by: when it ends and the total it follows from. */
function workedOutLabel(time: TourDayTime, t: Translate, clock: (value: string) => string): string {
  const params = { time: clock(time.end ?? ''), total: totalText(time) };
  return t(time.nextDay ? 'tours.dayTime.workedOutNextDay' : 'tours.dayTime.workedOut', params);
}

/**
 * TIME-02: a tour's time on its day as the row shows it: the start, then the
 * end. An end worked out from the start and the total is fainter, marked `≈`
 * for an estimate or `≥` where a stay is not known yet, `+1` past midnight,
 * and says in its tooltip how it was worked out. An end typed by hand shows
 * as typed.
 */
export function TourDayTimeText({
  entry,
  tour,
  mobile = false,
}: {
  /** The day entry's times; `tourDayEntryOf` reads them off an assignment. */
  entry: TourDayEntry;
  tour: TourListItem;
  mobile?: boolean;
}) {
  const { t, locale, language } = useTranslation();
  const timeFormat = useSettingsStore((state) => state.settings.time_format) ?? '24h';
  const time = tourDayTimeOf(entry, tour);
  if (!time) return null;
  const clock = (value: string) => formatTime(value, locale, timeFormat);
  // The arrow is not mirrored by the bidi rules: in a right-to-left row the start sits on the right.
  const arrow = isRtlLanguage(language) ? '←' : '→';
  if (!time.end) return <>{clock(time.start)}</>;
  if (!time.workedOut) return <>{`${clock(time.start)} ${arrow} ${clock(time.end)}`}</>;
  const label = workedOutLabel(time, t, clock);
  const mark = time.estimated ? '≈ ' : time.atLeast ? '≥ ' : '';
  return (
    <>
      {`${clock(time.start)} ${arrow} `}
      <Tooltip label={label}>
        <span
          data-testid="tour-day-end-worked-out"
          aria-label={label}
          className={mobile ? 'text-m-faint' : 'text-content-faint'}
        >
          {`${mark}${clock(time.end)}${time.nextDay ? ' +1' : ''}`}
        </span>
      </Tooltip>
    </>
  );
}

/**
 * TIME-02: a tour whose end runs past the start of the next timed item of
 * its day, said on one line that wraps, as a connection that arrives late is
 * (CW-08). Nothing is moved or changed.
 */
export function TourOverrunLine({ overrun }: { overrun: TourOverrun | null | undefined }) {
  const { t, locale } = useTranslation();
  const timeFormat = useSettingsStore((state) => state.settings.time_format) ?? '24h';
  if (!overrun) return null;
  const clock = (value: string) => formatTime(value, locale, timeFormat);
  const said = t('tours.dayTime.overrun', {
    end: clock(overrun.end),
    name: overrun.name || t('tours.dayTime.nextItem'),
    time: clock(overrun.time),
  });
  // A clock, not a warning sign: the plan is not wrong, its times only meet.
  return (
    <p data-testid="tour-day-overrun" className="m-0 mt-1 flex items-start gap-1 text-warning" style={fs(11, 'body')}>
      <Clock size={12} strokeWidth={2.2} aria-hidden="true" className="mt-[2px] flex-none" />
      <span className="min-w-0 break-words">{said}</span>
    </p>
  );
}

/**
 * TIME-02: the hint below the time fields of a tour's day entry, on the
 * desktop form and the phone sheet alike, read while the fields are typed in.
 */
export function TourEndHint({
  start,
  end,
  assignment,
  tour,
  mobile = false,
}: {
  start: string;
  end: string;
  /** The day entry the times are typed for, which says the stage of a multi-day tour it holds. */
  assignment: Pick<Assignment, 'tour_stage_key'> | undefined;
  tour: TourListItem | null | undefined;
  mobile?: boolean;
}) {
  const { t, locale } = useTranslation();
  const timeFormat = useSettingsStore((state) => state.settings.time_format) ?? '24h';
  const entry = { start, end, stageKey: assignment?.tour_stage_key ?? null };
  const hint = workedOutEndHint(entry, tour, t, (value) => formatTime(value, locale, timeFormat));
  if (!hint) return null;
  return (
    <p
      data-testid="tour-day-end-hint"
      className={`m-0 ${mobile ? 'mt-[5px] font-geist text-m-faint' : 'text-content-muted'}`}
      style={fs(11, 'body')}
    >
      {hint}
    </p>
  );
}
