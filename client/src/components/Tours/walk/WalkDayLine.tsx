import { Check, ChevronDown, Clock } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatClockTime } from '../../../utils/formatters';
import { ContextMenu, useContextMenu } from '../../shared/ContextMenu';
import { fs } from '../../shared/DialogShell';
import { dayMenuLabel } from '../tourDays';
import { TourNotice } from '../tourParts';
import type { WalkDayChoice, WalkDayOption } from './useWalkDay';
import type { WalkSchedule, WalkScheduleState } from './walkSchedule';

type Translate = ReturnType<typeof useTranslation>['t'];

const PILL =
  'inline-flex min-w-0 items-center gap-1 rounded-full bg-surface-card px-2 py-0.5 text-start font-medium text-content-secondary shadow-sm';

/** "Day 2, Tue, Jul 8, start 09:00", or that it has no start time; `day` names the day with its date. */
function optionLabel(option: WalkDayOption, day: string, t: Translate, is12h: boolean): string {
  return option.start
    ? t('tours.walk.day.start', { day, time: formatClockTime(option.start, is12h) })
    : t('tours.walk.day.noStart', { day });
}

/** What keeps the arrivals from being worked out, said once; a route still being planned says so elsewhere. */
function missingNote(state: WalkScheduleState, choice: WalkDayChoice, stationCount: number, t: Translate) {
  if (state === 'noDay') return !choice.fixed && stationCount >= 2 ? t('tours.walk.hours.noDay') : null;
  if (state === 'noDate') return t('tours.walk.hours.noDate');
  if (state === 'noStart') return t('tours.walk.hours.noStart');
  return null;
}

/**
 * The day as a pill: a menu of the walk's days where there is a choice, its name alone where there is none.
 * It names the day with its date as the menu does, so the opening hours below read for a day that is in view.
 */
function DayPill({ choice, day }: { choice: WalkDayChoice; day: WalkDayOption }) {
  const { t, locale } = useTranslation();
  const is12h = useSettingsStore((state) => state.settings.time_format) === '12h';
  const menu = useContextMenu();
  const label = optionLabel(day, dayMenuLabel(day.day, day.index, t, locale), t, is12h);
  if (choice.fixed || choice.options.length < 2) {
    return (
      <span data-testid="walk-day" className={`${PILL} break-words`} style={fs(11, 'body')}>
        {label}
      </span>
    );
  }
  const items = choice.options.map((option) => ({
    label: optionLabel(option, dayMenuLabel(option.day, option.index, t, locale), t, is12h),
    icon: option === day ? Check : undefined,
    onClick: () => choice.choose(option.day.id),
  }));
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (menu.menu) {
      event.stopPropagation();
      menu.close();
    } else menu.open(event, items, true);
  };
  return (
    <>
      <button
        type="button"
        data-testid="walk-day-picker"
        aria-haspopup="menu"
        aria-expanded={!!menu.menu}
        onClick={toggle}
        className={`${PILL} transition-colors hover:text-content`}
        style={fs(11, 'body')}
      >
        <span className="min-w-0 break-words">{label}</span>
        <ChevronDown size={12} strokeWidth={2.2} className="flex-none" aria-hidden="true" />
      </button>
      <ContextMenu menu={menu.menu} onClose={menu.close} />
    </>
  );
}

/**
 * CW-02, CW-04: the day a city walk's arrivals and opening hours are worked
 * out for, above its stations, in the planner and in the walk's detail alike;
 * what is missing for them; and, once there are hours to go by, where they
 * come from and that they are a hint to check.
 */
export function WalkDayLine({
  enabled = true,
  choice,
  schedule,
  stationCount,
  className = '',
}: {
  /** Only a city walk has the line. */
  enabled?: boolean;
  choice: WalkDayChoice;
  schedule: WalkSchedule;
  stationCount: number;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!enabled) return null;
  const note = missingNote(schedule.state, choice, stationCount, t);
  if (!choice.day && !note) return null;
  return (
    <div data-testid="walk-day-line" className={`flex flex-col gap-1.5 ${className}`}>
      {choice.day && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-content-faint" style={fs(11, 'body')}>
            {t('tours.walk.day.label')}
          </span>
          <DayPill choice={choice} day={choice.day} />
        </div>
      )}
      {note && (
        <p className="m-0 text-content-faint" style={fs(11, 'body')}>
          {note}
        </p>
      )}
      {schedule.state === 'ready' && schedule.anyHours && (
        <TourNotice icon={<Clock size={13} strokeWidth={2} />}>{t('tours.walk.hours.source')}</TourNotice>
      )}
    </div>
  );
}
