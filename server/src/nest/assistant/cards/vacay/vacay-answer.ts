import type { AnswerInput } from '../card-types';
import {
  balanceOf,
  companyIn,
  daysIn,
  inMonths,
  keepKnown,
  knownPeople,
  monthKey,
  monthOf,
  peopleOf,
  tripDatesIn,
  tripMonthsOf,
  type CardMonth,
} from './vacay-frame';
import { yearArg } from './vacay-load';
import { entriesOf, holidaysOf, statsOf, type VacayEntryRow } from './vacay-reads';
import { VACAY_CARD_MAX_HOLIDAYS, type VacayCard } from '@trek/shared';

/**
 * The answer cards of the vacation planner's reads: the days off of a year on
 * a few months of calendar (`get_vacay_entries`), the days left per person
 * (`get_vacay_stats`) and a country's public holidays (`list_holidays`). An
 * answer card has the read's own answer and the trip card, nothing else, so
 * it draws the planner's usual week (Monday first, Saturday and Sunday off).
 */

const MAX_MONTHS = 3;

/** An answer card with nothing on it yet. */
function emptyCard(): VacayCard {
  return {
    kind: 'vacay',
    months: [],
    weekStart: 1,
    weekendDays: [0, 6],
    people: [],
    days: [],
    company: [],
    holidays: [],
    tripDates: [],
    proposal: null,
    balances: [],
    otherDays: 0,
  };
}

/** The distinct months of `dates` in order, at most `max`. */
function monthsOfDates(dates: readonly string[], max: number): CardMonth[] {
  const keys = [...new Set([...dates].sort((a, b) => a.localeCompare(b)).map(monthKey))].slice(0, max);
  return keys.map((key) => monthOf(`${key}-01`));
}

/**
 * The months a year's days off are shown on: the trip's months inside the
 * year, else the coming months the signed-in user is off in, else this month
 * when it lies in the year, else the year's first month. The year is taken
 * from January to December, widened to the months the answer holds days of.
 */
function focusMonths(input: AnswerInput, entries: readonly VacayEntryRow[], year: number): CardMonth[] {
  const span = [`${year}-01`, `${year}-12`, ...entries.map((entry) => monthKey(entry.date))].sort((a, b) =>
    a.localeCompare(b),
  );
  const first = span[0] ?? `${year}-01`;
  const last = span[span.length - 1] ?? `${year}-12`;
  const inside = (key: string) => key >= first && key <= last;
  const trip = tripMonthsOf(input.card, 12).filter((month) => inside(monthKey(month)));
  if (trip.length > 0) return trip.slice(0, MAX_MONTHS);
  const coming = entries
    .filter((entry) => entry.personId === input.card.viewerId && entry.date >= input.today)
    .map((entry) => entry.date);
  if (coming.length > 0) return monthsOfDates(coming, MAX_MONTHS);
  if (inside(monthKey(input.today))) return [monthOf(input.today)];
  return [monthOf(`${first}-01`)];
}

export const VACAY_ANSWER_CARDS = {
  get_vacay_entries: (input: AnswerInput): VacayCard | null => {
    const logged = entriesOf(input.value);
    if (!logged) return null;
    const viewerId = input.card.viewerId;
    const year = yearArg(input.args);
    const months = focusMonths(input, logged.entries, year ?? Number(input.today.slice(0, 4)));
    const days = daysIn(logged.entries, months, viewerId);
    const people = peopleOf(
      [viewerId, ...days.map((day) => day.personId)],
      knownPeople(null, logged.entries, []),
      viewerId,
    );
    const otherDays = logged.entries
      .filter((entry) => entry.personId === viewerId && entry.kind === 'vacation' && !inMonths(entry.date, months))
      .reduce((sum, entry) => sum + entry.fraction, 0);
    return {
      ...emptyCard(),
      months,
      people,
      days: keepKnown(days, people),
      company: companyIn(logged.company, months),
      tripDates: tripDatesIn(input.card, months),
      otherDays: Math.min(1000, otherDays),
      // The leave year asked for, which Vacay opens on: a leave year from April holds a February trip of the next.
      ...(year === null ? {} : { year }),
    };
  },
  get_vacay_stats: (input: AnswerInput): VacayCard | null => {
    const stats = statsOf(input.value);
    if (!stats || stats.length === 0) return null;
    const viewerId = input.card.viewerId;
    const people = peopleOf(
      stats.map((row) => row.personId),
      knownPeople(null, [], stats),
      viewerId,
    );
    const order = new Map(people.map((person, index) => [person.id, index]));
    const balances = keepKnown(stats, people)
      .sort((a, b) => (order.get(a.personId) ?? 0) - (order.get(b.personId) ?? 0))
      .map((row) => balanceOf(row));
    return { ...emptyCard(), people, balances };
  },
  list_holidays: (input: AnswerInput): VacayCard | null => {
    const holidays = holidaysOf(input.value, null, null);
    if (holidays.length === 0) return null;
    const dates = holidays.map((holiday) => holiday.date);
    const trip = tripMonthsOf(input.card).filter((month) => dates.some((date) => inMonths(date, [month])));
    const coming = dates.filter((date) => date >= input.today);
    const months = trip.length > 0 ? trip : monthsOfDates(coming.length > 0 ? coming : dates, 2);
    return {
      ...emptyCard(),
      months,
      holidays: holidays.filter((holiday) => inMonths(holiday.date, months)).slice(0, VACAY_CARD_MAX_HOLIDAYS),
      tripDates: tripDatesIn(input.card, months),
    };
  },
};
