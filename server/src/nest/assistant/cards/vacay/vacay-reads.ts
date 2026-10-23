import { clipped, finite, hexOrNull, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';

/**
 * The vacation planner's tools as its cards read them: the plan
 * (`get_vacay_plan`), the logged days of a year (`get_vacay_entries`), the
 * days left (`get_vacay_stats`) and a country's public holidays
 * (`list_holidays`). Every reader takes the tool's raw answer, trusts no
 * shape and leaves out what does not parse; names are masked like a provider
 * answer, so an e-mail address used as a user name never reaches a card.
 */

export type Fraction = 0.5 | 1;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDate(value: unknown): string | null {
  return typeof value === 'string' && DATE.test(value) ? value : null;
}

/** A stored fraction as the planner counts it: below a whole day is half a day. */
function fractionOf(value: unknown): Fraction {
  const fraction = finite(value);
  return fraction !== null && fraction < 1 ? 0.5 : 1;
}

function idOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

export interface VacayPerson {
  name: string;
  color: string | null;
}

export interface VacayPlanView {
  weekStart: 0 | 1;
  weekendDays: number[];
  blockWeekends: boolean;
  companyOn: boolean;
  people: ReadonlyMap<number, VacayPerson>;
  /** The public-holiday calendars, while the plan shows public holidays. */
  calendars: ReadonlyArray<{ region: string; color: string | null }>;
}

export interface VacayEntryRow {
  date: string;
  personId: number;
  fraction: Fraction;
  kind: 'vacation' | 'comp';
  person: VacayPerson | null;
}

export interface VacayCompanyRow {
  date: string;
  fraction: Fraction;
}

export interface VacayStatRow {
  personId: number;
  year: number;
  total: number;
  used: number;
  comp: number;
  carried: number;
  windowStart: string;
  windowEnd: string;
  person: VacayPerson | null;
}

export interface VacayHolidayRow {
  date: string;
  name: string;
  color: string | null;
}

function personOf(name: unknown, color: unknown): VacayPerson | null {
  const shown = clipped(name, 80);
  return shown ? { name: shown, color: hexOrNull(color) } : null;
}

/**
 * "0,6" as the weekdays it names. Only a missing or empty value is the
 * planner's Saturday and Sunday (`isBlockedWeekend` reads it so); a value
 * naming no real weekday is no weekend at all, there as here.
 */
function weekendOf(value: unknown): number[] {
  if (typeof value !== 'string' || value === '') return [0, 6];
  const days = value
    .split(',')
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return [...new Set(days)].slice(0, 7);
}

/** The plan as `get_vacay_plan` answers it (`{ plan: { plan, users } }`); null for anything else. */
export function planOf(value: unknown): VacayPlanView | null {
  const data = recordOf(recordOf(value).plan);
  const plan = recordOf(data.plan);
  if (!Array.isArray(data.users) || Object.keys(plan).length === 0) return null;
  const people = new Map<number, VacayPerson>();
  for (const user of rowsOf(data.users)) {
    const id = idOf(user.id);
    const person = personOf(user.username, user.color);
    if (id !== null && person) people.set(id, person);
  }
  const holidaysOn = plan.holidays_enabled === true || plan.holidays_enabled === 1;
  const calendars = holidaysOn
    ? rowsOf(plan.holiday_calendars)
        .filter((calendar) => (calendar.type ?? 'public_holiday') === 'public_holiday')
        .flatMap((calendar) =>
          typeof calendar.region === 'string' && calendar.region.trim() !== ''
            ? [{ region: calendar.region.trim(), color: hexOrNull(calendar.color) }]
            : [],
        )
    : [];
  return {
    weekStart: plan.week_start === 0 ? 0 : 1,
    weekendDays: weekendOf(plan.weekend_days),
    blockWeekends: plan.block_weekends === true || plan.block_weekends === 1,
    companyOn: plan.company_holidays_enabled === true || plan.company_holidays_enabled === 1,
    people,
    calendars,
  };
}

/** The logged days and company holidays as `get_vacay_entries` answers them (`{ entries: { entries, ... } }`). */
export function entriesOf(value: unknown): { entries: VacayEntryRow[]; company: VacayCompanyRow[] } | null {
  const data = recordOf(recordOf(value).entries);
  if (!Array.isArray(data.entries)) return null;
  const entries = rowsOf(data.entries).flatMap((row): VacayEntryRow[] => {
    const date = isoDate(row.date);
    const personId = idOf(row.user_id);
    if (!date || personId === null) return [];
    return [
      {
        date,
        personId,
        fraction: fractionOf(row.fraction),
        kind: row.kind === 'comp' ? 'comp' : 'vacation',
        person: personOf(row.person_name, row.person_color),
      },
    ];
  });
  const company = rowsOf(data.companyHolidays).flatMap((row): VacayCompanyRow[] => {
    const date = isoDate(row.date);
    return date ? [{ date, fraction: fractionOf(row.fraction) }] : [];
  });
  return { entries, company };
}

function days(value: unknown): number {
  const count = finite(value);
  return count === null ? 0 : Math.min(1000, Math.max(0, count));
}

/** The days left per person as `get_vacay_stats` answers them (`{ stats: [...] }`). */
export function statsOf(value: unknown): VacayStatRow[] | null {
  const rows = recordOf(value).stats;
  if (!Array.isArray(rows)) return null;
  return rowsOf(rows).flatMap((row: Row): VacayStatRow[] => {
    const personId = idOf(row.user_id);
    const year = finite(row.year);
    const windowStart = isoDate(row.window_start);
    const windowEnd = isoDate(row.window_end);
    if (personId === null || year === null || !windowStart || !windowEnd) return [];
    return [
      {
        personId,
        year,
        total: days(row.total_available),
        used: days(row.used),
        comp: days(row.comp_used),
        carried: days(row.carried_over),
        windowStart,
        windowEnd,
        person: personOf(row.person_name, row.person_color),
      },
    ];
  });
}

/**
 * A country's public holidays as `list_holidays` answers them (nager.at
 * rows), narrowed to `region` the way the planner clears them: a holiday of
 * the whole country, or one of the region's own. A country that splits its
 * holidays by region gives nothing for a calendar without one.
 */
export function holidaysOf(value: unknown, region: string | null, color: string | null): VacayHolidayRow[] {
  const rows = rowsOf(recordOf(value).holidays);
  const regional = rows.some((row) => Array.isArray(row.counties) && row.counties.length > 0);
  const subdivision = region && region.includes('-') ? region : null;
  if (regional && region !== null && !subdivision) return [];
  return rows.flatMap((row): VacayHolidayRow[] => {
    const date = isoDate(row.date);
    const name = clipped(row.localName, 80) ?? clipped(row.name, 80);
    const counties = Array.isArray(row.counties) ? row.counties : null;
    const applies = row.global === true || !counties || (subdivision !== null && counties.includes(subdivision));
    return date && name && applies ? [{ date, name, color }] : [];
  });
}

/** The country a calendar region names: "DE-BY" is Germany. */
export function countryOf(region: string): string {
  return (region.split('-')[0] ?? region).toUpperCase();
}
