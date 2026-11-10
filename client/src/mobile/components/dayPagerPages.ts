import type { Day } from '../../types';

/** A day as the pager needs it: only its id, so the plan and Vacay can both page. */
export type PagerItem = Pick<Day, 'id'>;

interface Page {
  key: string;
  dayId: number | null;
  active: boolean;
  /** Drawn with its content; the pages further out are empty paper of the same width. */
  near: boolean;
}

/** Pages drawn with their content either side of the selection. */
const REACH = 2;

/**
 * A page for every day, so quick swipes in a row never run into the end of the
 * strip before the first has settled (they used to spring back after two days).
 * Only the selection and REACH days either side draw their content. A selection
 * that points at no day (the whole-trip view, or a day deleted remotely) still
 * gets its page, with the first day next to it as a way back.
 */
export function pagesFor(days: PagerItem[], selectedDayId: number | null): Page[] {
  const i = days.findIndex((d) => d.id === selectedDayId);
  if (i < 0) {
    const first = days[0];
    return [
      { key: 'none', dayId: selectedDayId, active: true, near: true },
      ...(first ? [{ key: `d${first.id}`, dayId: first.id, active: false, near: true }] : []),
    ];
  }
  return days.map((d, j) => ({ key: `d${d.id}`, dayId: d.id, active: j === i, near: Math.abs(j - i) <= REACH }));
}
