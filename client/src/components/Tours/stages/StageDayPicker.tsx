import { CalendarCheck2, CalendarDays, CalendarPlus, CalendarX2, ChevronDown, Loader2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useTranslation } from '../../../i18n';
import type { Day } from '../../../types';
import { ContextMenu, useContextMenu } from '../../shared/ContextMenu';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { dayMenuLabel } from '../tourDays';
import type { TourStageDays } from './useTourStageDays';

type MenuItems = Parameters<ReturnType<typeof useContextMenu>['open']>[1];

interface StageDayPickerProps {
  stageKey: string;
  stageNumber: number;
  days: Day[];
  stageDays: TourStageDays;
}

/** The days a stage can go on, the one it is on checked, and a way back to none. */
function dayItems(
  { stageKey, days, stageDays }: StageDayPickerProps,
  label: (day: Day, index: number) => string,
  noDay: string
) {
  const current = stageDays.dayOf(stageKey);
  const items: MenuItems = days.map((day, index) => ({
    label: label(day, index),
    icon: day.id === current ? CalendarCheck2 : CalendarDays,
    disabled: day.id === current || !stageDays.canTake(stageKey, day.id),
    onClick: () => void stageDays.setDay(stageKey, day.id),
  }));
  if (current === null) return items;
  return [
    ...items,
    { divider: true },
    { label: noDay, icon: CalendarX2, onClick: () => void stageDays.setDay(stageKey, null) },
  ];
}

/**
 * MDT-02: the day a stage of a multi-day tour is on, as a pill that opens the
 * trip's days: filled with the day's number where the stage is on one, dashed
 * and quiet where it is on none yet, so a stage without a day stands out in
 * the list. Who may not change the days sees the pill without the menu.
 */
export function StageDayPicker(props: StageDayPickerProps) {
  const { stageKey, stageNumber, days, stageDays } = props;
  const { t, locale } = useTranslation();
  const menu = useContextMenu();
  const dayId = stageDays.dayOf(stageKey);
  const index = dayId === null ? -1 : days.findIndex((day) => day.id === dayId);
  const day = index >= 0 ? days[index] : null;
  const pending = stageDays.isPending(stageKey);
  const interactive = stageDays.canAssign && days.length > 0;
  const tooltip = day ? dayMenuLabel(day, index, t, locale) : t('tours.stages.noDayHint');
  const name = `${t('tours.stages.stage', { number: stageNumber })}: ${tooltip}`;

  const open = (event: MouseEvent<HTMLButtonElement>) => {
    if (!interactive || pending) return;
    if (menu.menu) {
      event.stopPropagation();
      menu.close();
      return;
    }
    menu.open(
      event,
      dayItems(props, (option, at) => dayMenuLabel(option, at, t, locale), t('tours.stages.noDay')),
      true
    );
  };

  const look = day
    ? 'bg-surface-card text-content shadow-sm ring-1 ring-inset ring-edge-faint'
    : 'border border-dashed border-edge text-content-muted';
  const Icon = pending ? Loader2 : day ? CalendarDays : CalendarPlus;
  return (
    <>
      <Tooltip label={tooltip} disabled={!!menu.menu}>
        <button
          type="button"
          data-testid="tour-stage-day"
          data-stage-day={day ? day.id : 'none'}
          aria-label={name}
          aria-haspopup={interactive ? 'menu' : undefined}
          aria-expanded={interactive ? !!menu.menu : undefined}
          aria-disabled={!interactive || undefined}
          onClick={open}
          className={`inline-flex h-[22px] flex-none items-center gap-1 whitespace-nowrap rounded-full pe-1.5 ps-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${look} ${interactive ? 'hover:text-content' : 'cursor-default'}`}
          style={fs(11, 'body')}
        >
          <Icon
            size={11}
            strokeWidth={2.4}
            aria-hidden="true"
            className={`flex-none ${pending ? 'animate-spin' : day ? 'text-accent' : ''}`}
          />
          <span className={day ? 'font-geist tabular-nums' : undefined}>
            {day ? t('dayplan.dayN', { n: index + 1 }) : t('tours.stages.noDay')}
          </span>
          {interactive && (
            <ChevronDown size={11} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-faint" />
          )}
        </button>
      </Tooltip>
      <ContextMenu menu={interactive ? menu.menu : null} onClose={menu.close} />
    </>
  );
}
