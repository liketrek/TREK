import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { argId } from '../card-values';
import { formatDate, Rows, text } from '../preview-format';
import {
  balanceOf,
  companyIn,
  daysIn,
  inMonths,
  keepKnown,
  knownPeople,
  monthOf,
  peopleOf,
  periodOf,
  tripDatesIn,
} from './vacay-frame';
import { dateArg, yearArg, type VacayLoaded, type VacayStatsLoaded } from './vacay-load';
import type { Fraction, VacayEntryRow } from './vacay-reads';
import { takesBack } from './vacay-undo';
import {
  VACAY_CARD_MAX_HOLIDAYS,
  type AssistantChangeVerbKey,
  type VacayCard,
  type VacayCardProposal,
  type VacayDayKind,
  type VacayProposalNote,
} from '@trek/shared';

/**
 * The change cards of the vacation planner: a day off taken, given back or
 * changed (`toggle_vacay_entry`), a company holiday (`toggle_company_holiday`)
 * and a new allowance (`update_vacay_stats`). A toggle's arguments do not say
 * whether it adds or clears a day, so the card works it out from what is
 * logged, the way the planner's service will: the same size and kind again
 * clears the day, another converts it, a blocked weekend refuses it, and half
 * a company holiday leaves room for half a day only. The card shows the day on
 * its month with the leave before it; the client works out the leave after.
 */

/** A day off as it counts against the allowance: leave by its size, a comp day not at all. */
export function counted(kind: VacayDayKind, fraction: Fraction): number {
  return kind === 'vacation' ? fraction : 0;
}

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function fractionArg(value: unknown): Fraction {
  return value === 0.5 ? 0.5 : 1;
}

/** What a toggle does to a day: the same size and kind clears it, another converts it, a blocked weekend refuses. */
function toggleOutcome(
  inPlan: boolean,
  existing: VacayEntryRow | undefined,
  asked: { fraction: Fraction; kind: 'vacation' | 'comp' },
  blockedDay: boolean,
): VacayCardProposal['outcome'] {
  if (!inPlan) return 'blocked';
  if (existing && existing.fraction === asked.fraction && existing.kind === asked.kind) return 'remove';
  if (blockedDay) return 'blocked';
  return existing ? 'convert' : 'add';
}

/** What the user should know about the day before the toggle is applied. */
function toggleNotes(
  loaded: VacayLoaded,
  date: string,
  facts: { inPlan: boolean; weekend: boolean; counts: boolean; outcome: VacayCardProposal['outcome'] },
): VacayProposalNote[] {
  const { plan } = loaded;
  const company = plan.companyOn ? loaded.company.find((row) => row.date === date) : undefined;
  const notes: VacayProposalNote[] = [];
  if (!facts.inPlan) notes.push('notInPlan');
  else if (facts.weekend && plan.blockWeekends && facts.outcome === 'blocked') notes.push('weekendBlocked');
  if (facts.weekend && !plan.blockWeekends && facts.counts) notes.push('weekend');
  if (loaded.holidays.some((holiday) => holiday.date === date)) notes.push('publicHoliday');
  if (company?.fraction === 1) notes.push('companyHoliday');
  if (company?.fraction === 0.5) notes.push('companyHalf');
  return notes;
}

