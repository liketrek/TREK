import { useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import type { ChangeItem } from './assistantParts';
import { useAssistantView } from './assistantViewContext';

/** The day a waiting change lands on: where its effect puts it, else the day its card names. */
function dayOf(item: ChangeItem): number | null {
  return item.preview?.effect?.dayId ?? item.preview?.dayId ?? null;
}

export interface WeekDay {
  id: number;
  n: number;
  weekday: string | null;
  ids: string[];
}

/** A plan this wide reads as a week: the overview shows from three days on. */
const WEEK_FROM_DAYS = 3;

/**
 * The days a card's waiting changes land on, in trip order, each with its
 * changes; empty for a plan narrower than a week view.
 */
export function useWeekDays(pending: readonly ChangeItem[]): WeekDay[] {
  const { locale } = useTranslation();
  const { tripId } = useAssistantView();
  const days = useTripStore((s) => (s.trip?.id === tripId ? s.days : null));
  return useMemo(() => {
    if (!days) return [];
    const byDay = new Map<number, string[]>();
    for (const item of pending) {
      const id = dayOf(item);
      if (id !== null) byDay.set(id, [...(byDay.get(id) ?? []), item.toolCallId]);
    }
    if (byDay.size < WEEK_FROM_DAYS) return [];
    const weekdayOf = (date: string | null | undefined) =>
      date && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
        : null;
    return days.flatMap((day, index) => {
      const ids = byDay.get(day.id);
      return ids ? [{ id: day.id, n: index + 1, weekday: weekdayOf(day.date), ids }] : [];
    });
  }, [days, pending, locale]);
}
