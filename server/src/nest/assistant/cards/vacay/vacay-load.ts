import type { CardReader, ToolArgs } from '../card-types';
import { argId } from '../card-values';
import {
  countryOf,
  entriesOf,
  holidaysOf,
  isoDate,
  planOf,
  statsOf,
  type VacayCompanyRow,
  type VacayEntryRow,
  type VacayHolidayRow,
  type VacayPlanView,
  type VacayStatRow,
} from './vacay-reads';

/**
 * What a held vacation write is described with, read before its card is
 * drawn: the plan (people, colours, weekends, calendars), the days left of
 * the leave year the day falls in, that year's logged days and company
 * holidays, and the public holidays of the plan's first calendar. Vacation
 * days belong to the plan, not to the trip, so nothing of this is on the trip
 * card.
 *
 * A lookup may read four times. The plan and the days left of the day's
 * calendar year come first; a leave year that starts later in the year (a
 * fiscal or a hire-date year) can put the day in the year before, which takes
 * the days left of that year too and leaves no read for the holidays, unless
 * the toggle names a person whose own year holds the day. Who the signed-in
 * user is, the card decides later from the trip card.
 *
 * The logged days come from the signed-in user's own calendar grid, which
 * runs from the first of the month their leave year starts in. The lookup
 * cannot tell which person that is, so it reads the grid year every person
 * agrees on; where their years start in different months and split on the
 * day, the existing entry could be missed, and the lookup gives nothing (the
 * generic card) rather than a card that says "add" where the toggle removes.
 */

export interface VacayLoaded {
  plan: VacayPlanView;
  /** The days left per person, of the day's calendar year and, where it counts there, the year before. */
  stats: VacayStatRow[];
  entries: VacayEntryRow[];
  company: VacayCompanyRow[];
  holidays: VacayHolidayRow[];
}

export interface VacayStatsLoaded {
  stats: VacayStatRow[];
}

/** The day a held vacation write names, when it names a real one. */
export function dateArg(args: ToolArgs): string | null {
  const date = isoDate(args.date);
  return date && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ? date : null;
}

/** A year argument the planner takes. */
export function yearArg(args: ToolArgs): number | null {
  const year = args.year;
  return typeof year === 'number' && Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
}

/** The public holidays of the plan's first calendar in `year`; none while the plan shows none. */
async function holidaysFor(plan: VacayPlanView, year: number, read: CardReader): Promise<VacayHolidayRow[]> {
  const calendar = plan.calendars[0];
  if (!calendar) return [];
  const value = await read('list_holidays', { country: countryOf(calendar.region), year });
  return holidaysOf(value, calendar.region, calendar.color);
}

/**
 * The year whose calendar grid shows `date`: a grid starts on the first of
 * the month a leave year starts in. Null when the people of the plan split on
 * it, since the grid is the signed-in user's and the lookup does not know who
 * that is.
 */
function gridYearOf(date: string, year: number, rows: readonly VacayStatRow[]): number | null {
  const later = rows.filter((row) => date < `${row.windowStart.slice(0, 7)}-01`).length;
  if (later === 0) return year;
  return later === rows.length ? year - 1 : null;
}

/** Everything a card of one day needs; null without a day or a plan (the addon off, no access). */
export async function loadDay(args: ToolArgs, read: CardReader): Promise<VacayLoaded | null> {
  const date = dateArg(args);
  if (!date) return null;
  const plan = planOf(await read('get_vacay_plan'));
  if (!plan) return null;
  const year = Number(date.slice(0, 4));
  const thisYear = statsOf(await read('get_vacay_stats', { year })) ?? [];
  const gridYear = gridYearOf(date, year, thisYear);
  if (gridYear === null) return null;
  // The year before counts where a person's leave year holds the day there; a named person decides it alone.
  const target = thisYear.find((row) => row.personId === argId(args, 'targetUserId'));
  const earlier = target ? date < target.windowStart : thisYear.some((row) => date < row.windowStart);
  const before = earlier ? (statsOf(await read('get_vacay_stats', { year: year - 1 })) ?? []) : [];
  const logged = entriesOf(await read('get_vacay_entries', { year: gridYear }));
  const holidays = earlier ? [] : await holidaysFor(plan, year, read);
  return {
    plan,
    stats: [...thisYear, ...before],
    entries: logged?.entries ?? [],
    company: logged?.company ?? [],
    holidays,
  };
}

/** The days left of the year a new allowance is for. */
export async function loadStats(args: ToolArgs, read: CardReader): Promise<VacayStatsLoaded | null> {
  const year = yearArg(args);
  if (year === null) return null;
  const stats = statsOf(await read('get_vacay_stats', { year }));
  return stats ? { stats } : null;
}