/** What a toggle of `date` would do, for whom and to which leave year. */
function toggleProposal(viewerId: number, args: ToolArgs, loaded: VacayLoaded, date: string): VacayCardProposal {
  const { plan } = loaded;
  const named = argId(args, 'targetUserId');
  // A target that is no id is refused by the tool's schema: the card says so instead of showing the user's own day.
  const unreadable = named === null && args.targetUserId !== undefined && args.targetUserId !== null;
  const personId = named ?? viewerId;
  const inPlan = !unreadable && plan.people.has(personId);
  const company = plan.companyOn ? loaded.company.find((row) => row.date === date) : undefined;
  const fraction: Fraction = company?.fraction === 0.5 ? 0.5 : fractionArg(args.fraction);
  const kind = args.kind === 'comp' ? 'comp' : 'vacation';
  const existing = loaded.entries.find((entry) => entry.date === date && entry.personId === personId);
  const weekend = plan.weekendDays.includes(weekdayOf(date));
  const outcome = toggleOutcome(inPlan, existing, { fraction, kind }, weekend && plan.blockWeekends);
  const was = existing ? counted(existing.kind, existing.fraction) : 0;
  const will = outcome === 'remove' ? 0 : outcome === 'blocked' ? was : counted(kind, fraction);
  const year = Number(date.slice(0, 4));
  const periodYear = periodOf(
    date,
    loaded.stats.find((row) => row.personId === personId && row.year === year),
  );
  const counts = kind === 'vacation' && (outcome === 'add' || outcome === 'convert');
  return {
    date,
    personId,
    kind,
    fraction,
    outcome,
    before: existing ? { fraction: existing.fraction, kind: existing.kind } : null,
    periodYear,
    notes: toggleNotes(loaded, date, { inPlan, weekend, counts, outcome }),
    deltas: inPlan ? [{ personId, year: periodYear, days: will - was }] : [],
  };
}

/** What a whole company holiday takes off a logged day, and a half one: a whole day becomes half a day. */
function companyDelta(entry: VacayEntryRow, fraction: Fraction): number {
  if (fraction === 1) return -counted(entry.kind, entry.fraction);
  return entry.fraction === 1 ? -counted(entry.kind, 0.5) : 0;
}

/** What a company holiday on `date` would do to the plan and to everyone's leave that day. */
function companyProposal(args: ToolArgs, loaded: VacayLoaded, date: string): VacayCardProposal {
  const fraction: Fraction = args.half === true ? 0.5 : 1;
  const existing = loaded.company.find((row) => row.date === date);
  let outcome: VacayCardProposal['outcome'] = existing ? 'convert' : 'add';
  if (existing?.fraction === fraction) outcome = 'remove';
  const year = Number(date.slice(0, 4));
  const deltas =
    outcome === 'remove'
      ? []
      : loaded.entries.flatMap((entry) => {
          const days = entry.date === date ? companyDelta(entry, fraction) : 0;
          if (days === 0) return [];
          const row = loaded.stats.find((stat) => stat.personId === entry.personId && stat.year === year);
          return [{ personId: entry.personId, year: periodOf(date, row), days }];
        });
  const notes: VacayProposalNote[] = [];
  // The planner refuses a company holiday while they are off, the tool still writes one: the card warns.
  if (!loaded.plan.companyOn) notes.push('companyOff');
  if (loaded.holidays.some((holiday) => holiday.date === date)) notes.push('publicHoliday');
  return {
    date,
    personId: null,
    kind: 'company',
    fraction,
    outcome,
    before: existing ? { fraction: existing.fraction, kind: 'company' } : null,
    periodYear: null,
    notes,
    deltas: deltas.slice(0, 8),
  };
}

/** The month of a held day with what is logged there, the change and the leave before it. */
function dayCard(ctx: PreviewContext, loaded: VacayLoaded, proposal: VacayCardProposal): VacayCard {
  const viewerId = ctx.card.viewerId;
  const months = [monthOf(proposal.date)];
  const days = daysIn(loaded.entries, months, viewerId);
  const touched = proposal.personId === null ? proposal.deltas.map((delta) => delta.personId) : [proposal.personId];
  const known = knownPeople(loaded.plan.people, loaded.entries, loaded.stats);
  const people = peopleOf([viewerId, ...touched, ...days.map((day) => day.personId)], known, viewerId);
  const periods = new Set(proposal.deltas.map((delta) => `${delta.personId}:${delta.year}`));
  const rows = loaded.stats.filter((row) => periods.has(`${row.personId}:${row.year}`));
  const balances = rows.map((row) => balanceOf(row));
  return {
    kind: 'vacay',
    months,
    weekStart: loaded.plan.weekStart,
    weekendDays: loaded.plan.weekendDays,
    people,
    days: keepKnown(days, people),
    company: companyIn(loaded.company, months),
    holidays: loaded.holidays.filter((row) => inMonths(row.date, months)).slice(0, VACAY_CARD_MAX_HOLIDAYS),
    tripDates: tripDatesIn(ctx.card, months),
    proposal,
    balances: keepKnown(balances, people),
    otherDays: 0,
  };
}

