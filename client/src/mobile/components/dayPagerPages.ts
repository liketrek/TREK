import type { Day } from '../../types';

/** A day as the pager needs it: only its id, so the plan and Vacay can both page. */
export type PagerItem = Pick<Day, 'id'>;

interface Page {
  key: string;
  dayId: number | null;
  active: boolean;
}

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
  const pages: Page[] = [];
  const prev = days[i - 1];
  const next = days[i + 1];
  if (prev) pages.push({ key: `d${prev.id}`, dayId: prev.id, active: false });
  pages.push({ key: `d${days[i].id}`, dayId: days[i].id, active: true });
  if (next) pages.push({ key: `d${next.id}`, dayId: next.id, active: false });
  return pages;
}
