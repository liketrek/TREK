import type { TripCard } from '../../assistant-context';
import type { VacayEntryRow, VacayPerson, VacayStatRow } from './vacay-reads';
import {
  VACAY_CARD_MAX_DATES,
  VACAY_CARD_MAX_DAYS,
  type VacayCard,
  type VacayCardBalance,
  type VacayCardDay,
  type VacayCardPerson,
} from '@trek/shared';

/**
 * The calendar part every vacation card shares: which months it shows, the
 * days of the trip and the logged days inside them, and the people those
 * days belong to, the signed-in user first.
 */

export type CardMonth = VacayCard['months'][number];

const MAX_PEOPLE = 8;

/** "2026-10" for a date or a month. */
export function monthKey(value: string | CardMonth): string {
  return typeof value === 'string' ? value.slice(0, 7) : `${value.year}-${String(value.month).padStart(2, '0')}`;
}

export function monthOf(date: string): CardMonth {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

export function inMonths(date: string, months: readonly CardMonth[]): boolean {
  const key = monthKey(date);
  return months.some((month) => monthKey(month) === key);
}

/** The dated days of the trip, from its days or else its first and last date (a year of them at most). */
function tripDatesOf(card: TripCard): string[] {
  const dated = card.days.flatMap((day) => (day.date ? [day.date] : []));
  if (dated.length > 0) return [...new Set(dated)].sort((a, b) => a.localeCompare(b));
  if (!card.startDate || !card.endDate || card.startDate > card.endDate) return [];
  const dates: string[] = [];
  const day = new Date(`${card.startDate}T00:00:00Z`);
  while (dates.length < 366) {
    const iso = day.toISOString().slice(0, 10);
    if (iso > card.endDate) break;
    dates.push(iso);
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return dates;
}

/** The dated days of the trip inside `months`, as many as a card holds. */
export function tripDatesIn(card: TripCard, months: readonly CardMonth[]): string[] {
  return tripDatesOf(card)
    .filter((date) => inMonths(date, months))
    .slice(0, VACAY_CARD_MAX_DATES);
}

/** The company holidays inside `months`, each date once. */
export function companyIn<T extends { date: string }>(rows: readonly T[], months: readonly CardMonth[]): T[] {
  const inside = rows.filter((row) => inMonths(row.date, months));
  return [...new Map(inside.map((row) => [row.date, row])).values()].slice(0, VACAY_CARD_MAX_DATES);
}

/** The trip's months in order, at most `max`. */
export function tripMonthsOf(card: TripCard, max = 3): CardMonth[] {
  const keys = [...new Set(tripDatesOf(card).map(monthKey))].slice(0, max);
  return keys.map((key) => monthOf(`${key}-01`));
}

/** A logged day as a card holds it. */
function cardDay(entry: VacayEntryRow): VacayCardDay {
  return { date: entry.date, personId: entry.personId, fraction: entry.fraction, kind: entry.kind };
}

/** The logged days inside `months`, the signed-in user's first when there are more than a card holds. */
export function daysIn(
  entries: readonly VacayEntryRow[],
  months: readonly CardMonth[],
  viewerId: number,
): VacayCardDay[] {
  const inside = entries.filter((entry) => inMonths(entry.date, months));
  const ranked = [...inside].sort(
    (a, b) => Number(b.personId === viewerId) - Number(a.personId === viewerId) || a.date.localeCompare(b.date),
  );
  return ranked
    .slice(0, VACAY_CARD_MAX_DAYS)
    .map(cardDay)
    .sort((a, b) => a.date.localeCompare(b.date) || a.personId - b.personId);
}

/**
 * The people a card names, by id: the signed-in user first, then in the
 * order they come up. A person no source names is left out, and `keepKnown`
 * leaves out their days and balances too.
 */
export function peopleOf(
  ids: readonly number[],
  known: ReadonlyMap<number, VacayPerson>,
  viewerId: number,
): VacayCardPerson[] {
  const order = [...new Set(ids)].sort((a, b) => Number(b === viewerId) - Number(a === viewerId));
  return order
    .flatMap((id) => {
      const person = known.get(id);
      return person ? [{ id, name: person.name, avatarKey: null, color: person.color }] : [];
    })
    .slice(0, MAX_PEOPLE);
}

/** Only the rows of the people a card names. */
export function keepKnown<T extends { personId: number }>(rows: readonly T[], people: readonly VacayCardPerson[]): T[] {
  const ids = new Set(people.map((person) => person.id));
  return rows.filter((row) => ids.has(row.personId));
}

/** The people every source names, the plan's own names first. */
export function knownPeople(
  plan: ReadonlyMap<number, VacayPerson> | null,
  entries: readonly VacayEntryRow[],
  stats: readonly VacayStatRow[],
): Map<number, VacayPerson> {
  const known = new Map<number, VacayPerson>();
  for (const row of [...entries, ...stats]) {
    if (row.person && !known.has(row.personId)) known.set(row.personId, row.person);
  }
  for (const [id, person] of plan ?? []) known.set(id, person);
  return known;
}

/** A person's leave in a year as a card shows it. */
export function balanceOf(row: VacayStatRow, totalAfter: number | null = null): VacayCardBalance {
  return {
    personId: row.personId,
    year: row.year,
    total: row.total,
    carried: Math.min(row.carried, row.total),
    used: row.used,
    comp: row.comp,
    totalAfter,
    windowStart: row.windowStart,
    windowEnd: row.windowEnd,
  };
}

/** The leave year a date counts in for a person, from their row of the date's calendar year. */
export function periodOf(date: string, row: VacayStatRow | undefined): number {
  const year = Number(date.slice(0, 4));
  if (!row) return year;
  if (date < row.windowStart) return row.year - 1;
  return date >= row.windowEnd ? row.year + 1 : row.year;
}