/** The verb a toggle's card is labelled with: what it would do to the day. */
const TOGGLE_VERBS = {
  add: 'addVacationDay',
  remove: 'removeVacationDay',
  convert: 'changeVacationDay',
  blocked: 'addVacationDay',
} as const satisfies Record<VacayCardProposal['outcome'], AssistantChangeVerbKey>;

/** A held day's words: its date, in the vacation planner; no rows, the card states the facts. */
function dayDescribed(ctx: PreviewContext, args: ToolArgs): Described {
  const date = dateArg(args);
  return {
    subject: date ? formatDate(ctx, date) : text(args.date),
    rows: new Rows(),
    dayId: null,
    placeIds: [],
    domain: 'vacay',
  };
}

export const VACAY_DESCRIBERS = {
  /** Undoable only when the lookup ran and the toggle would add or convert the day (vacay-undo.ts). */
  toggle_vacay_entry: (ctx: PreviewContext, args: ToolArgs, loaded: VacayLoaded | null): Described => {
    const described = dayDescribed(ctx, args);
    const date = dateArg(args);
    if (!loaded || !date) return { ...described, undoable: false };
    const proposal = toggleProposal(ctx.card.viewerId, args, loaded, date);
    return { ...described, verbKey: TOGGLE_VERBS[proposal.outcome], undoable: takesBack(proposal) };
  },
  toggle_company_holiday: (ctx: PreviewContext, args: ToolArgs): Described => {
    const described = dayDescribed(ctx, args);
    described.rows.add('notes', text(args.note));
    return described;
  },
  update_vacay_stats: (_ctx: PreviewContext, args: ToolArgs): Described => {
    const year = yearArg(args);
    const rows = new Rows().add('quantity', text(args.vacationDays));
    return { subject: year === null ? '' : String(year), rows, dayId: null, placeIds: [], domain: 'vacay' };
  },
};

export const VACAY_CHANGE_CARDS = {
  toggle_vacay_entry: (ctx: PreviewContext, args: ToolArgs, loaded: VacayLoaded | null): VacayCard | null => {
    const date = dateArg(args);
    return loaded && date ? dayCard(ctx, loaded, toggleProposal(ctx.card.viewerId, args, loaded, date)) : null;
  },
  toggle_company_holiday: (ctx: PreviewContext, args: ToolArgs, loaded: VacayLoaded | null): VacayCard | null => {
    const date = dateArg(args);
    return loaded && date ? dayCard(ctx, loaded, companyProposal(args, loaded, date)) : null;
  },
  /** The signed-in user's leave in that year, with the total the new allowance gives. */
  update_vacay_stats: (ctx: PreviewContext, args: ToolArgs, loaded: VacayStatsLoaded | null): VacayCard | null => {
    const year = yearArg(args);
    const allowance = args.vacationDays;
    const row = loaded?.stats.find((stat) => stat.personId === ctx.card.viewerId && stat.year === year);
    if (!row || typeof allowance !== 'number' || !Number.isInteger(allowance) || allowance < 0) return null;
    const known = knownPeople(null, [], [row]);
    return {
      kind: 'vacay',
      months: [],
      weekStart: 1,
      weekendDays: [0, 6],
      people: peopleOf([row.personId], known, ctx.card.viewerId),
      days: [],
      company: [],
      holidays: [],
      tripDates: [],
      proposal: null,
      balances: [balanceOf(row, Math.min(1000, allowance + row.carried))],
      otherDays: 0,
    };
  },
};
