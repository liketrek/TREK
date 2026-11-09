import type { Day } from '../../types';

/** A day as the pager needs it: only its id, so the plan and Vacay can both page. */
export type PagerItem = Pick<Day, 'id'>;

interface Page {
  key: string;
  dayId: number | null;
  active: boolean;
}

/**
 * Pages kept either side of the selection. Two, not one: a second swipe that
 * starts while the first is still snapping has to find a page beyond the
 * neighbour, or it runs into the end of the strip and springs back instead of
 * reaching the day after.
 */
const REACH = 2;

/** The window of pages around the selection. A selection that points at no
 *  day (the whole-trip view, or a day deleted remotely) still gets its page,
 *  with the first day next to it as a way back. */
export function pagesFor(days: PagerItem[], selectedDayId: number | null): Page[] {
  const i = days.findIndex((d) => d.id === selectedDayId);
  if (i < 0) {
    const first = days[0];
    return [
      { key: 'none', dayId: selectedDayId, active: true },
      ...(first ? [{ key: `d${first.id}`, dayId: first.id, active: false }] : []),
    ];
  }
  return days
    .slice(Math.max(0, i - REACH), i + REACH + 1)
    .map((d) => ({ key: `d${d.id}`, dayId: d.id, active: d.id === days[i].id }));
}
